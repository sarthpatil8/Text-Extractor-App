import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { processImageWithMistral, extractStructuredData } from './mistralAPI'; // Import API functions

interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

interface OCRResult {
  raw?: string;
  structured?: any;
  error?: string;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const camera = useRef<any>(null);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (camera.current) {
      try {
        const photo = await camera.current.takePictureAsync({ quality: 0.8, base64: true });
        setCapturedImage(photo);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
      });

      if (!result.canceled) {
        const { uri, width, height} = result.assets[0]; // For Expo SDK 48 or higher
        setCapturedImage({ uri, width, height});
      }
    } catch (error) {
      console.error('Error selecting an image:', error);
      Alert.alert('Error', 'Failed to pick an image from the gallery.');
    }
  }

  async function processWithMistral() {
    if (!capturedImage || !capturedImage.base64) return;

    setProcessing(true);
    try {
      const base64DataUrl = `data:image/jpeg;base64,${capturedImage.base64}`;

      // Process image with Mistral to extract OCR text
      const ocrResponse = await processImageWithMistral(base64DataUrl);
      const ocrText = ocrResponse.choices[0].message.content;

      // Extract structured data from the OCR text
      const structuredResponse = await extractStructuredData(ocrText);
      setOcrResult({
        raw: ocrText,
        structured: JSON.parse(structuredResponse.choices[0].message.content),
      });
    } catch (error: any) {
      console.error('Error processing image:', error);
      setOcrResult({ error: `Failed to process image: ${error.message}` });
      Alert.alert('Error', 'Failed to process image with Mistral API');
    } finally {
      setProcessing(false);
    }
  }

  function resetCamera() {
    setCapturedImage(null);
    setOcrResult(null);
  }

  if (capturedImage) {
    return (
      <ScrollView style={styles.container}>
        <Image source={{ uri: capturedImage.uri }} style={styles.preview} />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={resetCamera}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.processButton]}
            onPress={processWithMistral}
            disabled={processing}
          >
            <Text style={styles.buttonText}>
              {processing ? 'Processing...' : 'Process with OCR'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        {processing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Processing image with Mistral OCR...</Text>
          </View>
        )}

        {ocrResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>OCR Results:</Text>

            {ocrResult.error ? (
              <Text style={styles.errorText}>{ocrResult.error}</Text>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Structured Data:</Text>
                <Text style={styles.resultText}>
                  {JSON.stringify(ocrResult.structured, null, 2)}
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={camera}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  message: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
  bottom: 100,
  left: 0,
  right: 0,
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  
  },
  flipButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
  },
  captureButton: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  preview: {
    width: '100%',
    height: 400,
    resizeMode: 'contain',
  },
  buttonRow: {
    flexDirection: 'column',
  justifyContent: 'space-around',
  padding: 20,
  alignItems: 'center'
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    margin: 5,
  },
  processButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  resultContainer: {
    padding: 15,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 5,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 14,
    color: 'red',
  },
});