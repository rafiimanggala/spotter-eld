import { useState } from 'react'

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    cycle_used: 0,
  })

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const remaining = 70 - form.cycle_used
  const pct = Math.max(0, Math.min(100, (remaining / 70) * 100))

  return (
    <form onSubmit={handleSubmit} className="card p-5 animate-enter">
      <div className="space-y-3.5">
        <LocationField
          label="Current Location"
          name="current_location"
          value={form.current_location}
          onChange={handleChange}
          placeholder="e.g. Denver, CO"
          color="text-blue-500"
        />
        <LocationField
          label="Pickup Location"
          name="pickup_location"
          value={form.pickup_location}
          onChange={handleChange}
          placeholder="e.g. Kansas City, MO"
          color="text-emerald-500"
        />
        <LocationField
          label="Dropoff Location"
          name="dropoff_location"
          value={form.dropoff_location}
          onChange={handleChange}
          placeholder="e.g. Chicago, IL"
          color="text-red-400"
        />

        <div>
          <label className="block text-[12px] font-medium text-stone-500 mb-1.5 tracking-wide uppercase">
            Current Cycle Used
          </label>
          <div className="relative">
            <input
              type="number"
              name="cycle_used"
              value={form.cycle_used}
              onChange={handleChange}
              min="0"
              max="70"
              step="0.5"
              className="input-ring w-full h-10 px-3 bg-white border border-stone-200 rounded-lg text-[14px] text-stone-900 tabular-nums"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 font-medium">hours</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-stone-400 font-medium">70-Hour / 8-Day Cycle</span>
              <span className={`text-[12px] font-semibold tabular-nums ${remaining <= 11 ? 'text-red-500' : 'text-stone-700'}`}>
                {remaining.toFixed(1)}h remaining
              </span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  remaining <= 11 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-200 disabled:text-stone-400 text-white text-[13px] font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] shadow-sm shadow-blue-600/25 hover:shadow-md hover:shadow-blue-600/20 disabled:shadow-none"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Calculating...
          </span>
        ) : 'Calculate Route'}
      </button>
    </form>
  )
}

function LocationField({ label, name, value, onChange, placeholder, color }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-stone-500 mb-1.5 tracking-wide uppercase">
        {label}
      </label>
      <div className="relative">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${color}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          className="input-ring w-full h-10 pl-9 pr-3 bg-white border border-stone-200 rounded-lg text-[14px] text-stone-900 placeholder:text-stone-300"
        />
      </div>
    </div>
  )
}
