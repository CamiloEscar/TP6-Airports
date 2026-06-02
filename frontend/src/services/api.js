const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/airports';

export async function fetchAllAirports(search = '', city = '') {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (city) params.set('city', city);

    const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener aeropuertos');
    return res.json();
}

export async function fetchAirportByCode(code) {
    const res = await fetch(`${API_URL}/${code}`);
    if (!res.ok) throw new Error('Aeropuerto no encontrado');
    return res.json();
}

export async function createAirport(data) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Error al crear aeropuerto' }));
        throw new Error(error.message || 'Error al crear aeropuerto');
    }
    return res.json();
}

export async function updateAirport(code, data) {
    const res = await fetch(`${API_URL}/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Error al actualizar aeropuerto' }));
        throw new Error(error.message || 'Error al actualizar aeropuerto');
    }
    return res.json();
}

export async function deleteAirport(code) {
    const res = await fetch(`${API_URL}/${code}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar aeropuerto');
    return res.json();
}

export async function fetchPopular() {
    const res = await fetch(`${API_URL}/popular`);
    if (!res.ok) throw new Error('Error al obtener populares');
    return res.json();
}

export async function fetchNearby(lat, lng, radius = 50) {
    const res = await fetch(`${API_URL}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!res.ok) throw new Error('Error al buscar aeropuertos cercanos');
    return res.json();
}
