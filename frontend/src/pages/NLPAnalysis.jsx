import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts'
import axios from 'axios'

const API = 'http://localhost:8000'

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

function SentimentBar({ label, value, color }) {
  const pct = Math.abs(value) * 100
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value.toFixed(3)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  )
}

export default function NLPAnalysis() {
  const [sentiment,  setSentiment]  = useState(null)
  const [tfidf,      setTfidf]      = useState(null)
  const [wordFreq,   setWordFreq]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [activeTab,  setActiveTab]  = useState('sentiment')
  const [tfidfView,  setTfidfView]  = useState('bot')

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, tRes, wRes] = await Promise.all([
        axios.get(`${API}/api/nlp/sentiment`),
        axios.get(`${API}/api/nlp/tfidf?top_n=20`),
        axios.get(`${API}/api/nlp/word-frequency?top_n=20`),
      ])
      setSentiment(sRes.data)
      setTfidf(tRes.data)
      setWordFreq(wRes.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const sentimentRadar = sentiment ? [
    { metric: 'Compound', bot: sentiment.bot.compound,  human: sentiment.human.compound },
    { metric: 'Positive', bot: sentiment.bot.pos,       human: sentiment.human.pos },
    { metric: 'Neutral',  bot: sentiment.bot.neu,       human: sentiment.human.neu },
    { metric: 'Negative', bot: sentiment.bot.neg,       human: sentiment.human.neg },
  ] : []

  return (
    <div>
      <div className="page-header">
        <h1>NLP Analysis</h1>
        <p>Phase 5 — VADER Sentiment, TF-IDF Token Extraction & Word Frequency for Bot vs Human tweets</p>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 24 }}>
          ⚠️ {error}
          <button className="btn-retry" onClick={fetchAll}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="loading-box"><div className="spinner" /> Running NLP analysis…</div>
      )}

      {!loading && !error && sentiment && (
        <>
          {/* Summary sentiment cards */}
          <div className="ba-section">
            <div className="section-header">
              <div className="section-title">Sentiment Overview</div>
              <div className="section-subtitle">VADER compound score: −1 (very negative) to +1 (very positive)</div>
            </div>
            <div className="ba-grid-2">
              {/* Bot card */}
              <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span className="label-badge label-badge--bot">🤖 Bot</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {sentiment.bot.sample_n?.toLocaleString()} samples
                  </span>
                </div>
                <SentimentBar label="Compound" value={sentiment.bot.compound} color="#ef4444" />
                <SentimentBar label="Positive"  value={sentiment.bot.pos}     color="#10b981" />
                <SentimentBar label="Neutral"   value={sentiment.bot.neu}     color="#94a3b8" />
                <SentimentBar label="Negative"  value={sentiment.bot.neg}     color="#f59e0b" />
              </div>
              {/* Human card */}
              <div className="card" style={{ borderColor: 'rgba(34,211,238,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span className="label-badge label-badge--human">👤 Human</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {sentiment.human.sample_n?.toLocaleString()} samples
                  </span>
                </div>
                <SentimentBar label="Compound" value={sentiment.human.compound} color="#22d3ee" />
                <SentimentBar label="Positive"  value={sentiment.human.pos}     color="#10b981" />
                <SentimentBar label="Neutral"   value={sentiment.human.neu}     color="#94a3b8" />
                <SentimentBar label="Negative"  value={sentiment.human.neg}     color="#f59e0b" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tab-row" style={{ marginBottom: 24 }}>
            {[['sentiment', '😊 Sentiment Comparison'], ['tfidf', '📝 TF-IDF Tokens'], ['wordfreq', '📊 Word Frequency']].map(([id, label]) => (
              <button key={id} id={`nlp-tab-${id}`} className={`tab-btn${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {/* Sentiment comparison radar */}
          {activeTab === 'sentiment' && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">Sentiment Radar — Bot vs Human</div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={sentimentRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Bot"   dataKey="bot"   stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                  <Radar name="Human" dataKey="human" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>

              {/* Distribution */}
              <div className="ba-grid-2" style={{ marginTop: 24 }}>
                {['bot', 'human'].map(lbl => (
                  <div key={lbl}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 10,
                      color: lbl === 'bot' ? '#ef4444' : '#22d3ee' }}>
                      {lbl === 'bot' ? '🤖 Bot' : '👤 Human'} — Compound Distribution
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={sentiment[lbl].distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill={lbl === 'bot' ? '#ef4444' : '#22d3ee'}
                          radius={[4, 4, 0, 0]} opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TF-IDF tokens */}
          {activeTab === 'tfidf' && tfidf && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">TF-IDF Top Tokens</div>
                <div className="section-subtitle">Most discriminative words/bigrams by TF-IDF score</div>
              </div>
              <div className="tab-row" style={{ marginBottom: 16 }}>
                {['bot', 'human'].map(v => (
                  <button key={v} id={`tfidf-view-${v}`}
                    className={`tab-btn${tfidfView === v ? ' active' : ''}`}
                    onClick={() => setTfidfView(v)}>
                    {v === 'bot' ? '🤖 Bot Tokens' : '👤 Human Tokens'}
                  </button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={tfidf[tfidfView]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="token" width={130}
                    tick={{ fill: '#22d3ee', fontSize: 11, fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill={tfidfView === 'bot' ? '#ef4444' : '#22d3ee'}
                    radius={[0, 4, 4, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Word Frequency */}
          {activeTab === 'wordfreq' && wordFreq && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">Word Frequency Comparison</div>
                <div className="section-subtitle">Most frequent words in bot vs human tweet corpus</div>
              </div>
              <div className="ba-grid-2">
                {['bot', 'human'].map(lbl => (
                  <div key={lbl}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12,
                      color: lbl === 'bot' ? '#ef4444' : '#22d3ee' }}>
                      {lbl === 'bot' ? '🤖 Bot Words' : '👤 Human Words'}
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={wordFreq[lbl].slice(0, 15)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis type="category" dataKey="word" width={80}
                          tick={{ fill: '#22d3ee', fontSize: 10, fontFamily: 'monospace' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill={lbl === 'bot' ? '#ef4444' : '#22d3ee'}
                          radius={[0, 4, 4, 0]} opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
