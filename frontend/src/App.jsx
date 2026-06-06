import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  fetchAllAirports,
  fetchAirportByCode,
  createAirport,
  updateAirport,
  deleteAirport,
  fetchPopular,
} from './services/api';
import { getAirportCode, isArgentinaAirport } from './helpers/airportUtils';
import { useNotification } from './hooks/useNotification';
import { useAirportFilters } from './hooks/useAirportFilters';
import SearchBar from './components/SearchBar';
import AirportForm from './components/AirportForm';
import AirportList from './components/AirportList';
import AirportMap from './components/AirportMap';
import './App.css';

function App() {
  const [airports, setAirports] = useState([]);
  const [popularAirports, setPopularAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [mapCenterPosition, setMapCenterPosition] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAirport, setEditingAirport] = useState(null);

  const [notification, showNotification] = useNotification();

  // Ref para disparar acciones en el mapa (como abrir popups) desde la lista
  const mapActionsRef = useRef(null);

  // ── Argentina Airports ──
  const argentinaAirports = useMemo(
    () => airports.filter(isArgentinaAirport),
    [airports],
  );

  // ── Data Loading ──
  const loadAirports = useCallback(async () => {
    try {
      const data = await fetchAllAirports();
      const validAirports = data.filter(
        (airport) => airport.lat != null && airport.lng != null,
      );
      setAirports(validAirports);
    } catch (error) {
      console.error('Error al cargar aeropuertos', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPopularAirports = useCallback(async () => {
    try {
      const data = await fetchPopular();
      setPopularAirports(data);
    } catch (error) {
      console.error('Error al cargar aeropuertos populares', error);
    }
  }, []);

  useEffect(() => {
    loadAirports();
    loadPopularAirports();
  }, [loadAirports, loadPopularAirports]);

  // ── Filtering ──
  const filteredAirports = useAirportFilters(airports, searchTerm, cityFilter);

  // ── Handlers: Search ──
  const handleSearchTerm = useCallback((term) => setSearchTerm(term), []);
  const handleCityFilter = useCallback((city) => setCityFilter(city), []);

  // ── Handlers: Map & Selection ──
  const handlePopularClick = useCallback(
    (code) => {
      const target = airports.find(
        (airport) => getAirportCode(airport) === code,
      );
      if (target) {
        setMapCenterPosition([target.lat, target.lng]);
      }
    },
    [airports],
  );

  const handleAirportClick = useCallback(
    (airport) => {
      setMapCenterPosition([airport.lat, airport.lng]);
      mapActionsRef.current?.selectAirport(airport);
    },
    [],
  );

  const handleArgentinaZoom = useCallback(() => {
    setMapCenterPosition([-34.6, -58.4]);
  }, []);

  // ── Handlers: Form ──
  const handleShowCreateForm = useCallback(() => {
    setEditingAirport(null);
    setShowForm(true);
  }, []);

  const handleShowEditForm = useCallback((airport) => {
    setEditingAirport(airport);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingAirport(null);
  }, []);

  const handleSaveAirport = useCallback(
    async (data) => {
      if (editingAirport) {
        const code = getAirportCode(editingAirport);
        await updateAirport(code, data);
        showNotification('Aeropuerto actualizado correctamente');
      } else {
        await createAirport(data);
        showNotification('Aeropuerto creado correctamente');
      }

      handleCloseForm();
      await loadAirports();
      await loadPopularAirports();
    },
    [editingAirport, handleCloseForm, loadAirports, loadPopularAirports, showNotification],
  );

  const handleDeleteAirport = useCallback(
    async (code) => {
      if (!confirm(`¿Estás seguro de eliminar el aeropuerto ${code}?`)) return;

      try {
        await deleteAirport(code);
        showNotification('Aeropuerto eliminado correctamente');
        setAirports((prev) =>
          prev.filter((airport) => getAirportCode(airport) !== code),
        );
        await loadPopularAirports();
      } catch (error) {
        console.error('Error al eliminar', error);
        showNotification('Error al eliminar aeropuerto', true);
      }
    },
    [loadPopularAirports, showNotification],
  );

  return (
    <div className="app-container">
      <AirportMap
        airports={filteredAirports}
        centerPosition={mapCenterPosition}
        mapActionsRef={mapActionsRef}
      />

      <aside className="glass-panel">
        <div className="panel-header">
          <h1>AeroPuntos</h1>
          <p className="panel-subtitle">
            Explora {airports.length.toLocaleString()} aeropuertos alrededor del mundo
          </p>
        </div>

        <SearchBar
          searchTerm={searchTerm}
          cityFilter={cityFilter}
          onSearch={handleSearchTerm}
          onCityFilter={handleCityFilter}
          totalAirports={airports.length}
          filteredCount={filteredAirports.length}
        />

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Cargando aeropuertos...</span>
          </div>
        ) : (
          <AirportList
            airports={filteredAirports}
            popular={popularAirports}
            onAirportClick={handleAirportClick}
            onEdit={handleShowEditForm}
            onDelete={handleDeleteAirport}
            onPopularClick={handlePopularClick}
            onShowForm={handleShowCreateForm}
            onArgentinaZoom={handleArgentinaZoom}
            argentinaAirports={argentinaAirports}
          />
        )}
      </aside>

      {showForm && (
        <AirportForm
          airport={editingAirport}
          onClose={handleCloseForm}
          onSave={handleSaveAirport}
        />
      )}

      {notification && (
        <div
          className={`notification ${notification.isError ? 'notification--error' : 'notification--success'}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {notification.isError
              ? <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>
              : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>
            }
          </svg>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
