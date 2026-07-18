import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import axios from 'axios'
import StatusBadge from './StatusBadge'

// ── Colour + icon config per violation type ──────────────────────────────────
const TYPE_CONFIG = {
  'Illegal Dumping':           { color: '#ef4444', emoji: '🗑' },
  'Construction Encroachment': { color: '#f97316', emoji: '🏗' },
  'Industrial Sludge':         { color: '#a855f7', emoji: '⚗' },
  'Other':                     { color: '#6366f1', emoji: '⚠' },
}

const TARGET_COORDS = [12.716611, 77.685500] // 12°42'59.8"N 77°41'07.8"E

/** Custom teardrop DivIcon with an optional pulsing ring for "New" reports */
function makeIcon(type, status) {
  const { color, emoji } = TYPE_CONFIG[type] ?? TYPE_CONFIG['Other']
  const isNew = status === 'New'

  return L.divIcon({
    className: '',
    iconSize:   [40, 40],
    iconAnchor: [20, 40],
    popupAnchor:[0, -42],
    html: `
      <div style="position:relative;width:40px;height:40px">
        ${isNew ? `
          <div style="
            position:absolute;inset:-5px;border-radius:50%;
            background:${color}30;
            animation:lwPing 1.6s cubic-bezier(0,0,0.2,1) infinite;
          "></div>` : ''}
        <div style="
          width:38px;height:38px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${color};
          box-shadow:0 4px 14px ${color}66;
          border:2px solid rgba(255,255,255,0.25);
          position:relative;
        "></div>
        <div style="
          position:absolute;top:44%;left:50%;
          transform:translate(-50%,-50%);
          font-size:15px;line-height:1;
          pointer-events:none;
        ">${emoji}</div>
      </div>
    `,
  })
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** Automatically fits the map view to all report markers, target coordinates, and lake boundaries */
function FitBounds({ reports, lakes }) {
  const map = useMap()
  useEffect(() => {
    const points = reports.map(r => [r.latitude, r.longitude])
    points.push(TARGET_COORDS)
    
    lakes.forEach(lake => {
      try {
        const geojson = typeof lake.boundary_polygon === 'string' 
          ? JSON.parse(lake.boundary_polygon) 
          : lake.boundary_polygon
        const ring = geojson.coordinates[0]
        ring.forEach(coord => points.push([coord[1], coord[0]]))
      } catch (e) {
        console.error("Error parsing boundary points for FitBounds:", e)
      }
    })
    
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
  }, [reports, lakes, map])
  return null
}

function getLeafletCoords(geojsonString) {
  try {
    const geojson = typeof geojsonString === 'string' ? JSON.parse(geojsonString) : geojsonString
    const ring = geojson.coordinates[0]
    return ring.map(coord => [coord[1], coord[0]]) // Swap to [lat, lng] for Leaflet
  } catch (e) {
    console.error("Error parsing polygon coords:", e)
    return []
  }
}

export default function MapView({ reports = [], onReportClick, customPolygons = [] }) {
  const [lakes, setLakes] = useState([])

  useEffect(() => {
    const fetchLakes = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/lakes`);
        setLakes(data)
      } catch (err) {
        console.error('Failed to load lake overlays:', err)
      }
    }
    fetchLakes()
  }, [])

  return (
    <>
      {/* Inject ping keyframe once */}
      <style>{`
        @keyframes lwPing {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>

      <MapContainer
        center={TARGET_COORDS}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Lake Boundary (blue shape) at user coordinates */}
        <Circle
          center={TARGET_COORDS}
          radius={100}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.22,
            weight: 2
          }}
        >
          <Popup>
            <div className="font-bold text-xs text-blue-400">Lake Boundary (Full Tank Level)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Target Location: 12°42'59.8"N 77°41'07.8"E</div>
          </Popup>
        </Circle>

        {/* 100m Buffer Zone (dashed orange border) at user coordinates */}
        <Circle
          center={TARGET_COORDS}
          radius={200} // 100m lake radius + 100m buffer
          pathOptions={{
            color: '#f97316',
            fillColor: '#ea580c',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '6, 8'
          }}
        >
          <Popup>
            <div className="font-bold text-xs text-orange-400">100m Protected Buffer Limit</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Buffer Zone Boundary</div>
          </Popup>
        </Circle>

        {/* Target location marker */}
        <Marker
          position={TARGET_COORDS}
          icon={L.divIcon({
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -42],
            html: `
              <div style="position:relative;width:40px;height:40px">
                <div style="
                  position:absolute;inset:-5px;border-radius:50%;
                  background:#3b82f630;
                  animation:lwPing 1.6s cubic-bezier(0,0,0.2,1) infinite;
                "></div>
                <div style="
                  width:38px;height:38px;
                  border-radius:50% 50% 50% 0;
                  transform:rotate(-45deg);
                  background:#2563eb;
                  box-shadow:0 4px 14px rgba(37,99,235,0.65);
                  border:2px solid rgba(255,255,255,0.35);
                  position:relative;
                "></div>
                <div style="
                  position:absolute;top:44%;left:50%;
                  transform:translate(-50%,-50%);
                  font-size:15px;line-height:1;
                  pointer-events:none;
                ">📍</div>
              </div>
            `
          })}
        >
          <Popup>
            <div className="font-bold text-xs text-blue-400">Target Coordinates</div>
            <div className="text-[10px] text-slate-400 mt-0.5">12°42'59.8"N 77°41'07.8"E</div>
          </Popup>
        </Marker>

        {/* Lake & Buffer Zone Overlays */}
        {lakes.map(lake => {
          const lakeCoords = getLeafletCoords(lake.boundary_polygon)
          const bufferCoords = getLeafletCoords(lake.buffer_polygon)
          return (
            <div key={lake.id}>
              {/* Buffer Zone Ring (dashed, translucent orange-red) */}
              {bufferCoords.length > 0 && (
                <Polygon
                  positions={bufferCoords}
                  pathOptions={{
                    color: '#f97316',
                    fillColor: '#ea580c',
                    fillOpacity: 0.08,
                    weight: 1.5,
                    dashArray: '6, 8'
                  }}
                >
                  <Popup>
                    <div className="font-bold text-xs text-orange-400">{lake.name} Buffer Zone</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">100m Protected Buffer Limit</div>
                  </Popup>
                </Polygon>
              )}

              {/* Lake Boundary (solid, translucent blue/teal) */}
              {lakeCoords.length > 0 && (
                <Polygon
                  positions={lakeCoords}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.22,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="font-bold text-xs text-blue-400">{lake.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Water Boundary (Full Tank Level)</div>
                  </Popup>
                </Polygon>
              )}
            </div>
          )
        })}

        {/* Custom Polygons rendering if coordinates are supplied */}
        {customPolygons.map((poly, idx) => (
          <Polygon
            key={idx}
            positions={poly.positions}
            pathOptions={poly.pathOptions || { color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.22, weight: 2 }}
          >
            {poly.popupContent && (
              <Popup>
                {poly.popupContent}
              </Popup>
            )}
          </Polygon>
        ))}

        <FitBounds reports={reports} lakes={lakes} />

        {reports.map(r => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            icon={makeIcon(r.violation_type, r.status)}
            eventHandlers={{ click: () => onReportClick?.(r) }}
          >
            <Popup minWidth={230}>
              {/* Photo */}
              {r.photo_url ? (
                <img
                  src={r.photo_url}
                  alt={r.violation_type}
                  style={{
                    width: '100%', height: 110, objectFit: 'cover',
                    borderRadius: 8, marginBottom: 10, display: 'block',
                  }}
                />
              ) : (
                <div style={{
                  textAlign: 'center', fontSize: 32,
                  margin: '4px 0 10px', lineHeight: 1,
                }}>
                  {TYPE_CONFIG[r.violation_type]?.emoji ?? '📍'}
                </div>
              )}

              {/* Type */}
              <div style={{ fontWeight: 700, color: '#f0fdf4', marginBottom: 4, fontSize: 13 }}>
                {r.violation_type}
              </div>

              {/* Description snippet */}
              {r.description && (
                <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                  {r.description.length > 110
                    ? r.description.slice(0, 110) + '…'
                    : r.description}
                </p>
              )}

              {/* Geofence violation warning */}
              {r.buffer_zone_flag === 1 && (
                <div className="mb-2 text-[10px] text-orange-400 font-semibold flex items-center gap-1">
                  ⚠️ Buffer Zone Violation (High Priority)
                </div>
              )}

              {/* Footer row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
                gap: 8, marginTop: 6,
              }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>📅 {fmtDate(r.timestamp)}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <StatusBadge status={r.status} />
                </div>
              </div>

              {/* ID + Upvotes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'monospace', fontSize: 10 }}>
                <span style={{ color: '#4ade80' }}>#{r.id}</span>
                {r.upvotes > 0 && <span style={{ color: '#94a3b8' }}>👍 {r.upvotes} confirms</span>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  )
}
