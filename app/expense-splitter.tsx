import {View, StyleSheet, Image, TouchableOpacity} from 'react-native'
import {Text, Button, Surface} from 'react-native-paper'
import { useState } from 'react'
import { useRouter } from 'expo-router'

export default function MainPage() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {/* Handle search */}}>
          <Image source={require('../assets/images/v2_search-small-512.webp')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* Navigate to account/profile */}}>
          <Image source={require('../assets/images/account-icon.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Surface style={styles.surface}>
        <Text style={styles.bodyTitle}>Your Past Bills</Text>
        {/* Render past bills here */}
        </Surface>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => {/* Navigate to friends */}}>
          <Text style={styles.footerButton}> Friends </Text>
        </TouchableOpacity>
        <Button style={styles.footerButton} onPress={() => {/* Navigate to add new bill */}}>
          +
        </Button>
        <Button style={styles.footerButton} onPress={() => {/* Navigate to account/profile */}}>
          Your Account
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginRight: 20,
    marginLeft: 20,
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  bodyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  surface: {
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    alignSelf: 'center',
    padding: 20,
    backgroundColor: '#ffffff', 
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#b2ebf2',
  }
})