import React from 'react';
import { View, Image, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  imageUri: string;
  loading: boolean;
  onAnalyze: () => void;
  onDiscard: () => void;
}

export const PreviewView: React.FC<Props> = ({ imageUri, loading, onAnalyze, onDiscard }) => (
  <View style={styles.container}>
    <View style={styles.imageWrapper}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#BD93F9" />
          <Text style={styles.analyzingText}>Analyzing...</Text>
        </View>
      )}
      {!loading && (
        <TouchableOpacity style={styles.discardBtn} onPress={onDiscard}>
          <Text style={styles.discardBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>

    <TouchableOpacity
      style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
      onPress={onAnalyze}
      disabled={loading}
    >
      <Text style={styles.analyzeBtnText}>{loading ? 'Analyzing...' : 'Analyze Item'}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#282A36' },
  imageWrapper: { borderRadius: 24, overflow: 'hidden', aspectRatio: 4 / 3, marginBottom: 20 },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(40,42,54,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: { fontSize: 14, fontFamily: 'KumbhSans_600SemiBold', color: '#F8F8F2' },
  discardBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(40,42,54,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  discardBtnText: { fontSize: 16, color: '#F8F8F2' },
  analyzeBtn: { backgroundColor: '#BD93F9', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnDisabled: { backgroundColor: 'rgba(189,147,249,0.4)' },
  analyzeBtnText: { fontSize: 16, fontFamily: 'KumbhSans_700Bold', color: '#282A36' },
});
