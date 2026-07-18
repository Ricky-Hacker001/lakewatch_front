import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import PinDropMap from '../components/PinDropMap'

const VIOLATION_TYPES = [
  'Illegal Dumping',
  'Construction Encroachment',
  'Industrial Sludge',
  'Other',
]

const STEPS = ['Photo', 'Location', 'Details', 'Review']

function StepDot({ idx, current }) {
  const done   = idx < current
  const active = idx === current
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 40 }}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={
          done   ? { background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff' }
        : active ? { background: 'rgba(34,197,94,0.12)', border: '2px solid #22c55e', color: '#22c55e' }
        :           { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#475569' }
        }
      >
        {done ? '✓' : idx + 1}
      </div>
      <span className="text-[10px] mt-1 hidden sm:block" style={{ color: active ? '#22c55e' : '#475569' }}>
        {STEPS[idx]}
      </span>
    </div>
  )
}

function ProgressBar({ step }) {
  if (step === -1) return null; // No progress bar on introduction landing step
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((_, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <StepDot idx={i} current={step} />
          {i < STEPS.length - 1 && (
            <div
              className="flex-1 h-px mx-2"
              style={{
                background: i < step ? '#22c55e' : 'rgba(255,255,255,0.07)',
                transition: 'background 0.3s'
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ReviewRow({ label, children }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-xs mb-1.5" style={{ color: '#64748b' }}>{label}</p>
      <div style={{ color: '#f0fdf4', fontSize: 14 }}>{children}</div>
    </div>
  )
}

export default function ReportPage() {
  const navigate = useNavigate()
  const [step,          setStep]         = useState(-1) // Default to -1 (intro panel)
  const [photo,         setPhoto]        = useState(null)
  const [photoPreview,  setPhotoPreview] = useState(null)
  const [locMode,       setLocMode]      = useState('gps')  // 'gps' | 'pin'
  const [lat,           setLat]          = useState(null)
  const [lng,           setLng]          = useState(null)
  const [gpsLoading,    setGpsLoading]   = useState(false)
  const [gpsError,      setGpsError]     = useState('')
  const [validationErr, setValidationErr]= useState('')
  const [violationType, setViolType]     = useState(VIOLATION_TYPES[0])
  const [description,   setDescription]  = useState('')
  const [submitting,    setSubmitting]   = useState(false)
  const [submitted,     setSubmitted]    = useState(null)
  const [submitError,   setSubmitError]  = useState('')

  useEffect(() => {
    const token = localStorage.getItem('lw_token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const fileRef = useRef()
  const dropRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    dropRef.current.style.borderColor = 'rgba(34,197,94,0.3)'
    handleFile(e.dataTransfer.files[0])
  }

  const getGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please drop a pin instead.')
      return
    }
    setGpsLoading(true)
    setGpsError('')
    setValidationErr('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setGpsLoading(false)
      },
      ()  => {
        setGpsError('Could not auto-detect location. Please use "Drop a Pin" tab instead.')
        setGpsLoading(false)
      },
      { timeout: 10000 },
    )
  }

  const handleNextStep = () => {
    setValidationErr('')
    
    if (step === 1) {
      // Validate location
      if (lat == null || lng == null) {
        setValidationErr('⚠️ Coordinate lock required. Please capture your GPS coordinates or click on the map to drop a pin.')
        return
      }
    }
    
    if (step === 2) {
      // Validate description
      if (!description || description.trim().length < 10) {
        setValidationErr('⚠️ Please provide a detailed description of the incident (minimum 10 characters).')
        return
      }
    }

    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const fd = new FormData()
      fd.append('latitude',       lat)
      fd.append('longitude',      lng)
      fd.append('violation_type', violationType)
      fd.append('description',    description)
      if (photo) fd.append('photo', photo)
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/reports`, fd);
      setSubmitted(data)
    } catch {
      setSubmitError('Submission failed. Please check your network and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep(-1)
    setPhoto(null)
    setPhotoPreview(null)
    setLat(null)
    setLng(null)
    setGpsError('')
    setValidationErr('')
    setViolType(VIOLATION_TYPES[0])
    setDescription('')
    setSubmitted(null)
    setSubmitError('')
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-animated min-h-[90vh] flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center animate-slide-up shadow-2xl">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)' }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold gradient-text mb-2">Report Submitted!</h2>
          <p className="text-xs mb-6 text-slate-400">
            Thank you for helping protect Anekal's lakes. Your submission has been flagged and recorded.
          </p>

          <div className="rounded-xl p-5 mb-6 text-left" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-[10px] mb-1" style={{ color: '#64748b' }}>Report ID for your tracking</p>
            <p className="text-xl font-mono font-bold text-emerald-400">{submitted.id}</p>
            {submitted.buffer_zone_flag === 1 && (
              <p className="text-xs font-semibold text-orange-400 mt-2">
                ⚠️ Automatically Flagged: Lake Buffer Zone Violation
              </p>
            )}
            <p className="text-[10px] mt-3" style={{ color: '#64748b' }}>
              {submitted.violation_type} · {new Date(submitted.timestamp).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }}>View Map</Link>
            <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }} onClick={resetForm}>
              New Report
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-animated min-h-[90vh] py-10 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full">

        {/* ── Step -1: Introduction & How It Works ────────────────────────── */}
        {step === -1 && (
          <div className="glass-card p-8 animate-slide-up shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold gradient-text mb-3">🌿 LakeWatch Anekal</h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Empowering communities to monitor and protect Anekal and Chandapura lakes from illegal dumping and buffer zone encroachment.
              </p>
            </div>

            {/* How it works Visual Grid */}
            <div className="my-8 pt-4 border-t border-slate-800/40">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-6">How it works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg mb-3">
                    📝
                  </div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1">1. Report</h4>
                  <p className="text-[11px] text-slate-500">Citizens drop location coordinates & attach photos.</p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-xl bg-orange-950/40 border border-orange-500/20 text-orange-400 flex items-center justify-center text-lg mb-3">
                    📡
                  </div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1">2. Auto-Flag</h4>
                  <p className="text-[11px] text-slate-500">System runs geofence check against 100m lake buffers.</p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 flex items-center justify-center text-lg mb-3">
                    🚨
                  </div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1">3. Escalate</h4>
                  <p className="text-[11px] text-slate-500">Reports confirmed by 3+ upvotes escalate to authorities.</p>
                </div>

              </div>
            </div>

            <button
              onClick={() => setStep(0)}
              className="btn-primary w-full py-3 flex items-center justify-center gap-1.5 font-bold text-sm"
            >
              Start Reporting Form →
            </button>
          </div>
        )}

        {/* ── Form Steps ─────────────────────────────────────────────────── */}
        {step >= 0 && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold gradient-text mb-1">Report Incident</h1>
              <p className="text-xs" style={{ color: '#64748b' }}>
                SDG 15: Life on Land · Citizen Reporting
              </p>
            </div>

            <ProgressBar step={step} />

            {/* Validation Error Banner */}
            {validationErr && (
              <div
                className="rounded-xl p-3.5 mb-5 text-xs font-semibold border animate-fade-in text-center"
                style={{ background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)', color: '#fb923c' }}
              >
                {validationErr}
              </div>
            )}

            {/* ── Step 0: Photo ───────────────────────────────────────────── */}
            {step === 0 && (
              <div className="glass-card p-6 animate-slide-up shadow-xl">
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#f0fdf4' }}>Upload a Photo</h2>
                <p className="text-xs mb-5" style={{ color: '#64748b' }}>Attach photos showing the encroachment or dumping site (optional).</p>

                <div
                  ref={dropRef}
                  className="rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all duration-200 mb-4"
                  style={{
                    border: '2px dashed rgba(34,197,94,0.3)',
                    background: photoPreview ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.02)',
                    minHeight: 200,
                  }}
                  onClick={() => fileRef.current.click()}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); dropRef.current.style.borderColor = '#22c55e' }}
                  onDragLeave={() => { dropRef.current.style.borderColor = 'rgba(34,197,94,0.3)' }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="max-h-48 rounded-xl object-contain" />
                  ) : (
                    <>
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{ background: 'rgba(34,197,94,0.1)' }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                            stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="font-medium text-sm mb-1" style={{ color: '#f0fdf4' }}>Drop photo here or click to browse</p>
                      <p className="text-xs" style={{ color: '#475569' }}>JPEG · PNG · WebP up to 10 MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />

                {photoPreview && (
                  <button
                    className="text-xs mb-4 hover:text-red-400 transition-colors"
                    style={{ color: '#f87171' }}
                    onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  >
                    ✕ Remove photo
                  </button>
                )}

                <div className="flex justify-between items-center mt-6">
                  <button className="btn-secondary text-xs" style={{ padding: '8px 16px' }} onClick={() => setStep(-1)}>← Exit</button>
                  <button className="btn-primary" onClick={handleNextStep}>Next Step →</button>
                </div>
              </div>
            )}

            {/* ── Step 1: Location ────────────────────────────────────────── */}
            {step === 1 && (
              <div className="glass-card p-6 animate-slide-up shadow-xl">
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#f0fdf4' }}>Set Location</h2>
                <p className="text-xs mb-5" style={{ color: '#64748b' }}>Provide coordinates. Capture GPS locally, or drop a pin on the map.</p>

                <div
                  className="flex rounded-xl p-1 mb-5"
                  style={{ background: 'rgba(6,13,26,0.9)', border: '1px solid rgba(34,197,94,0.12)' }}
                >
                  {[
                    { id: 'gps', label: '📡 Capture GPS'   },
                    { id: 'pin', label: '📌 Drop a Pin'   },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                      style={locMode === id
                        ? { background: 'rgba(34,197,94,0.14)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                        : { color: '#64748b', border: '1px solid transparent' }
                      }
                      onClick={() => setLocMode(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {locMode === 'gps' && (
                  <div className="text-center py-6">
                    <button type="button" className="btn-primary mb-3" onClick={getGPS} disabled={gpsLoading}>
                      {gpsLoading ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Detecting…</>
                      ) : '📡 Detect Coordinates'}
                    </button>
                    {gpsError && <p className="text-xs mt-2" style={{ color: '#f87171' }}>{gpsError}</p>}
                    {lat != null && lng != null && (
                      <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <p className="text-[10px] mb-0.5" style={{ color: '#64748b' }}>Captured Location</p>
                        <p className="font-mono text-sm" style={{ color: '#22c55e' }}>{lat.toFixed(6)}, {lng.toFixed(6)}</p>
                      </div>
                    )}
                  </div>
                )}

                {locMode === 'pin' && (
                  <>
                    <p className="text-[11px] mb-3 text-slate-400">Click/tap on the map to drop the reporting pin:</p>
                    <PinDropMap lat={lat} lng={lng} onPinDrop={(la, lo) => { setLat(la); setLng(lo); setValidationErr('') }} />
                    {lat != null && lng != null && (
                      <div className="mt-3 rounded-xl p-2.5 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <p className="font-mono text-xs" style={{ color: '#22c55e' }}>{lat.toFixed(6)}, {lng.toFixed(6)}</p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between mt-6">
                  <button className="btn-secondary text-xs" style={{ padding: '8px 16px' }} onClick={() => setStep(0)}>← Back</button>
                  <button className="btn-primary" onClick={handleNextStep}>Next Step →</button>
                </div>
              </div>
            )}

            {/* ── Step 2: Details ─────────────────────────────────────────── */}
            {step === 2 && (
              <div className="glass-card p-6 animate-slide-up shadow-xl">
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#f0fdf4' }}>Violation Details</h2>
                <p className="text-xs mb-5" style={{ color: '#64748b' }}>Categorize and describe the incident.</p>

                <div className="mb-4">
                  <label className="block text-xs mb-2 font-medium" style={{ color: '#94a3b8' }}>
                    Violation Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="violation-type"
                    className="select-field"
                    value={violationType}
                    onChange={e => setViolType(e.target.value)}
                  >
                    {VIOLATION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-xs mb-2 font-medium" style={{ color: '#94a3b8' }}>
                    Description <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    id="description"
                    className="input-field resize-none text-sm font-sans"
                    rows={4}
                    placeholder="Provide a detailed description of the encroachment (minimum 10 characters)..."
                    value={description}
                    onChange={e => { setDescription(e.target.value); setValidationErr('') }}
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Describe scope, materials dumped, active machinery, or compound fences.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button className="btn-secondary text-xs" style={{ padding: '8px 16px' }} onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={handleNextStep}>Review Report →</button>
                </div>
              </div>
            )}

            {/* ── Step 3: Review & Submit ─────────────────────────────────── */}
            {step === 3 && (
              <div className="glass-card p-6 animate-slide-up shadow-xl">
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#f0fdf4' }}>Review & Submit</h2>
                <p className="text-xs mb-5" style={{ color: '#64748b' }}>Check the summary before transmitting.</p>

                <div className="space-y-3 mb-6">
                  <ReviewRow label="Evidence Attachment">
                    <div className="flex items-center gap-3">
                      {photoPreview
                        ? <img src={photoPreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: 'rgba(34,197,94,0.08)' }}>📷</div>
                      }
                      <span style={{ color: photo ? '#f0fdf4' : '#475569', fontSize: 13 }}>
                        {photo ? photo.name : 'No file attached'}
                      </span>
                    </div>
                  </ReviewRow>

                  <ReviewRow label="GPS Location Coordinates">
                    <span className="font-mono">{lat?.toFixed(6)}, {lng?.toFixed(6)}</span>
                  </ReviewRow>

                  <ReviewRow label="Violation Type">
                    {violationType}
                  </ReviewRow>

                  <ReviewRow label="Report Description">
                    <span style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{description}</span>
                  </ReviewRow>
                </div>

                {submitError && (
                  <p className="text-xs mb-4 text-center" style={{ color: '#f87171' }}>{submitError}</p>
                )}

                <div className="flex justify-between">
                  <button className="btn-secondary text-xs" style={{ padding: '8px 16px' }} onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                    ) : '🚀 Submit Report'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
