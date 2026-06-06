const ARG_TIMEZONE_PREFIX = 'America/Argentina';

export function getAirportCode(airport) {
  return airport.iata_faa || airport.icao;
}

export function isArgentinaAirport(airport) {
  return airport.tz && airport.tz.startsWith(ARG_TIMEZONE_PREFIX);
}
