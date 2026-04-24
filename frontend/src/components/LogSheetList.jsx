import LogSheet from './LogSheet'

export default function LogSheetList({ dailyLogs }) {
  if (!dailyLogs || dailyLogs.length === 0) return null

  return (
    <div className="space-y-4 animate-fade-in-up stagger-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">
          ELD Daily Log Sheets
        </h2>
        <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
          {dailyLogs.length} day{dailyLogs.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-4">
        {dailyLogs.map((log, idx) => (
          <LogSheet key={idx} logData={log} />
        ))}
      </div>
    </div>
  )
}
