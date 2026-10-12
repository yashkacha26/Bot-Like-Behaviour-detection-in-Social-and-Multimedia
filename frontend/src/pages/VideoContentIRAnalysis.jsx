import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import {
  Video, Search, Play, ShieldAlert, CheckCircle2,
  ExternalLink, Sparkles, Filter, ChevronRight, UserCheck
} from 'lucide-react'

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

const ALL_RETRIEVED_DOCUMENTS = [
  { rank: 1, docId: 'VID-DOC-401', score: 0.964, title: 'Automated Token Launch Video Reel #24', matchSnippet: 'Promotional token pump coordinated across 34 bot channels with identical visual cuts and synced speech audio...', author: '@crypto_bot_14', duration: '0:34', category: 'High-Risk Bot Video', tags: ['crypto', 'token', 'pump', 'automated'] },
  { rank: 2, docId: 'VID-DOC-182', score: 0.912, title: 'Synthetic Voice Over Political Narrative #09', matchSnippet: 'Generated speech audio synchronized with stock news video loop, repeated token frequency and script re-use...', author: '@daily_wire_news', duration: '1:12', category: 'Synthetic Media', tags: ['synthetic', 'voice', 'political', 'disinformation'] },
  { rank: 3, docId: 'VID-DOC-704', score: 0.875, title: 'Viral Reaction Clip Mirror Batch #12', matchSnippet: 'Duplicate visual keyframes detected with shifted color saturation and repeated automated watermarks...', author: '@mirror_stream_hub', duration: '0:45', category: 'Clone Mirroring', tags: ['mirror', 'watermark', 'clone', 'duplicate'] },
  { rank: 4, docId: 'VID-DOC-029', score: 0.821, title: 'Community Tech Discussion Highlights', matchSnippet: 'Organic interview with natural speech pauses, diverse frame histograms and verified human speaker track...', author: '@alex_johnson', duration: '3:20', category: 'Organic Video', tags: ['tech', 'discussion', 'organic', 'interview'] },
  { rank: 5, docId: 'VID-DOC-933', score: 0.798, title: 'Flash Giveaways Video Campaign Feed', matchSnippet: 'Synthetic text banners promising immediate crypto airdrop tokens with rapid visual transitions...', author: '@promo_daily_x', duration: '0:22', category: 'High-Risk Bot Video', tags: ['giveaway', 'airdrop', 'crypto', 'spam'] },
]

export default function VideoContentIRAnalysis({ onNavigate }) {
  const [activeSearch, setActiveSearch] = useState('crypto spam narrative')
  const [documents, setDocuments] = useState(ALL_RETRIEVED_DOCUMENTS)
  const [selectedResult, setSelectedResult] = useState(ALL_RETRIEVED_DOCUMENTS[0])
  const [searching, setSearching] = useState(false)

  const handleExecuteQuery = (searchQuery) => {
    const q = searchQuery !== undefined ? searchQuery : activeSearch
    setSearching(true)
    setTimeout(() => {
      const qLower = q.toLowerCase().trim()
      let filtered = ALL_RETRIEVED_DOCUMENTS
      if (qLower) {
        filtered = ALL_RETRIEVED_DOCUMENTS.filter(doc =>
          doc.title.toLowerCase().includes(qLower) ||
          doc.matchSnippet.toLowerCase().includes(qLower) ||
          doc.category.toLowerCase().includes(qLower) ||
          doc.author.toLowerCase().includes(qLower) ||
          doc.tags.some(t => t.includes(qLower) || qLower.includes(t))
        )
      }
      setDocuments(filtered)
      if (filtered.length > 0) {
        setSelectedResult(filtered[0])
      }
      setSearching(false)
    }, 200)
  }

  const handlePresetClick = (preset) => {
    setActiveSearch(preset)
    handleExecuteQuery(preset)
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="page-header__kicker">
            <span className="badge badge-accent">Multimedia Surveillance</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>HYBRID IR ENGINE</span>
          </div>
          <h1>Video Content Forensics &amp; Information Retrieval</h1>
          <p>
            Shot boundary histogram variance, keyframe temporal segmentation, inverted index retrieval, and neural cross-encoder document ranking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="telemetry-indicator">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>Engine: <strong>Hybrid Dense + BM25</strong></span>
          </div>
          <div className="telemetry-indicator">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--color-accent)' }}>Index Size: 45,200 Clips</span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card card--accent-cyan">
          <div className="stat-card__label">Video Streams Evaluated</div>
          <div className="stat-card__value" style={{ color: 'var(--color-accent)' }}>8,420</div>
          <div className="stat-card__sub">Temporal keyframe decomposition</div>
        </div>
        <div className="stat-card card--accent-primary">
          <div className="stat-card__label">NDCG@10 Retrieval Ranking</div>
          <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>0.932</div>
          <div className="stat-card__sub">Discounted cumulative gain</div>
        </div>
        <div className="stat-card card--accent-success">
          <div className="stat-card__label">Shot Boundary Recall</div>
          <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>96.4%</div>
          <div className="stat-card__sub">Color histogram difference cutoff</div>
        </div>
        <div className="stat-card card--accent-warning">
          <div className="stat-card__label">Mean IR Latency</div>
          <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>18.2 ms</div>
          <div className="stat-card__sub">Inverted index posting traversal</div>
        </div>
      </div>

      {/* Temporal Shot Graph */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Video Temporal Structure: Shot Boundary &amp; Transition Detection</div>
            <div className="section-subtitle">Histogram difference scores indicating automated hard cuts and repetitive video assembly</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={SCENE_CHANGE_TIMELINE}>
            <defs>
              <linearGradient id="colorShot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="timestamp" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 1]} />
            <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--color-border)', borderRadius: 6, fontSize: '0.8rem' }} />
            <Area type="monotone" dataKey="shotScore" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorShot)" name="Shot Difference Score" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Information Retrieval (IR) Search Console */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Information Retrieval (IR) Multi-Modal Engine</div>
            <div className="section-subtitle">Search indexed video corpora using lexical inverted postings and dense vector embeddings</div>
          </div>
          <span className="badge badge-primary">{documents.length} Matches Found</span>
        </div>

        {/* Search Bar Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleExecuteQuery() }}
          style={{ display: 'flex', gap: 10, marginBottom: 12 }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={activeSearch}
              onChange={e => setActiveSearch(e.target.value)}
              placeholder="Search video corpora (e.g., crypto spam, synthetic voice, watermark, giveaways)..."
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={searching}
          >
            <Search size={14} className={searching ? 'spinner' : ''} />
            {searching ? 'Querying...' : 'Execute IR Query'}
          </button>
        </form>

        {/* Quick query preset chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>Quick Queries:</span>
          {[
            'crypto spam narrative',
            'synthetic voice political',
            'watermark clone mirror',
            'airdrop giveaway token',
            'organic tech discussion',
          ].map(preset => (
            <button
              key={preset}
              type="button"
              className="tab-btn"
              onClick={() => handlePresetClick(preset)}
              style={{ padding: '3px 9px', fontSize: '0.72rem' }}
            >
              "{preset}"
            </button>
          ))}
        </div>

        {/* Master-Detail: Retrieved documents list + Inspector Panel */}
        <div className="ba-grid-2">
          {/* Document list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {documents.length === 0 ? (
              <div className="loading-box" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                No video documents matched "{activeSearch}". Try another query.
              </div>
            ) : (
              documents.map(doc => {
                const isSelected = selectedResult?.docId === doc.docId
                return (
                  <div
                    key={doc.docId}
                    onClick={() => setSelectedResult(doc)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--color-surface-2)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                          Rank #{doc.rank}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{doc.title}</span>
                      </div>
                      <span className="mono-val" style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 700 }}>
                        {(doc.score * 100).toFixed(1)}%
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '4px 0 6px' }}>
                      {doc.matchSnippet}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                      <span>Author: <strong style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{doc.author}</strong></span>
                      <span className={`label-badge label-badge--${doc.category.includes('Bot') ? 'bot' : 'human'}`}>
                        {doc.category}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Selected Document Forensic Inspection Drawer */}
          {selectedResult && (
            <div className="card" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <div>
                  <div className="section-title" style={{ fontSize: '0.9rem' }}>
                    Document Dossier: {selectedResult.docId}
                  </div>
                  <div className="section-subtitle">Inverted index post list verification &amp; source linkage</div>
                </div>
                <span className="badge badge-warning">Active Inspection</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Document Title:</span>
                  <strong style={{ color: '#fff' }}>{selectedResult.title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Source Account:</span>
                  <span className="mono-val" style={{ color: 'var(--color-accent)' }}>{selectedResult.author}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Estimated Duration:</span>
                  <span className="mono-val">{selectedResult.duration}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Cross-Encoder Relevance:</span>
                  <span className="mono-val" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                    {(selectedResult.score * 100).toFixed(2)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Classification Status:</span>
                  <span className={`label-badge label-badge--${selectedResult.category.includes('Bot') ? 'bot' : 'human'}`}>
                    {selectedResult.category}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Extracted Index Posting Tokens:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedResult.tags.map(t => (
                    <span key={t} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button: Audit Author in Account Dossier */}
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => onNavigate && onNavigate('investigate', { query: selectedResult.author.replace('@', '') })}
              >
                <UserCheck size={14} />
                Audit Author ({selectedResult.author}) in Account Dossier
              </button>
            </div>
          )}
        </div>
      </div>

      {/* IR Benchmark Evaluation Table */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Information Retrieval Evaluation Benchmarks</div>
            <div className="section-subtitle">Mean Average Precision (MAP), Recall@10, and NDCG rankings across benchmark queries</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Standard Evaluation Query</th>
                <th>Retrieval Architecture</th>
                <th>MAP Score</th>
                <th>Recall @ 10</th>
                <th>NDCG @ 10</th>
                <th>Validation Status</th>
              </tr>
            </thead>
            <tbody>
              {IR_QUERY_BENCHMARKS.map((b, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>"{b.query}"</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{b.model}</td>
                  <td className="mono-val" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{b.map.toFixed(2)}</td>
                  <td className="mono-val" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{b.recallAt10.toFixed(2)}</td>
                  <td className="mono-val" style={{ color: 'var(--color-success)', fontWeight: 700 }}>{b.ndcg.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-success">
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
