import { useState, useEffect, useCallback } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { File as ExpoFile } from "expo-file-system";
import * as Speech from "expo-speech";
import { supabase } from "../lib/supabase";
import { useAgentChat } from "./useAgentChat";

export function useVoiceAgent() {
  const agentChat = useAgentChat();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Speak every new assistant message aloud
  useEffect(() => {
    const last = agentChat.messages[agentChat.messages.length - 1];
    if (last?.role === "assistant") {
      Speech.stop();
      Speech.speak(last.content, { language: "en-US" });
    }
  }, [agentChat.messages]);

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
      console.log("[voice] sending audio to voice-transcribe, uri:", uri);

      const response = await fetch(`${supabaseUrl}/functions/v1/voice-transcribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio: base64 }),
      });

      const json = await response.json();
      console.log("[voice] transcribe response:", JSON.stringify(json));

      if (!response.ok) throw new Error(json.error ?? "Transcription failed");

      const transcript = (json as { transcript: string }).transcript;
      console.log("[voice] transcript:", transcript);

      if (transcript?.trim()) {
        agentChat.sendMessage(transcript.trim());
      } else {
        console.warn("[voice] transcript was empty");
      }
    } catch (err) {
      console.error("[voice] error:", err);
    } finally {
      setIsTranscribing(false);
    }
  }, [isRecording, recorder, agentChat]);

  return {
    ...agentChat,
    isRecording,
    isTranscribing,
    startRecording,
    stopAndSend,
  };
}
