import React, { useEffect, useState } from 'react'
import {
  CheckCircle2, XCircle, HardDrive, RefreshCw,
  Terminal, Radio, Server, Shield
} from 'lucide-react'
import api from '../api/client'

export default function HealthCheck() {
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'error'
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  const checkHealth = () => {
    setStatus('loading')
    setError(null)
    api.get('/health')
      .then(res => {
        setData(res.data)
        setStatus('ok')
        setLastChecked(new Date().toLocaleTimeString())
      })
      .catch(err => {
        setError(err.message || 'Unknown network error')
        setStatus('error')
        setLastChecked(new Date().toLocaleTimeString())
      })
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div style={{ maxWidth: 640, margin: '40px auto 0' }}>
      <div className="card" style={{ padding: '32px 36px', textAlign: 'center' }}>
        
        {/* Status Indicator Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--radius-md)',
          background: status === 'ok' ? 'rgba(16,185,129,0.12)' : status === 'error' ? 'rgba(244,63,94,0.12)' : 'rgba(99,102,241,0.12)',
          border: `1px solid ${status === 'ok' ? 'rgba(16,185,129,0.3)' : status === 'error' ? 'rgba(244,63,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          {status === 'loading' && <RefreshCw size={28} className="spinner" style={{ color: 'var(--color-primary)' }} />}
          {status === 'ok' && <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />}
          {status === 'error' && <XCircle size={32} style={{ color: 'var(--color-danger)' }} />}
        </div>

        <div style={{ marginBottom: 12 }}>
          {status === 'loading' && (
            <span className="badge badge-primary">Pinging Backend Gateway...</span>
          )}
          {status === 'ok' && (
            <span className="badge badge-success">Telemetry Stream Active</span>
          )}
          {status === 'error' && (
            <span className="badge badge-danger">Connection Severed</span>
          )}
        </div>

        <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {status === 'loading' && 'Verifying Infrastructure Link'}
          {status === 'ok' && (data?.message || 'FastAPI Service Operational')}
          {status === 'error' && 'Gateway Unreachable'}
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 24 }}>
          {status === 'loading' && 'Checking HTTP listener on http://127.0.0.1:8000/api/health'}
          {status === 'ok' && 'Frontend client successfully authenticated and communicating with SQLite database engine.'}
          {status === 'error' && `Error: ${error}. Verify uvicorn backend process is active on port 8000.`}
        </p>

        {status === 'ok' && data && (
          <div style={{
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            padding: '16px 20px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>API Build Version</span>
              <span className="mono-val" style={{ color: 'var(--color-accent)' }}>v{data.api_version}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>Service State</span>
              <span className="mono-val" style={{ color: 'var(--color-success)' }}>{data.status.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>SQLite Engine</span>
              <span className="mono-val" style={{ color: '#fff' }}>{data.database}</span>
            </div>
            {lastChecked && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>Last Ping</span>
                <span className="mono-val" style={{ color: 'var(--color-text-dim)' }}>{lastChecked}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={checkHealth}
            disabled={status === 'loading'}
          >
            <RefreshCw size={14} className={status === 'loading' ? 'spinner' : ''} />
            Re-test Connectivity
          </button>
        </div>

      </div>
    </div>
  )
}
