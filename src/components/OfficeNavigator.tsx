import { useState, useEffect } from 'react';
import { Search, Navigation, MapPin, X, Home, Activity, RefreshCw, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Location {
  id: string | number;
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
  const [selectedFloor, setSelectedFloor] = useState<string>('All'); // 'All', 'Ground', 'B1'
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [placedCoordinate, setPlacedCoordinate] = useState<{ x: number; y: number; lat?: number; lng?: number } | null>(null);
  const [routeSteps, setRouteSteps] = useState<Array<{ instruction: string; distance: number; point: { x: number; y: number } }>>([]);
  const [isPlacingMode, setIsPlacingMode] = useState(false);

  // Building reference coordinates (Munich office building)
  const buildingReference = {
    latitude: 48.1351, // Example coordinates for Munich
    longitude: 11.5820,
    name: 'MUC21-B1 Building'
  };

  // Building locations with coordinates
    // Building locations with coordinates
    const locations = [
      // === GROUND FLOOR ===
  
      // Entry & Reception
      { id: 'G001', name: 'Reception', category: 'Reception', x: 50, y: 50, zone: 'Central', floor: 'Ground', lat: 48.1351, lng: 11.5820 },
      { id: 'G002', name: 'Lobby', category: 'Circulation', x: 45, y: 50, zone: 'Central', floor: 'Ground', lat: 48.1351, lng: 11.5819 },
      { id: 'G003', name: 'Badging', category: 'Security', x: 48, y: 48, zone: 'Central', floor: 'Ground', lat: 48.1351, lng: 11.5820 },
  
      // Meeting & Interview Spaces
      { id: 'G004', name: 'Interview Suite', category: 'Meeting', x: 40, y: 35, zone: 'West Wing', floor: 'Ground', lat: 48.1352, lng: 11.5819 },
      { id: 'G005', name: 'Interview', category: 'Meeting', x: 55, y: 45, zone: 'Central', floor: 'Ground', lat: 48.1351, lng: 11.5821 },
      { id: 'G006', name: 'Multi-Purpose Room', category: 'Meeting', x: 52, y: 42, zone: 'Central', floor: 'Ground', lat: 48.1352, lng: 11.5820 },
      { id: 'G007', name: 'PR Video Suite', category: 'Media', x: 58, y: 40, zone: 'East Wing', floor: 'Ground', lat: 48.1352, lng: 11.5821 },
      { id: 'G008', name: 'Conference', category: 'Meeting', x: 35, y: 60, zone: 'West Wing', floor: 'Ground', lat: 48.1350, lng: 11.5818 },
      { id: 'G009', name: 'Prime Video Theater', category: 'Media', x: 38, y: 62, zone: 'West Wing', floor: 'Ground', lat: 48.1350, lng: 11.5819 },
      { id: 'G010', name: 'Casual Conference', category: 'Meeting', x: 42, y: 65, zone: 'Central', floor: 'Ground', lat: 48.1349, lng: 11.5819 },
  
      // Work Spaces
      { id: 'G011', name: 'Business Service Center', category: 'Work', x: 38, y: 35, zone: 'West Wing', floor: 'Ground', lat: 48.1352, lng: 11.5819 },
      { id: 'G012', name: 'Work Room', category: 'Work', x: 43, y: 40, zone: 'Central', floor: 'Ground', lat: 48.1352, lng: 11.5819 },
      { id: 'G013', name: 'IT Workroom', category: 'Work', x: 45, y: 68, zone: 'Central', floor: 'Ground', lat: 48.1349, lng: 11.5820 },
      { id: 'G014', name: 'Office', category: 'Work', x: 30, y: 30, zone: 'West Wing', floor: 'Ground', lat: 48.1353, lng: 11.5817 },
      { id: 'G015', name: 'Scrum', category: 'Work', x: 48, y: 67, zone: 'Central', floor: 'Ground', lat: 48.1349, lng: 11.5820 },
      { id: 'G016', name: 'Study', category: 'Work', x: 55, y: 72, zone: 'East Wing', floor: 'Ground', lat: 48.1348, lng: 11.5821 },
  
      // Phone Booths & Focus
      { id: 'G017', name: 'Phone Booth', category: 'Focus', x: 50, y: 68, zone: 'Central', floor: 'Ground', lat: 48.1349, lng: 11.5820 },
      { id: 'G018', name: 'Focus', category: 'Focus', x: 52, y: 70, zone: 'Central', floor: 'Ground', lat: 48.1349, lng: 11.5821 },
      { id: 'G019', name: 'Huddle', category: 'Meeting', x: 65, y: 55, zone: 'East Wing', floor: 'Ground', lat: 48.1350, lng: 11.5823 },
      { id: 'G020', name: 'Workpod', category: 'Focus', x: 68, y: 58, zone: 'East Wing', floor: 'Ground', lat: 48.1350, lng: 11.5823 },
  
      // Collaboration
      { id: 'G021', name: 'Touch & Go', category: 'Collaboration', x: 60, y: 75, zone: 'East Wing', floor: 'Ground', lat: 48.1348, lng: 11.5822 },
      { id: 'G022', name: 'Touch Down', category: 'Collaboration', x: 62, y: 52, zone: 'East Wing', floor: 'Ground', lat: 48.1351, lng: 11.5822 },
      { id: 'G023', name: 'Breakout', category: 'Collaboration', x: 58, y: 78, zone: 'East Wing', floor: 'Ground', lat: 48.1348, lng: 11.5821 },
      { id: 'G024', name: 'Break Out', category: 'Collaboration', x: 72, y: 65, zone: 'East Wing', floor: 'Ground', lat: 48.1349, lng: 11.5824 },
      { id: 'G025', name: 'Booth', category: 'Collaboration', x: 55, y: 80, zone: 'Central', floor: 'Ground', lat: 48.1347, lng: 11.5821 },
  
      // Food & Beverage
      { id: 'G026', name: 'Cafe', category: 'Food', x: 65, y: 78, zone: 'East Wing', floor: 'Ground', lat: 48.1348, lng: 11.5823 },
      { id: 'G027', name: 'Coffee Shop', category: 'Food', x: 57, y: 82, zone: 'Central', floor: 'Ground', lat: 48.1347, lng: 11.5821 },
      { id: 'G028', name: 'Coffee', category: 'Food', x: 48, y: 52, zone: 'Central', floor: 'Ground', lat: 48.1351, lng: 11.5820 },
      { id: 'G029', name: 'Pantry', category: 'Food', x: 60, y: 38, zone: 'East Wing', floor: 'Ground', lat: 48.1352, lng: 11.5822 },
      { id: 'G030', name: 'Kitchen', category: 'Food', x: 62, y: 35, zone: 'East Wing', floor: 'Ground', lat: 48.1352, lng: 11.5822 },
      { id: 'G031', name: 'Catering', category: 'Food', x: 64, y: 33, zone: 'East Wing', floor: 'Ground', lat: 48.1353, lng: 11.5822 },
      { id: 'G032', name: 'Catering Prep', category: 'Food', x: 25, y: 45, zone: 'West Wing', floor: 'Ground', lat: 48.1351, lng: 11.5817 },
      { id: 'G033', name: 'Catering Area', category: 'Food', x: 70, y: 68, zone: 'East Wing', floor: 'Ground', lat: 48.1349, lng: 11.5824 },
  
      // Restrooms - Ground
      { id: 'G042', name: 'Toilet - Men', category: 'Restroom', x: 68, y: 32, zone: 'East Wing', floor: 'Ground', lat: 48.1353, lng: 11.5823 },
      { id: 'G043', name: 'Toilet - Women', category: 'Restroom', x: 58, y: 42, zone: 'East Wing', floor: 'Ground', lat: 48.1352, lng: 11.5821 },
      { id: 'G044', name: 'Toilet - Accessible', category: 'Restroom', x: 52, y: 48, zone: 'Central', floor: 'Ground', lat: 48.1351, lng: 11.5820 },
      { id: 'G045', name: 'Toilet - All Gender', category: 'Restroom', x: 60, y: 40, zone: 'East Wing', floor: 'Ground', lat: 48.1352, lng: 11.5822 },
  
      // Training
      { id: 'G052', name: 'Training', category: 'Training', x: 20, y: 40, zone: 'West Wing', floor: 'Ground', lat: 48.1352, lng: 11.5816 },
  
      // Amenities
      { id: 'G056', name: 'Courtyard', category: 'Outdoor', x: 32, y: 35, zone: 'West Wing', floor: 'Ground', lat: 48.1352, lng: 11.5818 },
      { id: 'G057', name: 'Vending Area', category: 'Amenity', x: 62, y: 80, zone: 'East Wing', floor: 'Ground', lat: 48.1347, lng: 11.5822 },
  
      // === B1 FLOOR ===
      // Gym & Fitness
      { id: 'B001', name: 'Gym', category: 'Amenity', x: 80, y: 50, zone: 'South Wing', floor: 'B1', lat: 48.1351, lng: 11.5822 },
  
      // Prayer & Wellness
      { id: 'B002', name: 'Interfaith Prayer Room - Women', category: 'Prayer', x: 70, y: 30, zone: 'Central', floor: 'B1', lat: 48.1352, lng: 11.5821 },
      { id: 'B003', name: 'Interfaith Prayer Room - Men', category: 'Prayer', x: 70, y: 70, zone: 'Central', floor: 'B1', lat: 48.1350, lng: 11.5821 },
      { id: 'B004', name: 'Ablution Room', category: 'Prayer', x: 68, y: 35, zone: 'Central', floor: 'B1', lat: 48.1352, lng: 11.5821 },
      { id: 'B005', name: 'Massage Room', category: 'Wellness', x: 30, y: 45, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5818 },
  
      // Changing Rooms
      { id: 'B006', name: 'Changing Room - Men', category: 'Facility', x: 30, y: 55, zone: 'North Wing', floor: 'B1', lat: 48.1350, lng: 11.5818 },
      { id: 'B007', name: 'Changing Room - Women', category: 'Facility', x: 30, y: 35, zone: 'North Wing', floor: 'B1', lat: 48.1352, lng: 11.5818 },
      { id: 'B008', name: 'Change - Men', category: 'Facility', x: 82, y: 45, zone: 'South Wing', floor: 'B1', lat: 48.1351, lng: 11.5823 },
      { id: 'B009', name: 'Change - Women', category: 'Facility', x: 82, y: 55, zone: 'South Wing', floor: 'B1', lat: 48.1350, lng: 11.5823 },
      { id: 'B010', name: 'FM Change - Men', category: 'Facility', x: 78, y: 42, zone: 'South Wing', floor: 'B1', lat: 48.1352, lng: 11.5822 },
      { id: 'B011', name: 'FM Change - Women', category: 'Facility', x: 78, y: 58, zone: 'South Wing', floor: 'B1', lat: 48.1350, lng: 11.5822 },
  
      // Restrooms - B1
      { id: 'B012', name: 'Toilet - Men', category: 'Restroom', x: 25, y: 50, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5817 },
      { id: 'B013', name: 'Toilet - Women', category: 'Restroom', x: 25, y: 40, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5817 },
  
      // Showers
      { id: 'B014', name: 'Shower - Men', category: 'Facility', x: 20, y: 50, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
      { id: 'B015', name: 'Shower - Women', category: 'Facility', x: 20, y: 40, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
      { id: 'B016', name: 'Shower - Accessible', category: 'Facility', x: 22, y: 45, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
  
      // Bicycle Facilities
      { id: 'B017', name: 'Bike Storage', category: 'Storage', x: 45, y: 35, zone: 'Central', floor: 'B1', lat: 48.1352, lng: 11.5820 },
      { id: 'B018', name: 'Bicycle Repair', category: 'Service', x: 15, y: 45, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5815 },
  
      // Utility & Service
      { id: 'B019', name: 'Washing & Drying', category: 'Service', x: 18, y: 38, zone: 'North Wing', floor: 'B1', lat: 48.1352, lng: 11.5816 },
      { id: 'B020', name: 'Waste Centre', category: 'Service', x: 60, y: 60, zone: 'East Wing', floor: 'B1', lat: 48.1350, lng: 11.5822 },
      { id: 'B021', name: 'Recycle Point', category: 'Service', x: 58, y: 55, zone: 'East Wing', floor: 'B1', lat: 48.1350, lng: 11.5821 },
  
      // Technical
      { id: 'B026', name: 'Plant Room', category: 'Technical', x: 40, y: 40, zone: 'Central', floor: 'B1', lat: 48.1352, lng: 11.5819 },
      { id: 'B029', name: 'Transformer', category: 'Technical', x: 72, y: 52, zone: 'South Wing', floor: 'B1', lat: 48.1351, lng: 11.5822 },
      { id: 'B030', name: 'MPOE Room', category: 'Technical', x: 12, y: 42, zone: 'North Wing', floor: 'B1', lat: 48.1352, lng: 11.5815 },
      { id: 'B031', name: 'IDF', category: 'Technical', x: 65, y: 40, zone: 'East Wing', floor: 'B1', lat: 48.1352, lng: 11.5821 },
      { id: 'B032', name: 'UPS', category: 'Technical', x: 68, y: 42, zone: 'East Wing', floor: 'B1', lat: 48.1352, lng: 11.5821 },
    ];
  // const locations = [
  //   { id: 1, name: 'Gym', category: 'Amenity', x: 80, y: 50, zone: 'South Wing', floor: 'B1', lat: 48.1351, lng: 11.5822 },
  //   { id: 2, name: 'Interfaith Prayer Room - Women', category: 'Prayer', x: 70, y: 30, zone: 'Central', floor: 'B1', lat: 48.1352, lng: 11.5821 },
  //   { id: 3, name: 'Interfaith Prayer Room - Men', category: 'Prayer', x: 70, y: 70, zone: 'Central', floor: 'B1', lat: 48.1350, lng: 11.5821 },
  //   { id: 4, name: 'Massage Room', category: 'Wellness', x: 30, y: 45, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5818 },
  //   { id: 5, name: 'Changing Room - Men', category: 'Facility', x: 30, y: 55, zone: 'North Wing', floor: 'B1', lat: 48.1350, lng: 11.5818 },
  //   { id: 6, name: 'Changing Room - Women', category: 'Facility', x: 30, y: 35, zone: 'North Wing', floor: 'B1', lat: 48.1352, lng: 11.5818 },
  //   { id: 7, name: 'Toilet - Men', category: 'Restroom', x: 25, y: 50, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5817 },
  //   { id: 8, name: 'Toilet - Women', category: 'Restroom', x: 25, y: 40, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5817 },
  //   { id: 9, name: 'Shower - Men', category: 'Facility', x: 20, y: 50, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
  //   { id: 10, name: 'Shower - Women', category: 'Facility', x: 20, y: 40, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
  //   { id: 11, name: 'Shower - Accessible', category: 'Facility', x: 20, y: 45, zone: 'North Wing', floor: 'B1', lat: 48.1351, lng: 11.5816 },
  //   { id: 12, name: 'Bike Storage', category: 'Storage', x: 40, y: 20, zone: 'North Entry', floor: 'B1', lat: 48.1353, lng: 11.5819 },
  //   { id: 13, name: 'Bicycle Repair', category: 'Service', x: 15, y: 20, zone: 'North Entry', floor: 'B1', lat: 48.1353, lng: 11.5816 },
  //   { id: 14, name: 'Washing & Drying', category: 'Service', x: 22, y: 35, zone: 'North Wing', floor: 'B1', lat: 48.1352, lng: 11.5817 },
  //   { id: 15, name: 'Waste Centre', category: 'Service', x: 50, y: 80, zone: 'Central', floor: 'B1', lat: 48.1349, lng: 11.5820 },
  //   { id: 16, name: 'Recycle Point', category: 'Service', x: 48, y: 75, zone: 'Central', floor: 'B1', lat: 48.1349, lng: 11.5819 },
  //   { id: 17, name: 'Main Lobby', category: 'Entry', x: 60, y: 50, zone: 'Central', floor: 'B1', lat: 48.1351, lng: 11.5820 },
  //   { id: 18, name: 'Plant Room', category: 'Mechanical', x: 55, y: 60, zone: 'Central', floor: 'B1', lat: 48.1350, lng: 11.5820 },
  //   { id: 19, name: 'MPOE Room', category: 'Technical', x: 10, y: 15, zone: 'North Entry', floor: 'B1', lat: 48.1353, lng: 11.5815 },
  //   { id: 20, name: 'UPS', category: 'Technical', x: 65, y: 40, zone: 'Central', floor: 'B1', lat: 48.1352, lng: 11.5821 },
  // ];

  const filteredLocations = locations.filter(loc => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      loc.name.toLowerCase().includes(query) ||
      loc.category.toLowerCase().includes(query) ||
      loc.id.toString().toLowerCase().includes(query) ||
      loc.zone.toLowerCase().includes(query);
    const matchesFloor = selectedFloor === 'All' || loc.floor === selectedFloor;
    return matchesSearch && matchesFloor;
  });

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
    
    const start = { x: userPosition.x, y: userPosition.y };
    const end = { x: destination.x, y: destination.y };
    
    const path: Array<{ x: number; y: number }> = [start];
    
    // Check if floor change is needed based on selected floor filter
    const needsFloorChange = selectedFloor !== 'All' && selectedFloor !== destination.floor;
    
    // If different floors, add floor change transition point
    if (needsFloorChange) {
      // Find nearest elevator/stairwell (approximate center)
      const transitionPoint = { x: 50, y: 50 };
      path.push(transitionPoint);
    }
    
    // Generate path with intermediate waypoints for more realistic navigation
    const dx = end.x - (needsFloorChange ? 50 : start.x);
    const dy = end.y - (needsFloorChange ? 50 : start.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If distance is significant, add intermediate waypoints
    if (distance > 20) {
      const steps = Math.ceil(distance / 15); // Waypoint every ~15 units
      const startX = needsFloorChange ? 50 : start.x;
      const startY = needsFloorChange ? 50 : start.y;
      
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const waypoint = {
          x: startX + dx * t,
          y: startY + dy * t
        };
        path.push(waypoint);
      }
    }
    
    path.push(end);
    return path;
  };

  // Calculate viewBox to fit both user position and selected location
  const calculateViewBox = (loc: Location | null, userPos: UserPosition | null) => {
    if (!loc) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }

    const padding = 15; // Padding around the view
    
    if (!userPos) {
      // If no user position, zoom to just the location
      const finalWidth = 30;
      const finalHeight = 30;
      return {
        x: Math.max(0, Math.min(100 - finalWidth, loc.x - finalWidth / 2)),
        y: Math.max(0, Math.min(100 - finalHeight, loc.y - finalHeight / 2)),
        width: finalWidth,
        height: finalHeight
      };
    }

    const minX = Math.min(loc.x, userPos.x) - padding;
    const maxX = Math.max(loc.x, userPos.x) + padding;
    const minY = Math.min(loc.y, userPos.y) - padding;
    const maxY = Math.max(loc.y, userPos.y) + padding;

    const width = maxX - minX;
    const height = maxY - minY;

    // Ensure minimum size
    const minSize = 30;
    const finalWidth = Math.max(width, minSize);
    const finalHeight = Math.max(height, minSize);

    // Center the view
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const finalX = centerX - finalWidth / 2;
    const finalY = centerY - finalHeight / 2;

    return {
      x: Math.max(0, Math.min(100 - finalWidth, finalX)),
      y: Math.max(0, Math.min(100 - finalHeight, finalY)),
      width: Math.min(finalWidth, 100),
      height: Math.min(finalHeight, 100)
    };
  };

  // Reset view to show entire map
  const resetView = () => {
    setViewBox({ x: 0, y: 0, width: 100, height: 100 });
    setZoomLevel(1);
  };

  // Zoom in/out functions
  const zoomIn = () => {
    const newWidth = Math.max(5, viewBox.width * 0.7);
    const newHeight = Math.max(5, viewBox.height * 0.7);
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    
    setViewBox({
      x: Math.max(0, Math.min(100 - newWidth, centerX - newWidth / 2)),
      y: Math.max(0, Math.min(100 - newHeight, centerY - newHeight / 2)),
      width: newWidth,
      height: newHeight
    });
    setZoomLevel(100 / newWidth);
  };

  const zoomOut = () => {
    const newWidth = Math.min(100, viewBox.width * 1.4);
    const newHeight = Math.min(100, viewBox.height * 1.4);
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    
    setViewBox({
      x: Math.max(0, Math.min(100 - newWidth, centerX - newWidth / 2)),
      y: Math.max(0, Math.min(100 - newHeight, centerY - newHeight / 2)),
      width: newWidth,
      height: newHeight
    });
    setZoomLevel(100 / newWidth);
  };

  // Manual zoom to selected location (optional)
  const zoomToSelected = () => {
    if (selectedLocation) {
      const newViewBox = calculateViewBox(selectedLocation, userPosition);
      setViewBox(newViewBox);
      setZoomLevel(100 / newViewBox.width);
    }
  };

  // Handle map click to place coordinate
  const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isPlacingMode) return;
    
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const point = svg.createSVGPoint();
    point.x = event.clientX - rect.left;
    point.y = event.clientY - rect.top;
    
    // Convert screen coordinates to viewBox coordinates
    const svgWidth = rect.width;
    const svgHeight = rect.height;
    const viewBoxX = viewBox.x + (point.x / svgWidth) * viewBox.width;
    const viewBoxY = viewBox.y + (point.y / svgHeight) * viewBox.height;
    
    // Convert to GPS coordinates (approximate)
    const latRange = 0.0006;
    const lngRange = 0.0008;
    const lat = buildingReference.latitude + latRange/2 - (viewBoxY / 100) * latRange;
    const lng = buildingReference.longitude - lngRange/2 + (viewBoxX / 100) * lngRange;
    
    const newCoordinate = { x: viewBoxX, y: viewBoxY, lat, lng };
    setPlacedCoordinate(newCoordinate);
    setIsPlacingMode(false);
    
    // Generate route and directions
    if (userPosition) {
      generateRouteToCoordinate(newCoordinate);
    }
  };

  // Generate route with waypoints and turn-by-turn directions
  const generateRouteToCoordinate = (destination: { x: number; y: number }) => {
    if (!userPosition) return;
    
    const start = { x: userPosition.x, y: userPosition.y };
    const end = destination;
    
    // Generate waypoints for a more realistic route
    const waypoints: Array<{ x: number; y: number; instruction?: string }> = [];
    const steps: Array<{ instruction: string; distance: number; point: { x: number; y: number } }> = [];
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const totalDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate number of waypoints based on distance
    const numWaypoints = Math.max(2, Math.ceil(totalDistance / 20));
    
    // Generate intermediate waypoints
    for (let i = 1; i < numWaypoints; i++) {
      const t = i / numWaypoints;
      const waypoint = {
        x: start.x + dx * t,
        y: start.y + dy * t
      };
      waypoints.push(waypoint);
    }
    
    // Build route path
    const routePath = [start, ...waypoints, end];
    
    // Generate turn-by-turn directions
    let cumulativeDistance = 0;
    for (let i = 0; i < routePath.length - 1; i++) {
      const current = routePath[i];
      const next = routePath[i + 1];
      const segmentDx = next.x - current.x;
      const segmentDy = next.y - current.y;
      const segmentDistance = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);
      
      let instruction = '';
      if (i === 0) {
        // First step
        if (Math.abs(segmentDx) > Math.abs(segmentDy)) {
          instruction = `Head ${segmentDx > 0 ? 'east' : 'west'}`;
        } else {
          instruction = `Head ${segmentDy > 0 ? 'south' : 'north'}`;
        }
      } else {
        // Calculate turn direction
        const prev = routePath[i - 1];
        const prevDx = current.x - prev.x;
        const prevDy = current.y - prev.y;
        
        const angle = Math.atan2(segmentDy, segmentDx) - Math.atan2(prevDy, prevDx);
        const degrees = (angle * 180) / Math.PI;
        
        if (Math.abs(degrees) < 30) {
          instruction = 'Continue straight';
        } else if (degrees > 0) {
          instruction = `Turn right`;
        } else {
          instruction = `Turn left`;
        }
        
        if (Math.abs(segmentDx) > Math.abs(segmentDy)) {
          instruction += ` and head ${segmentDx > 0 ? 'east' : 'west'}`;
        } else {
          instruction += ` and head ${segmentDy > 0 ? 'south' : 'north'}`;
        }
      }
      
      const distanceMeters = Math.round(segmentDistance * 2);
      cumulativeDistance += distanceMeters;
      
      steps.push({
        instruction: `${instruction} for ${distanceMeters}m`,
        distance: cumulativeDistance,
        point: next
      });
    }
    
    // Final step
    steps.push({
      instruction: `Arrive at your destination`,
      distance: Math.round(totalDistance * 2),
      point: end
    });
    
    setRouteSteps(steps);
    setNavigationPath(routePath);
    setShowDirections(true);
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
    
    // Generate detailed step-by-step directions
    const steps: string[] = [];
    
    // Determine if floor change is needed based on selected floor filter
    // If user is viewing a specific floor and destination is different, need floor change
    const needsFloorChange = selectedFloor !== 'All' && selectedFloor !== loc.floor;
    
    // Step 1: Floor change if needed
    if (needsFloorChange) {
      const currentFloor = selectedFloor;
      steps.push(`Go to the ${currentFloor === 'Ground' ? 'elevator' : 'stairs'} in the central area`);
      steps.push(`Take ${loc.floor === 'Ground' ? 'up' : 'down'} to ${loc.floor} floor`);
    }
    
    // Step 2: Initial direction
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    if (absDx > absDy && absDx > 5) {
      const direction = dx > 0 ? 'east' : 'west';
      const distanceEst = Math.round(absDx / 2);
      steps.push(`Head ${direction} for approximately ${distanceEst} meters`);
    } else if (absDy > 5) {
      const direction = dy > 0 ? 'south' : 'north';
      const distanceEst = Math.round(absDy / 2);
      steps.push(`Head ${direction} for approximately ${distanceEst} meters`);
    }
    
    // Step 3: Zone information
    if (loc.zone) {
      steps.push(`Continue into the ${loc.zone} zone`);
    }
    
    // Step 4: Final approach
    if (absDx > 5 && absDy > 5) {
      // Need to turn
      if (absDx > absDy) {
        const turnDir = dy > 0 ? 'south' : 'north';
        steps.push(`Turn ${turnDir} and continue for approximately ${Math.round(absDy / 2)} meters`);
      } else {
        const turnDir = dx > 0 ? 'east' : 'west';
        steps.push(`Turn ${turnDir} and continue for approximately ${Math.round(absDx / 2)} meters`);
      }
    }
    
    // Step 5: Arrival
    steps.push(`You have arrived at ${loc.name} (${loc.id})`);
    steps.push(`Location: ${loc.category} in the ${loc.zone} zone`);
    
    return { direction: direction || 'at your location', distance, steps, realDistance };
  };

  const handleSelectLocation = (loc: Location) => {
    setSelectedLocation(loc);
    setShowDirections(true);
    setNavigationPath(generateNavigationPath(loc));
    // Clear placed coordinate when selecting a location
    setPlacedCoordinate(null);
    setRouteSteps([]);
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    setShowDirections(false);
    setSearchQuery('');
    setNavigationPath([]);
    setPlacedCoordinate(null);
    setRouteSteps([]);
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
              <h1 className="text-3xl font-bold text-gray-800">MUC21 Navigator</h1>
              <p className="text-gray-600">
                {selectedFloor === 'All' ? 'Ground Floor & Basement Level 1' : 
                 selectedFloor === 'Ground' ? 'Ground Floor' : 
                 'Basement Level 1'} - Munich Office
              </p>
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

          {/* Floor Selector */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setSelectedFloor('All')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFloor === 'All'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Floors
            </button>
            <button
              onClick={() => setSelectedFloor('Ground')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFloor === 'Ground'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ground Floor
            </button>
            <button
              onClick={() => setSelectedFloor('B1')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFloor === 'B1'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              B1 Floor
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID (e.g., G001, B012) or name (e.g., gym, toilets, prayer room)..."
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{loc.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                                selectedLocation?.id === loc.id 
                                  ? 'bg-indigo-500 text-white' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {loc.id}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                loc.floor === 'Ground' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {loc.floor}
                              </span>
                            </div>
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
                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 z-10 bg-white bg-opacity-95 rounded-lg shadow-lg p-2">
                  <div className="flex flex-col gap-2">
                    {selectedLocation && (
                      <button
                        onClick={zoomToSelected}
                        className="p-2 hover:bg-green-50 rounded transition-colors border border-green-200"
                        title="Zoom to Selected Location"
                      >
                        <MapPin className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={zoomIn}
                      disabled={viewBox.width < 10}
                      className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={zoomOut}
                      disabled={viewBox.width >= 100}
                      className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={resetView}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Reset View (Show All)"
                    >
                      <Maximize2 className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-center text-gray-600">
                    {zoomLevel.toFixed(1)}x
                  </div>
                </div>

                {/* Place Coordinate Button */}
                <div className="absolute top-4 left-4 z-10">
                  <button
                    onClick={() => {
                      setIsPlacingMode(!isPlacingMode);
                      if (isPlacingMode) {
                        setPlacedCoordinate(null);
                        setRouteSteps([]);
                        setNavigationPath([]);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg shadow-lg transition-colors ${
                      isPlacingMode 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    title={isPlacingMode ? 'Click on map to place coordinate' : 'Enable placing mode'}
                  >
                    {isPlacingMode ? (
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Click Map to Place</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Place Coordinate</span>
                      </span>
                    )}
                  </button>
                </div>

                <svg 
                  className={`w-full h-full ${isPlacingMode ? 'cursor-crosshair' : ''}`}
                  viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                  preserveAspectRatio="xMidYMid slice"
                  onClick={handleMapClick}
                >
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
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3, 0 6"
                        fill="#22c55e"
                      />
                    </marker>
                    <marker
                      id="arrowhead-red"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3, 0 6"
                        fill="#ef4444"
                      />
                    </marker>
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
                      stroke={placedCoordinate ? "#ef4444" : "#4f46e5"}
                      strokeWidth={placedCoordinate ? "2" : "1"}
                      strokeDasharray="3,3"
                      opacity="0.8"
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

                  {/* Direction arrow from user to selected location */}
                  {selectedLocation && userPosition && positioningStatus === 'connected' && (
                    <line
                      x1={userPosition.x}
                      y1={userPosition.y}
                      x2={selectedLocation.x}
                      y2={selectedLocation.y}
                      stroke="#22c55e"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                      markerEnd="url(#arrowhead)"
                      opacity="0.8"
                    />
                  )}

                  {/* Placed coordinate marker */}
                  {placedCoordinate && (
                    <g>
                      <circle
                        cx={placedCoordinate.x}
                        cy={placedCoordinate.y}
                        r="3"
                        fill="#ef4444"
                        stroke="#fff"
                        strokeWidth="1"
                        filter="url(#glow)"
                      />
                      <circle
                        cx={placedCoordinate.x}
                        cy={placedCoordinate.y}
                        r="5"
                        fill="#ef4444"
                        opacity="0.3"
                      >
                        <animate attributeName="r" from="5" to="9" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <text
                        x={placedCoordinate.x}
                        y={placedCoordinate.y - 6}
                        fontSize="3"
                        fill="#991b1b"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        Destination
                      </text>
                    </g>
                  )}

                  {/* Direction arrow from user to placed coordinate */}
                  {placedCoordinate && userPosition && positioningStatus === 'connected' && (
                    <line
                      x1={userPosition.x}
                      y1={userPosition.y}
                      x2={placedCoordinate.x}
                      y2={placedCoordinate.y}
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                      markerEnd="url(#arrowhead-red)"
                      opacity="0.8"
                    />
                  )}

                  {/* Location markers */}
                  {locations.filter(loc => selectedFloor === 'All' || loc.floor === selectedFloor).map(loc => (
                    <g key={loc.id}>
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r={selectedLocation?.id === loc.id ? "3.5" : "2"}
                        fill={selectedLocation?.id === loc.id ? "#22c55e" : "#6366f1"}
                        stroke={selectedLocation?.id === loc.id ? "#16a34a" : "#fff"}
                        strokeWidth={selectedLocation?.id === loc.id ? "1" : "0.5"}
                        className="cursor-pointer transition-all"
                        onClick={() => handleSelectLocation(loc)}
                        style={{ filter: selectedLocation?.id === loc.id ? 'url(#glow)' : 'none' }}
                      />
                      {selectedLocation?.id === loc.id && (
                        <>
                        <text
                          x={loc.x}
                            y={loc.y - 6}
                          fontSize="3"
                            fill="#166534"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {loc.name}
                        </text>
                          {/* Pulse animation for selected location */}
                          <circle
                            cx={loc.x}
                            cy={loc.y}
                            r="5"
                            fill="#22c55e"
                            opacity="0.3"
                          >
                            <animate attributeName="r" from="5" to="9" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                          </circle>
                        </>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-md">
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-700">You (GPS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                      <span className="text-gray-700">Destinations</span>
                    </div>
                    {selectedLocation && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        <span className="text-gray-700">Selected</span>
                      </div>
                    )}
                    {placedCoordinate && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-700">Placed Coordinate</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Turn-by-Turn Navigation */}
              {(showDirections && selectedLocation) || (placedCoordinate && routeSteps.length > 0) ? (
                <div className={`border rounded-lg p-4 ${placedCoordinate ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Navigation className={`w-6 h-6 ${placedCoordinate ? 'text-red-600' : 'text-indigo-600'}`} />
                      <div>
                        {selectedLocation ? (
                          <>
                            <h3 className="font-semibold text-lg text-gray-800">{selectedLocation.name}</h3>
                            <p className="text-sm text-gray-600">{selectedLocation.category} • {selectedLocation.zone}</p>
                          </>
                        ) : placedCoordinate ? (
                          <>
                            <h3 className="font-semibold text-lg text-gray-800">Custom Destination</h3>
                            <p className="text-sm text-gray-600">
                              {placedCoordinate.lat?.toFixed(6)}, {placedCoordinate.lng?.toFixed(6)}
                            </p>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (placedCoordinate) {
                          setPlacedCoordinate(null);
                          setRouteSteps([]);
                          setNavigationPath([]);
                          setShowDirections(false);
                        } else {
                          clearSelection();
                        }
                      }} 
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-3">
                    {placedCoordinate && routeSteps.length > 0 ? (
                      <>
                        {/* Google Maps-style turn-by-turn directions */}
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`${placedCoordinate ? 'bg-red-100' : 'bg-indigo-100'} p-2 rounded-lg`}>
                              <Navigation className={`w-5 h-5 ${placedCoordinate ? 'text-red-600' : 'text-indigo-600'}`} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Distance</p>
                              <p className="font-semibold text-gray-800">
                                {routeSteps[routeSteps.length - 1]?.distance || 0}m
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Turn-by-turn steps */}
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Step-by-step directions:</p>
                          <div className="space-y-3">
                            {routeSteps.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className={`flex-shrink-0 w-8 h-8 ${placedCoordinate ? 'bg-red-600' : 'bg-indigo-600'} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                                  {idx + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">{step.instruction}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {step.distance}m from start
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : selectedLocation ? (
                      <>
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
                      </>
                    ) : null}
                  </div>

                  <div className={`p-3 border rounded-lg ${placedCoordinate ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <p className={`text-sm ${placedCoordinate ? 'text-red-800' : 'text-blue-800'}`}>
                      <strong>Live navigation:</strong> Your position updates automatically via GPS. Follow the {placedCoordinate ? 'red' : 'blue'} path on the map.
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

