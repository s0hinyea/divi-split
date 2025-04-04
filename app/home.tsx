import { View, Text, Button, StyleSheet } from 'react-native'; 
import { useRouter } from 'expo-router'; 

export default function Home() {
  const router = useRouter(); 

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Divi</Text>
      <Text style={styles.subtitle}>Split your bills with ease</Text>
      <View style={styles.button}>
      <Button
      title="Login"
      onPress={() => {router.push('/pick')}}>
      </Button>
      </View>
      </View>
    )
      
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  }
});