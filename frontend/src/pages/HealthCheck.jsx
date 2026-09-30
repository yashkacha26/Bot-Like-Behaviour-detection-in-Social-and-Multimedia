import React, { useEffect, useState } from 'react'
import api from '../api/client'

/**
 * HealthCheck page — Phase 1
 * Tests the React → FastAPI connection and displays the result.
 */
export default function HealthCheck() {
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'error'
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/health')
      .then(res => {
        setData(res.data)
        setStatus('ok')
      })
      .catch(err => {
        setError(err.message || 'Unknown error')
        setStatus('error')
      })
  }, [])

  return (
    <div className="health-container">
      <div className="card health-card">

        {/* Icon */}
        <div className="health-card__icon">
          {status === 'loading' && '⏳'}
          {status === 'ok'      && '✅'}
          {status === 'error'   && '❌'}
        </div>

        {/* Badge */}
        <div style={{ marginBottom: '16px' }}>
          {status === 'loading' && (
            <span className="badge badge--loading">
              <span className="spinner" />
              Connecting…
            </span>
          )}
          {status === 'ok' && (
            <span className="badge badge--success">Connected</span>
          )}
          {status === 'error' && (
            <span className="badge badge--error">Connection Failed</span>
          )}
        </div>

        {/* Title */}
        <h1 className="health-card__title">
          {status === 'loading' && 'Checking backend…'}
          {status === 'ok'      && data?.message}
          {status === 'error'   && 'Backend Unreachable'}
        </h1>

        {/* Sub-message */}
        <p className="health-card__message">
          {status === 'loading' && 'Pinging FastAPI at /api/health'}
          {status === 'ok'      && 'React frontend has successfully connected to the FastAPI backend.'}
          {status === 'error'   && `Error: ${error}. Make sure the backend is running on port 8000.`}
        </p>

        {/* Details */}
        {status === 'ok' && data && (
          <div className="health-card__details">
            <div className="health-card__detail-row">
              <span className="health-card__detail-label">API Version</span>
              <span className="health-card__detail-value">{data.api_version}</span>
            </div>
            <div className="health-card__detail-row">
              <span className="health-card__detail-label">Status</span>
              <span className="health-card__detail-value">{data.status}</span>
            </div>
            <div className="health-card__detail-row">
              <span className="health-card__detail-label">Database</span>
              <span className="health-card__detail-value">{data.database}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
