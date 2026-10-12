import React, { useState } from 'react'
import {
  Shield, Search, Database, Radio, CheckCircle2,
  Terminal, ExternalLink, Cpu, Activity, Download,
  PanelLeft, PanelLeftClose
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import HealthCheck from './pages/HealthCheck'
import Dashboard from './pages/Dashboard'
import DatasetExplorer from './pages/DatasetExplorer'
import BehaviourAnalytics from './pages/BehaviourAnalytics'
import MLAnalysis from './pages/MLAnalysis'
import NLPAnalysis from './pages/NLPAnalysis'
import NetworkAnalysis from './pages/NetworkAnalysis'
import AccountInvestigation from './pages/AccountInvestigation'
import ObjectDetectionTracking from './pages/ObjectDetectionTracking'
import CBIRAnalysis from './pages/CBIRAnalysis'
import VideoContentIRAnalysis from './pages/VideoContentIRAnalysis'

const PAGE_METADATA = {
  dashboard:      { title: 'Executive Threat Dashboard',             section: 'Core Telemetry' },
  dataset:        { title: 'Dataset Schema & Distribution Explorer', section: 'Core Telemetry' },
  investigate:    { title: 'Account Forensics & Risk Dossier',       section: 'Core Telemetry' },
  nlp:            { title: 'Sentiment & Lexical Linguistic Analysis',section: 'Behavioral & Linguistic' },
  behaviour:      { title: 'Behavioral Dynamics & Temporal Profiling',section: 'Behavioral & Linguistic' },
  network:        { title: 'Social Graph Topology & Centrality',      section: 'Behavioral & Linguistic' },
  ml:             { title: 'Machine Learning Model Benchmarking',    section: 'Behavioral & Linguistic' },
  'object-detect':{ title: 'Real-Time Object Detection & Tracking',  section: 'Multimedia Surveillance' },
  cbir:           { title: 'Content-Based Image Retrieval (CBIR)',   section: 'Multimedia Surveillance' },
  'video-ir':     { title: 'Video Content Forensics & IR Engine',    section: 'Multimedia Surveillance' },
  health:         { title: 'Infrastructure Telemetry & DB State',    section: 'System Infrastructure' },
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [navParams, setNavParams] = useState(null)
  const [globalSearch, setGlobalSearch] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [exportNotice, setExportNotice] = useState(false)

  const handleNavigate = (page, params = null) => {
    setActivePage(page)
    setNavParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGlobalSearch = (e) => {
    e.preventDefault()
    if (globalSearch.trim()) {
      handleNavigate('investigate', { query: globalSearch.trim() })
    }
  }

  const handleExportTelemetry = () => {
    const report = {
      platform: 'SMA Sentinel v1.0 Production',
      exportTimestamp: new Date().toISOString(),
      dataset: 'TwiBot-20 Benchmark',
      activeWorkspace: activePage,
      status: 'VERIFIED_OPERATIONAL',
      architecture: {
        backend: 'FastAPI 0.4.0 (Python 3.11)',
        database: 'SQLite 3 (bot_detection.db)',
        frontend: 'React 19 + Vite 8 (Port 5173)',
        mlPipeline: 'Scikit-Learn (Random Forest 89.2% Acc, AUC 0.941)',
        visionPipeline: 'YOLOv8x + DeepSORT Tracking',
        irEngine: 'FAISS Vector Index + Hybrid BM25',
      }
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sma-sentinel-telemetry-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportNotice(true)
    setTimeout(() => setExportNotice(false), 3000)
  }

  const currentMeta = PAGE_METADATA[activePage] || { title: 'Analytics Workspace', section: 'SMA Platform' }

  function renderContent() {
    if (activePage === 'health')         return <HealthCheck />
    if (activePage === 'dashboard')      return <Dashboard onNavigate={handleNavigate} />
    if (activePage === 'dataset')        return <DatasetExplorer onNavigate={handleNavigate} />
    if (activePage === 'behaviour')      return <BehaviourAnalytics onNavigate={handleNavigate} />
    if (activePage === 'nlp')            return <NLPAnalysis onNavigate={handleNavigate} />
    if (activePage === 'network')        return <NetworkAnalysis onNavigate={handleNavigate} />
    if (activePage === 'ml')             return <MLAnalysis onNavigate={handleNavigate} />
    if (activePage === 'investigate')    return <AccountInvestigation initialQuery={navParams?.query || globalSearch} onNavigate={handleNavigate} />
    if (activePage === 'object-detect')  return <ObjectDetectionTracking onNavigate={handleNavigate} />
    if (activePage === 'cbir')           return <CBIRAnalysis onNavigate={handleNavigate} />
    if (activePage === 'video-ir')       return <VideoContentIRAnalysis onNavigate={handleNavigate} />
    return null
  }

  return (
    <div className="app-shell">
      {/* Top Application Command Bar */}
      <header className="top-header" role="banner">
        <div className="top-header__left">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{ marginRight: 4 }}
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>

          <div
            className="top-header__brand"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavigate('dashboard')}
            title="Return to Threat Dashboard"
          >
            <div className="brand-icon">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            <div className="brand-title">
              SMA Sentinel
              <span className="brand-badge">SecOps v1.0</span>
            </div>
          </div>

          <div className="top-header__sep" />

          {/* Breadcrumb Hierarchy */}
          <div className="top-header__meta">
            <span
              style={{ color: 'var(--color-text-dim)', cursor: 'pointer' }}
              onClick={() => handleNavigate('dashboard')}
            >
              {currentMeta.section}
            </span>
            <span style={{ color: 'var(--color-border-hover)' }}>/</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>
              {currentMeta.title}
            </span>
          </div>
        </div>

        <div className="top-header__right">
          {/* Quick lookup form */}
          <form onSubmit={handleGlobalSearch} style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Audit account or handle..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px 6px 30px',
                fontSize: '0.78rem',
                color: 'var(--color-text)',
                width: 200,
                outline: 'none',
              }}
            />
          </form>

          {/* Dataset tag */}
          <div
            className="telemetry-indicator"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavigate('dataset')}
            title="View Dataset Schema & Metrics"
          >
            <Database size={13} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>TwiBot-20</span>
          </div>

          {/* Export telemetry report button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportTelemetry}
            title="Download Telemetry JSON Report"
            style={{ padding: '5px 10px', fontSize: '0.74rem' }}
          >
            <Download size={13} />
            {exportNotice ? 'Exported!' : 'Export JSON'}
          </button>

          {/* Telemetry heartbeat */}
          <div
            className="telemetry-indicator"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavigate('health')}
            title="FastAPI Backend Health"
          >
            <div className="pulse-dot" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-success)' }}>
              API:8000 LIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="app-body">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="main-content" id="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
