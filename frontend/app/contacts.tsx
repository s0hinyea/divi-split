import React, { useState, useEffect} from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import * as Contacts from 'expo-contacts';
import { useOCR } from "../utils/OCRContext"

type Contact = {
  id: string;
  name: string;
  phoneNumbers?: Array<{
    number: string;
  }>;
};

export default function ChooseContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const {isProcessing} = useOCR();

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });
        setContacts(data as Contact[]);
      }
      setLoading(false);
    })();
  }, []);

  const toggleContact = (contact: Contact) => {
    if (selectedContacts.includes(contact.id)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact.id]);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <Text>
          Processing
        </Text>
      ) : (
        <Text>
          Done
        </Text>
      )}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.contactItem,
              selectedContacts.includes(item.id) && styles.selectedContact
            ]}
            onPress={() => toggleContact(item)}
          >
            <Text style={styles.contactName}>{item.name}</Text>
            {item.phoneNumbers && item.phoneNumbers[0] && (
              <Text style={styles.phoneNumber}>{item.phoneNumbers[0].number}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  contactItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedContact: {
    backgroundColor: '#e3f2fd',
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});