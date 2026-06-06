import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { getAirportCode, isArgentinaAirport } from '../helpers/airportUtils';
import { fetchAirportByCode } from '../services/api';
import MapController from './MapController';

// ── Coordenadas de Argentina ──
const ARGENTINA_CENTER = [-34.6, -58.4];
const ARGENTINA_ZOOM = 5;

// ── Iconos ──
const DEFAULT_ICON = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const ARGENTINA_ICON = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  className: 'marker-argentina',
});

L.Marker.prototype.options.icon = DEFAULT_ICON;

// ── Construir HTML del popup ──
function buildPopupContent(data) {
  if (data.loading) {
    return '<div class="custom-popup"><div class="popup-loading">Cargando...</div></div>';
  }
  if (data.error) {
    return '<div class="custom-popup"><div class="popup-error">Error obteniendo datos.</div></div>';
  }
  const name = data.name || 'Aeropuerto Desconocido';
  const code = data.code || '';
  const city = data.city || '-';
  const alt = data.alt ? `${data.alt} ft` : '-';
  const tz = data.tz || '-';

  return `
    <div class="custom-popup">
      <h2>${escapeHtml(name)}</h2>
      <div class="popup-grid">
        <div class="popup-field">
          <span class="popup-label">Código</span>
          <span class="popup-value">${escapeHtml(code)}</span>
        </div>
        <div class="popup-field">
          <span class="popup-label">Ciudad</span>
          <span class="popup-value">${escapeHtml(city)}</span>
        </div>
        <div class="popup-field">
          <span class="popup-label">Elevación</span>
          <span class="popup-value">${escapeHtml(alt)}</span>
        </div>
        <div class="popup-field">
          <span class="popup-label">Zona Horaria</span>
          <span class="popup-value">${escapeHtml(tz)}</span>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── MarkersManager: maneja markers + clustering + popups
//    TODO con API imperativa de Leaflet. React NO toca los markers.
// ──
function MarkersManager({ airports, markersRef }) {
  const map = useMap();
  const mcgRef = useRef(null);

  useEffect(() => {
    // Limpiar grupo anterior
    if (mcgRef.current) {
      map.removeLayer(mcgRef.current);
      mcgRef.current = null;
    }

    const mcg = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
    });

    const markersByCode = new Map();

    airports.forEach((airport) => {
      const code = getAirportCode(airport);
      if (!code) return;

      const isArg = isArgentinaAirport(airport);
      const airportIcon = isArg ? ARGENTINA_ICON : DEFAULT_ICON;

      const marker = L.marker([airport.lat, airport.lng], { icon: airportIcon });

      // Click en marker → abrir popup con datos via API
      marker.on('click', () => {
        marker
          .bindPopup(buildPopupContent({ loading: true }), {
            closeButton: true,
            maxWidth: 300,
          })
          .openPopup();

        fetchAirportByCode(code)
          .then((data) => {
            marker.setPopupContent(buildPopupContent({ ...data, code }));
          })
          .catch((err) => {
            console.error(err);
            marker.setPopupContent(buildPopupContent({ error: true }));
          });
      });

      markersByCode.set(code, { marker, airport });
      mcg.addLayer(marker);
    });

    map.addLayer(mcg);
    mcgRef.current = mcg;

    // Guardar referencias para selectAirport (clicks desde lista)
    markersRef.current = markersByCode;

    return () => {
      if (mcgRef.current) {
        map.removeLayer(mcgRef.current);
        mcgRef.current = null;
      }
      markersRef.current = new Map();
    };
  }, [map, airports, markersRef]);

  return null;
}

// ── AirportMap: componente principal ──
export default function AirportMap({ airports, centerPosition, mapActionsRef }) {
  const markersRef = useRef(new Map());

  // ── Exponer selectAirport al padre (para clicks desde la lista) ──
  useEffect(() => {
    if (!mapActionsRef) return;

    mapActionsRef.current = {
      selectAirport: (airport) => {
        const code = getAirportCode(airport);
        const entry = markersRef.current.get(code);
        if (!entry) return;

        const { marker } = entry;

        marker
          .bindPopup(buildPopupContent({ loading: true }), {
            closeButton: true,
            maxWidth: 300,
          })
          .openPopup();

        fetchAirportByCode(code)
          .then((data) => {
            marker.setPopupContent(buildPopupContent({ ...data, code }));
          })
          .catch((err) => {
            console.error(err);
            marker.setPopupContent(buildPopupContent({ error: true }));
          });
      },
    };

    return () => {
      mapActionsRef.current = null;
    };
  }, [mapActionsRef]);

  return (
    <MapContainer
      center={ARGENTINA_CENTER}
      zoom={ARGENTINA_ZOOM}
      zoomControl={true}
      className="map-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      <MapController centerPosition={centerPosition} />

      <MarkersManager airports={airports} markersRef={markersRef} />
    </MapContainer>
  );
}
