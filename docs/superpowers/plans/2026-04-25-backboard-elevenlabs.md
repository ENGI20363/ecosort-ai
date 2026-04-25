# Backboard + ElevenLabs Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store every scan as a searchable Backboard memory and speak each result aloud via ElevenLabs TTS.

**Architecture:** Three new Supabase Edge Functions act as server-side proxies (API keys never exposed to client). The Android app calls them with the existing Supabase anon key pattern. ElevenLabs audio is returned as base64, written to a temp file, and played with expo-av. Backboard memory writes are fire-and-forget; search powers a new query box on the stats screen.

**Tech Stack:** Supabase Edge Functions (Deno), Backboard REST API, ElevenLabs TTS API, expo-av, expo-file-system

---

## IMPORTANT: Do these before running any tasks

From `C:\Users\jpcarlson\hackaz26\ecosort-ai\`:

```bash
npx supabase secrets set BACKBOARD_API_KEY=$(cat docs/api/backboard/api_key.txt)
npx supabase secrets set ELEVENLABS_API_KEY=$(cat docs/api/elevenlabs/api_key.txt)
```

---

## Task 1: Create and deploy the three Supabase Edge Functions

**Files:**
- Create: `supabase/functions/backboard-store/index.ts`
- Create: `supabase/functions/backboard-search/index.ts`
- Create: `supabase/functions/elevenlabs-speak/index.ts`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\`.

- [ ] **Step 1: Create supabase/functions/backboard-store/index.ts**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASSISTANT_ID = "2dd12281-1fc9-46b1-acc1-48cf5fb3b7b7";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { item, category, kwhSaved, co2Saved, weightDiverted, timestamp } = await req.json();
    const BACKBOARD_API_KEY = Deno.env.get("BACKBOARD_API_KEY") ?? "";

    const date = new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const content = `On ${date}, scanned a ${item} — ${category}. Saved ${Number(kwhSaved).toFixed(2)} kWh and ${Number(co2Saved).toFixed(2)} lbs CO₂. Diverted ${Number(weightDiverted).toFixed(2)} lbs from landfill.`;

    await fetch(`https://app.backboard.io/api/assistants/${ASSISTANT_ID}/memories`, {
      method: "POST",
      headers: { "X-API-Key": BACKBOARD_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ content, metadata: { item, category, kwhSaved, co2Saved, weightDiverted, timestamp } }),
    });
  } catch (_) { /* fire-and-forget — swallow all errors */ }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 2: Create supabase/functions/backboard-search/index.ts**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASSISTANT_ID = "2dd12281-1fc9-46b1-acc1-48cf5fb3b7b7";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return new Response(JSON.stringify({ memories: [], total_count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BACKBOARD_API_KEY = Deno.env.get("BACKBOARD_API_KEY") ?? "";
    const response = await fetch(`https://app.backboard.io/api/assistants/${ASSISTANT_ID}/memories/search`, {
      method: "POST",
      headers: { "X-API-Key": BACKBOARD_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 5 }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_) {
    return new Response(JSON.stringify({ memories: [], total_count: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 3: Create supabase/functions/elevenlabs-speak/index.ts**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text) throw new Error("text required");

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") ?? "";

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    return new Response(JSON.stringify({ audio: base64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

- [ ] **Step 4: Commit the three functions**

```bash
git add supabase/functions/backboard-store/index.ts supabase/functions/backboard-search/index.ts supabase/functions/elevenlabs-speak/index.ts
git commit -m "feat: add backboard-store, backboard-search, elevenlabs-speak edge functions"
```

- [ ] **Step 5: Deploy all three**

```bash
npx supabase functions deploy backboard-store
npx supabase functions deploy backboard-search
npx supabase functions deploy elevenlabs-speak
```
Expected: `Deployed: backboard-store`, `Deployed: backboard-search`, `Deployed: elevenlabs-speak`

---

## Task 2: Android Backboard API module

**Files:**
- Create: `ecosort-android/src/api/backboard.ts`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

No tests — both functions are thin fetch wrappers over external APIs. Integration is verified by running the app.

- [ ] **Step 1: Create src/api/backboard.ts**

```typescript
const SUPABASE_URL = 'https://txdpuiukpicwxbzgpbdu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZHB1aXVrcGljd3hiemdwYmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzU0MzEsImV4cCI6MjA5MjcxMTQzMX0.KuX4mnOaj8ZOH0eMqv4UkYezyX0sbWy7_mrICOTQ1o0';

const HEADERS = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export const storeMemory = (scan: {
  item: string;
  category: string;
  kwhSaved: number;
  co2Saved: number;
  weightDiverted: number;
  timestamp: number;
}): void => {
  fetch(`${SUPABASE_URL}/functions/v1/backboard-store`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(scan),
  }).catch(() => {});
};

export interface MemoryResult {
  id: string;
  content: string;
  score: number;
  created_at: string;
}

export const searchMemories = async (query: string): Promise<MemoryResult[]> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/backboard-search`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  return data.memories ?? [];
};
```

- [ ] **Step 2: Commit**

```bash
git add src/api/backboard.ts
git commit -m "feat: add Backboard API module"
```

---

## Task 3: Android speech module + install dependencies

**Files:**
- Create: `ecosort-android/src/lib/speech.ts`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Install dependencies**

```bash
npx expo install expo-av expo-file-system
```
Expected: packages added to package.json, no errors.

- [ ] **Step 2: Create src/lib/speech.ts**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/speech.ts package.json package-lock.json
git commit -m "feat: add ElevenLabs speech module"
```

---

## Task 4: Update StatsScreen with Backboard search

**Files:**
- Modify: `ecosort-android/src/components/StatsScreen.tsx`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Replace src/components/StatsScreen.tsx**

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { ImpactTotals, ScanRecord } from '../types';
import { getAllScans, getImpactTotals } from '../lib/history';
import { getCategoryMeta } from '../lib/categories';
import { searchMemories, MemoryResult } from '../api/backboard';

interface Props {
  onBack: () => void;
}

export const StatsScreen: React.FC<Props> = ({ onBack }) => {
  const [totals, setTotals] = useState<ImpactTotals>({ kwhSaved: 0, co2Saved: 0, weightDiverted: 0, scanCount: 0 });
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [memories, setMemories] = useState<MemoryResult[]>([]);

  useEffect(() => {
    getImpactTotals().then(setTotals);
    getAllScans().then(setScans);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchMemories(query.trim());
      setMemories(results);
    } catch {
      setMemories([]);
    } finally {
      setSearching(false);
    }
  };

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

        {/* Backboard search */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search your scan history..."
            placeholderTextColor="#6272A4"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
            {searching
              ? <ActivityIndicator size="small" color="#282A36" />
              : <Text style={styles.searchBtnText}>Go</Text>
            }
          </TouchableOpacity>
        </View>

        {memories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {memories.map(m => (
              <View key={m.id} style={styles.memoryRow}>
                <Text style={styles.memoryText}>{m.content}</Text>
                {m.score != null && (
                  <Text style={styles.memoryScore}>{Math.round(m.score * 100)}% match</Text>
                )}
              </View>
            ))}
          </>
        )}

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
  searchRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#44475A', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: 'KumbhSans_400Regular', fontSize: 14, color: '#F8F8F2',
  },
  searchBtn: {
    backgroundColor: '#BD93F9', borderRadius: 14, paddingHorizontal: 16,
    justifyContent: 'center', alignItems: 'center', minWidth: 48,
  },
  searchBtnText: { fontFamily: 'KumbhSans_700Bold', fontSize: 14, color: '#282A36' },
  sectionTitle: { fontSize: 16, fontFamily: 'KumbhSans_700Bold', color: '#F8F8F2', paddingHorizontal: 24, marginBottom: 12 },
  memoryRow: { backgroundColor: '#383A47', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14 },
  memoryText: { fontSize: 13, fontFamily: 'KumbhSans_400Regular', color: '#F8F8F2', lineHeight: 20 },
  memoryScore: { fontSize: 11, fontFamily: 'KumbhSans_600SemiBold', color: '#6272A4', marginTop: 6 },
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StatsScreen.tsx
git commit -m "feat: add Backboard memory search to StatsScreen"
```

---

## Task 5: Update ResultCard and MultiResultView to speak on mount

**Files:**
- Modify: `ecosort-android/src/components/ResultCard.tsx`
- Modify: `ecosort-android/src/components/MultiResultView.tsx`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Add speak import and useEffect to ResultCard**

At the top of `src/components/ResultCard.tsx`, add the import:
```typescript
import { useEffect } from 'react';
import { speak } from '../lib/speech';
```

Inside the `ResultCard` component, add a `useEffect` immediately after the `const meta = ...` line:
```typescript
useEffect(() => {
  speak(`${result.item} — ${result.category}. ${result.tip}`);
}, []);
```

The final file should look like this (complete replacement):

```typescript
import React, { useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Classification, ItemImpact } from '../types';
import { getCategoryMeta } from '../lib/categories';
import { speak } from '../lib/speech';

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

  useEffect(() => {
    speak(`${result.item} — ${result.category}. ${result.tip}`);
  }, []);

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
```

- [ ] **Step 2: Add speak to MultiResultView**

Add these imports at the top of `src/components/MultiResultView.tsx`:
```typescript
import React, { useEffect } from 'react';
import { speak } from '../lib/speech';
```

Add a `useEffect` inside the `MultiResultView` component, immediately after the opening brace (before the return):
```typescript
useEffect(() => {
  const names = items.map(i => `${i.item}: ${i.category}`).join('. ');
  const text = `${items.length} item${items.length === 1 ? '' : 's'} detected. ${names}.`;
  speak(text);
}, []);
```

The top of the component should look like this after the change:
```typescript
export const MultiResultView: React.FC<Props> = ({ items, imageUri, totalSorted, onReset }) => {
  useEffect(() => {
    const names = items.map(i => `${i.item}: ${i.category}`).join('. ');
    const text = `${items.length} item${items.length === 1 ? '' : 's'} detected. ${names}.`;
    speak(text);
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
```

Note: `MultiResultView` is currently written as an arrow function returning JSX directly (`=> (`). You must convert it to use a block body (`=> {`) to add the `useEffect`. The full updated signature and opening:
```typescript
export const MultiResultView: React.FC<Props> = ({ items, imageUri, totalSorted, onReset }) => {
  useEffect(() => {
    const names = items.map(i => `${i.item}: ${i.category}`).join('. ');
    const text = `${items.length} item${items.length === 1 ? '' : 's'} detected. ${names}.`;
    speak(text);
  }, []);

  return (
    <ScrollView ...>
      ...
    </ScrollView>
  );
};
```

- [ ] **Step 3: Run all tests**

```bash
npx jest
```
Expected: 23 tests pass (no tests for speech/backboard — they wrap external APIs).

- [ ] **Step 4: Commit**

```bash
git add src/components/ResultCard.tsx src/components/MultiResultView.tsx
git commit -m "feat: speak result aloud via ElevenLabs on scan completion"
```

---

## Task 6: Update App.tsx to fire-and-forget storeMemory

**Files:**
- Modify: `ecosort-android/App.tsx`

All commands run from `C:\Users\jpcarlson\hackaz26\ecosort-ai\ecosort-android\`.

- [ ] **Step 1: Add storeMemory import to App.tsx**

Add this import near the other API imports:
```typescript
import { storeMemory } from './src/api/backboard';
```

- [ ] **Step 2: Call storeMemory in handleAnalyze**

Inside `handleAnalyze`, after `await saveScan(...)` and before `const newCount = ...`, add:
```typescript
storeMemory({
  item: classification.item,
  category: classification.category,
  kwhSaved: itemImpact.kwhSaved,
  co2Saved: itemImpact.co2Saved,
  weightDiverted: itemImpact.weightDiverted,
  timestamp: Date.now(),
});
```

- [ ] **Step 3: Call storeMemory in handleAnalyzeMulti**

Inside `handleAnalyzeMulti`, inside the `for` loop after `await saveScan(...)`, add:
```typescript
storeMemory({
  item: items[i].item,
  category: items[i].category,
  kwhSaved: imp.kwhSaved,
  co2Saved: imp.co2Saved,
  weightDiverted: imp.weightDiverted,
  timestamp: now,
});
```

- [ ] **Step 4: Run all tests**

```bash
npx jest
```
Expected: 23 tests pass.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat: store each scan as Backboard memory after classification"
```

- [ ] **Step 6: Test on phone**

```bash
npx expo start --clear
```
1. Scan an item — result card should speak the result aloud
2. Scan multiple items — should speak the item count and categories
3. Go to stats screen → type "recycling" in the search box → tap Go → verify results appear
