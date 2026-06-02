import { useState, useEffect } from 'react';

const INITIAL_FORM_STATE = {
  name: '',
  city: '',
  iata_faa: '',
  icao: '',
  lat: '',
  lng: '',
  alt: '',
  tz: '',
};

function buildFormDataFromAirport(airport) {
  if (!airport) return INITIAL_FORM_STATE;

  return {
    name: airport.name || '',
    city: airport.city || '',
    iata_faa: airport.iata_faa || '',
    icao: airport.icao || '',
    lat: airport.lat ?? '',
    lng: airport.lng ?? '',
    alt: airport.alt ?? '',
    tz: airport.tz || '',
  };
}

function parseFormToPayload(formData) {
  return {
    ...formData,
    lat: parseFloat(formData.lat),
    lng: parseFloat(formData.lng),
    alt: formData.alt ? parseFloat(formData.alt) : undefined,
  };
}

export default function AirportForm({ airport, onClose, onSave }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(buildFormDataFromAirport(airport));
  }, [airport]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = parseFormToPayload(formData);

    if (isNaN(payload.lat) || isNaN(payload.lng)) {
      setError('Latitud y longitud son obligatorios y deben ser números');
      return;
    }

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const isEditing = Boolean(airport);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? 'Editar Aeropuerto' : 'Crear Aeropuerto'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="airport-form">
          <div className="form-group">
            <label htmlFor="airport-name">Nombre *</label>
            <input id="airport-name" type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="airport-city">Ciudad *</label>
            <input id="airport-city" type="text" name="city" value={formData.city} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="airport-iata">Código IATA/FAA *</label>
            <input id="airport-iata" type="text" name="iata_faa" value={formData.iata_faa} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="airport-icao">Código ICAO *</label>
            <input id="airport-icao" type="text" name="icao" value={formData.icao} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="airport-lat">Latitud *</label>
              <input
                id="airport-lat"
                type="number"
                step="any"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="airport-lng">Longitud *</label>
              <input
                id="airport-lng"
                type="number"
                step="any"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="airport-alt">Altitud (ft)</label>
              <input id="airport-alt" type="number" name="alt" value={formData.alt} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="airport-tz">Zona Horaria</label>
              <input
                id="airport-tz"
                type="text"
                name="tz"
                value={formData.tz}
                onChange={handleChange}
                placeholder="America/Argentina/Buenos_Aires"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
