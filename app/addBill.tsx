import {View,  StyleSheet, Image, TouchableOpacity} from 'react-native'
import {Text, Button, Surface} from 'react-native-paper'

export default function addBill(){

  return (
  <View style={styles.container} >
    <Surface style={styles.surface}>
    <Text>Add bill</Text>
    </Surface>
  </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', 
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