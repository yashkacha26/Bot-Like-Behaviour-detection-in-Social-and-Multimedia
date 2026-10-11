import React from 'react'

const navSections = [
  {
    title: 'Core System',
    items: [
      { id: 'dashboard',   label: 'Overview & Status' },
      { id: 'dataset',     label: 'Dataset Explorer' },
      { id: 'investigate', label: 'Account Investigation' },
    ]
  },
  {
    title: 'Behavioral & Textual',
    items: [
      { id: 'nlp',         label: 'Sentiment & NLP Analysis', highlight: true },
      { id: 'behaviour',   label: 'Customer Behaviour Analytics', highlight: true },
      { id: 'network',     label: 'Network Graph Topology' },
      { id: 'ml',          label: 'Machine Learning Models' },
    ]
  },
  {
    title: 'Multimedia & Retrieval',
    items: [
      { id: 'object-detect', label: 'Object Detection & Tracking', highlight: true },
      { id: 'cbir',          label: 'Content-Based Image Retrieval', highlight: true },
      { id: 'video-ir',      label: 'Video Analysis & IR', highlight: true },
    ]
  }
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo" style={{ padding: '20px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)',
            boxShadow: '0 0 8px var(--color-success)'
          }} />
          <div className="sidebar__logo-title" style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.02em' }}>
            SMA Analytics
          </div>
        </div>
        <div className="sidebar__logo-subtitle" style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
          Completed Project v1.0 Production
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation" style={{ padding: '16px 10px', overflowY: 'auto', flex: 1 }}>
        {navSections.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-muted)',
              padding: '4px 10px 8px 10px',
            }}>
              {section.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {section.items.map(({ id, label, highlight }) => {
                const isActive = activePage === id
                return (
                  <button
                    key={id}
                    id={`nav-${id}`}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    onClick={() => onNavigate(id)}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 600 : 500,
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? '#fff' : (highlight ? 'var(--color-text)' : 'var(--color-text-muted)'),
                      border: 'none',
                      textAlign: 'left',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    <span>{label}</span>
                    {highlight && !isActive && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 999,
                        background: 'rgba(99,102,241,0.15)',
                        color: 'var(--color-accent)',
                      }}>
                        Core
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status footer */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <button
          id="nav-health"
          onClick={() => onNavigate('health')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activePage === 'health' ? 'var(--color-primary)' : 'var(--color-surface-2)',
            color: activePage === 'health' ? '#fff' : 'var(--color-text-muted)',
            fontSize: '0.78rem',
            fontWeight: 600,
            border: '1px solid var(--color-border)',
          }}
        >
          <span>System & DB Status</span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-success)',
          }} />
        </button>
      </div>
    </aside>
  )
}
