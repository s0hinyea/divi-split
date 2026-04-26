import { useState, useCallback, useRef, useEffect } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { File as ExpoFile } from "expo-file-system";
import * as uuid from "uuid";
import "react-native-get-random-values";
import { supabase } from "../lib/supabase";
import { useSplitStore } from "../stores/splitStore";
import type { AgentMessage } from "./useReviewAgent";
import type { Change } from "./ChangesContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type ResultAction =
  | { type: "add_item"; name: string; price: number }
  | { type: "edit_item"; id: string; name: string; price: number }
  | { type: "delete_item"; id: string }
  | { type: "set_tax"; amount: number }
  | { type: "set_tip"; amount: number }
  | { type: "split_item"; id: string };

type HistoryEntry = { role: "user" | "assistant"; content: string };

export type ActionSummary = {
  verb: string;
  name: string;
  amount?: number;
};

// ── Action executor ───────────────────────────────────────────────────────────

function executeResultActions(actions: ResultAction[], addChange: (c: Change) => void): ActionSummary[] {
  const summary: ActionSummary[] = [];

  for (const action of actions) {
    const store = useSplitStore.getState();
    switch (action.type) {
      case "add_item": {
        const newId = uuid.v4();
        const newItem = { id: newId, name: action.name, price: action.price };
        store.addItem(newItem);
        addChange({ type: "ADD", id: newId, previous: newItem });
        summary.push({ verb: "Added", name: action.name, amount: action.price });
        break;
      }
      case "edit_item": {
        const item = store.receiptData.items?.find((i) => i.id === action.id);
        if (item) {
          addChange({ type: "EDIT_NAME", id: action.id, previous: item });
          addChange({ type: "EDIT_PRICE", id: action.id, previous: item });
          store.updateItem(action.id, { ...item, name: action.name, price: action.price });
          summary.push({ verb: "Changed", name: action.name, amount: action.price });
        }
        break;
      }
      case "delete_item": {
        const items = store.receiptData.items ?? [];
        const item = items.find((i) => i.id === action.id);
        const index = items.findIndex((i) => i.id === action.id);
        if (item) {
          addChange({ type: "DELETE", id: action.id, previous: item, index });
          store.removeItem(action.id);
          summary.push({ verb: "Removed", name: item.name });
        }
        break;
      }
      case "set_tax": {
        const prevTax = store.receiptData.tax ?? 0;
        addChange({ type: "SET_TAX", id: "tax", previous: { id: "tax", name: "Tax", price: prevTax }, previousAmount: prevTax });
        store.updateReceiptData({ tax: action.amount });
        summary.push({ verb: "Changed", name: "Tax", amount: action.amount });
        break;
      }
      case "set_tip": {
        const prevTip = store.receiptData.tip ?? 0;
        addChange({ type: "SET_TIP", id: "tip", previous: { id: "tip", name: "Tip", price: prevTip }, previousAmount: prevTip });
        store.updateReceiptData({ tip: action.amount });
        summary.push({ verb: "Changed", name: "Tip", amount: action.amount });
        break;
      }
      case "split_item": {
        const items = store.receiptData.items ?? [];
        const item = items.find((i) => i.id === action.id);
        const index = items.findIndex((i) => i.id === action.id);
        if (item) {
          const childIds = store.splitItem(action.id);
          if (childIds.length === 2) {
            addChange({ type: "SPLIT", id: action.id, previous: item, splitChildIds: childIds, index });
          }
          summary.push({ verb: "Split", name: item.name });
        }
        break;
      }
    }
  }

  return summary;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useResultAgent(addChange: (c: Change) => void) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastActionSummary, setLastActionSummary] = useState<ActionSummary[] | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const messagesRef = useRef<AgentMessage[]>([]);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        recorder.stop().catch(() => {});
      }
    };
  }, []);


  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setLastActionSummary(null);
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

        // Snapshot state fresh from store at send time
        const store = useSplitStore.getState();
        const state = {
          items: store.receiptData.items.filter(
            (i) => i.name.trim().toLowerCase() !== "tax"
          ),
          tax: store.receiptData.tax ?? 0,
          tip: store.receiptData.tip ?? 0,
        };

        console.log("[result-agent] sending state:", JSON.stringify(state));

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        console.log("[result-agent] url:", `${supabaseUrl}/functions/v1/result-agent`);

        const response = await fetch(`${supabaseUrl}/functions/v1/result-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text.trim(), history, state }),
        });

        console.log("[result-agent] response status:", response.status);

        if (!response.ok) {
          const rawText = await response.text();
          console.error("[result-agent] error body:", rawText);
          let errMsg = "Agent request failed";
          try {
            const errJson = JSON.parse(rawText);
            errMsg = errJson.error ?? errMsg;
          } catch {}
          throw new Error(`${response.status}: ${errMsg}`);
        }

        const { reply, actions } = (await response.json()) as {
          reply: string;
          actions: ResultAction[];
        };

        console.log("[result-agent] reply:", reply, "actions:", actions);

        const summary = actions?.length > 0 ? executeResultActions(actions, addChange) : [];
        setLastActionSummary(summary);

        const assistantMsg: AgentMessage = {
          id: `${Date.now()}-a`,
          role: "assistant",
          content: reply || "Done!",
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        console.error("[result-agent] caught error:", msg);
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-err`,
            role: "assistant",
            content: `Error: ${msg}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, addChange],
  );

  const startRecording = useCallback(async () => {
    if (loading || isTranscribing) return;
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
    isRecordingRef.current = true;
  }, [recorder, loading, isTranscribing]);

  const stopAndSend = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);
    isRecordingRef.current = false;

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
      console.error("[result-agent-voice] error:", err);
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
    lastActionSummary,
    sendMessage,
    clearMessages,
    isRecording,
    isTranscribing,
    startRecording,
    stopAndSend,
  };
}
