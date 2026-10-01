import React, { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area,
  Cell, RadialBarChart, RadialBar,
} from 'recharts'
import api from '../api/client'

// ─── colour palette ──────────────────────────────────────────────────────────
const BOT_COLOR   = '#ef4444'
const HUMAN_COLOR = '#22d3ee'
const BOT_SOFT    = 'rgba(239,68,68,0.18)'
const HUMAN_SOFT  = 'rgba(34,211,238,0.18)'

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(val, format) {
  if (val === null || val === undefined) return '—'
  if (format === 'decimal') return Number(val).toFixed(2)
  if (format === 'pct')     return Number(val).toFixed(1) + '%'
  return Number(val).toLocaleString()
}

function useData(endpoint) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const load = useCallback(() => {
    setLoading(true); setError(null)
    api.get(endpoint)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [endpoint])
  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load }
}

// ─── sub-components ──────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="stat-card" style={{ borderColor: color + '55' }}>
      <div className="stat-card__icon" style={{ color }}>{icon}</div>
      <div className="stat-card__value" style={{ color }}>{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  )
}

function LoadingBox() {
  return (
    <div className="loading-box">
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  )
}

function ErrorBox({ msg, retry }) {
  return (
    <div className="error-box">
      <span>⚠ {msg}</span>
      {retry && <button className="btn-retry" onClick={retry}>Retry</button>}
    </div>
  )
}

// custom tooltip shared across bar charts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="recharts-custom-tooltip">
      <p className="recharts-custom-tooltip__label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Section 1: Summary stat cards ───────────────────────────────────────────
function FeatureSummaryCards() {
  const { data, loading, error } = useData('/features/summary')
  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />
  return (
    <div className="stat-grid">
      <StatCard label="Total Features"     value={data.total_features}    color="#6366f1" icon="⚙️" />
      <StatCard label="Labeled Accounts"   value={data.labeled_accounts}  color="#f59e0b" icon="🏷️" />
      <StatCard label="Bot Accounts"       value={data.bot_count}         color={BOT_COLOR}   icon="🤖" />
      <StatCard label="Human Accounts"     value={data.human_count}       color={HUMAN_COLOR} icon="👤" />
    </div>
  )
}

// ─── Section 2: Feature stats table ──────────────────────────────────────────
function FeatureStatsTable() {
  const { data, loading, error } = useData('/features/stats')
  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th style={{ color: BOT_COLOR }}>Bot Mean</th>
            <th style={{ color: HUMAN_COLOR }}>Human Mean</th>
            <th style={{ color: BOT_COLOR }}>Bot Median</th>
            <th style={{ color: HUMAN_COLOR }}>Human Median</th>
            <th style={{ color: BOT_COLOR }}>Bot Std</th>
            <th style={{ color: HUMAN_COLOR }}>Human Std</th>
            <th>Bot N</th>
            <th>Human N</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.feature}>
              <td className="feature-name">{row.feature}</td>
              <td style={{ color: BOT_COLOR }}>{fmt(row.bot_mean, 'decimal')}</td>
              <td style={{ color: HUMAN_COLOR }}>{fmt(row.human_mean, 'decimal')}</td>
              <td style={{ color: BOT_COLOR }}>{fmt(row.bot_median, 'decimal')}</td>
              <td style={{ color: HUMAN_COLOR }}>{fmt(row.human_median, 'decimal')}</td>
              <td>{fmt(row.bot_std, 'decimal')}</td>
              <td>{fmt(row.human_std, 'decimal')}</td>
              <td>{row.bot_n}</td>
              <td>{row.human_n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Section 3: Behaviour comparison bar chart ────────────────────────────────
function BehaviourComparisonChart() {
  const { data, loading, error } = useData('/behaviour/comparison')
  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />
  const rows = data.comparison || []
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={rows} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar dataKey="bot"   name="Bot"   fill={BOT_COLOR}   radius={[4,4,0,0]} />
        <Bar dataKey="human" name="Human" fill={HUMAN_COLOR} radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Section 4: Boolean feature rates ────────────────────────────────────────
function BooleanRatesChart() {
  const { data, loading, error } = useData('/behaviour/boolean-rates')
  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 110, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis dataKey="feature" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={105} />
        <Tooltip formatter={(v) => v.toFixed(1) + '%'} content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar dataKey="bot_pct"   name="Bot %"   fill={BOT_COLOR}   radius={[0,4,4,0]} />
        <Bar dataKey="human_pct" name="Human %" fill={HUMAN_COLOR} radius={[0,4,4,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Section 5: Score distributions ──────────────────────────────────────────
function ScoreDistributions() {
  const { data, loading, error } = useData('/behaviour/score-distributions')
  const [active, setActive] = useState('suspicion_score')
  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />

  const dist = data[active] || {}
  const botBins   = dist.bot   || []
  const humanBins = dist.human || []

  // merge into single array for recharts
  const merged = botBins.map((b, i) => ({
    bin: `${b.bin_start}–${b.bin_end}`,
    bot:   b.count,
    human: (humanBins[i] || {}).count || 0,
  }))

  return (
    <div>
      <div className="tab-row">
        {['suspicion_score', 'activity_score'].map(k => (
          <button
            key={k}
            className={`tab-btn${active === k ? ' active' : ''}`}
            onClick={() => setActive(k)}
          >
            {k === 'suspicion_score' ? '🔴 Suspicion Score' : '🟢 Activity Score'}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={BOT_COLOR} stopOpacity={0.5} />
              <stop offset="95%" stopColor={BOT_COLOR} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="humanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={HUMAN_COLOR} stopOpacity={0.5} />
              <stop offset="95%" stopColor={HUMAN_COLOR} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="bin" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Area type="monotone" dataKey="bot"   name="Bot"   stroke={BOT_COLOR}   fill="url(#botGrad)"   strokeWidth={2} />
          <Area type="monotone" dataKey="human" name="Human" stroke={HUMAN_COLOR} fill="url(#humanGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Section 6: Account tier stacked bar ──────────────────────────────────────
function AccountTierChart() {
  const { data, loading, error } = useData('/behaviour/account-tiers')
  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="tier" tick={{ fill: '#94a3b8', fontSize: 13 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar dataKey="bot"   name="Bot"   stackId="a" fill={BOT_COLOR}   radius={[0,0,0,0]} />
        <Bar dataKey="human" name="Human" stackId="a" fill={HUMAN_COLOR} radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Section 7: Top suspicious accounts table ─────────────────────────────────
function TopSuspiciousTable() {
  const { data, loading, error } = useData('/behaviour/top-suspicious?n=15')
  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Screen Name</th>
            <th>Label</th>
            <th style={{ color: BOT_COLOR }}>Suspicion ↑</th>
            <th>Activity</th>
            <th>Followers</th>
            <th>Following</th>
            <th>Tweets/Day</th>
            <th>FF Ratio</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.user_id || i}>
              <td style={{ color: '#64748b', fontWeight: 600 }}>{i + 1}</td>
              <td className="feature-name">@{row.screen_name || '—'}</td>
              <td>
                <span className={`label-badge label-badge--${row.label}`}>{row.label || '?'}</span>
              </td>
              <td style={{ color: BOT_COLOR, fontWeight: 700 }}>{fmt(row.suspicion_score, 'decimal')}</td>
              <td style={{ color: HUMAN_COLOR }}>{fmt(row.activity_score, 'decimal')}</td>
              <td>{fmt(row.followers_count)}</td>
              <td>{fmt(row.friends_count)}</td>
              <td>{fmt(row.tweets_per_day, 'decimal')}</td>
              <td>{fmt(row.ff_ratio, 'decimal')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Section 8: Scatter plot with feature selectors ──────────────────────────
const SCATTER_FEATURES = [
  { value: 'ff_ratio',           label: 'FF Ratio' },
  { value: 'tweets_per_day',     label: 'Tweets / Day' },
  { value: 'favourites_per_day', label: 'Favourites / Day' },
  { value: 'suspicion_score',    label: 'Suspicion Score' },
  { value: 'activity_score',     label: 'Activity Score' },
  { value: 'account_age_days',   label: 'Account Age (days)' },
  { value: 'followers_count',    label: 'Followers' },
  { value: 'friends_count',      label: 'Following' },
  { value: 'description_length', label: 'Description Length' },
]

function ScatterSection() {
  const [xFeat, setXFeat] = useState('ff_ratio')
  const [yFeat, setYFeat] = useState('tweets_per_day')
  const endpoint = `/behaviour/scatter?x=${xFeat}&y=${yFeat}&max_points=300`
  const { data, loading, error, reload } = useData(endpoint)

  const botPoints   = (data || []).filter(d => d.label === 'bot')
  const humanPoints = (data || []).filter(d => d.label === 'human')

  return (
    <div>
      <div className="scatter-controls">
        <div className="scatter-select-wrap">
          <label className="scatter-label">X Axis</label>
          <select className="scatter-select" value={xFeat} onChange={e => setXFeat(e.target.value)}>
            {SCATTER_FEATURES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="scatter-select-wrap">
          <label className="scatter-label">Y Axis</label>
          <select className="scatter-select" value={yFeat} onChange={e => setYFeat(e.target.value)}>
            {SCATTER_FEATURES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>
      {loading ? <LoadingBox /> : error ? <ErrorBox msg={error} retry={reload} /> : (
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" name={xFeat} tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: xFeat, fill: '#64748b', position: 'insideBottom', offset: -4, fontSize: 11 }} />
            <YAxis dataKey="y" name={yFeat} tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: yFeat, fill: '#64748b', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <div className="recharts-custom-tooltip">
                    <p style={{ color: d?.label === 'bot' ? BOT_COLOR : HUMAN_COLOR, fontWeight: 700 }}>
                      {d?.label?.toUpperCase()} {d?.name ? `— @${d.name}` : ''}
                    </p>
                    <p>{xFeat}: <strong>{d?.x}</strong></p>
                    <p>{yFeat}: <strong>{d?.y}</strong></p>
                  </div>
                )
              }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Scatter name="Bot"   data={botPoints}   fill={BOT_COLOR}   fillOpacity={0.7} />
            <Scatter name="Human" data={humanPoints} fill={HUMAN_COLOR} fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BehaviourAnalytics() {
  return (
    <div>
      <div className="page-header">
        <h1>Behaviour Analytics</h1>
        <p>Phase 3 — Feature Engineering &amp; Statistical Behaviour Comparison (Bot vs Human)</p>
      </div>

      {/* Stat summary cards */}
      <section className="ba-section">
        <SectionHeader title="Dataset Overview" subtitle="Engineered feature set and labeled account breakdown" />
        <FeatureSummaryCards />
      </section>

      {/* Behaviour comparison */}
      <div className="ba-grid-2">
        <section className="ba-section card">
          <SectionHeader title="Bot vs Human — Mean Feature Comparison" subtitle="Average metric values per class" />
          <BehaviourComparisonChart />
        </section>
        <section className="ba-section card">
          <SectionHeader title="Boolean Feature Rates" subtitle="% of accounts with each boolean flag = True" />
          <BooleanRatesChart />
        </section>
      </div>

      {/* Score distributions */}
      <section className="ba-section card">
        <SectionHeader title="Score Distributions" subtitle="Distribution of composite scores across bots and humans" />
        <ScoreDistributions />
      </section>

      {/* Account tiers */}
      <section className="ba-section card">
        <SectionHeader title="Account Tier Distribution" subtitle="Bot vs human split by follower count tier" />
        <AccountTierChart />
      </section>

      {/* Scatter plot */}
      <section className="ba-section card">
        <SectionHeader title="Feature Scatter Plot" subtitle="Select any two features to visualise bot vs human separation" />
        <ScatterSection />
      </section>

      {/* Feature stats table */}
      <section className="ba-section card">
        <SectionHeader title="Feature Statistics Table" subtitle="Full descriptive stats (mean, median, std, percentiles) per feature" />
        <FeatureStatsTable />
      </section>

      {/* Top suspicious */}
      <section className="ba-section card">
        <SectionHeader title="Top Suspicious Accounts" subtitle="Accounts ranked by composite bot-suspicion score (higher = more bot-like)" />
        <TopSuspiciousTable />
      </section>
    </div>
  )
}
