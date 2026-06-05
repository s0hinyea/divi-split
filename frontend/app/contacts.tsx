import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Image,
} from "react-native";
import * as Contacts from "expo-contacts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOCR } from "../utils/OCRContext";
import { useSplitStore, Contact } from '../stores/splitStore';
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { useCustomAlert } from '@/components/CustomAlert';

const CONTACTS_CACHE_KEY = 'divi_contacts_cache';
const RECENTS_KEY = 'divi_recent_contacts';
const MAX_RECENTS = 5;

export default function ChooseContacts() {
  const { showAlert } = useCustomAlert();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const selected = useSplitStore((state) => state.selected);
  const manageContacts = useSplitStore((state) => state.manageContacts);
  const [loading, setLoading] = useState(true);
  const { isProcessing, status, error: ocrError } = useOCR();
  const receiptData = useSplitStore((state) => state.receiptData);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const setCurrentStep = useSplitStore((state) => state.setCurrentStep);
  const resetStore = useSplitStore((state) => state.resetStore);

  useEffect(() => {
    setCurrentStep('contacts');
    loadContacts();
    loadRecents();
  }, []);

  const loadRecents = async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENTS_KEY);
      if (raw) setRecentContacts(JSON.parse(raw));
    } catch {}
  };

  const saveRecents = async (selectedContacts: Contact[]) => {
    try {
      const raw = await AsyncStorage.getItem(RECENTS_KEY);
      const existing: Contact[] = raw ? JSON.parse(raw) : [];
      const merged = [
        ...selectedContacts,
        ...existing.filter(e => !selectedContacts.some(s => s.id === e.id)),
      ].slice(0, MAX_RECENTS);
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(merged.map(c => ({ ...c, items: [] }))));
    } catch {}
  };

  const loadContacts = async () => {
    // Show cached list immediately so the screen is never blank
    try {
      const cached = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
      if (cached) {
        setContacts(JSON.parse(cached));
        setLoading(false);
      }
    } catch {}

    // Refresh from OS in background
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Name,
          Contacts.Fields.Image,
          Contacts.Fields.ImageAvailable,
        ],
      });
      const newData = data.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumbers?.[0]?.number,
        image: contact.imageAvailable ? contact.image : undefined,
        items: [],
      })) as Contact[];
      setContacts(newData);
      setLoading(false);
      try {
        await AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(newData));
      } catch {}
    } else {
      setLoading(false);
    }
  };

  const filteredContacts = useMemo(() =>
    contacts
      .filter((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      .sort((a, b) => {
        const aSelected = selected.some((c) => c.id === a.id);
        const bSelected = selected.some((c) => c.id === b.id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return 0;
      }),
    [contacts, selected, searchQuery]
  );

  const visibleRecents = useMemo(() =>
    searchQuery ? [] : recentContacts.filter(r => contacts.some(c => c.id === r.id)),
    [searchQuery, recentContacts, contacts]
  );

  const mainContacts = useMemo(() =>
    visibleRecents.length > 0
      ? filteredContacts.filter(c => !visibleRecents.some(r => r.id === c.id))
      : filteredContacts,
    [visibleRecents, filteredContacts]
  );

  const handleContactPress = useCallback((item: Contact) => {
    manageContacts(item);
  }, [manageContacts]);

  const handleContinue = () => {
    saveRecents(selected);
    if (receiptData?.items?.length === 0) {
      showAlert({
        title: "No Items Found",
        message: "We couldn't detect any assignable items on this receipt. Please try scanning again.",
        buttons: [{ text: "Go Home", onPress: () => { resetStore(); router.replace('/(tabs)'); } }],
      });
    } else {
      router.push("/result?manual=1");
    }
  };

  const renderContactItem = (item: Contact) => {
    const isSelected = selected.some((c) => c.id === item.id);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.contactItem, isSelected && styles.selectedContact]}
        onPress={() => handleContactPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.image ? (
            <Image source={{ uri: item.image.uri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
          )}
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.phoneNumber && (
            <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
          )}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Icon source="check" size={16} color={colors.white} />}
        </View>
      </TouchableOpacity>
    );
  };

  const noContactsSelected = selected.length === 0;

  if (loading && contacts.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TouchableOpacity onPress={() => { resetStore(); router.replace('/(tabs)'); }} style={{ marginRight: spacing.sm }}>
            <MaterialIcons name="arrow-back" size={28} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            <Text style={{ color: colors.black }}>Choose </Text>
            <Text style={{ color: colors.green }}>Recipients</Text>
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>Select who to split this with</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon source="magnify" size={20} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search name"
          placeholderTextColor={colors.gray400}
        />
      </View>

      <FlatList
        data={mainContacts}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={visibleRecents.length > 0 ? (
          <View>
            <Text style={styles.sectionLabel}>Recent</Text>
            {visibleRecents.map(item => renderContactItem(item))}
            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>All Contacts</Text>
          </View>
        ) : null}
        renderItem={({ item }) => renderContactItem(item)}
      />

      <View style={styles.footer}>
        {ocrError ? (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: colors.error }]}>{ocrError}</Text>
            <TouchableOpacity
              style={[styles.continueButton, { marginTop: spacing.sm }]}
              onPress={() => { resetStore(); router.replace('/(tabs)'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        ) : isProcessing ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={colors.green} />
            <Text style={styles.statusText}>{status || "Processing receipt..."}</Text>
          </View>
        ) : noContactsSelected ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Select at least one person</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Icon source="arrow-right" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
    color: colors.green,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.gray600,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  selectedContact: {
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    color: colors.gray600,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.black,
  },
  phoneNumber: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.gray100,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.black,
    height: 56,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
});
