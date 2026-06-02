function getAirportCode(airport) {
  return airport.iata_faa || airport.icao;
}

function AirportItem({ airport, onAirportClick, onEdit, onDelete }) {
  const code = getAirportCode(airport);
  if (!code) return null;

  return (
    <li className="airport-item">
      <div className="airport-info" onClick={() => onAirportClick(airport)}>
        <span className="airport-code">{code}</span>
        <span className="airport-name">{airport.name}</span>
        <span className="airport-city">{airport.city}</span>
      </div>
      <div className="airport-actions">
        <button
          className="btn-edit"
          onClick={() => onEdit(airport)}
          title="Editar aeropuerto"
          aria-label={`Editar ${code}`}
        >
          ✏️
        </button>
        <button
          className="btn-delete"
          onClick={() => onDelete(code)}
          title="Eliminar aeropuerto"
          aria-label={`Eliminar ${code}`}
        >
          🗑️
        </button>
      </div>
    </li>
  );
}

function PopularItem({ item, onPopularClick }) {
  return (
    <li className="popular-item" onClick={() => onPopularClick(item.code)}>
      <span>✈️ {item.name || item.code}</span>
      <span className="pop-score">
        {item.score} <small>visitas</small>
      </span>
    </li>
  );
}

export default function AirportList({
  airports,
  popular,
  onAirportClick,
  onEdit,
  onDelete,
  onPopularClick,
  onShowForm,
}) {
  return (
    <div className="airport-list-section">
      <div className="list-header">
        <h3>Aeropuertos ({airports.length})</h3>
        <button className="btn-add" onClick={onShowForm}>
          + Nuevo
        </button>
      </div>

      <ul className="airport-items">
        {airports.length === 0 ? (
          <li className="empty-state">No se encontraron aeropuertos</li>
        ) : (
          airports.slice(0, 100).map((airport) => {
            const code = getAirportCode(airport);
            return (
              <AirportItem
                key={code}
                airport={airport}
                onAirportClick={onAirportClick}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })
        )}
      </ul>

      <div className="popular-section">
        <h3>🔥 Más Populares</h3>
        <ul className="popular-list">
          {popular.length === 0 ? (
            <li className="empty-state">
              No hay aeropuertos visitados aún. ¡Explora el mapa!
            </li>
          ) : (
            popular.map((item) => (
              <PopularItem
                key={item.code}
                item={item}
                onPopularClick={onPopularClick}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
