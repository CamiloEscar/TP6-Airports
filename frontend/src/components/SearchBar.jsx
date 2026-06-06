import { useState, useEffect, useRef } from 'react';

const DEBOUNCE_MS = 250;

const FILTERS = [
  { key: 'all', label: 'Todo' },
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'city', label: 'Ciudad' },
];

const FILTER_LABELS = {
  all: 'Buscar aeropuertos...',
  code: 'Buscar por código IATA/ICAO...',
  name: 'Buscar por nombre...',
  city: 'Buscar por ciudad...',
};

export default function SearchBar({ searchTerm, cityFilter, onSearch, onCityFilter, totalAirports, filteredCount }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const inputRef = useRef(null);

  // ── Sync desde external props (cuando limpian desde fuera) ──
  useEffect(() => {
    if (!searchTerm && !cityFilter) setQuery('');
  }, [searchTerm, cityFilter]);

  // ── Debounce: dispara los filtros según el activeFilter ──
  useEffect(() => {
    const timer = setTimeout(() => {
      switch (activeFilter) {
        case 'code':
        case 'name':
          onSearch(query);
          onCityFilter('');
          break;
        case 'city':
          onCityFilter(query);
          onSearch('');
          break;
        default: // 'all' — busca en ambos
          onSearch(query);
          onCityFilter(query);
          break;
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, activeFilter, onSearch, onCityFilter]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    onCityFilter('');
    inputRef.current?.focus();
  };

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    // al cambiar filtro, re-dispara la búsqueda
    if (query) {
      switch (key) {
        case 'code':
        case 'name':
          onCityFilter('');
          break;
        case 'city':
          onSearch('');
          break;
        default:
          break;
      }
    }
  };

  const showClear = query.length > 0;
  const hasActiveFilter = searchTerm || cityFilter;

  return (
    <div className="search-bar">
      <div className={`search-main ${hasActiveFilter ? 'search-main--active' : ''}`}>
        <svg className="search-main-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder={FILTER_LABELS[activeFilter]}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar aeropuertos"
          autoComplete="off"
          spellCheck={false}
        />
        {showClear && (
          <button className="search-clear-btn" onClick={handleClear} aria-label="Limpiar búsqueda">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="search-meta">
        <div className="search-chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`search-chip ${activeFilter === f.key ? 'search-chip--active' : ''}`}
              onClick={() => handleFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {hasActiveFilter && (
          <span className="search-results-count">
            {filteredCount} de {totalAirports}
          </span>
        )}
      </div>
    </div>
  );
}
