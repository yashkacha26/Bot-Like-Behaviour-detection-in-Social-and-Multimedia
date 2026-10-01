import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import HealthCheck from './pages/HealthCheck'
import Dashboard from './pages/Dashboard'
import DatasetExplorer from './pages/DatasetExplorer'
import BehaviourAnalytics from './pages/BehaviourAnalytics'
import MLAnalysis from './pages/MLAnalysis'
import NLPAnalysis from './pages/NLPAnalysis'
import NetworkAnalysis from './pages/NetworkAnalysis'
import ComingSoon from './components/ComingSoon'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  function renderContent() {
    if (activePage === 'health')    return <HealthCheck />
    if (activePage === 'dashboard') return <Dashboard />
    if (activePage === 'dataset')   return <DatasetExplorer />
    if (activePage === 'behaviour') return <BehaviourAnalytics />
    if (activePage === 'ml')        return <MLAnalysis />
    if (activePage === 'nlp')       return <NLPAnalysis />
    if (activePage === 'network')   return <NetworkAnalysis />
    if (activePage === 'investigate') return (
      <div>
        <div className="page-header">
          <h1>Account Investigation</h1>
          <p>Deep-dive bot prediction and behaviour breakdown for individual accounts.</p>
        </div>
        <ComingSoon title="Account Investigation" description="Account-level bot prediction and behaviour breakdown." phase={7} />
      </div>
    )
    return null
  }

  return (
    <div className="page-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content" id="main-content">
        {renderContent()}
      </main>
    </div>
  )
}
