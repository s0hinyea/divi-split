import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation, UIManager, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';
import { privacyPolicyUrl } from '@/constants/appConfig';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.faqCard}>
      <TouchableOpacity onPress={toggleExpand} style={styles.faqHeader} activeOpacity={0.7}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <MaterialIcons 
          name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={colors.black} 
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

export default function HelpPage() {
  const router = useRouter();

  const openPrivacyPolicy = async () => {
    if (!privacyPolicyUrl) {
      Alert.alert(
        'Privacy policy missing',
        'Set EXPO_PUBLIC_PRIVACY_POLICY_URL to a public policy page before submitting to Apple.'
      );
      return;
    }

    try {
      await Linking.openURL(privacyPolicyUrl);
    } catch {
      Alert.alert('Link unavailable', 'We could not open the privacy policy right now.');
    }
  };

  const faqs = [
    {
      question: "How does Divi work?",
      answer: "Divi makes splitting expenses effortless. Tap the plus button to scan a receipt using your camera's document scanner — it automatically detects edges and crops the receipt for you. Divi's AI reads every item, lets you adjust prices or names, and then you assign each item to people from your contacts. Tax and tip are distributed proportionally, and Divi generates a summary you can text to your group with one tap."
    },
    {
      question: "What is the AI Assistant?",
      answer: "Look for the sparkle (✦) button on the Assign and Review screens. Tapping it opens Divi's AI Assistant — a chat-powered helper that can assign items, move items between people, rename things, and adjust tax or tip for you. Just tell it what you need in plain English, like 'Give the steak to John' or 'Split the appetizer evenly.'"
    },
    {
      question: "How do I split a shared item?",
      answer: "On the Modify Receipt screen, press and hold any item for about 3 seconds. You'll see a green progress bar fill up with haptic feedback. When it completes, the item is split into two equal halves that you can assign to different people. You can split items as many times as needed."
    },
    {
      question: "Can I undo a delete or split?",
      answer: "Yes! After deleting or splitting an item, an 'Undo' button appears at the bottom of the screen. Tapping it restores the item to its exact original position in the list — it won't just get added to the end."
    },
    {
      question: "What if multiple people shared the same item?",
      answer: "You have two options: use the long-press split gesture to divide the item into halves first, or on the Assign screen, tap the same item for every person who shared it. Divi will automatically divide the cost equally among everyone assigned to it."
    },
    {
      question: "How do I set up my payment links?",
      answer: "Go to the Profile tab and enter your Venmo, Cash App, or Zelle handles. When you send the final split summary via SMS, Divi will automatically include convenient, clickable payment links so your friends can pay you back in one tap."
    },
    {
      question: "Can I view or edit past receipts?",
      answer: "Yes! Go to the History tab to see all your saved splits. Tap or swipe on any receipt to view the full breakdown. You can also re-edit a past split — reassign items, update contacts, and resend the SMS summary."
    },
    {
      question: "Is the receipt scanning accurate?",
      answer: "Divi uses advanced AI vision with built-in validation. It checks whether the image is actually a receipt before processing, warns you if the photo is too dark or overexposed, and cross-checks the item totals against the receipt's reported total. That said, always double-check the items on the Modify Receipt screen before proceeding."
    },
    {
      question: "Can I manually add or edit items?",
      answer: "Yes! On the Modify Receipt screen right after scanning, you can tap any item to edit its name or price, swipe left to delete it, or tap the plus (+) button at the bottom right to manually add a new item."
    },
    {
      question: "How are tax and tip calculated?",
      answer: "Divi uses the 'Largest Remainder Method' (Penny Allocation) to distribute tax proportionally based on each person's subtotal, and tip evenly across all participants. This ensures mathematically perfect distribution — no rounding errors or lost pennies!"
    },
    {
      question: "Can I edit contact names before sending?",
      answer: "Absolutely. On the final Review screen, tap anybody's name in their breakdown card to edit it. This way, even if you have a friend saved as 'John (From Work)', they won't receive a group text with that label."
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>
          <Text style={{ color: colors.black }}>Help & </Text>
          <Text style={{ color: colors.green }}>FAQ</Text>
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        
        <View style={styles.introBox}>
          <MaterialIcons name="lightbulb-outline" size={32} color={colors.green} style={styles.introIcon} />
          <View style={styles.introTextContainer}>
            <Text style={styles.introTitle}>Need help?</Text>
            <Text style={styles.introText}>Browse our frequently asked questions below to learn how to get the most out of Divi.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <View style={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </View>

        <View style={styles.contactSupport}>
          <Text style={styles.supportTitle}>Still have questions?</Text>
          <Text style={styles.supportText}>Reach out to our support team.</Text>
          <TouchableOpacity style={styles.policyButton} activeOpacity={0.8} onPress={openPrivacyPolicy}>
            <Text style={styles.policyButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton} activeOpacity={0.8}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.gray100 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  title: { 
    fontFamily: fonts.bodyBold, 
    fontSize: 28, 
  },
  scrollView: { 
    flex: 1 
  },
  content: { 
    padding: spacing.lg, 
    paddingBottom: 60 
  },
  introBox: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
    alignItems: 'center'
  },
  introIcon: {
    marginRight: spacing.md,
  },
  introTextContainer: {
    flex: 1,
  },
  introTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
    marginBottom: 4,
  },
  introText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray600,
    lineHeight: 20,
  },
  sectionTitle: { 
    fontFamily: fonts.bodyBold, 
    fontSize: fontSizes.lg, 
    color: colors.gray600, 
    marginBottom: spacing.md, 
    marginLeft: spacing.xs 
  },
  faqContainer: {
    marginBottom: spacing.xl,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.black,
    paddingRight: spacing.sm,
  },
  faqAnswerContainer: {
    padding: spacing.md,
    paddingTop: 0,
    backgroundColor: colors.white,
  },
  faqAnswer: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.gray600,
    lineHeight: 22,
  },
  contactSupport: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    ...shadows.sm,
  },
  supportTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  supportText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  policyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  policyButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.green,
  },
  supportButton: {
    backgroundColor: colors.black,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  supportButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.white,
  }
});
