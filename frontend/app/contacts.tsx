import React, { useState, useEffect} from 'react';
import {  useRouter } from 'expo-router';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image, TextInput } from 'react-native';
import * as Contacts from 'expo-contacts';
import { useOCR } from "../utils/OCRContext"
import {styles} from "../styles/contactsCss"
import { useContacts, Contact } from "../utils/ContactsContext"


export default function ChooseContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { selected, manageContacts } = useContacts();
  const [loading, setLoading] = useState(true);
  const {isProcessing} = useOCR();
  const [searchQuery, setSearchQuery] = useState('');
  const  router  = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        const newData = data.map(contact => ({
          id: contact.id,
          name: contact.name,
          phoneNumber: (contact.phoneNumbers ? (contact.phoneNumbers[0].number)  : (undefined))
        })) as Contact[];

        setContacts(newData);
      }
      setLoading(false);
    })();
  }, []);

  const toggleContact = (contact: Contact) => {
    manageContacts(contact);
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose the Recipients</Text>
        <View style={styles.statusContainer}>
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0000ff" />
              <Text style={styles.statusText}>Processing</Text>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Image style={styles.done} source={require("../assets/images/like.png")} />
              <Text style={styles.statusText}>Done</Text>
            </View>
          )}
        </View>
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
              selected.some(contact => contact.id === item.id) && styles.selectedContact
            ]}
            onPress={() => toggleContact(item)}
          >
            <Text style={styles.contactName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {selected.length > 0 && !isProcessing && 
        <View>
        <TouchableOpacity 
        style={styles.continueButton} 
        onPress={() => {router.push("/result")}}>
        <Image source={require('../assets/images/check.png')} style={styles.continueIcon} />
        </TouchableOpacity>
        </View>
        }

    </View>
  );
}

