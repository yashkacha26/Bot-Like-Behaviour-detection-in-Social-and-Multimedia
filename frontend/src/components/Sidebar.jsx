import React from 'react'
import {
  LayoutDashboard,
  Database,
  BarChart2,
  MessageSquare,
  Network,
  BrainCircuit,
  Search,
  HeartPulse,
} from 'lucide-react'

const navItems = [
  { id: 'dashboard',   label: 'Dashboard',            icon: LayoutDashboard },
  { id: 'dataset',     label: 'Dataset Explorer',     icon: Database },
  { id: 'behaviour',   label: 'Behaviour Analytics',  icon: BarChart2 },
  { id: 'nlp',         label: 'NLP Analysis',         icon: MessageSquare },
  { id: 'network',     label: 'Network Analysis',     icon: Network },
  { id: 'ml',          label: 'ML Analysis',          icon: BrainCircuit },
  { id: 'investigate', label: 'Account Investigation',icon: Search },
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-title">Bot Detection</div>
        <div className="sidebar__logo-subtitle">SMA Analytics v0.3</div>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`nav-${id}`}
            className={`nav-item${activePage === id ? ' active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={activePage === id ? 'page' : undefined}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {/* Backend status shortcut at the bottom */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--color-border)' }}>
        <button
          id="nav-health"
          className={`nav-item${activePage === 'health' ? ' active' : ''}`}
          onClick={() => onNavigate('health')}
          style={{ width: '100%' }}
        >
          <HeartPulse size={16} aria-hidden="true" />
          Backend Status
        </button>
      </div>
    </aside>
  )
}
