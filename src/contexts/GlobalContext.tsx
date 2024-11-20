'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import type { DBSession } from '@/lib/types'

interface GlobalState {
  currentSession: DBSession | null
  sessions: DBSession[]
  loading: boolean
  error: Error | null
}

type GlobalAction = 
  | { type: 'SET_CURRENT_SESSION'; payload: DBSession | null }
  | { type: 'SET_SESSIONS'; payload: DBSession[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }

const GlobalContext = createContext<{
  state: GlobalState
  dispatch: React.Dispatch<GlobalAction>
} | undefined>(undefined)

function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload }
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(globalReducer, {
    currentSession: null,
    sessions: [],
    loading: false,
    error: null
  })

  return (
    <GlobalContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalContext.Provider>
  )
}

export function useGlobal() {
  const context = useContext(GlobalContext)
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider')
  }
  return context
} 