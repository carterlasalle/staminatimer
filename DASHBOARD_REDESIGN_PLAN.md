# Dashboard Redesign Plan

## Current State Analysis

### Navigation Structure (8 items total)
1. **Overview** (`/dashboard`) - Welcome, goal progress, key stats, quick links
2. **Training** (`/training`) - Timer + Session Guidance + Tabs(Analytics/Charts/Tips) + Training Programs
3. **Kegels** (`/kegels`) - Exercise library + Active workout + Quick Stats + Weekly Progress
4. **Mental** (`/mental`) - Exercise library + Active session + Quick Stats + Benefits
5. **Analytics** (`/analytics`) - Key Stats + Analytics + Charts + Session History + Weekly Summary + Trends
6. **Goals** (`/goals`) - Goals + Training Programs + Daily Habits + Achievement Progress
7. **AI Coach** (`/ai-coach`) - Chat interface
8. **Settings** - Account settings

### Problems Identified

#### 1. Too Many Navigation Items
- 7 main nav items + settings is overwhelming
- Users have decision paralysis - where do I go?
- Mobile bottom nav only shows 4 items, hiding half the app

#### 2. Redundant Content Across Pages
| Content | Appears On |
|---------|------------|
| Analytics component | Training, Analytics |
| Charts component | Training, Analytics |
| Training Programs | Training, Goals |
| Quick Stats cards | Kegels, Mental, Analytics |
| Weekly Progress | Kegels, Analytics |
| Session History | Analytics only |

#### 3. Page Content Overload
- **Analytics page**: 6 major sections (stats, analytics, charts, history, weekly, trends)
- **Goals page**: 4 major sections (goals, programs, habits, achievements)
- **Training page**: Timer + guidance + 3 tabs + programs = overwhelming during a session

#### 4. Unclear Information Architecture
- "Analytics" vs "Goals" - where do I track progress?
- Training page has analytics - why go to Analytics page?
- Goals page has Training Programs - why not on Training page?

---

## Proposed Solution: Simplified 4-Tab Structure

### New Navigation
```
Home | Train | Progress | AI Coach | [Settings]
```

### 1. Home (`/dashboard`) - STREAMLINE
**Purpose**: Quick overview and action launcher

**Content**:
- Welcome message
- Today's goal progress bar
- 3 key stats (Level, Streak, Sessions)
- Start Training button (primary CTA)
- Last session summary
- Quick exercise links (Kegels, Mental, Training)

**Remove**: Nothing (already clean)

---

### 2. Train (`/training`) - CONSOLIDATE EXERCISES
**Purpose**: All training activities in one place

**Structure**: Tab-based interface
```
[Timer] [Kegels] [Mental]
```

**Timer Tab**:
- Clean, focused timer interface
- Session guidance (collapsible)
- Remove: sidebar analytics, training programs

**Kegels Tab** (moved from `/kegels`):
- Exercise library
- Active workout interface
- Keep it focused - remove quick stats (available in Progress)

**Mental Tab** (moved from `/mental`):
- Exercise library
- Active session interface
- Remove quick stats and "benefits" card

**Delete**: `/kegels/page.tsx` and `/mental/page.tsx` routes

---

### 3. Progress (`/progress`) - MERGE ANALYTICS + GOALS
**Purpose**: All progress tracking in one comprehensive view

**Structure**: Single scrollable page with clear sections

```
[Stats Overview]
  - 4 stat cards (Sessions, Time, Average, Streak)

[Progress Charts]
  - Duration over time
  - Session frequency

[Your Goals]
  - Dynamic goals
  - Custom goals
  - Add Goal button

[Recent Sessions]
  - Session history list
  - Export button

[Achievements]
  - Level progress
  - Current streak
  - Total sessions milestone
```

**Consolidates**:
- `/analytics/page.tsx` content
- `/goals/page.tsx` content

**Delete**: `/analytics/page.tsx` and `/goals/page.tsx` as separate routes

---

### 4. AI Coach (`/ai-coach`) - KEEP AS IS
**Purpose**: AI-powered coaching and analysis

**Content**: Already clean - just the chat interface

**Add**: Quick tips or training recommendations could go here

---

### 5. Settings - KEEP AS IS
Already well-organized with profile, preferences, notifications, security.

---

## Data Flow (No Data Loss)

All data continues to work:
- Sessions stored in Supabase → displayed in Progress
- Goals stored in localStorage → displayed in Progress
- Timer functionality → unchanged in Train/Timer
- Kegel/Mental exercises → moved to Train tabs
- AI Coach → unchanged
- Analytics hooks → used in Progress page

---

## File Changes Summary

### Create New Files
- `src/app/progress/page.tsx` - New combined progress page
- `src/components/training/TimerTab.tsx` - Timer section
- `src/components/training/KegelsTab.tsx` - Kegels section
- `src/components/training/MentalTab.tsx` - Mental section

### Modify Files
- `src/components/AppNavigation.tsx` - Update nav items
- `src/app/training/page.tsx` - Add tabs for exercises
- `src/app/dashboard/page.tsx` - Minor tweaks

### Delete Files
- `src/app/analytics/page.tsx` - Merged into Progress
- `src/app/goals/page.tsx` - Merged into Progress
- `src/app/kegels/page.tsx` - Merged into Training
- `src/app/mental/page.tsx` - Merged into Training

---

## Navigation Changes

### Before (Desktop Sidebar)
```
Overview
Training
Kegels      ← Remove
Mental      ← Remove
Analytics   ← Remove
Goals       ← Remove
AI Coach
─────────
Settings
```

### After (Desktop Sidebar)
```
Home
Train
Progress    ← New (combines Analytics + Goals)
AI Coach
─────────
Settings
```

### Mobile Bottom Nav (Before)
```
Home | Train | Stats | Goals | More
```

### Mobile Bottom Nav (After)
```
Home | Train | Progress | Coach
```
(No "More" button needed - everything accessible!)

---

## Benefits

1. **Simpler Navigation**: 4 items vs 7 - 43% reduction
2. **No Hidden Content**: Mobile shows all nav items
3. **Clear Mental Model**:
   - Home = Overview
   - Train = Do exercises
   - Progress = See results
   - Coach = Get advice
4. **Reduced Redundancy**: Each component appears once
5. **Focused Experience**: Training page is distraction-free
6. **Better Mobile UX**: No overflow menu needed

---

## Implementation Priority

### Phase 1: Create Progress Page
1. Create `/progress/page.tsx` combining Analytics + Goals
2. Move all analytics components to Progress
3. Move goals list and add goal functionality to Progress
4. Test data flow

### Phase 2: Consolidate Training
1. Extract Timer into TabContent component
2. Extract Kegels logic into TabContent component
3. Extract Mental logic into TabContent component
4. Add Tab navigation to Training page
5. Test all exercise functionality

### Phase 3: Update Navigation
1. Update AppNavigation sidebar items
2. Update mobile bottom nav
3. Update all internal links
4. Remove old pages

### Phase 4: Polish
1. Ensure responsive design
2. Test all user flows
3. Verify no data loss
4. Performance check

---

## Questions for User

1. Keep "Training Programs" section? (Currently on Training + Goals pages, somewhat duplicated)
2. Keep "Today's Habits" checklist from Goals page?
3. Keep "Benefits of Mental Training" info card?
4. Preference for tab style on Training page (underline tabs vs pill tabs)?
