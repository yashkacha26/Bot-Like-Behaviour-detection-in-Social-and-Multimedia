import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Database, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import api from '../api/client'

/* ── colour palette ─────────────────────────────────────────────────────── */
const COLORS = { bot: '#ef4444', human: '#10b981', unlabeled: '#6366f1' }
const BAR_COLOR = '#6366f1'

/* ── tiny reusable pieces ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: color || 'var(--color-accent)' }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 32 }}>
      <Icon size={18} color="var(--color-primary)" />
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h2>
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <div className="spinner" style={{ margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--color-text-muted)' }}>Loading dataset…</p>
    </div>
  )
}

function ErrorCard({ message }) {
  return (
    <div className="card" style={{ borderColor: 'rgba(239,68,68,0.4)', textAlign: 'center', padding: 48 }}>
      <AlertTriangle size={40} color="var(--color-danger)" style={{ margin: '0 auto 12px' }} />
      <p style={{ color: 'var(--color-danger)' }}>{message}</p>
    </div>
  )
}

/* ── Demo dataset banner ────────────────────────────────────────────────── */
function DemoBanner({ note }) {
  if (!note) return null
  return (
    <div style={{
      background: 'rgba(245,158,11,0.1)',
      border: '1px solid rgba(245,158,11,0.35)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 16px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      marginBottom: 24,
    }}>
      <Info size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ fontSize: '0.85rem', color: 'var(--color-warning)', margin: 0 }}>
        <strong>Demo Dataset:</strong> {note}
      </p>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function DatasetExplorer() {
  const [summary, setSummary]   = useState(null)
  const [dist, setDist]         = useState([])
  const [missing, setMissing]   = useState([])
  const [sample, setSample]     = useState([])
  const [columns, setColumns]   = useState([])
  const [dupInfo, setDupInfo]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [sumRes, distRes, misRes, smpRes, colRes, dupRes] = await Promise.all([
          api.get('/dataset/summary'),
          api.get('/dataset/distribution'),
          api.get('/dataset/missing'),
          api.get('/dataset/sample?n=10'),
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
        setError(e.message || 'Failed to load dataset')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return <LoadingCard />
  if (error)   return <ErrorCard message={error} />

  /* ── Distribution pie data ── */
  const pieData = dist.map(d => ({
    name: d.label,
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

  /* ── Sample table columns ── */
  const sampleKeys = sample.length > 0 ? Object.keys(sample[0]) : []

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <h1>Dataset Explorer</h1>
        <p>TwiBot-20 dataset summary, quality metrics, and sample records.</p>
      </div>

      {/* ── Demo banner ── */}
      {summary?.is_demo && <DemoBanner note={summary.data_note} />}

      {/* ── Overview stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        <StatCard label="Total Accounts"  value={summary?.total_rows?.toLocaleString()}    color="var(--color-accent)" />
        <StatCard label="Bot Accounts"    value={summary?.bot_count?.toLocaleString()}     color={COLORS.bot} />
        <StatCard label="Human Accounts"  value={summary?.human_count?.toLocaleString()}   color={COLORS.human} />
        <StatCard label="Columns"         value={summary?.total_columns}                    color="var(--color-primary)" />
        <StatCard label="Duplicate Rows"  value={dupInfo?.duplicate_rows}                  sub={`${dupInfo?.duplicate_pct}%`} color="var(--color-warning)" />
        <StatCard label="Text Data"       value={summary?.has_tweet_data ? 'Yes' : 'No'}   color={summary?.has_tweet_data ? COLORS.human : COLORS.bot} />
        <StatCard label="Network Data"    value={summary?.has_network_data ? 'Yes' : 'No'} color={summary?.has_network_data ? COLORS.human : COLORS.bot} />
      </div>

      {/* ── Dataset info card ── */}
      <SectionHeader icon={Database} title="Dataset Information" />
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
        {[
          ['Dataset Name',   summary?.dataset_name],
          ['Source',         summary?.dataset_source],
          ['Total Rows',     summary?.total_rows?.toLocaleString()],
          ['Total Columns',  summary?.total_columns],
          ['Bot Accounts',   `${summary?.bot_count} (${dist.find(d=>d.label==='bot')?.percentage ?? 0}%)`],
          ['Human Accounts', `${summary?.human_count} (${dist.find(d=>d.label==='human')?.percentage ?? 0}%)`],
          ['Text (Tweets)',  summary?.has_tweet_data ? 'Available' : 'Unavailable'],
          ['Network Graph',  summary?.has_network_data ? 'Available' : 'Unavailable'],
        ].map(([k, v]) => (
          <div key={k} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
            <div style={{ fontWeight: 600, marginTop: 2, wordBreak: 'break-all', fontSize: '0.9rem' }}>{v ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* ── Distribution + Missing side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>

        {/* Class distribution pie */}
        <div>
          <SectionHeader icon={CheckCircle} title="Class Distribution" />
          <div className="card" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90}
                     dataKey="value" label={({ name, percentage }) => `${name} ${percentage}%`}
                     labelLine={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [`${val} accounts`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Missing values bar chart */}
        <div>
          <SectionHeader icon={AlertTriangle} title="Missing Values (Top 12 Columns)" />
          <div className="card" style={{ height: 280 }}>
            {missingBar.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-success)' }}>
                <CheckCircle size={20} style={{ marginRight: 8 }} /> No missing values
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingBar} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                         tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="col" width={120}
                         tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <Tooltip formatter={(v, _, p) => [`${v}% (${p.payload.count})`, 'Missing']} />
                  <Bar dataKey="pct" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Column info table ── */}
      <SectionHeader icon={Database} title="Column Details" />
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Column', 'Data Type', 'Null Count', 'Null %', 'Unique Values'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((col, i) => (
              <tr key={col.column} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '7px 12px', fontWeight: 600 }}>{col.column}</td>
                <td style={{ padding: '7px 12px', color: 'var(--color-accent)', fontFamily: 'monospace' }}>{col.dtype}</td>
                <td style={{ padding: '7px 12px' }}>{col.null_count}</td>
                <td style={{ padding: '7px 12px', color: col.null_pct > 30 ? 'var(--color-danger)' : col.null_pct > 5 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>{col.null_pct}%</td>
                <td style={{ padding: '7px 12px' }}>{col.unique_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Sample records table ── */}
      <SectionHeader icon={Database} title="Sample Records (First 10)" />
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {sampleKeys.map(k => (
                <th key={k} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                {sampleKeys.map(k => {
                  const val = row[k]
                  let display = val === null || val === undefined ? <span style={{ color: 'var(--color-text-muted)' }}>null</span> : String(val)
                  if (k === 'label') {
                    display = <span className={`badge badge--${val === 'bot' ? 'error' : 'success'}`}>{val}</span>
                  }
                  return <td key={k} style={{ padding: '6px 10px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
