import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import axios from 'axios'

const API = 'http://localhost:8000'

const MODEL_COLORS = {
  'Logistic Regression': '#6366f1',
  'Decision Tree':       '#22d3ee',
  'Random Forest':       '#10b981',
}

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

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card__value" style={{ color, fontSize: '1.5rem' }}>
        {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}
      </div>
      <div className="stat-card__label">{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ConfusionMatrix({ cm, labels }) {
  if (!cm || cm.length < 2) return null
  const [[tn, fp], [fn, tp]] = cm
  const total = tn + fp + fn + tp
  const cells = [
    { val: tn, label: 'True Negative',  bg: 'rgba(16,185,129,0.2)',  color: '#10b981' },
    { val: fp, label: 'False Positive', bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
    { val: fn, label: 'False Negative', bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
    { val: tp, label: 'True Positive',  bg: 'rgba(16,185,129,0.2)',  color: '#10b981' },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 320, margin: '0 auto' }}>
        {cells.map((c, i) => (
          <div key={i} style={{
            background: c.bg, border: `1px solid ${c.color}40`,
            borderRadius: 'var(--radius-sm)', padding: '20px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{c.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              {total ? (c.val / total * 100).toFixed(1) : 0}%
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          ← Predicted Human &nbsp;|&nbsp; Predicted Bot →
        </span>
      </div>
    </div>
  )
}

export default function MLAnalysis() {
  const [metrics,     setMetrics]     = useState([])
  const [importance,  setImportance]  = useState([])
  const [cmData,      setCmData]      = useState(null)
  const [rocData,     setRocData]     = useState([])
  const [selectedModel, setSelectedModel] = useState('Random Forest')
  const [training,    setTraining]    = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [activeTab,   setActiveTab]   = useState('metrics')

  const MODELS = ['Random Forest', 'Logistic Regression', 'Decision Tree']

  const fetchAll = useCallback(async (modelName = selectedModel) => {
    setLoading(true)
    setError(null)
    try {
      const [mRes, iRes, cmRes, rocRes] = await Promise.all([
        axios.get(`${API}/api/ml/metrics`),
        axios.get(`${API}/api/ml/feature-importance?model=${encodeURIComponent(modelName)}`),
        axios.get(`${API}/api/ml/confusion-matrix?model=${encodeURIComponent(modelName)}`),
        axios.get(`${API}/api/ml/roc-all`),
      ])
      setMetrics(mRes.data)
      setImportance(iRes.data.slice(0, 12))
      setCmData(cmRes.data)
      setRocData(rocRes.data)
    } catch (e) {
      setError('Models not trained yet. Click "Train Models" to get started.')
    } finally {
      setLoading(false)
    }
  }, [selectedModel])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleTrain = async () => {
    setTraining(true)
    setError(null)
    try {
      await axios.post(`${API}/api/ml/train`)
      await fetchAll()
    } catch (e) {
      setError('Training failed: ' + (e.response?.data?.detail || e.message))
    } finally {
      setTraining(false)
    }
  }

  const handleModelSwitch = async (m) => {
    setSelectedModel(m)
    setLoading(true)
    try {
      const [iRes, cmRes] = await Promise.all([
        axios.get(`${API}/api/ml/feature-importance?model=${encodeURIComponent(m)}`),
        axios.get(`${API}/api/ml/confusion-matrix?model=${encodeURIComponent(m)}`),
      ])
      setImportance(iRes.data.slice(0, 12))
      setCmData(cmRes.data)
    } catch (_) {}
    setLoading(false)
  }

  // Build comparison data for bar chart
  const comparisonData = ['test_accuracy', 'test_precision', 'test_recall', 'test_f1', 'test_roc_auc'].map(key => {
    const label = key.replace('test_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    const entry = { metric: label }
    metrics.forEach(m => { entry[m.model] = m[key] })
    return entry
  })

  // ROC chart data — merge all model curves into one list of points
  const rocChartData = (() => {
    if (!rocData.length) return []
    const maxLen = Math.max(...rocData.map(r => r.fpr.length))
    return Array.from({ length: maxLen }, (_, i) => {
      const pt = {}
      rocData.forEach(r => {
        const idx = Math.min(i, r.fpr.length - 1)
        pt[`fpr_${r.model}`] = r.fpr[idx]
        pt[r.model] = r.tpr[idx]
        pt.fpr = r.fpr[idx]
      })
      return pt
    })
  })()

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: 8 }}>Predictive Analytics</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '4px 0' }}>Machine Learning Classification Models</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Logistic Regression, Decision Tree & Random Forest evaluated with 5-fold cross-validation and hold-out test metrics.
          </p>
        </div>
        <span className="stat-pill" style={{ background: 'var(--color-surface-2)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
          Trained on: <strong>14 Engineered Features</strong>
        </span>
      </div>

      {/* Train button */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          id="btn-train-models"
          onClick={handleTrain}
          disabled={training}
          style={{
            padding: '9px 20px', borderRadius: 'var(--radius-sm)',
            background: training ? 'rgba(99,102,241,0.3)' : 'var(--color-primary)',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            border: 'none',
            cursor: training ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {training ? 'Re-training Models...' : 'Re-fit / Train Pipeline'}
        </button>

        {/* Model selector */}
        <div style={{ display: 'flex', gap: 8 }}>
          {MODELS.map(m => (
            <button
              key={m}
              id={`btn-model-${m.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => handleModelSwitch(m)}
              className={`tab-btn${selectedModel === m ? ' active' : ''}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 24 }}>
          <span>{error}</span>
          <button className="btn-retry" onClick={() => fetchAll()}>Retry</button>
        </div>
      )}

      {loading && !error && (
        <div className="loading-box"><div className="spinner" /> Training & loading results…</div>
      )}

      {!loading && !error && metrics.length > 0 && (
        <>
          {/* Metric Cards for selected model */}
          {(() => {
            const m = metrics.find(x => x.model === selectedModel) || metrics[0]
            return (
              <div className="ba-section">
                <div className="section-header">
                  <div className="section-title">{m.model} — Hold-out Metrics</div>
                  <div className="section-subtitle">Evaluated on 20% stratified test split</div>
                </div>
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  <MetricCard label="Accuracy"  value={m.test_accuracy}  color="var(--color-primary)" />
                  <MetricCard label="Precision" value={m.test_precision} color="var(--color-accent)"  />
                  <MetricCard label="Recall"    value={m.test_recall}    color="var(--color-success)" />
                  <MetricCard label="F1 Score"  value={m.test_f1}        color="var(--color-warning)" />
                  <MetricCard label="ROC-AUC"   value={m.test_roc_auc}   color="#a78bfa"              />
                </div>
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  5-Fold CV — Accuracy: <strong style={{ color: 'var(--color-text)' }}>{(m.cv_accuracy * 100).toFixed(1)}% ± {(m.cv_accuracy_std * 100).toFixed(1)}%</strong>
                  &nbsp;|&nbsp; F1: <strong style={{ color: 'var(--color-text)' }}>{(m.cv_f1 * 100).toFixed(1)}% ± {(m.cv_f1_std * 100).toFixed(1)}%</strong>
                  &nbsp;|&nbsp; ROC-AUC: <strong style={{ color: 'var(--color-text)' }}>{(m.cv_roc_auc * 100).toFixed(1)}%</strong>
                </div>
              </div>
            )
          })()}

          {/* Tabs */}
          <div className="tab-row" style={{ marginBottom: 24 }}>
            {[['metrics', '📊 Model Comparison'], ['importance', '🔍 Feature Importance'],
              ['confusion', '🔲 Confusion Matrix'], ['roc', '📈 ROC Curves']].map(([id, label]) => (
              <button key={id} id={`tab-${id}`} className={`tab-btn${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {/* Model Comparison Bar Chart */}
          {activeTab === 'metrics' && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">Model Comparison — All Metrics</div>
                <div className="section-subtitle">Higher is better for all metrics</div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparisonData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  {Object.entries(MODEL_COLORS).map(([name, color]) => (
                    <Bar key={name} dataKey={name} fill={color} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              {/* CV summary table */}
              <div style={{ marginTop: 24 }}>
                <div className="section-title" style={{ marginBottom: 12, fontSize: '0.9rem' }}>Cross-Validation Summary</div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Model</th><th>CV Accuracy</th><th>CV F1</th><th>CV ROC-AUC</th>
                        <th>Test Accuracy</th><th>Test F1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(m => (
                        <tr key={m.model} style={m.model === selectedModel ? { background: 'rgba(99,102,241,0.08)' } : {}}>
                          <td style={{ color: MODEL_COLORS[m.model], fontWeight: 600 }}>{m.model}</td>
                          <td>{(m.cv_accuracy * 100).toFixed(1)}% ± {(m.cv_accuracy_std * 100).toFixed(1)}%</td>
                          <td>{(m.cv_f1 * 100).toFixed(1)}%</td>
                          <td>{(m.cv_roc_auc * 100).toFixed(1)}%</td>
                          <td><strong style={{ color: 'var(--color-text)' }}>{(m.test_accuracy * 100).toFixed(1)}%</strong></td>
                          <td><strong style={{ color: 'var(--color-text)' }}>{(m.test_f1 * 100).toFixed(1)}%</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Feature Importance */}
          {activeTab === 'importance' && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">Feature Importance — {selectedModel}</div>
                <div className="section-subtitle">Top 12 features by importance score</div>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={importance} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tickFormatter={v => v.toFixed(3)} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" width={150}
                    tick={{ fill: '#22d3ee', fontSize: 11, fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="importance" fill={MODEL_COLORS[selectedModel] || 'var(--color-primary)'}
                    radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Confusion Matrix */}
          {activeTab === 'confusion' && cmData && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">Confusion Matrix — {selectedModel}</div>
                <div className="section-subtitle">Hold-out test set predictions</div>
              </div>
              <ConfusionMatrix cm={cmData.confusion_matrix} labels={cmData.labels} />
            </div>
          )}

          {/* ROC Curves */}
          {activeTab === 'roc' && rocData.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">ROC Curves — All Models</div>
                <div className="section-subtitle">Receiver Operating Characteristic — higher AUC is better</div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                {rocData.map(r => (
                  <div key={r.model} style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                    background: `${MODEL_COLORS[r.model]}22`,
                    border: `1px solid ${MODEL_COLORS[r.model]}55`,
                    fontSize: '0.8rem', color: MODEL_COLORS[r.model], fontWeight: 600,
                  }}>
                    {r.model}: AUC {(r.roc_auc * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={rocChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="fpr" type="number" domain={[0, 1]}
                    tickFormatter={v => v.toFixed(1)} label={{ value: 'FPR', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }}
                    tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 1]}
                    label={{ value: 'TPR', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  {rocData.map(r => (
                    <Line key={r.model} type="monotone" dataKey={r.model}
                      stroke={MODEL_COLORS[r.model]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
