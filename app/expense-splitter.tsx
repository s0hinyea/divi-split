import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function ExpenseSplitter() {
  const [restaurantName, setRestaurantName] = useState('');
  const [totalBill, setTotalBill] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [billPerPerson, setBillPerPerson] = useState('');
  const [displayRestaurantName, setDisplayRestaurantName] = useState(false);

  
  function calculateBillSplit(){
    if(!restaurantName || !totalBill || !numberOfPeople){
      alert('Please fill in all fields');
      return;
    }
    
    const billPerPerson = (parseFloat(totalBill) / parseInt(numberOfPeople)).toFixed(2);
     setBillPerPerson(billPerPerson);
     setDisplayRestaurantName(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Restaurant Name</Text>
      <TextInput
      style={styles.input}
      value={restaurantName}
      onChangeText={setRestaurantName}
      placeholder="Enter restaurant name: ">
      </TextInput>
      <Text style={styles.label}>Total bill amount</Text>
      <TextInput 
      style={styles.label}
      value={totalBill}
      onChangeText={setTotalBill}
      placeholder="Enter the total bill amount"
      keyboardType="numeric"
      >
      </TextInput>
      <Text style={styles.label}>Number of people</Text>
      <TextInput 
      style={styles.label}
      value={numberOfPeople}
      onChangeText={setNumberOfPeople}
      keyboardType="numeric"
      placeholder="Enter the total number of people">
      </TextInput>
      <Button  
      title="Calculate"
      onPress={() => {calculateBillSplit()}}>
      </Button>
      {displayRestaurantName && (
        <Text style={styles.result}>
          {`Restaurant Name: ${restaurantName}`}
        </Text>
      )}
      {billPerPerson && (
        <Text style={styles.result}>
          {`Bill per person: ${billPerPerson}`}
        </Text>
      )}  
     </View>
  );

}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    width: '50%'
  },
  result: {
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
});