import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'; 
import { useRouter } from 'expo-router'; 
import { Text, Button, Surface } from 'react-native-paper';
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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',  // Light aquamarine background
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#00838f',  // Dark aquamarine text
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#006064',  // Medium aquamarine text
  },
  button: {
    marginTop: 50,
    width: '50%',
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: '#00acc1'Z // Aquamarine button
  },
  surface: {
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: '70%',
    width: '90%',
    alignSelf: 'center',
    padding: 20,
    backgroundColor: '#ffffff', 
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#b2ebf2',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  helpButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#00acc1',
    width: 33,
    height: 33,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold'
  }
});