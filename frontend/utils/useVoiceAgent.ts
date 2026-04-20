import { useState, useEffect, useCallback } from "react";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
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

      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as unknown as Blob);

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/voice-transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");
      const { transcript } = (await response.json()) as { transcript: string };

      if (transcript?.trim()) {
        agentChat.sendMessage(transcript.trim());
      }
    } catch {
      // transcription errors are non-fatal — user can retry
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
