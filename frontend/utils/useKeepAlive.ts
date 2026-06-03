import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { supabase } from "./supabase";

const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes - just under Deno's 5min idle timeout
const FUNCTIONS = ["orchestrator-agent", "result-agent", "review-agent"];

async function pingFunctions() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) return;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  for (const fn of FUNCTIONS) {
    fetch(`${supabaseUrl}/functions/v1/${fn}?ping=1`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }).catch(() => {});
  }
  console.log("[keep-alive] pinged edge functions");
}

export function useKeepAlive() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(pingFunctions, PING_INTERVAL_MS);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") start();
      else stop();
    });

    if (AppState.currentState === "active") start();

    return () => {
      stop();
      subscription.remove();
    };
  }, []);
}
