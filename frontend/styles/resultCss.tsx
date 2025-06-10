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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    height: 200
  },
  modalSurface: {
    width: '100%',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  footerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderColor: '#e0f7fa',
    borderWidth: 4
  },
  footerIcon: {
  width: 24,
  height: 24,
  resizeMode: 'contain',
},
continueButton: {
  width: 60,
  height: 60,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 30,
  backgroundColor: '#f5f5f5',
  borderColor: '#e0f7fa',
  borderWidth: 4
},
continueIcon: {
width: 30,
height: 30,
resizeMode: 'contain',
}
});