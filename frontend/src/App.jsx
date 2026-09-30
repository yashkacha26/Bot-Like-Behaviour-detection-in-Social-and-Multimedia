import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import HealthCheck from './pages/HealthCheck'
import ComingSoon from './components/ComingSoon'

const PAGES = {
  dashboard:   { title: 'Dashboard',            description: 'Overview stats, bot/human charts, model performance.', phase: 6 },
  dataset:     { title: 'Dataset Explorer',     description: 'Dataset summary, rows, columns, class distribution, sample data.', phase: 2 },
  behaviour:   { title: 'Behaviour Analytics',  description: 'Bot vs human feature comparison and charts.', phase: 3 },
  nlp:         { title: 'NLP Analysis',         description: 'Sentiment analysis, TF-IDF, and word clouds.', phase: 5 },
  network:     { title: 'Network Analysis',     description: 'Graph metrics: degree, centrality, PageRank.', phase: 5 },
  ml:          { title: 'ML Analysis',          description: 'Logistic Regression, Decision Tree, Random Forest.', phase: 4 },
  investigate: { title: 'Account Investigation',description: 'Account-level bot prediction and behaviour breakdown.', phase: 7 },
}

export default function App() {
  // Phase 1 shows the health check as the landing page
  const [activePage, setActivePage] = useState('health')

  function renderContent() {
    if (activePage === 'health') return <HealthCheck />

    const page = PAGES[activePage]
    if (!page) return null
    return (
      <div style={{ padding: '0' }}>
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
