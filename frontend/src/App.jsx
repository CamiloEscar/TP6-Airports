import { useEffect, useState, useCallback } from 'react';
import {
  fetchAllAirports,
  fetchAirportByCode,
  createAirport,
  updateAirport,
  deleteAirport,
  fetchPopular,
} from './services/api';
import { useNotification } from './hooks/useNotification';
import { useAirportFilters } from './hooks/useAirportFilters';
import SearchBar from './components/SearchBar';
import AirportForm from './components/AirportForm';
import AirportList from './components/AirportList';
import AirportMap from './components/AirportMap';
import './App.css';

function getAirportCode(airport) {
  return airport.iata_faa || airport.icao;
}

function App() {
  const [airports, setAirports] = useState([]);
  const [popularAirports, setPopularAirports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedAirportDetails, setSelectedAirportDetails] = useState(null);
  const [mapCenterPosition, setMapCenterPosition] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAirport, setEditingAirport] = useState(null);

  const [notification, showNotification] = useNotification();

  // ── Data Loading ──────────────────────────────────────────

  const loadAirports = useCallback(async () => {
    try {
      const data = await fetchAllAirports();
      const validAirports = data.filter(
        (airport) => airport.lat != null && airport.lng != null,
      );
      setAirports(validAirports);
    } catch (error) {
      console.error('Error al cargar aeropuertos', error);
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

  // ── Filtering ─────────────────────────────────────────────

  const filteredAirports = useAirportFilters(airports, searchTerm, cityFilter);

  // ── Handlers: Search ──────────────────────────────────────

  const handleSearchTerm = useCallback((term) => setSearchTerm(term), []);
  const handleCityFilter = useCallback((city) => setCityFilter(city), []);

  // ── Handlers: Map & Selection ─────────────────────────────

  const handleMarkerClick = useCallback(
    async (airport) => {
      const code = getAirportCode(airport);
      setSelectedAirportDetails({ code, loading: true });

      try {
        const data = await fetchAirportByCode(code);
        setSelectedAirportDetails({ ...data, loading: false, code });
        setTimeout(loadPopularAirports, 500);
      } catch (error) {
        console.error(error);
        setSelectedAirportDetails({ error: true, code });
      }
    },
    [loadPopularAirports],
  );

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
      handleMarkerClick(airport);
    },
    [handleMarkerClick],
  );

  // ── Handlers: Form ────────────────────────────────────────

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
        selectedAirportInfo={selectedAirportDetails}
        centerPosition={mapCenterPosition}
        onMarkerClick={handleMarkerClick}
      />

      <aside className="glass-panel">
        <h1>Global Airports</h1>
        <p>Explora y descubre aeropuertos alrededor del mundo.</p>

        <SearchBar onSearch={handleSearchTerm} onCityFilter={handleCityFilter} />

        <AirportList
          airports={filteredAirports}
          popular={popularAirports}
          onAirportClick={handleAirportClick}
          onEdit={handleShowEditForm}
          onDelete={handleDeleteAirport}
          onPopularClick={handlePopularClick}
          onShowForm={handleShowCreateForm}
        />
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
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
