import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import { Icon, LatLng, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPicker.css';

// Mapbox configuration - Get your free token from https://account.mapbox.com/access-tokens/
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const MAPBOX_STYLE = 'mapbox/streets-v12'; // Options: streets-v12, outdoors-v12, light-v11, dark-v11, satellite-v9

// Fix for default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Tunisia bounds (approximately)
const TUNISIA_BOUNDS: LatLngBounds = new LatLngBounds(
  [30.2, 7.5], // Southwest corner
  [37.4, 11.8]  // Northeast corner
);

// Tunisia center (approximate)
const TUNISIA_CENTER: [number, number] = [33.8869, 9.5375];

interface MapPickerProps {
  onLocationSelect: (location: string, lat: number, lng: number) => void;
  label: string;
  selectedLocation?: string;
}

// Component to restrict map to Tunisia bounds
const MapBounds: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    map.setMaxBounds(TUNISIA_BOUNDS);
    map.setMinZoom(6);
    map.setMaxZoom(18);
  }, [map]);
  
  return null;
};

// Component to handle map events
const MapEvents: React.FC<{ onClick: (latlng: LatLng) => void }> = ({ onClick }) => {
  useMapEvents({
    click: (e) => {
      console.log('MapEvents click:', e.latlng);
      onClick(e.latlng);
    },
  });
  return null;
};

export const MapPicker: React.FC<MapPickerProps> = ({ 
  onLocationSelect, 
  label,
  selectedLocation 
}) => {
  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{display_name: string; lat: string; lon: string}>>([]);
  const [error, setError] = useState<string | null>(null);

  // Reverse geocoding: coordinates to address using Mapbox (fallback to Nominatim)
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      // Try Mapbox first if token available
      if (MAPBOX_TOKEN) {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=tn&limit=1`;
        const mapboxResponse = await fetch(mapboxUrl);
        
        if (mapboxResponse.ok) {
          const mapboxData = await mapboxResponse.json();
          if (mapboxData.features && mapboxData.features.length > 0) {
            const feature = mapboxData.features[0];
            // Check if in Tunisia
            const context = feature.context || [];
            const country = context.find((c: any) => c.id && c.id.startsWith('country'));
            if (!country || !country.short_code || country.short_code.toLowerCase() !== 'tn') {
              setError('Please select a location within Tunisia');
              return null;
            }
            setError(null);
            return feature.place_name;
          }
        }
      }
      
      // Fallback to Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=tn`,
        {
          headers: {
            'User-Agent': 'TransportHub/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data && data.display_name) {
        const address = data.address || {};
        const country = address.country || '';
        const countryCode = address.country_code || '';
        
        if (countryCode.toLowerCase() !== 'tn' && !country.toLowerCase().includes('tunisia')) {
          setError('Please select a location within Tunisia');
          return null;
        }
        
        setError(null);
        return data.display_name;
      }
      
      return null;
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return null;
    }
  }, []);

  // Forward geocoding: address to coordinates using Mapbox (fallback to Nominatim)
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Try Mapbox first if token available (much better for airports, hotels, POIs)
      if (MAPBOX_TOKEN) {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=tn&autocomplete=true&limit=5&types=place,locality,neighborhood,address,poi`;
        const mapboxResponse = await fetch(mapboxUrl);
        
        if (mapboxResponse.ok) {
          const mapboxData = await mapboxResponse.json();
          if (mapboxData.features && mapboxData.features.length > 0) {
            const formattedResults = mapboxData.features.map((feature: any) => ({
              display_name: feature.place_name,
              lat: feature.center[1].toString(),
              lon: feature.center[0].toString()
            }));
            setSearchResults(formattedResults);
            setIsSearching(false);
            return;
          }
        }
      }
      
      // Fallback to Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=tn&limit=5`,
        {
          headers: {
            'User-Agent': 'TransportHub/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data);
      
      if (data.length === 0) {
        setError('No locations found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to search locations. Please try again.');
      console.error('Geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle map click
  const handleMapClick = useCallback(async (latlng: LatLng) => {
    console.log('handleMapClick called with:', latlng);
    const lat = latlng.lat;
    const lng = latlng.lng;
    
    // Check if within Tunisia bounds
    if (!TUNISIA_BOUNDS.contains(latlng)) {
      console.log('Location outside Tunisia bounds');
      setError('Please select a location within Tunisia');
      return;
    }
    
    console.log('Setting marker position');
    setMarkerPosition(latlng);
    
    console.log('Starting reverse geocoding');
    const address = await reverseGeocode(lat, lng);
    console.log('Geocoding result:', address);
    
    if (address) {
      onLocationSelect(address, lat, lng);
    }
  }, [onLocationSelect, reverseGeocode]);

  // Handle search result selection
  const handleSearchResultSelect = (result: {display_name: string; lat: string; lon: string}) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setMarkerPosition(new LatLng(lat, lng));
    onLocationSelect(result.display_name, lat, lng);
    setSearchResults([]);
    setSearchQuery('');
    setError(null);
  };

  return (
    <div className="map-picker">
      <div className="map-picker-header">
        <label className="map-picker-label">{label}</label>
        
        <div className="map-search-container">
          <div className="map-search-input-wrapper">
            <input
              type="text"
              className="map-search-input"
              placeholder="Search location in Tunisia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            />
            <button 
              className="map-search-button"
              onClick={searchLocation}
              disabled={isSearching}
            >
              {isSearching ? '...' : '🔍'}
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="map-search-results">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  className="map-search-result-item"
                  onClick={() => handleSearchResultSelect(result)}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {error && (
          <div className="map-picker-error">{error}</div>
        )}
        
        {selectedLocation && !error && (
          <div className="map-picker-selected">
            <strong>Selected:</strong> {selectedLocation}
          </div>
        )}
      </div>
      
      <div className="map-container" style={{ height: '300px', width: '100%' }}>
        <MapContainer
          center={TUNISIA_CENTER}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
        >
          <TileLayer
            attribution={MAPBOX_TOKEN 
              ? '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
            url={MAPBOX_TOKEN 
              ? `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            tileSize={MAPBOX_TOKEN ? 512 : 256}
            zoomOffset={MAPBOX_TOKEN ? -1 : 0}
          />
          <MapBounds />
          <MapEvents onClick={handleMapClick} />
          
          {/* Show Tunisia boundary circle for visual reference */}
          <Circle
            center={TUNISIA_CENTER}
            radius={300000}
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.05 }}
          />
          
          {markerPosition && (
            <Marker position={markerPosition} icon={defaultIcon}>
              <Popup>
                <div>
                  <strong>Selected Location</strong><br />
                  {selectedLocation || 'Location selected'}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      <div className="map-picker-instructions">
        <small>
          💡 <strong>Tip:</strong> Click anywhere on the map to select a location, or use the search box above.
          {MAPBOX_TOKEN 
            ? ' Using Mapbox for accurate locations (airports, hotels, landmarks).'
            : ' Using OpenStreetMap. Add Mapbox token for better search results.'}
        </small>
      </div>
    </div>
  );
};

export default MapPicker;
