import React from 'react'
import {
  LayoutDashboard, Database, ShieldAlert,
  MessageSquare, Activity, Network, Cpu,
  Eye, Image, Video, HardDrive, PanelLeftClose, PanelLeft
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    title: 'Core Telemetry',
    items: [
      { id: 'dashboard',   label: 'Threat Overview',       icon: LayoutDashboard },
      { id: 'dataset',     label: 'Dataset Explorer',      icon: Database },
      { id: 'investigate', label: 'Account Dossier',       icon: ShieldAlert, tag: 'Triage' },
    ]
  },
  {
    title: 'Behavioral & Linguistic',
    items: [
      { id: 'nlp',         label: 'Sentiment & NLP',       icon: MessageSquare },
      { id: 'behaviour',   label: 'Behavior Dynamics',     icon: Activity },
      { id: 'network',     label: 'Graph Topology',        icon: Network },
      { id: 'ml',          label: 'Predictive Models',     icon: Cpu, tag: 'RF 89%' },
    ]
  },
  {
    title: 'Multimedia Surveillance',
    items: [
      { id: 'object-detect', label: 'Object Tracking',     icon: Eye, tag: 'YOLO' },
      { id: 'cbir',          label: 'Visual Clone Search', icon: Image, tag: 'FAISS' },
      { id: 'video-ir',      label: 'Video Forensics',     icon: Video },
    ]
  }
]

export default function Sidebar({ activePage, onNavigate, collapsed = false, onToggleCollapse }) {
  return (
    <aside
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label="Main Navigation"
    >
      {/* Sidebar Header & Collapse Toggle */}
      <div className="sidebar__header">
        {!collapsed && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)'
          }}>
            Navigation
          </span>
        )}
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="sidebar__section">
            <div className="sidebar__section-title">
              {section.title}
            </div>
            <div className="sidebar__section-items">
              {section.items.map(({ id, label, icon: Icon, tag }) => {
                const isActive = activePage === id
                return (
                  <button
                    key={id}
                    id={`nav-${id}`}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={() => onNavigate(id)}
                    data-tooltip={label}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? label : undefined}
                  >
                    <span className="nav-item__icon">
                      <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                    </span>
                    <span className="nav-item__label">{label}</span>
                    {tag && <span className="nav-item__tag">{tag}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Telemetry link at footer */}
      <div className="sidebar__footer">
        <button
          id="nav-health"
          onClick={() => onNavigate('health')}
          className={`nav-item${activePage === 'health' ? ' active' : ''}`}
          data-tooltip="Infrastructure Telemetry"
          style={{ justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '10px 0' : '8px 10px' }}
          title={collapsed ? "Infrastructure Health" : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HardDrive size={15} style={{ color: activePage === 'health' ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
            {!collapsed && <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>System Health</span>}
          </div>
          {!collapsed && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-success)',
              boxShadow: '0 0 6px var(--color-success)'
            }} />
          )}
        </button>
      </div>
    </aside>
  )
}
