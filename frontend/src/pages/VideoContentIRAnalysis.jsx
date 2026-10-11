import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

const SCENE_CHANGE_TIMELINE = [
  { timestamp: '00:00', shotScore: 0.12, keyframes: 1, sceneType: 'Intro Graphic' },
  { timestamp: '00:05', shotScore: 0.88, keyframes: 3, sceneType: 'Hard Cut / Anchor' },
  { timestamp: '00:10', shotScore: 0.22, keyframes: 1, sceneType: 'Monologue' },
  { timestamp: '00:15', shotScore: 0.95, keyframes: 4, sceneType: 'Abrupt Bot Transition' },
  { timestamp: '00:20', shotScore: 0.31, keyframes: 1, sceneType: 'Screen Demo' },
  { timestamp: '00:25', shotScore: 0.82, keyframes: 3, sceneType: 'Flash Banner Cut' },
  { timestamp: '00:30', shotScore: 0.18, keyframes: 1, sceneType: 'Outro Clip' },
]

const IR_QUERY_BENCHMARKS = [
  { query: 'synthetic voice promotion campaign', model: 'BM25 + Semantic Cross-Encoder', map: 0.89, recallAt10: 0.94, ndcg: 0.92 },
  { query: 'coordinated crypto spam narrative', model: 'ColBERTv2 Dense Index', map: 0.93, recallAt10: 0.97, ndcg: 0.95 },
  { query: 'disinformation talking points video', model: 'Hybrid (TF-IDF + Dense)', map: 0.91, recallAt10: 0.96, ndcg: 0.94 },
  { query: 'automated watermark asset detection', model: 'Inverted Postings List', map: 0.87, recallAt10: 0.91, ndcg: 0.89 },
]

const RETRIEVED_DOCUMENTS = [
  { rank: 1, docId: 'VID-DOC-401', score: 0.964, title: 'Automated Token Launch Video Reel #24', matchSnippet: '...promotional token pump coordinated across 34 bot channels with identical visual cuts...', author: '@token_alpha_bot', duration: '0:34', category: 'High-Risk Bot Video' },
  { rank: 2, docId: 'VID-DOC-182', score: 0.912, title: 'Synthetic Voice Over Political Narrative #09', matchSnippet: '...generated speech audio synchronized with stock news video loop, repeated word frequency...', author: '@daily_wire_news_alt', duration: '1:12', category: 'Synthetic Media' },
  { rank: 3, docId: 'VID-DOC-704', score: 0.875, title: 'Viral Reaction Clip Mirror Batch #12', matchSnippet: '...duplicate visual keyframes detected with shifted color saturation and watermarked audio...', author: '@mirror_stream_hub', duration: '0:45', category: 'Clone Mirroring' },
  { rank: 4, docId: 'VID-DOC-029', score: 0.821, title: 'Community Tech Discussion Highlights', matchSnippet: '...organic interview with natural speech pauses and varied keyframe color histograms...', author: '@tech_today_real', duration: '3:20', category: 'Organic Video' },
]

export default function VideoContentIRAnalysis() {
  const [activeSearch, setActiveSearch] = useState('coordinated crypto spam narrative')
  const [selectedResult, setSelectedResult] = useState(RETRIEVED_DOCUMENTS[0])

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="badge badge-accent" style={{ marginBottom: 8 }}>Multimedia & IR Module</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '4px 0' }}>Video Content Analysis & Information Retrieval</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Shot boundary detection, keyframe summarization, inverted index querying, and neural ranking for multimedia corpora.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="stat-pill" style={{ background: 'var(--color-surface-2)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
            IR Model: <strong>Hybrid Dense + BM25</strong>
          </span>
          <span className="stat-pill" style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--color-accent)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34,211,238,0.3)', fontSize: '0.82rem', fontWeight: 600 }}>
            Indexed Documents: 45,200
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-accent)' }}>8,420</div>
          <div className="stat-card__label">Video Streams Analyzed</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Temporal shot & keyframe extraction</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>0.932</div>
          <div className="stat-card__label">Mean NDCG@10 (Retrieval)</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Normalized Discounted Cumulative Gain</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>96.4%</div>
          <div className="stat-card__label">Shot Boundary Recall</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Color histogram difference thresholding</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>18.2 ms</div>
          <div className="stat-card__label">IR Query Response Time</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Vector index + inverted postings rank</div>
        </div>
      </div>

      {/* Video Content Analysis Section: Shot Transition Graph */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">Video Temporal Structure: Shot Boundary & Transition Detection</div>
          <div className="section-subtitle">Histogram difference scores indicating automated hard cuts and repetitive video assembly</div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={SCENE_CHANGE_TIMELINE}>
            <defs>
              <linearGradient id="colorShot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="timestamp" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 1]} />
            <Tooltip contentStyle={{ background: '#111827', borderColor: 'var(--color-border)', borderRadius: 6, fontSize: '0.8rem' }} />
            <Area type="monotone" dataKey="shotScore" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorShot)" name="Shot Difference Score" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Information Retrieval (IR) Search Console */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">Information Retrieval (IR) Engine Console</div>
          <div className="section-subtitle">Search indexed multimedia document corpus using semantic query vectors & inverted index</div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            type="text"
            value={activeSearch}
            onChange={e => setActiveSearch(e.target.value)}
            placeholder="Enter search terms (e.g., bot campaign, synthetic video)..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />
          <button
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Execute IR Query
          </button>
        </div>

        {/* Retrieved documents list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {RETRIEVED_DOCUMENTS.map(doc => (
            <div
              key={doc.docId}
              onClick={() => setSelectedResult(doc)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                background: selectedResult.docId === doc.docId ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-2)',
                border: selectedResult.docId === doc.docId ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.2)' }}>
                    Rank #{doc.rank}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{doc.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({doc.docId})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Duration: {doc.duration}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-success)' }}>
                    Relevance: {(doc.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 8px 0' }}>{doc.matchSnippet}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>Author: <strong>{doc.author}</strong></span>
                <span style={{
                  color: doc.category.includes('Bot') || doc.category.includes('Synthetic') ? 'var(--color-danger)' : 'var(--color-success)',
                  fontWeight: 600,
                }}>
                  {doc.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IR Benchmark Evaluation Table */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Information Retrieval Evaluation Metrics</div>
          <div className="section-subtitle">Mean Average Precision (MAP), Recall@10, and NDCG rankings across query classes</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Standard Evaluation Query</th>
                <th style={{ padding: '10px 12px' }}>Retrieval Architecture</th>
                <th style={{ padding: '10px 12px' }}>MAP</th>
                <th style={{ padding: '10px 12px' }}>Recall @ 10</th>
                <th style={{ padding: '10px 12px' }}>NDCG @ 10</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {IR_QUERY_BENCHMARKS.map((b, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>"{b.query}"</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{b.model}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-primary)' }}>{b.map.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-accent)' }}>{b.recallAt10.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-success)' }}>{b.ndcg.toFixed(2)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)' }}>
                      Optimal
                    </span>
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
