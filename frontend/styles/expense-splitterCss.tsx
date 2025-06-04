import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginRight: 20,
    marginLeft: 20,
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  bodyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 5,
    color: 'black',
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
  },
  
  plusIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
  },
  
  modalSurface: {
    height: '100%',
    width: '100%',
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#b2ebf2',
    gap: 15
  },
  
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  
  optionText: {
    fontSize: 18,
    marginLeft: 10,
    color: '#333',
  },
  
  cameraImage: {
    height: 30,
    width: 30,
    resizeMode: 'contain',
  }
})