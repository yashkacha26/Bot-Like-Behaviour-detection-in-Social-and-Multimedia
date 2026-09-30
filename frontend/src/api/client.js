import axios from 'axios'

// All API calls go to FastAPI via Vite's /api proxy
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export default api
