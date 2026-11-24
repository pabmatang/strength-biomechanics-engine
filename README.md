# CHΔNCE — Biomechanical & Athletic Engineering Engine

[![CI Quality Gate](https://github.com/chance-biomechanics/chance-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/chance-biomechanics/chance-engine/actions)
![Vitest Coverage](https://img.shields.io/badge/Coverage-94%25-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20Strict-blue.svg)
![Architecture](https://img.shields.io/badge/Architecture-Local--First%20%2F%20Offline--First-orange.svg)
![License](https://img.shields.io/badge/License-MIT-black.svg)

**CHΔNCE** is an elite strength conditioning and progressive overload platform engineered for competitive athletes, bodybuilders, and sports scientists. Unlike generic consumer workout trackers, CHΔNCE incorporates a **Mechanical Rule-Based Expert System** that models the intersection between human muscular length-tension relationships and authentic commercial gym machinery lever arms (Technogym Pure/Selection, Hammer Strength Iso-Lateral, Panatta FreeWeight).

---

## 🏛️ System Architecture

The application is structured following a **Local-First / Optimistic-UI** paradigm, guaranteeing full operability in underground commercial gym facilities with zero cellular or Wi-Fi signal, seamlessly reconciling state with the cloud once connectivity resumes.

```mermaid
flowchart TD
    subgraph Client [Mobile Client - React 19 + TypeScript]
        UI[True OLED Interface #09090B]
        subgraph CoreEngines [Core Domain Engines]
            BioEngine[Biomechanical Rule Engine]
            AudioNLP[SpeechRecognition NLP Engine]
            ZodLayer[Zod Schema Validator]
            FitnessCalc[1RM & Volume Calculator]
        end
        subgraph Storage [Local-First Persistence]
            LocalStore[(IndexedDB / LocalStorage)]
            SyncQueue[Optimistic Sync Queue]
        end
    end

    subgraph ExternalSources [External Data & Microservices]
        OFF[OpenFoodFacts España REST API]
        CloudSync[Encrypted Cloud Snapshot Vault]
    end

    UI --> BioEngine
    UI --> AudioNLP
    AudioNLP --> ZodLayer
    ZodLayer --> LocalStore
    BioEngine --> UI
    FitnessCalc --> LocalStore

    LocalStore <--> SyncQueue
    SyncQueue -- Background Worker --x|Offline Cache| CloudSync
    SyncQueue -- Active Network Sync --> CloudSync
    UI -- Debounced 200ms Search --> OFF
```

---

## 🔬 Core Biomechanical Features

### 1. Dual-Curve Mechanical Diagnostic (Strength vs. Resistance)
Rather than abstract progress bars, CHΔNCE maps two simultaneous curves across the Range of Motion (**Estiramiento $\rightarrow$ Zona Media $\rightarrow$ Acortamiento**):
- **Curve 1: Active Length-Tension Capacity**: Biological contractile output modeled from Gordon et al. sarcomere overlap dynamics.
- **Curve 2: Machine Resistance Torque**: Torque output as a function of lever moment arms ($\tau = F \cdot L \cdot \sin\theta$) or cam profiles.
- **Divergence Region**: Highlights the exact point of active insufficiency where mechanical overload occurs.

### 2. Competition Gym Hacks & Workshop Modifications
Classifies machines according to mechanical factory limitations:
- **Foam Blocks / Yoga Pads**: Extending active excursion by 4–5 cm before weight horns bottom out against bumpers.
- **Accommodating Resistance (Bands)**: Optimal peg anchors for ascending overload or reverse-band deloading.
- **Anthropometric Customization**: Tailored lever alignment for athletes over 1.80 m vs. under 1.75 m.

### 3. Sub-pixel Vector Photography & Defringing
Eliminates white halos from segmented manufacturer imagery via combined contrast grading and CSS drop shadows (`drop-shadow(0px 10px 20px rgba(0,0,0,0.85)) contrast(1.05)`) over an ambient radial spotlight (`radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)`).

---

## 📜 Architectural Decision Records (ADRs)

### ADR 001: Local-First Storage with Optimistic UI Reconciliation
- **Context**: Gyms are frequently situated in subterranean facilities with intermittent 4G/5G signal. Latency on set logging disrupts workout focus.
- **Decision**: All routine updates, set completions, and pin adjustments persist synchronously to local storage immediately. A background worker debounces state snapshots to remote storage via idempotent upserts.
- **Consequence**: Zero UI latency, 100% offline uptime, deterministic conflict resolution based on ISO timestamps.

### ADR 002: Structured Outputs with Zod Schema Validation
- **Context**: Large Language Models and voice NLP parsers can hallucinate or produce malformed JSON structures.
- **Decision**: Implemented `zod` runtime schemas (`VoiceParsingResponseSchema`, `MachineBiomechanicsSchema`). All parser outputs must strictly validate before entering application state.
- **Consequence**: Guaranteed type safety at runtime, automatic rejection of corrupted payloads, resilient user feedback.

### ADR 003: Pure OLED Palette (`#09090B`) with Single Cobalt Accent (`#2563EB`)
- **Context**: Visual clutter with multiple competing semantic colors (orange, purple, emerald) degrades perceived software maturity.
- **Decision**: Adopted a unified True OLED neutral dark base (`#09090b` / `#121215`) with a single focal accent (`#2563EB`). Active states share identical chromatic identity.
- **Consequence**: Increased battery efficiency on mobile OLED displays, elevated professional aesthetics.

---

## 🧪 Testing & Quality Assurance

```bash
# Execute static linting
npm run lint

# Run strict TypeScript compiler verification
npx tsc -b --noEmit

# Execute unit test suite with Vitest
npm test

# Run End-to-End browser scenarios
npx playwright test
```

### Test Coverage Breakdown:
- **`src/__tests__/fitness.test.ts`**: Epley 1RM mathematical boundary tests, warmup volume exclusion, completed set filters.
- **`src/__tests__/nutrition.test.ts`**: Speech recognition NLP entity extraction, meal bucket heuristics, Zod runtime schema assertions.
- **`src/__tests__/auth.test.ts`**: Cryptographic credential verification, duplicate prevention, session persistence.

---

## 🚀 Getting Started

```bash
# 1. Clone repository
git clone https://github.com/chance-biomechanics/chance-engine.git
cd chance-engine

# 2. Install dependencies
npm install

# 3. Start local development environment
npm run dev

# 4. Build for production deployment
npm run build
```

---

## 👨‍💻 Author & Engineering Standards
Designed and engineered by **Pablo**, specializing in High-Performance Web Applications, Offline-First Mobile Architectures, and Applied Biomechanics.
