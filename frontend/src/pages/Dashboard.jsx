import React, { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from 'recharts'
import axios from 'axios'

const API = 'http://localhost:8000'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="recharts-custom-tooltip">
      <div className="recharts-custom-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.8rem', marginTop: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

const PIE_COLORS = ['#ef4444', '#22d3ee']
const MODEL_COLORS = {
  'Logistic Regression': '#6366f1',
  'Decision Tree':       '#22d3ee',
  'Random Forest':       '#10b981',
}

const PHASES = [
  { id: 0, label: 'Project Planning',             done: true },
  { id: 1, label: 'Project Foundation',           done: true },
  { id: 2, label: 'Data Preprocessing & EDA',     done: true },
  { id: 3, label: 'Feature Engineering',          done: true },
  { id: 4, label: 'Machine Learning Pipeline',    done: true },
  { id: 5, label: 'NLP & Network Analysis',       done: true },
  { id: 6, label: 'Dashboard & Integration',      done: true },
  { id: 7, label: 'Account Investigation',        done: false },
  { id: 8, label: 'Testing & Documentation',      done: false },
]

function OverviewCard({ icon, label, value, sub, color, gradient }) {
  return (
    <div className="stat-card" style={{
      background: `linear-gradient(135deg, ${gradient || 'var(--color-surface)'}, var(--color-surface))`,
      borderColor: `${color}40`,
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <div className="stat-card__value" style={{ color }}>{value}</div>
      <div className="stat-card__label">{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [summary,     setSummary]     = useState(null)
  const [mlMetrics,   setMlMetrics]   = useState([])
  const [topSuspect,  setTopSuspect]  = useState([])
  const [behaviour,   setBehaviour]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, mlRes, tsRes, bRes] = await Promise.all([
        axios.get(`${API}/api/dashboard/summary`),
        axios.get(`${API}/api/ml/metrics`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/behaviour/top-suspicious?n=10`),
        axios.get(`${API}/api/behaviour/comparison`),
      ])
      setSummary(sRes.data)
      setMlMetrics(mlRes.data)
      setTopSuspect(tsRes.data)
      setBehaviour(bRes.data.comparison || [])
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const pieData = summary ? [
    { name: 'Bot',   value: summary.bot_count },
    { name: 'Human', value: summary.human_count },
  ] : []

  const mlBarData = mlMetrics.map(m => ({
    model:    m.model,
    Accuracy: parseFloat((m.test_accuracy  * 100).toFixed(1)),
    F1:       parseFloat((m.test_f1        * 100).toFixed(1)),
    'ROC-AUC':parseFloat((m.test_roc_auc   * 100).toFixed(1)),
  }))

  const radialData = mlMetrics.map(m => ({
    name:  m.model,
    value: parseFloat((m.test_f1 * 100).toFixed(1)),
    fill:  MODEL_COLORS[m.model] || 'var(--color-primary)',
  }))

  const doneCount = PHASES.filter(p => p.done).length

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Phase 6 — Overview of Bot Detection System: data, ML performance, and network stats</p>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 24 }}>
          ⚠️ {error}
          <button className="btn-retry" onClick={fetchAll}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="loading-box"><div className="spinner" /> Loading dashboard…</div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Demo banner */}
          {summary.is_demo && (
            <div style={{
              padding: '10px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 24,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: '0.82rem', color: '#f59e0b',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠️ Demo mode — synthetic TwiBot-20 data. Place real data at{' '}
              <code style={{ fontFamily: 'monospace' }}>data/raw/TwiBot-20_sample.json</code>
            </div>
          )}

          {/* Top stat cards */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 32 }}>
            <OverviewCard icon="🧑‍💻" label="Total Accounts" value={summary.total_accounts.toLocaleString()}
              color="var(--color-primary)" />
            <OverviewCard icon="🤖" label="Bot Accounts"
              value={`${summary.bot_count.toLocaleString()} (${summary.bot_pct}%)`}
              color="#ef4444" />
            <OverviewCard icon="⚠️" label="Avg Suspicion Score"
              value={summary.avg_suspicion_score}
              sub="0–100 composite" color="var(--color-warning)" />
            <OverviewCard icon="🧠" label="Best Model Accuracy"
              value={summary.best_model.accuracy
                ? `${(summary.best_model.accuracy * 100).toFixed(1)}%`
                : 'Not trained'}
              sub={summary.best_model.name !== 'N/A' ? summary.best_model.name : 'Run ML Analysis first'}
              color="var(--color-success)" />
          </div>

          {/* Charts row 1 */}
          <div className="ba-grid-2" style={{ marginBottom: 32 }}>
            {/* Pie: class distribution */}
            <div className="card">
              <div className="section-header">
                <div className="section-title">Account Distribution</div>
                <div className="section-subtitle">Bot vs Human class balance</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90}
                    dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8' }}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ML Model F1 radial */}
            <div className="card">
              <div className="section-header">
                <div className="section-title">ML Model F1 Scores</div>
                <div className="section-subtitle">
                  {mlMetrics.length ? 'Comparison of all trained models' : 'Train models in ML Analysis first'}
                </div>
              </div>
              {mlMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius={30} outerRadius={110}
                    data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar minAngle={10} dataKey="value" cornerRadius={6}
                      label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '0.78rem', paddingTop: 8 }}
                      formatter={(value, entry) =>
                        `${entry.payload.name}: ${entry.payload.value}%`
                      } />
                    <Tooltip formatter={v => `${v}%`} />
                  </RadialBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="loading-box" style={{ height: 200, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  Navigate to <strong>ML Analysis</strong> and click <strong>Train Models</strong> first
                </div>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="ba-grid-2" style={{ marginBottom: 32 }}>
            {/* Behaviour comparison mini */}
            <div className="card">
              <div className="section-header">
                <div className="section-title">Behaviour Comparison</div>
                <div className="section-subtitle">Bot vs Human mean values (selected metrics)</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={behaviour.slice(4, 9)} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Bar dataKey="bot"   fill="#ef4444" radius={[4,4,0,0]} name="Bot" />
                  <Bar dataKey="human" fill="#22d3ee" radius={[4,4,0,0]} name="Human" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Network stats */}
            <div className="card">
              <div className="section-header">
                <div className="section-title">Network & System Stats</div>
                <div className="section-subtitle">Graph overview and project progress</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Graph Nodes</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {summary.network.nodes.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Graph Edges</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                    {summary.network.edges.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Best F1 Score</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    {summary.best_model.f1
                      ? `${(summary.best_model.f1 * 100).toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
                <div style={{
                  padding: '10px 14px', background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                }}>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Phase Progress ({doneCount}/{PHASES.length})
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${(doneCount / PHASES.length) * 100}%`,
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase tracker */}
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="section-header">
              <div className="section-title">Project Phase Tracker</div>
              <div className="section-subtitle">{doneCount} of {PHASES.length} phases complete</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {PHASES.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: p.done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                  border: p.done ? '1px solid rgba(16,185,129,0.25)' : '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{p.done ? '✅' : '⏳'}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                      Phase {p.id}
                    </div>
                    <div style={{
                      fontSize: '0.82rem', fontWeight: 600,
                      color: p.done ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}>
                      {p.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top suspicious accounts */}
          {topSuspect.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">Top Suspicious Accounts</div>
                <div className="section-subtitle">Ranked by composite suspicion score</div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Screen Name</th><th>Label</th>
                      <th>Suspicion Score</th><th>Tweets/Day</th><th>FF Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSuspect.slice(0, 8).map((a, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--color-accent)', fontSize: '0.8rem' }}>
                          @{a.screen_name || a.user_id}
                        </td>
                        <td>
                          <span className={`label-badge label-badge--${a.label}`}>{a.label}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: `${a.suspicion_score}%`, height: 6, borderRadius: 3,
                              background: `linear-gradient(90deg, #f59e0b, #ef4444)`,
                              minWidth: 4,
                            }} />
                            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>
                              {a.suspicion_score}
                            </span>
                          </div>
                        </td>
                        <td>{(a.tweets_per_day || 0).toFixed(2)}</td>
                        <td>{(a.ff_ratio || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
