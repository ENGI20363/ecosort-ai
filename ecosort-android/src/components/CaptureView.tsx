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
        <Text style={styles.primaryBtnText}>📷  Open Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => launch(false)}>
        <Text style={styles.secondaryBtnText}>⬆️  Upload Image</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#282A36' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2' },
  subtitle: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', marginTop: 4 },
  hero: { alignItems: 'center', marginBottom: 48 },
  heroText: { fontSize: 36, fontFamily: 'KumbhSans_800ExtraBold', textAlign: 'center', color: '#F8F8F2', lineHeight: 44 },
  heroSub: { fontSize: 14, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', textAlign: 'center', marginTop: 12, maxWidth: 260, lineHeight: 22 },
  btn: { borderRadius: 16, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#BD93F9' },
  secondaryBtn: { backgroundColor: '#44475A' },
  primaryBtnText: { fontSize: 17, fontFamily: 'KumbhSans_700Bold', color: '#282A36' },
  secondaryBtnText: { fontSize: 17, fontFamily: 'KumbhSans_600SemiBold', color: '#F8F8F2' },
});
