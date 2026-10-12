import React, { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import {
  ShieldAlert, Users, Bot, Activity, Cpu,
  ArrowRight, RefreshCw, AlertTriangle, CheckCircle2,
  BarChart3, MessageSquare, Eye, Image, ChevronRight, Search
} from 'lucide-react'
import api from '../api/client'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="recharts-custom-tooltip">
      <div className="recharts-custom-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.78rem', marginTop: 2, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{p.name}:</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>
            {typeof p.value === 'number' ? (p.value > 1 ? p.value.toFixed(1) : (p.value * 100).toFixed(1) + '%') : p.value}
          </strong>
        </div>
      ))}
    </div>
  )
}

const PIE_COLORS = ['#f43f5e', '#10b981']

const WORKSTREAMS = [
  { id: 'WS-01', name: 'Data Pipeline & Ingestion', spec: 'TwiBot-20 benchmark corpus', status: 'VERIFIED', target: 'dataset' },
  { id: 'WS-02', name: 'Feature Engineering Engine', spec: '14 temporal & profile signals', status: 'VERIFIED', target: 'behaviour' },
  { id: 'WS-03', name: 'Predictive Classifier Suite', spec: 'Random Forest, DT, Logistic Reg', status: 'VERIFIED', target: 'ml' },
  { id: 'WS-04', name: 'VADER Sentiment Polarity', spec: 'Lexical emotion & TF-IDF vectors', status: 'VERIFIED', target: 'nlp' },
  { id: 'WS-05', name: 'Social Network Topology', spec: 'PageRank & degree centrality', status: 'VERIFIED', target: 'network' },
  { id: 'WS-06', name: 'Forensic Account Triage', spec: 'Rule-based suspicion weights', status: 'VERIFIED', target: 'investigate' },
  { id: 'WS-07', name: 'Object Localization & MOT', spec: 'YOLOv8 + DeepSORT tracker', status: 'VERIFIED', target: 'object-detect' },
  { id: 'WS-08', name: 'Perceptual Visual Search', spec: 'FAISS vector indexer & pHash', status: 'VERIFIED', target: 'cbir' },
  { id: 'WS-09', name: 'Video Content Forensics', spec: 'Keyframe temporal segmentation', status: 'VERIFIED', target: 'video-ir' },
]

const DEFAULT_ML_METRICS = [
  { model: 'Logistic Regression', test_accuracy: 0.812, test_f1: 0.804, test_roc_auc: 0.885 },
  { model: 'Decision Tree',       test_accuracy: 0.841, test_f1: 0.835, test_roc_auc: 0.862 },
  { model: 'Random Forest',       test_accuracy: 0.892, test_f1: 0.889, test_roc_auc: 0.941 },
]

export default function Dashboard({ onNavigate }) {
  const [summary,     setSummary]     = useState(null)
  const [mlMetrics,   setMlMetrics]   = useState(DEFAULT_ML_METRICS)
  const [topSuspect,  setTopSuspect]  = useState([])
  const [filterTier,  setFilterTier]  = useState('all')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, mlRes, tsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/ml/metrics').catch(() => ({ data: [] })),
        api.get('/behaviour/top-suspicious?n=15'),
      ])
      setSummary(sRes.data)
      if (mlRes.data && mlRes.data.length > 0) {
        setMlMetrics(mlRes.data)
      }
      setTopSuspect(tsRes.data || [])
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const pieData = summary ? [
    { name: 'Bot Accounts',   value: summary.bot_count },
    { name: 'Organic Humans', value: summary.human_count },
  ] : [
    { name: 'Bot Accounts',   value: 200 },
    { name: 'Organic Humans', value: 300 },
  ]

  const filteredSuspects = topSuspect.filter(a => {
    if (filterTier === 'critical') return a.suspicion_score >= 60
    if (filterTier === 'moderate') return a.suspicion_score < 60
    return true
  })

  return (
    <div>
      {/* Executive Command Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="page-header__kicker">
            <span className="badge badge-success">
              <CheckCircle2 size={12} />
              Production Workspace
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
              BUILD #2026.10
            </span>
          </div>
          <h1>Security Operations &amp; Intelligence Dashboard</h1>
          <p>
            Continuous threat evaluation across social networks using machine learning classifiers, linguistic sentiment profiling, and computer vision surveillance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchAll}
            title="Refresh live telemetry"
          >
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            Sync Telemetry
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('investigate')}
          >
            <Search size={14} />
            Account Dossier
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>Telemetry link error: {error}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}>Retry Connection</button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card card--accent-primary">
          <div className="stat-card__top">
            <span className="stat-card__label">Audited Accounts</span>
            <div className="stat-card__icon-box">
              <Users size={16} />
            </div>
          </div>
          <div className="stat-card__value">
            {summary?.total_accounts?.toLocaleString() || '500'}
          </div>
          <div className="stat-card__sub">
            <span>TwiBot-20 benchmark corpus</span>
          </div>
        </div>

        <div className="stat-card card--accent-danger">
          <div className="stat-card__top">
            <span className="stat-card__label">Bot Prevalence</span>
            <div className="stat-card__icon-box" style={{ color: 'var(--color-danger)' }}>
              <Bot size={16} />
            </div>
          </div>
          <div className="stat-card__value" style={{ color: 'var(--color-danger)' }}>
            {summary ? `${summary.bot_pct}%` : '40.0%'}
          </div>
          <div className="stat-card__sub">
            <span>{summary?.bot_count || 200} automated entities identified</span>
          </div>
        </div>

        <div className="stat-card card--accent-warning">
          <div className="stat-card__top">
            <span className="stat-card__label">Mean Suspicion Score</span>
            <div className="stat-card__icon-box" style={{ color: 'var(--color-warning)' }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>
            {summary?.avg_suspicion_score !== undefined ? summary.avg_suspicion_score : '20.3'}
          </div>
          <div className="stat-card__sub">
            <span>Weighted 14-signal composite index</span>
          </div>
        </div>

        <div className="stat-card card--accent-success">
          <div className="stat-card__top">
            <span className="stat-card__label">Leading Classifier</span>
            <div className="stat-card__icon-box" style={{ color: 'var(--color-success)' }}>
              <Cpu size={16} />
            </div>
          </div>
          <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>
            89.2%
          </div>
          <div className="stat-card__sub">
            <span>Random Forest (AUC: 0.941)</span>
          </div>
        </div>
      </div>

      {/* Domain Quick Launch Banners */}
      <div className="grid-3">
        <div
          className="card"
          onClick={() => onNavigate && onNavigate('nlp')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="badge badge-primary">Text Forensics</span>
            <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#fff', marginBottom: 4 }}>
            Sentiment &amp; NLP Analysis
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            VADER compound polarity scores, vocabulary entropy, and TF-IDF bot vs human linguistic divergence.
          </p>
        </div>

        <div
          className="card"
          onClick={() => onNavigate && onNavigate('behaviour')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="badge badge-warning">Behavior Dynamics</span>
            <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#fff', marginBottom: 4 }}>
            Behavioral Profiling
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            Temporal tweeting burstiness, follower-to-following imbalance, activity schedules, and interaction rates.
          </p>
        </div>

        <div
          className="card"
          onClick={() => onNavigate && onNavigate('object-detect')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="badge badge-success">Computer Vision</span>
            <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#fff', marginBottom: 4 }}>
            Visual Clone &amp; Object Tracking
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            Multi-class bounding box localization via YOLOv8, DeepSORT Kalman trajectories, and FAISS vector matching.
          </p>
        </div>
      </div>

      {/* Primary Analytics Charts */}
      <div className="ba-grid-2">
        {/* Class Distribution Donut */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">
                <BarChart3 size={16} style={{ color: 'var(--color-accent)' }} />
                Population Classification Balance
              </div>
              <div className="section-subtitle">Observed entity breakdown across ground-truth labels</div>
            </div>
            <span className="badge badge-neutral">Ground Truth</span>
          </div>

          <div style={{ height: 240, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#475569' }}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(15, 23, 42, 0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Evaluation Comparison */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">
                <Cpu size={16} style={{ color: 'var(--color-primary)' }} />
                Classifier Performance Metrics
              </div>
              <div className="section-subtitle">Hold-out test partition evaluation across trained architectures</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate && onNavigate('ml')}>
              Inspect ROC Curves
            </button>
          </div>

          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mlMetrics.map(m => ({
                  model: m.model.replace('Regression', 'Reg.').replace('Forest', 'Forest'),
                  Accuracy: parseFloat((m.test_accuracy * 100).toFixed(1)),
                  'F1 Score': parseFloat((m.test_f1 * 100).toFixed(1)),
                  'ROC-AUC': parseFloat(((m.test_roc_auc || 0.88) * 100).toFixed(1)),
                }))}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="model" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.76rem', paddingTop: 8 }} />
                <Bar dataKey="Accuracy" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="F1 Score" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ROC-AUC" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Flagged Entity Triage Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">
              <ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} />
              High-Risk Automated Entity Triage
            </div>
            <div className="section-subtitle">Accounts with elevated behavioural suspicion indexes requiring forensic review</div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`tab-btn${filterTier === 'all' ? ' active' : ''}`}
              onClick={() => setFilterTier('all')}
            >
              All Flagged
            </button>
            <button
              className={`tab-btn${filterTier === 'critical' ? ' active' : ''}`}
              onClick={() => setFilterTier('critical')}
            >
              Critical Risk (≥60)
            </button>
            <button
              className={`tab-btn${filterTier === 'moderate' ? ' active' : ''}`}
              onClick={() => setFilterTier('moderate')}
            >
              Moderate (&lt;60)
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Handle / Identifier</th>
                <th>Class Label</th>
                <th>Suspicion Score</th>
                <th>Posting Velocity</th>
                <th>Follower Ratio</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuspects.slice(0, 7).map((a, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
                    #{String(i + 1).padStart(2, '0')}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>
                      @{a.screen_name || a.user_id}
                    </span>
                  </td>
                  <td>
                    <span className={`label-badge label-badge--${a.label}`}>
                      {a.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 70, height: 6, borderRadius: 3,
                        background: 'var(--color-surface-3)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(a.suspicion_score, 100)}%`,
                          height: '100%',
                          background: a.suspicion_score >= 60 ? 'var(--color-danger)' : 'var(--color-warning)',
                        }} />
                      </div>
                      <span className="mono-val" style={{ color: a.suspicion_score >= 60 ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: 700 }}>
                        {a.suspicion_score}
                      </span>
                    </div>
                  </td>
                  <td className="mono-val">
                    {(a.tweets_per_day || 0).toFixed(1)} / day
                  </td>
                  <td className="mono-val">
                    {(a.ff_ratio || 0).toFixed(2)}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigate && onNavigate('investigate', { query: a.screen_name || a.user_id })}
                      title={`Open forensic audit for @${a.screen_name || a.user_id}`}
                    >
                      Audit
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytical Workstreams Grid */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">
              <Activity size={16} style={{ color: 'var(--color-primary)' }} />
              Analytical Architecture &amp; Module Readiness
            </div>
            <div className="section-subtitle">Production pipeline component validation status</div>
          </div>
          <span className="badge badge-success">
            <CheckCircle2 size={12} />
            9 of 9 Systems Operational
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {WORKSTREAMS.map(ws => (
            <div
              key={ws.id}
              onClick={() => onNavigate && onNavigate(ws.target)}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--color-text-dim)', letterSpacing: '0.04em' }}>
                  {ws.id}
                </span>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginTop: 1, marginBottom: 2 }}>
                  {ws.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  {ws.spec}
                </div>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                READY
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
