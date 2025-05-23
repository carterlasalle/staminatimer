import type { DBSession } from '@/lib/types'; // Import the session type
import { formatDuration } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable'; // Import UserOptions

// Extend jsPDF types to include autoTable and internal methods
declare module 'jspdf' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface jsPDF { // Interface required for module augmentation
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Create a custom type for internal to avoid conflicts
type CustomJsPDF = jsPDF & {
  internal: {
    getNumberOfPages: () => number
    pageSize: {
      width: number
      height: number
    }
  }
}

export async function generatePDF(sessions: DBSession[]) { // Use DBSession type
  const doc = new jsPDF() as CustomJsPDF
  
  // Set dark theme colors
  const colors = {
    primary: '#e5e5e5',
    secondary: '#71717a',
    accent: '#3b82f6',
    background: '#18181b',
    success: '#22c55e',
    warning: '#f59e0b'
  }

  // Add dark background
  doc.setFillColor(colors.background)
  doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F')
  
  // Add title
  doc.setTextColor(colors.primary)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Stamina Training Report', 20, 20)
  
  // Add timestamp
  doc.setFontSize(10)
  doc.setTextColor(colors.secondary)
  doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 30)

  // Add summary stats
  doc.setFontSize(16)
  doc.setTextColor(colors.primary)
  doc.text('Performance Overview', 20, 45)

  const totalSessions = sessions.length
  const totalDuration = sessions.reduce((acc, s) => acc + s.total_duration, 0)
  const totalEdges = sessions.reduce((acc, s) => acc + (s.edge_events?.length ?? 0), 0)
  const avgEdgesPerSession = totalSessions > 0 ? totalEdges / totalSessions : 0
  const successRate = (sessions.filter(s => !s.finished_during_edge).length / totalSessions) * 100
  const longestSession = Math.max(...sessions.map(s => s.total_duration))
  const avgEdgeDuration = totalEdges > 0 ? sessions.reduce((acc, s) => acc + s.edge_duration, 0) / totalEdges : 0

  // Add stats grid
  doc.setFontSize(12)
  doc.setTextColor(colors.secondary)
  const stats = [
    ['Total Sessions', totalSessions.toString()],
    ['Total Training Time', formatDuration(totalDuration)],
    ['Total Edges', totalEdges.toString()],
    ['Average Edges/Session', isNaN(avgEdgesPerSession) ? 'N/A' : avgEdgesPerSession.toFixed(1)],
    ['Success Rate', `${successRate.toFixed(1)}%`],
    ['Longest Session', formatDuration(longestSession)],
    ['Average Edge Duration', formatDuration(avgEdgeDuration)]
  ]

  doc.autoTable({
    startY: 55,
    head: [],
    body: stats,
    theme: 'plain',
    styles: {
      textColor: colors.primary,
      fontSize: 12,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: colors.secondary },
      1: { halign: 'right' }
    }
  })

  // Add recent sessions
  doc.setFontSize(16)
  doc.setTextColor(colors.primary)
  doc.text('Recent Sessions', 20, doc.lastAutoTable.finalY + 20)

  const sessionData = sessions.map(session => [
    new Date(session.created_at).toLocaleDateString(),
    formatDuration(session.total_duration),
    formatDuration(session.edge_duration),
    session.edge_events?.length ?? 0,
    // Handle division by zero for avg edge duration per session
    (session.edge_events?.length ?? 0) > 0 ? formatDuration(session.edge_duration / session.edge_events!.length) : 'N/A',
    session.finished_during_edge ? '❌' : '✅'
  ])

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 30,
    head: [['Date', 'Duration', 'Edge Time', 'Edges', 'Avg Edge', 'Success']],
    body: sessionData,
    theme: 'grid',
    styles: {
      textColor: colors.primary,
      fontSize: 10,
      cellPadding: 6,
      lineColor: colors.secondary,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: colors.accent,
      textColor: colors.primary,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: '#1f1f23'
    }
  })

  // Add edge analysis
  if (doc.lastAutoTable.finalY > doc.internal.pageSize.height - 60) {
    doc.addPage()
  }

  doc.setFontSize(16)
  doc.setTextColor(colors.primary)
  doc.text('Edge Analysis', 20, doc.lastAutoTable.finalY + 20)

  const edgeData = sessions.flatMap(session => 
    (session.edge_events ?? []).map((edge, index: number) => [ // Handle potentially null edge_events
      new Date(session.created_at).toLocaleDateString(),
      `Edge ${index + 1}`,
      formatDuration(edge.duration ?? 0),
      // Recovery time calculation requires logic beyond simple edge duration
      edge.end_time && index > 0 && session.edge_events?.[index-1]?.end_time ? formatDuration( // Requires previous edge end_time
        new Date(edge.start_time).getTime() - new Date(session.edge_events[index-1].end_time!).getTime()
      ) : 'N/A'
    ])
  )

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 30,
    head: [['Session Date', 'Edge #', 'Duration', 'Recovery Time']],
    body: edgeData,
    theme: 'grid',
    styles: {
      textColor: colors.primary,
      fontSize: 10,
      cellPadding: 6,
      lineColor: colors.secondary,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: colors.accent,
      textColor: colors.primary,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: '#1f1f23'
    }
  })

  // Add footer
  const pageCount = doc.internal.getNumberOfPages()
  doc.setFontSize(10)
  doc.setTextColor(colors.secondary)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  doc.save('stamina-training-report.pdf')
}