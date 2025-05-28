import {View, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import {Text} from 'react-native-paper';

export const loadingOCR = (loading: boolean) => { 
  if(loading){
  return (  
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="blue" />
          <Text>Processing...</Text>  
        </>
      ) : (
        <Text> </Text>
      )}
    </View>
  );
  }     
}