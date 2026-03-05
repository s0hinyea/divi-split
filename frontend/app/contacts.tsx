import React, { useState, useEffect } from "react";
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
import { useOCR } from "../utils/OCRContext";
import { useSplitStore, Contact } from '../stores/splitStore';
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "react-native-paper";
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';

export default function ChooseContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const selected = useSplitStore((state) => state.selected);
  const manageContacts = useSplitStore((state) => state.manageContacts);
  const [loading, setLoading] = useState(true);
  const { isProcessing, status } = useOCR();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  let contact1 = {
    id: "c1",
    name: "jerome",
    phoneNumber: "9295130735",
    items: [],
  };

  let contact2 = {
    id: "c2",
    name: "maya",
    phoneNumber: "3476120033",
    items: [],
  };

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Name,
            Contacts.Fields.Image,
            Contacts.Fields.ImageAvailable
          ],
        });

        const newData = data.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phoneNumber: contact.phoneNumbers
            ? contact.phoneNumbers[0].number
            : undefined,
          image: contact.imageAvailable ? contact.image : undefined,
          items: [],
        })) as Contact[];

        setContacts([...newData, contact1, contact2]);
      }
      setLoading(false);
    })();
  }, []);

  const toggleContact = (contact: Contact) => {
    manageContacts(contact);
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  const noContactsSelected = selected.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Text style={{ color: colors.black }}>Choose </Text>
          <Text style={{ color: colors.green }}>Recipients</Text>
        </Text>
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
        data={filteredContacts}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selected.some((contact) => contact.id === item.id);
          return (
            <TouchableOpacity
              style={[
                styles.contactItem,
                isSelected && styles.selectedContact,
              ]}
              onPress={() => toggleContact(item)}
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
        }}
      />

      <View style={styles.footer}>
        {(isProcessing || noContactsSelected) ? (
          <View style={styles.statusContainer}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color={colors.green} />
                <Text style={styles.statusText}>{status || "Processing receipt..."}</Text>
              </>
            ) : (
              <Text style={styles.statusText}>Select at least one person</Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              router.push("/result");
            }}
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
    color: colors.green, // Changed to green
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Space for footer
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
  },
  selectedContact: {
    backgroundColor: `${colors.green}10`, // 10% opacity green
    borderColor: colors.green,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden', // Ensure image stays within circle
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
    backgroundColor: colors.gray100, // Or white with top border
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
    flexDirection: 'row',
    backgroundColor: colors.black,
    height: 56,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
});
