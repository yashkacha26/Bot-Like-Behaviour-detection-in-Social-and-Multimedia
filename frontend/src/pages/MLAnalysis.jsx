import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import {
  Cpu, BarChart3, ListFilter, Grid, LineChart as LineChartIcon,
  AlertTriangle, Play, CheckCircle2, RefreshCw, Download, ArrowRight
} from 'lucide-react'
import api from '../api/client'

const MODEL_COLORS = {
  'Logistic Regression': '#6366f1',
  'Decision Tree':       '#06b6d4',
  'Random Forest':       '#10b981',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="recharts-custom-tooltip">
      <div className="recharts-custom-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.8rem', marginTop: 2, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <span>{p.name}:</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>
            {typeof p.value === 'number' ? (p.value > 1 ? p.value.toFixed(2) : (p.value * 100).toFixed(1) + '%') : p.value}
          </strong>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `2px solid ${color}` }}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value" style={{ color, fontSize: '1.5rem', margin: '6px 0 2px' }}>
        {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}
      </div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{sub}</div>}
    </div>
  )
}

function ConfusionMatrix({ cm, labels }) {
  if (!cm || cm.length < 2) return null
  const [[tn, fp], [fn, tp]] = cm
  const total = tn + fp + fn + tp
  const cells = [
    { val: tn, label: 'True Negative (Human)',  bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
    { val: fp, label: 'False Positive (Type I)', bg: 'rgba(244,63,94,0.1)',  color: '#f43f5e' },
    { val: fn, label: 'False Negative (Type II)',bg: 'rgba(244,63,94,0.1)',  color: '#f43f5e' },
    { val: tp, label: 'True Positive (Bot)',    bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 360, margin: '0 auto' }}>
        {cells.map((c, i) => (
          <div key={i} style={{
            background: c.bg, border: `1px solid ${c.color}40`,
            borderRadius: 'var(--radius-sm)', padding: '16px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)' }}>
              {c.val}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 4, fontWeight: 600 }}>
              {c.label}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {total ? (c.val / total * 100).toFixed(1) : 0}% of hold-out
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          [Predicted Human | Predicted Bot]
        </span>
      </div>
    </div>
  )
}

export default function MLAnalysis({ onNavigate }) {
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
        api.get('/ml/metrics'),
        api.get(`/ml/feature-importance?model=${encodeURIComponent(modelName)}`),
        api.get(`/ml/confusion-matrix?model=${encodeURIComponent(modelName)}`),
        api.get('/ml/roc-all'),
      ])
      setMetrics(mRes.data)
      setImportance(iRes.data.slice(0, 12))
      setCmData(cmRes.data)
      setRocData(rocRes.data)
    } catch (e) {
      setError('Models not trained yet. Click "Re-fit Pipeline" to train.')
    } finally {
      setLoading(false)
    }
  }, [selectedModel])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleTrain = async () => {
    setTraining(true)
    setError(null)
    try {
      await api.post('/ml/train')
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
        api.get(`/ml/feature-importance?model=${encodeURIComponent(m)}`),
        api.get(`/ml/confusion-matrix?model=${encodeURIComponent(m)}`),
      ])
      setImportance(iRes.data.slice(0, 12))
      setCmData(cmRes.data)
    } catch (_) {}
    setLoading(false)
  }

  const handleExportML = () => {
    const payload = {
      selectedModel,
      metrics,
      importance,
      confusionMatrix: cmData,
      rocData,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ml_benchmarks_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Build comparison data for bar chart
  const comparisonData = ['test_accuracy', 'test_precision', 'test_recall', 'test_f1', 'test_roc_auc'].map(key => {
    const label = key.replace('test_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    const entry = { metric: label }
    metrics.forEach(m => { entry[m.model] = m[key] })
    return entry
  })

  // ROC chart data
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="page-header__kicker">
            <span className="badge badge-primary">Machine Learning</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>PHASE 4 SCIKIT-LEARN</span>
          </div>
          <h1>Predictive Machine Learning Classifiers</h1>
          <p>
            Logistic Regression, Decision Tree, and Random Forest architectures trained on 14 behavioural &amp; metadata features with 5-fold stratified cross-validation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="telemetry-indicator">
            <Cpu size={14} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>Feature Dim: 14 Columns</span>
          </div>
          <button className="btn btn-secondary" onClick={handleExportML} disabled={metrics.length === 0}>
            <Download size={14} />
            Export Benchmark JSON
          </button>
        </div>
      </div>

      {/* Action controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          id="btn-train-models"
          onClick={handleTrain}
          disabled={training}
          className="btn btn-primary"
        >
          <Play size={14} className={training ? 'spinner' : ''} />
          {training ? 'Training Pipeline...' : 'Re-fit / Train Pipeline'}
        </button>

        {/* Model selector buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
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
        <div className="error-box" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchAll()}>Retry</button>
        </div>
      )}

      {loading && !error && (
        <div className="loading-box"><div className="spinner" /> Evaluating model performance metrics...</div>
      )}

      {!loading && !error && metrics.length > 0 && (
        <>
          {/* Selected Model KPI strip */}
          {(() => {
            const m = metrics.find(x => x.model === selectedModel) || metrics[0]
            return (
              <div style={{ marginBottom: 24 }}>
                <div className="section-header">
                  <div>
                    <div className="section-title">
                      <span style={{ color: MODEL_COLORS[m.model] }}>{m.model}</span> — Hold-Out Partition Performance
                    </div>
                    <div className="section-subtitle">Evaluated on a 20% hold-out test set</div>
                  </div>
                </div>
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  <MetricCard label="Accuracy"  value={m.test_accuracy}  color="var(--color-primary)" />
                  <MetricCard label="Precision" value={m.test_precision} color="var(--color-accent)"  />
                  <MetricCard label="Recall"    value={m.test_recall}    color="var(--color-success)" />
                  <MetricCard label="F1 Score"  value={m.test_f1}        color="var(--color-warning)" />
                  <MetricCard label="ROC-AUC"   value={m.test_roc_auc}   color="#a78bfa"              />
                </div>
                <div style={{ marginTop: 8, fontSize: '0.74rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  5-Fold CV Cross-Validation — Accuracy: {(m.cv_accuracy * 100).toFixed(1)}% ± {(m.cv_accuracy_std * 100).toFixed(1)}% | F1: {(m.cv_f1 * 100).toFixed(1)}% ± {(m.cv_f1_std * 100).toFixed(1)}% | ROC-AUC: {(m.cv_roc_auc * 100).toFixed(1)}%
                </div>
              </div>
            )
          })()}

          {/* Navigation Tabs */}
          <div className="tab-row" style={{ marginBottom: 20 }}>
            {[
              ['metrics',    'Comparative Evaluation'],
              ['importance', 'Feature Importances'],
              ['confusion',  'Confusion Matrix'],
              ['roc',        'ROC Curves Overlay']
            ].map(([id, label]) => (
              <button
                key={id}
                id={`tab-${id}`}
                className={`tab-btn${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Model Comparison Bar Chart */}
          {activeTab === 'metrics' && (
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">Hold-Out Metric Benchmark</div>
                  <div className="section-subtitle">Normalized score comparison across all trained classifiers</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                  {Object.entries(MODEL_COLORS).map(([name, color]) => (
                    <Bar key={name} dataKey={name} fill={color} radius={[3, 3, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              <div style={{ marginTop: 24 }}>
                <div className="section-title" style={{ marginBottom: 10, fontSize: '0.88rem' }}>Cross-Validation Summary Table</div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Model Architecture</th>
                        <th>CV Mean Accuracy</th>
                        <th>CV Mean F1</th>
                        <th>CV ROC-AUC</th>
                        <th>Test Accuracy</th>
                        <th>Test F1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(m => (
                        <tr key={m.model} style={m.model === selectedModel ? { background: 'rgba(99,102,241,0.06)' } : {}}>
                          <td style={{ color: MODEL_COLORS[m.model], fontWeight: 600 }}>{m.model}</td>
                          <td className="mono-val">{(m.cv_accuracy * 100).toFixed(1)}% ± {(m.cv_accuracy_std * 100).toFixed(1)}%</td>
                          <td className="mono-val">{(m.cv_f1 * 100).toFixed(1)}%</td>
                          <td className="mono-val">{(m.cv_roc_auc * 100).toFixed(1)}%</td>
                          <td className="mono-val" style={{ color: '#fff', fontWeight: 700 }}>{(m.test_accuracy * 100).toFixed(1)}%</td>
                          <td className="mono-val" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{(m.test_f1 * 100).toFixed(1)}%</td>
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
                <div>
                  <div className="section-title">Relative Feature Importance: {selectedModel}</div>
                  <div className="section-subtitle">Gini impurity decrease or coefficient weight magnitudes</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={importance} layout="vertical" barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => v.toFixed(3)} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" width={150}
                    tick={{ fill: 'var(--color-accent)', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="importance" fill={MODEL_COLORS[selectedModel] || 'var(--color-primary)'}
                    radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Confusion Matrix */}
          {activeTab === 'confusion' && cmData && (
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">Hold-Out Confusion Matrix: {selectedModel}</div>
                  <div className="section-subtitle">Binary classification outcome contingency</div>
                </div>
              </div>
              <ConfusionMatrix cm={cmData.confusion_matrix} labels={cmData.labels} />
            </div>
          )}

          {/* ROC Curves */}
          {activeTab === 'roc' && rocData.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">Receiver Operating Characteristic (ROC) Overlay</div>
                  <div className="section-subtitle">True Positive Rate vs False Positive Rate across decision thresholds</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                {rocData.map(r => (
                  <div key={r.model} style={{
                    padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                    background: `${MODEL_COLORS[r.model]}15`,
                    border: `1px solid ${MODEL_COLORS[r.model]}40`,
                    fontSize: '0.78rem', color: MODEL_COLORS[r.model], fontWeight: 600,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {r.model}: AUC {(r.roc_auc * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={rocChartData}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="fpr" type="number" domain={[0, 1]}
                    tickFormatter={v => v.toFixed(1)}
                    label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                    tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 1]}
                    label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                    tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
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
