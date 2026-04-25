import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Classification, ItemImpact } from '../types';
import { getCategoryMeta } from '../lib/categories';

interface Props {
  result: Classification;
  imageUri: string;
  totalSorted: number;
  impact: ItemImpact;
  onReset: () => void;
  onViewStats: () => void;
}

export const ResultCard: React.FC<Props> = ({ result, imageUri, totalSorted, impact, onReset, onViewStats }) => {
  const meta = getCategoryMeta(result.category);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          <View style={[styles.badge, { backgroundColor: meta.color }]}>
            <Text style={styles.badgeText}>{meta.emoji} {meta.label}</Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>✨ {Math.round(result.confidence)}%</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.detectedLabel}>Detected</Text>
          <Text style={styles.itemName}>{result.item}</Text>

          <View style={[styles.tipBox, { backgroundColor: meta.softColor }]}>
            <Text style={styles.tipLabel}>Disposal Tip</Text>
            <Text style={styles.tipText}>{result.tip}</Text>
          </View>

          {(impact.kwhSaved > 0 || impact.co2Saved > 0) && (
            <View style={styles.impactRow}>
              {impact.kwhSaved > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>⚡ {impact.kwhSaved.toFixed(2)} kWh saved</Text>
                </View>
              )}
              {impact.co2Saved > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>🌿 {impact.co2Saved.toFixed(2)} lbs CO₂ avoided</Text>
                </View>
              )}
              {impact.weightDiverted > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>♻️ {impact.weightDiverted.toFixed(2)} lbs diverted</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.statsBtn} onPress={onViewStats}>
            <Text style={styles.statsBtnText}>📊 View Your Impact</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetBtnText}>↺  Scan Another</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            🌍 You've sorted <Text style={{ fontWeight: '700', color: '#16A34A' }}>{totalSorted}</Text> items correctly
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F0FDF4' },
  card: { borderRadius: 24, backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  imageWrapper: { aspectRatio: 4 / 3, position: 'relative' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  confidenceBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  confidenceText: { fontWeight: '700', fontSize: 12, color: '#111827' },
  body: { padding: 24, gap: 12 },
  detectedLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF' },
  itemName: { fontSize: 24, fontWeight: '800', color: '#111827', textTransform: 'capitalize', marginTop: -4 },
  tipBox: { borderRadius: 16, padding: 16 },
  tipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', color: '#6B7280', marginBottom: 6 },
  tipText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  impactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  impactChip: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  impactChipText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  statsBtn: { backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#16A34A', borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center' },
  statsBtnText: { color: '#16A34A', fontWeight: '700', fontSize: 15 },
  resetBtn: { backgroundColor: '#111827', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
});
