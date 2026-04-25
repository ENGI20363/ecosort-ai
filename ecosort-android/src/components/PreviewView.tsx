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
          <ActivityIndicator size="large" color="#16A34A" />
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
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F0FDF4' },
  imageWrapper: { borderRadius: 24, overflow: 'hidden', aspectRatio: 4 / 3, marginBottom: 20 },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  discardBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  discardBtnText: { fontSize: 16, color: '#374151' },
  analyzeBtn: { backgroundColor: '#16A34A', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center' },
  analyzeBtnDisabled: { backgroundColor: '#86EFAC' },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
