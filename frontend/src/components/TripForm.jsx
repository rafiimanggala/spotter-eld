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

  return (
    <form onSubmit={handleSubmit} className="animate-enter">
      <div className="space-y-4">
        <Field
          label="Current Location"
          name="current_location"
          value={form.current_location}
          onChange={handleChange}
          placeholder="Denver, CO"
        />
        <Field
          label="Pickup Location"
          name="pickup_location"
          value={form.pickup_location}
          onChange={handleChange}
          placeholder="Kansas City, MO"
        />
        <Field
          label="Dropoff Location"
          name="dropoff_location"
          value={form.dropoff_location}
          onChange={handleChange}
          placeholder="Chicago, IL"
        />

        <div>
          <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
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
              className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-lg text-[14px] text-neutral-900 outline-none transition-colors focus:border-neutral-400 hover:border-neutral-300"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400">hrs</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[12px] text-neutral-400">70h / 8-day cycle</span>
            <span className={`text-[12px] font-medium ${remaining <= 11 ? 'text-red-500' : 'text-neutral-600'}`}>
              {remaining.toFixed(1)}h left
            </span>
          </div>
          <div className="h-1 bg-neutral-100 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${remaining <= 11 ? 'bg-red-400' : 'bg-neutral-900'}`}
              style={{ width: `${Math.max(0, Math.min(100, (remaining / 70) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 h-10 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-[13px] font-medium rounded-lg transition-colors active:scale-[0.98]"
      >
        {loading ? 'Calculating...' : 'Calculate Trip'}
      </button>
    </form>
  )
}

function Field({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-lg text-[14px] text-neutral-900 placeholder:text-neutral-300 outline-none transition-colors focus:border-neutral-400 hover:border-neutral-300"
      />
    </div>
  )
}
