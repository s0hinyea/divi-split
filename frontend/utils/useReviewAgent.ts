import { useState, useEffect, useCallback, useRef, MutableRefObject } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { File as ExpoFile } from "expo-file-system";
import * as Speech from "expo-speech";
import { supabase } from "../lib/supabase";
import { useSplitStore, ReceiptItem } from "../stores/splitStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ReviewState = {
  receiptName: string;
  receiptDate: string;
  contacts: { id: string; name: string; items: { id: string; name: string; price: number }[] }[];
  userItems: { id: string; name: string; price: number }[];
  tax: number;
  tip: number;
  total: number;
};

type ReviewAction =
  | { type: "set_receipt_name"; name: string }
  | { type: "set_receipt_date"; date: string }
  | { type: "rename_contact"; contact_id: string; new_name: string }
  | { type: "update_tax"; amount: number }
  | { type: "update_tip"; amount: number }
  | { type: "move_item"; item_id: string; from_contact_id: string; to_contact_id: string }
  | { type: "trigger_dispatch" };

export type ReviewCallbacks = {
  setReceiptName: (name: string) => void;
  setReceiptDate: (date: Date) => void;
  updateContactName: (id: string, name: string) => void;
  setTax: (amount: number) => void;
  setTip: (amount: number) => void;
  moveItem: (itemId: string, fromId: string, toId: string) => void;
  triggerDispatch: () => void;
};

type HistoryEntry = { role: "user" | "assistant"; content: string };

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useReviewAgent(
  stateRef: MutableRefObject<ReviewState>,
  callbacksRef: MutableRefObject<ReviewCallbacks>,
) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const messagesRef = useRef<AgentMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Speak every new assistant message
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      Speech.stop();
      Speech.speak(last.content, { language: "en-US" });
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      setError(null);
      setLoading(true);

      const userMsg: AgentMessage = {
        id: `${Date.now()}-u`,
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const history: HistoryEntry[] = messagesRef.current.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/review-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text.trim(), history, state: stateRef.current }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error((errBody as { error?: string }).error ?? "Agent request failed");
        }

        const { reply, actions } = (await response.json()) as {
          reply: string;
          actions: ReviewAction[];
        };

        if (actions?.length > 0) {
          const cb = callbacksRef.current;
          for (const action of actions) {
            switch (action.type) {
              case "set_receipt_name":
                cb.setReceiptName(action.name);
                break;
              case "set_receipt_date":
                cb.setReceiptDate(new Date(action.date));
                break;
              case "rename_contact":
                cb.updateContactName(action.contact_id, action.new_name);
                break;
              case "update_tax":
                cb.setTax(action.amount);
                break;
              case "update_tip":
                cb.setTip(action.amount);
                break;
              case "move_item":
                cb.moveItem(action.item_id, action.from_contact_id, action.to_contact_id);
                break;
              case "trigger_dispatch":
                cb.triggerDispatch();
                break;
            }
          }
        }

        const assistantMsg: AgentMessage = {
          id: `${Date.now()}-a`,
          role: "assistant",
          content: reply || "Done!",
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-err`,
            role: "assistant",
            content: "Sorry, I ran into an error. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, stateRef, callbacksRef],
  );

  const startRecording = useCallback(async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  }, [recorder]);

  const stopAndSend = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);

    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return;

    setIsTranscribing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const file = new ExpoFile(uri);
      const bytes = await file.bytes();
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/voice-transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio: base64 }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Transcription failed");

      const transcript = (json as { transcript: string }).transcript;
      if (transcript?.trim()) {
        await sendMessage(transcript.trim());
      }
    } catch (err) {
      console.error("[review-voice] error:", err);
    } finally {
      setIsTranscribing(false);
    }
  }, [isRecording, recorder, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    isRecording,
    isTranscribing,
    startRecording,
    stopAndSend,
  };
}

// ── Standalone move-item executor (called from review.tsx callback) ────────────
// Exported so review.tsx can use it without importing Zustand hooks conditionally.
export function executeMoveItem(itemId: string, fromId: string, toId: string) {
  const store = useSplitStore.getState();

  // Find and remove from source
  let item: ReceiptItem | undefined;

  if (fromId === "user") {
    item = (store.receiptData.userItems ?? []).find((i) => i.id === itemId);
    store.setUserItems((store.receiptData.userItems ?? []).filter((i) => i.id !== itemId));
  } else {
    const fromContact = store.selected.find((c) => c.id === fromId);
    item = (fromContact?.items as ReceiptItem[] | undefined)?.find((i) => i.id === itemId);
    if (item && fromContact) {
      // manageItems toggles — item IS on contact, so this removes it
      store.manageItems(item, fromContact);
    }
  }

  if (!item) return;

  // Add to destination
  if (toId === "user") {
    const fresh = useSplitStore.getState();
    fresh.setUserItems([...(fresh.receiptData.userItems ?? []), item]);
  } else {
    const fresh = useSplitStore.getState();
    const toContact = fresh.selected.find((c) => c.id === toId);
    if (toContact) {
      // manageItems toggles — item is NOT on toContact, so this adds it
      fresh.manageItems(item, toContact);
    }
  }
}
