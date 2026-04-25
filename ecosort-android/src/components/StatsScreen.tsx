import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ImpactTotals, ScanRecord } from '../types';
import { getAllScans, getImpactTotals } from '../lib/history';
import { getCategoryMeta } from '../lib/categories';

interface Props {
  onBack: () => void;
}

export const StatsScreen: React.FC<Props> = ({ onBack }) => {
  const [totals, setTotals] = useState<ImpactTotals>({ kwhSaved: 0, co2Saved: 0, weightDiverted: 0, scanCount: 0 });
  const [scans, setScans] = useState<ScanRecord[]>([]);

  useEffect(() => {
    getImpactTotals().then(setTotals);
    getAllScans().then(setScans);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Impact</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard label="kWh Saved"    value={totals.kwhSaved.toFixed(2)}      unit="kWh"   color="#8BE9FD" />
          <StatCard label="CO₂ Avoided"  value={totals.co2Saved.toFixed(2)}      unit="lbs"   color="#50FA7B" />
          <StatCard label="Diverted"     value={totals.weightDiverted.toFixed(2)} unit="lbs"   color="#FFB86C" />
          <StatCard label="Items Sorted" value={String(totals.scanCount)}         unit="total" color="#BD93F9" />
        </View>

        <Text style={styles.sectionTitle}>Scan History</Text>

        {scans.length === 0 && (
          <Text style={styles.emptyText}>No scans yet. Start sorting!</Text>
        )}

        {scans.map(scan => {
          const meta = getCategoryMeta(scan.category);
          const date = new Date(scan.timestamp).toLocaleDateString();
          return (
            <View key={scan.id} style={styles.scanRow}>
              <View style={[styles.scanDot, { backgroundColor: meta.color }]} />
              <View style={styles.scanInfo}>
                <Text style={styles.scanItem}>{scan.item}</Text>
                <Text style={styles.scanMeta}>{meta.label} · {date}</Text>
              </View>
              {scan.kwhSaved > 0 && (
                <Text style={styles.scanStat}>⚡ {scan.kwhSaved.toFixed(2)}</Text>
              )}
              {scan.co2Saved > 0 && scan.kwhSaved === 0 && (
                <Text style={styles.scanStat}>🌿 {scan.co2Saved.toFixed(2)}</Text>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const StatCard: React.FC<{ label: string; value: string; unit: string; color: string }> = ({ label, value, unit, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statUnit}>{unit}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282A36', paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { marginRight: 16 },
  backBtnText: { fontSize: 16, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
  title: { fontSize: 22, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { width: '46%', backgroundColor: '#44475A', borderRadius: 20, padding: 20, alignItems: 'center' },
  statValue: { fontSize: 28, fontFamily: 'KumbhSans_800ExtraBold', lineHeight: 32 },
  statUnit: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', marginTop: 2 },
  statLabel: { fontSize: 11, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 16, fontFamily: 'KumbhSans_700Bold', color: '#F8F8F2', paddingHorizontal: 24, marginBottom: 12 },
  emptyText: { textAlign: 'center', fontFamily: 'KumbhSans_400Regular', color: '#6272A4', fontSize: 14, paddingVertical: 32 },
  scanRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#44475A', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 16,
  },
  scanDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  scanInfo: { flex: 1 },
  scanItem: { fontSize: 14, fontFamily: 'KumbhSans_600SemiBold', color: '#F8F8F2', textTransform: 'capitalize' },
  scanMeta: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', marginTop: 2 },
  scanStat: { fontSize: 12, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
});
