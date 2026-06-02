import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapController({ centerPosition }) {
  const map = useMap();

  useEffect(() => {
    if (centerPosition) {
      map.flyTo(centerPosition, 8, { duration: 1.5 });
    }
  }, [centerPosition, map]);

  return null;
}
