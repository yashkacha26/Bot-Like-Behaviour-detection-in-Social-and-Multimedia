import React, { useState } from 'react'
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

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  function renderContent() {
    if (activePage === 'health')         return <HealthCheck />
    if (activePage === 'dashboard')      return <Dashboard onNavigate={setActivePage} />
    if (activePage === 'dataset')        return <DatasetExplorer />
    if (activePage === 'behaviour')      return <BehaviourAnalytics />
    if (activePage === 'nlp')            return <NLPAnalysis />
    if (activePage === 'network')        return <NetworkAnalysis />
    if (activePage === 'ml')             return <MLAnalysis />
    if (activePage === 'investigate')    return <AccountInvestigation />
    if (activePage === 'object-detect')  return <ObjectDetectionTracking />
    if (activePage === 'cbir')           return <CBIRAnalysis />
    if (activePage === 'video-ir')       return <VideoContentIRAnalysis />
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
