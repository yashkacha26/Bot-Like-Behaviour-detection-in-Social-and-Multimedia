import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts'

const DETECTIONS_DATA = [
  { frame: '00:01', trackId: 'TRK-101', label: 'Person', conf: 0.94, bbox: '[120, 45, 80, 190]', speed: '1.2 m/s', state: 'Active' },
  { frame: '00:01', trackId: 'TRK-102', label: 'Face / Avatar', conf: 0.98, bbox: '[135, 50, 40, 45]', speed: '1.2 m/s', state: 'Tracked' },
  { frame: '00:02', trackId: 'TRK-103', label: 'Display Screen', conf: 0.89, bbox: '[310, 110, 140, 95]', speed: '0.0 m/s', state: 'Static' },
  { frame: '00:03', trackId: 'TRK-104', label: 'Text Banner / Watermark', conf: 0.96, bbox: '[20, 20, 210, 35]', speed: '0.0 m/s', state: 'Static' },
  { frame: '00:04', trackId: 'TRK-101', label: 'Person', conf: 0.92, bbox: '[138, 48, 82, 192]', speed: '1.4 m/s', state: 'Active' },
  { frame: '00:05', trackId: 'TRK-105', label: 'Vehicle / Bot Asset', conf: 0.87, bbox: '[420, 180, 120, 70]', speed: '4.8 m/s', state: 'Tracked' },
]

const CLASS_DISTRIBUTION = [
  { name: 'Person', count: 428, color: '#6366f1' },
  { name: 'Face / Avatar', count: 362, color: '#22d3ee' },
  { name: 'Watermark / Text', count: 284, color: '#10b981' },
  { name: 'Screen Device', count: 195, color: '#f59e0b' },
  { name: 'Automated Graphic', count: 141, color: '#ef4444' },
]

const TRACKING_TRAJECTORY = [
  { time: 1, confidence: 94, trackPersistence: 12, velocity: 1.2 },
  { time: 2, confidence: 96, trackPersistence: 24, velocity: 1.3 },
  { time: 3, confidence: 91, trackPersistence: 36, velocity: 1.1 },
  { time: 4, confidence: 95, trackPersistence: 48, velocity: 1.4 },
  { time: 5, confidence: 89, trackPersistence: 60, velocity: 1.5 },
  { time: 6, confidence: 93, trackPersistence: 72, velocity: 1.2 },
  { time: 7, confidence: 97, trackPersistence: 84, velocity: 0.9 },
]

export default function ObjectDetectionTracking() {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [activeFrame, setActiveFrame] = useState('00:01')

  const filtered = selectedFilter === 'All' 
    ? DETECTIONS_DATA 
    : DETECTIONS_DATA.filter(d => d.label.toLowerCase().includes(selectedFilter.toLowerCase()))

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: 8 }}>Multimedia Analytics Module</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '4px 0' }}>Object Detection and Tracking</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Multi-target temporal object detection, deep SORT trajectory estimation, and automated visual asset surveillance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="stat-pill" style={{ background: 'var(--color-surface-2)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
            Model: <strong>YOLOv8x + DeepSORT</strong>
          </span>
          <span className="stat-pill" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.82rem', fontWeight: 600 }}>
            Inference: 28.4 FPS (Realtime)
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>1,410</div>
          <div className="stat-card__label">Total Visual Objects Detected</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Across monitored social video frames</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-accent)' }}>94.6%</div>
          <div className="stat-card__label">Mean Average Precision (mAP@50)</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>High-fidelity verification score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>98.2%</div>
          <div className="stat-card__label">Tracking Association Accuracy</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>MOTA (Multiple Object Tracking Acc)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>48.5 ms</div>
          <div className="stat-card__label">End-to-End Latency</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>TensorRT FP16 execution pipeline</div>
        </div>
      </div>

      {/* Visual Canvas Demo + Track Attributes */}
      <div className="ba-grid-2" style={{ marginBottom: 24 }}>
        {/* Interactive Simulated Video Frame Canvas */}
        <div className="card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-title">Video Frame Stream & Bounding Boxes</div>
              <div className="section-subtitle">Real-time object localization overlay</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['00:01', '00:02', '00:03', '00:04'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFrame(f)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: 4,
                    background: activeFrame === f ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color: activeFrame === f ? '#fff' : 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  Frame {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            height: 280,
            background: 'radial-gradient(ellipse at center, #1e293b 0%, #090d16 100%)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Grid guideline overlays */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            {/* Simulated Bounding Box 1 (Person) */}
            <div style={{
              position: 'absolute',
              left: '20%',
              top: '18%',
              width: '120px',
              height: '190px',
              border: '2px solid #6366f1',
              background: 'rgba(99, 102, 241, 0.12)',
              borderRadius: 3,
            }}>
              <span style={{ position: 'absolute', top: -20, left: 0, background: '#6366f1', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 2 }}>
                TRK-101: Person 94%
              </span>
            </div>

            {/* Simulated Bounding Box 2 (Face/Avatar) */}
            <div style={{
              position: 'absolute',
              left: '23%',
              top: '22%',
              width: '55px',
              height: '55px',
              border: '2px solid #22d3ee',
              background: 'rgba(34, 211, 238, 0.15)',
              borderRadius: 3,
            }}>
              <span style={{ position: 'absolute', top: -18, left: 0, background: '#22d3ee', color: '#000', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: 2 }}>
                TRK-102: Face 98%
              </span>
            </div>

            {/* Simulated Bounding Box 3 (Watermark / Automated Bot graphic) */}
            <div style={{
              position: 'absolute',
              right: '15%',
              bottom: '24%',
              width: '180px',
              height: '60px',
              border: '2px dashed #ef4444',
              background: 'rgba(239, 68, 68, 0.12)',
              borderRadius: 3,
            }}>
              <span style={{ position: 'absolute', top: -20, left: 0, background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 2 }}>
                TRK-104: Bot Watermark 96%
              </span>
            </div>

            <div style={{ position: 'absolute', bottom: 12, left: 16, fontSize: '0.75rem', color: '#94a3b8' }}>
              Resolution: 1920x1080 &nbsp;|&nbsp; Stream ID: live_feed_social_09 &nbsp;|&nbsp; Bounding Boxes: 3 active
            </div>
          </div>
        </div>

        {/* Class Breakdown Pie */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Object Class Distribution</div>
            <div className="section-subtitle">Categorization of detected entities</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={CLASS_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                dataKey="count"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#64748b' }}
              >
                {CLASS_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#111827', borderColor: 'var(--color-border)', borderRadius: 6, fontSize: '0.8rem' }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trajectory & Persistence Line Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">Multi-Object Tracking Persistence & Confidence Timeline</div>
          <div className="section-subtitle">Kalman Filter trajectory smoothing and ID consistency across continuous frames</div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={TRACKING_TRAJECTORY} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `Frame ${v}`} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#111827', borderColor: 'var(--color-border)', borderRadius: 6, fontSize: '0.8rem' }} />
            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
            <Bar dataKey="confidence" fill="#6366f1" name="Confidence Score (%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="trackPersistence" fill="#22d3ee" name="Trajectory Lifetime (Frames)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detection Registry Table */}
      <div className="card">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="section-title">Verified Detection Records</div>
            <div className="section-subtitle">Real-time object coordinates and tracking states</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['All', 'Person', 'Face', 'Screen', 'Watermark'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  background: selectedFilter === filter ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-2)',
                  color: selectedFilter === filter ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  border: selectedFilter === filter ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Tracking ID</th>
                <th style={{ padding: '10px 12px' }}>Object Class</th>
                <th style={{ padding: '10px 12px' }}>Confidence</th>
                <th style={{ padding: '10px 12px' }}>Bounding Box [x, y, w, h]</th>
                <th style={{ padding: '10px 12px' }}>Estimated Velocity</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{item.frame}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-primary)' }}>{item.trackId}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, background: 'var(--color-surface-2)', fontSize: '0.78rem' }}>
                      {item.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: item.conf > 0.9 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {(item.conf * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#94a3b8' }}>{item.bbox}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{item.speed}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: item.state === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                      color: item.state === 'Active' ? 'var(--color-success)' : 'var(--color-primary)',
                    }}>
                      {item.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
