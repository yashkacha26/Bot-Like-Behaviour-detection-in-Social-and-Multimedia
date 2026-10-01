import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
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
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: 'var(--radius-sm)', padding: '12px 16px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function NetworkAnalysis() {
  const [summary,    setSummary]    = useState(null)
  const [metrics,    setMetrics]    = useState([])
  const [degDist,    setDegDist]    = useState(null)
  const [labelMets,  setLabelMets]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [activeTab,  setActiveTab]  = useState('overview')

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, mRes, dRes, lRes] = await Promise.all([
        axios.get(`${API}/api/network/summary`),
        axios.get(`${API}/api/network/metrics?top_n=30`),
        axios.get(`${API}/api/network/degree-distribution`),
        axios.get(`${API}/api/network/label-metrics`),
      ])
      setSummary(sRes.data)
      setMetrics(mRes.data)
      setDegDist(dRes.data)
      setLabelMets(lRes.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Bot vs Human label metrics comparison
  const labelCompare = ['avg_degree', 'avg_in_degree', 'avg_out_degree'].map(key => {
    const entry = { metric: key.replace('avg_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }
    labelMets.forEach(m => { entry[m.label] = m[key] })
    return entry
  })

  // PageRank scatter data
  const botNodes   = metrics.filter(m => m.label === 'bot')
  const humanNodes = metrics.filter(m => m.label === 'human')

  return (
    <div>
      <div className="page-header">
        <h1>Network Analysis</h1>
        <p>Phase 5 — Graph metrics: Degree, In/Out-Degree, PageRank using NetworkX social graph</p>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 24 }}>
          ⚠️ {error}
          <button className="btn-retry" onClick={fetchAll}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="loading-box"><div className="spinner" /> Building network graph…</div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Summary stat cards */}
          <div className="ba-section">
            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 32 }}>
              <StatBadge label="Total Nodes"  value={summary.total_nodes.toLocaleString()} color="var(--color-primary)" />
              <StatBadge label="Total Edges"  value={summary.total_edges.toLocaleString()} color="var(--color-accent)"  />
              <StatBadge label="Avg Degree"   value={summary.avg_degree.toFixed(2)}        color="var(--color-success)" />
              <StatBadge label="Graph Density" value={summary.density.toFixed(6)}          color="var(--color-warning)" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <div style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                🤖 Bot Nodes: {summary.bot_nodes}
              </div>
              <div style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)',
                fontSize: '0.8rem', color: '#22d3ee', fontWeight: 600 }}>
                👤 Human Nodes: {summary.human_nodes}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tab-row" style={{ marginBottom: 24 }}>
            {[['overview', '📊 Label Metrics'], ['degree', '📈 Degree Distribution'],
              ['pagerank', '🏆 PageRank Table']].map(([id, label]) => (
              <button key={id} id={`net-tab-${id}`} className={`tab-btn${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {/* Label metrics comparison */}
          {activeTab === 'overview' && labelMets.length > 0 && (
            <div className="ba-grid-2">
              <div className="card">
                <div className="section-header">
                  <div className="section-title">Average Degree by Label</div>
                  <div className="section-subtitle">In, out, and total degree for bots vs humans</div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={labelCompare} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Bar dataKey="bot"   fill="#ef4444" radius={[4,4,0,0]} name="Bot" />
                    <Bar dataKey="human" fill="#22d3ee" radius={[4,4,0,0]} name="Human" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="section-header">
                  <div className="section-title">Avg PageRank by Label</div>
                  <div className="section-subtitle">PageRank (α=0.85) — higher = more influential</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                  {labelMets.map(m => {
                    const color = m.label === 'bot' ? '#ef4444' : '#22d3ee'
                    const pct   = (m.avg_pagerank / Math.max(...labelMets.map(x => x.avg_pagerank))) * 100
                    return (
                      <div key={m.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span className={`label-badge label-badge--${m.label}`}>{m.label}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>
                            {m.avg_pagerank.toFixed(6)} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', fontWeight: 400 }}>avg PageRank</span>
                          </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                          {m.count} nodes · Avg degree {m.avg_degree.toFixed(1)} · Avg out-degree {m.avg_out_degree.toFixed(1)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Degree distribution */}
          {activeTab === 'degree' && degDist && (
            <div className="ba-grid-2">
              {['bot', 'human'].map(lbl => (
                <div key={lbl} className="card">
                  <div className="section-header">
                    <div className="section-title" style={{ color: lbl === 'bot' ? '#ef4444' : '#22d3ee' }}>
                      {lbl === 'bot' ? '🤖 Bot' : '👤 Human'} — Degree Distribution
                    </div>
                    <div className="section-subtitle">Mean degree: {degDist[`${lbl}_mean`]}</div>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={degDist[lbl]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="bin_start" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={lbl === 'bot' ? '#ef4444' : '#22d3ee'}
                        radius={[4,4,0,0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {/* PageRank table */}
          {activeTab === 'pagerank' && metrics.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">Top Nodes by PageRank</div>
                <div className="section-subtitle">Sorted by PageRank score descending</div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Node ID</th><th>Label</th>
                      <th>PageRank</th><th>Degree</th><th>In-Degree</th><th>Out-Degree</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m, i) => (
                      <tr key={m.node}>
                        <td style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--color-accent)', fontSize: '0.78rem' }}>
                          {m.node.substring(0, 12)}…
                        </td>
                        <td>
                          <span className={`label-badge label-badge--${m.label}`}>{m.label}</span>
                        </td>
                        <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          {m.pagerank.toFixed(6)}
                        </td>
                        <td>{m.degree}</td>
                        <td style={{ color: '#22d3ee' }}>{m.in_degree}</td>
                        <td style={{ color: '#f59e0b' }}>{m.out_degree}</td>
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
