import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

/** Green pin icon for the dropped pin */
const pinIcon = L.divIcon({
  className: '',
  iconSize:   [36, 36],
  iconAnchor: [18, 36],
  html: `
    <div style="position:relative;width:36px;height:36px">
      <div style="
        width:34px;height:34px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:linear-gradient(135deg,#22c55e,#14b8a6);
        box-shadow:0 4px 16px rgba(34,197,94,0.55);
        border:2px solid rgba(255,255,255,0.35);
      "></div>
      <div style="
        position:absolute;top:44%;left:50%;
        transform:translate(-50%,-50%);
        font-size:14px;line-height:1;
      ">📍</div>
    </div>
  `,
})

/** Listens for map clicks and calls onPinDrop(lat, lng) */
function ClickHandler({ onPinDrop }) {
  useMapEvents({
    click(e) {
      onPinDrop(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function PinDropMap({ lat, lng, onPinDrop, height = 260 }) {
  const center = lat != null && lng != null
    ? [lat, lng]
    : [12.76, 77.70]   // default: Anekal area

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height, width: '100%', borderRadius: 14 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPinDrop={onPinDrop} />
      {lat != null && lng != null && (
        <Marker position={[lat, lng]} icon={pinIcon} />
      )}
    </MapContainer>
  )
}
