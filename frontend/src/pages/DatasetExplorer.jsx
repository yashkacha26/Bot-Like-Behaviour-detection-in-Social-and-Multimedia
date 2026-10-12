import React, { useEffect, useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Database, AlertTriangle, CheckCircle, Info, RefreshCw,
  Download, Search, Filter, ExternalLink, ChevronRight, Layers, FileCode
} from 'lucide-react'
import api from '../api/client'

/* ── colour palette ─────────────────────────────────────────────────────── */
const COLORS = { bot: '#ef4444', human: '#10b981', unlabeled: '#6366f1' }
const BAR_COLOR = '#6366f1'

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `2px solid ${color || 'var(--color-primary)'}` }}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value" style={{ color: color || 'var(--color-accent)', margin: '6px 0 2px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, rightContent }) {
  return (
    <div className="section-header" style={{ marginTop: 28, marginBottom: 14 }}>
      <div className="section-title">
        <Icon size={16} style={{ color: 'var(--color-primary)' }} />
        {title}
      </div>
      {rightContent}
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="card loading-box" style={{ padding: 60 }}>
      <div className="spinner" />
      <span>Loading TwiBot-20 schema &amp; sample metrics…</span>
    </div>
  )
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="card error-box" style={{ padding: 40, flexDirection: 'column', gap: 14, textAlign: 'center' }}>
      <AlertTriangle size={36} style={{ color: 'var(--color-danger)' }} />
      <div style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{message}</div>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RefreshCw size={13} />
          Retry Connection
        </button>
      )}
    </div>
  )
}

function DemoBanner({ note }) {
  if (!note) return null
  return (
    <div style={{
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 16px',
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 20,
    }}>
      <Info size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
      <div style={{ fontSize: '0.82rem', color: 'var(--color-warning)' }}>
        <strong>Benchmark Ingestion:</strong> {note}
      </div>
    </div>
  )
}

export default function DatasetExplorer({ onNavigate }) {
  const [summary, setSummary]         = useState(null)
  const [dist, setDist]               = useState([])
  const [missing, setMissing]         = useState([])
  const [sample, setSample]           = useState([])
  const [columns, setColumns]         = useState([])
  const [dupInfo, setDupInfo]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [reloading, setReloading]     = useState(false)
  const [error, setError]             = useState(null)
  const [reloadNotice, setReloadNotice] = useState(false)

  // Interactive filters
  const [sampleCount, setSampleCount] = useState(15)
  const [classFilter, setClassFilter] = useState('all')
  const [columnSearch, setColumnSearch] = useState('')

  const fetchAll = async (n = sampleCount) => {
    try {
      const [sumRes, distRes, misRes, smpRes, colRes, dupRes] = await Promise.all([
        api.get('/dataset/summary'),
        api.get('/dataset/distribution'),
        api.get('/dataset/missing'),
        api.get(`/dataset/sample?n=${n}`),
        api.get('/dataset/columns'),
        api.get('/dataset/duplicates'),
      ])
      setSummary(sumRes.data)
      setDist(distRes.data)
      setMissing(misRes.data.slice(0, 12))
      setSample(smpRes.data)
      setColumns(colRes.data)
      setDupInfo(dupRes.data)
    } catch (e) {
      setError(e.message || 'Failed to load dataset telemetry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll(sampleCount)
  }, [sampleCount])

  const handleForceReload = async () => {
    setReloading(true)
    try {
      await api.post('/dataset/reload')
      await fetchAll(sampleCount)
      setReloadNotice(true)
      setTimeout(() => setReloadNotice(false), 3000)
    } catch (e) {
      setError('Reload failed: ' + e.message)
    } finally {
      setReloading(false)
    }
  }

  const handleExportSchema = () => {
    const exportData = {
      summary,
      distribution: dist,
      missingValues: missing,
      columns,
      duplicates: dupInfo,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `twibot20-schema-metadata-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) return <LoadingCard />
  if (error)   return <ErrorCard message={error} onRetry={() => { setError(null); fetchAll() }} />

  /* ── Distribution pie data ── */
  const pieData = dist.map(d => ({
    name: d.label === 'bot' ? 'Bot' : d.label === 'human' ? 'Human' : d.label,
    value: d.count,
    color: COLORS[d.label] || '#6366f1',
  }))

  /* ── Missing values bar data ── */
  const missingBar = missing.map(m => ({
    col: m.column.length > 18 ? m.column.slice(0, 16) + '…' : m.column,
    fullCol: m.column,
    pct: m.missing_pct,
    count: m.missing_count,
  }))

  /* ── Filtered columns ── */
  const filteredColumns = columns.filter(c =>
    c.column.toLowerCase().includes(columnSearch.toLowerCase()) ||
    c.dtype.toLowerCase().includes(columnSearch.toLowerCase())
  )

  /* ── Filtered sample records ── */
  const filteredSample = sample.filter(row => {
    if (classFilter === 'bot') return row.label === 'bot'
    if (classFilter === 'human') return row.label === 'human'
    return true
  })

  const sampleKeys = sample.length > 0 ? Object.keys(sample[0]) : []

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="page-header__kicker">
            <span className="badge badge-primary">Schema Explorer</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
              TWIBOT-20 CORPUS
            </span>
          </div>
          <h1>Dataset Schema &amp; Quality Explorer</h1>
          <p>
            TwiBot-20 benchmark distribution, null value integrity, feature typing, and raw entity sample inspection.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            id="btn-dataset-reload"
            className="btn btn-secondary"
            onClick={handleForceReload}
            disabled={reloading}
            title="Invalidate cache and reload raw dataset records"
          >
            <RefreshCw size={14} className={reloading ? 'spinner' : ''} />
            {reloading ? 'Reloading...' : reloadNotice ? 'Cache Synced!' : 'Reload Dataset'}
          </button>

          <button
            id="btn-dataset-export"
            className="btn btn-secondary"
            onClick={handleExportSchema}
            title="Download complete JSON schema description"
          >
            <Download size={14} />
            Export Schema
          </button>
        </div>
      </div>

      {/* ── Demo banner ── */}
      {summary?.is_demo && <DemoBanner note={summary.data_note} />}

      {/* ── Overview stats ── */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Total Records"   value={summary?.total_rows?.toLocaleString()}    color="var(--color-primary)" />
        <StatCard label="Bot Entities"    value={summary?.bot_count?.toLocaleString()}     color={COLORS.bot} />
        <StatCard label="Organic Humans"  value={summary?.human_count?.toLocaleString()}   color={COLORS.human} />
        <StatCard label="Columns"         value={summary?.total_columns}                   color="var(--color-accent)" />
        <StatCard label="Duplicate Rows"  value={dupInfo?.duplicate_rows}                  sub={`${dupInfo?.duplicate_pct}% redundant`} color="var(--color-warning)" />
        <StatCard label="Tweet Text"      value={summary?.has_tweet_data ? 'Available' : 'Unavailable'} color={summary?.has_tweet_data ? COLORS.human : COLORS.bot} />
        <StatCard label="Network Graph"   value={summary?.has_network_data ? 'Available' : 'Unavailable'} color={summary?.has_network_data ? COLORS.human : COLORS.bot} />
      </div>

      {/* ── Dataset metadata card ── */}
      <SectionHeader icon={Database} title="Dataset Metadata &amp; Extraction Spec" />
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
        {[
          ['Dataset Identification', summary?.dataset_name],
          ['Corpus Source URI',      summary?.dataset_source],
          ['Row Count',              summary?.total_rows?.toLocaleString()],
          ['Attribute Count',        `${summary?.total_columns} attributes`],
          ['Bot Population',         `${summary?.bot_count} (${dist.find(d => d.label === 'bot')?.percentage ?? 0}%)`],
          ['Human Population',       `${summary?.human_count} (${dist.find(d => d.label === 'human')?.percentage ?? 0}%)`],
          ['Text Corpus (Tweets)',   summary?.has_tweet_data ? 'Active & Tokenized' : 'Unavailable'],
          ['Follow Graph Topology',  summary?.has_network_data ? 'Active & Indexed' : 'Unavailable'],
        ].map(([k, v]) => (
          <div key={k} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
            <div style={{ fontWeight: 600, marginTop: 2, wordBreak: 'break-all', fontSize: '0.86rem', fontFamily: 'var(--font-mono)' }}>{v ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* ── Distribution + Missing side by side ── */}
      <div className="ba-grid-2" style={{ marginTop: 24 }}>
        {/* Class distribution pie */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">
                <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                Class Label Proportion
              </div>
              <div className="section-subtitle">Binary ratio between automated bots and organic humans</div>
            </div>
          </div>
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={55}
                     dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                     labelLine={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="rgba(15,23,42,0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [`${val} accounts`, name]} />
                <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Missing values bar chart */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">
                <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                Missing Attributes (Top 12 Columns)
              </div>
              <div className="section-subtitle">Percent of null or unpopulated values across corpus</div>
            </div>
          </div>
          <div style={{ height: 260 }}>
            {missingBar.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-success)', gap: 8 }}>
                <CheckCircle size={18} /> Zero missing values detected in corpus
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingBar} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                         tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="col" width={120}
                         tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <Tooltip formatter={(v, _, p) => [`${v}% (${p.payload.count} nulls)`, 'Missing']} />
                  <Bar dataKey="pct" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Column info table with dynamic search ── */}
      <SectionHeader
        icon={Layers}
        title={`Column Attribute Schema (${filteredColumns.length} Attributes)`}
        rightContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Filter attributes by name or type..."
              value={columnSearch}
              onChange={e => setColumnSearch(e.target.value)}
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px 5px 30px',
                fontSize: '0.78rem',
                color: 'var(--color-text)',
                width: 240,
                outline: 'none',
              }}
            />
          </div>
        }
      />
      <div className="card table-wrap" style={{ maxHeight: 380, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Column Name</th>
              <th>Data Type</th>
              <th>Null Count</th>
              <th>Null Percentage</th>
              <th>Cardinality (Unique)</th>
            </tr>
          </thead>
          <tbody>
            {filteredColumns.map(col => (
              <tr key={col.column}>
                <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                  {col.column}
                </td>
                <td>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
                    color: 'var(--color-accent)', background: 'var(--color-surface-2)',
                    padding: '2px 6px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)'
                  }}>
                    {col.dtype}
                  </span>
                </td>
                <td className="mono-val">{col.null_count}</td>
                <td>
                  <span className="mono-val" style={{
                    color: col.null_pct > 30 ? 'var(--color-danger)' : col.null_pct > 5 ? 'var(--color-warning)' : 'var(--color-text-muted)',
                    fontWeight: col.null_pct > 0 ? 600 : 400
                  }}>
                    {col.null_pct}%
                  </span>
                </td>
                <td className="mono-val">{col.unique_count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Sample records table with class filtering, count switcher, and dossier audit links ── */}
      <SectionHeader
        icon={Database}
        title="Sample Entity Records"
        rightContent={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Class filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                ['all', 'All'],
                ['bot', 'Bots'],
                ['human', 'Humans'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`tab-btn${classFilter === key ? ' active' : ''}`}
                  onClick={() => setClassFilter(key)}
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Row limit switcher */}
            <select
              value={sampleCount}
              onChange={e => setSampleCount(Number(e.target.value))}
              className="scatter-select"
              style={{ padding: '3px 8px', fontSize: '0.72rem', height: 26 }}
              title="Number of sample records to fetch"
            >
              <option value={10}>10 records</option>
              <option value={20}>20 records</option>
              <option value={35}>35 records</option>
              <option value={50}>50 records</option>
            </select>
          </div>
        }
      />
      <div className="card table-wrap" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              {sampleKeys.map(k => (
                <th key={k} style={{ whiteSpace: 'nowrap' }}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSample.map((row, i) => {
              const accountId = row.screen_name || row.user_id || row.id_str
              return (
                <tr key={i}>
                  <td>
                    {accountId ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 7px', fontSize: '0.7rem', gap: 3 }}
                        onClick={() => onNavigate && onNavigate('investigate', { query: accountId })}
                        title={`Open forensic audit for ${accountId}`}
                      >
                        Audit
                        <ChevronRight size={11} />
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-text-dim)' }}>—</span>
                    )}
                  </td>
                  {sampleKeys.map(k => {
                    const val = row[k]
                    let display = val === null || val === undefined ? (
                      <span style={{ color: 'var(--color-text-dim)' }}>null</span>
                    ) : String(val)

                    if (k === 'label') {
                      display = <span className={`label-badge label-badge--${val}`}>{val}</span>
                    } else if (k === 'user_id' || k === 'id_str') {
                      display = <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)', fontSize: '0.74rem' }}>{val}</span>
                    } else if (k === 'screen_name') {
                      display = <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>@{val}</span>
                    }

                    return (
                      <td key={k} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {display}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
