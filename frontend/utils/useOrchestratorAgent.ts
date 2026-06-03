import { useState, useCallback, useRef, useEffect } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { File as ExpoFile } from "expo-file-system";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import { supabase } from "../lib/supabase";
import { useSplitStore, Contact, ReceiptItem } from "../stores/splitStore";

const TRANSCRIBE_TIMEOUT_MS = 12_000;
const ORCHESTRATOR_TIMEOUT_MS = 15_000;
const CONTACT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Module-level cache - persists across hook instances for the app session
type ContactCacheEntry = {
  contacts: { id: string; name: string; phoneNumber?: string }[];
  loadedAt: number;
};
let _contactCache: ContactCacheEntry | null = null;

type OrchestratorResult = {
  selected_contact_ids?: string[];
  assignments?: { contact_id: string; item_ids: string[] }[];
  user_item_ids?: string[];
  receipt_corrections?: { action: string; id?: string; name?: string; price?: number }[];
  unmatched_names?: string[];
  duration_ms?: number;
};

// ── Sanitize contact names to prevent prompt injection ────────────────────────
// Keeps letters, numbers, spaces, hyphens, apostrophes, dots. Truncates at 60.
function sanitizeName(name: string): string {
  return name
    .slice(0, 60)
    .replace(/[^a-zA-Z0-9\s\-'.\u00C0-\u024F]/g, "")
    .trim();
}

// ── Pre-filter contacts to candidates mentioned in the transcript ─────────────
// Extracts words 3+ chars from transcript, keeps contacts whose name contains
// any of those words. Falls back to first 60 contacts if too few match.
function preFilterContacts(
  contacts: { id: string; name: string }[],
  transcript: string,
): { id: string; name: string }[] {
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  if (words.length === 0) return contacts.slice(0, 60);

  const matched = contacts.filter((c) => {
    const nameLower = c.name.toLowerCase();
    return words.some(
      (w) => nameLower.includes(w) || c.name.split(" ").some((part) => part.toLowerCase().startsWith(w)),
    );
  });

  // Need at least 3 candidates to be useful; if too few fall back to a wider pool
  return matched.length >= 2 ? matched : contacts.slice(0, 60);
}

// ── Validate all IDs in the model's response against known-good sets ──────────
function validateResult(
  result: OrchestratorResult,
  validContactIds: Set<string>,
  validItemIds: Set<string>,
): OrchestratorResult {
  const selectedContactIds = (result.selected_contact_ids ?? []).filter((id) => {
    const ok = validContactIds.has(id);
    if (!ok) console.warn(`[orchestrator] unknown contact ID filtered: ${id}`);
    return ok;
  });

  const assignments = (result.assignments ?? [])
    .filter((a) => {
      const ok = validContactIds.has(a.contact_id);
      if (!ok) console.warn(`[orchestrator] unknown contact in assignment filtered: ${a.contact_id}`);
      return ok;
    })
    .map((a) => ({
      ...a,
      item_ids: a.item_ids.filter((id) => {
        const ok = validItemIds.has(id);
        if (!ok) console.warn(`[orchestrator] unknown item ID in assignment filtered: ${id}`);
        return ok;
      }),
    }));

  const userItemIds = (result.user_item_ids ?? []).filter((id) => {
    const ok = validItemIds.has(id);
    if (!ok) console.warn(`[orchestrator] unknown user item ID filtered: ${id}`);
    return ok;
  });

  const corrections = (result.receipt_corrections ?? []).filter((c) => {
    if ((c.action === "edit" || c.action === "delete") && c.id) {
      const ok = validItemIds.has(c.id);
      if (!ok) console.warn(`[orchestrator] unknown correction item ID filtered: ${c.id}`);
      return ok;
    }
    return true; // "add" corrections have no existing ID requirement
  });

  return {
    ...result,
    selected_contact_ids: selectedContactIds,
    assignments,
    user_item_ids: userItemIds,
    receipt_corrections: corrections,
  };
}

// ── Fetch with timeout ────────────────────────────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOrchestratorAgent() {
  const router = useRouter();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) recorder.stop().catch(() => {});
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isTranscribing || isProcessing) return;
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
    isRecordingRef.current = true;
    setError(null);
    setUnmatched([]);
  }, [recorder, isTranscribing, isProcessing]);

  const stopAndSend = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);
    isRecordingRef.current = false;

    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return;

    setIsTranscribing(true);
    try {
      const file = new ExpoFile(uri);
      const [bytes, { data: sessionData }] = await Promise.all([
        file.bytes(),
        supabase.auth.getSession(),
      ]);
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

      // ── Step 1: Transcribe ────────────────────────────────────────────────
      console.time("[orchestrator] transcription");
      const transcribeRes = await fetchWithTimeout(
        `${supabaseUrl}/functions/v1/voice-transcribe`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64 }),
        },
        TRANSCRIBE_TIMEOUT_MS,
      );
      const transcribeJson = await transcribeRes.json();
      console.timeEnd("[orchestrator] transcription");

      if (!transcribeRes.ok) throw new Error(transcribeJson.error ?? "Transcription failed");
      const transcript = (transcribeJson as { transcript: string }).transcript?.trim();
      console.log(`[orchestrator] transcript: "${transcript}"`);
      if (!transcript) return;

      setIsTranscribing(false);
      setIsProcessing(true);

      // ── Step 2: Load + sanitize + pre-filter device contacts ──────────────
      // Use cached contacts if still fresh to avoid re-reading all contacts
      const cacheValid =
        _contactCache !== null &&
        Date.now() - _contactCache.loadedAt < CONTACT_CACHE_TTL_MS;

      const deviceContacts: { id: string; name: string; phoneNumber?: string }[] = [];
      if (cacheValid && _contactCache) {
        deviceContacts.push(..._contactCache.contacts);
        console.log(`[orchestrator] contacts: loaded from cache (${deviceContacts.length})`);
      } else {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === "granted") {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          });
          for (const c of data) {
            if (!c.id || !c.name) continue;
            const sanitized = sanitizeName(c.name);
            if (!sanitized) continue;
            deviceContacts.push({
              id: c.id,
              name: sanitized,
              phoneNumber: c.phoneNumbers?.[0]?.number,
            });
          }
        }
        _contactCache = { contacts: deviceContacts, loadedAt: Date.now() };
        console.log(`[orchestrator] contacts: loaded ${deviceContacts.length} from device, cached`);
      }

      const store = useSplitStore.getState();
      const items = store.receiptData.items
        .filter((i) => i.name.trim().toLowerCase() !== "tax")
        .map(({ id, name, price }) => ({ id, name, price }));

      // Build ID sets for validation later
      const validContactIds = new Set(deviceContacts.map((c) => c.id));
      const validItemIds = new Set(items.map((i) => i.id));

      // Pre-filter contacts to transcript-relevant candidates
      const allContactsForAgent = deviceContacts.map(({ id, name }) => ({ id, name }));
      const filteredContacts = preFilterContacts(allContactsForAgent, transcript);
      console.log(
        `[orchestrator] contacts: ${deviceContacts.length} total, ${filteredContacts.length} after pre-filter`,
      );

      // ── Step 3: Call orchestrator agent ───────────────────────────────────
      console.time("[orchestrator] agent");
      const res = await fetchWithTimeout(
        `${supabaseUrl}/functions/v1/orchestrator-agent`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, items, contacts: filteredContacts }),
        },
        ORCHESTRATOR_TIMEOUT_MS,
      );
      const rawResult: OrchestratorResult = await res.json();
      console.timeEnd("[orchestrator] agent");

      if (!res.ok) throw new Error((rawResult as any).error ?? "Orchestrator failed");
      console.log(`[orchestrator] duration: ${rawResult.duration_ms}ms`);

      // ── Step 4: Validate all returned IDs ────────────────────────────────
      const result = validateResult(rawResult, validContactIds, validItemIds);

      // ── Step 5: Apply receipt corrections ────────────────────────────────
      const freshStore = useSplitStore.getState();
      for (const correction of result.receipt_corrections ?? []) {
        if (correction.action === "edit" && correction.id) {
          const item = freshStore.receiptData.items.find((i) => i.id === correction.id);
          if (item) {
            freshStore.updateItem(correction.id, {
              ...item,
              name: correction.name ?? item.name,
              price: correction.price ?? item.price,
            });
          }
        } else if (correction.action === "add" && correction.name) {
          freshStore.addItem({
            id: `orch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: correction.name.slice(0, 80),
            price: typeof correction.price === "number" ? Math.max(0, correction.price) : 0,
          });
        } else if (correction.action === "delete" && correction.id) {
          freshStore.removeItem(correction.id);
        }
      }

      // ── Step 6: Build selected contacts with assigned items ───────────────
      const updatedItems = useSplitStore.getState().receiptData.items;

      const selectedContacts: Contact[] = (result.selected_contact_ids ?? [])
        .map((cid) => {
          const dc = deviceContacts.find((c) => c.id === cid);
          if (!dc) return null;
          const assignment = (result.assignments ?? []).find((a) => a.contact_id === cid);
          const assignedItems: ReceiptItem[] = (assignment?.item_ids ?? [])
            .map((id) => updatedItems.find((i) => i.id === id))
            .filter((i): i is ReceiptItem => i != null);
          return {
            id: dc.id,
            name: dc.name,
            phoneNumber: dc.phoneNumber,
            image: undefined,
            items: assignedItems,
          } as Contact;
        })
        .filter((c): c is Contact => c != null);

      // Collect all item IDs already assigned to contacts
      const assignedItemIds = new Set<string>(
        selectedContacts.flatMap((c) => c.items.map((i) => i.id)),
      );

      // Items explicitly assigned to the user
      const explicitUserItems: ReceiptItem[] = (result.user_item_ids ?? [])
        .map((id) => updatedItems.find((i) => i.id === id))
        .filter((i): i is ReceiptItem => i != null);

      explicitUserItems.forEach((i) => assignedItemIds.add(i.id));

      // Everything not assigned to anyone defaults to the user
      const unassignedItems = updatedItems.filter(
        (i) => i.name.trim().toLowerCase() !== "tax" && !assignedItemIds.has(i.id),
      );

      const userItems = [...explicitUserItems, ...unassignedItems];

      useSplitStore.setState({ selected: selectedContacts });
      useSplitStore.getState().setUserItems(userItems);

      setUnmatched(result.unmatched_names ?? []);
      router.push("/review");
    } catch (err) {
      console.error("[orchestrator] error:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      // Surface user-friendly messages, hide internal details
      if (msg.includes("timed out")) {
        setError("Took too long. Please try again.");
      } else if (msg.includes("Transcription")) {
        setError("Could not hear you clearly. Please try again.");
      } else if (msg.includes("Not authenticated")) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsTranscribing(false);
      setIsProcessing(false);
    }
  }, [isRecording, recorder, router]);

  const isBusy = isTranscribing || isProcessing;

  return {
    isRecording,
    isTranscribing,
    isProcessing,
    isBusy,
    startRecording,
    stopAndSend,
    unmatched,
    error,
  };
}
