import React, { useEffect, useState } from 'react';
import { SafeAreaView, Alert, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
import { useFonts, KumbhSans_400Regular, KumbhSans_600SemiBold, KumbhSans_700Bold, KumbhSans_800ExtraBold } from '@expo-google-fonts/kumbh-sans';
import { CaptureView } from './src/components/CaptureView';
import { PreviewView } from './src/components/PreviewView';
import { ResultCard } from './src/components/ResultCard';
import { MultiResultView } from './src/components/MultiResultView';
import { StatsScreen } from './src/components/StatsScreen';
import { GoalsScreen } from './src/components/GoalsScreen';
import { classifyImage } from './src/api/classify';
import { classifyMulti } from './src/api/classifyMulti';
import { storeMemory } from './src/api/backboard';
import { getItemImpact } from './src/lib/impact';
import { saveScan } from './src/lib/history';
import { Classification, ItemImpact, MultiClassification } from './src/types';
import { getSortedCount, incrementSortedCount } from './src/lib/storage';

type Phase = 'capture' | 'preview' | 'result' | 'multi-result' | 'stats' | 'goals';

export default function App() {
  const [fontsLoaded] = useFonts({
    KumbhSans_400Regular,
    KumbhSans_600SemiBold,
    KumbhSans_700Bold,
    KumbhSans_800ExtraBold,
  });

  const [phase, setPhase] = useState<Phase>('capture');
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Classification | null>(null);
  const [multiItems, setMultiItems] = useState<MultiClassification[]>([]);
  const [impact, setImpact] = useState<ItemImpact>({ kwhSaved: 0, co2Saved: 0, weightDiverted: 0 });
  const [sortedCount, setSortedCount] = useState(0);

  useEffect(() => {
    getSortedCount().then(setSortedCount);
  }, []);

  useEffect(() => {
    if (fontsLoaded) setTimeout(() => SplashScreen.hideAsync(), 1800);
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={styles.loading} />;

  const handleImageSelected = (uri: string, base64: string) => {
    setImageUri(uri);
    setImageBase64(base64);
    setPhase('preview');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
      const classification = await classifyImage(dataUrl);
      const itemImpact = getItemImpact(classification.item, classification.category);

      await saveScan({
        id: String(Date.now()),
        timestamp: Date.now(),
        item: classification.item,
        category: classification.category,
        kwhSaved: itemImpact.kwhSaved,
        co2Saved: itemImpact.co2Saved,
        weightDiverted: itemImpact.weightDiverted,
      });

      storeMemory({
        item: classification.item,
        category: classification.category,
        kwhSaved: itemImpact.kwhSaved,
        co2Saved: itemImpact.co2Saved,
        weightDiverted: itemImpact.weightDiverted,
        timestamp: Date.now(),
      });

      const newCount = await incrementSortedCount();
      setResult(classification);
      setImpact(itemImpact);
      setSortedCount(newCount);
      setPhase('result');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not analyze image. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMulti = async () => {
    setLoading(true);
    try {
      const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
      const items = await classifyMulti(dataUrl);

      const now = Date.now();
      for (let i = 0; i < items.length; i++) {
        const imp = getItemImpact(items[i].item, items[i].category);
        await saveScan({
          id: String(now + i),
          timestamp: now,
          item: items[i].item,
          category: items[i].category,
          kwhSaved: imp.kwhSaved,
          co2Saved: imp.co2Saved,
          weightDiverted: imp.weightDiverted,
        });
        storeMemory({
          item: items[i].item,
          category: items[i].category,
          kwhSaved: imp.kwhSaved,
          co2Saved: imp.co2Saved,
          weightDiverted: imp.weightDiverted,
          timestamp: now,
        });
      }
      await incrementSortedCount();
      const newCount = await getSortedCount();

      setMultiItems(items);
      setSortedCount(newCount);
      setPhase('multi-result');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not analyze image. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setMultiItems([]);
    setImageUri('');
    setImageBase64('');
    setPhase('capture');
  };

  return (
    <SafeAreaView style={styles.root}>
      {phase === 'capture' && (
        <CaptureView onImageSelected={handleImageSelected} />
      )}
      {phase === 'preview' && (
        <PreviewView
          imageUri={imageUri}
          loading={loading}
          onAnalyze={handleAnalyze}
          onAnalyzeMulti={handleAnalyzeMulti}
          onDiscard={handleReset}
        />
      )}
      {phase === 'result' && result && (
        <ResultCard
          result={result}
          imageUri={imageUri}
          totalSorted={sortedCount}
          impact={impact}
          onReset={handleReset}
          onViewStats={() => setPhase('stats')}
        />
      )}
      {phase === 'multi-result' && (
        <MultiResultView
          items={multiItems}
          imageUri={imageUri}
          totalSorted={sortedCount}
          onReset={handleReset}
          onViewStats={() => setPhase('stats')}
        />
      )}
      {phase === 'stats' && (
        <StatsScreen onBack={() => setPhase('result')} onViewGoals={() => setPhase('goals')} />
      )}
      {phase === 'goals' && (
        <GoalsScreen onBack={() => setPhase('stats')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#282A36' },
  loading: { flex: 1, backgroundColor: '#282A36' },
});
