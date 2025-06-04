import React, { useState, useEffect} from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image, TextInput } from 'react-native';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  );

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
        <View style={styles.loadingContainer}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
          <Text>Processing</Text>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <View style={styles.loading}>
            <Image style={styles.done} source={require("../assets/images/like.png")} />
          </View>
          <Text>Done</Text>
        </View>
      )}
      
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search Name"
      />
      
      <FlatList
        data={filteredContacts}
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
    margin: 20,
    marginTop: 40
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
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
  loading: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10
  },
  done: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  }
});