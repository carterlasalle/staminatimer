import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { formatDuration } from '@/lib/utils'

export async function generatePDF(sessions: any[]) {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(20)
  doc.text('Stamina Training Report', 20, 20)
  
  // Add summary stats
  doc.setFontSize(14)
  const totalSessions = sessions.length
  const totalDuration = sessions.reduce((acc, s) => acc + s.total_duration, 0)
  const totalEdges = sessions.reduce((acc, s) => acc + s.edge_events.length, 0)
  
  doc.text([
    `Total Sessions: ${totalSessions}`,
    `Total Duration: ${formatDuration(totalDuration)}`,
    `Total Edges: ${totalEdges}`,
  ], 20, 40)

  // Add sessions table
  const tableData = sessions.map(session => [
    new Date(session.created_at).toLocaleDateString(),
    formatDuration(session.total_duration),
    formatDuration(session.edge_duration),
    session.edge_events.length,
    session.finished_during_edge ? 'Yes' : 'No'
  ])

  doc.autoTable({
    startY: 70,
    head: [['Date', 'Duration', 'Edge Time', 'Edges', 'Finished During Edge']],
    body: tableData,
  })

  // Save the PDF
  doc.save('stamina-training-report.pdf')
} 