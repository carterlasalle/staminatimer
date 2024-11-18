export interface StorageSession {
  state: string
  sessionStart: string | null
  activeTime: number
  edgeTime: number
  currentEdgeStart: string | null
  lastActiveStart: string | null
  sessionId: string | null
  finishedDuringEdge: boolean
  edgeLaps: Array<{
    startTime: string
    endTime?: string
    duration?: number
  }>
}

export const storage = {
  saveSession(data: StorageSession) {
    try {
      localStorage.setItem('current-session', JSON.stringify(data))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  },

  loadSession(): StorageSession | null {
    try {
      const data = localStorage.getItem('current-session')
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return null
    }
  },

  clearSession() {
    localStorage.removeItem('current-session')
  }
} 