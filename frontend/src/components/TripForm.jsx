import { useState } from 'react'

const LocationIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)

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
  const remainingPct = (remaining / 70) * 100
  const isLow = remaining <= 11

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden animate-fade-in-up"
    >
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Trip Details</h2>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Enter your route and hours information</p>
      </div>

      <div className="p-6 space-y-5">
        <InputField
          icon={<LocationIcon />}
          label="Current Location"
          name="current_location"
          value={form.current_location}
          onChange={handleChange}
          placeholder="e.g. Denver, CO"
          dot="bg-emerald-500"
        />

        <InputField
          icon={<LocationIcon />}
          label="Pickup Location"
          name="pickup_location"
          value={form.pickup_location}
          onChange={handleChange}
          placeholder="e.g. Kansas City, MO"
          dot="bg-blue-500"
        />

        <InputField
          icon={<LocationIcon />}
          label="Dropoff Location"
          name="dropoff_location"
          value={form.dropoff_location}
          onChange={handleChange}
          placeholder="e.g. Chicago, IL"
          dot="bg-red-500"
        />

        <div>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 mb-2">
            <ClockIcon />
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
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white outline-none transition-all input-glow"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">hours</span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">70-hour / 8-day cycle</span>
              <span className={`text-[11px] font-bold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                {remaining.toFixed(1)}h remaining
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, remainingPct))}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:from-brand-400 disabled:to-brand-300 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-brand-500/25 hover:shadow-brand-600/30 active:scale-[0.98] text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating Route...
            </>
          ) : (
            <>
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              Calculate Trip
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function InputField({ icon, label, name, value, onChange, placeholder, dot }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 mb-2">
        {icon}
        {label}
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white outline-none transition-all input-glow"
      />
    </div>
  )
}
