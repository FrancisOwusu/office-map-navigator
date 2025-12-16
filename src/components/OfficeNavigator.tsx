import { useState, useEffect } from 'react';
import { Search, Navigation, MapPin, X, Home, Activity, RefreshCw, AlertCircle } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  category: string;
  x: number;
  y: number;
  zone: string;
  floor: string;
  lat: number;
  lng: number;
}

interface UserPosition {
  x: number;
  y: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface GeoPosition {
  latitude: number;
  longitude: number;
}

type PositioningStatus = 'requesting' | 'connected' | 'error';

const OfficeNavigator = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [geoPosition, setGeoPosition] = useState<GeoPosition | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [positioningStatus, setPositioningStatus] = useState<PositioningStatus>('requesting');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [navigationPath, setNavigationPath] = useState<Array<{ x: number; y: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  // Building reference coordinates (Munich office building)
  const buildingReference = {
    latitude: 48.1351, // Example coordinates for Munich
    longitude: 11.5820,
    name: 'MUC21-B1 Building'
  };

  // Building locations with coordinates
  const locations = [
    { id: 1, name: 'Gym', category: 'Amenity', x: 80, y: 50, zone: 'South Wing', floor: 'B1', lat: 48.1351, lng: 11.5822 },
    { id: 2, name: 'Interfaith Prayer Room - Women', category: 'Prayer', x: 70, y: 30, zone: 'Central', floor: 'B1', lat: 48.1352, lng: 11.5821 },
    { id: 3, name: 'Interfaith Prayer Room - Men', category: 'Prayer', x: 70, y: 70, zone: 'Central', floor: 'B1', lat: 48.1350, lng: 11.5821 },
    { id: 4, name: 'Massage Room', category: 'Wellness', x: 30, y: 45, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5818 },
    { id: 5, name: 'Changing Room - Men', category: 'Facility', x: 30, y: 55, zone: 'North Wing', floor: 'B1', lat: 48.1350, lng: 11.5818 },
    { id: 6, name: 'Changing Room - Women', category: 'Facility', x: 30, y: 35, zone: 'North Wing', floor: 'B1', lat: 48.1352, lng: 11.5818 },
    { id: 7, name: 'Toilet - Men', category: 'Restroom', x: 25, y: 50, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5817 },
    { id: 8, name: 'Toilet - Women', category: 'Restroom', x: 25, y: 40, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5817 },
    { id: 9, name: 'Shower - Men', category: 'Facility', x: 20, y: 50, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
    { id: 10, name: 'Shower - Women', category: 'Facility', x: 20, y: 40, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
    { id: 11, name: 'Shower - Accessible', category: 'Facility', x: 20, y: 45, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
    { id: 12, name: 'Bike Storage', category: 'Storage', x: 40, y: 20, zone: 'North Entry', floor: 'B1', lat: 48.1353, lng: 11.5819 },
    { id: 13, name: 'Bicycle Repair', category: 'Service', x: 15, y: 20, zone: 'North Entry', floor: 'B1', lat: 48.1353, lng: 11.5816 },
    { id: 14, name: 'Washing & Drying', category: 'Service', x: 22, y: 35, zone: 'North Wing', floor: 'B1', lat: 48.1352, lng: 11.5817 },
    { id: 15, name: 'Waste Centre', category: 'Service', x: 50, y: 80, zone: 'Central', floor: 'B1', lat: 48.1349, lng: 11.5820 },
    { id: 16, name: 'Recycle Point', category: 'Service', x: 48, y: 75, zone: 'Central', floor: 'B1', lat: 48.1349, lng: 11.5819 },
    { id: 17, name: 'Main Lobby', category: 'Entry', x: 60, y: 50, zone: 'Central', floor: 'B1', lat: 48.1351, lng: 11.5820 },
    { id: 18, name: 'Plant Room', category: 'Mechanical', x: 55, y: 60, zone: 'Central', floor: 'B1', lat: 48.1350, lng: 11.5820 },
    { id: 19, name: 'MPOE Room', category: 'Technical', x: 10, y: 15, zone: 'North Entry', floor: 'B1', lat: 48.1353, lng: 11.5815 },
    { id: 20, name: 'UPS', category: 'Technical', x: 65, y: 40, zone: 'Central', floor: 'B1', lat: 48.1352, lng: 11.5821 },
  ];

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert GPS coordinates to map coordinates
  const gpsToMapCoords = (lat: number, lng: number) => {
    const latRange = 0.0006; // Approximate building size in degrees
    const lngRange = 0.0008;
    
    const x = ((lng - (buildingReference.longitude - lngRange/2)) / lngRange) * 100;
    const y = ((buildingReference.latitude + latRange/2 - lat) / latRange) * 100;
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  // Initialize geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setPositioningStatus('error');
      return;
    }

    setPositioningStatus('requesting');

    // Request location permission and start watching position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: geoAccuracy } = position.coords;
        
        setGeoPosition({ latitude, longitude });
        setAccuracy(geoAccuracy);
        setPositioningStatus('connected');
        setError(null);

        // Convert GPS to map coordinates
        const mapCoords = gpsToMapCoords(latitude, longitude);
        setUserPosition({
          ...mapCoords,
          name: 'Your Location',
          latitude,
          longitude
        });
      },
      (err) => {
        setPositioningStatus('error');
        const errorMessage = err.message || '';
        
        // Handle CoreLocation-specific errors (macOS/iOS)
        if (errorMessage.includes('kCLErrorLocationUnknown') || 
            errorMessage.includes('CoreLocation') ||
            err.code === err.POSITION_UNAVAILABLE) {
          setError('Location unknown: Unable to determine your position. This often happens indoors or when GPS signal is weak. On macOS, ensure Location Services are enabled in System Settings > Privacy & Security > Location Services, and that your browser has location access.');
        } else {
          switch(err.code) {
            case err.PERMISSION_DENIED:
              setError('Location permission denied. Please enable location access in your browser settings and macOS System Settings > Privacy & Security > Location Services.');
              break;
            case err.POSITION_UNAVAILABLE:
              setError('Location information unavailable. Check that Location Services are enabled and your device can access GPS/WiFi positioning.');
              break;
            case err.TIMEOUT:
              setError('Location request timed out. Please try again or check your network connection.');
              break;
            default:
              setError(`Location error: ${errorMessage || 'Unable to determine your location. Ensure Location Services are enabled and try again.'}`);
          }
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, []);

  const calculateDistance = (loc: Location) => {
    if (!userPosition) return 0;
    const dx = loc.x - userPosition.x;
    const dy = loc.y - userPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate real-world distance using Haversine formula
  const calculateRealDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const generateNavigationPath = (destination: Location) => {
    if (!userPosition) return [];
    
    const start = userPosition;
    const end = destination;
    
    const midX = (start.x + end.x) / 2;
    
    return [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end
    ];
  };

  const getDirectionText = (loc: Location) => {
    if (!userPosition) return { direction: '', distance: 0, steps: [], realDistance: 0 };
    
    const dx = loc.x - userPosition.x;
    const dy = loc.y - userPosition.y;
    
    let horizontal = '';
    let vertical = '';
    
    if (Math.abs(dx) > 5) {
      horizontal = dx > 0 ? 'east' : 'west';
    }
    if (Math.abs(dy) > 5) {
      vertical = dy > 0 ? 'south' : 'north';
    }
    
    const direction = [vertical, horizontal].filter(Boolean).join('-');
    const distance = Math.round(calculateDistance(loc) * 2);
    
    // Calculate real-world distance if GPS coordinates are available
    let realDistance = distance;
    if (geoPosition && loc.lat && loc.lng) {
      realDistance = Math.round(calculateRealDistance(
        geoPosition.latitude,
        geoPosition.longitude,
        loc.lat,
        loc.lng
      ));
    }
    
    const steps = [];
    if (Math.abs(dx) > 2) {
      steps.push(`Head ${dx > 0 ? 'east' : 'west'} down the corridor`);
    }
    if (Math.abs(dy) > 2) {
      steps.push(`Turn ${dy > 0 ? 'south' : 'north'} at the intersection`);
    }
    steps.push(`Arrive at ${loc.name} on your ${loc.zone}`);
    
    return { direction: direction || 'at your location', distance, steps, realDistance };
  };

  const handleSelectLocation = (loc: Location) => {
    setSelectedLocation(loc);
    setShowDirections(true);
    setNavigationPath(generateNavigationPath(loc));
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    setShowDirections(false);
    setSearchQuery('');
    setNavigationPath([]);
  };

  const refreshPosition = () => {
    setPositioningStatus('requesting');
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: geoAccuracy } = position.coords;
        
        setGeoPosition({ latitude, longitude });
        setAccuracy(geoAccuracy);
        setPositioningStatus('connected');

        const mapCoords = gpsToMapCoords(latitude, longitude);
        setUserPosition({
          ...mapCoords,
          name: 'Your Location',
          latitude,
          longitude
        });
      },
      (err) => {
        setPositioningStatus('error');
        const errorMessage = err.message || '';
        
        if (errorMessage.includes('kCLErrorLocationUnknown') || 
            errorMessage.includes('CoreLocation') ||
            err.code === err.POSITION_UNAVAILABLE) {
          setError('Location unknown: Unable to determine your position. On macOS, check System Settings > Privacy & Security > Location Services.');
        } else {
          setError('Unable to refresh location. Please check your settings and ensure Location Services are enabled.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  };

  const requestPermission = () => {
    refreshPosition();
  };

  const getStatusColor = () => {
    switch(positioningStatus) {
      case 'connected': return 'text-green-600';
      case 'requesting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Geolocation Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">MUC21-B1 Navigator</h1>
              <p className="text-gray-600">Basement Level 1 - Munich Office</p>
            </div>
            <Home className="w-8 h-8 text-indigo-600" />
          </div>

          {/* Geolocation Status Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-5 h-5 ${getStatusColor()}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      GPS Indoor Positioning
                    </p>
                    <p className="text-xs text-gray-600">
                      {positioningStatus === 'connected' && `Active • Accuracy: ${accuracy ? accuracy.toFixed(1) : '?'}m`}
                      {positioningStatus === 'requesting' && 'Requesting location permission...'}
                      {positioningStatus === 'error' && 'Location unavailable'}
                    </p>
                    {geoPosition && positioningStatus === 'connected' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Lat: {geoPosition.latitude.toFixed(6)}, Lng: {geoPosition.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
                
                {positioningStatus === 'connected' && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    <Activity className="w-3 h-3" />
                    <span>Live tracking</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={refreshPosition}
                className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Refresh position"
                disabled={positioningStatus === 'requesting'}
              >
                <RefreshCw className={`w-4 h-4 text-indigo-600 ${positioningStatus === 'requesting' ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800 mb-1">Location Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
                
                {positioningStatus === 'error' && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs font-semibold text-red-800 mb-2">Troubleshooting Steps:</p>
                    <ul className="text-xs text-red-700 space-y-1 ml-4 list-disc">
                      <li>On macOS: System Settings → Privacy & Security → Location Services → Enable for your browser</li>
                      <li>Grant location permission when your browser prompts you</li>
                      <li>Ensure WiFi is enabled (helps with indoor positioning)</li>
                      <li>Try moving to a location with better GPS signal (near a window)</li>
                      <li>Refresh the page and allow location access again</li>
                    </ul>
                    <button
                      onClick={requestPermission}
                      className="mt-3 text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                    >
                      Retry Location Access
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for gym, toilets, prayer room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Locations List */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Locations</h2>
              {filteredLocations.length > 0 ? (
                <div className="space-y-2">
                  {filteredLocations.map(loc => {
                    const { realDistance } = getDirectionText(loc);
                    return (
                      <button
                        key={loc.id}
                        onClick={() => handleSelectLocation(loc)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedLocation?.id === loc.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-50 hover:bg-indigo-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{loc.name}</div>
                            <div className={`text-sm ${selectedLocation?.id === loc.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                              {loc.category} • {loc.zone}
                            </div>
                            {userPosition && geoPosition && (
                              <div className={`text-xs mt-1 ${selectedLocation?.id === loc.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                                ~{realDistance}m away
                              </div>
                            )}
                          </div>
                          <MapPin className={`w-5 h-5 flex-shrink-0 ml-2 ${selectedLocation?.id === loc.id ? 'text-white' : 'text-indigo-600'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No locations found</p>
              )}
            </div>
          </div>

          {/* Map & Navigation */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Interactive Map */}
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 overflow-hidden" style={{ height: '400px' }}>
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                    </pattern>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />
                  
                  {/* Building zones */}
                  <rect x="10" y="10" width="30" height="80" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" rx="2" />
                  <rect x="45" y="20" width="30" height="60" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" rx="2" />
                  <rect x="80" y="30" width="15" height="40" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.5" rx="2" />

                  {/* Navigation path */}
                  {navigationPath.length > 0 && (
                    <polyline
                      points={navigationPath.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.7"
                    />
                  )}

                  {/* User position with accuracy circle */}
                  {userPosition && positioningStatus === 'connected' && (
                    <g>
                      {/* Accuracy radius (scaled for visualization) */}
                      {accuracy && (
                        <circle
                          cx={userPosition.x}
                          cy={userPosition.y}
                          r={Math.min(accuracy / 3, 10)}
                          fill="#10b981"
                          opacity="0.1"
                          stroke="#10b981"
                          strokeWidth="0.3"
                          strokeDasharray="2,2"
                        />
                      )}
                      
                      {/* User marker */}
                      <circle cx={userPosition.x} cy={userPosition.y} r="2.5" fill="#10b981" stroke="#fff" strokeWidth="0.8" filter="url(#glow)" />
                      
                      {/* Pulse animation */}
                      <circle cx={userPosition.x} cy={userPosition.y} r="4" fill="#10b981" opacity="0.3">
                        <animate attributeName="r" from="4" to="8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}

                  {/* Location markers */}
                  {locations.map(loc => (
                    <g key={loc.id}>
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r={selectedLocation?.id === loc.id ? "3" : "2"}
                        fill={selectedLocation?.id === loc.id ? "#4f46e5" : "#6366f1"}
                        stroke="#fff"
                        strokeWidth="0.5"
                        className="cursor-pointer transition-all"
                        onClick={() => handleSelectLocation(loc)}
                        style={{ filter: selectedLocation?.id === loc.id ? 'url(#glow)' : 'none' }}
                      />
                      {selectedLocation?.id === loc.id && (
                        <text
                          x={loc.x}
                          y={loc.y - 5}
                          fontSize="3"
                          fill="#1f2937"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {loc.name}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-md">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-700">You (GPS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                      <span className="text-gray-700">Destinations</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Turn-by-Turn Navigation */}
              {showDirections && selectedLocation ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Navigation className="w-6 h-6 text-indigo-600" />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{selectedLocation.name}</h3>
                        <p className="text-sm text-gray-600">{selectedLocation.category} • {selectedLocation.zone}</p>
                      </div>
                    </div>
                    <button onClick={clearSelection} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Direction</p>
                          <p className="font-semibold text-gray-800 capitalize">{getDirectionText(selectedLocation).direction}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Navigation className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Distance</p>
                          <p className="font-semibold text-gray-800">{getDirectionText(selectedLocation).realDistance}m</p>
                        </div>
                      </div>
                    </div>

                    {/* Turn-by-turn steps */}
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Turn-by-turn directions:</p>
                      <ol className="space-y-2">
                        {getDirectionText(selectedLocation).steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Live navigation:</strong> Your position updates automatically via GPS. Follow the blue dotted path on the map.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Select a location for turn-by-turn navigation</p>
                  {positioningStatus === 'connected' ? (
                    <p className="text-sm mt-1">Your position is being tracked via GPS</p>
                  ) : positioningStatus === 'error' ? (
                    <p className="text-sm mt-1 text-red-600">Enable location to see your position</p>
                  ) : (
                    <p className="text-sm mt-1 text-yellow-600">Waiting for location permission...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integration Info Footer */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">Powered by Browser Geolocation API</p>
              <p className="mb-2">This system uses your device's GPS for real-time location tracking. Enable location permissions for accurate indoor positioning. Works best with WiFi and GPS enabled together.</p>
              {positioningStatus === 'error' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <p className="font-semibold text-yellow-800 mb-1">macOS Users:</p>
                  <p className="text-yellow-700">If you see "kCLErrorLocationUnknown", this means CoreLocation cannot determine your position. Go to <strong>System Settings → Privacy & Security → Location Services</strong> and ensure both Location Services and your browser are enabled.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficeNavigator;

