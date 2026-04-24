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
      const data = err.response?.data
      let message = 'Failed to calculate trip'
      if (data?.error) {
        message = data.error
      } else if (data?.detail) {
        message = data.detail
      } else if (typeof data === 'object' && data) {
        const firstKey = Object.keys(data)[0]
        if (firstKey) message = `${firstKey}: ${data[firstKey]}`
      } else if (err.message) {
        message = err.message
      }
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, calculate }
}
