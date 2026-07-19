
import axios from 'axios';

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
}

interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
}

export class GeocodingService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GOOGLE_MAPS_API_KEY not configured - geocoding will be disabled');
    }
  }

  /**
   * Convert an address string to lat/lng coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      console.error('Cannot geocode: GOOGLE_MAPS_API_KEY not configured');
      return null;
    }

    if (!address || address.trim().length === 0) {
      return null;
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        console.error('Geocoding failed:', response.data.status);
        return null;
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      return {
        coordinates: {
          lat: location.lat,
          lng: location.lng,
        },
        formattedAddress: result.formatted_address,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points using Distance Matrix API
   */
  async calculateDistance(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<DistanceResult | null> {
    if (!this.apiKey) {
      console.error('Cannot calculate distance: GOOGLE_MAPS_API_KEY not configured');
      return null;
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: `${origin.lat},${origin.lng}`,
          destinations: `${destination.lat},${destination.lng}`,
          key: this.apiKey,
          mode: 'driving',
        },
      });

      if (response.data.status !== 'OK') {
        console.error('Distance Matrix API error:', response.data.status);
        return null;
      }

      const element = response.data.rows[0]?.elements[0];
      if (!element || element.status !== 'OK') {
        console.error('Distance calculation failed:', element?.status);
        return null;
      }

      return {
        distanceKm: element.distance.value / 1000, // Convert meters to km
        durationMinutes: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
      };
    } catch (error) {
      console.error('Distance calculation error:', error);
      return null;
    }
  }

  /**
   * Helper: Calculate distance from address strings
   */
  async calculateDistanceFromAddresses(
    originAddress: string,
    destinationAddress: string
  ): Promise<DistanceResult | null> {
    const originGeocode = await this.geocodeAddress(originAddress);
    const destGeocode = await this.geocodeAddress(destinationAddress);

    if (!originGeocode || !destGeocode) {
      return null;
    }

    return this.calculateDistance(originGeocode.coordinates, destGeocode.coordinates);
  }
}

export const geocodingService = new GeocodingService();
