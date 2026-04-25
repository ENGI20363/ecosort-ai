import React, { useEffect, useState } from 'react';
import { SafeAreaView, Alert, StyleSheet, View } from 'react-native';
import { useFonts, KumbhSans_400Regular, KumbhSans_600SemiBold, KumbhSans_700Bold, KumbhSans_800ExtraBold } from '@expo-google-fonts/kumbh-sans';
import { CaptureView } from './src/components/CaptureView';
import { PreviewView } from './src/components/PreviewView';
import { ResultCard } from './src/components/ResultCard';
import { StatsScreen } from './src/components/StatsScreen';
import { classifyImage } from './src/api/classify';
import { getItemImpact } from './src/lib/impact';
import { saveScan } from './src/lib/history';
import { Classification, ItemImpact } from './src/types';
import { getSortedCount, incrementSortedCount } from './src/lib/storage';

type Phase = 'capture' | 'preview' | 'result' | 'stats';

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
  const [impact, setImpact] = useState<ItemImpact>({ kwhSaved: 0, co2Saved: 0, weightDiverted: 0 });
  const [sortedCount, setSortedCount] = useState(0);

  useEffect(() => {
    getSortedCount().then(setSortedCount);
  }, []);

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

  const handleReset = () => {
    setResult(null);
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
      {phase === 'stats' && (
        <StatsScreen onBack={() => setPhase('result')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#282A36' },
  loading: { flex: 1, backgroundColor: '#282A36' },
});
