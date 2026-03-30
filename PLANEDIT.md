# PLANEDIT

Source notes:
- `PLAN.md` was not present in this repository at implementation start.
- This checklist is generated from the full prompt and is being used as the execution-tracking duplicate.

## Pre-Read And Setup
- [x] Read all files in `src/`
- [x] Read Supabase SQL files (`supabase/schema.sql`, `supabase/seed_achievements.sql`)
- [x] Add Supabase migration for program tables
- [x] Update generated Supabase TS types for new tables

## Program Route + Navigation
- [x] Add `/program` route (`src/app/program/page.tsx`)
- [x] Add `/program/session` route (`src/app/program/session/page.tsx`)
- [x] Add `/program/layout.tsx`
- [x] Add Program nav item using `GraduationCap` between Train and Progress

## Program Components
- [x] Create `ProgramDashboard.tsx`
- [x] Create `ActiveSession.tsx`
- [x] Create `SessionStage.tsx`
- [x] Create `BreathingPacer.tsx`
- [x] Create `ArousalGauge.tsx`
- [x] Create `PhaseCard.tsx`
- [x] Create `SessionSummary.tsx`
- [x] Create `PhaseAdvancementModal.tsx`
- [x] Create `DailyHabits.tsx`
- [x] Create `EjaculationTracker.tsx`
- [x] Create `ProblemGuidance.tsx`
- [x] Create `EncounterLog.tsx`

## Program Hooks
- [x] Create `useProgramSession.ts`
- [x] Create `useProgramProgress.ts`
- [x] Create `useDailyHabits.ts`

## Session Architecture (All Phases)
- [x] Stage 0A Commitment Check (3 required toggles, start disabled until all checked)
- [x] Stage 0B Position Setup (60s timer with required copy)
- [x] Stage 0C Pelvic Floor Check (60s timer + Practice RK 10s guide)
- [x] Stage 1 Erection Without Rush (5m timer + warm-up structure)
- [x] Stage 1 persistent FORESKIN DOWN banner
- [x] Stage 1 arousal check prompts at 2m and 4m with 7+ intervention text
- [x] Stage 1 reverse kegel reminder every 90s
- [x] Stage 1 4:30 warning cue
- [x] Stage 1 common-problem card if 7+ reached
- [x] Stage 2 Main Session (20m timer + lube prompt + reference panel)
- [x] Stage 3 Cool Down (2m timer + breathing + RK repeats)
- [x] Post-session summary/review flow

## Ejaculation Scheduling
- [x] Track sessions since last ejaculation
- [x] Ask post-session: Did you finish today? (accidental/no/intentional-after)
- [x] Show recommendation window (6-10 sessions)
- [x] Show >10-session guidance
- [x] Show <6-session gentle guidance

## Phase Logic + Copy
- [x] Phase 1 briefing + BUILD/STOP peak-valley flow
- [x] Phase 1 prompts and accidental-finish / low-arousal guidance
- [x] Phase 1 tracking (cycles, max arousal, time between cycles, accidental finish)
- [x] Phase 1 advancement criteria (5 qualifying + min 3 cycles)
- [x] Phase 2 briefing + continuous breathing pacer
- [x] Phase 2 BUILD breathing instruction + jaw prompt at 8m
- [x] Phase 2 end self-report (breathing maintained)
- [x] Phase 3 briefing + local-only intention field
- [x] Phase 3 imagery prompts every 5m
- [x] Phase 3 end self-report (imagery quality 1-5 + low-streak guidance)
- [x] Phase 4 briefing + Arousal Gauge + The Zone state logic
- [x] Phase 4 modulation instructions + complete-stop flow (45s min)
- [x] Phase 4 tracking (complete stops, time in zone, highest peak)
- [x] Phase 5 briefing + freeze-at-9 flow (30s min, no contact removal)
- [x] Phase 5 grip progression + speed burst guidance
- [x] Phase 6 briefing + toy integration and pressure modulation
- [x] Phase 6 gear prompt if toy unavailable
- [x] Phase 7 briefing + simulated thrusting + position rotation tracking
- [x] Phase 7 sprint protocol (10m+ and 14m cues)
- [x] Phase 8 entry celebration animation (Framer Motion)
- [x] Phase 8 freeform structure with customizable guidance
- [x] Phase 8 local-only real-encounter log + chart

## Daily Habits
- [x] Deep squat tracker + streak UI
- [x] Kegel-RK combo guided 2-set timer
- [x] No-flex-after-urinating reminder card

## Context-Aware Problem Guidance
- [x] Detect fast spike to 9+ under 5 min (Phase 1-2) and show targeted guidance
- [x] Detect erection maintenance difficulty pattern and show guidance
- [x] Detect repeated jaw tension (Phase 2+) and show guidance
- [x] Detect accidental finishes in Phase 4-5 after early-phase success
- [x] Detect repeated same-position usage in Phase 7 and show guidance

## Tone + Content Constraints
- [x] Ensure no shame language ("failed" avoided)
- [x] Normalize accidental finishes as data
- [x] Frame progress as capacity expansion
- [x] End negative guidance with specific next action
- [x] Keep copy aligned with provided science framing

## Local-Only Data
- [x] `program_encounter_logs` in localStorage (never synced)
- [x] `program_intention_[sessionId]` in localStorage (never synced)

## Verification
- [x] Run `yarn typecheck`
- [x] Run `yarn lint`
- [x] Fix any issues found
