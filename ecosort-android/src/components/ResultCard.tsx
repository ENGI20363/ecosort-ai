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
            <Text style={[styles.tipText, { color: meta.color }]}>{result.tip}</Text>
          </View>

          {(impact.kwhSaved > 0 || impact.co2Saved > 0) && (
            <View style={styles.impactRow}>
              {impact.kwhSaved > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>⚡ {impact.kwhSaved.toFixed(2)} kWh</Text>
                </View>
              )}
              {impact.co2Saved > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>🌿 {impact.co2Saved.toFixed(2)} lbs CO₂</Text>
                </View>
              )}
              {impact.weightDiverted > 0 && (
                <View style={styles.impactChip}>
                  <Text style={styles.impactChipText}>♻️ {impact.weightDiverted.toFixed(2)} lbs</Text>
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
            🌍 <Text style={{ fontFamily: 'KumbhSans_700Bold', color: '#BD93F9' }}>{totalSorted}</Text>
            <Text style={styles.footer}> items sorted correctly</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#282A36' },
  card: { borderRadius: 24, backgroundColor: '#44475A', overflow: 'hidden' },
  imageWrapper: { aspectRatio: 4 / 3, position: 'relative' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontFamily: 'KumbhSans_700Bold', fontSize: 13, color: '#282A36' },
  confidenceBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(40,42,54,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  confidenceText: { fontFamily: 'KumbhSans_700Bold', fontSize: 12, color: '#F8F8F2' },
  body: { padding: 20, gap: 12 },
  detectedLabel: { fontSize: 11, fontFamily: 'KumbhSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, color: '#6272A4' },
  itemName: { fontSize: 24, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2', textTransform: 'capitalize' },
  tipBox: { borderRadius: 14, padding: 14 },
  tipLabel: { fontSize: 10, fontFamily: 'KumbhSans_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, color: '#6272A4', marginBottom: 6 },
  tipText: { fontSize: 14, fontFamily: 'KumbhSans_400Regular', lineHeight: 20 },
  impactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  impactChip: { backgroundColor: 'rgba(189,147,249,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  impactChipText: { fontSize: 12, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
  statsBtn: { backgroundColor: '#383A47', borderWidth: 1, borderColor: '#BD93F9', borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center' },
  statsBtnText: { fontFamily: 'KumbhSans_700Bold', fontSize: 15, color: '#BD93F9' },
  resetBtn: { backgroundColor: '#BD93F9', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { fontFamily: 'KumbhSans_700Bold', fontSize: 16, color: '#282A36' },
  footer: { textAlign: 'center', fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4' },
});
