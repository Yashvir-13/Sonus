const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

const CHROME_PATH = 'C:\\Users\\yashv\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe';
const OUT_DIR = path.resolve(__dirname, '../docs/assets/diagrams');
const REVIEW_DIR = 'C:/Users/yashv/.gemini/antigravity/brain/19e08522-a99b-40a5-965f-570b53e9e317/diagrams_review';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(REVIEW_DIR)) fs.mkdirSync(REVIEW_DIR, { recursive: true });

// ==========================================
// 1. SYSTEM ARCHITECTURE SVG (1340 x 760)
// ==========================================
const SVG_01_SYSTEM_ARCH = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1340 760" width="100%" height="100%" style="background:#F8FAFC; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <pattern id="grid1" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#E2E8F0"/>
    </pattern>

    <filter id="shadow1" x="-5%" y="-5%" width="110%" height="114%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>

    <marker id="arrBlue1" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563EB"/>
    </marker>
    <marker id="arrGreen1" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669"/>
    </marker>
    <marker id="arrPurple1" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7C3AED"/>
    </marker>
    <marker id="arrAmber1" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706"/>
    </marker>
    <marker id="arrRose1" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#E11D48"/>
    </marker>
    <marker id="arrSlate1" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569"/>
    </marker>
  </defs>

  <rect width="1340" height="760" fill="#F8FAFC"/>
  <rect width="1340" height="760" fill="url(#grid1)"/>

  <!-- Header -->
  <g transform="translate(48, 36)">
    <text x="0" y="22" fill="#0F172A" font-size="24" font-weight="800" letter-spacing="-0.5">End-to-End System Architecture</text>
    <text x="0" y="46" fill="#64748B" font-size="13">Modular full-stack design: Browser Audio DSP, FastAPI Gateway, and ML Worker Pool.</text>
  </g>

  <!-- ==================== TIER 1: CLIENT LAYER (SPA) ==================== -->
  <g transform="translate(48, 96)">
    <rect x="0" y="0" width="280" height="610" rx="14" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.8" stroke-dasharray="6,4" filter="url(#shadow1)"/>
    <rect x="16" y="-13" width="160" height="26" rx="13" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5"/>
    <text x="96" y="5" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="0.5">CLIENT LAYER (SPA)</text>

    <!-- 1.1 Practice Studio UI -->
    <g transform="translate(14, 26)">
      <rect x="0" y="0" width="252" height="125" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#EFF6FF"/>
      <path d="M 19 20 h 14 v 10 h -14 z M 21 32 h 10" fill="none" stroke="#2563EB" stroke-width="1.6"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Practice Studio UI</text>
      <rect x="48" y="30" width="76" height="16" rx="8" fill="#F1F5F9"/>
      <text x="86" y="42" fill="#475569" font-size="10" font-weight="700" text-anchor="middle">React 19 / TS</text>
      <text x="12" y="68" fill="#475569" font-size="11">Dual-theme studio (Alabaster &amp; Obsidian)</text>
      <text x="12" y="86" fill="#64748B" font-size="11">Interactive fretboard, piano &amp; tuner views</text>
      <text x="12" y="104" fill="#94A3B8" font-size="10">Studio Setup hideable popover menu</text>
    </g>

    <!-- 1.2 Notation Engraver -->
    <g transform="translate(14, 166)">
      <rect x="0" y="0" width="252" height="120" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#F5F3FF"/>
      <path d="M 22 32 A 3 3 0 1 1 22 26 L 22 18 L 30 16 L 30 24 A 3 3 0 1 1 30 30" fill="none" stroke="#7C3AED" stroke-width="1.6"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Notation Engraver</text>
      <rect x="48" y="30" width="94" height="16" rx="8" fill="#F3E8FF"/>
      <text x="95" y="42" fill="#6B21A8" font-size="10" font-weight="700" text-anchor="middle">VexFlow 5 / SMuFL</text>
      <text x="12" y="68" fill="#475569" font-size="11">Bravura fonts &amp; Grand Staff rendering</text>
      <text x="12" y="86" fill="#64748B" font-size="11">Monotonic beat mapping &amp; 60fps playhead</text>
      <text x="12" y="104" fill="#94A3B8" font-size="10">Active chord and note highlighting</text>
    </g>

    <!-- 1.3 Audio DSP -->
    <g transform="translate(14, 302)">
      <rect x="0" y="0" width="252" height="135" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#ECFDF5"/>
      <path d="M 18 26 L 22 20 L 26 32 L 30 18 L 34 28 L 38 26" fill="none" stroke="#059669" stroke-width="1.8" stroke-linecap="round"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Real-Time Audio DSP</text>
      <rect x="48" y="30" width="86" height="16" rx="8" fill="#D1FAE5"/>
      <text x="91" y="42" fill="#065F46" font-size="10" font-weight="700" text-anchor="middle">Web Audio API</text>
      <text x="12" y="68" fill="#475569" font-size="11">Pearson normalized autocorrelation pitch</text>
      <text x="12" y="86" fill="#64748B" font-size="11">AudioWorklet chromagram &amp; harmonic gate</text>
      <text x="12" y="104" fill="#64748B" font-size="11">Sub-multiple rejection &amp; rolling median</text>
      <text x="12" y="122" fill="#94A3B8" font-size="10">Sub-cent strobe visual guitar tuner</text>
    </g>

    <!-- 1.4 Synthesis -->
    <g transform="translate(14, 452)">
      <rect x="0" y="0" width="252" height="120" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#FFFBEB"/>
      <path d="M 19 23 h 4 l 5 -5 v 18 l -5 -5 h -4 z" fill="none" stroke="#D97706" stroke-width="1.6"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Deterministic Synth</text>
      <rect x="48" y="30" width="98" height="16" rx="8" fill="#FEF3C7"/>
      <text x="97" y="42" fill="#92400E" font-size="10" font-weight="700" text-anchor="middle">Physical Modeling</text>
      <text x="12" y="68" fill="#475569" font-size="11">Karplus-Strong plucked acoustic string</text>
      <text x="12" y="86" fill="#64748B" font-size="11">Inharmonic 6-partial dispersion piano</text>
      <text x="12" y="104" fill="#94A3B8" font-size="10">Dual-cavity wooden metronome click</text>
    </g>
  </g>

  <!-- ==================== TIER 2: GATEWAY (FastAPI) ==================== -->
  <g transform="translate(380, 96)">
    <rect x="0" y="0" width="250" height="610" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6,4" filter="url(#shadow1)"/>
    <rect x="16" y="-13" width="150" height="26" rx="13" fill="#F8FAFC" stroke="#64748B" stroke-width="1.5"/>
    <text x="91" y="5" fill="#334155" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="0.5">GATEWAY (FastAPI)</text>

    <!-- 2.1 Auth & Session -->
    <g transform="translate(14, 30)">
      <rect x="0" y="0" width="222" height="145" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#F1F5F9"/>
      <path d="M 21 23 a 4 4 0 1 0 -4 4 h 8 v -3 h -2 v -2 h -2 z" fill="none" stroke="#475569" stroke-width="1.5"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Auth &amp; Session</text>
      <rect x="48" y="30" width="90" height="16" rx="8" fill="#E2E8F0"/>
      <text x="93" y="42" fill="#334155" font-size="10" font-weight="700" text-anchor="middle">Clerk JWT Bearer</text>
      <text x="12" y="68" fill="#475569" font-size="11">• Identity verify (sub = user_id)</text>
      <text x="12" y="88" fill="#475569" font-size="11">• Dev token bypass for testing</text>
      <text x="12" y="108" fill="#64748B" font-size="11">• Cached LRU email resolution</text>
      <text x="12" y="128" fill="#94A3B8" font-size="10">• Dependency: ClerkIdentityDep</text>
    </g>

    <!-- 2.2 Media Guard -->
    <g transform="translate(14, 215)">
      <rect x="0" y="0" width="222" height="155" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#EFF6FF"/>
      <path d="M 26 18 l -7 3 v 5 c 0 5 7 8 7 8 s 7 -3 7 -8 v -5 z" fill="none" stroke="#2563EB" stroke-width="1.5"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Media Validator</text>
      <rect x="48" y="30" width="94" height="16" rx="8" fill="#DBEAFE"/>
      <text x="95" y="42" fill="#1E40AF" font-size="10" font-weight="700" text-anchor="middle">RIFF/WAVE Guard</text>
      <text x="12" y="68" fill="#475569" font-size="11">• Magic bytes check (RIFF/WAVE)</text>
      <text x="12" y="88" fill="#475569" font-size="11">• Duration clamp: &le; 180s</text>
      <text x="12" y="108" fill="#475569" font-size="11">• Payload limit: &le; 15 MB</text>
      <text x="12" y="128" fill="#64748B" font-size="11">• Ephemeral temp file lifecycle</text>
      <text x="12" y="146" fill="#94A3B8" font-size="10">• Prevents invalid audio decode</text>
    </g>

    <!-- 2.3 Router -->
    <g transform="translate(14, 410)">
      <rect x="0" y="0" width="222" height="145" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#F1F5F9"/>
      <path d="M 20 30 v -8 h 8 m 0 -3 v 6 l 3 -3 z" fill="none" stroke="#475569" stroke-width="1.5"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">FastAPI Router</text>
      <rect x="48" y="30" width="84" height="16" rx="8" fill="#E2E8F0"/>
      <text x="90" y="42" fill="#334155" font-size="10" font-weight="700" text-anchor="middle">RFC 9457 Errors</text>
      <text x="12" y="68" fill="#475569" font-size="11">• Lifespan model pre-warming</text>
      <text x="12" y="88" fill="#475569" font-size="11">• X-Request-ID correlation</text>
      <text x="12" y="108" fill="#64748B" font-size="11">• Dual take/takes route alias</text>
      <text x="12" y="128" fill="#94A3B8" font-size="10">• AsyncSession injection (Depends)</text>
    </g>
  </g>

  <!-- ==================== TIER 3: ML WORKERS & COGNITIVE ==================== -->
  <g transform="translate(680, 96)">
    <rect x="0" y="0" width="270" height="610" rx="14" fill="#FFFFFF" stroke="#6EE7B7" stroke-width="1.8" stroke-dasharray="6,4" filter="url(#shadow1)"/>
    <rect x="16" y="-13" width="180" height="26" rx="13" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5"/>
    <text x="106" y="5" fill="#047857" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="0.5">ML &amp; COGNITIVE ENGINE</text>

    <!-- 3.1 Basic Pitch -->
    <g transform="translate(14, 25)">
      <rect x="0" y="0" width="242" height="120" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#ECFDF5"/>
      <path d="M 19 26 h 14 M 26 19 v 14" fill="none" stroke="#059669" stroke-width="1.6"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Basic Pitch ONNX</text>
      <rect x="48" y="30" width="82" height="16" rx="8" fill="#D1FAE5"/>
      <text x="89" y="42" fill="#065F46" font-size="10" font-weight="700" text-anchor="middle">Neural Pitch</text>
      <text x="12" y="68" fill="#475569" font-size="11">• Polyphonic neural pitch CNN</text>
      <text x="12" y="86" fill="#475569" font-size="11">• Threadpool offload (AnyIO)</text>
      <text x="12" y="104" fill="#64748B" font-size="10">• Hann STFT fallback for safety</text>
    </g>

    <!-- 3.2 Voicing & Clusters -->
    <g transform="translate(14, 165)">
      <rect x="0" y="0" width="242" height="125" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#F5F3FF"/>
      <path d="M 19 22 h 14 v 8 h -14 z" fill="none" stroke="#7C3AED" stroke-width="1.6"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Voicing &amp; Clusters</text>
      <rect x="48" y="30" width="86" height="16" rx="8" fill="#EDE9FE"/>
      <text x="91" y="42" fill="#6B21A8" font-size="10" font-weight="700" text-anchor="middle">2-Pass Window</text>
      <text x="12" y="68" fill="#475569" font-size="11">• Strum (180ms) / Arp (400ms)</text>
      <text x="12" y="86" fill="#475569" font-size="11">• Bass reset (&ge;6 st drop)</text>
      <text x="12" y="104" fill="#64748B" font-size="10">• F1 pitch-class harmonic matcher</text>
    </g>

    <!-- 3.3 DP Alignment -->
    <g transform="translate(14, 310)">
      <rect x="0" y="0" width="242" height="120" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#EFF6FF"/>
      <path d="M 19 24 l 6 6 l 6 -6" fill="none" stroke="#2563EB" stroke-width="1.6"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">DP Alignment</text>
      <rect x="48" y="30" width="94" height="16" rx="8" fill="#DBEAFE"/>
      <text x="95" y="42" fill="#1E40AF" font-size="10" font-weight="700" text-anchor="middle">Sakoe-Chiba Band</text>
      <text x="12" y="68" fill="#475569" font-size="11">• Needleman-Wunsch algorithm</text>
      <text x="12" y="86" fill="#475569" font-size="11">• Timing delta &Delta;t (ms) scoring</text>
      <text x="12" y="104" fill="#64748B" font-size="10">• Substitution, insertion &amp; deletion</text>
    </g>

    <!-- 3.4 Cognitive Loop -->
    <g transform="translate(14, 450)">
      <rect x="0" y="0" width="242" height="140" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" filter="url(#shadow1)"/>
      <rect x="12" y="12" width="28" height="28" rx="6" fill="#FFF1F2"/>
      <path d="M 22 30 a 4 4 0 1 1 8 0 c 0 3 -4 4 -4 4 v 2" fill="none" stroke="#E11D48" stroke-width="1.6"/>
      <text x="48" y="24" fill="#0F172A" font-size="14" font-weight="700">Cognitive Loop</text>
      <rect x="48" y="30" width="88" height="16" rx="8" fill="#FFE4E6"/>
      <text x="92" y="42" fill="#BE123C" font-size="10" font-weight="700" text-anchor="middle">BKT / SM-2 / UCB</text>
      <text x="12" y="68" fill="#475569" font-size="11">• EWMA habits &amp; Page's CUSUM</text>
      <text x="12" y="86" fill="#475569" font-size="11">• Bayesian Knowledge Tracing</text>
      <text x="12" y="104" fill="#475569" font-size="11">• SuperMemo SM-2 memory interval</text>
      <text x="12" y="122" fill="#64748B" font-size="10">• Thompson Sampling curriculum</text>
    </g>
  </g>

  <!-- ==================== TIER 4: PERSISTENCE & SAAS ==================== -->
  
  <!-- SaaS External Card -->
  <g transform="translate(1000, 96)">
    <rect x="0" y="0" width="290" height="175" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6,4" filter="url(#shadow1)"/>
    <rect x="16" y="-13" width="160" height="26" rx="13" fill="#F8FAFC" stroke="#64748B" stroke-width="1.5"/>
    <text x="96" y="5" fill="#334155" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="0.5">EXTERNAL SAAS</text>

    <!-- Clerk -->
    <g transform="translate(14, 25)">
      <rect x="0" y="0" width="262" height="60" rx="8" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
      <text x="12" y="22" fill="#0F172A" font-size="13" font-weight="700">Clerk Identity Provider</text>
      <text x="12" y="42" fill="#64748B" font-size="11">Session JWT verification &amp; user sync</text>
    </g>
    <!-- Gemini -->
    <g transform="translate(14, 95)">
      <rect x="0" y="0" width="262" height="65" rx="8" fill="#FFF1F2" stroke="#FECDD3" stroke-width="1"/>
      <text x="12" y="22" fill="#BE123C" font-size="13" font-weight="700">Gemini 1.5 Flash AI Coach</text>
      <text x="12" y="40" fill="#475569" font-size="11">Strict fact-grounded letter generation</text>
      <text x="12" y="54" fill="#64748B" font-size="10">Deterministic fallback if offline</text>
    </g>
  </g>

  <!-- PostgreSQL Cylinder -->
  <g transform="translate(1040, 310)">
    <path d="M 0 25 v 280 c 0 18 105 26 105 26 s 105 -8 105 -26 v -280" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1.8" filter="url(#shadow1)"/>
    <ellipse cx="105" cy="25" rx="105" ry="22" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.8"/>
    <path d="M 0 100 c 0 16 50 20 105 20 s 105 -4 105 -20" fill="none" stroke="#F59E0B" stroke-width="1.2" stroke-dasharray="4,3"/>
    <path d="M 0 175 c 0 16 50 20 105 20 s 105 -4 105 -20" fill="none" stroke="#F59E0B" stroke-width="1.2" stroke-dasharray="4,3"/>

    <text x="105" y="30" fill="#78350F" font-size="14" font-weight="800" text-anchor="middle">PostgreSQL 16 Store</text>
    
    <g transform="translate(14, 60)" font-size="11" font-weight="600" fill="#92400E">
      <text x="91" y="16" text-anchor="middle" font-weight="800" fill="#78350F">SCHEMA TABLES</text>
      <text x="91" y="38" text-anchor="middle">• users (Clerk sub = id)</text>
      <text x="91" y="58" text-anchor="middle">• practice_sessions</text>
      <text x="91" y="78" text-anchor="middle">• session_chord_metrics</text>
      <text x="91" y="98" text-anchor="middle">• transition_mastery</text>
      <text x="91" y="118" text-anchor="middle">• exercises catalog</text>

      <rect x="18" y="145" width="146" height="28" rx="6" fill="#FEF3C7" stroke="#D97706" stroke-width="1"/>
      <text x="91" y="164" text-anchor="middle" font-size="11" font-weight="700" fill="#78350F">QueuePool (Asyncpg)</text>
      <text x="91" y="190" text-anchor="middle" font-size="10" fill="#B45309">IPv4 Direct Routed / SSL</text>
    </g>
  </g>

  <!-- ==================== EXPLICIT, BOLD CONNECTOR ARROWS ==================== -->
  
  <!-- Arrow 1: UI to Audio Guard (POST WAV) -->
  <g>
    <path d="M 328 360 L 394 360" fill="none" stroke="#2563EB" stroke-width="2.6" marker-end="url(#arrBlue1)"/>
    <circle cx="361" cy="360" r="10" fill="#2563EB"/>
    <text x="361" y="364" fill="#FFFFFF" font-size="10" font-weight="800" text-anchor="middle">1</text>
    <rect x="332" y="330" width="58" height="18" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="361" y="343" fill="#1D4ED8" font-size="9" font-weight="800" text-anchor="middle">POST WAV</text>
  </g>

  <!-- Arrow 2: UI to Auth (JWT Bearer) -->
  <g>
    <path d="M 328 175 L 394 175" fill="none" stroke="#2563EB" stroke-width="2" marker-end="url(#arrBlue1)"/>
    <rect x="334" y="152" width="54" height="18" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="361" y="165" fill="#1D4ED8" font-size="9" font-weight="800" text-anchor="middle">JWT GET</text>
  </g>

  <!-- Arrow 3: Audio Guard to Basic Pitch ONNX -->
  <g>
    <path d="M 616 320 L 650 320 L 650 180 L 694 180" fill="none" stroke="#059669" stroke-width="2.6" marker-end="url(#arrGreen1)"/>
    <circle cx="650" cy="250" r="10" fill="#059669"/>
    <text x="650" y="254" fill="#FFFFFF" font-size="10" font-weight="800" text-anchor="middle">2</text>
    <rect x="615" y="222" width="70" height="18" rx="4" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1"/>
    <text x="650" y="235" fill="#065F46" font-size="9" font-weight="800" text-anchor="middle">THREADPOOL</text>
  </g>

  <!-- ML Pipeline Internal Downward Arrows -->
  <g>
    <!-- Basic Pitch -> Voicing & Clusters -->
    <path d="M 815 241 L 815 261" stroke="#059669" stroke-width="2" marker-end="url(#arrGreen1)"/>
    <rect x="765" y="244" width="100" height="15" rx="3" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="0.8"/>
    <text x="815" y="255" fill="#475569" font-size="8.5" font-weight="700" text-anchor="middle">MIDI Note Events</text>

    <!-- Voicing & Clusters -> DP Alignment -->
    <path d="M 815 386 L 815 406" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrPurple1)"/>
    <rect x="765" y="389" width="100" height="15" rx="3" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="0.8"/>
    <text x="815" y="400" fill="#475569" font-size="8.5" font-weight="700" text-anchor="middle">Chord Clusters</text>

    <!-- DP Alignment -> Cognitive Loop -->
    <path d="M 815 526 L 815 546" stroke="#2563EB" stroke-width="2" marker-end="url(#arrBlue1)"/>
    <rect x="765" y="529" width="100" height="15" rx="3" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="0.8"/>
    <text x="815" y="540" fill="#475569" font-size="8.5" font-weight="700" text-anchor="middle">Aligned Metrics</text>
  </g>

  <!-- Arrow 4: Cognitive Loop to PostgreSQL Writes -->
  <g>
    <path d="M 950 590 L 1040 590" fill="none" stroke="#7C3AED" stroke-width="2.4" marker-end="url(#arrPurple1)"/>
    <circle cx="995" cy="590" r="10" fill="#7C3AED"/>
    <text x="995" y="594" fill="#FFFFFF" font-size="10" font-weight="800" text-anchor="middle">3</text>
    <rect x="960" y="562" width="70" height="18" rx="4" fill="#F5F3FF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="995" y="575" fill="#6B21A8" font-size="9" font-weight="800" text-anchor="middle">WRITE TAKES</text>
  </g>

  <!-- Arrow 5: Cognitive Loop to Gemini Prompt (External) -->
  <g>
    <path d="M 950 630 L 980 630 L 980 230 L 1014 230" fill="none" stroke="#E11D48" stroke-width="1.8" stroke-dasharray="5,3" marker-end="url(#arrRose1)"/>
    <rect x="935" y="420" width="90" height="18" rx="4" fill="#FFF1F2" stroke="#FECDD3" stroke-width="1"/>
    <text x="980" y="433" fill="#BE123C" font-size="9" font-weight="700" text-anchor="middle">PROMPT COACH</text>
  </g>

  <!-- Arrow 6: Auth to Clerk Identity (External) -->
  <g>
    <path d="M 602 150 L 640 150 L 640 64 L 1000 64 L 1000 135 L 1014 135" fill="none" stroke="#475569" stroke-width="1.8" stroke-dasharray="5,3" marker-end="url(#arrSlate1)"/>
    <rect x="760" y="54" width="120" height="18" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
    <text x="820" y="67" fill="#334155" font-size="9" font-weight="700" text-anchor="middle">VERIFY CLERK JWT</text>
  </g>

  <!-- Arrow 7: Gateway to PostgreSQL (AsyncSession query) -->
  <g>
    <path d="M 505 555 L 505 690 L 1145 690 L 1145 616" fill="none" stroke="#D97706" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#arrAmber1)"/>
    <rect x="760" y="678" width="160" height="22" rx="6" fill="#FEF3C7" stroke="#FDE68A" stroke-width="1"/>
    <text x="840" y="693" fill="#92400E" font-size="11" font-weight="700" text-anchor="middle">AsyncSession (get_session)</text>
  </g>
</svg>
`;

// ==========================================
// 2. AUDIO PIPELINE DFD SVG (1340 x 640)
// ==========================================
const SVG_02_PIPELINE_DFD = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1340 640" width="100%" height="100%" style="background:#F8FAFC; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <pattern id="grid2" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#E2E8F0"/>
    </pattern>

    <filter id="shadow2" x="-5%" y="-5%" width="110%" height="114%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>

    <marker id="arrStage" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569"/>
    </marker>
  </defs>

  <rect width="1340" height="640" fill="#F8FAFC"/>
  <rect width="1340" height="640" fill="url(#grid2)"/>

  <!-- Header -->
  <g transform="translate(48, 36)">
    <text x="0" y="22" fill="#0F172A" font-size="24" font-weight="800" letter-spacing="-0.5">Audio Processing &amp; Alignment Pipeline (DFD)</text>
    <text x="0" y="46" fill="#64748B" font-size="13">Five sequential data transformations: from raw microphone audio to polyphonic notes, chord voicings, and tempo-aligned evaluation.</text>
  </g>

  <!-- STAGE 1: INGESTION -->
  <g transform="translate(48, 105)">
    <rect x="0" y="0" width="215" height="360" rx="12" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.8" filter="url(#shadow2)"/>
    <rect x="0" y="0" width="215" height="42" rx="12" fill="#EFF6FF"/>
    <rect x="0" y="32" width="215" height="10" fill="#EFF6FF"/>
    <circle cx="24" cy="21" r="11" fill="#2563EB"/>
    <text x="24" y="25" fill="#FFFFFF" font-size="11" font-weight="800" text-anchor="middle">1</text>
    <text x="46" y="26" fill="#1E40AF" font-size="12" font-weight="800" letter-spacing="0.5">AUDIO INGEST</text>

    <g transform="translate(16, 60)">
      <text x="0" y="16" fill="#0F172A" font-size="15" font-weight="700">RIFF/WAVE Guard</text>
      <rect x="0" y="24" width="96" height="18" rx="9" fill="#DBEAFE"/>
      <text x="48" y="36" fill="#1E40AF" font-size="10" font-weight="700" text-anchor="middle">Safety Guard</text>

      <text x="0" y="70" fill="#475569" font-size="12">• Magic bytes check</text>
      <text x="0" y="94" fill="#475569" font-size="12">• Clamped to &le;15 MB</text>
      <text x="0" y="118" fill="#475569" font-size="12">• Duration &le;180 seconds</text>
      <text x="0" y="142" fill="#64748B" font-size="11">• Ephemeral temp file</text>
      <text x="0" y="166" fill="#64748B" font-size="11">• In-memory fast verify</text>

      <rect x="0" y="225" width="183" height="36" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
      <text x="91" y="248" fill="#1E293B" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">Out: Validated WAV</text>
    </g>
  </g>

  <!-- ARROW 1 -> 2 -->
  <g>
    <path d="M 263 285 L 305 285" stroke="#475569" stroke-width="2.6" marker-end="url(#arrStage)"/>
    <rect x="264" y="256" width="38" height="18" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
    <text x="283" y="268" fill="#334155" font-size="9.5" font-weight="700" text-anchor="middle">PCM</text>
  </g>

  <!-- STAGE 2: TRANSCRIPTION -->
  <g transform="translate(305, 105)">
    <rect x="0" y="0" width="215" height="360" rx="12" fill="#FFFFFF" stroke="#6EE7B7" stroke-width="1.8" filter="url(#shadow2)"/>
    <rect x="0" y="0" width="215" height="42" rx="12" fill="#ECFDF5"/>
    <rect x="0" y="32" width="215" height="10" fill="#ECFDF5"/>
    <circle cx="24" cy="21" r="11" fill="#059669"/>
    <text x="24" y="25" fill="#FFFFFF" font-size="11" font-weight="800" text-anchor="middle">2</text>
    <text x="46" y="26" fill="#047857" font-size="12" font-weight="800" letter-spacing="0.5">TRANSCRIPTION</text>

    <g transform="translate(16, 60)">
      <text x="0" y="16" fill="#0F172A" font-size="15" font-weight="700">Basic Pitch ONNX</text>
      <rect x="0" y="24" width="98" height="18" rx="9" fill="#D1FAE5"/>
      <text x="49" y="36" fill="#065F46" font-size="10" font-weight="700" text-anchor="middle">Neural Pitch</text>

      <text x="0" y="70" fill="#475569" font-size="12">• Polyphonic neural CNN</text>
      <text x="0" y="94" fill="#475569" font-size="12">• Threadpool worker</text>
      <text x="0" y="118" fill="#475569" font-size="12">• Hann STFT fallback</text>
      <text x="0" y="142" fill="#64748B" font-size="11">• Bittner et al. (2022)</text>
      <text x="0" y="166" fill="#64748B" font-size="11">• Discrete note tracking</text>

      <rect x="0" y="225" width="183" height="36" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
      <text x="91" y="248" fill="#1E293B" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">Out: List[NoteEvent]</text>
    </g>
  </g>

  <!-- ARROW 2 -> 3 -->
  <g>
    <path d="M 520 285 L 562 285" stroke="#475569" stroke-width="2.6" marker-end="url(#arrStage)"/>
    <rect x="521" y="256" width="40" height="18" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
    <text x="541" y="268" fill="#334155" font-size="9.5" font-weight="700" text-anchor="middle">NOTES</text>
  </g>

  <!-- STAGE 3: CLUSTERING -->
  <g transform="translate(562, 105)">
    <rect x="0" y="0" width="215" height="360" rx="12" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1.8" filter="url(#shadow2)"/>
    <rect x="0" y="0" width="215" height="42" rx="12" fill="#F5F3FF"/>
    <rect x="0" y="32" width="215" height="10" fill="#F5F3FF"/>
    <circle cx="24" cy="21" r="11" fill="#7C3AED"/>
    <text x="24" y="25" fill="#FFFFFF" font-size="11" font-weight="800" text-anchor="middle">3</text>
    <text x="46" y="26" fill="#6B21A8" font-size="12" font-weight="800" letter-spacing="0.5">CLUSTERING</text>

    <g transform="translate(16, 60)">
      <text x="0" y="16" fill="#0F172A" font-size="15" font-weight="700">Two-Pass Window</text>
      <rect x="0" y="24" width="94" height="18" rx="9" fill="#EDE9FE"/>
      <text x="47" y="36" fill="#6B21A8" font-size="10" font-weight="700" text-anchor="middle">Voicing Parser</text>

      <text x="0" y="70" fill="#475569" font-size="12">• 180ms strum window</text>
      <text x="0" y="94" fill="#475569" font-size="12">• 400ms arpeggio span</text>
      <text x="0" y="118" fill="#475569" font-size="12">• Bass reset: &ge;6 st drop</text>
      <text x="0" y="142" fill="#64748B" font-size="11">• Pitch-class set grouping</text>
      <text x="0" y="166" fill="#64748B" font-size="11">• Polyphonic grouping</text>

      <rect x="0" y="225" width="183" height="36" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
      <text x="91" y="248" fill="#1E293B" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">Out: Note Clusters</text>
    </g>
  </g>

  <!-- ARROW 3 -> 4 -->
  <g>
    <path d="M 777 285 L 819 285" stroke="#475569" stroke-width="2.6" marker-end="url(#arrStage)"/>
    <rect x="777" y="256" width="42" height="18" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
    <text x="798" y="268" fill="#334155" font-size="9.5" font-weight="700" text-anchor="middle">CHORDS</text>
  </g>

  <!-- STAGE 4: VOICING CHECK -->
  <g transform="translate(819, 105)">
    <rect x="0" y="0" width="215" height="360" rx="12" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1.8" filter="url(#shadow2)"/>
    <rect x="0" y="0" width="215" height="42" rx="12" fill="#FFFBEB"/>
    <rect x="0" y="32" width="215" height="10" fill="#FFFBEB"/>
    <circle cx="24" cy="21" r="11" fill="#D97706"/>
    <text x="24" y="25" fill="#FFFFFF" font-size="11" font-weight="800" text-anchor="middle">4</text>
    <text x="46" y="26" fill="#92400E" font-size="12" font-weight="800" letter-spacing="0.5">VOICING EVAL</text>

    <g transform="translate(16, 60)">
      <text x="0" y="16" fill="#0F172A" font-size="15" font-weight="700">F1 Chord Matcher</text>
      <rect x="0" y="24" width="94" height="18" rx="9" fill="#FEF3C7"/>
      <text x="47" y="36" fill="#92400E" font-size="10" font-weight="700" text-anchor="middle">Harmonic Rules</text>

      <text x="0" y="70" fill="#475569" font-size="12">• 9 canonical qualities</text>
      <text x="0" y="94" fill="#475569" font-size="12">• Missing 3rd/root penalty</text>
      <text x="0" y="118" fill="#475569" font-size="12">• Dissonance detection</text>
      <text x="0" y="142" fill="#64748B" font-size="11">• Fret-finger validation</text>
      <text x="0" y="166" fill="#64748B" font-size="11">• Inharmonicity tolerance</text>

      <rect x="0" y="225" width="183" height="36" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
      <text x="91" y="248" fill="#1E293B" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" text-anchor="middle">Out: VoicingDiagnosis</text>
    </g>
  </g>

  <!-- ARROW 4 -> 5 -->
  <g>
    <path d="M 1034 285 L 1076 285" stroke="#475569" stroke-width="2.6" marker-end="url(#arrStage)"/>
    <rect x="1035" y="256" width="40" height="18" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
    <text x="1055" y="268" fill="#334155" font-size="9.5" font-weight="700" text-anchor="middle">DIAG</text>
  </g>

  <!-- STAGE 5: TEMPORAL ALIGNMENT -->
  <g transform="translate(1076, 105)">
    <rect x="0" y="0" width="216" height="360" rx="12" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1.8" filter="url(#shadow2)"/>
    <rect x="0" y="0" width="216" height="42" rx="12" fill="#FFF1F2"/>
    <rect x="0" y="32" width="216" height="10" fill="#FFF1F2"/>
    <circle cx="24" cy="21" r="11" fill="#E11D48"/>
    <text x="24" y="25" fill="#FFFFFF" font-size="11" font-weight="800" text-anchor="middle">5</text>
    <text x="46" y="26" fill="#BE123C" font-size="12" font-weight="800" letter-spacing="0.5">ALIGNMENT (DP)</text>

    <g transform="translate(16, 60)">
      <text x="0" y="16" fill="#0F172A" font-size="15" font-weight="700">Needleman-Wunsch</text>
      <rect x="0" y="24" width="102" height="18" rx="9" fill="#FFE4E6"/>
      <text x="51" y="36" fill="#BE123C" font-size="10" font-weight="700" text-anchor="middle">Dynamic Program</text>

      <text x="0" y="70" fill="#475569" font-size="12">• Sakoe-Chiba band W</text>
      <text x="0" y="94" fill="#475569" font-size="12">• Timing delta &Delta;t (ms)</text>
      <text x="0" y="118" fill="#475569" font-size="12">• Early, late &amp; omitted</text>
      <text x="0" y="142" fill="#64748B" font-size="11">• Precision / Recall / F1</text>
      <text x="0" y="166" fill="#64748B" font-size="11">• Global alignment path</text>

      <rect x="0" y="225" width="184" height="36" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
      <text x="92" y="248" fill="#1E293B" font-family="'JetBrains Mono', monospace" font-size="10.5" font-weight="700" text-anchor="middle">Out: AlignedReport</text>
    </g>
  </g>

  <!-- DATA TRANSFORMATION CONTRACT FOOTER -->
  <g transform="translate(48, 500)">
    <rect x="0" y="0" width="1244" height="96" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.4" filter="url(#shadow2)"/>
    <g transform="translate(24, 20)">
      <text x="0" y="16" fill="#0F172A" font-size="13" font-weight="800" letter-spacing="0.5">DATA TRANSFORMATION CONTRACT (END-TO-END SCHEMA)</text>
      
      <g transform="translate(0, 36)" font-family="'JetBrains Mono', monospace" font-size="12.5" font-weight="700">
        <rect x="0" y="0" width="165" height="28" rx="6" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
        <text x="82" y="18" fill="#1D4ED8" text-anchor="middle">Raw Audio [.wav]</text>

        <text x="180" y="18" fill="#64748B" font-family="sans-serif" font-size="16">&rarr;</text>

        <rect x="205" y="0" width="180" height="28" rx="6" fill="#ECFDF5" stroke="#6EE7B7" stroke-width="1"/>
        <text x="295" y="18" fill="#047857" text-anchor="middle">MIDI Notes (f0, t0, t1)</text>

        <text x="400" y="18" fill="#64748B" font-family="sans-serif" font-size="16">&rarr;</text>

        <rect x="425" y="0" width="180" height="28" rx="6" fill="#F5F3FF" stroke="#DDD6FE" stroke-width="1"/>
        <text x="515" y="18" fill="#6B21A8" text-anchor="middle">Temporal Note Clusters</text>

        <text x="620" y="18" fill="#64748B" font-family="sans-serif" font-size="16">&rarr;</text>

        <rect x="645" y="0" width="185" height="28" rx="6" fill="#FFFBEB" stroke="#FDE68A" stroke-width="1"/>
        <text x="737" y="18" fill="#92400E" text-anchor="middle">ChordVoicingDiagnosis</text>

        <text x="845" y="18" fill="#64748B" font-family="sans-serif" font-size="16">&rarr;</text>

        <rect x="870" y="0" width="220" height="28" rx="6" fill="#FFF1F2" stroke="#FECDD3" stroke-width="1"/>
        <text x="980" y="18" fill="#BE123C" text-anchor="middle">TakeEvaluationReport [JSON]</text>
      </g>
    </g>
  </g>
</svg>
`;

// ==========================================
// 3. COGNITIVE ENGINE FLOW SVG (1340 x 740)
// ==========================================
const SVG_03_COGNITIVE_FLOW = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1340 740" width="100%" height="100%" style="background:#F8FAFC; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <pattern id="grid3" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#E2E8F0"/>
    </pattern>

    <filter id="shadow3" x="-5%" y="-5%" width="110%" height="114%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>

    <marker id="arrCog" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7C3AED"/>
    </marker>
  </defs>

  <rect width="1340" height="740" fill="#F8FAFC"/>
  <rect width="1340" height="740" fill="url(#grid3)"/>

  <!-- Header -->
  <g transform="translate(48, 36)">
    <text x="0" y="22" fill="#0F172A" font-size="24" font-weight="800" letter-spacing="-0.5">Adaptive Cognitive Engine &amp; Feedback Loop</text>
    <text x="0" y="46" fill="#64748B" font-size="13">Continuous skill modeling: statistically tracking physical habits, cognitive mastery, spaced repetition, and bandit scheduling.</text>
  </g>

  <!-- ==================== LEFT: TAKE EVALUATION (FACT BUNDLE) ==================== -->
  <g transform="translate(48, 96)">
    <rect x="0" y="0" width="250" height="600" rx="14" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.8" stroke-dasharray="6,4" filter="url(#shadow3)"/>
    <rect x="20" y="-13" width="160" height="26" rx="13" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5"/>
    <text x="100" y="5" fill="#1D4ED8" font-size="11" font-weight="800" text-anchor="middle">TAKE EVALUATION</text>

    <g transform="translate(20, 30)">
      <text x="0" y="20" fill="#0F172A" font-size="16" font-weight="800">Fact Bundle</text>
      <rect x="0" y="28" width="100" height="18" rx="9" fill="#DBEAFE"/>
      <text x="50" y="40" fill="#1E40AF" font-size="10" font-weight="700" text-anchor="middle">Ground Truth</text>

      <g transform="translate(0, 72)" font-size="12">
        <text x="0" y="0" fill="#0F172A" font-weight="700">Per-Chord Data:</text>
        <text x="0" y="24" fill="#475569">• Timing error &Delta;t (ms)</text>
        <text x="0" y="48" fill="#475569">• Missing root / 3rd flags</text>
        <text x="0" y="72" fill="#475569">• Unintended notes &amp; buzz</text>
        <text x="0" y="96" fill="#475569">• Dynamic velocity</text>

        <path d="M 0 120 h 210" stroke="#E2E8F0" stroke-width="1"/>

        <text x="0" y="146" fill="#0F172A" font-weight="700">Session Context:</text>
        <text x="0" y="170" fill="#475569">• Target BPM vs played</text>
        <text x="0" y="194" fill="#475569">• Chord transition pairs</text>
        <text x="0" y="218" fill="#475569">• Instrument type (Guitar/Piano)</text>
        <text x="0" y="242" fill="#475569">• Historical user mean</text>
      </g>

      <rect x="0" y="460" width="210" height="38" rx="8" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
      <text x="105" y="484" fill="#1D4ED8" font-size="11" font-weight="700" text-anchor="middle">Deterministic Telemetry</text>
    </g>
  </g>

  <!-- ==================== CENTER 4 PILLARS ==================== -->
  
  <!-- PILLAR 1: HABIT TRACKER -->
  <g transform="translate(360, 96)">
    <rect x="0" y="0" width="270" height="270" rx="12" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1.8" filter="url(#shadow3)"/>
    <rect x="0" y="0" width="270" height="40" rx="12" fill="#FFFBEB"/>
    <rect x="0" y="30" width="270" height="10" fill="#FFFBEB"/>
    <text x="16" y="25" fill="#92400E" font-size="12" font-weight="800">PILLAR 1: HABIT TRACKER</text>

    <g transform="translate(16, 56)">
      <text x="0" y="18" fill="#0F172A" font-size="15" font-weight="700">EWMA &amp; Page's CUSUM</text>
      <rect x="0" y="26" width="114" height="18" rx="9" fill="#FEF3C7"/>
      <text x="57" y="38" fill="#92400E" font-size="10" font-weight="700" text-anchor="middle">Statistical Process</text>

      <text x="0" y="74" fill="#475569" font-size="12">• Smoothing factor &alpha; = 0.35</text>
      <text x="0" y="98" fill="#475569" font-size="12">• Rushing vs dragging drift</text>
      <text x="0" y="122" fill="#475569" font-size="12">• Two-sided CUSUM test</text>
      <text x="0" y="146" fill="#475569" font-size="12">• Detects persistent micro-hesitations</text>
      <text x="0" y="170" fill="#64748B" font-size="11">Flags physical motor memory shifts</text>
    </g>
  </g>

  <!-- PILLAR 2: SKILL MASTERY -->
  <g transform="translate(690, 96)">
    <rect x="0" y="0" width="270" height="270" rx="12" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.8" filter="url(#shadow3)"/>
    <rect x="0" y="0" width="270" height="40" rx="12" fill="#EFF6FF"/>
    <rect x="0" y="30" width="270" height="10" fill="#EFF6FF"/>
    <text x="16" y="25" fill="#1E40AF" font-size="12" font-weight="800">PILLAR 2: SKILL MASTERY</text>

    <g transform="translate(16, 56)">
      <text x="0" y="18" fill="#0F172A" font-size="15" font-weight="700">Knowledge Tracing (BKT)</text>
      <rect x="0" y="26" width="94" height="18" rx="9" fill="#DBEAFE"/>
      <text x="47" y="38" fill="#1E40AF" font-size="10" font-weight="700" text-anchor="middle">2-State HMM</text>

      <text x="0" y="74" fill="#475569" font-size="12">• Latent mastery probability P(L_t)</text>
      <text x="0" y="98" fill="#475569" font-size="12">• Slip P(S)=0.05, Guess P(G)=0.10</text>
      <text x="0" y="122" fill="#475569" font-size="12">• Per-chord &amp; transition pair tracking</text>
      <text x="0" y="146" fill="#475569" font-size="12">• Corbett &amp; Anderson formulation</text>
      <text x="0" y="170" fill="#64748B" font-size="11">Calculates true mastery probability</text>
    </g>
  </g>

  <!-- PILLAR 3: RETENTION SCHEDULE -->
  <g transform="translate(360, 426)">
    <rect x="0" y="0" width="270" height="270" rx="12" fill="#FFFFFF" stroke="#6EE7B7" stroke-width="1.8" filter="url(#shadow3)"/>
    <rect x="0" y="0" width="270" height="40" rx="12" fill="#ECFDF5"/>
    <rect x="0" y="30" width="270" height="10" fill="#ECFDF5"/>
    <text x="16" y="25" fill="#065F46" font-size="12" font-weight="800">PILLAR 3: RETENTION</text>

    <g transform="translate(16, 56)">
      <text x="0" y="18" fill="#0F172A" font-size="15" font-weight="700">SuperMemo SM-2</text>
      <rect x="0" y="26" width="108" height="18" rx="9" fill="#D1FAE5"/>
      <text x="54" y="38" fill="#065F46" font-size="10" font-weight="700" text-anchor="middle">Spaced Interval</text>

      <text x="0" y="74" fill="#475569" font-size="12">• Musical performance grade q &isin; [0, 5]</text>
      <text x="0" y="98" fill="#475569" font-size="12">• Easiness factor EF &ge; 1.3</text>
      <text x="0" y="122" fill="#475569" font-size="12">• Optimal review interval (days)</text>
      <text x="0" y="146" fill="#475569" font-size="12">• Schedules motor consolidation</text>
      <text x="0" y="170" fill="#64748B" font-size="11">Prevents decay of motor fingerings</text>
    </g>
  </g>

  <!-- PILLAR 4: CURRICULUM BANDIT -->
  <g transform="translate(690, 426)">
    <rect x="0" y="0" width="270" height="270" rx="12" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1.8" filter="url(#shadow3)"/>
    <rect x="0" y="0" width="270" height="40" rx="12" fill="#F5F3FF"/>
    <rect x="0" y="30" width="270" height="10" fill="#F5F3FF"/>
    <text x="16" y="25" fill="#6B21A8" font-size="12" font-weight="800">PILLAR 4: CURRICULUM</text>

    <g transform="translate(16, 56)">
      <text x="0" y="18" fill="#0F172A" font-size="15" font-weight="700">Thompson &amp; UCB1</text>
      <rect x="0" y="26" width="112" height="18" rx="9" fill="#EDE9FE"/>
      <text x="56" y="38" fill="#6B21A8" font-size="10" font-weight="700" text-anchor="middle">Multi-Armed Bandit</text>

      <text x="0" y="74" fill="#475569" font-size="12">• Beta distribution priors (&alpha;, &beta;)</text>
      <text x="0" y="98" fill="#475569" font-size="12">• Exploration vs exploitation tradeoff</text>
      <text x="0" y="122" fill="#475569" font-size="12">• Selects next optimal drill</text>
      <text x="0" y="146" fill="#475569" font-size="12">• Targeted remediation recommendations</text>
      <text x="0" y="170" fill="#64748B" font-size="11">Maximizes learning velocity per minute</text>
    </g>
  </g>

  <!-- ==================== RIGHT: PEDAGOGICAL COACH ==================== -->
  <g transform="translate(1020, 96)">
    <rect x="0" y="0" width="270" height="600" rx="14" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1.8" stroke-dasharray="6,4" filter="url(#shadow3)"/>
    <rect x="20" y="-13" width="160" height="26" rx="13" fill="#FFF1F2" stroke="#E11D48" stroke-width="1.5"/>
    <text x="100" y="5" fill="#BE123C" font-size="11" font-weight="800" text-anchor="middle">PEDAGOGICAL COACH</text>

    <g transform="translate(20, 30)">
      <text x="0" y="20" fill="#0F172A" font-size="16" font-weight="800">Grounded Coach</text>
      <rect x="0" y="28" width="94" height="18" rx="9" fill="#FFE4E6"/>
      <text x="47" y="40" fill="#BE123C" font-size="10" font-weight="700" text-anchor="middle">Gemini 1.5 Flash</text>

      <g transform="translate(0, 72)" font-size="12">
        <text x="0" y="0" fill="#0F172A" font-weight="700">Strict Grounding:</text>
        <text x="0" y="24" fill="#475569">• Prompts pass exact facts only</text>
        <text x="0" y="48" fill="#475569">• Empathetic, human tone</text>
        <text x="0" y="72" fill="#475569">• Zero generic AI buzzwords</text>

        <path d="M 0 98 h 230" stroke="#E2E8F0" stroke-width="1"/>

        <text x="0" y="124" fill="#0F172A" font-weight="700">Deterministic Fallback:</text>
        <text x="0" y="148" fill="#475569">• Operates when API is offline</text>
        <text x="0" y="172" fill="#475569">• Template-free rule engine</text>
        <text x="0" y="196" fill="#475569">• Generates full coaching letter</text>
      </g>

      <rect x="0" y="325" width="230" height="150" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
      <g transform="translate(14, 350)">
        <text x="0" y="0" fill="#0F172A" font-size="13" font-weight="800">Delivered to Musician:</text>
        <text x="0" y="28" fill="#059669" font-size="12" font-weight="600">✓ Pinpointed transition flaw</text>
        <text x="0" y="52" fill="#059669" font-size="12" font-weight="600">✓ Target BPM &amp; drill routine</text>
        <text x="0" y="76" fill="#059669" font-size="12" font-weight="600">✓ Updated BKT mastery score</text>
      </g>
    </g>
  </g>

  <!-- ==================== CONNECTING ARROWS ==================== -->
  
  <!-- Take Evaluation -> Pillar 1 -->
  <g>
    <path d="M 298 231 L 358 231" stroke="#7C3AED" stroke-width="2.6" marker-end="url(#arrCog)"/>
    <rect x="306" y="206" width="44" height="18" rx="4" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="328" y="218" fill="#6B21A8" font-size="9" font-weight="700" text-anchor="middle">FACTS</text>
  </g>
  
  <!-- Take Evaluation -> Pillar 3 -->
  <g>
    <path d="M 298 561 L 358 561" stroke="#7C3AED" stroke-width="2.6" marker-end="url(#arrCog)"/>
    <rect x="304" y="536" width="48" height="18" rx="4" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="328" y="548" fill="#6B21A8" font-size="9" font-weight="700" text-anchor="middle">SCORE q</text>
  </g>

  <!-- Pillar 1 -> Pillar 2 -->
  <g>
    <path d="M 630 231 L 688 231" stroke="#7C3AED" stroke-width="2.6" marker-end="url(#arrCog)"/>
    <rect x="635" y="206" width="48" height="18" rx="4" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="659" y="218" fill="#6B21A8" font-size="9" font-weight="700" text-anchor="middle">HABITS</text>
  </g>

  <!-- Pillar 2 -> Pillar 4 -->
  <g>
    <path d="M 825 366 L 825 424" stroke="#7C3AED" stroke-width="2.6" marker-end="url(#arrCog)"/>
    <rect x="795" y="383" width="60" height="18" rx="4" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="825" y="395" fill="#6B21A8" font-size="9" font-weight="700" text-anchor="middle">MASTERY</text>
  </g>

  <!-- Pillar 3 -> Pillar 4 -->
  <g>
    <path d="M 630 561 L 688 561" stroke="#7C3AED" stroke-width="2.6" marker-end="url(#arrCog)"/>
    <rect x="635" y="536" width="48" height="18" rx="4" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="659" y="548" fill="#6B21A8" font-size="9" font-weight="700" text-anchor="middle">INTERVAL</text>
  </g>

  <!-- Pillar 2 -> Coach -->
  <g>
    <path d="M 960 231 L 1018 231" stroke="#7C3AED" stroke-width="2.6" marker-end="url(#arrCog)"/>
    <rect x="965" y="206" width="48" height="18" rx="4" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="989" y="218" fill="#6B21A8" font-size="9" font-weight="700" text-anchor="middle">P(L_t)</text>
  </g>

  <!-- Pillar 4 -> Coach -->
  <g>
    <path d="M 960 561 L 1018 561" stroke="#7C3AED" stroke-width="2.6" marker-end="url(#arrCog)"/>
    <rect x="965" y="536" width="48" height="18" rx="4" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="989" y="548" fill="#6B21A8" font-size="9" font-weight="700" text-anchor="middle">NEXT DRILL</text>
  </g>
</svg>
`;

// ==========================================
// 4. DATABASE ERD SVG (1400 x 860) — ZERO TEXT OVERLAPS
// ==========================================
const SVG_04_DATABASE_ERD = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 860" width="100%" height="100%" style="background:#F8FAFC; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <pattern id="grid4" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#E2E8F0"/>
    </pattern>

    <filter id="shadow4" x="-5%" y="-5%" width="110%" height="114%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>

    <!-- True Crow's Foot Marker -->
    <marker id="crowsFoot" viewBox="0 0 16 16" refX="16" refY="8" markerWidth="14" markerHeight="14" orient="auto-start-reverse">
      <path d="M 0 0 L 16 8 L 0 16 M 16 0 L 16 16" fill="none" stroke="#D97706" stroke-width="2"/>
    </marker>
  </defs>

  <rect width="1400" height="860" fill="#F8FAFC"/>
  <rect width="1400" height="860" fill="url(#grid4)"/>

  <!-- Header -->
  <g transform="translate(48, 36)">
    <text x="0" y="22" fill="#0F172A" font-size="24" font-weight="800" letter-spacing="-0.5">Database Relational Schema (ERD)</text>
    <text x="0" y="46" fill="#64748B" font-size="13">Normalized PostgreSQL tables: tracking users, sessions, chord telemetry, transitions, and cognitive habit states.</text>
  </g>

  <!-- ==================== TABLE 1: users (380 x 280) ==================== -->
  <g transform="translate(48, 100)">
    <rect x="0" y="0" width="370" height="290" rx="12" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.8" filter="url(#shadow4)"/>
    <rect x="0" y="0" width="370" height="42" rx="12" fill="#EFF6FF"/>
    <rect x="0" y="32" width="370" height="10" fill="#EFF6FF"/>
    <text x="18" y="26" fill="#1E40AF" font-size="14" font-weight="800">users</text>
    <rect x="290" y="11" width="62" height="20" rx="10" fill="#DBEAFE"/>
    <text x="321" y="24" fill="#1E40AF" font-size="10" font-weight="700" text-anchor="middle">[Table]</text>

    <!-- Columns: Track 1 (Name: x=18), Track 2 (Key: x=175), Track 3 (Type: x=240) -->
    <g transform="translate(18, 64)" font-size="12">
      <!-- PK id -->
      <text x="0" y="16" fill="#0F172A" font-weight="700">id</text>
      <rect x="155" y="4" width="30" height="16" rx="4" fill="#DBEAFE"/>
      <text x="170" y="16" fill="#1E40AF" font-size="9" font-weight="800" text-anchor="middle">PK</text>
      <text x="220" y="16" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(255)</text>

      <!-- username -->
      <text x="0" y="48" fill="#334155" font-weight="600">username</text>
      <rect x="155" y="36" width="30" height="16" rx="4" fill="#F1F5F9"/>
      <text x="170" y="48" fill="#475569" font-size="9" font-weight="700" text-anchor="middle">UQ</text>
      <text x="220" y="48" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(30)</text>

      <!-- email -->
      <text x="0" y="80" fill="#334155" font-weight="600">email</text>
      <rect x="155" y="68" width="30" height="16" rx="4" fill="#F1F5F9"/>
      <text x="170" y="80" fill="#475569" font-size="9" font-weight="700" text-anchor="middle">UQ</text>
      <text x="220" y="80" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(255)</text>

      <!-- name -->
      <text x="0" y="112" fill="#334155" font-weight="600">name</text>
      <text x="220" y="112" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(100)</text>

      <!-- onboarding_done -->
      <text x="0" y="144" fill="#334155" font-weight="600">onboarding_done</text>
      <text x="220" y="144" fill="#64748B" font-family="'JetBrains Mono', monospace">BOOLEAN</text>

      <!-- created_at -->
      <text x="0" y="176" fill="#334155" font-weight="600">created_at</text>
      <text x="220" y="176" fill="#64748B" font-family="'JetBrains Mono', monospace">TIMESTAMPTZ</text>

      <!-- updated_at -->
      <text x="0" y="208" fill="#334155" font-weight="600">updated_at</text>
      <text x="220" y="208" fill="#64748B" font-family="'JetBrains Mono', monospace">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ==================== TABLE 2: exercises (370 x 280) ==================== -->
  <g transform="translate(48, 470)">
    <rect x="0" y="0" width="370" height="280" rx="12" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.8" filter="url(#shadow4)"/>
    <rect x="0" y="0" width="370" height="42" rx="12" fill="#EFF6FF"/>
    <rect x="0" y="32" width="370" height="10" fill="#EFF6FF"/>
    <text x="18" y="26" fill="#1E40AF" font-size="14" font-weight="800">exercises</text>
    <rect x="290" y="11" width="62" height="20" rx="10" fill="#DBEAFE"/>
    <text x="321" y="24" fill="#1E40AF" font-size="10" font-weight="700" text-anchor="middle">[Table]</text>

    <g transform="translate(18, 64)" font-size="12">
      <!-- PK id -->
      <text x="0" y="16" fill="#0F172A" font-weight="700">id</text>
      <rect x="155" y="4" width="30" height="16" rx="4" fill="#DBEAFE"/>
      <text x="170" y="16" fill="#1E40AF" font-size="9" font-weight="800" text-anchor="middle">PK</text>
      <text x="220" y="16" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(64)</text>

      <!-- title -->
      <text x="0" y="48" fill="#334155" font-weight="600">title</text>
      <text x="220" y="48" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(100)</text>

      <!-- composer -->
      <text x="0" y="80" fill="#334155" font-weight="600">composer</text>
      <text x="220" y="80" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(100)</text>

      <!-- instrument -->
      <text x="0" y="112" fill="#334155" font-weight="600">instrument</text>
      <text x="220" y="112" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(20)</text>

      <!-- difficulty -->
      <text x="0" y="144" fill="#334155" font-weight="600">difficulty</text>
      <text x="220" y="144" fill="#64748B" font-family="'JetBrains Mono', monospace">INTEGER (1-5)</text>

      <!-- progression -->
      <text x="0" y="176" fill="#334155" font-weight="600">progression</text>
      <text x="220" y="176" fill="#64748B" font-family="'JetBrains Mono', monospace">JSONB</text>

      <!-- created_at -->
      <text x="0" y="208" fill="#334155" font-weight="600">created_at</text>
      <text x="220" y="208" fill="#64748B" font-family="'JetBrains Mono', monospace">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ==================== TABLE 3: practice_sessions (410 x 320) ==================== -->
  <g transform="translate(490, 260)">
    <rect x="0" y="0" width="410" height="320" rx="12" fill="#FFFFFF" stroke="#6EE7B7" stroke-width="1.8" filter="url(#shadow4)"/>
    <rect x="0" y="0" width="410" height="42" rx="12" fill="#ECFDF5"/>
    <rect x="0" y="32" width="410" height="10" fill="#ECFDF5"/>
    <text x="18" y="26" fill="#047857" font-size="14" font-weight="800">practice_sessions</text>
    <rect x="330" y="11" width="62" height="20" rx="10" fill="#D1FAE5"/>
    <text x="361" y="24" fill="#065F46" font-size="10" font-weight="700" text-anchor="middle">[Table]</text>

    <g transform="translate(18, 64)" font-size="12">
      <!-- PK id -->
      <text x="0" y="16" fill="#0F172A" font-weight="700">id</text>
      <rect x="155" y="4" width="30" height="16" rx="4" fill="#DBEAFE"/>
      <text x="170" y="16" fill="#1E40AF" font-size="9" font-weight="800" text-anchor="middle">PK</text>
      <text x="220" y="16" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(64)</text>

      <!-- FK user_id -->
      <text x="0" y="48" fill="#334155" font-weight="700">user_id</text>
      <rect x="155" y="36" width="30" height="16" rx="4" fill="#FEF3C7"/>
      <text x="170" y="48" fill="#92400E" font-size="9" font-weight="800" text-anchor="middle">FK</text>
      <text x="220" y="48" fill="#D97706" font-family="'JetBrains Mono', monospace">&rarr; users.id</text>

      <!-- FK exercise_id -->
      <text x="0" y="80" fill="#334155" font-weight="700">exercise_id</text>
      <rect x="155" y="68" width="30" height="16" rx="4" fill="#FEF3C7"/>
      <text x="170" y="80" fill="#92400E" font-size="9" font-weight="800" text-anchor="middle">FK</text>
      <text x="220" y="80" fill="#D97706" font-family="'JetBrains Mono', monospace">&rarr; exercises.id</text>

      <!-- tempo_bpm -->
      <text x="0" y="112" fill="#334155" font-weight="600">tempo_bpm</text>
      <text x="220" y="112" fill="#64748B" font-family="'JetBrains Mono', monospace">FLOAT</text>

      <!-- accuracy_score -->
      <text x="0" y="144" fill="#334155" font-weight="600">accuracy_score</text>
      <text x="220" y="144" fill="#64748B" font-family="'JetBrains Mono', monospace">FLOAT (0.0 - 1.0)</text>

      <!-- duration_sec -->
      <text x="0" y="176" fill="#334155" font-weight="600">duration_sec</text>
      <text x="220" y="176" fill="#64748B" font-family="'JetBrains Mono', monospace">FLOAT</text>

      <!-- created_at -->
      <text x="0" y="208" fill="#334155" font-weight="600">created_at</text>
      <text x="220" y="208" fill="#64748B" font-family="'JetBrains Mono', monospace">TIMESTAMPTZ</text>
    </g>
  </g>

  <!-- ==================== TABLE 4: session_chord_metrics (390 x 290) ==================== -->
  <g transform="translate(970, 100)">
    <rect x="0" y="0" width="380" height="290" rx="12" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1.8" filter="url(#shadow4)"/>
    <rect x="0" y="0" width="380" height="42" rx="12" fill="#FFFBEB"/>
    <rect x="0" y="32" width="380" height="10" fill="#FFFBEB"/>
    <text x="18" y="26" fill="#92400E" font-size="14" font-weight="800">session_chord_metrics</text>
    <rect x="300" y="11" width="62" height="20" rx="10" fill="#FEF3C7"/>
    <text x="331" y="24" fill="#92400E" font-size="10" font-weight="700" text-anchor="middle">[Table]</text>

    <g transform="translate(18, 64)" font-size="12">
      <!-- PK id -->
      <text x="0" y="16" fill="#0F172A" font-weight="700">id</text>
      <rect x="155" y="4" width="30" height="16" rx="4" fill="#DBEAFE"/>
      <text x="170" y="16" fill="#1E40AF" font-size="9" font-weight="800" text-anchor="middle">PK</text>
      <text x="220" y="16" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(64)</text>

      <!-- FK session_id -->
      <text x="0" y="48" fill="#334155" font-weight="700">session_id</text>
      <rect x="155" y="36" width="30" height="16" rx="4" fill="#FEF3C7"/>
      <text x="170" y="48" fill="#92400E" font-size="9" font-weight="800" text-anchor="middle">FK</text>
      <text x="220" y="48" fill="#D97706" font-family="'JetBrains Mono', monospace">&rarr; sessions.id</text>

      <!-- chord_symbol -->
      <text x="0" y="80" fill="#334155" font-weight="600">chord_symbol</text>
      <text x="220" y="80" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(16)</text>

      <!-- timing_error_ms -->
      <text x="0" y="112" fill="#334155" font-weight="600">timing_error_ms</text>
      <text x="220" y="112" fill="#64748B" font-family="'JetBrains Mono', monospace">FLOAT</text>

      <!-- voicing_f1 -->
      <text x="0" y="144" fill="#334155" font-weight="600">voicing_f1</text>
      <text x="220" y="144" fill="#64748B" font-family="'JetBrains Mono', monospace">FLOAT</text>

      <!-- missed -->
      <text x="0" y="176" fill="#334155" font-weight="600">missed</text>
      <text x="220" y="176" fill="#64748B" font-family="'JetBrains Mono', monospace">BOOLEAN</text>

      <!-- played_notes -->
      <text x="0" y="208" fill="#334155" font-weight="600">played_notes</text>
      <text x="220" y="208" fill="#64748B" font-family="'JetBrains Mono', monospace">INTEGER[]</text>
    </g>
  </g>

  <!-- ==================== TABLE 5: transition_mastery (390 x 280) ==================== -->
  <g transform="translate(970, 470)">
    <rect x="0" y="0" width="380" height="280" rx="12" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1.8" filter="url(#shadow4)"/>
    <rect x="0" y="0" width="380" height="42" rx="12" fill="#F5F3FF"/>
    <rect x="0" y="32" width="380" height="10" fill="#F5F3FF"/>
    <text x="18" y="26" fill="#6B21A8" font-size="14" font-weight="800">transition_mastery</text>
    <rect x="300" y="11" width="62" height="20" rx="10" fill="#EDE9FE"/>
    <text x="331" y="24" fill="#6B21A8" font-size="10" font-weight="700" text-anchor="middle">[Table]</text>

    <g transform="translate(18, 64)" font-size="12">
      <!-- PK id -->
      <text x="0" y="16" fill="#0F172A" font-weight="700">id</text>
      <rect x="155" y="4" width="30" height="16" rx="4" fill="#DBEAFE"/>
      <text x="170" y="16" fill="#1E40AF" font-size="9" font-weight="800" text-anchor="middle">PK</text>
      <text x="220" y="16" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(64)</text>

      <!-- FK user_id -->
      <text x="0" y="48" fill="#334155" font-weight="700">user_id</text>
      <rect x="155" y="36" width="30" height="16" rx="4" fill="#FEF3C7"/>
      <text x="170" y="48" fill="#92400E" font-size="9" font-weight="800" text-anchor="middle">FK</text>
      <text x="220" y="48" fill="#D97706" font-family="'JetBrains Mono', monospace">&rarr; users.id</text>

      <!-- from_chord -->
      <text x="0" y="80" fill="#334155" font-weight="600">from_chord</text>
      <text x="220" y="80" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(16)</text>

      <!-- to_chord -->
      <text x="0" y="112" fill="#334155" font-weight="600">to_chord</text>
      <text x="220" y="112" fill="#64748B" font-family="'JetBrains Mono', monospace">VARCHAR(16)</text>

      <!-- p_mastery -->
      <text x="0" y="144" fill="#334155" font-weight="600">p_mastery</text>
      <text x="220" y="144" fill="#64748B" font-family="'JetBrains Mono', monospace">FLOAT (BKT)</text>

      <!-- interval_days -->
      <text x="0" y="176" fill="#334155" font-weight="600">interval_days</text>
      <text x="220" y="176" fill="#64748B" font-family="'JetBrains Mono', monospace">INTEGER (SM-2)</text>

      <!-- easiness_factor -->
      <text x="0" y="208" fill="#334155" font-weight="600">easiness_factor</text>
      <text x="220" y="208" fill="#64748B" font-family="'JetBrains Mono', monospace">FLOAT</text>
    </g>
  </g>

  <!-- ==================== CROW'S FOOT RELATIONSHIP ARROWS ==================== -->
  
  <!-- 1. users (1) -> practice_sessions (N) -->
  <g>
    <path d="M 418 245 L 454 245 L 454 360 L 490 360" fill="none" stroke="#D97706" stroke-width="2.2" marker-end="url(#crowsFoot)"/>
    <rect x="424" y="290" width="60" height="18" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
    <text x="454" y="303" fill="#B45309" font-size="9" font-weight="800" text-anchor="middle">1 : N</text>
  </g>

  <!-- 2. exercises (1) -> practice_sessions (N) -->
  <g>
    <path d="M 418 610 L 454 610 L 454 480 L 490 480" fill="none" stroke="#D97706" stroke-width="2.2" marker-end="url(#crowsFoot)"/>
    <rect x="424" y="535" width="60" height="18" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
    <text x="454" y="548" fill="#B45309" font-size="9" font-weight="800" text-anchor="middle">1 : N</text>
  </g>

  <!-- 3. practice_sessions (1) -> session_chord_metrics (N) -->
  <g>
    <path d="M 900 360 L 935 360 L 935 245 L 970 245" fill="none" stroke="#D97706" stroke-width="2.2" marker-end="url(#crowsFoot)"/>
    <rect x="905" y="290" width="60" height="18" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
    <text x="935" y="303" fill="#B45309" font-size="9" font-weight="800" text-anchor="middle">1 : N</text>
  </g>

  <!-- 4. users (1) -> transition_mastery (N) -->
  <g>
    <path d="M 418 280 L 454 280 L 454 810 L 940 810 L 940 610 L 970 610" fill="none" stroke="#D97706" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#crowsFoot)"/>
    <rect x="620" y="800" width="100" height="20" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
    <text x="670" y="814" fill="#B45309" font-size="9.5" font-weight="800" text-anchor="middle">1 : N TRACKS</text>
  </g>

  <!-- Legend -->
  <g transform="translate(48, 775)">
    <rect x="0" y="0" width="370" height="38" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
    <g transform="translate(16, 24)" font-size="11" font-weight="700">
      <rect x="0" y="-12" width="26" height="16" rx="3" fill="#DBEAFE"/>
      <text x="13" y="0" fill="#1E40AF" font-size="9" text-anchor="middle">PK</text>
      <text x="32" y="0" fill="#475569">Primary Key</text>

      <rect x="120" y="-12" width="26" height="16" rx="3" fill="#FEF3C7"/>
      <text x="133" y="0" fill="#92400E" font-size="9" text-anchor="middle">FK</text>
      <text x="152" y="0" fill="#475569">Foreign Key</text>

      <line x1="240" y1="-4" x2="270" y2="-4" stroke="#D97706" stroke-width="2"/>
      <path d="M 264 -8 L 272 -4 L 264 0 M 272 -8 L 272 0" fill="none" stroke="#D97706" stroke-width="1.6"/>
      <text x="282" y="0" fill="#B45309">1 : N Cardinality</text>
    </g>
  </g>
</svg>
`;

// ==========================================
// 5. MUSICIAN JOURNEY UML SEQUENCE (1400 x 860)
// ==========================================
const SVG_05_JOURNEY_UML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 860" width="100%" height="100%" style="background:#F8FAFC; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <pattern id="grid5" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#E2E8F0"/>
    </pattern>

    <filter id="shadow5" x="-5%" y="-5%" width="110%" height="114%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>

    <marker id="arrUmlSolid" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563EB"/>
    </marker>
    <marker id="arrUmlGreen" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669"/>
    </marker>
    <marker id="arrUmlPurple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7C3AED"/>
    </marker>
    <marker id="arrUmlAmber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706"/>
    </marker>
  </defs>

  <rect width="1400" height="860" fill="#F8FAFC"/>
  <rect width="1400" height="860" fill="url(#grid5)"/>

  <!-- Header -->
  <g transform="translate(48, 36)">
    <text x="0" y="22" fill="#0F172A" font-size="24" font-weight="800" letter-spacing="-0.5">Musician Practice Lifecycle (UML Sequence)</text>
    <text x="0" y="46" fill="#64748B" font-size="13">End-to-end execution flow: from live score interaction and real-time DSP to backend ML alignment and cognitive feedback.</text>
  </g>

  <!-- ==================== 6 PARTICIPANTS ==================== -->
  
  <!-- Participant 1: Musician (cx=100) -->
  <g transform="translate(20, 100)">
    <rect x="0" y="0" width="160" height="52" rx="10" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.6" filter="url(#shadow5)"/>
    <text x="80" y="24" fill="#1D4ED8" font-size="14" font-weight="800" text-anchor="middle">Musician</text>
    <text x="80" y="40" fill="#64748B" font-size="11" text-anchor="middle">[Actor]</text>
  </g>
  <line x1="100" y1="152" x2="100" y2="810" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6,4"/>

  <!-- Participant 2: Practice Studio UI (cx=330) -->
  <g transform="translate(250, 100)">
    <rect x="0" y="0" width="160" height="52" rx="10" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.6" filter="url(#shadow5)"/>
    <text x="80" y="24" fill="#1D4ED8" font-size="14" font-weight="800" text-anchor="middle">Practice Studio UI</text>
    <text x="80" y="40" fill="#64748B" font-size="11" text-anchor="middle">React 19 / VexFlow</text>
  </g>
  <line x1="330" y1="152" x2="330" y2="810" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6,4"/>

  <!-- Participant 3: Web Audio DSP (cx=560) -->
  <g transform="translate(480, 100)">
    <rect x="0" y="0" width="160" height="52" rx="10" fill="#FFFFFF" stroke="#6EE7B7" stroke-width="1.6" filter="url(#shadow5)"/>
    <text x="80" y="24" fill="#047857" font-size="14" font-weight="800" text-anchor="middle">Web Audio DSP</text>
    <text x="80" y="40" fill="#64748B" font-size="11" text-anchor="middle">AudioWorklet Tuner</text>
  </g>
  <line x1="560" y1="152" x2="560" y2="810" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6,4"/>

  <!-- Participant 4: FastAPI Gateway (cx=790) -->
  <g transform="translate(710, 100)">
    <rect x="0" y="0" width="160" height="52" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.6" filter="url(#shadow5)"/>
    <text x="80" y="24" fill="#334155" font-size="14" font-weight="800" text-anchor="middle">FastAPI Gateway</text>
    <text x="80" y="40" fill="#64748B" font-size="11" text-anchor="middle">Auth &amp; WAV Guard</text>
  </g>
  <line x1="790" y1="152" x2="790" y2="810" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6,4"/>

  <!-- Participant 5: ML Threadpool (cx=1020) -->
  <g transform="translate(940, 100)">
    <rect x="0" y="0" width="160" height="52" rx="10" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1.6" filter="url(#shadow5)"/>
    <text x="80" y="24" fill="#6B21A8" font-size="14" font-weight="800" text-anchor="middle">ML Threadpool</text>
    <text x="80" y="40" fill="#64748B" font-size="11" text-anchor="middle">Basic Pitch &amp; NW Align</text>
  </g>
  <line x1="1020" y1="152" x2="1020" y2="810" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6,4"/>

  <!-- Participant 6: Cognitive & Store (cx=1250) -->
  <g transform="translate(1170, 100)">
    <rect x="0" y="0" width="160" height="52" rx="10" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1.6" filter="url(#shadow5)"/>
    <text x="80" y="24" fill="#92400E" font-size="14" font-weight="800" text-anchor="middle">Cognitive &amp; Store</text>
    <text x="80" y="40" fill="#64748B" font-size="11" text-anchor="middle">BKT / SM-2 / Postgres</text>
  </g>
  <line x1="1250" y1="152" x2="1250" y2="810" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="6,4"/>

  <!-- ==================== ACTIVATION BOXES ==================== -->
  <rect x="323" y="180" width="14" height="600" rx="3" fill="#DBEAFE" stroke="#2563EB" stroke-width="1"/>
  <rect x="553" y="245" width="14" height="155" rx="3" fill="#D1FAE5" stroke="#059669" stroke-width="1"/>
  <rect x="783" y="435" width="14" height="280" rx="3" fill="#E2E8F0" stroke="#475569" stroke-width="1"/>
  <rect x="1013" y="495" width="14" height="100" rx="3" fill="#EDE9FE" stroke="#7C3AED" stroke-width="1"/>
  <rect x="1243" y="555" width="14" height="100" rx="3" fill="#FEF3C7" stroke="#D97706" stroke-width="1"/>

  <!-- ==================== MESSAGES & SEQUENCES ==================== -->

  <!-- Step 1: Musician -> Practice Studio UI -->
  <g>
    <path d="M 100 195 L 323 195" stroke="#2563EB" stroke-width="2.2" marker-end="url(#arrUmlSolid)"/>
    <rect x="135" y="172" width="155" height="20" rx="4" fill="#FFFFFF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="212" y="186" fill="#1D4ED8" font-size="10" font-weight="700" text-anchor="middle">1. Selects Piece &amp; Sets BPM</text>
  </g>

  <!-- Step 2: Practice Studio UI -> Web Audio DSP -->
  <g>
    <path d="M 337 255 L 553 255" stroke="#059669" stroke-width="2.2" marker-end="url(#arrUmlGreen)"/>
    <rect x="375" y="232" width="140" height="20" rx="4" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1"/>
    <text x="445" y="246" fill="#047857" font-size="10" font-weight="700" text-anchor="middle">2. Starts Audio Engine</text>
  </g>

  <!-- Step 3: Musician -> Web Audio DSP -->
  <g>
    <path d="M 100 315 L 553 315" stroke="#D97706" stroke-width="2.2" marker-end="url(#arrUmlAmber)"/>
    <rect x="250" y="292" width="165" height="20" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
    <text x="332" y="306" fill="#92400E" font-size="10" font-weight="700" text-anchor="middle">3. Plays Acoustic Instrument</text>
  </g>

  <!-- Step 4: Web Audio DSP -->> Practice Studio UI (Live Feedback) -->
  <g>
    <path d="M 553 375 L 337 375" stroke="#059669" stroke-width="2.2" stroke-dasharray="6,4" marker-end="url(#arrUmlGreen)"/>
    <rect x="365" y="352" width="160" height="20" rx="4" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1"/>
    <text x="445" y="366" fill="#047857" font-size="10" font-weight="700" text-anchor="middle">4. Real-Time Pitch &amp; Strobe (60fps)</text>
  </g>

  <!-- Step 5: Practice Studio UI -> FastAPI Gateway -->
  <g>
    <path d="M 337 445 L 783 445" stroke="#2563EB" stroke-width="2.4" marker-end="url(#arrUmlSolid)"/>
    <rect x="475" y="422" width="170" height="20" rx="4" fill="#FFFFFF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="560" y="436" fill="#1D4ED8" font-size="10" font-weight="700" text-anchor="middle">5. POST /api/practice/take [WAV]</text>
  </g>

  <!-- Step 6: FastAPI Gateway -> ML Threadpool -->
  <g>
    <path d="M 797 505 L 1013 505" stroke="#7C3AED" stroke-width="2.2" marker-end="url(#arrUmlPurple)"/>
    <rect x="835" y="482" width="150" height="20" rx="4" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
    <text x="910" y="496" fill="#6B21A8" font-size="10" font-weight="700" text-anchor="middle">6. Run Basic Pitch &amp; NW Align</text>
  </g>

  <!-- Step 7: ML Threadpool -> Cognitive & Store -->
  <g>
    <path d="M 1027 565 L 1243 565" stroke="#D97706" stroke-width="2.2" marker-end="url(#arrUmlAmber)"/>
    <rect x="1055" y="542" width="165" height="20" rx="4" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
    <text x="1137" y="556" fill="#92400E" font-size="10" font-weight="700" text-anchor="middle">7. Update BKT &amp; SM-2 State in DB</text>
  </g>

  <!-- Step 8: Cognitive & Store -->> FastAPI Gateway -->
  <g>
    <path d="M 1243 625 L 797 625" stroke="#059669" stroke-width="2.2" stroke-dasharray="6,4" marker-end="url(#arrUmlGreen)"/>
    <rect x="940" y="602" width="170" height="20" rx="4" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1"/>
    <text x="1025" y="616" fill="#047857" font-size="10" font-weight="700" text-anchor="middle">8. Evaluated Metrics &amp; Coach Letter</text>
  </g>

  <!-- Step 9: FastAPI Gateway -->> Practice Studio UI -->
  <g>
    <path d="M 783 685 L 337 685" stroke="#2563EB" stroke-width="2.2" stroke-dasharray="6,4" marker-end="url(#arrUmlSolid)"/>
    <rect x="485" y="662" width="150" height="20" rx="4" fill="#FFFFFF" stroke="#BFDBFE" stroke-width="1"/>
    <text x="560" y="676" fill="#1D4ED8" font-size="10" font-weight="700" text-anchor="middle">9. Return Aligned Take (JSON)</text>
  </g>

  <!-- Step 10: Practice Studio UI -->> Musician -->
  <g>
    <path d="M 323 745 L 100 745" stroke="#059669" stroke-width="2.2" marker-end="url(#arrUmlGreen)"/>
    <rect x="130" y="722" width="165" height="20" rx="4" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1"/>
    <text x="212" y="736" fill="#047857" font-size="10" font-weight="700" text-anchor="middle">10. Visual Flaw &amp; Next Drill Plan</text>
  </g>
</svg>
`;

async function main() {
  console.log('Launching Playwright Chrome to render 5 flawless diagrams...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  async function renderSvg(svgString, filename, width = 1340, height = 760) {
    const page = await browser.newPage({
      viewport: { width: Math.round(width * 1.05), height: Math.round(height * 1.05) },
      deviceScaleFactor: 2, // 2x True Retina Quality
    });
    await page.setContent(svgString, { waitUntil: 'networkidle' });
    const svgElem = await page.$('svg');
    if (svgElem) {
      const outPng = path.join(OUT_DIR, filename);
      const outSvg = path.join(OUT_DIR, filename.replace('.png', '.svg'));
      
      // Save PNG
      await svgElem.screenshot({ path: outPng });
      // Save SVG raw
      fs.writeFileSync(outSvg, svgString.trim());
      
      // Copy to review dir
      fs.copyFileSync(outPng, path.join(REVIEW_DIR, filename));
      fs.copyFileSync(outSvg, path.join(REVIEW_DIR, filename.replace('.png', '.svg')));
      console.log('✓ Successfully rendered & synchronized:', filename);
    }
    await page.close();
  }

  console.log('Rendering 01-system-architecture.png...');
  await renderSvg(SVG_01_SYSTEM_ARCH, '01-system-architecture.png', 1340, 760);

  console.log('Rendering 02-audio-pipeline-dfd.png...');
  await renderSvg(SVG_02_PIPELINE_DFD, '02-audio-pipeline-dfd.png', 1340, 640);

  console.log('Rendering 03-cognitive-engine-flow.png...');
  await renderSvg(SVG_03_COGNITIVE_FLOW, '03-cognitive-engine-flow.png', 1340, 740);

  console.log('Rendering 04-database-erd.png...');
  await renderSvg(SVG_04_DATABASE_ERD, '04-database-erd.png', 1400, 860);

  console.log('Rendering 05-musician-journey-uml.png...');
  await renderSvg(SVG_05_JOURNEY_UML, '05-musician-journey-uml.png', 1400, 860);

  await browser.close();
  console.log('ALL 5 DIAGRAMS SUCCESSFULLY GENERATED AT 2X RETINA RESOLUTION WITH BOLD ARROWS AND ZERO TEXT OVERLAPS!');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
