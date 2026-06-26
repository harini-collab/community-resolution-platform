import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import StatusBadge from './StatusBadge.jsx';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const emergencyIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const approxIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#2563eb;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.3)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

function resolvePosition(issue) {
  if (issue.latitude && issue.longitude) {
    return {
      position: [Number(issue.latitude), Number(issue.longitude)],
      approximated: Boolean(issue.approximated_location)
    };
  }
  const seed = String(issue.pincode || issue.ward || issue.id || '0');
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 10000;
  const lat = 12.9716 + ((hash % 200) - 100) * 0.0008;
  const lng = 77.5946 + (((hash / 200) | 0) % 200 - 100) * 0.0008;
  return { position: [lat, lng], approximated: true };
}

export default function IssueMap({ issues = [], center = [12.9716, 77.5946], emptyMessage = 'No mapped issues yet.' }) {
  const mapped = issues.filter((issue) => issue.latitude || issue.pincode || issue.ward);
  const first = mapped[0];
  const mapCenter = first ? resolvePosition(first).position : center;

  if (!mapped.length) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <MapContainer center={mapCenter} zoom={13} className="h-80 rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.map((issue) => {
        const { position, approximated } = resolvePosition(issue);
        const isEmergency = issue.priority_level === 'Emergency' || issue.emergency_escalated;
        const icon = isEmergency ? emergencyIcon : approximated ? approxIcon : markerIcon;
        return (
          <Marker key={issue.id} position={position} icon={icon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{issue.title}</p>
                <StatusBadge status={issue.status} />
                {approximated && <p className="text-xs text-blue-700">Approximate pincode/ward location</p>}
                {issue.pincode && <p className="text-xs text-slate-600">PIN {issue.pincode}{issue.ward ? ` · Ward ${issue.ward}` : ''}</p>}
                {issue.landmark && <p className="text-xs text-slate-500">{issue.landmark}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
