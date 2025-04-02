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
      <Text style={styles.title}>Expense Splitter</Text>
      <Text style={styles.label}>Restaurant Name</Text>
      <TextInput 
      style={styles.input}
      value={restaurantName}
      onChangeText={setRestaurantName}
      placeholder="Enter restaurant name"
      ></TextInput>
      <Text style={styles.label}>Total Bill</Text>
      <TextInput 
      style={styles.input}
      value={totalBill}
      onChangeText={setTotalBill}
      placeholder="Enter total bill"
      keyboardType="numeric"
      ></TextInput>
      <Text style={styles.label}>Number of People</Text>
      <TextInput 
      style={styles.input}
      value={numberOfPeople}
      onChangeText={setNumberOfPeople}
      placeholder="Enter number of people"
      keyboardType="numeric"
      ></TextInput>
      <Button title="Calculate" onPress={() =>{calculateBillSplit()}}></Button>
      <Text style={styles.result}>{displayRestaurantName ? `Restaurant Name: ${restaurantName}` : ''}</Text>
      <Text style={styles.result}>
        {billPerPerson ? `Each person owes $${billPerPerson}` : ''}
      </Text>
    </View>
  );
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
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
  },
  result: {
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
});