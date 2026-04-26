import React from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MultiClassification } from '../types';
import { getCategoryMeta } from '../lib/categories';
import { getItemImpact } from '../lib/impact';
import { speak } from '../lib/speech';

interface Props {
  items: MultiClassification[];
  imageUri: string;
  totalSorted: number;
  onReset: () => void;
}

const OVERLAY_OPACITY: Record<string, string> = {
  recycling: 'rgba(139,233,253,0.25)',
  compost:   'rgba(80,250,123,0.25)',
  landfill:  'rgba(255,184,108,0.25)',
};

const fallbackBbox = (index: number, total: number) => {
  const cols = Math.ceil(Math.sqrt(total));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const size = Math.min(0.35, 0.9 / cols);
  return { x: 0.05 + col * (0.9 / cols), y: 0.05 + row * (0.9 / Math.ceil(total / cols)), width: size, height: size * 1.2 };
};

export const MultiResultView: React.FC<Props> = ({ items, imageUri, totalSorted, onReset }) => {
  const handleSpeak = () => {
    const names = items.map(i => `${i.item}: ${i.category}`).join('. ');
    speak(`${items.length} item${items.length === 1 ? '' : 's'} detected. ${names}.`);
  };

  return (
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    <View style={styles.imageWrapper}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      {items.map((item, i) => {
        const meta = getCategoryMeta(item.category);
        const bbox = item.bbox ?? fallbackBbox(i, items.length);
        if (!bbox) return null;
        return (
          <View
            key={i}
            style={[
              styles.bbox,
              {
                left:   `${bbox.x * 100}%` as any,
                top:    `${bbox.y * 100}%` as any,
                width:  `${bbox.width * 100}%` as any,
                height: `${bbox.height * 100}%` as any,
                borderColor: meta.color,
                backgroundColor: OVERLAY_OPACITY[item.category],
              },
            ]}
          >
            <View style={[styles.bboxLabel, { backgroundColor: meta.color }]}>
              <Text style={styles.bboxLabelText} numberOfLines={1}>
                {meta.emoji} {item.item}
              </Text>
            </View>
          </View>
        );
      })}
    </View>

    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>{items.length} items detected</Text>
        <TouchableOpacity style={styles.speakBtn} onPress={handleSpeak}>
          <Text style={styles.speakBtnText}>🔊</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSub}>🌍 {totalSorted} sorted correctly</Text>
    </View>

    {items.map((item, i) => {
      const meta = getCategoryMeta(item.category);
      const impact = getItemImpact(item.item, item.category);
      return (
        <View key={i} style={styles.row}>
          <View style={[styles.rowDot, { backgroundColor: meta.color }]} />
          <View style={styles.rowInfo}>
            <Text style={styles.rowItem}>{item.item}</Text>
            <Text style={styles.rowMeta}>{meta.label} · {Math.round(item.confidence)}% confidence</Text>
            <Text style={styles.rowTip}>{item.tip}</Text>
            {(impact.kwhSaved > 0 || impact.co2Saved > 0) && (
              <View style={styles.chipRow}>
                {impact.kwhSaved > 0 && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>⚡ {impact.kwhSaved.toFixed(2)} kWh</Text>
                  </View>
                )}
                {impact.co2Saved > 0 && (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>🌿 {impact.co2Saved.toFixed(2)} lbs CO₂</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      );
    })}

    <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
      <Text style={styles.resetBtnText}>↺  Scan Another</Text>
    </TouchableOpacity>

    <View style={{ height: 40 }} />
  </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282A36' },
  imageWrapper: { width: '100%', aspectRatio: 4 / 3, position: 'relative' },
  image: { width: '100%', height: '100%' },
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'visible',
  },
  bboxLabel: {
    position: 'absolute',
    top: -22,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 120,
  },
  bboxLabelText: {
    fontSize: 10,
    fontFamily: 'KumbhSans_700Bold',
    color: '#282A36',
  },
  header: { padding: 20, paddingBottom: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2' },
  headerSub: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', marginTop: 4 },
  speakBtn: { backgroundColor: '#383A47', borderRadius: 10, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  speakBtnText: { fontSize: 16 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#44475A',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
  },
  rowDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
  rowInfo: { flex: 1 },
  rowItem: { fontSize: 15, fontFamily: 'KumbhSans_700Bold', color: '#F8F8F2', textTransform: 'capitalize' },
  rowMeta: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', marginTop: 2 },
  rowTip: { fontSize: 13, fontFamily: 'KumbhSans_400Regular', color: '#F8F8F2', marginTop: 6, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { backgroundColor: 'rgba(189,147,249,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  chipText: { fontSize: 11, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
  resetBtn: {
    backgroundColor: '#BD93F9', borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 16, marginTop: 8,
  },
  resetBtnText: { fontFamily: 'KumbhSans_700Bold', fontSize: 16, color: '#282A36' },
});
