import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('useGoogleMaps: No API key found');
      setLoadError('Google Maps API key not configured');
      return;
    }

    console.log('useGoogleMaps: Initializing loader with key length:', GOOGLE_MAPS_API_KEY.length);

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader
      .load()
      .then(() => {
        console.log('useGoogleMaps: Loaded successfully');
        setIsLoaded(true);
        setLoadError(null);
      })
      .catch((error) => {
        console.error('useGoogleMaps: Loader error:', error);
        setLoadError(`Failed to load Google Maps: ${error.message}`);
      });
  }, []);

  return { isLoaded, loadError };
};