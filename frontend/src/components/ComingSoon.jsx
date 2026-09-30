import React from 'react'

/**
 * Placeholder component shown for pages not yet implemented.
 * Will be replaced in later phases.
 */
export default function ComingSoon({ title, description, phase }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔜</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
        {title}
      </h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px', maxWidth: '480px', margin: '0 auto 16px' }}>
        {description}
      </p>
      <span className="badge badge--loading">Coming in Phase {phase}</span>
    </div>
  )
}
