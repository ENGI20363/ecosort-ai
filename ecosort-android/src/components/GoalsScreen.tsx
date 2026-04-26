import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Goals, DEFAULT_GOALS, getGoals, saveGoals } from '../lib/goals';
import { getAllScans } from '../lib/history';
import { computeChartData } from '../lib/chartData';
import { ScanRecord } from '../types';

interface Props {
  onBack: () => void;
}

type Metric = 'kwh' | 'co2' | 'weight';

const TABS: { key: Metric; label: string; unit: string; color: string; goalKey: keyof Goals }[] = [
  { key: 'kwh',    label: 'kWh Saved',   unit: 'kWh', color: '#8BE9FD', goalKey: 'kwhTarget'    },
  { key: 'co2',    label: 'CO₂ Avoided', unit: 'lbs', color: '#50FA7B', goalKey: 'co2Target'    },
  { key: 'weight', label: 'Diverted',    unit: 'lbs', color: '#FFB86C', goalKey: 'weightTarget' },
];

const screenWidth = Dimensions.get('window').width;

export const GoalsScreen: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Metric>('kwh');
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [inputValue, setInputValue] = useState(String(DEFAULT_GOALS.kwhTarget));
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [chartData, setChartData] = useState<number[]>([0, 0]);

  useEffect(() => {
    getGoals().then(g => {
      setGoals(g);
      setInputValue(String(g.kwhTarget));
    });
    getAllScans().then(s => setScans(s));
  }, []);

  useEffect(() => {
    setChartData(computeChartData(scans, activeTab));
  }, [scans, activeTab]);

  const tab = TABS.find(t => t.key === activeTab)!;
  const currentGoal = goals[tab.goalKey];
  const currentTotal = chartData[chartData.length - 1] ?? 0;
  const progress = currentGoal > 0 ? Math.min(1, currentTotal / currentGoal) : 0;

  const handleTabChange = async (metric: Metric) => {
    await handleSave();
    setActiveTab(metric);
    const t = TABS.find(t => t.key === metric)!;
    setInputValue(String(goals[t.goalKey]));
  };

  const handleSave = async () => {
    const value = parseFloat(inputValue) || 0;
    const updated = { ...goals, [tab.goalKey]: value };
    setGoals(updated);
    await saveGoals(updated);
  };

  const labels = chartData.map((_, i) => {
    const day = i + 1;
    if (day === 1 || day % 5 === 0 || i === chartData.length - 1) return String(day);
    return '';
  });

  const goalLineData = Array(chartData.length).fill(currentGoal);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { handleSave(); onBack(); }} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Monthly Goals</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && { borderBottomColor: t.color, borderBottomWidth: 2 }]}
              onPress={() => handleTabChange(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Monthly target</Text>
          <View style={styles.goalInputRow}>
            <TextInput
              style={styles.goalInput}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <Text style={styles.goalUnit}>{tab.unit}</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartWrapper}>
          <LineChart
            data={{
              labels,
              datasets: [
                { data: chartData, color: () => tab.color, strokeWidth: 2 },
                { data: goalLineData, color: () => 'rgba(255,255,255,0.25)', strokeWidth: 1 },
              ],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#44475A',
              backgroundGradientFrom: '#44475A',
              backgroundGradientTo: '#383A47',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(248,248,242,${opacity})`,
              labelColor: (opacity = 1) => `rgba(98,114,164,${opacity})`,
              propsForDots: { r: '0' },
              propsForBackgroundLines: { stroke: 'rgba(98,114,164,0.2)' },
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>This month</Text>
            <Text style={[styles.summaryValue, { color: tab.color }]}>
              {currentTotal.toFixed(2)} / {currentGoal.toFixed(2)} {tab.unit}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: tab.color }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}% of goal</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282A36', paddingTop: 48 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { marginRight: 16 },
  backBtnText: { fontSize: 16, fontFamily: 'KumbhSans_600SemiBold', color: '#BD93F9' },
  title: { fontSize: 22, fontFamily: 'KumbhSans_800ExtraBold', color: '#F8F8F2' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#44475A' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4' },
  goalRow: { marginHorizontal: 16, marginBottom: 20 },
  goalLabel: { fontSize: 12, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalInput: { backgroundColor: '#44475A', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 18, fontFamily: 'KumbhSans_700Bold', color: '#F8F8F2', width: 100 },
  goalUnit: { fontSize: 14, fontFamily: 'KumbhSans_400Regular', color: '#6272A4' },
  saveBtn: { backgroundColor: '#BD93F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  saveBtnText: { fontSize: 14, fontFamily: 'KumbhSans_700Bold', color: '#282A36' },
  chartWrapper: { marginHorizontal: 16, marginBottom: 16 },
  summaryCard: { backgroundColor: '#44475A', marginHorizontal: 16, borderRadius: 16, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4' },
  summaryValue: { fontSize: 15, fontFamily: 'KumbhSans_700Bold' },
  progressBar: { height: 8, backgroundColor: '#383A47', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPercent: { fontSize: 12, fontFamily: 'KumbhSans_400Regular', color: '#6272A4', textAlign: 'right' },
});
