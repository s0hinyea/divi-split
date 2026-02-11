import { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { handleOCR } from '../utils/ocrUtil';
import { useReceipt } from '../utils/ReceiptContext';
import { useOCR } from '../utils/OCRContext';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guide frame dimensions (receipt-shaped — taller than wide)
const FRAME_WIDTH = SCREEN_WIDTH * 0.82;
const FRAME_HEIGHT = SCREEN_HEIGHT * 0.52;
const FRAME_LEFT = (SCREEN_WIDTH - FRAME_WIDTH) / 2;
const FRAME_TOP = (SCREEN_HEIGHT - FRAME_HEIGHT) / 2 - 40; // Shift up a bit to make room for capture button
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;

type FlashMode = 'off' | 'on' | 'auto';

export default function Scan() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const { updateReceiptData } = useReceipt();
  const { setIsProcessing } = useOCR();

  // Cycle flash: off → on → auto → off
  const cycleFlash = () => {
    setFlash((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  const flashIcon = flash === 'off' ? 'flash-off' : flash === 'on' ? 'flash-on' : 'flash-auto';

  const takePicture = async () => {
    if (!cameraRef.current || capturing || !cameraReady) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (photo?.base64) {
        const base64DataUrl = `data:image/jpeg;base64,${photo.base64}`;
        console.log('Photo captured successfully');
        await handleOCR(base64DataUrl, updateReceiptData, setIsProcessing, router);
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  // ─── Permission states ───
  if (!permission) {
    // Still loading permission status
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.permissionContainer}>
        <MaterialIcons name="camera-alt" size={64} color="#888" />
        <Text style={s.permissionTitle}>Camera Access Needed</Text>
        <Text style={s.permissionSubtext}>
          Divi needs camera access to scan your receipts.
        </Text>
        <TouchableOpacity style={s.permissionButton} onPress={requestPermission}>
          <Text style={s.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backLink} onPress={() => router.back()}>
          <Text style={s.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Camera view ───
  return (
    <View style={s.container}>
      {/* Camera feed */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
        mode="picture"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* ─── Overlay layer (absolutely positioned on top of camera) ─── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

        {/* Semi-transparent mask — top */}
        <View style={[s.mask, { top: 0, left: 0, right: 0, height: FRAME_TOP }]} />
        {/* Mask — bottom */}
        <View style={[s.mask, { top: FRAME_TOP + FRAME_HEIGHT, left: 0, right: 0, bottom: 0 }]} />
        {/* Mask — left */}
        <View style={[s.mask, { top: FRAME_TOP, left: 0, width: FRAME_LEFT, height: FRAME_HEIGHT }]} />
        {/* Mask — right */}
        <View style={[s.mask, { top: FRAME_TOP, right: 0, width: FRAME_LEFT, height: FRAME_HEIGHT }]} />

        {/* Corner brackets */}
        {/* Top-left */}
        <View style={[s.corner, { top: FRAME_TOP, left: FRAME_LEFT, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS }]} />
        {/* Top-right */}
        <View style={[s.corner, { top: FRAME_TOP, left: FRAME_LEFT + FRAME_WIDTH - CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS }]} />
        {/* Bottom-left */}
        <View style={[s.corner, { top: FRAME_TOP + FRAME_HEIGHT - CORNER_SIZE, left: FRAME_LEFT, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS }]} />
        {/* Bottom-right */}
        <View style={[s.corner, { top: FRAME_TOP + FRAME_HEIGHT - CORNER_SIZE, left: FRAME_LEFT + FRAME_WIDTH - CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS }]} />

        {/* Hint text */}
        <View style={[s.hintContainer, { top: FRAME_TOP - 40 }]}>
          <Text style={s.hintText}>Position receipt within the frame</Text>
        </View>

        {/* ─── Top bar: back button & flash toggle ─── */}
        <SafeAreaView style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.topButton}>
            <MaterialIcons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={cycleFlash} style={s.topButton}>
            <MaterialIcons name={flashIcon} size={28} color="white" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* ─── Bottom bar: capture button ─── */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.captureButton, capturing && s.captureButtonDisabled]}
            onPress={takePicture}
            disabled={capturing || !cameraReady}
            activeOpacity={0.7}
          >
            {capturing ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <View style={s.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  // Permission screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#205237',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    color: '#888',
    fontSize: 14,
  },

  // Overlay mask
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },

  // Hint
  hintContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});