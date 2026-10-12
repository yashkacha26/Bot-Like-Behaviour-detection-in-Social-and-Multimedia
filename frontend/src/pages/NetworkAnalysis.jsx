import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  Network, Bot, User, BarChart3, TrendingUp,
  Award, AlertTriangle, RefreshCw, Download, Search, ChevronRight
} from 'lucide-react'
import api from '../api/client'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="recharts-custom-tooltip">
      <div className="recharts-custom-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.8rem', marginTop: 2, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <span>{p.name}:</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>
            {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
          </strong>
        </div>
      ))}
    </div>
  )
}

function StatBadge({ label, value, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `2px solid ${color}` }}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value" style={{ color, margin: '6px 0 0' }}>{value}</div>
    </div>
  )
}

export default function NetworkAnalysis({ onNavigate }) {
  const [summary,    setSummary]    = useState(null)
  const [metrics,    setMetrics]    = useState([])
  const [degDist,    setDegDist]    = useState(null)
  const [labelMets,  setLabelMets]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [activeTab,  setActiveTab]  = useState('overview')

  // Table filtering
  const [nodeFilter, setNodeFilter] = useState('all')
  const [searchNode, setSearchNode] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, mRes, dRes, lRes] = await Promise.all([
        api.get('/network/summary'),
        api.get('/network/metrics?top_n=30'),
        api.get('/network/degree-distribution'),
        api.get('/network/label-metrics'),
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

  const handleExportTopology = () => {
    const payload = {
      summary,
      metrics,
      degreeDistribution: degDist,
      labelMetrics: labelMets,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `network_topology_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const labelCompare = ['avg_degree', 'avg_in_degree', 'avg_out_degree'].map(key => {
    const entry = { metric: key.replace('avg_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }
    labelMets.forEach(m => { entry[m.label] = m[key] })
    return entry
  })

  const filteredMetrics = metrics.filter(m => {
    const matchClass = nodeFilter === 'all' || m.label === nodeFilter
    const matchSearch = !searchNode || m.node.toLowerCase().includes(searchNode.toLowerCase())
    return matchClass && matchSearch
  })

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="page-header__kicker">
            <span className="badge badge-primary">Graph Analytics</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>PHASE 5 NETWORKX</span>
          </div>
          <h1>Social Graph Topology &amp; Centrality Analysis</h1>
          <p>Directed social follower interaction graphs, in/out-degree centrality distribution, and PageRank influence scoring.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            Refresh Graph
          </button>
          <button className="btn btn-secondary" onClick={handleExportTopology} disabled={!summary}>
            <Download size={14} />
            Export Graph JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="loading-box"><div className="spinner" /> Building network graph topology...</div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <StatBadge label="Total Graph Nodes"  value={summary.total_nodes.toLocaleString()} color="var(--color-primary)" />
            <StatBadge label="Interaction Edges"  value={summary.total_edges.toLocaleString()} color="var(--color-accent)"  />
            <StatBadge label="Mean Degree"        value={summary.avg_degree.toFixed(2)}        color="var(--color-success)" />
            <StatBadge label="Density Index"      value={summary.density.toFixed(6)}          color="var(--color-warning)" />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
              fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600, fontFamily: 'var(--font-mono)'
            }}>
              <Bot size={15} />
              Bot Nodes: {summary.bot_nodes}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600, fontFamily: 'var(--font-mono)'
            }}>
              <User size={15} />
              Human Nodes: {summary.human_nodes}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tab-row" style={{ marginBottom: 20 }}>
            {[
              ['overview', 'Label Metrics Comparison'],
              ['degree',   'Degree Distribution Histogram'],
              ['pagerank', 'PageRank Centrality Leaderboard']
            ].map(([id, label]) => (
              <button
                key={id}
                id={`net-tab-${id}`}
                className={`tab-btn${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Label metrics comparison */}
          {activeTab === 'overview' && labelMets.length > 0 && (
            <div className="ba-grid-2">
              <div className="card">
                <div className="section-header">
                  <div>
                    <div className="section-title">Average Degree by Class Label</div>
                    <div className="section-subtitle">Comparative in-degree, out-degree, and total connections</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={labelCompare} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                    <Bar dataKey="bot"   fill="#f43f5e" radius={[3,3,0,0]} name="Bot" />
                    <Bar dataKey="human" fill="#10b981" radius={[3,3,0,0]} name="Human" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="section-header">
                  <div>
                    <div className="section-title">Mean PageRank Influence by Class</div>
                    <div className="section-subtitle">Random walk stationary distribution (damping factor α=0.85)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
                  {labelMets.map(m => {
                    const color = m.label === 'bot' ? 'var(--color-danger)' : 'var(--color-success)'
                    const maxPR = Math.max(...labelMets.map(x => x.avg_pagerank)) || 1
                    const pct   = (m.avg_pagerank / maxPR) * 100
                    return (
                      <div key={m.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span className={`label-badge label-badge--${m.label}`}>{m.label}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                            {m.avg_pagerank.toFixed(6)}{' '}
                            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.72rem', fontWeight: 400 }}>avg PR</span>
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--color-surface-3)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color }} />
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
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
                    <div>
                      <div className="section-title" style={{ color: lbl === 'bot' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {lbl === 'bot' ? 'Bot Nodes' : 'Organic Human Nodes'} — Degree Distribution
                      </div>
                      <div className="section-subtitle">Mean node degree: {degDist[`${lbl}_mean`]}</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={degDist[lbl]}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="bin_start" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={lbl === 'bot' ? '#f43f5e' : '#10b981'} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {/* PageRank table with search, class filter, and AUDIT NODE button */}
          {activeTab === 'pagerank' && metrics.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">Highest PageRank Network Nodes</div>
                  <div className="section-subtitle">Global influence ranking across connected components</div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['all', 'bot', 'human'].map(k => (
                      <button
                        key={k}
                        className={`tab-btn${nodeFilter === k ? ' active' : ''}`}
                        onClick={() => setNodeFilter(k)}
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      >
                        {k.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Filter node id..."
                      value={searchNode}
                      onChange={e => setSearchNode(e.target.value)}
                      style={{
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 8px 4px 26px',
                        fontSize: '0.74rem',
                        color: 'var(--color-text)',
                        width: 140,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Node Identifier</th>
                      <th>Entity Class</th>
                      <th>PageRank</th>
                      <th>Degree</th>
                      <th>In-Degree</th>
                      <th>Out-Degree</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMetrics.map((m, i) => (
                      <tr key={m.node}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
                          #{String(i + 1).padStart(2, '0')}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontSize: '0.78rem' }}>
                          {m.node}
                        </td>
                        <td>
                          <span className={`label-badge label-badge--${m.label}`}>{m.label}</span>
                        </td>
                        <td className="mono-val" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          {m.pagerank.toFixed(6)}
                        </td>
                        <td className="mono-val">{m.degree}</td>
                        <td className="mono-val" style={{ color: 'var(--color-accent)' }}>{m.in_degree}</td>
                        <td className="mono-val" style={{ color: 'var(--color-warning)' }}>{m.out_degree}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onNavigate && onNavigate('investigate', { query: m.node })}
                            title={`Audit node ${m.node} in forensic dossier`}
                            style={{ padding: '2px 7px', fontSize: '0.7rem', gap: 4 }}
                          >
                            Audit
                            <ChevronRight size={11} />
                          </button>
                        </td>
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
