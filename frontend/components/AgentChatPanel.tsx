import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, fontSizes, spacing, radii } from "@/styles/theme";
import { useVoiceAgent } from "../utils/useVoiceAgent";

export default function AgentChatPanel() {
  const { messages, loading, error, sendMessage, clearMessages, isRecording, isTranscribing, startRecording, stopAndSend } = useVoiceAgent();
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length > 0) {
      // Small delay so the new bubble renders before we scroll
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;
    setInputText("");
    sendMessage(trimmed);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={60}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.headerTitle}>Divi Agent</Text>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={clearMessages} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSubtitle}>Tell me who had what</Text>
      </View>

      {/* Message list */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="chat-bubble-outline" size={36} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Ready to split</Text>
            <Text style={styles.emptyHint}>
              {"Try:\n"}"John had the steak"{"\n"}"Sarah and I split the salad"{"\n"}"Move the drinks to Sarah"
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubbleWrapper,
              msg.role === "user" ? styles.userWrapper : styles.agentWrapper,
            ]}
          >
            {msg.role === "assistant" && (
              <View style={styles.agentAvatar}>
                <MaterialIcons name="auto-awesome" size={14} color={colors.green} />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                msg.role === "user" ? styles.userBubble : styles.agentBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === "user" ? styles.userText : styles.agentText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubbleWrapper, styles.agentWrapper]}>
            <View style={styles.agentAvatar}>
              <MaterialIcons name="auto-awesome" size={14} color={colors.green} />
            </View>
            <View style={[styles.bubble, styles.agentBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={colors.green} />
            </View>
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </ScrollView>

      {/* Voice status label */}
      {(isRecording || isTranscribing) && (
        <View style={styles.voiceStatus}>
          {isRecording ? (
            <Text style={styles.voiceStatusText}>Listening... tap mic to send</Text>
          ) : (
            <ActivityIndicator size="small" color={colors.green} />
          )}
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Who had what?"
          placeholderTextColor={colors.gray400}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!loading && !isRecording && !isTranscribing}
          multiline={false}
        />

        {/* Mic button — shown when input is empty */}
        {!inputText.trim() && (
          <TouchableOpacity
            style={[styles.sendButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopAndSend : startRecording}
            disabled={isTranscribing || loading}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={isRecording ? "stop" : "mic"}
              size={20}
              color={colors.white}
            />
          </TouchableOpacity>
        )}

        {/* Send button — shown when there is typed text */}
        {!!inputText.trim() && (
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-upward" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.green,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  clearText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.gray500,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray400,
    textAlign: "center",
    lineHeight: 22,
  },
  bubbleWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  userWrapper: {
    justifyContent: "flex-end",
  },
  agentWrapper: {
    justifyContent: "flex-start",
  },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: `${colors.green}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "76%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
  },
  userBubble: {
    backgroundColor: colors.black,
    borderBottomRightRadius: radii.sm,
  },
  agentBubble: {
    backgroundColor: colors.gray100,
    borderBottomLeftRadius: radii.sm,
  },
  loadingBubble: {
    paddingHorizontal: spacing.lg,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  agentText: {
    color: colors.black,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  recordingButton: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  voiceStatus: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  voiceStatusText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.green,
  },
});
