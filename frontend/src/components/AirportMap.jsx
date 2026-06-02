import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import MapController from './MapController';

const DEFAULT_ICON = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DEFAULT_ICON;

function getAirportCode(airport) {
  return airport.iata_faa || airport.icao;
}

function PopupContent({ airport, selectedAirportInfo, code }) {
  if (selectedAirportInfo?.code === code && selectedAirportInfo?.loading) {
    return <div className="custom-popup">Cargando detalles...</div>;
  }

  if (selectedAirportInfo?.code === code && selectedAirportInfo?.error) {
    return <div className="custom-popup">Error obteniendo datos.</div>;
  }

  if (selectedAirportInfo?.code === code) {
    return (
      <div className="custom-popup">
        <h2>{selectedAirportInfo.name || 'Aeropuerto Desconocido'}</h2>
        <p>
          <strong>Código:</strong> {code}
        </p>
        <p>
          <strong>Ciudad:</strong> {selectedAirportInfo.city || '-'}
        </p>
        <p>
          <strong>Elevación:</strong> {selectedAirportInfo.alt ? `${selectedAirportInfo.alt} ft` : '-'}
        </p>
        <p>
          <strong>Zona Horaria:</strong> {selectedAirportInfo.tz || '-'}
        </p>
      </div>
    );
  }

  return <div className="custom-popup">Haz click para cargar...</div>;
}

export default function AirportMap({
  airports,
  selectedAirportInfo,
  centerPosition,
  onMarkerClick,
}) {
  return (
    <MapContainer center={[20, 0]} zoom={3} zoomControl={true} className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      <MapController centerPosition={centerPosition} />

      <MarkerClusterGroup spiderfyOnMaxZoom={true} showCoverageOnHover={false} chunkedLoading={true}>
        {airports.map((airport) => {
          const code = getAirportCode(airport);
          if (!code) return null;

          return (
            <Marker
              key={code}
              position={[airport.lat, airport.lng]}
              eventHandlers={{
                click: () => onMarkerClick(airport),
              }}
            >
              <Popup>
                <PopupContent
                  airport={airport}
                  selectedAirportInfo={selectedAirportInfo}
                  code={code}
                />
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
