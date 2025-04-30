'use client'

import { useAchievements } from '@/hooks/useAchievements'
import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'
import type { Achievement } from '@/lib/types/achievements'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type TimerState = 'idle' | 'active' | 'edging' | 'finished'

type EdgeLap = {
  startTime: Date
  endTime?: Date
  duration?: number
}

export function useTimer() {
  const [state, setState] = useState<TimerState>('idle')
  const [activeTime, setActiveTime] = useState(0)
  const [edgeTime, setEdgeTime] = useState(0)
  const [currentEdgeStart, setCurrentEdgeStart] = useState<Date | null>(null)
  const [lastActiveStart, setLastActiveStart] = useState<Date | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [edgeLaps, setEdgeLaps] = useState<EdgeLap[]>([])
  const [displayActiveTime, setDisplayActiveTime] = useState(0)
  const [displayEdgeTime, setDisplayEdgeTime] = useState(0)
  const { checkAchievements } = useAchievements()

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (state === 'active' || state === 'edging') {
      intervalId = setInterval(() => {
        const now = new Date().getTime()

        if (state === 'active' && lastActiveStart) {
          const currentActiveTime = activeTime + (now - lastActiveStart.getTime())
          setDisplayActiveTime(currentActiveTime)
        }

        if (state === 'edging' && currentEdgeStart) {
          const currentEdgeTime = edgeTime + (now - currentEdgeStart.getTime())
          setDisplayEdgeTime(currentEdgeTime)
        }
      }, 1000)
    } else {
      setDisplayActiveTime(activeTime)
      setDisplayEdgeTime(edgeTime)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [state, activeTime, edgeTime, lastActiveStart, currentEdgeStart])

  const startSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      const now = new Date()
      
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          start_time: now.toISOString(),
          total_duration: 0,
          active_duration: 0,
          edge_duration: 0,
          finished_during_edge: false,
          created_at: now.toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating session:', error)
        toast.error('Failed to start session')
        return
      }

      if (!data?.id) {
        toast.error('Failed to create session')
        return
      }

      setSessionId(data.id)
      setLastActiveStart(now)
      setState('active')

    } catch (err) {
      console.error('Session start error:', err)
      toast.error('Failed to start session')
    }
  }, [])

  const startEdge = useCallback(async () => {
    if (!sessionId) {
      toast.error('No active session')
      return
    }

    const now = new Date()

    try {
      if (lastActiveStart) {
        const newActiveTime = activeTime + (now.getTime() - lastActiveStart.getTime())
        setActiveTime(newActiveTime)

        const { error: updateError } = await supabase
          .from('sessions')
          .update({ active_duration: newActiveTime })
          .eq('id', sessionId)

        if (updateError) {
          throw updateError
        }
      }

      const { error: edgeError } = await supabase
        .from('edge_events')
        .insert({
          session_id: sessionId,
          start_time: now.toISOString()
        })

      if (edgeError) {
        throw edgeError
      }

      setEdgeLaps(prev => [...prev, { startTime: now }])
      setCurrentEdgeStart(now)
      setState('edging')

    } catch (err) {
      console.error('Error recording edge:', err)
      toast.error('Failed to record edge event')
    }
  }, [sessionId, lastActiveStart, activeTime])

  const endEdge = useCallback(async () => {
    if (!sessionId || !currentEdgeStart) {
      return
    }

    const now = new Date()

    try {
      const newEdgeTime = edgeTime + (now.getTime() - currentEdgeStart.getTime())
      setEdgeTime(newEdgeTime)

      const { error } = await supabase
        .from('edge_events')
        .update({
          end_time: now.toISOString(),
          duration: now.getTime() - currentEdgeStart.getTime()
        })
        .eq('session_id', sessionId)
        .is('end_time', null)

      if (error) {
        throw error
      }

      setEdgeLaps(prev => {
        const newLaps = [...prev]
        const currentLap = newLaps[newLaps.length - 1]
        if (currentLap) {
          currentLap.endTime = now
          currentLap.duration = now.getTime() - currentLap.startTime.getTime()
        }
        return newLaps
      })

      setLastActiveStart(now)
      setCurrentEdgeStart(null)
      setState('active')

    } catch (err) {
      console.error('Error ending edge:', err)
      toast.error('Failed to update edge event')
    }
  }, [currentEdgeStart, sessionId, edgeTime])

  const checkAndAwardAchievements = useCallback(async (userId: string, completedSession: Partial<DBSession> & { edge_events_count: number }) => {
    try {
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
      
      if (achievementsError) throw achievementsError;
      if (!allAchievements) return;

      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (userAchievementsError) throw userAchievementsError;

      const unlockedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) ?? []);

      const achievementsToCheck = allAchievements.filter(ach => !unlockedAchievementIds.has(ach.id));

      const newlyUnlocked: Achievement[] = [];
      for (const achievement of achievementsToCheck) {
        let conditionMet = false;
        const value = completedSession[achievement.condition_type as keyof typeof completedSession] ?? 0;
        const requiredValue = achievement.condition_value;

        switch (achievement.condition_comparison) {
          case 'greater':
            conditionMet = value > requiredValue;
            break;
          case 'less':
            conditionMet = value < requiredValue;
            break;
          case 'equal':
             conditionMet = value === requiredValue;
             break;
          default:
            conditionMet = value >= requiredValue; 
        }

        if (conditionMet) {
          newlyUnlocked.push(achievement);
        }
      }

      if (newlyUnlocked.length > 0) {
        const achievementsToInsert = newlyUnlocked.map(ach => ({
          user_id: userId,
          achievement_id: ach.id,
          unlocked_at: new Date().toISOString(),
          progress: 100
        }));

        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert(achievementsToInsert);

        if (insertError) {
          if (insertError.code !== '23505') {
             console.error('Error awarding achievements:', insertError);
             toast.error('Error saving achievement progress');
          }
        } else {
          newlyUnlocked.forEach(ach => {
            toast.success(`Achievement Unlocked: ${ach.name}!`);
          });
        }
      }
    } catch (error) {
      console.error("Error checking/awarding achievements:", error);
    }
  }, []);

  const finishSession = useCallback(async () => {
    if (!sessionId) {
      toast.error('No active session to finish')
      return
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('User not found, cannot save session.');
      return;
    }

    const now = new Date()
    let finalActiveTime = activeTime
    let finalEdgeTime = edgeTime
    let finalFinishedDuringEdge = false;

    try {
      if (state === 'active' && lastActiveStart) {
        finalActiveTime += (now.getTime() - lastActiveStart.getTime())
      } else if (state === 'edging' && currentEdgeStart) {
        finalEdgeTime += (now.getTime() - currentEdgeStart.getTime())
        finalFinishedDuringEdge = true;
      }
      const finalTotalDuration = finalActiveTime + finalEdgeTime;

      const { error } = await supabase
        .from('sessions')
        .update({
          end_time: now.toISOString(),
          active_duration: finalActiveTime,
          edge_duration: finalEdgeTime,
          total_duration: finalTotalDuration,
          finished_during_edge: finalFinishedDuringEdge
        })
        .eq('id', sessionId)

      if (error) {
        throw error
      }

      setActiveTime(finalActiveTime)
      setEdgeTime(finalEdgeTime)
      setState('finished')
      toast.success('Session finished and saved!')

      const completedSessionData = {
        total_duration: finalTotalDuration,
        edge_duration: finalEdgeTime,
        active_duration: finalActiveTime,
        finished_during_edge: finalFinishedDuringEdge,
        edge_events_count: edgeLaps.length
      };
      checkAndAwardAchievements(user.id, completedSessionData);

    } catch (err) {
      console.error('Error finishing session:', err)
      toast.error('Failed to finish session')
    }
  }, [sessionId, state, lastActiveStart, currentEdgeStart, activeTime, edgeTime, edgeLaps.length, checkAndAwardAchievements])

  const resetTimer = useCallback(() => {
    setState('idle')
    setActiveTime(0)
    setEdgeTime(0)
    setCurrentEdgeStart(null)
    setLastActiveStart(null)
    setSessionId(null)
    setEdgeLaps([])
  }, [])

  return {
    state,
    activeTime: displayActiveTime,
    edgeTime: displayEdgeTime,
    edgeLaps,
    startSession,
    startEdge,
    endEdge,
    finishSession,
    resetTimer
  }
}