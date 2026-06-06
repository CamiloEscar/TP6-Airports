import { getAirportCode } from '../helpers/airportUtils';

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PopularIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" /><path d="M12 17v4" />
      <path d="M10.34 4.34a8 8 0 0 0-3.66 11.2l1.7 2.46h7.24l1.7-2.46a8 8 0 0 0-10.98-11.2Z" />
      <path d="M14 3a6 6 0 0 1 5.66 3.34" />
    </svg>
  );
}

function AirportItem({ airport, onAirportClick, onEdit, onDelete, isArgentina }) {
  const code = getAirportCode(airport);
  if (!code) return null;

  return (
    <li className={`airport-item ${isArgentina ? 'airport-item--argentina' : ''}`}>
      <div className="airport-info" onClick={() => onAirportClick(airport)}>
        <span className="airport-code">{code}</span>
        <span className="airport-name">{airport.name}</span>
        <span className="airport-city">
          <PinIcon />
          {airport.city || '-'}
        </span>
      </div>
      <div className="airport-actions">
        <button
          className="btn-icon btn-edit"
          onClick={(e) => { e.stopPropagation(); onEdit(airport); }}
          title="Editar aeropuerto"
          aria-label={`Editar ${code}`}
        >
          <EditIcon />
        </button>
        <button
          className="btn-icon btn-delete"
          onClick={(e) => { e.stopPropagation(); onDelete(code); }}
          title="Eliminar aeropuerto"
          aria-label={`Eliminar ${code}`}
        >
          <DeleteIcon />
        </button>
      </div>
    </li>
  );
}

function PopularItem({ item, onPopularClick }) {
  return (
    <li className="popular-item" onClick={() => onPopularClick(item.code)}>
      <div className="popular-item-info">
        <PopularIcon />
        <span className="popular-item-name">{item.name || item.code}</span>
      </div>
      <span className="pop-score">
        {item.score}
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
  onArgentinaZoom,
  argentinaAirports,
}) {
  const hasArgentina = argentinaAirports && argentinaAirports.length > 0;

  return (
    <div className="airport-list-section">
      {/* ── Argentina Section ── */}
      {hasArgentina && (
        <div className="argentina-section">
          <button className="argentina-badge" onClick={onArgentinaZoom}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <span>Argentina</span>
            <span className="argentina-count">{argentinaAirports.length} aeropuertos</span>
          </button>

          <div className="argentina-preview">
            {argentinaAirports.slice(0, 5).map((airport) => {
              const code = getAirportCode(airport);
              return (
                <button
                  key={code}
                  className="argentina-pill"
                  onClick={() => onAirportClick(airport)}
                  title={airport.name}
                >
                  {code}
                </button>
              );
            })}
            {argentinaAirports.length > 5 && (
              <span className="argentina-more">+{argentinaAirports.length - 5} más</span>
            )}
          </div>
        </div>
      )}

      {/* ── Airport List ── */}
      <div className="list-header">
        <h3>
          Aeropuertos
          <span className="list-count">{airports.length}</span>
        </h3>
        <button className="btn-add" onClick={onShowForm}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5v14" />
          </svg>
          Nuevo
        </button>
      </div>

      <ul className="airport-items">
        {airports.length === 0 ? (
          <li className="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span>No se encontraron aeropuertos</span>
          </li>
        ) : (
          airports.slice(0, 100).map((airport) => {
            const code = getAirportCode(airport);
            const isArg = argentinaAirports?.some(a => getAirportCode(a) === code);
            return (
              <AirportItem
                key={code}
                airport={airport}
                onAirportClick={onAirportClick}
                onEdit={onEdit}
                onDelete={onDelete}
                isArgentina={isArg}
              />
            );
          })
        )}
        {airports.length > 100 && (
          <li className="list-more">
            Mostrando 100 de {airports.length} aeropuertos
          </li>
        )}
      </ul>

      {/* ── Popular Section ── */}
      <div className="popular-section">
        <h3>
          <PopularIcon />
          Más Populares
        </h3>
        <ul className="popular-list">
          {popular.length === 0 ? (
            <li className="empty-state">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8" /><path d="M12 17v4" />
                <path d="M10.34 4.34a8 8 0 0 0-3.66 11.2l1.7 2.46h7.24l1.7-2.46a8 8 0 0 0-10.98-11.2Z" />
              </svg>
              <span>Sin visitas aún. ¡Explora el mapa!</span>
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
