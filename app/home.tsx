import { View, Text, Button, StyleSheet } from 'react-native'; 
import { useRouter } from 'expo-router'; 

<<<<<<< HEAD
export default function Home() {
=======
export default function Home(){
>>>>>>> fd9869f4a97418bb3fcf589878d6f3f16dec8db0
  const router = useRouter(); 

  return (
    <View style={styles.container}>
<<<<<<< HEAD
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
=======
      <Text style={StyleSheet.title}>Divi</Text>
      <
  )


}

const styles = StyleSheet.create({
  
>>>>>>> fd9869f4a97418bb3fcf589878d6f3f16dec8db0
});