import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'; 
import { useRouter } from 'expo-router'; 
import { Text, Button, Surface } from 'react-native-paper';
import { styles } from '../styles/homeCss'

export default function Home() {
  const router = useRouter(); 

  return (
    
    <View style={styles.container}>
      <TouchableOpacity 
      style = {styles.helpButton}
      onPress={() => {router.push('/help')}}>
        <Text style={styles.helpButtonText}>?</Text>
      </TouchableOpacity>
        <Surface style={styles.surface}>
          <Image style={styles.logo} source={require('../assets/images/reciept-icon.png')}></Image>
          <Text variant="headlineLarge" style={styles.title}>D I V I</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Split your bills with ease</Text>
          <Button 
          mode="contained"
          onPress={() => {router.push('/expense-splitter')}}
          style={styles.button}>Login</Button>
        </Surface>
    </View>
  )
}


