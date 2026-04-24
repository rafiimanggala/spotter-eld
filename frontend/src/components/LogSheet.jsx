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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-slate-800 tracking-tight">
            {logData.date || 'N/A'}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <Stat label="Driving" value={`${totalDriving.toFixed(1)}h`} color="text-brand-600" />
            <span className="text-slate-200">|</span>
            <Stat label="On-Duty" value={`${totalOnDuty.toFixed(1)}h`} color="text-amber-600" />
            <span className="text-slate-200">|</span>
            <Stat label="Miles" value={logData.total_miles || logData.totalMiles || '—'} color="text-slate-600" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PNG
          </button>
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg font-bold ring-1 ring-inset ring-emerald-600/10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            FMCSA
          </span>
        </div>
      </div>
      <div className="p-3 overflow-x-auto bg-white">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{ imageRendering: 'auto' }}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <span className="text-[11px] text-slate-400 font-medium">
      {label}: <span className={`font-bold ${color}`}>{value}</span>
    </span>
  )
}

function parseTime(val) {
  if (typeof val === 'number') return val
  if (!val) return 0
  const parts = val.split(':')
  return (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0) / 60
}
