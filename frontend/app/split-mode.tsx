import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { colors, fonts, fontSizes, spacing, radii } from "@/styles/theme";
import { useOCR } from "@/utils/OCRContext";

export default function SplitMode() {
  const router = useRouter();
  const { isProcessing } = useOCR();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>How do you want</Text>
        <Text style={styles.titleGreen}>to split?</Text>
        {isProcessing && (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color={colors.green} />
            <Text style={styles.processingText}>Reading receipt...</Text>
          </View>
        )}
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.voiceCard}
          onPress={() => router.push("/result?voice=1")}
          activeOpacity={0.85}
        >
          <View style={styles.cardIconWrap}>
            <MaterialIcons name="mic" size={32} color={colors.white} />
          </View>
          <Text style={styles.cardTitle}>Voice</Text>
          <Text style={styles.cardSubtitle}>
            Say who's splitting and who got what in one go
          </Text>
          <View style={styles.cardBadge}>
            <MaterialIcons name="auto-awesome" size={12} color={colors.green} />
            <Text style={styles.cardBadgeText}>2 taps total</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualCard}
          onPress={() => router.push("/contacts")}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIconWrap, styles.cardIconWrapManual]}>
            <Feather name="list" size={28} color={colors.black} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.black }]}>Manual</Text>
          <Text style={styles.cardSubtitle}>Choose contacts then assign items step by step</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 36,
    color: colors.black,
    letterSpacing: -1,
    lineHeight: 42,
  },
  titleGreen: {
    fontFamily: fonts.bodyBold,
    fontSize: 36,
    color: colors.green,
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: spacing.md,
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  processingText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  cards: {
    flex: 1,
    gap: spacing.md,
  },
  voiceCard: {
    backgroundColor: colors.black,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flex: 1,
  },
  manualCard: {
    backgroundColor: colors.gray100,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardIconWrapManual: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.gray400,
    lineHeight: 22,
  },
  cardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.md,
    backgroundColor: `${colors.green}20`,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  cardBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.green,
  },
});
