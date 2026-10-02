import { Check, CheckCircle2, CircleAlert, LoaderCircle, MapPin, Sparkles } from 'lucide-react'
import Button from './Button.jsx'

export default function AIAnalysis({
  status,
  fields,
  errors,
  onChange,
  onRetry,
  onManual,
  onUseLocation,
  locating = false,
  locationError = '',
}) {
  if (status === 'loading') {
    return (
      <div className="analysis-loading">
        <div className="analysis-loading__top">
          <span className="ai-orb"><Sparkles size={18} /></span>
          <div>
            <strong>Understanding your post...</strong>
            <span>Turning the messy bits into useful structure.</span>
          </div>
          <LoaderCircle size={20} className="spin" />
        </div>
        <div className="analysis-steps">
          <span><Check size={14} /> Category</span>
          <span><Check size={14} /> Location</span>
          <span className="is-loading"><LoaderCircle size={14} className="spin" /> Urgency</span>
          <span className="is-loading"><LoaderCircle size={14} className="spin" /> Tags</span>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="analysis-error">
        <CircleAlert size={22} />
        <div>
          <strong>We couldn't analyze this automatically.</strong>
          <p>You can continue manually and keep control of the final post.</p>
        </div>
        <Button variant="secondary" small onClick={onRetry}>Retry</Button>
        <Button variant="secondary" small onClick={onManual}>Continue manually</Button>
      </div>
    )
  }

  if (status !== 'complete') return null

  const hasCoords = fields.latitude != null && fields.longitude != null &&
    Number.isFinite(Number(fields.latitude)) && Number.isFinite(Number(fields.longitude)) &&
    Number(fields.latitude) >= -90 && Number(fields.latitude) <= 90 &&
    Number(fields.longitude) >= -180 && Number(fields.longitude) <= 180

  return (
    <div className="ai-fields">
      <div className="workbench-label workbench-label--result">
        <span className="step-number step-number--lime">02</span>
        <div>
          <strong>Review the structured signal</strong>
          <span>AI suggested these fields. You are always in control.</span>
        </div>
        <span className="analysis-complete"><CheckCircle2 size={16} /> AI analysis complete</span>
      </div>
      <div className="structured-fields">
        {[
          ['title', 'Title', 'Give your signal a clear title'],
          ['category', 'Category', 'Select a category'],
          ['location', 'Location', 'Where is it?'],
          ['urgency', 'Urgency', 'Select urgency'],
          ['expiry', 'Suggested expiry', '48 hours'],
          ['tags', 'Tags', 'e.g. traffic, safety'],
        ].map(([key, label, placeholder]) => (
          <div key={key} className={`field ${['title', 'tags'].includes(key) ? 'field--wide' : ''}`}>
            <label htmlFor={`field-${key}`}>{label}</label>
            {key === 'category' ? (
              <select
                id={`field-${key}`}
                value={fields[key] || ''}
                onChange={(event) => onChange(key, event.target.value)}
              >
                <option value="">Select a category</option>
                <option>Internships & Scholarships</option>
                <option>Lost & Found</option>
                <option>Local Issues & Emergencies</option>
                <option>Events & Announcements</option>
              </select>
            ) : key === 'urgency' ? (
              <select
                id={`field-${key}`}
                value={fields[key] || ''}
                onChange={(event) => onChange(key, event.target.value)}
              >
                <option value="">Select urgency</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            ) : key === 'expiry' ? (
              <select
                id={`field-${key}`}
                value={fields[key] || '48 hours'}
                onChange={(event) => onChange(key, event.target.value)}
              >
                <option>4 hours</option>
                <option>24 hours</option>
                <option>48 hours</option>
                <option>5 days</option>
              </select>
            ) : key === 'location' ? (
              <div>
                <input
                  id={`field-${key}`}
                  value={fields[key] || ''}
                  onChange={(event) => onChange(key, event.target.value)}
                  placeholder={placeholder}
                />
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={onUseLocation}
                    disabled={locating}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--paper)',
                      color: 'var(--ink-soft)',
                      cursor: 'pointer',
                    }}
                  >
                    <MapPin size={13} /> {locating ? 'Locating...' : '📍 Use My Current Location'}
                  </button>
                  {hasCoords && (
                    <span style={{ fontSize: '11px', color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <Check size={13} /> Location captured
                    </span>
                  )}
                </div>
                {locationError && <span className="field-error" style={{ display: 'block', marginTop: '4px' }}>{locationError}</span>}
              </div>
            ) : (
              <input
                id={`field-${key}`}
                value={fields[key] || ''}
                onChange={(event) => onChange(key, event.target.value)}
                placeholder={placeholder}
              />
            )}
            {errors?.[key] && <span className="field-error">{errors[key]}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
