import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import HealthCheck from './pages/HealthCheck'
import DatasetExplorer from './pages/DatasetExplorer'
import ComingSoon from './components/ComingSoon'

const COMING_SOON = {
  dashboard:   { title: 'Dashboard',             description: 'Overview stats, bot/human charts, model performance.', phase: 6 },
  behaviour:   { title: 'Behaviour Analytics',   description: 'Bot vs human feature comparison and charts.', phase: 3 },
  nlp:         { title: 'NLP Analysis',          description: 'Sentiment analysis, TF-IDF, and word clouds.', phase: 5 },
  network:     { title: 'Network Analysis',      description: 'Graph metrics: degree, centrality, PageRank.', phase: 5 },
  ml:          { title: 'ML Analysis',           description: 'Logistic Regression, Decision Tree, Random Forest.', phase: 4 },
  investigate: { title: 'Account Investigation', description: 'Account-level bot prediction and behaviour breakdown.', phase: 7 },
}

export default function App() {
  // Default to dataset page for Phase 2 demo; health is still accessible via sidebar
  const [activePage, setActivePage] = useState('dataset')

  function renderContent() {
    if (activePage === 'health')  return <HealthCheck />
    if (activePage === 'dataset') return <DatasetExplorer />

    const page = COMING_SOON[activePage]
    if (!page) return null
    return (
      <div>
        <div className="page-header">
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <ComingSoon title={page.title} description={page.description} phase={page.phase} />
      </div>
    )
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
