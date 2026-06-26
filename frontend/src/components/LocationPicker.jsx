import L from 'leaflet';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng, { reverseLookup: true });
    }
  });
  return null;
}

function MapCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15));
  }, [map, position]);
  return null;
}

function formatAddress(result) {
  const address = result?.address || {};
  return [
    address.house_number,
    address.road,
    address.neighbourhood || address.suburb,
    address.city || address.town || address.village
  ].filter(Boolean).join(', ') || result?.display_name || '';
}

export default function LocationPicker({ value, onChange, showMap = true }) {
  const [addressQuery, setAddressQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const position = useMemo(() => {
    const lat = Number(value.latitude);
    const lng = Number(value.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }, [value.latitude, value.longitude]);

  function patch(fields) {
    onChange({ ...value, ...fields });
  }

  async function reverseLookup(lat, lng) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`
    );
    const result = await response.json();
    patch({
      latitude: Number(lat).toFixed(7),
      longitude: Number(lng).toFixed(7),
      address: formatAddress(result) || value.address,
      pincode: result?.address?.postcode || value.pincode,
      area: result?.address?.suburb || result?.address?.neighbourhood || value.area
    });
  }

  async function pickLocation(lat, lng, options = {}) {
    setLocationMessage('');
    if (options.reverseLookup) {
      try {
        await reverseLookup(lat, lng);
      } catch {
        patch({ latitude: Number(lat).toFixed(7), longitude: Number(lng).toFixed(7) });
        setLocationMessage('Coordinates saved. Please confirm address fields manually.');
      }
      return;
    }
    patch({
      latitude: Number(lat).toFixed(7),
      longitude: Number(lng).toFixed(7),
      address: options.address ?? value.address,
      pincode: options.pincode ?? value.pincode
    });
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('GPS unavailable. Enter address and pincode manually.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await reverseLookup(pos.coords.latitude, pos.coords.longitude);
          setLocationMessage('GPS location saved. Adjust address fields if needed.');
        } catch {
          patch({
            latitude: pos.coords.latitude.toFixed(7),
            longitude: pos.coords.longitude.toFixed(7)
          });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationMessage('GPS blocked. Enter house number, street, area, ward, and pincode.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function searchAddress() {
    if (!addressQuery.trim()) return;
    setSearching(true);
    try {
      const query = /\b\d{6}\b/.test(addressQuery) ? `${addressQuery}, India` : `${addressQuery}, India`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
      );
      const [result] = await response.json();
      if (result) {
        patch({
          latitude: Number(result.lat).toFixed(7),
          longitude: Number(result.lon).toFixed(7),
          address: formatAddress(result),
          pincode: result.address?.postcode || value.pincode,
          area: result.address?.suburb || result.address?.neighbourhood || value.area,
          landmark: value.landmark
        });
        setLocationMessage('Location found. Confirm ward and landmark.');
      } else {
        setLocationMessage('No match found. Enter details manually.');
      }
    } catch {
      setLocationMessage('Search failed. Enter address manually.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <label className="block space-y-1">
          <span className="label">House No. & Street *</span>
          <input className="input" required value={value.address || ''} onChange={(e) => patch({ address: e.target.value })} placeholder="12, MG Road" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="label">Area / Colony *</span>
            <input className="input" required value={value.area || ''} onChange={(e) => patch({ area: e.target.value })} placeholder="Koramangala" />
          </label>
          <label className="block space-y-1">
            <span className="label">Ward *</span>
            <input className="input" required value={value.ward || ''} onChange={(e) => patch({ ward: e.target.value })} placeholder="4" />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="label">Pincode *</span>
            <input className="input" required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={value.pincode || ''} onChange={(e) => patch({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="560034" />
          </label>
          <label className="block space-y-1">
            <span className="label">Nearest Landmark</span>
            <input className="input" value={value.landmark || ''} onChange={(e) => patch({ landmark: e.target.value })} placeholder="Near BDA Complex" />
          </label>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="label">Search pincode, ward, or landmark (optional map)</span>
          <input className="input" placeholder="560034 or Ward 4 or BDA Complex" value={addressQuery} onChange={(e) => setAddressQuery(e.target.value)} />
        </label>
        <button className="btn-muted self-end" type="button" onClick={searchAddress} disabled={searching}>
          <Search size={16} /> Search
        </button>
      </div>

      {showMap && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <MapContainer center={position || [12.9716, 77.5946]} zoom={position ? 16 : 12} className="h-56">
            {position && <MapCenter position={position} />}
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <ClickHandler onPick={pickLocation} />
            {position && (
              <Marker position={position} icon={markerIcon} draggable eventHandlers={{
                dragend(event) {
                  const next = event.target.getLatLng();
                  pickLocation(next.lat, next.lng, { reverseLookup: true });
                }
              }} />
            )}
          </MapContainer>
        </div>
      )}

      <button className="btn-muted" type="button" onClick={detectLocation} disabled={locating}>
        <LocateFixed size={16} /> {locating ? 'Locating…' : 'Use GPS (optional)'}
      </button>
      {locationMessage && <p className="text-xs font-medium text-slate-600">{locationMessage}</p>}
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <MapPin size={14} /> Address and pincode are primary. Map pin is optional for officers.
      </p>
    </div>
  );
}
