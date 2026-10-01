import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import axios from 'axios'

const API = 'http://localhost:8000'

// ─── helpers ─────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="recharts-custom-tooltip">
      <div className="recharts-custom-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.8rem', marginTop: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

function RiskGauge({ score, label }) {
  const color = score >= 60 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981'
  const pct   = Math.min(score, 100)
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Background arc */}
        <path d="M 15 80 A 65 65 0 0 1 145 80" stroke="rgba(255,255,255,0.08)"
          strokeWidth="12" fill="none" strokeLinecap="round" />
        {/* Filled arc */}
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 204} 204`}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x="80" y="78" textAnchor="middle" fill={color}
          fontSize="22" fontWeight="800">{score.toFixed(0)}</text>
        <text x="80" y="90" textAnchor="middle" fill="#94a3b8" fontSize="10">/ 100</text>
      </svg>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function ProbabilityBar({ model, botProb, humanProb, prediction }) {
  const color = botProb >= 0.5 ? '#ef4444' : '#22d3ee'
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{model}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>Bot {(botProb * 100).toFixed(1)}%</span>
          <span className={`label-badge label-badge--${prediction}`}>{prediction}</span>
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${botProb * 100}%`,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function ReasonCard({ flag, weight, detail }) {
  const color = weight >= 15 ? '#ef4444' : '#f59e0b'
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
      background: `${color}0d`, border: `1px solid ${color}35`,
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        minWidth: 36, height: 36, borderRadius: '50%',
        background: `${color}20`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color,
      }}>
        +{weight}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{flag}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{detail}</div>
      </div>
    </div>
  )
}

// ─── Search bar with autocomplete ────────────────────────────────────────────
function SearchBar({ onSearch }) {
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDrop,    setShowDrop]    = useState(false)
  const debounceRef = useRef(null)

  const handleChange = (val) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setSuggestions([]); setShowDrop(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await axios.get(`${API}/api/investigate/search?q=${encodeURIComponent(val)}&n=8`)
        setSuggestions(r.data)
        setShowDrop(r.data.length > 0)
      } catch (_) {}
    }, 300)
  }

  const handleSelect = (acc) => {
    setQuery(acc.screen_name || acc.user_id)
    setSuggestions([])
    setShowDrop(false)
    onSearch(acc.screen_name || acc.user_id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowDrop(false)
    if (query.trim()) onSearch(query.trim())
  }

  return (
    <div style={{ position: 'relative', maxWidth: 520 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          id="account-search-input"
          type="text"
          placeholder="Search by @screen_name, name, or user ID…"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDrop(true)}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', fontSize: '0.9rem', outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <button
          id="account-search-btn"
          type="submit"
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary)', color: '#fff',
            fontWeight: 700, fontSize: '0.85rem',
            border: '1px solid rgba(99,102,241,0.5)',
          }}
        >
          🔍 Investigate
        </button>
      </form>

      {showDrop && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)', marginTop: 4, overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}>
          {suggestions.map((acc, i) => (
            <div
              key={i}
              onClick={() => handleSelect(acc)}
              style={{
                padding: '8px 14px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 10,
                borderBottom: '1px solid var(--color-border)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className={`label-badge label-badge--${acc.label}`}>{acc.label}</span>
              <span style={{ color: 'var(--color-accent)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                @{acc.screen_name}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{acc.name}</span>
              {acc.suspicion_score !== undefined && (
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#f59e0b' }}>
                  ⚠️ {acc.suspicion_score}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Account List panel ───────────────────────────────────────────────────────
function AccountListPanel({ onSelectAccount }) {
  const [data,        setData]        = useState(null)
  const [page,        setPage]        = useState(1)
  const [labelFilter, setLabelFilter] = useState('all')
  const [sortBy,      setSortBy]      = useState('suspicion_score')
  const [loading,     setLoading]     = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const r = await axios.get(
        `${API}/api/investigate/accounts?page=${page}&page_size=20&label=${labelFilter}&sort_by=${sortBy}`
      )
      setData(r.data)
    } catch (_) {}
    setLoading(false)
  }, [page, labelFilter, sortBy])

  useEffect(() => { fetchList() }, [fetchList])

  return (
    <div className="card" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="section-title" style={{ flex: 1 }}>Account Browser</div>
        {/* Filters */}
        <select className="scatter-select" value={labelFilter}
          onChange={e => { setLabelFilter(e.target.value); setPage(1) }}>
          <option value="all">All Labels</option>
          <option value="bot">Bots Only</option>
          <option value="human">Humans Only</option>
        </select>
        <select className="scatter-select" value={sortBy}
          onChange={e => { setSortBy(e.target.value); setPage(1) }}>
          <option value="suspicion_score">Sort: Suspicion ↓</option>
          <option value="activity_score">Sort: Activity ↓</option>
          <option value="followers_count">Sort: Followers ↓</option>
          <option value="tweets_per_day">Sort: Tweets/Day ↓</option>
        </select>
      </div>

      {loading && <div className="loading-box"><div className="spinner" /> Loading accounts…</div>}

      {!loading && data && (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Screen Name</th><th>Label</th>
                  <th>Suspicion ↓</th><th>Activity</th>
                  <th>Followers</th><th>FF Ratio</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((acc, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--color-accent)', fontSize: '0.8rem' }}>
                      @{acc.screen_name || acc.user_id}
                    </td>
                    <td><span className={`label-badge label-badge--${acc.label}`}>{acc.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: `${Math.min(acc.suspicion_score || 0, 100)}%`,
                          height: 5, borderRadius: 3, minWidth: 4,
                          background: (acc.suspicion_score || 0) >= 60
                            ? '#ef4444' : (acc.suspicion_score || 0) >= 40
                            ? '#f59e0b' : '#10b981',
                        }} />
                        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.8rem' }}>
                          {(acc.suspicion_score || 0).toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: '#22d3ee' }}>{(acc.activity_score || 0).toFixed(1)}</td>
                    <td>{(acc.followers_count || 0).toLocaleString()}</td>
                    <td>{(acc.ff_ratio || 0).toFixed(2)}</td>
                    <td>
                      <button
                        className="tab-btn"
                        style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                        onClick={() => onSelectAccount(acc.screen_name || acc.user_id)}
                      >
                        Investigate →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <button className="tab-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              ← Prev
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Page {data.page} / {data.pages} &nbsp;·&nbsp; {data.total.toLocaleString()} accounts
            </span>
            <button className="tab-btn" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Investigation Report ─────────────────────────────────────────────────────
function InvestigationReport({ query, onClear }) {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true); setError(null); setReport(null)
    axios.get(`${API}/api/investigate/account?query=${encodeURIComponent(query)}`)
      .then(r => setReport(r.data))
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [query])

  if (loading) return <div className="loading-box"><div className="spinner" /> Investigating account…</div>
  if (error) return (
    <div className="error-box">
      ⚠️ {error}
      <button className="btn-retry" onClick={onClear}>← Back</button>
    </div>
  )
  if (!report) return null

  const { identity, scores, verdict, verdict_color, ml_predictions,
          suspicion_reasons, features, population_comparison } = report

  const verdictColor = verdict_color === 'danger' ? '#ef4444'
    : verdict_color === 'warning' ? '#f59e0b' : '#10b981'

  // Radar data: compare account vs bot avg vs human avg (top 6 features)
  const radarFeatures = ['ff_ratio', 'tweets_per_day', 'suspicion_score',
    'activity_score', 'description_length', 'account_age_days']
  const radarData = radarFeatures.map(f => {
    const comp = population_comparison?.find(c => c.feature === f)
    if (!comp) return null
    // Normalize 0-1 for radar
    const maxVal = Math.max(comp.account, comp.bot_avg, comp.human_avg, 1)
    return {
      feature: f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      account: parseFloat((comp.account / maxVal).toFixed(3)),
      bot:     parseFloat((comp.bot_avg  / maxVal).toFixed(3)),
      human:   parseFloat((comp.human_avg / maxVal).toFixed(3)),
    }
  }).filter(Boolean)

  // Feature comparison bar (top 8)
  const featureBar = (population_comparison || []).slice(0, 8).map(c => ({
    feature:  c.feature.replace(/_/g, ' '),
    account:  parseFloat(c.account.toFixed(3)),
    bot_avg:  parseFloat(c.bot_avg.toFixed(3)),
    human_avg: parseFloat(c.human_avg.toFixed(3)),
  }))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button className="tab-btn" onClick={onClear} style={{ padding: '6px 14px' }}>
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: verdictColor }}>
            @{identity.screen_name || identity.user_id}
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {identity.name} &nbsp;·&nbsp;
            <span className={`label-badge label-badge--${identity.label}`}>{identity.label}</span>
          </div>
        </div>
      </div>

      {/* Verdict banner */}
      <div style={{
        padding: '16px 24px', borderRadius: 'var(--radius-sm)', marginBottom: 28,
        background: `${verdictColor}12`, border: `1px solid ${verdictColor}40`,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: '2rem' }}>
          {verdict_color === 'danger' ? '🚨' : verdict_color === 'warning' ? '⚠️' : '✅'}
        </span>
        <div>
          <div style={{ fontWeight: 800, color: verdictColor, fontSize: '1.1rem' }}>{verdict}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            Avg bot probability across {ml_predictions.length} models: {' '}
            <strong style={{ color: verdictColor }}>{(scores.avg_bot_prob * 100).toFixed(1)}%</strong>
            &nbsp;·&nbsp; Suspicion score: <strong style={{ color: '#f59e0b' }}>{scores.suspicion_score}</strong>
          </div>
        </div>
      </div>

      {/* Top row: scores + identity */}
      <div className="ba-grid-2" style={{ marginBottom: 24 }}>
        {/* Score gauges */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Risk Scores</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <RiskGauge score={scores.suspicion_score} label="Suspicion Score" />
            <RiskGauge score={scores.activity_score}  label="Activity Score"  />
            <RiskGauge score={scores.avg_bot_prob * 100} label="Bot Probability" />
          </div>
        </div>

        {/* Identity panel */}
        <div className="card">
          <div className="section-header"><div className="section-title">Account Identity</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['User ID',      identity.user_id],
              ['Screen Name',  '@' + identity.screen_name],
              ['Followers',    identity.followers?.toLocaleString()],
              ['Following',    identity.following?.toLocaleString()],
              ['Total Tweets', identity.statuses?.toLocaleString()],
              ['Account Age',  `${identity.account_age_days} days`],
              ['Verified',     identity.verified ? '✅ Yes' : '❌ No'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 10px', background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
              }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ML Predictions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">ML Model Predictions</div>
          <div className="section-subtitle">Bot probability from each trained classifier</div>
        </div>
        {ml_predictions.length === 0 ? (
          <div className="loading-box" style={{ color: 'var(--color-text-muted)' }}>
            Train models in ML Analysis first
          </div>
        ) : (
          ml_predictions.map((p, i) => (
            <ProbabilityBar key={i} model={p.model}
              botProb={p.bot_prob} humanProb={p.human_prob}
              prediction={p.prediction} />
          ))
        )}
      </div>

      {/* Suspicion reasoning */}
      {suspicion_reasons?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-header">
            <div className="section-title">Suspicion Factors</div>
            <div className="section-subtitle">Flags contributing to the suspicion score</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suspicion_reasons.map((r, i) => (
              <ReasonCard key={i} flag={r.flag} weight={r.weight} detail={r.detail} />
            ))}
          </div>
        </div>
      )}

      {/* Radar + bar comparison */}
      <div className="ba-grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-header">
            <div className="section-title">Feature Radar</div>
            <div className="section-subtitle">Account vs population averages (normalised)</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis tick={false} />
              <Radar name="This Account" dataKey="account" stroke={verdictColor}
                fill={verdictColor} fillOpacity={0.25} />
              <Radar name="Bot Avg"  dataKey="bot"   stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
              <Radar name="Human Avg" dataKey="human" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">Feature Comparison</div>
            <div className="section-subtitle">Account value vs bot/human averages</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureBar} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis type="category" dataKey="feature" width={110}
                tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="account"   fill={verdictColor} radius={[0,3,3,0]} name="Account" />
              <Bar dataKey="bot_avg"   fill="#ef4444"      radius={[0,3,3,0]} name="Bot Avg" opacity={0.6} />
              <Bar dataKey="human_avg" fill="#22d3ee"      radius={[0,3,3,0]} name="Human Avg" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Population comparison table */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Full Feature Table</div>
          <div className="section-subtitle">Account values vs bot & human population means</div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th style={{ color: verdictColor }}>This Account</th>
                <th style={{ color: '#ef4444' }}>Bot Avg</th>
                <th style={{ color: '#22d3ee' }}>Human Avg</th>
                <th>Closer To</th>
              </tr>
            </thead>
            <tbody>
              {(population_comparison || []).map((row, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--color-accent)', fontSize: '0.8rem' }}>
                    {row.feature}
                  </td>
                  <td style={{ fontWeight: 700, color: verdictColor }}>{row.account}</td>
                  <td style={{ color: '#ef4444' }}>{row.bot_avg}</td>
                  <td style={{ color: '#22d3ee' }}>{row.human_avg}</td>
                  <td>
                    <span className={`label-badge label-badge--${row.closer_to}`}>{row.closer_to}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountInvestigation() {
  const [stats,       setStats]       = useState(null)
  const [activeQuery, setActiveQuery] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/investigate/stats`)
      .then(r => setStats(r.data))
      .catch(() => {})
  }, [])

  const handleSearch = (query) => setActiveQuery(query.trim())
  const handleClear  = () => setActiveQuery(null)

  return (
    <div>
      <div className="page-header">
        <h1>Account Investigation</h1>
        <p>Phase 7 — Deep-dive bot probability, feature breakdown &amp; population comparison for any account</p>
      </div>

      {/* Stats bar */}
      {stats && !activeQuery && (
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
          {[
            { icon: '🧑‍💻', label: 'Labeled Accounts', value: stats.labeled_accounts?.toLocaleString(), color: 'var(--color-primary)' },
            { icon: '🚨', label: 'High Risk (≥60)',   value: stats.high_risk_count?.toLocaleString(),   color: '#ef4444' },
            { icon: '⚠️', label: 'Moderate Risk',     value: stats.moderate_risk_count?.toLocaleString(), color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ borderColor: s.color + '40' }}>
              <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
              <div className="stat-card__value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search bar */}
      {!activeQuery && (
        <>
          <div className="card" style={{ marginBottom: 28, display: 'flex', alignItems: 'center',
            gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div className="section-title" style={{ marginBottom: 8 }}>Search &amp; Investigate</div>
              <div className="section-subtitle">Enter a screen name, display name, or user ID</div>
            </div>
            <div style={{ flex: 1 }}>
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
          <AccountListPanel onSelectAccount={handleSearch} />
        </>
      )}

      {/* Investigation report */}
      {activeQuery && (
        <InvestigationReport query={activeQuery} onClear={handleClear} />
      )}
    </div>
  )
}
