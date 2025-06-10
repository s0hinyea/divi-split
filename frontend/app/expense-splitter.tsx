import {View, Modal, StyleSheet, Image, TouchableOpacity, Touchable, TouchableWithoutFeedback} from 'react-native'
import {CameraView, CameraType, useCameraPermissions} from 'expo-camera';
import {Text, Button, Surface} from 'react-native-paper'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { styles } from '../styles/expense-splitterCss'
import { ocrTest} from '../scripts/manual'
import { useReceipt} from '../utils/ReceiptContext'
import { useOCR} from '../utils/OCRContext'
import { handleOCR } from '../utils/ocrUtil'


export default function MainPage() {
  const router = useRouter()
  const[visible, setVisible] = useState(false)
  const { updateReceiptData } = useReceipt();
  const { setIsProcessing } = useOCR();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {/* Handle search */}}>
          <Image source={require('../assets/images/v2_search-small-512.webp')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* Navigate to account/profile */}}>
          <Image source={require('../assets/images/account-icon.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Surface style={styles.surface}>
        <Text style={styles.bodyTitle}>Your Past Bills</Text>
        {/* Render past bills here */}
        </Surface>
      </View>

  <Modal animationType='slide' transparent={true} visible={visible} onRequestClose={() => setVisible(false)}>
  <TouchableWithoutFeedback onPress={() => setVisible(false)}>
    <View style={styles.modalContainer}>
      <Surface style={styles.modalSurface}>
        {/* Scan Option */}
      

        <TouchableOpacity style={styles.optionButton} onPress={() => { setVisible(false) , router.push('/scan') }}>
          <Image style={styles.cameraImage} source={require('../assets/images/camera-icon.png')} />
          <Text style={styles.optionText}>Scan Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={() => { setVisible(false) , router.push('/library') }}>
          <Image style={styles.cameraImage} source={require('../assets/images/camera-icon.png')} />
          <Text style={styles.optionText}>Pick From Photos</Text>
        </TouchableOpacity>
        
        {/* Manual Entry Option */}
        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={async () => {
            setVisible(false);
            await handleOCR(ocrTest, updateReceiptData, setIsProcessing);
          }}
        >
          <Text style={styles.optionText}>Manual</Text>
        </TouchableOpacity>
      </Surface>
    </View>
  </TouchableWithoutFeedback>
</Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => {/* Navigate to friends */}}>
          <Text style={styles.footerButton}> Friends </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusButton} onPress={() => {setVisible(true)}}>
  <Image source={require('../assets/images/plus.png')} style={styles.plusIcon} />
</TouchableOpacity>

        <Button style={styles.footerButton} onPress={() => {/* Navigate to account/profile */}}>
          <Text style={styles.footerButton}> Your Account </Text>
        </Button>
      </View>
    </View>
  )
}

