import { View, Text, StyleSheet, Button } from 'react-native';
import {useRouter} from 'expo-router';

export default function Pick(){
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.button}>
            <Button 
            title="Manual"
            onPress={() => {router.push('/expense-splitter')}}>
            </Button>
            <Button 
            title="Scan Receipt"
            onPress={() => {alert('Not implemented yet')}}>
            </Button>
            </View>
           
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        margin: 20,
        gap: 50,
    
    }
});
