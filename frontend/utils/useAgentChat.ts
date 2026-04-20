import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useSplitStore } from "../stores/splitStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AgentAction =
  | { type: "assign_item"; item_id: string; contact_id: string }
  | { type: "assign_to_user"; item_id: string }
  | { type: "unassign_from_contact"; item_id: string; contact_id: string }
  | { type: "split_item_between"; item_id: string; assignees: [string, string] };

// Minimal history shape the edge function expects
type HistoryEntry = { role: "user" | "assistant"; content: string };

// ── Action executor ───────────────────────────────────────────────────────────
// Runs each action returned by the agent against the real splitStore.
// Must be called sequentially because split_item_between depends on the real
// IDs produced by splitItem(), which only exist after that call.

function executeActions(actions: AgentAction[]): void {
  for (const action of actions) {
    // Always grab a fresh snapshot — previous actions may have mutated the store
    const store = useSplitStore.getState();

    switch (action.type) {
      case "assign_item": {
        const item = store.receiptData.items.find((i) => i.id === action.item_id);
        const contact = store.selected.find((c) => c.id === action.contact_id);
        if (item && contact) {
          // manageItems toggles; only assign if not already assigned
          const alreadyAssigned = contact.items.some((i) => i.id === action.item_id);
          if (!alreadyAssigned) store.manageItems(item, contact);
        }
        break;
      }

      case "assign_to_user": {
        const item = store.receiptData.items.find((i) => i.id === action.item_id);
        if (item) {
          const current = store.receiptData.userItems ?? [];
          if (!current.some((i) => i.id === action.item_id)) {
            store.setUserItems([...current, item]);
          }
        }
        break;
      }

      case "unassign_from_contact": {
        if (action.contact_id === "user") {
          const current = store.receiptData.userItems ?? [];
          store.setUserItems(current.filter((i) => i.id !== action.item_id));
        } else {
          const item = store.receiptData.items.find((i) => i.id === action.item_id);
          const contact = store.selected.find((c) => c.id === action.contact_id);
          if (item && contact) {
            const alreadyAssigned = contact.items.some((i) => i.id === action.item_id);
            if (alreadyAssigned) store.manageItems(item, contact);
          }
        }
        break;
      }

      case "split_item_between": {
        // splitItem mutates the store and returns the two new real IDs
        const newIds = store.splitItem(action.item_id);
        if (newIds.length !== 2) break;

        const [id0, id1] = newIds;
        const [assignee0, assignee1] = action.assignees;

        // Grab another fresh snapshot after the split
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
        break;
      }
    }
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAgentChat() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // Build conversation history from current messages (user + assistant turns only)
        const history: HistoryEntry[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Snapshot current store state to send as context
        const store = useSplitStore.getState();
        const state = {
          items: store.receiptData.items,
          contacts: store.selected.map((c) => ({
            id: c.id,
            name: c.name,
            items: c.items,
          })),
          userItems: store.receiptData.userItems ?? [],
          tax: store.receiptData.tax ?? 0,
          tip: store.receiptData.tip ?? 0,
          total: store.receiptData.total ?? 0,
        };

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/agent-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text.trim(), history, state }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error((errBody as { error?: string }).error ?? "Agent request failed");
        }

        const { reply, actions } = (await response.json()) as {
          reply: string;
          actions: AgentAction[];
        };

        // Execute the agent's decided actions against the real store
        if (actions?.length > 0) {
          executeActions(actions);
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
    [messages, loading],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
}
