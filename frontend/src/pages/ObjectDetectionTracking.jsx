import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  Eye, Play, Pause, Download, Filter, CheckCircle2,
  AlertTriangle, Crosshair, Sparkles
} from 'lucide-react'

const FRAME_DATA = {
  '00:01': [
    { trackId: 'TRK-101', label: 'Person', conf: 0.94, bbox: { left: '18%', top: '16%', width: '110px', height: '180px' }, color: '#6366f1', speed: '1.2 m/s', state: 'Active' },
    { trackId: 'TRK-102', label: 'Face / Avatar', conf: 0.98, bbox: { left: '21%', top: '20%', width: '50px', height: '50px' }, color: '#06b6d4', speed: '1.2 m/s', state: 'Tracked' },
  ],
  '00:02': [
    { trackId: 'TRK-101', label: 'Person', conf: 0.93, bbox: { left: '22%', top: '16%', width: '112px', height: '182px' }, color: '#6366f1', speed: '1.3 m/s', state: 'Active' },
    { trackId: 'TRK-103', label: 'Display Screen', conf: 0.89, bbox: { left: '55%', top: '28%', width: '130px', height: '90px' }, color: '#f59e0b', speed: '0.0 m/s', state: 'Static' },
  ],
  '00:03': [
    { trackId: 'TRK-101', label: 'Person', conf: 0.91, bbox: { left: '26%', top: '17%', width: '110px', height: '180px' }, color: '#6366f1', speed: '1.4 m/s', state: 'Active' },
    { trackId: 'TRK-104', label: 'Watermark / Graphic', conf: 0.96, bbox: { left: '68%', top: '65%', width: '160px', height: '55px' }, color: '#f43f5e', speed: '0.0 m/s', state: 'Static' },
  ],
  '00:04': [
    { trackId: 'TRK-101', label: 'Person', conf: 0.95, bbox: { left: '30%', top: '16%', width: '114px', height: '184px' }, color: '#6366f1', speed: '1.4 m/s', state: 'Active' },
    { trackId: 'TRK-102', label: 'Face / Avatar', conf: 0.96, bbox: { left: '33%', top: '20%', width: '52px', height: '52px' }, color: '#06b6d4', speed: '1.4 m/s', state: 'Tracked' },
    { trackId: 'TRK-104', label: 'Watermark / Graphic', conf: 0.97, bbox: { left: '68%', top: '65%', width: '160px', height: '55px' }, color: '#f43f5e', speed: '0.0 m/s', state: 'Static' },
  ],
  '00:05': [
    { trackId: 'TRK-105', label: 'Automated Banner', conf: 0.92, bbox: { left: '15%', top: '70%', width: '190px', height: '60px' }, color: '#f43f5e', speed: '0.0 m/s', state: 'Static' },
    { trackId: 'TRK-103', label: 'Display Screen', conf: 0.91, bbox: { left: '52%', top: '26%', width: '135px', height: '95px' }, color: '#f59e0b', speed: '0.0 m/s', state: 'Static' },
  ]
}

const CLASS_DISTRIBUTION = [
  { name: 'Person', count: 428, color: '#6366f1' },
  { name: 'Face / Avatar', count: 362, color: '#06b6d4' },
  { name: 'Watermark / Graphic', count: 284, color: '#f43f5e' },
  { name: 'Screen Device', count: 195, color: '#f59e0b' },
  { name: 'Automated Banner', count: 141, color: '#10b981' },
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [highlightedTrack, setHighlightedTrack] = useState(null)

  const FRAMES = ['00:01', '00:02', '00:03', '00:04', '00:05']

  // Automated stream playback effect
  useEffect(() => {
    let timer
    if (isStreaming) {
      timer = setInterval(() => {
        setActiveFrame(prev => {
          const idx = FRAMES.indexOf(prev)
          const nextIdx = (idx + 1) % FRAMES.length
          return FRAMES[nextIdx]
        })
      }, 1600)
    }
    return () => clearInterval(timer)
  }, [isStreaming])

  const activeObjects = FRAME_DATA[activeFrame] || []
  const visibleBoxes = selectedFilter === 'All'
    ? activeObjects
    : activeObjects.filter(o => o.label.toLowerCase().includes(selectedFilter.toLowerCase()))

  // Flattened records for all frames for table
  const allRecords = Object.entries(FRAME_DATA).flatMap(([frame, items]) =>
    items.map(item => ({ ...item, frame }))
  )

  const filteredRecords = selectedFilter === 'All'
    ? allRecords
    : allRecords.filter(r => r.label.toLowerCase().includes(selectedFilter.toLowerCase()))

  const handleExportAnnotations = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(FRAME_DATA, null, 2))
    const dl = document.createElement('a')
    dl.setAttribute("href", dataStr)
    dl.setAttribute("download", `yolov8-detections-telemetry-${activeFrame.replace(':', '')}.json`)
    dl.click()
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="page-header__kicker">
            <span className="badge badge-success">Computer Vision</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>YOLOV8x + DEEPSORT</span>
          </div>
          <h1>Real-Time Object Detection &amp; Spatial Tracking</h1>
          <p>
            Automated multi-target localization, DeepSORT Kalman trajectory estimation, bounding box persistence, and synthetic asset tagging.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="telemetry-indicator">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>Inference: <strong>28.4 FPS</strong></span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleExportAnnotations} title="Export Detections JSON">
            <Download size={13} />
            Export Annotations
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card card--accent-primary">
          <div className="stat-card__label">Visual Objects Detected</div>
          <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>1,410</div>
          <div className="stat-card__sub">Monitored social media video frames</div>
        </div>
        <div className="stat-card card--accent-cyan">
          <div className="stat-card__label">Mean Average Precision</div>
          <div className="stat-card__value" style={{ color: 'var(--color-accent)' }}>94.6%</div>
          <div className="stat-card__sub">mAP@50 high-fidelity score</div>
        </div>
        <div className="stat-card card--accent-success">
          <div className="stat-card__label">Tracking Association Acc</div>
          <div className="stat-card__value" style={{ color: 'var(--color-success)' }}>98.2%</div>
          <div className="stat-card__sub">MOTA trajectory persistence</div>
        </div>
        <div className="stat-card card--accent-warning">
          <div className="stat-card__label">End-to-End Latency</div>
          <div className="stat-card__value" style={{ color: 'var(--color-warning)' }}>48.5 ms</div>
          <div className="stat-card__sub">TensorRT FP16 execution pipeline</div>
        </div>
      </div>

      {/* Visual Canvas Demo + Track Attributes */}
      <div className="ba-grid-2" style={{ marginBottom: 24 }}>
        {/* Interactive Video Frame Canvas */}
        <div className="card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-title">Video Frame Stream &amp; Bounding Boxes</div>
              <div className="section-subtitle">Real-time object localization overlay for Frame {activeFrame}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className={`btn btn-sm ${isStreaming ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => setIsStreaming(!isStreaming)}
                title={isStreaming ? "Pause stream" : "Play stream automatically"}
              >
                {isStreaming ? <Pause size={13} /> : <Play size={13} />}
                {isStreaming ? 'Pause' : 'Stream Live'}
              </button>
              {FRAMES.map(f => (
                <button
                  key={f}
                  onClick={() => { setActiveFrame(f); setIsStreaming(false) }}
                  className={`tab-btn${activeFrame === f ? ' active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            height: 280,
            background: 'radial-gradient(ellipse at center, #131d31 0%, #080c14 100%)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}>
            {/* Grid guideline overlays */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.12,
              backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />

            {/* Dynamically rendered bounding boxes based on activeFrame */}
            {visibleBoxes.map((box) => {
              const isHl = highlightedTrack === box.trackId
              return (
                <div
                  key={box.trackId}
                  onClick={() => setHighlightedTrack(isHl ? null : box.trackId)}
                  style={{
                    position: 'absolute',
                    left: box.bbox.left,
                    top: box.bbox.top,
                    width: box.bbox.width,
                    height: box.bbox.height,
                    border: `2px solid ${box.color}`,
                    background: `${box.color}18`,
                    borderRadius: 3,
                    boxShadow: isHl ? `0 0 16px ${box.color}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: -20,
                    left: -2,
                    background: box.color,
                    color: box.color === '#06b6d4' ? '#000' : '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: 2,
                    whiteSpace: 'nowrap',
                  }}>
                    {box.trackId}: {box.label} {(box.conf * 100).toFixed(0)}%
                  </span>
                </div>
              )
            })}

            <div style={{
              position: 'absolute', bottom: 10, left: 14, right: 14,
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)'
            }}>
              <span>1920x1080 @ 28.4 FPS | Frame: {activeFrame}</span>
              <span>Active Detections: {visibleBoxes.length}</span>
            </div>
          </div>
        </div>

        {/* Class Breakdown Pie */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Object Class Breakdown</div>
              <div className="section-subtitle">Categorization of detected entities across video corpus</div>
            </div>
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
                contentStyle={{ background: '#0f172a', borderColor: 'var(--color-border)', borderRadius: 6, fontSize: '0.8rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trajectory & Persistence Line Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Multi-Object Tracking Persistence &amp; Confidence Timeline</div>
            <div className="section-subtitle">Kalman Filter trajectory smoothing and ID consistency across continuous frames</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={TRACKING_TRAJECTORY} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `Frame ${v}`} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--color-border)', borderRadius: 6, fontSize: '0.8rem' }} />
            <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
            <Bar dataKey="confidence" fill="#6366f1" name="Confidence Score (%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="trackPersistence" fill="#06b6d4" name="Trajectory Lifetime (Frames)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detection Registry Table */}
      <div className="card">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="section-title">Verified Detection Records</div>
            <div className="section-subtitle">Real-time object coordinates and tracking states across all frames</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Person', 'Face', 'Screen', 'Watermark'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`tab-btn${selectedFilter === filter ? ' active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Frame</th>
                <th>Tracking ID</th>
                <th>Object Class</th>
                <th>Confidence</th>
                <th>Estimated Speed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item, idx) => {
                const isSelected = highlightedTrack === item.trackId
                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      setActiveFrame(item.frame)
                      setHighlightedTrack(item.trackId)
                    }}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                    }}
                  >
                    <td className="mono-val" style={{ color: 'var(--color-text-dim)' }}>{item.frame}</td>
                    <td className="mono-val" style={{ color: item.color, fontWeight: 700 }}>
                      {item.trackId}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.74rem' }}>
                        {item.label}
                      </span>
                    </td>
                    <td className="mono-val" style={{ color: item.conf > 0.9 ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700 }}>
                      {(item.conf * 100).toFixed(1)}%
                    </td>
                    <td className="mono-val">{item.speed}</td>
                    <td>
                      <span className={`label-badge label-badge--${item.state === 'Active' ? 'human' : 'bot'}`}>
                        {item.state}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
