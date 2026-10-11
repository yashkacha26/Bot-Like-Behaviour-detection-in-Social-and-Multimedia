import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'

const QUERY_PROFILES = [
  {
    id: 'Q-01',
    name: 'Profile Picture / Avatar Match',
    type: 'Synthetic Face',
    embeddingDim: 512,
    extractMethod: 'ResNet-50 + Cosine Sim',
    avgSimilarity: 0.942,
    resultsCount: 8,
  },
  {
    id: 'Q-02',
    name: 'Propaganda Watermark Graphic',
    type: 'Vector Overlay',
    embeddingDim: 2048,
    extractMethod: 'DenseNet-121 + SIFT',
    avgSimilarity: 0.985,
    resultsCount: 19,
  },
  {
    id: 'Q-03',
    name: 'Meme Template Duplicate',
    type: 'Stock Image Variant',
    embeddingDim: 768,
    extractMethod: 'CLIP ViT-B/32',
    avgSimilarity: 0.897,
    resultsCount: 42,
  },
]

const RETRIEVED_ITEMS = [
  { rank: 1, docId: 'IMG-8921', similarity: 0.988, distance: 0.012, classLabel: 'Verified Bot Network Asset', accountRef: '@crypto_bot_14', hash: 'e3b0c44298fc1c14' },
  { rank: 2, docId: 'IMG-8922', similarity: 0.981, distance: 0.019, classLabel: 'Verified Bot Network Asset', accountRef: '@gain_followers_99', hash: 'd41d8cd98f00b204' },
  { rank: 3, docId: 'IMG-4102', similarity: 0.954, distance: 0.046, classLabel: 'Coordinated Campaign', accountRef: '@promo_daily_x', hash: '900150983cd24fb0' },
  { rank: 4, docId: 'IMG-1190', similarity: 0.923, distance: 0.077, classLabel: 'Sybil Account Avatar', accountRef: '@auto_feed_news', hash: 'ab56b4d92b40713a' },
  { rank: 5, docId: 'IMG-6621', similarity: 0.887, distance: 0.113, classLabel: 'Stock Creative', accountRef: '@trend_hub_2024', hash: 'fa2591b6016a22b8' },
  { rank: 6, docId: 'IMG-0348', similarity: 0.865, distance: 0.135, classLabel: 'Organic User', accountRef: '@alex_johnson', hash: '7c4a8d09ca3762af' },
]

const FEATURE_DIMENSION_STATS = [
  { feature: 'Color Histogram', accuracy: 0.84, retrievalSpeed: 0.95 },
  { feature: 'Edge & Texture (Gabor)', accuracy: 0.88, retrievalSpeed: 0.89 },
  { feature: 'SIFT / ORB Keypoints', accuracy: 0.93, retrievalSpeed: 0.72 },
  { feature: 'Deep Embeddings (ResNet)', accuracy: 0.97, retrievalSpeed: 0.85 },
  { feature: 'CLIP Multimodal Vector', accuracy: 0.98, retrievalSpeed: 0.81 },
]

export default function CBIRAnalysis() {
  const [selectedQuery, setSelectedQuery] = useState(QUERY_PROFILES[0])
  const [metricThreshold, setMetricThreshold] = useState(0.85)

  const filteredMatches = RETRIEVED_ITEMS.filter(item => item.similarity >= metricThreshold)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: 8 }}>Multimedia Analytics Module</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '4px 0' }}>Content-Based Image Retrieval (CBIR)</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            High-dimensional visual feature extraction, perceptual hashing, and nearest neighbor indexing for visual clone detection.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="stat-pill" style={{ background: 'var(--color-surface-2)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
            Indexer: <strong>FAISS IVF-Flat</strong>
          </span>
          <span className="stat-pill" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.82rem', fontWeight: 600 }}>
            Query Time: 3.4 ms / query
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>12,850</div>
          <div className="stat-card__label">Indexed Visual Embeddings</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Vector database gallery corpus</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-accent)' }}>97.8%</div>
          <div className="stat-card__label">Top-5 Retrieval Precision</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>P@5 on clone cluster benchmark</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>0.014</div>
          <div className="stat-card__label">Mean Cosine Distance</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Cluster tightness for synthetic media</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>512-d</div>
          <div className="stat-card__label">Embedding Vector Space</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Normalized hypersphere representation</div>
        </div>
      </div>

      {/* Query Selector & Matcher Showcase */}
      <div className="ba-grid-2" style={{ marginBottom: 24 }}>
        {/* Active Query Profile */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Query Image & Visual Descriptor</div>
            <div className="section-subtitle">Select sample query to test retrieval index</div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {QUERY_PROFILES.map(q => (
              <button
                key={q.id}
                onClick={() => setSelectedQuery(q)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  background: selectedQuery.id === q.id ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-2)',
                  color: selectedQuery.id === q.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  border: selectedQuery.id === q.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                }}
              >
                <div>{q.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{q.type}</div>
              </button>
            ))}
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
                <strong style={{ color: 'var(--color-accent)' }}>{selectedQuery.embeddingDim} floats</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Mean Similarity:</span>{' '}
                <strong style={{ color: 'var(--color-success)' }}>{(selectedQuery.avgSimilarity * 100).toFixed(1)}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Clones Detected:</span>{' '}
                <strong style={{ color: 'var(--color-warning)' }}>{selectedQuery.resultsCount} matches</strong>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                Cosine Similarity Cutoff Threshold: <strong>{(metricThreshold * 100).toFixed(0)}%</strong>
              </label>
              <input
                type="range"
                min="0.70"
                max="0.99"
                step="0.01"
                value={metricThreshold}
                onChange={e => setMetricThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Feature Extractor Benchmark Radar */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Descriptor Performance Comparison</div>
            <div className="section-subtitle">Accuracy vs Index Search Speed across feature types</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart cx="50%" cy="50%" outerRadius={90} data={FEATURE_DIMENSION_STATS}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="Retrieval Accuracy" dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
              <Radar name="Search Speed" dataKey="retrievalSpeed" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Tooltip contentStyle={{ background: '#111827', borderColor: 'var(--color-border)', borderRadius: 6, fontSize: '0.8rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Retrieved Nearest Neighbors Table */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">Top Nearest Neighbors in Image Feature Space (k-NN Query)</div>
          <div className="section-subtitle">
            Showing {filteredMatches.length} matching multimedia assets meeting similarity criteria
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Rank</th>
                <th style={{ padding: '10px 12px' }}>Asset ID</th>
                <th style={{ padding: '10px 12px' }}>Perceptual Hash</th>
                <th style={{ padding: '10px 12px' }}>Cosine Similarity</th>
                <th style={{ padding: '10px 12px' }}>Euclidean Distance</th>
                <th style={{ padding: '10px 12px' }}>Associated Account</th>
                <th style={{ padding: '10px 12px' }}>Classification</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map(item => (
                <tr key={item.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-primary)' }}>#{item.rank}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#fff' }}>{item.docId}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#94a3b8' }}>{item.hash}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: item.similarity > 0.95 ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                    {(item.similarity * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{item.distance.toFixed(3)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-primary)' }}>{item.accountRef}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: item.classLabel.includes('Bot') ? 'rgba(239,68,68,0.15)' : 'var(--color-surface-2)',
                      color: item.classLabel.includes('Bot') ? 'var(--color-danger)' : 'var(--color-text-muted)',
                    }}>
                      {item.classLabel}
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
