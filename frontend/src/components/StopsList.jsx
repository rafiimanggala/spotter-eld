const TYPE_BADGES = {
  pickup: 'bg-green-100 text-green-800',
  dropoff: 'bg-red-100 text-red-800',
  fuel: 'bg-amber-100 text-amber-800',
  rest: 'bg-purple-100 text-purple-800',
  break: 'bg-blue-100 text-blue-800',
  restart: 'bg-purple-100 text-purple-800',
}

export default function StopsList({ stops }) {
  if (!stops || stops.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Trip Stops</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 text-gray-600 font-medium">Type</th>
              <th className="text-left py-2 px-2 text-gray-600 font-medium">Location</th>
              <th className="text-left py-2 px-2 text-gray-600 font-medium">Time</th>
              <th className="text-left py-2 px-2 text-gray-600 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((stop, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
              >
                <td className="py-2 px-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGES[stop.type] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {stop.type}
                  </span>
                </td>
                <td className="py-2 px-2 text-gray-800">{stop.location}</td>
                <td className="py-2 px-2 text-gray-600">{stop.time ? new Date(stop.time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}</td>
                <td className="py-2 px-2 text-gray-600">{stop.duration ? (stop.duration >= 60 ? `${Math.floor(stop.duration/60)}h ${stop.duration%60}m` : `${stop.duration}m`) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
