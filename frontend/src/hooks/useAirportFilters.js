import { useMemo } from 'react';

export function useAirportFilters(airports, searchTerm, cityFilter) {
  return useMemo(() => {
    let result = airports;

    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      result = result.filter((airport) =>
        airport.name?.toLowerCase().includes(normalizedSearch),
      );
    }

    if (cityFilter) {
      const normalizedCity = cityFilter.toLowerCase();
      result = result.filter((airport) =>
        airport.city?.toLowerCase().includes(normalizedCity),
      );
    }

    return result;
  }, [airports, searchTerm, cityFilter]);
}
