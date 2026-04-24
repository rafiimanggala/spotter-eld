import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

export const calculateTrip = async (tripData) => {
  const response = await apiClient.post('/api/trip/calculate', tripData)
  return response.data
}
