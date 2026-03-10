import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';

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

  const faqs = [
    {
      question: "How does Divi work?",
      answer: "Divi makes splitting expenses easy. Tap the plus button to scan a receipt or choose an image from your photos. Divi reads the items, lets you adjust the prices or names, and then allows you to assign each item to people in your contacts. Finally, we calculate the totals including tax and tip, and generate a summary you can text to your group."
    },
    {
      question: "What if multiple people shared the same item?",
      answer: "On the Assign screen, simply tap the same item for every person who shared it. Divi will automatically divide the cost of that item equally among everyone who is assigned to it."
    },
    {
      question: "How do I set up my payment links?",
      answer: "Go to the Profile tab and enter your Venmo, Cash App, or Zelle handles. When you send the final split summary via SMS, Divi will automatically include convenient, clickable links so your friends can easily pay you back."
    },
    {
      question: "Is the receipt scanning accurate?",
      answer: "We use advanced AI vision to read your receipts with high accuracy. However, blurry images, weird lighting, or complex receipt formats might occasionaly cause misreads. Always double-check the items and prices on the 'Modify Receipt' screen before proceeding."
    },
    {
      question: "Can I manually add or edit items?",
      answer: "Yes! On the 'Modify Receipt' screen right after scanning, you can tap any item to edit its name or price, swipe left to delete it, or tap the plus (+) button at the bottom right to manually add a new item."
    },
    {
      question: "How are tax and tip calculated?",
      answer: "Divi uses the 'Largest Remainder Method' (Penny Allocation) to ensure mathematically perfect distribution of the overall tax and tip amounts based on the specific total value of the items each person ordered. No rounding errors!"
    },
    {
      question: "Can I edit contact names before sending the summary?",
      answer: "Absolutely. On the final Review screen, you can tap anybody's name in the breakdown card to edit it. This ensures that even if you have a friend saved in your contacts as 'John (From Work)', they won't receive a group text calling them that."
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
    marginBottom: spacing.lg,
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