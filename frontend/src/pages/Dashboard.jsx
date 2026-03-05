import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import { DISEASE_CONFIG } from '../data/data.js'
import { api } from '../api.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

// ── Mini Calendar ─────────────────────────────────────────────────────
function MiniCalendar({ records, selectedDate, onSelectDate }) {
  const today = new Date()
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(1)
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
  const dataDates = useMemo(() => new Set(records.map(r => (r.date || r.scanned_at || '').split(' ')[0]).filter(Boolean)), [records])
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const fmt = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  function nav(dir) {
    let m = month + dir, y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonth(m); setYear(y)
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between bg-forest-700 text-white px-4 py-3">
        <button onClick={() => nav(-1)} className="w-7 h-7 rounded-lg hover:bg-forest-600 flex items-center justify-center text-lg font-bold transition">‹</button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <button onClick={() => nav(1)} className="w-7 h-7 rounded-lg hover:bg-forest-600 flex items-center justify-center text-lg font-bold transition">›</button>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs text-gray-400 font-semibold py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />
            const dateStr = fmt(d)
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSelected = selectedDate === dateStr
            const hasData = dataDates.has(dateStr)
            return (
              <button key={dateStr} onClick={() => onSelectDate(isSelected ? null : dateStr)}
                className={`relative text-center text-xs py-1.5 rounded-lg transition-all duration-150 font-medium
                  ${isSelected ? 'bg-forest-700 text-white' : isToday ? 'text-forest-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                {d}
                {hasData && <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-forest-500'}`} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Disease Filter ────────────────────────────────────────────────────
function DiseaseFilter({ records, activeFilters, onToggle }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Object.entries(DISEASE_CONFIG).map(([key, cfg]) => {
        const count = records.reduce((a, r) => a + (parseInt(r[key]) || 0), 0)
        const active = activeFilters.has(key)
        return (
          <button key={key} onClick={() => onToggle(key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 w-full text-left ${active ? 'bg-gray-50' : 'opacity-50 hover:opacity-70'}`}>
            <div className="w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{ borderColor: cfg.color, background: active ? cfg.color : 'transparent' }}>
              {active && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
            </div>
            <span className="flex-1 font-medium text-gray-700 text-left">{cfg.emoji} {cfg.label}</span>
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Sidebar Content (shared between desktop + mobile drawer) ──────────
function SidebarContent({ records, filterScopeRecords, activeFilters, toggleFilter, selectedDate, setSelectedDate, tileType, setTileType, activeSessionBrgy }) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">📅 Scan Date</p>
        <MiniCalendar records={records} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">🔎 Filter Diseases</p>
        {activeSessionBrgy
          ? <p className="text-xs text-forest-600 font-medium mb-3">📍 {activeSessionBrgy}</p>
          : <p className="text-xs text-gray-400 mb-3">All locations</p>
        }
        <DiseaseFilter records={filterScopeRecords} activeFilters={activeFilters} onToggle={toggleFilter} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🗺 Map Style</p>
        <div className="flex flex-col gap-2">
          {[{ val: 'streets', lbl: 'OpenStreetMap' }, { val: 'satellite', lbl: 'Satellite' }].map(({ val, lbl }) => (
            <label key={val} className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-600 hover:text-forest-700 transition">
              <input type="radio" name="tile" value={val} checked={tileType === val} onChange={() => setTileType(val)} className="accent-forest-600 w-4 h-4" />
              {lbl}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── FitBounds ─────────────────────────────────────────────────────────
function FitBounds({ records }) {
  const map = useMap()
  useEffect(() => {
    if (records.length === 0) return
    const bounds = records.map(r => [parseFloat(r.lat), parseFloat(r.lng)])
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 })
  }, [records, map])
  return null
}

// ── Disease Map ───────────────────────────────────────────────────────
function DiseaseMap({ records, tileType, activeFilters }) {
  const center = records.length > 0
    ? [parseFloat(records[0].lat), parseFloat(records[0].lng)]
    : [15.5785, 120.975]
  const tileUrl = tileType === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  return (
    <MapContainer center={center} zoom={15} maxZoom={20} className="leaflet-container">
      <TileLayer url={tileUrl} attribution="© OpenStreetMap contributors" maxZoom={20} maxNativeZoom={19} />
      <FitBounds records={records} />
      {records.flatMap(r => {
        // One dot per disease per record — only show if disease is in activeFilters
        const diseases = [
          { key: 'healthy',  val: parseInt(r.healthy)  || 0 },
          { key: 'insect',   val: parseInt(r.insect)   || 0 },
          { key: 'leafspot', val: parseInt(r.leafspot) || 0 },
          { key: 'mosaic',   val: parseInt(r.mosaic)   || 0 },
          { key: 'wilt',     val: parseInt(r.wilt)     || 0 },
        ].filter(d => d.val > 0 && activeFilters.has(d.key))

        return diseases.map(({ key, val }) => {
          const cfg = DISEASE_CONFIG[key]
          if (!cfg) return null
          return (
            <CircleMarker key={`${r.id}-${key}`} center={[parseFloat(r.lat), parseFloat(r.lng)]} radius={8}
              pathOptions={{ fillColor: cfg.color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85 }}>
              <Popup>
                <div className="text-sm p-1 min-w-[160px]">
                  <div className="font-semibold mb-1" style={{ color: cfg.color }}>{cfg.emoji} {cfg.label} × {val}</div>
                  <div className="text-gray-500 text-xs mb-1">📍 {r.municipality || '—'}</div>
                  <div className="text-gray-400 text-xs">{r.date}</div>
                  <div className="text-gray-400 text-xs font-mono mt-1">{r.lat}, {r.lng}</div>
                </div>
              </Popup>
            </CircleMarker>
          )
        }).filter(Boolean)
      })}
    </MapContainer>
  )
}

// ── Municipality resolver via OpenCage ──────────────────────────────
const _geoCache = new Map()
const OPENCAGE_API_KEY = '1f23d0ee06aa411dbe030f586218d272'

async function fetchMunicipality(lat, lng) {
  const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`
  if (_geoCache.has(key)) return _geoCache.get(key)
  try {
    const query = `${lat},+${lng}`
    const url   = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&language=en&no_annotations=1`
    const r     = await fetch(url)
    const d     = await r.json()
    if (d.results && d.results.length > 0) {
      const comp = d.results[0].components
      const mun  = comp.city || comp.town || comp.municipality ||
                   comp.county || comp.state_district || 'Unknown'
      _geoCache.set(key, mun)
      return mun
    }
    return 'Unknown'
  } catch { return 'Unknown' }
}

async function resolveAllMunicipalities(records, setRecords) {
  // Build map of unique rounded key → one representative coord
  const unique = new Map()
  records.forEach(r => {
    const key = `${parseFloat(r.lat).toFixed(2)},${parseFloat(r.lng).toFixed(2)}`
    if (!unique.has(key)) unique.set(key, { lat: r.lat, lng: r.lng })
  })

  // Fetch all unique coords — stagger by 300ms to avoid Nominatim ban
  const delay = (ms) => new Promise(res => setTimeout(res, ms))
  const entries = [...unique.entries()]
  for (let i = 0; i < entries.length; i++) {
    const [, { lat, lng }] = entries[i]
    await fetchMunicipality(lat, lng)
    if (i < entries.length - 1) await delay(300)
  }

  // Apply results to all records at once
  setRecords(prev => prev.map(r => {
    if (r.municipality) return r
    const key = `${parseFloat(r.lat).toFixed(2)},${parseFloat(r.lng).toFixed(2)}`
    const mun = _geoCache.get(key)
    return mun ? { ...r, municipality: mun } : r
  }))
}

// ── Record Modal ──────────────────────────────────────────────────────
function RecordModal({ record, onSave, onClose }) {
  const [form, setForm] = useState({
    date:     (record?.date || '').replace(' ', 'T'),
    lat:      record?.lat  || '',
    lng:      record?.lng  || '',
    healthy:  parseInt(record?.healthy)  || 0,
    insect:   parseInt(record?.insect)   || 0,
    leafspot: parseInt(record?.leafspot) || 0,
    mosaic:   parseInt(record?.mosaic)   || 0,
    wilt:     parseInt(record?.wilt)     || 0,
  })
  const [munLoading, setMunLoading]     = useState(false)
  const [municipality, setMunicipality] = useState(record?.municipality || '')
  const [isSaving, setIsSaving]         = useState(false)
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setInt = (k, v) => setForm(f => ({ ...f, [k]: Math.max(0, parseInt(v) || 0) }))

  // Auto-fetch municipality when lat/lng changes
  useEffect(() => {
    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (isNaN(lat) || isNaN(lng) || lat < 14 || lat > 18 || lng < 119 || lng > 123) return
    setMunLoading(true)
    const t = setTimeout(async () => {
      const mun = await fetchMunicipality(lat, lng)
      setMunicipality(mun)
      setMunLoading(false)
    }, 700)
    return () => clearTimeout(t)
  }, [form.lat, form.lng])

  async function handleSave() {
    if (!form.date || !form.lat || !form.lng || isSaving) return
    setIsSaving(true)
    await onSave({
      ...form,
      date:         form.date.replace('T', ' '),
      municipality: municipality || record?.municipality || 'Nueva Ecija',
    })
    setIsSaving(false)
  }

  const DISEASE_FIELDS = [
    { key: 'healthy',  label: 'Healthy Leaf',       emoji: '🌱', color: 'text-green-600',  border: 'border-green-200',  bg: 'bg-green-50'  },
    { key: 'insect',   label: 'Insect Pest',         emoji: '🐛', color: 'text-red-600',    border: 'border-red-200',    bg: 'bg-red-50'    },
    { key: 'leafspot', label: 'Leaf Spot Disease',   emoji: '🟠', color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50' },
    { key: 'mosaic',   label: 'Mosaic Virus',        emoji: '🟡', color: 'text-yellow-600', border: 'border-yellow-200', bg: 'bg-yellow-50' },
    { key: 'wilt',     label: 'Wilt Disease',        emoji: '🟣', color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-md shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
        <h3 className="font-display text-xl font-bold text-gray-900 mb-6">Edit Record</h3>
        <div className="space-y-4">

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date & Time</label>
            <input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-forest-500 bg-gray-50 transition" />
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Latitude</label>
              <input type="text" placeholder="e.g. 15.4866" value={form.lat} onChange={e => set('lat', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-forest-500 bg-gray-50 font-mono transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Longitude</label>
              <input type="text" placeholder="e.g. 120.964" value={form.lng} onChange={e => set('lng', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-forest-500 bg-gray-50 font-mono transition" />
            </div>
          </div>

          {/* Municipality */}
          <div className={`rounded-xl px-4 py-3 border text-sm ${munLoading ? 'bg-blue-50 border-blue-100' : municipality ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">📍 Municipality</p>
            {munLoading ? (
              <div className="flex items-center gap-2 text-blue-600 text-xs">
                <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                Detecting municipality...
              </div>
            ) : municipality ? (
              <p className="font-semibold text-gray-800 text-sm">{municipality}</p>
            ) : (
              <p className="text-gray-400 text-xs">Enter coordinates to detect</p>
            )}
          </div>

          {/* Disease Counts */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Detection Counts</label>
            <div className="space-y-2">
              {DISEASE_FIELDS.map(({ key, label, emoji, color, border, bg }) => (
                <div key={key} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${border} ${bg}`}>
                  <span className="text-base">{emoji}</span>
                  <span className={`flex-1 text-sm font-medium ${color}`}>{label}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setInt(key, form[key] - 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-100 transition flex items-center justify-center">−</button>
                    <input type="number" min="0" value={form[key]} onChange={e => setInt(key, e.target.value)}
                      className={`w-14 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold ${color} bg-white focus:outline-none focus:border-forest-400`} />
                    <button onClick={() => setInt(key, form[key] + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-100 transition flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">
              Total: <span className="font-bold text-gray-600">{Object.values({healthy: form.healthy, insect: form.insect, leafspot: form.leafspot, mosaic: form.mosaic, wilt: form.wilt}).reduce((a, b) => a + b, 0)}</span> detections
            </p>
          </div>

        </div>
        <div className="flex gap-3 mt-7">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={isSaving}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 ${isSaving ? 'bg-forest-400 cursor-not-allowed' : 'bg-forest-700 hover:bg-forest-800'}`}>
            {isSaving ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
            ) : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────
export default function Dashboard({ records, setRecords, isLoggedIn, showToast }) {
  const [activeFilters, setActiveFilters] = useState(new Set(Object.keys(DISEASE_CONFIG)))
  const [pageSize, setPageSize]             = useState(50)
  const [currentPage, setCurrentPage]       = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [tileType, setTileType] = useState('streets')
  const [activeMapDate, setActiveMapDate] = useState(null)
  const [modalData, setModalData] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [timelineFilter, setTimelineFilter] = useState('all')

  // Auto-resolve municipalities for records missing them (e.g. from rover)
  useEffect(() => {
    const missing = records.filter(r => !r.municipality)
    if (missing.length > 0) resolveAllMunicipalities(records, setRecords)
  }, []) // eslint-disable-line

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // Close sidebar when opening map on mobile
  function openMap(date) {
    setActiveMapDate(date)
    setSidebarOpen(false)
  }

  function toggleFilter(key) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filtered = useMemo(() => {
    let r = records.filter(r => [...activeFilters].some(k => (parseInt(r[k]) || 0) > 0))
    if (selectedDate) r = r.filter(r => (r.date || r.scanned_at || '').startsWith(selectedDate))
    return r
  }, [records, activeFilters, selectedDate])

  const sessions = useMemo(() => {
    const normMun = (r) => {
      const m = (r.municipality || '').trim()
      if (!m || m === 'Unknown' || m === '') return '⏳ Pending'
      return m.replace(/^(City of |Municipality of )/i, '').trim()
    }

    // Group strictly by date + municipality — all same-mun same-date records merge into ONE session
    const byKey = {}
    filtered.forEach(r => {
      const date = (r.date || r.scanned_at || '').split(' ')[0]
      const mun  = normMun(r)
      const key  = `${date}||${mun}`
      if (!byKey[key]) byKey[key] = []
      byKey[key].push(r)
    })

    return Object.entries(byKey)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, recs]) => {
        const [date, municipality] = key.split('||')
        // Average lat/lng of all records in this session for the map center
        const avgLat = recs.reduce((s, r) => s + parseFloat(r.lat), 0) / recs.length
        const avgLng = recs.reduce((s, r) => s + parseFloat(r.lng), 0) / recs.length
        return [key, recs, date, municipality, avgLat, avgLng]
      })
  }, [filtered])

  const mapRecords = useMemo(() => {
    if (!activeMapDate) return []
    const [date, mun] = activeMapDate.split('||')
    return records.filter(r =>
      r.date.startsWith(date) &&
      (mun === '⏳ Pending' ? !r.municipality || r.municipality === 'Unknown' : (r.municipality || '') === mun) &&
      [...activeFilters].some(k => (parseInt(r[k]) || 0) > 0)
    )
  }, [activeMapDate, records, activeFilters])

  const activeSessionBrgy = activeMapDate ? activeMapDate.split('||')[1] || 'Selected Session' : null
  const activeSessionDate = activeMapDate ? activeMapDate.split('||')[0] : null

  useEffect(() => { setCurrentPage(1) }, [activeSessionBrgy, activeMapDate, selectedDate]) // eslint-disable-line

  const tableRecords = useMemo(() => {
    if (!activeSessionBrgy || !activeMapDate) return filtered
    return filtered.filter(r => r.date.startsWith(activeSessionDate) && (activeSessionBrgy === '⏳ Pending' ? !r.municipality || r.municipality === 'Unknown' : (r.municipality || '') === activeSessionBrgy))
  }, [filtered, activeSessionBrgy, activeMapDate])

  const filterScopeRecords = useMemo(() => {
    if (!activeSessionBrgy || !activeMapDate) return records
    return records.filter(r => r.date.startsWith(activeSessionDate) && (activeSessionBrgy === '⏳ Pending' ? !r.municipality || r.municipality === 'Unknown' : (r.municipality || '') === activeSessionBrgy))
  }, [records, activeSessionBrgy, activeMapDate])

  const pieData = useMemo(() => ({
    labels: Object.values(DISEASE_CONFIG).map(c => c.label),
    datasets: [{
      data: [
        filtered.reduce((a, r) => a + (parseInt(r.healthy)  || 0), 0),
        filtered.reduce((a, r) => a + (parseInt(r.insect)   || 0), 0),
        filtered.reduce((a, r) => a + (parseInt(r.leafspot) || 0), 0),
        filtered.reduce((a, r) => a + (parseInt(r.mosaic)   || 0), 0),
        filtered.reduce((a, r) => a + (parseInt(r.mold)     || 0), 0),
        filtered.reduce((a, r) => a + (parseInt(r.wilt)     || 0), 0),
      ],
      backgroundColor: Object.values(DISEASE_CONFIG).map(c => c.color),
      borderWidth: 2, borderColor: '#fff'
    }]
  }), [filtered])

  const { lineData, trendInfo } = useMemo(() => {
    const dates = [...new Set(filtered.map(r => r.date.split(' ')[0]))].sort()

    const COLORS = {
      all:      { border: '#15803d', bg: 'rgba(21,128,61,0.08)' },
      healthy:  { border: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
      insect:   { border: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
      leafspot: { border: '#f97316', bg: 'rgba(249,115,22,0.08)' },
      mosaic:   { border: '#eab308', bg: 'rgba(234,179,8,0.08)' },
      mold:     { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
      wilt:     { border: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
    }

    let datasets = []
    if (timelineFilter === 'all') {
      // Show all diseases as separate lines
      datasets = Object.entries(DISEASE_CONFIG).map(([key, cfg]) => {
        const data = dates.map(d => filtered.filter(r => r.date.startsWith(d)).reduce((a, r) => a + (parseInt(r[key]) || 0), 0))
        return {
          label: cfg.label,
          data,
          borderColor: COLORS[key]?.border || cfg.color,
          backgroundColor: COLORS[key]?.bg || 'rgba(0,0,0,0.05)',
          tension: 0.4, fill: false, pointRadius: 3,
          pointBackgroundColor: COLORS[key]?.border || cfg.color,
          borderWidth: 2,
        }
      })
    } else {
      // Single disease
      const cfg = DISEASE_CONFIG[timelineFilter]
      const data = dates.map(d => filtered.filter(r => r.date.startsWith(d)).reduce((a, r) => a + (parseInt(r[timelineFilter]) || 0), 0))
      datasets = [{
        label: cfg.label,
        data,
        borderColor: COLORS[timelineFilter]?.border || cfg.color,
        backgroundColor: COLORS[timelineFilter]?.bg || 'rgba(0,0,0,0.05)',
        tension: 0.4, fill: true, pointRadius: 4,
        pointBackgroundColor: COLORS[timelineFilter]?.border || cfg.color,
        borderWidth: 2.5,
      }]
    }

    // Trend: compare last 3 days vs previous 3 days
    const totalByDate = dates.map(d => {
      if (timelineFilter === 'all') return filtered.filter(r => r.date.startsWith(d)).reduce((a, r) => a + (parseInt(r.healthy)||0) + (parseInt(r.insect)||0) + (parseInt(r.leafspot)||0) + (parseInt(r.mosaic)||0) + (parseInt(r.wilt)||0), 0)
      return filtered.filter(r => r.date.startsWith(d)).reduce((a, r) => a + (parseInt(r[timelineFilter]) || 0), 0)
    })
    let trendInfo = { arrow: '→', label: 'Stable', color: 'text-gray-400' }
    if (totalByDate.length >= 2) {
      const recent = totalByDate.slice(-3).reduce((a, b) => a + b, 0)
      const prev   = totalByDate.slice(-6, -3).reduce((a, b) => a + b, 0)
      if (prev === 0 && recent > 0) {
        trendInfo = { arrow: '↑', label: 'Increasing', color: 'text-red-500' }
      } else if (prev > 0) {
        const pct = ((recent - prev) / prev) * 100
        if (pct > 10)       trendInfo = { arrow: '↑', label: `+${Math.round(pct)}%`, color: 'text-red-500' }
        else if (pct < -10) trendInfo = { arrow: '↓', label: `${Math.round(pct)}%`, color: 'text-green-600' }
        else                trendInfo = { arrow: '→', label: 'Stable', color: 'text-gray-400' }
      }
    }

    return {
      lineData: { labels: dates.map(d => d.slice(5)), datasets },
      trendInfo
    }
  }, [filtered, timelineFilter])

  async function handleSaveRecord(form) {
    if (editingId) {
      const updated = {
        date:         form.date,
        lat:          parseFloat(form.lat),
        lng:          parseFloat(form.lng),
        municipality: form.municipality,
        healthy:      parseInt(form.healthy)  || 0,
        insect:       parseInt(form.insect)   || 0,
        leafspot:     parseInt(form.leafspot) || 0,
        mosaic:       parseInt(form.mosaic)   || 0,
        wilt:         parseInt(form.wilt)     || 0,
        is_edited:    1,
      }

      try {
        // 1. Save to DB FIRST — mark as edited so sync can never overwrite it
        await api.updateScan(editingId, {
          scanned_at:   updated.date,
          lat:          updated.lat,
          lng:          updated.lng,
          municipality: updated.municipality,
          healthy:      updated.healthy,
          insect:       updated.insect,
          leafspot:     updated.leafspot,
          mosaic:       updated.mosaic,
          wilt:         updated.wilt,
        })

        // 2. Update local state AFTER DB confirms — guaranteed to persist
        setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...updated } : r))
        setModalData(null)
        setEditingId(null)
        showToast('✅ Record updated')

      } catch (err) {
        console.error('Save to DB failed:', err)
        setModalData(null)
        setEditingId(null)
        showToast('❌ Failed to save: ' + err.message, 'error')
      }
    } else {
      setModalData(null)
      setEditingId(null)
    }
  }

  function handleDelete(id) {
    if (!confirm('Delete this record?')) return
    setRecords(prev => prev.filter(r => r.id !== id))
    showToast('🗑️ Record deleted')
  }

  const statsRecords = activeSessionBrgy ? tableRecords : filtered
  // Only count columns that are actively selected in the filter
  const healthy  = activeFilters.has('healthy')  ? statsRecords.reduce((a, r) => a + (parseInt(r.healthy)  || 0), 0) : 0
  const insect   = activeFilters.has('insect')   ? statsRecords.reduce((a, r) => a + (parseInt(r.insect)   || 0), 0) : 0
  const leafspot = activeFilters.has('leafspot') ? statsRecords.reduce((a, r) => a + (parseInt(r.leafspot) || 0), 0) : 0
  const mosaic   = activeFilters.has('mosaic')   ? statsRecords.reduce((a, r) => a + (parseInt(r.mosaic)   || 0), 0) : 0
  const wilt     = activeFilters.has('wilt')     ? statsRecords.reduce((a, r) => a + (parseInt(r.wilt)     || 0), 0) : 0
  const diseased = insect + leafspot + mosaic + wilt
  const totalSamples = healthy + diseased

  const sidebarProps = {
    records, filterScopeRecords, activeFilters,
    toggleFilter, selectedDate, setSelectedDate,
    tileType, setTileType, activeSessionBrgy
  }

  return (
    <div className="page-enter min-h-screen bg-gray-50">



      {/* Mobile top bar with filter button */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3 fixed top-16 left-0 right-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">📊</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 leading-tight">Dashboard</p>
            <p className="text-xs text-gray-400 truncate">
              {activeSessionBrgy ? `${activeSessionBrgy} · ${activeSessionDate}` : selectedDate ? selectedDate : 'All Locations · All Dates'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 bg-forest-700 hover:bg-forest-800 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 8h12M10 12h4" />
          </svg>
          Filters
          {(selectedDate || activeFilters.size < Object.keys(DISEASE_CONFIG).length) && (
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
          )}
        </button>
      </div>

      <div className="flex">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto flex-shrink-0">
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* ── Mobile sidebar drawer ── */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
            <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto"
              style={{ animation: 'slideInLeft 0.28s cubic-bezier(0.32,0.72,0,1) forwards' }}
              onClick={e => e.stopPropagation()}>
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <span className="font-display font-bold text-gray-900">Filters & Settings</span>
                <button onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                  ✕
                </button>
              </div>
              <SidebarContent {...sidebarProps} />
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 pt-16 lg:pt-0 p-3 sm:p-4 lg:p-6 overflow-x-hidden min-w-0">

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            {[
              { icon: '🌿', val: totalSamples,        lbl: 'Total Samples',    iconBg: 'bg-green-50' },
              { icon: '✅', val: healthy,              lbl: 'Healthy Plants',   iconBg: 'bg-green-50', color: 'text-green-600' },
              { icon: '⚠️', val: diseased,             lbl: 'Diseased Samples', iconBg: 'bg-red-50',   color: 'text-red-500' },
            ].map(({ icon, val, lbl, iconBg, color }) => (
              <div key={lbl} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${iconBg} flex items-center justify-center text-base sm:text-xl flex-shrink-0`}>{icon}</div>
                <div className="text-center sm:text-left">
                  <div className={`font-display text-2xl sm:text-3xl font-bold ${color || 'text-gray-900'}`}>{val}</div>
                  <div className="text-gray-400 text-[10px] sm:text-xs mt-0.5 leading-tight">{lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scan Sessions */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm mb-4 sm:mb-6 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800 text-sm sm:text-base">📍 Scan Sessions</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 sm:px-3 py-1 rounded-full font-medium">
                {selectedDate || 'All Dates'}
              </span>
            </div>

            {/* Session list */}
            {!activeMapDate && (
              <div>
                {sessions.length === 0 ? (
                  <div className="text-center py-14 text-gray-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-sm">No scan sessions for selected filters.</p>
                  </div>
                ) : sessions.map(([key, recs, date, municipality, sAvgLat, sAvgLng]) => {
                  const avgLat     = (sAvgLat || 0).toFixed(4)
                  const avgLng     = (sAvgLng || 0).toFixed(4)
                  const h = recs.reduce((a, r) => a + (parseInt(r.healthy) || 0), 0)
                  const d = recs.reduce((a, r) => a + (parseInt(r.insect) || 0) + (parseInt(r.leafspot) || 0) + (parseInt(r.mosaic) || 0) + (parseInt(r.wilt) || 0), 0)
                  const diseaseTypes = []
                  if (recs.some(r => parseInt(r.healthy)  > 0)) diseaseTypes.push('healthy')
                  if (recs.some(r => parseInt(r.insect)   > 0)) diseaseTypes.push('insect')
                  if (recs.some(r => parseInt(r.leafspot) > 0)) diseaseTypes.push('leafspot')
                  if (recs.some(r => parseInt(r.mosaic)   > 0)) diseaseTypes.push('mosaic')
                  if (recs.some(r => parseInt(r.wilt)     > 0)) diseaseTypes.push('wilt')
                  return (
                    <div key={key} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-forest-50 flex items-center justify-center text-base flex-shrink-0">📍</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                          {municipality}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-1.5 items-center">
                          <span>{date}</span>
                          <span>·</span>
                          <span>{h + d} samples</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline text-green-600">{h} healthy</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline text-red-500">{d} diseased</span>
                        </div>
                        <div className="hidden sm:flex gap-1 items-center mt-1">
                          {diseaseTypes.map(d => (
                            <div key={d} className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                              style={{ background: DISEASE_CONFIG[d]?.color }} title={DISEASE_CONFIG[d]?.label} />
                          ))}
                          <span className="text-gray-400 text-xs ml-1 font-mono">{avgLat}, {avgLng}</span>
                        </div>
                      </div>
                      <button onClick={() => openMap(key)}
                        className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all active:scale-95">
                        <span className="hidden sm:inline">🗺️</span> Map →
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Map view */}
            {activeMapDate && (
              <div>
                <div className="px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 sm:gap-3">
                  <button onClick={() => setActiveMapDate(null)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-forest-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition">
                    ← Back
                  </button>
                  <span className="font-semibold text-xs sm:text-sm text-gray-800 truncate">
                    🗺️ {activeSessionBrgy} · {activeSessionDate}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{mapRecords.length} samples</span>
                </div>
                <DiseaseMap records={mapRecords} tileType={tileType} activeFilters={activeFilters} />
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Disease Distribution</h3>
              <Doughnut data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10, padding: 6 } } } }} />
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
              {/* Header + trend */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Scan Timeline</h3>
                  <div className={`flex items-center gap-1 mt-0.5 text-xs font-semibold ${trendInfo.color}`}>
                    <span className="text-base leading-none">{trendInfo.arrow}</span>
                    <span>{trendInfo.label}</span>
                  </div>
                </div>
              </div>
              {/* Disease toggle buttons */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <button onClick={() => setTimelineFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                    timelineFilter === 'all'
                      ? 'bg-forest-700 text-white border-forest-700'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-forest-400'
                  }`}>
                  All
                </button>
                {Object.entries(DISEASE_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => setTimelineFilter(key)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                      timelineFilter === key
                        ? 'text-white border-transparent'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                    style={timelineFilter === key ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}>
                    {cfg.emoji} {cfg.label.split(' ')[0]}
                  </button>
                ))}
              </div>
              <Line data={lineData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: timelineFilter === 'all',
                    position: 'bottom',
                    labels: { font: { size: 9 }, boxWidth: 8, padding: 6, usePointStyle: true }
                  }
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
              }} />
            </div>
          </div>

          {/* Detection Records Table */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-20 lg:mb-0">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Detection Records</h3>
                {activeSessionBrgy && (
                  <p className="text-xs text-forest-600 mt-0.5">Filtered: {activeSessionBrgy} · {activeSessionDate}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {Math.min(currentPage * pageSize, tableRecords.length)} of {tableRecords.length}
                </span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:border-forest-400">
                  <option value={20}>20 / page</option>
                  <option value={30}>30 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                  <option value={99999}>All</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-4 sm:px-5 py-3">Date & Time</th>
                    <th className="text-left px-4 sm:px-5 py-3 hidden sm:table-cell">Location</th>
                    <th className="text-left px-4 sm:px-5 py-3 hidden sm:table-cell">Latitude</th>
                    <th className="text-left px-4 sm:px-5 py-3 hidden sm:table-cell">Longitude</th>
                    <th className="text-left px-4 sm:px-5 py-3">Detection</th>
                    {isLoggedIn && <th className="text-left px-4 sm:px-5 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {tableRecords.slice().reverse().slice((currentPage - 1) * pageSize, currentPage * pageSize).map(r => {
                    const diseaseCounts = [
                      { key: 'healthy',  count: parseInt(r.healthy)  || 0 },
                      { key: 'insect',   count: parseInt(r.insect)   || 0 },
                      { key: 'leafspot', count: parseInt(r.leafspot) || 0 },
                      { key: 'mosaic',   count: parseInt(r.mosaic)   || 0 },
                      { key: 'wilt',     count: parseInt(r.wilt)     || 0 },
                    ].filter(d => d.count > 0)
                    return (
                      <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 sm:px-5 py-3 text-gray-600 text-xs sm:text-sm">
                          <span className="hidden sm:inline whitespace-nowrap">{r.date}</span>
                          <span className="sm:hidden">
                            <div className="whitespace-nowrap">{r.date.split(' ')[0]}</div>
                            <div className="text-gray-400 text-[10px]">{r.date.split(' ')[1]}</div>
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3 hidden sm:table-cell">
                          <div className="font-medium text-gray-800 text-xs sm:text-sm">{r.municipality || <span className="text-orange-400 text-xs">⏳ Geocoding...</span>}</div>
                        </td>
                        <td className="px-4 sm:px-5 py-3 font-mono text-gray-500 text-xs hidden sm:table-cell">{r.lat}</td>
                        <td className="px-4 sm:px-5 py-3 font-mono text-gray-500 text-xs hidden sm:table-cell">{r.lng}</td>
                        <td className="px-4 sm:px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {diseaseCounts.map(({ key, count }) => {
                              const cfg = DISEASE_CONFIG[key]
                              return (
                                <span key={key} className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                  {cfg.emoji} {count}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        {isLoggedIn && (
                          <td className="px-4 sm:px-5 py-3">
                            <div className="flex gap-1.5 sm:gap-2">
                              <button onClick={() => { setEditingId(r.id); setModalData(r) }}
                                className="text-xs px-2 sm:px-3 py-1.5 rounded-lg border border-gray-200 hover:border-forest-400 hover:text-forest-700 transition">Edit</button>
                              <button onClick={() => handleDelete(r.id)}
                                className="text-xs px-2 sm:px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition">Del</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {tableRecords.length > pageSize && (
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-gray-100">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  ← Prev
                </button>
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {Math.ceil(tableRecords.length / pageSize)}
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(tableRecords.length / pageSize), p + 1))}
                  disabled={currentPage >= Math.ceil(tableRecords.length / pageSize)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Next →
                </button>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Record modal */}
      {modalData !== null && (
        <RecordModal record={modalData || null} onSave={handleSaveRecord} onClose={() => { setModalData(null); setEditingId(null) }} />
      )}
    </div>
  )
}