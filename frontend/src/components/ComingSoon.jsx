import React from 'react'
import { Clock } from 'lucide-react'

export default function ComingSoon({ title, description, phase }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', color: 'var(--color-primary)'
      }}>
        <Clock size={28} />
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
        {title}
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', maxWidth: '480px', margin: '0 auto 16px', fontSize: '0.85rem' }}>
        {description}
      </p>
      <span className="badge badge-primary">Scheduled Deployment • Phase {phase}</span>
    </div>
  )
}
