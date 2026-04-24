import LogSheet from './LogSheet'

export default function LogSheetList({ dailyLogs }) {
  if (!dailyLogs || dailyLogs.length === 0) return null

  return (
    <div className="space-y-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-800">
        ELD Daily Log Sheets ({dailyLogs.length} day{dailyLogs.length > 1 ? 's' : ''})
      </h2>
      {dailyLogs.map((log, idx) => (
        <LogSheet key={idx} logData={log} />
      ))}
    </div>
  )
}
