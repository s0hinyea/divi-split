import { StyleSheet } from 'react-native';

 export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollView: {
    flex: 1,
    padding: 16,
    marginTop: 40
  },
  button: {
    marginTop: 50,
    width: '50%',
    alignSelf: 'center',
    marginBottom: 50,
    backgroundColor: '#00acc1' // Aquamarine button
  },
  undoButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00acc1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  undoButton: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#00838f',  // Dark aquamarine text
    textAlign: 'center',
  },
  itemsContainer: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  changeRow:{
    flexDirection: 'row',
    gap: 8
  },
  changeName:{
    flex: 3,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  changePrice:{
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  itemName: {
    fontSize: 16,
    color: '#006064',  // Medium aquamarine text
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00acc1',  // Aquamarine accent
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00838f',  // Dark aquamarine text
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00acc1',  // Aquamarine accent
  },
  deleteAction: {
    backgroundColor: '#ff5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginLeft: 5
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00acc1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
    bottom: 70,
    
  },
  plusIcon: {
      width: 30,
      height: 30,
      resizeMode: 'contain',
      
    },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalSurface: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 5,
    borderWidth: 2,
    borderColor: '#b2ebf2',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00838f',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b2ebf2',
    marginBottom: 15,
    padding: 12,
  },
  modalButton: {
    backgroundColor: '#00acc1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});