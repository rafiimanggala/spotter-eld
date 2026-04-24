import LogSheet from './LogSheet'

export default function LogSheetList({ dailyLogs }) {
  if (!dailyLogs || dailyLogs.length === 0) return null

  return (
    <div className="animate-enter delay-3">
      <h3 className="text-[13px] font-medium text-neutral-500 mb-3">
        Daily Logs <span className="text-neutral-400">({dailyLogs.length})</span>
      </h3>
      <div className="space-y-3">
        {dailyLogs.map((log, idx) => (
          <LogSheet key={idx} logData={log} />
        ))}
      </div>
    </div>
  )
}
