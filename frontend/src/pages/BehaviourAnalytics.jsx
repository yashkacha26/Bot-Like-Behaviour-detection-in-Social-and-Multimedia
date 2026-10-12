import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area,
} from 'recharts'
import {
  Activity, Users, Bot, ShieldAlert, ChevronRight, Download,
  Search, Sliders, RefreshCw
} from 'lucide-react'
import api from '../api/client'

// ─── colour palette ──────────────────────────────────────────────────────────
const BOT_COLOR   = '#ef4444'
const HUMAN_COLOR = '#22d3ee'

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(val, format) {
  if (val === null || val === undefined) return '—'
  if (format === 'decimal') return Number(val).toFixed(2)
  if (format === 'pct')     return Number(val).toFixed(1) + '%'
  return Number(val).toLocaleString()
}

function useData(endpoint) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
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
function SectionHeader({ title, subtitle, rightContent }) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {rightContent}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="stat-card__value" style={{ color }}>{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  )
}

function LoadingBox() {
  return (
    <div className="loading-box">
      <div className="spinner" />
      <span>Loading behavioral intelligence metrics…</span>
    </div>
  )
}

function ErrorBox({ msg, retry }) {
  return (
    <div className="error-box">
      <span>{msg}</span>
      {retry && <button className="btn btn-secondary btn-sm" onClick={retry}>Retry</button>}
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
        <p key={p.name} style={{ color: p.color, fontSize: '0.8rem', marginTop: 2 }}>
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
      <StatCard label="Engineered Features"       value={data.total_features}   color="#6366f1" />
      <StatCard label="Audited Account Cohort"    value={data.labeled_accounts?.toLocaleString()} color="#f59e0b" />
      <StatCard label="Identified Bot Entities"   value={data.bot_count?.toLocaleString()}        color={BOT_COLOR} />
      <StatCard label="Verified Human Users"      value={data.human_count?.toLocaleString()}      color={HUMAN_COLOR} />
    </div>
  )
}

// ─── Section 2: Feature stats table with search ──────────────────────────────
function FeatureStatsTable() {
  const { data, loading, error } = useData('/features/stats')
  const [filterQuery, setFilterQuery] = useState('')

  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />

  const filtered = (data || []).filter(r =>
    r.feature.toLowerCase().includes(filterQuery.toLowerCase())
  )

  const handleExportFeatures = () => {
    const csvContent = 'data:text/csv;charset=utf-8,'
      + ['Feature,Bot Mean,Human Mean,Bot Median,Human Median,Bot Std,Human Std']
        .concat(filtered.map(r => `${r.feature},${r.bot_mean},${r.human_mean},${r.bot_median},${r.human_median},${r.bot_std},${r.human_std}`))
        .join('\n')
    const encoded = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encoded)
    link.setAttribute('download', `feature_statistics_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search features..."
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px 6px 30px',
              fontSize: '0.78rem',
              color: 'var(--color-text)',
              width: 220,
              outline: 'none',
            }}
          />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExportFeatures}>
          <Download size={13} />
          Export Feature Stats CSV
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Feature Name</th>
              <th style={{ color: BOT_COLOR }}>Bot Mean</th>
              <th style={{ color: HUMAN_COLOR }}>Human Mean</th>
              <th style={{ color: BOT_COLOR }}>Bot Median</th>
              <th style={{ color: HUMAN_COLOR }}>Human Median</th>
              <th style={{ color: BOT_COLOR }}>Bot Std</th>
              <th style={{ color: HUMAN_COLOR }}>Human Std</th>
              <th>Bot Samples</th>
              <th>Human Samples</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.feature}>
                <td className="feature-name" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                  {row.feature}
                </td>
                <td style={{ color: BOT_COLOR, fontFamily: 'var(--font-mono)' }}>{fmt(row.bot_mean, 'decimal')}</td>
                <td style={{ color: HUMAN_COLOR, fontFamily: 'var(--font-mono)' }}>{fmt(row.human_mean, 'decimal')}</td>
                <td style={{ color: BOT_COLOR, fontFamily: 'var(--font-mono)' }}>{fmt(row.bot_median, 'decimal')}</td>
                <td style={{ color: HUMAN_COLOR, fontFamily: 'var(--font-mono)' }}>{fmt(row.human_median, 'decimal')}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(row.bot_std, 'decimal')}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(row.human_std, 'decimal')}</td>
                <td className="mono-val">{row.bot_n}</td>
                <td className="mono-val">{row.human_n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    <ResponsiveContainer width="100%" height={340}>
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

  const merged = botBins.map((b, i) => ({
    bin: `${b.bin_start}–${b.bin_end}`,
    bot:   b.count,
    human: (humanBins[i] || {}).count || 0,
  }))

  return (
    <div>
      <div className="tab-row" style={{ marginBottom: 16 }}>
        {['suspicion_score', 'activity_score'].map(k => (
          <button
            key={k}
            className={`tab-btn${active === k ? ' active' : ''}`}
            onClick={() => setActive(k)}
          >
            {k === 'suspicion_score' ? 'Suspicion Index Distribution' : 'Activity Index Distribution'}
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

// ─── Section 7: Top suspicious accounts table with Working Audit Buttons ──────
function TopSuspiciousTable({ onNavigate }) {
  const { data, loading, error } = useData('/behaviour/top-suspicious?n=15')
  if (loading) return <LoadingBox />
  if (error)   return <ErrorBox msg={error} />
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Screen Name</th>
            <th>Class Label</th>
            <th style={{ color: BOT_COLOR }}>Suspicion Index</th>
            <th>Activity Score</th>
            <th>Followers</th>
            <th>Following</th>
            <th>Tweets/Day</th>
            <th>FF Ratio</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.user_id || i}>
              <td style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                #{String(i + 1).padStart(2, '0')}
              </td>
              <td className="feature-name" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>
                @{row.screen_name || row.user_id || '—'}
              </td>
              <td>
                <span className={`label-badge label-badge--${row.label}`}>{row.label || '?'}</span>
              </td>
              <td style={{ color: BOT_COLOR, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {fmt(row.suspicion_score, 'decimal')}
              </td>
              <td style={{ color: HUMAN_COLOR, fontFamily: 'var(--font-mono)' }}>{fmt(row.activity_score, 'decimal')}</td>
              <td className="mono-val">{fmt(row.followers_count)}</td>
              <td className="mono-val">{fmt(row.friends_count)}</td>
              <td className="mono-val">{fmt(row.tweets_per_day, 'decimal')}</td>
              <td className="mono-val">{fmt(row.ff_ratio, 'decimal')}</td>
              <td>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate && onNavigate('investigate', { query: row.screen_name || row.user_id })}
                  title={`Open forensic audit for @${row.screen_name || row.user_id}`}
                  style={{ padding: '3px 8px', fontSize: '0.72rem', gap: 4 }}
                >
                  Audit
                  <ChevronRight size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Section 8: Scatter plot with feature selectors & CSV export ──────────────
const SCATTER_FEATURES = [
  { value: 'ff_ratio',           label: 'Follower / Following Ratio' },
  { value: 'tweets_per_day',     label: 'Tweets / Day' },
  { value: 'favourites_per_day', label: 'Favourites / Day' },
  { value: 'suspicion_score',    label: 'Suspicion Score' },
  { value: 'activity_score',     label: 'Activity Score' },
  { value: 'account_age_days',   label: 'Account Age (Days)' },
  { value: 'followers_count',    label: 'Followers Count' },
  { value: 'friends_count',      label: 'Following Count' },
  { value: 'description_length', label: 'Description Length' },
]

function ScatterSection({ onNavigate }) {
  const [xFeat, setXFeat] = useState('ff_ratio')
  const [yFeat, setYFeat] = useState('tweets_per_day')
  const endpoint = `/behaviour/scatter?x=${xFeat}&y=${yFeat}&max_points=300`
  const { data, loading, error, reload } = useData(endpoint)

  const botPoints   = (data || []).filter(d => d.label === 'bot')
  const humanPoints = (data || []).filter(d => d.label === 'human')

  const handleExportScatter = () => {
    if (!data?.length) return
    const csvContent = 'data:text/csv;charset=utf-8,'
      + [`Account,Label,${xFeat},${yFeat}`]
        .concat(data.map(d => `${d.name || d.user_id || 'unknown'},${d.label},${d.x},${d.y}`))
        .join('\n')
    const encoded = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encoded)
    link.setAttribute('download', `scatter_${xFeat}_vs_${yFeat}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div className="scatter-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div className="scatter-select-wrap">
            <label className="scatter-label">X Axis Dimension</label>
            <select className="scatter-select" value={xFeat} onChange={e => setXFeat(e.target.value)}>
              {SCATTER_FEATURES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="scatter-select-wrap">
            <label className="scatter-label">Y Axis Dimension</label>
            <select className="scatter-select" value={yFeat} onChange={e => setYFeat(e.target.value)}>
              {SCATTER_FEATURES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleExportScatter} disabled={!data?.length}>
          <Download size={13} />
          Export Scatter CSV
        </button>
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
                    {d?.name && onNavigate && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--color-accent)', marginTop: 4 }}>
                        Click to audit in dossier
                      </p>
                    )}
                  </div>
                )
              }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Scatter
              name="Bot"
              data={botPoints}
              fill={BOT_COLOR}
              fillOpacity={0.7}
              onClick={(e) => {
                if (e?.name && onNavigate) onNavigate('investigate', { query: e.name })
              }}
              style={{ cursor: 'pointer' }}
            />
            <Scatter
              name="Human"
              data={humanPoints}
              fill={HUMAN_COLOR}
              fillOpacity={0.7}
              onClick={(e) => {
                if (e?.name && onNavigate) onNavigate('investigate', { query: e.name })
              }}
              style={{ cursor: 'pointer' }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BehaviourAnalytics({ onNavigate }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-header__kicker">
          <span className="badge badge-primary">Temporal Profiling</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            PHASE 3 FEATURE EXTRACTION
          </span>
        </div>
        <h1>Behavioral Dynamics &amp; Interaction Profiling</h1>
        <p>
          Statistical profiling of temporal activity patterns, posting velocity burstiness, following ratios, and composite entity risk indices.
        </p>
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
        <ScatterSection onNavigate={onNavigate} />
      </section>

      {/* Feature stats table */}
      <section className="ba-section card">
        <SectionHeader title="Feature Statistics Table" subtitle="Full descriptive stats (mean, median, std, percentiles) per feature" />
        <FeatureStatsTable />
      </section>

      {/* Top suspicious */}
      <section className="ba-section card">
        <SectionHeader title="Top Suspicious Accounts" subtitle="Accounts ranked by composite bot-suspicion score (higher = more bot-like)" />
        <TopSuspiciousTable onNavigate={onNavigate} />
      </section>
    </div>
  )
}
