import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  onImageSelected: (uri: string, base64: string) => void;
}

export const CaptureView: React.FC<Props> = ({ onImageSelected }) => {
  const launch = async (camera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    };
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      onImageSelected(asset.uri, asset.base64!);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EcoSort AI</Text>
        <Text style={styles.subtitle}>University of Arizona</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroText}>Sort it right{'\n'}in seconds.</Text>
        <Text style={styles.heroSub}>
          Snap a photo of any item — we'll tell you exactly where it goes.
        </Text>
      </View>

      <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => launch(true)}>
        <Text style={styles.btnText}>📷  Open Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => launch(false)}>
        <Text style={[styles.btnText, styles.secondaryBtnText]}>⬆️  Upload Image</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F0FDF4' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  hero: { alignItems: 'center', marginBottom: 40 },
  heroText: { fontSize: 36, fontWeight: '800', textAlign: 'center', color: '#111827', lineHeight: 44 },
  heroSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 12, maxWidth: 260 },
  btn: { borderRadius: 16, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#16A34A' },
  secondaryBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#D1D5DB' },
  btnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  secondaryBtnText: { color: '#374151' },
});
