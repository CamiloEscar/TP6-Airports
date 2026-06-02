import { useState } from 'react';

export default function SearchBar({ onSearch, onCityFilter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityTerm, setCityTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
    onCityFilter(cityTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    setCityTerm('');
    onSearch('');
    onCityFilter('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Buscar aeropuerto por nombre"
      />
      <input
        type="text"
        placeholder="Filtrar por ciudad..."
        value={cityTerm}
        onChange={(e) => setCityTerm(e.target.value)}
        aria-label="Filtrar aeropuertos por ciudad"
      />
      <button type="submit" className="btn-search">
        Buscar
      </button>
      <button type="button" className="btn-clear" onClick={handleClear}>
        Limpiar
      </button>
    </form>
  );
}
