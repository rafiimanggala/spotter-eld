import LogSheet from './LogSheet'

export default function LogSheetList({ dailyLogs }) {
  if (!dailyLogs || dailyLogs.length === 0) return null

  return (
    <div className="animate-enter delay-3">
      <h3 className="text-[12px] font-medium text-stone-400 uppercase tracking-wider mb-3">
        Daily Logs <span className="text-stone-300">({dailyLogs.length})</span>
      </h3>
      <div className="space-y-3">
        {dailyLogs.map((log, idx) => (
          <LogSheet key={log.date || idx} logData={log} />
        ))}
      </div>
    </div>
  )
}
