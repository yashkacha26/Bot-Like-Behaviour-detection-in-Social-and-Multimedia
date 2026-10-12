import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import {
  Image, Search, Sliders, CheckCircle2, UserCheck,
  ChevronRight, Download, Eye, Sparkles
} from 'lucide-react'

const QUERY_PROFILES = [
  {
    id: 'Q-01',
    name: 'Profile Picture / Avatar Match',
    type: 'Synthetic Face Asset',
    embeddingDim: 512,
    extractMethod: 'ResNet-50 + Cosine Sim',
    avgSimilarity: 0.942,
    resultsCount: 8,
    matches: [
      { rank: 1, docId: 'IMG-8921', similarity: 0.988, distance: 0.012, classLabel: 'Verified Bot Network Asset', accountRef: '@crypto_bot_14', hash: 'e3b0c44298fc1c14' },
      { rank: 2, docId: 'IMG-8922', similarity: 0.981, distance: 0.019, classLabel: 'Verified Bot Network Asset', accountRef: '@gain_followers_99', hash: 'd41d8cd98f00b204' },
      { rank: 3, docId: 'IMG-1190', similarity: 0.923, distance: 0.077, classLabel: 'Sybil Account Avatar', accountRef: '@auto_feed_news', hash: 'ab56b4d92b40713a' },
      { rank: 4, docId: 'IMG-0348', similarity: 0.865, distance: 0.135, classLabel: 'Organic User', accountRef: '@alex_johnson', hash: '7c4a8d09ca3762af' },
    ]
  },
  {
    id: 'Q-02',
    name: 'Propaganda Watermark Graphic',
    type: 'Vector Overlay Asset',
    embeddingDim: 2048,
    extractMethod: 'DenseNet-121 + SIFT',
    avgSimilarity: 0.985,
    resultsCount: 19,
    matches: [
      { rank: 1, docId: 'IMG-4102', similarity: 0.994, distance: 0.006, classLabel: 'Coordinated Campaign Asset', accountRef: '@promo_daily_x', hash: '900150983cd24fb0' },
      { rank: 2, docId: 'IMG-4105', similarity: 0.978, distance: 0.022, classLabel: 'Coordinated Campaign Asset', accountRef: '@crypto_bot_14', hash: '900150983cd24fb1' },
      { rank: 3, docId: 'IMG-6621', similarity: 0.887, distance: 0.113, classLabel: 'Stock Creative Asset', accountRef: '@trend_hub_2024', hash: 'fa2591b6016a22b8' },
    ]
  },
  {
    id: 'Q-03',
    name: 'Meme Template Duplicate',
    type: 'Stock Image Variant',
    embeddingDim: 768,
    extractMethod: 'CLIP ViT-B/32',
    avgSimilarity: 0.897,
    resultsCount: 42,
    matches: [
      { rank: 1, docId: 'IMG-3301', similarity: 0.952, distance: 0.048, classLabel: 'Sybil Distribution Node', accountRef: '@viral_clip_feed', hash: '8f411b9812cc9081' },
      { rank: 2, docId: 'IMG-3304', similarity: 0.915, distance: 0.085, classLabel: 'Sybil Distribution Node', accountRef: '@daily_wire_news', hash: '8f411b9812cc9085' },
      { rank: 3, docId: 'IMG-0348', similarity: 0.842, distance: 0.158, classLabel: 'Organic User', accountRef: '@alex_johnson', hash: '7c4a8d09ca3762af' },
    ]
  },
]

const FEATURE_DIMENSION_STATS = [
  { feature: 'Color Histogram', accuracy: 0.84, retrievalSpeed: 0.95 },
  { feature: 'Edge & Texture (Gabor)', accuracy: 0.88, retrievalSpeed: 0.89 },
  { feature: 'SIFT / ORB Keypoints', accuracy: 0.93, retrievalSpeed: 0.72 },
  { feature: 'Deep Embeddings (ResNet)', accuracy: 0.97, retrievalSpeed: 0.85 },
  { feature: 'CLIP Multimodal Vector', accuracy: 0.98, retrievalSpeed: 0.81 },
]

export default function CBIRAnalysis({ onNavigate }) {
  const [selectedQuery, setSelectedQuery] = useState(QUERY_PROFILES[0])
  const [metricThreshold, setMetricThreshold] = useState(0.85)
  const [inspectedAsset, setInspectedAsset] = useState(QUERY_PROFILES[0].matches[0])

  const filteredMatches = (selectedQuery.matches || []).filter(item => item.similarity >= metricThreshold)

  const handleSelectQuery = (q) => {
    setSelectedQuery(q)
    if (q.matches && q.matches.length > 0) {
      setInspectedAsset(q.matches[0])
    }
  }

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredMatches, null, 2))
    const dl = document.createElement('a')
    dl.setAttribute("href", dataStr)
    dl.setAttribute("download", `cbir-retrieval-results-${selectedQuery.id}.json`)
    dl.click()
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="page-header__kicker">
            <span className="badge badge-primary">Computer Vision</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>FAISS IVF-FLAT</span>
          </div>
          <h1>Content-Based Image Retrieval (CBIR) &amp; Clone Search</h1>
          <p>
            High-dimensional visual feature extraction, perceptual hashing (pHash), and nearest neighbor indexing for image clone cluster detection.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="telemetry-indicator">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>Query Time: <strong>3.4 ms</strong></span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleExportJSON}>
            <Download size={13} />
            Export Matches
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card card--accent-primary">
          <div className="stat-card__label">Indexed Embeddings</div>
          <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>12,850</div>
          <div className="stat-card__sub">Vector database gallery corpus</div>
        </div>
        <div className="stat-card card--accent-cyan">
          <div className="stat-card__label">P@5 Retrieval Precision</div>
          <div className="stat-card__value" style={{ color: 'var(--color-accent)' }}>97.8%</div>
          <div className="stat-card__sub">Top-5 clone cluster benchmark</div>
        </div>
        <div className="stat-card card--accent-success">
          <div className="stat-card__label">Mean Cosine Distance</div>
          <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>0.014</div>
          <div className="stat-card__sub">Cluster tightness for synthetic media</div>
        </div>
        <div className="stat-card card--accent-warning">
          <div className="stat-card__label">Vector Hypersphere</div>
          <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>512-d</div>
          <div className="stat-card__sub">Normalized feature space dimensionality</div>
        </div>
      </div>

      {/* Query Selector & Matcher Showcase */}
      <div className="ba-grid-2" style={{ marginBottom: 24 }}>
        {/* Active Query Profile */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Query Image &amp; Visual Descriptor</div>
              <div className="section-subtitle">Select query archetype to evaluate nearest neighbor ranking</div>
            </div>
            <span className="badge badge-primary">{selectedQuery.id}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {QUERY_PROFILES.map(q => {
              const isSelected = selectedQuery.id === q.id
              return (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuery(q)}
                  className={`tab-btn${isSelected ? ' active' : ''}`}
                  style={{
                    flex: 1, padding: '10px 12px', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{q.name}</div>
                  <div style={{ fontSize: '0.7rem', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {q.type}
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Descriptor:</span>{' '}
                <strong style={{ color: '#fff' }}>{selectedQuery.extractMethod}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Dimension:</span>{' '}
                <strong className="mono-val" style={{ color: 'var(--color-accent)' }}>{selectedQuery.embeddingDim} floats</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Mean Similarity:</span>{' '}
                <strong className="mono-val" style={{ color: 'var(--color-success)' }}>{(selectedQuery.avgSimilarity * 100).toFixed(1)}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Clones Detected:</span>{' '}
                <strong className="mono-val" style={{ color: 'var(--color-warning)' }}>{selectedQuery.resultsCount} matches</strong>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Cosine Similarity Cutoff Threshold:</span>
                <strong className="mono-val" style={{ color: 'var(--color-primary)' }}>{(metricThreshold * 100).toFixed(0)}%</strong>
              </div>
              <input
                type="range"
                min="0.70"
                max="0.99"
                step="0.01"
                value={metricThreshold}
                onChange={e => setMetricThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Feature Extractor Benchmark Radar */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Descriptor Architecture Benchmark</div>
              <div className="section-subtitle">Retrieval accuracy vs index search speed across feature representations</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart cx="50%" cy="50%" outerRadius={90} data={FEATURE_DIMENSION_STATS}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="Retrieval Accuracy" dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
              <Radar name="Search Speed" dataKey="retrievalSpeed" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--color-border)', borderRadius: 6, fontSize: '0.8rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Retrieved Nearest Neighbors Table + Selected Asset Inspector */}
      <div className="ba-grid-2">
        {/* Table of matches */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Top Nearest Neighbors in Feature Space (k-NN)</div>
              <div className="section-subtitle">Showing {filteredMatches.length} matching visual assets above {(metricThreshold * 100).toFixed(0)}% threshold</div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Asset ID</th>
                  <th>Similarity</th>
                  <th>Associated Account</th>
                  <th>Classification</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map(item => {
                  const isSelected = inspectedAsset?.docId === item.docId
                  return (
                    <tr
                      key={item.docId}
                      onClick={() => setInspectedAsset(item)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                      }}
                    >
                      <td className="mono-val" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                        #{item.rank}
                      </td>
                      <td className="mono-val" style={{ color: '#fff' }}>{item.docId}</td>
                      <td className="mono-val" style={{ color: item.similarity > 0.95 ? 'var(--color-danger)' : 'var(--color-accent)', fontWeight: 700 }}>
                        {(item.similarity * 100).toFixed(1)}%
                      </td>
                      <td>
                        <span className="mono-val" style={{ color: 'var(--color-accent)' }}>
                          {item.accountRef}
                        </span>
                      </td>
                      <td>
                        <span className={`label-badge label-badge--${item.classLabel.includes('Bot') || item.classLabel.includes('Campaign') ? 'bot' : 'human'}`}>
                          {item.classLabel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Asset Inspection Card */}
        {inspectedAsset && (
          <div className="card" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div className="section-header">
              <div>
                <div className="section-title">Visual Clone Forensic Dossier</div>
                <div className="section-subtitle">Asset details &amp; cross-network association</div>
              </div>
              <span className="badge badge-warning">{inspectedAsset.docId}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.82rem', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Perceptual Hash (pHash):</span>
                <span className="mono-val" style={{ color: 'var(--color-accent)' }}>{inspectedAsset.hash}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Cosine Similarity:</span>
                <span className="mono-val" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                  {(inspectedAsset.similarity * 100).toFixed(2)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Euclidean Distance:</span>
                <span className="mono-val">{inspectedAsset.distance.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Associated Handle:</span>
                <span className="mono-val" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{inspectedAsset.accountRef}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Network Classification:</span>
                <span className={`label-badge label-badge--${inspectedAsset.classLabel.includes('Bot') || inspectedAsset.classLabel.includes('Campaign') ? 'bot' : 'human'}`}>
                  {inspectedAsset.classLabel}
                </span>
              </div>
            </div>

            {/* Action button to audit that specific account in Account Investigation */}
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => onNavigate && onNavigate('investigate', { query: inspectedAsset.accountRef.replace('@', '') })}
            >
              <UserCheck size={14} />
              Audit Account ({inspectedAsset.accountRef}) in Dossier
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
