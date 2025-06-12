import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    marginTop: 40
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 10,
  },
  itemPill: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
    alignItems: 'center',
  },
  selectedItemPill: {
    backgroundColor: '#90caf9',
  },
  itemName: {
    fontSize: 14,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
  },
  continueButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  contactName : {
    color: 'green'
  }
}); 