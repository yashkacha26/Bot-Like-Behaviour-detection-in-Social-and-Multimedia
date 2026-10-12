import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts'
import {
  MessageSquare, RefreshCw, Download, Search, AlertTriangle, CheckCircle2
} from 'lucide-react'
import api from '../api/client'

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
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value.toFixed(3)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  )
}

export default function NLPAnalysis({ onNavigate }) {
  const [sentiment,  setSentiment]  = useState(null)
  const [tfidf,      setTfidf]      = useState(null)
  const [wordFreq,   setWordFreq]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [activeTab,  setActiveTab]  = useState('sentiment')
  const [tfidfView,  setTfidfView]  = useState('bot')
  const [tokenSearch, setTokenSearch] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, tRes, wRes] = await Promise.all([
        api.get('/nlp/sentiment'),
        api.get('/nlp/tfidf?top_n=25'),
        api.get('/nlp/word-frequency?top_n=25'),
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

  const handleExportNLP = () => {
    const payload = {
      sentiment,
      tfidf,
      wordFrequency: wordFreq,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nlp_lexical_analysis_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sentimentRadar = sentiment ? [
    { metric: 'Compound', bot: sentiment.bot.compound,  human: sentiment.human.compound },
    { metric: 'Positive', bot: sentiment.bot.pos,       human: sentiment.human.pos },
    { metric: 'Neutral',  bot: sentiment.bot.neu,       human: sentiment.human.neu },
    { metric: 'Negative', bot: sentiment.bot.neg,       human: sentiment.human.neg },
  ] : []

  const filteredTfidf = (tfidf && tfidf[tfidfView] ? tfidf[tfidfView] : []).filter(item =>
    !tokenSearch || item.token.toLowerCase().includes(tokenSearch.toLowerCase())
  )

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="page-header__kicker">
            <span className="badge badge-accent">Natural Language Processing</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
              VADER + TF-IDF
            </span>
          </div>
          <h1>Sentiment Analysis &amp; Textual Extraction</h1>
          <p>
            VADER compound polarity scores, emotion valence, TF-IDF lexical discrimination, and bot vs human vocabulary divergence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            Recalculate Scores
          </button>
          <button className="btn btn-secondary" onClick={handleExportNLP} disabled={!sentiment}>
            <Download size={14} />
            Export NLP Data
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="loading-box"><div className="spinner" /> Running sentiment &amp; lexical analysis…</div>
      )}

      {!loading && !error && sentiment && (
        <>
          {/* Summary sentiment cards */}
          <div className="ba-section">
            <div className="section-header">
              <div className="section-title">Sentiment Polarity Profile</div>
              <div className="section-subtitle">VADER compound score metric: −1.00 (extreme negative) to +1.00 (extreme positive)</div>
            </div>
            <div className="ba-grid-2">
              {/* Bot card */}
              <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>Bot Account Corpus</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {sentiment.bot.sample_n?.toLocaleString()} tweets analyzed
                  </span>
                </div>
                <SentimentBar label="Compound Polarity" value={sentiment.bot.compound} color="#ef4444" />
                <SentimentBar label="Positive Sentiment"  value={sentiment.bot.pos}     color="#10b981" />
                <SentimentBar label="Neutral Sentiment"   value={sentiment.bot.neu}     color="#94a3b8" />
                <SentimentBar label="Negative Sentiment"  value={sentiment.bot.neg}     color="#f59e0b" />
              </div>

              {/* Human card */}
              <div className="card" style={{ borderLeft: '4px solid #22d3ee' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22d3ee' }}>Human User Corpus</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {sentiment.human.sample_n?.toLocaleString()} tweets analyzed
                  </span>
                </div>
                <SentimentBar label="Compound Polarity" value={sentiment.human.compound} color="#22d3ee" />
                <SentimentBar label="Positive Sentiment"  value={sentiment.human.pos}     color="#10b981" />
                <SentimentBar label="Neutral Sentiment"   value={sentiment.human.neu}     color="#94a3b8" />
                <SentimentBar label="Negative Sentiment"  value={sentiment.human.neg}     color="#f59e0b" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tab-row" style={{ marginBottom: 20 }}>
            {[
              ['sentiment', 'Sentiment Comparison & Valence'],
              ['tfidf', 'TF-IDF Discriminative Tokens'],
              ['wordfreq', 'Lexical Word Frequencies']
            ].map(([id, label]) => (
              <button
                key={id}
                id={`nlp-tab-${id}`}
                className={`tab-btn${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sentiment comparison radar */}
          {activeTab === 'sentiment' && (
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">Sentiment Radar Dimension: Bot vs Human</div>
                  <div className="section-subtitle">Multidimensional polarity comparison</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={sentimentRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Bot Accounts"   dataKey="bot"   stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                  <Radar name="Human Accounts" dataKey="human" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>

              {/* Distribution */}
              <div className="ba-grid-2" style={{ marginTop: 24 }}>
                {['bot', 'human'].map(lbl => (
                  <div key={lbl}>
                    <div style={{
                      fontSize: '0.82rem', fontWeight: 700, marginBottom: 10,
                      color: lbl === 'bot' ? '#ef4444' : '#22d3ee',
                    }}>
                      {lbl === 'bot' ? 'Bot Corpus' : 'Human Corpus'} — Compound Distribution
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

          {/* TF-IDF tokens with token filter */}
          {activeTab === 'tfidf' && tfidf && (
            <div className="card">
              <div className="section-header">
                <div>
                  <div className="section-title">TF-IDF Top Discriminative Tokens</div>
                  <div className="section-subtitle">Key terms showing greatest variance in bot vs human language usage</div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="tab-row" style={{ margin: 0 }}>
                    {['bot', 'human'].map(v => (
                      <button
                        key={v}
                        id={`tfidf-view-${v}`}
                        className={`tab-btn${tfidfView === v ? ' active' : ''}`}
                        onClick={() => setTfidfView(v)}
                        style={{ padding: '3px 10px', fontSize: '0.74rem' }}
                      >
                        {v === 'bot' ? 'Bot Tokens' : 'Human Tokens'}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Filter token..."
                      value={tokenSearch}
                      onChange={e => setTokenSearch(e.target.value)}
                      style={{
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 8px 4px 26px',
                        fontSize: '0.74rem',
                        color: 'var(--color-text)',
                        width: 140,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredTfidf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="token" width={130}
                    tick={{ fill: '#22d3ee', fontSize: 11, fontFamily: 'var(--font-mono)' }} />
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
                <div>
                  <div className="section-title">Lexical Frequency Distribution</div>
                  <div className="section-subtitle">Top unigrams observed in corpus messages</div>
                </div>
              </div>
              <div className="ba-grid-2">
                {['bot', 'human'].map(lbl => (
                  <div key={lbl}>
                    <div style={{
                      fontSize: '0.85rem', fontWeight: 700, marginBottom: 12,
                      color: lbl === 'bot' ? '#ef4444' : '#22d3ee',
                    }}>
                      {lbl === 'bot' ? 'Bot Lexicon' : 'Human Lexicon'}
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={wordFreq[lbl].slice(0, 15)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis type="category" dataKey="word" width={80}
                          tick={{ fill: '#22d3ee', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
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
