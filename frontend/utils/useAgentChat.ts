import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useSplitStore } from "../stores/splitStore";
import type { Contact, ReceiptItem } from "../stores/splitStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ActionSummary = {
  verb: string;
  name: string;
  amount?: number;
};

type AgentAction =
  | { type: "assign_item"; item_id: string; contact_id: string }
  | { type: "assign_to_user"; item_id: string }
  | { type: "unassign_from_contact"; item_id: string; contact_id: string }
  | { type: "split_item_between"; item_id: string; assignees: [string, string] };

// Minimal history shape the edge function expects
type HistoryEntry = { role: "user" | "assistant"; content: string };

// ── Action executor ───────────────────────────────────────────────────────────

function executeActions(actions: AgentAction[]): ActionSummary[] {
  const summary: ActionSummary[] = [];

  for (const action of actions) {
    const store = useSplitStore.getState();

    switch (action.type) {
      case "assign_item": {
        const item = store.receiptData.items.find((i) => i.id === action.item_id);
        const contact = store.selected.find((c) => c.id === action.contact_id);
        if (item && contact) {
          const alreadyAssigned = contact.items.some((i) => i.id === action.item_id);
          if (!alreadyAssigned) {
            store.manageItems(item, contact);
            summary.push({ verb: "Assigned", name: item.name, amount: item.price });
          }
        }
        break;
      }

      case "assign_to_user": {
        const item = store.receiptData.items.find((i) => i.id === action.item_id);
        if (item) {
          const current = store.receiptData.userItems ?? [];
          if (!current.some((i) => i.id === action.item_id)) {
            store.setUserItems([...current, item]);
            summary.push({ verb: "Assigned", name: item.name, amount: item.price });
          }
        }
        break;
      }

      case "unassign_from_contact": {
        if (action.contact_id === "user") {
          const current = store.receiptData.userItems ?? [];
          const item = current.find((i) => i.id === action.item_id);
          if (item) {
            store.setUserItems(current.filter((i) => i.id !== action.item_id));
            summary.push({ verb: "Unassigned", name: item.name });
          }
        } else {
          const item = store.receiptData.items.find((i) => i.id === action.item_id);
          const contact = store.selected.find((c) => c.id === action.contact_id);
          if (item && contact) {
            const alreadyAssigned = contact.items.some((i) => i.id === action.item_id);
            if (alreadyAssigned) {
              store.manageItems(item, contact);
              summary.push({ verb: "Unassigned", name: item.name });
            }
          }
        }
        break;
      }

      case "split_item_between": {
        const item = store.receiptData.items.find((i) => i.id === action.item_id);
        const newIds = store.splitItem(action.item_id);
        if (newIds.length !== 2) break;

        const [id0, id1] = newIds;
        const [assignee0, assignee1] = action.assignees;

        const afterSplit = useSplitStore.getState();
        const half0 = afterSplit.receiptData.items.find((i) => i.id === id0);
        const half1 = afterSplit.receiptData.items.find((i) => i.id === id1);

        if (half0) {
          if (assignee0 === "user") {
            const cur = useSplitStore.getState().receiptData.userItems ?? [];
            useSplitStore.getState().setUserItems([...cur, half0]);
          } else {
            const contact = useSplitStore.getState().selected.find((c) => c.id === assignee0);
            if (contact) useSplitStore.getState().manageItems(half0, contact);
          }
        }

        if (half1) {
          if (assignee1 === "user") {
            const cur = useSplitStore.getState().receiptData.userItems ?? [];
            useSplitStore.getState().setUserItems([...cur, half1]);
          } else {
            const contact = useSplitStore.getState().selected.find((c) => c.id === assignee1);
            if (contact) useSplitStore.getState().manageItems(half1, contact);
          }
        }

        if (item) summary.push({ verb: "Split", name: item.name });
        break;
      }
    }
  }

  return summary;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

type AssignSnapshot = { selected: Contact[]; userItems: ReceiptItem[] };

export function useAgentChat() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastActionSummary, setLastActionSummary] = useState<ActionSummary[] | null>(null);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const snapshotRef = useRef<AssignSnapshot | null>(null);

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
        // Build conversation history from current messages (user + assistant turns only)
        const history: HistoryEntry[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Snapshot current store state to send as context (strip fields irrelevant to assignment)
        const store = useSplitStore.getState();
        const state = {
          items: store.receiptData.items.map(({ id, name, price }) => ({ id, name, price })),
          contacts: store.selected.map((c) => ({
            id: c.id,
            name: c.name,
            items: c.items.map(({ id, name, price }) => ({ id, name, price })),
          })),
          userItems: (store.receiptData.userItems ?? []).map(({ id, name, price }) => ({ id, name, price })),
        };

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        console.log(`[agent-chat] sending message: "${text.trim()}", items: ${state.items.length}, contacts: ${state.contacts.length}`);
        console.time('[agent-chat] agent-chat edge function');
        const response = await fetch(`${supabaseUrl}/functions/v1/agent-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text.trim(), history, state }),
        });
        console.timeEnd('[agent-chat] agent-chat edge function');

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error((errBody as { error?: string }).error ?? "Agent request failed");
        }

        const { reply, actions } = (await response.json()) as {
          reply: string;
          actions: AgentAction[];
        };

        // Snapshot before mutating so undo can restore
        const preStore = useSplitStore.getState();
        snapshotRef.current = {
          selected: JSON.parse(JSON.stringify(preStore.selected)),
          userItems: [...(preStore.receiptData.userItems ?? [])],
        };

        console.time('[agent-chat] execute actions');
        const summary = actions?.length > 0 ? executeActions(actions) : [];
        console.timeEnd('[agent-chat] execute actions');
        console.log(`[agent-chat] actions: ${actions?.length ?? 0}, reply: "${reply}"`);
        setLastReply(reply ?? null);
        setLastActionSummary(summary);

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
    [messages, loading],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastReply(null);
    snapshotRef.current = null;
  }, []);

  const undoLastAgentAction = useCallback(() => {
    const snap = snapshotRef.current;
    if (!snap) return;
    useSplitStore.setState({ selected: snap.selected });
    useSplitStore.getState().setUserItems(snap.userItems);
    snapshotRef.current = null;
    setLastActionSummary(null);
    setLastReply(null);
  }, []);

  return { messages, loading, error, lastActionSummary, lastReply, sendMessage, clearMessages, undoLastAgentAction };
}
