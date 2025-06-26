import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
} from "react-native";
import * as Contacts from "expo-contacts";
import { useOCR } from "../utils/OCRContext";
import { styles } from "../styles/contactsCss";
import { useContacts, Contact } from "../utils/ContactsContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../constants/Colors";
import { Icon } from "react-native-paper";

export default function ChooseContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { selected, manageContacts } = useContacts();
  const [loading, setLoading] = useState(true);
  const { isProcessing } = useOCR();
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
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        const newData = data.map((contact) => ({
          id: contact.id,
          name: contact.name,
          phoneNumber: contact.phoneNumbers
            ? contact.phoneNumbers[0].number
            : undefined,
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  // Clarify intent with named variables
  const noContactsSelected = selected.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose the Recipients</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search Name"
      />

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.contactItem,
              selected.some((contact) => contact.id === item.id) &&
              styles.selectedContact,
            ]}
            onPress={() => toggleContact(item)}
          >
            <Text style={styles.contactName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {(isProcessing || noContactsSelected) ? (
        <View style={styles.loadingContainer}>
          {isProcessing ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="small" color={Colors.orange} />
              <Text style={styles.statusText}>Processing</Text>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <Icon
                source="check-circle-outline"
                size={24}
                color={Colors.orange}
              />
              <Text style={styles.statusText}>Done</Text>
            </View>
          )}
        </View>
      ) : (
        <View>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              router.push("/result");
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
