import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

const SUPABASE_URL = 'https://txdpuiukpicwxbzgpbdu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHB1aXVrcGljd3hiemdwYmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzU0MzEsImV4cCI6MjA5MjcxMTQzMX0.KuX4mnOaj8ZOH0eMqv4UkYezyX0sbWy7_mrICOTQ1o0';

export const speak = async (text: string): Promise<void> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) return;
    const { audio } = await response.json();
    if (!audio) return;

    const path = (FileSystem.cacheDirectory ?? '') + 'ecosort_speech.mp3';
    await FileSystem.writeAsStringAsync(path, audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri: path });
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // Silent fail — TTS is an enhancement, not core functionality
  }
};
