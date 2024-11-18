export type Session = {
  id: string
  startTime: string
  endTime: string
  totalDuration: number
  activeDuration: number
  edgeDuration: number
  finishedDuringEdge: boolean
  createdAt: string
}

export type EdgeEvent = {
  id: string
  sessionId: string
  startTime: string
  endTime: string
  duration: number
} 