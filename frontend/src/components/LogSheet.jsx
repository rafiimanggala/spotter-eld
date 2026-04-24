import { useRef, useEffect, useCallback } from 'react'
import { drawLogSheet } from '../utils/logDrawer'

export default function LogSheet({ logData }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current && logData) {
      drawLogSheet(canvasRef.current, logData)
    }
  }, [logData])

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `eld-log-${logData.date || 'sheet'}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }, [logData])

  if (!logData) return null

  const totalDriving = (logData.entries || [])
    .filter((e) => e.status === 'driving')
    .reduce((sum, e) => {
      const start = parseTime(e.start_time ?? e.start)
      const end = parseTime(e.end_time ?? e.end)
      return sum + (end - start)
    }, 0)

  const totalOnDuty = (logData.entries || [])
    .filter((e) => e.status === 'driving' || e.status === 'on_duty')
    .reduce((sum, e) => {
      const start = parseTime(e.start_time ?? e.start)
      const end = parseTime(e.end_time ?? e.end)
      return sum + (end - start)
    }, 0)

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-semibold text-neutral-800">{logData.date || 'N/A'}</span>
          <div className="flex items-center gap-3 text-[12px] text-neutral-400">
            <span>Drive {totalDriving.toFixed(1)}h</span>
            <span>On-Duty {totalOnDuty.toFixed(1)}h</span>
            <span>{logData.total_miles || logData.totalMiles || '—'} mi</span>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="text-[12px] text-neutral-500 hover:text-neutral-800 transition-colors px-2 py-1 rounded hover:bg-neutral-50"
        >
          Download PNG
        </button>
      </div>
      <div className="p-2 overflow-x-auto">
        <canvas ref={canvasRef} className="max-w-full h-auto" style={{ imageRendering: 'auto' }} />
      </div>
    </div>
  )
}

function parseTime(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  const parts = val.split(':')
  return (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0) / 60
}
