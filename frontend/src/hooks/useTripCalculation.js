import { useState } from 'react'
import { calculateTrip } from '../services/api'

export const useTripCalculation = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const calculate = async (tripData) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await calculateTrip(tripData)
      setResult(data)
      return data
    } catch (err) {
      const message =
        err.response?.data?.detail || err.message || 'Failed to calculate trip'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, calculate }
}
