// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ContextGuidanceV2 } from './ContextGuidanceV2'
import { TargetProgress } from './TargetProgress'
import { TodaysPractice } from './TodaysPractice'
import { TransferPanel } from './TransferPanel'
import { TrendsV2 } from './TrendsV2'
import { WeeklyPlan } from './WeeklyPlan'
import {
  evaluateProgressionGate,
  FIVE_MINUTE_CHECKPOINT_MS,
  getTransferUnlockState,
} from '@/lib/program/protocol-v2'
import type {
  ProgressionObservationRow,
  ProgramV2RescueEventRow,
  ProgramV2SessionRow,
} from '@/hooks/useProgramV2Progress'

/** Complete V2 rows so fixtures stay type-safe instead of being asserted into shape. */
function makeSession(overrides: Partial<ProgramV2SessionRow>): ProgramV2SessionRow {
  return {
    id: 'session-fixture',
    user_id: 'user-fixture',
    session_type: 'control',
    scheduled_local_date: '2026-09-21',
    started_at: '2026-09-21T10:00:00Z',
    completed_at: '2026-09-21T10:20:00Z',
    target_duration_ms: 240_000,
    main_training_duration_ms: 600_000,
    continuous_attempt_ms: null,
    longest_continuous_block_ms: null,
    rescue_stop_count: 0,
    rescue_stop_total_ms: 0,
    time_in_target_range_ms: null,
    highest_arousal_reached: null,
    standardized: false,
    progression_eligible: true,
    target_passed: false,
    anti_loop_terminated: false,
    completed_protocol: true,
    stimulus_type: 'hand',
    lube_used: null,
    porn_used: null,
    ejaculation_outcome: null,
    days_since_last_ejaculation: null,
    control_rating: null,
    breathing_maintained: null,
    notes: null,
    created_at: '2026-09-21T10:00:00Z',
    ...overrides,
  }
}

function makeRescueEvent(overrides: Partial<ProgramV2RescueEventRow>): ProgramV2RescueEventRow {
  return {
    id: 'rescue-fixture',
    session_id: 'session-fixture',
    user_id: 'user-fixture',
    started_offset_ms: 0,
    ended_offset_ms: null,
    duration_ms: null,
    arousal_before: null,
    arousal_after: null,
    created_at: '2026-09-21T10:00:00Z',
    ...overrides,
  }
}

const observations: ProgressionObservationRow[] = [
  {
    sessionType: 'control',
    durationMs: 253_000,
    at: '2026-09-21T10:00:00Z',
    passed: true,
    targetMs: 240_000,
  },
  {
    sessionType: 'endurance',
    durationMs: 248_000,
    at: '2026-09-23T10:00:00Z',
    passed: true,
    targetMs: 240_000,
  },
  {
    sessionType: 'control',
    durationMs: 221_000,
    at: '2026-09-25T10:00:00Z',
    passed: false,
    targetMs: 240_000,
  },
  {
    sessionType: 'baseline',
    durationMs: 262_000,
    at: '2026-09-27T10:00:00Z',
    passed: true,
    targetMs: 240_000,
  },
]

describe('Guided Program V2 dashboard surfaces', () => {
  afterEach(() => {
    cleanup()
  })

  it("states today's practice and the current target on the top card", () => {
    render(<TodaysPractice sessionType="control" currentTargetMs={240_000} status="active" />)

    expect(screen.getByText("Today's Practice")).toBeTruthy()
    expect(screen.getByText('Control')).toBeTruthy()
    expect(screen.getByText('Current Target')).toBeTruthy()
    expect(screen.getByText('4:00')).toBeTruthy()
    expect(screen.getByText("Start Today's Session")).toBeTruthy()
  })

  it('marks optional sessions as genuinely optional', () => {
    render(<TodaysPractice sessionType="easy" currentTargetMs={240_000} status="active" />)

    expect(screen.getByText(/Skipping it is completely acceptable/)).toBeTruthy()
  })

  it('shows the maintenance state instead of a next target at 10:00', () => {
    render(<TodaysPractice sessionType="control" currentTargetMs={600_000} status="maintenance" />)

    expect(screen.getByText('Maintenance baseline')).toBeTruthy()
    expect(screen.getByText('10:00 baseline established.')).toBeTruthy()
  })

  it('lists the qualifying observations and the gate count', () => {
    const gate = evaluateProgressionGate({
      targetMs: 240_000,
      observations: observations.map((item) => ({
        sessionType: item.sessionType,
        durationMs: item.durationMs,
      })),
    })

    render(
      <TargetProgress
        currentTargetMs={240_000}
        nextTargetMs={270_000}
        status="active"
        gate={gate}
        observations={observations}
      />
    )

    expect(screen.getByText('Recent qualifying observations')).toBeTruthy()
    expect(screen.getByText('3 / 4 passed')).toBeTruthy()
    expect(screen.getByText('Next target: 4:30')).toBeTruthy()
    expect(screen.getByText(/Gate satisfied/)).toBeTruthy()
  })

  it('explains the stricter 5:00 checkpoint rule', () => {
    const gate = evaluateProgressionGate({
      targetMs: FIVE_MINUTE_CHECKPOINT_MS,
      observations: [],
    })

    render(
      <TargetProgress
        currentTargetMs={FIVE_MINUTE_CHECKPOINT_MS}
        nextTargetMs={360_000}
        status="active"
        gate={gate}
        observations={[]}
      />
    )

    expect(screen.getByText('5:00 Checkpoint')).toBeTruthy()
    expect(screen.getByText(/4 \/ 5 qualifying observations required/)).toBeTruthy()
    expect(screen.getByText(/2 strict Endurance or Baseline passes/)).toBeTruthy()
  })

  it('renders the weekly prescription with today highlighted', () => {
    // 2026-09-23 is a Wednesday.
    render(<WeeklyPlan today={new Date(2026, 8, 23, 12, 0, 0)} />)

    for (const day of [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]) {
      expect(screen.getByText(day)).toBeTruthy()
    }

    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.getByText('Endurance')).toBeTruthy()
    expect(screen.getByText('Baseline')).toBeTruthy()
    expect(screen.getByText('Easy / Optional')).toBeTruthy()
    expect(screen.queryByText(/Phase \d/)).toBeNull()
  })

  it('separates solo capability from partner transfer and stays locked below 5:00', () => {
    render(
      <TransferPanel
        transfer={getTransferUnlockState({ currentTargetMs: 240_000, status: 'active' })}
        transferSessions={[]}
        daysSinceLastEjaculation={3}
        encounterLogOpen={false}
        onToggleEncounterLog={() => {}}
      />
    )

    expect(screen.getByText('Solo capability (hand)')).toBeTruthy()
    expect(screen.getByText('Partner transfer')).toBeTruthy()
    expect(screen.getByText('not measured')).toBeTruthy()
    expect(screen.getByText(/Transfer unlocks after the 5:00 hand checkpoint/)).toBeTruthy()
    expect(screen.getByText(/never a target or a rule/)).toBeTruthy()
    expect(screen.queryByText(/Recommended ejaculation window/)).toBeNull()
  })

  it('offers the device track with a separate suggested target once unlocked', () => {
    render(
      <TransferPanel
        transfer={getTransferUnlockState({ currentTargetMs: 360_000, status: 'active' })}
        transferSessions={[]}
        daysSinceLastEjaculation={null}
        encounterLogOpen={false}
        onToggleEncounterLog={() => {}}
      />
    )

    expect(screen.getByText(/Suggested initial device target: 3:00/)).toBeTruthy()
    expect(screen.getByText(/may temporarily reduce duration/)).toBeTruthy()
  })

  it('shows a neutral trends placeholder before there is enough data', () => {
    render(<TrendsV2 baselines={[]} controlSessions={[]} />)

    expect(screen.getByText(/Trends appear once you have a few sessions/)).toBeTruthy()
    expect(screen.getByText(/longest continuous block/)).toBeTruthy()
  })

  it('renders nothing when there is no context signal yet', () => {
    const { container } = render(
      <ContextGuidanceV2 sessions={[]} rescueEvents={[]} gate={null} currentTargetMs={240_000} />
    )

    expect(container.textContent).toBe('')
  })

  it('reports a rescue loop with the active-stimulation gap', () => {
    render(
      <ContextGuidanceV2
        sessions={[
          makeSession({
            id: 'session-1',
            anti_loop_terminated: true,
            session_type: 'control',
            rescue_stop_count: 2,
            created_at: '2026-09-21T10:00:00Z',
            longest_continuous_block_ms: 40_000,
            continuous_attempt_ms: null,
          }),
        ]}
        rescueEvents={[
          makeRescueEvent({
            id: 'r1',
            session_id: 'session-1',
            started_offset_ms: 40_000,
            ended_offset_ms: 70_000,
            duration_ms: 30_000,
          }),
          makeRescueEvent({
            id: 'r2',
            session_id: 'session-1',
            started_offset_ms: 172_000,
            ended_offset_ms: 200_000,
            duration_ms: 28_000,
          }),
        ]}
        gate={null}
        currentTargetMs={240_000}
      />
    )

    expect(screen.getByText('Repeated rescue cycling')).toBeTruthy()
    expect(screen.getByText(/within 1:42 of active stimulation/)).toBeTruthy()
    expect(screen.getByText(/react earlier to acceleration/)).toBeTruthy()
  })
})
