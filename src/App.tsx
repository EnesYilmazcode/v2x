import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { io, Socket } from 'socket.io-client';
import { Navigation, Copy, Play, Square } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  latitude: number;
  longitude: number;
}

interface User extends Location {
  id: string;
}

function LocationUpdater({ location }: { location: Location | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], 13);
    }
  }, [location, map]);

  return null;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const trackingInterval = useRef<number>();

  useEffect(() => {
    const newSocket = io('https://your-backend-url.com'); // Replace with your actual backend URL
    setSocket(newSocket);

    newSocket.on('updateUsers', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const addLog = (message: string, isError = false) => {
    setLogs(prev => [...prev, `${isError ? '❌ ' : '✅ '}${message}`]);
  };

  const updateLocation = (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    setCurrentLocation({ latitude, longitude });
    socket?.emit('updateLocation', { latitude, longitude });
    addLog(`Location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    let message = 'An unknown error occurred.';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out.';
        break;
    }
    addLog(message, true);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      addLog('Geolocation is not supported by this browser.', true);
      return;
    }

    setIsTracking(true);
    trackingInterval.current = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(updateLocation, handleLocationError);
    }, 5000);
  };

  const stopTracking = () => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }
    setIsTracking(false);
    addLog('Tracking stopped');
  };

  const copyLocation = () => {
    if (currentLocation) {
      const locationString = `Lat: ${currentLocation.latitude.toFixed(6)}, Lon: ${currentLocation.longitude.toFixed(6)}`;
      navigator.clipboard.writeText(locationString);
      addLog('Location copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center space-x-2 text-2xl font-bold text-gray-800">
          <Navigation className="w-8 h-8" />
          <h1>Location Tracker</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="h-[400px] relative">
                {currentLocation && (
                  <MapContainer
                    center={[currentLocation.latitude, currentLocation.longitude]}
                    zoom={13}
                    className="h-full w-full rounded-lg"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationUpdater location={currentLocation} />
                    {currentLocation && (
                      <Marker position={[currentLocation.latitude, currentLocation.longitude]} />
                    )}
                    {users.map((user) => (
                      user.id !== socket?.id && (
                        <Marker
                          key={user.id}
                          position={[user.latitude, user.longitude]}
                        />
                      )
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Tracking</span>
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Tracking</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-2">Your Location</h2>
              <div className="space-y-2">
                <textarea
                  readOnly
                  value={currentLocation ? `Lat: ${currentLocation.latitude.toFixed(6)}, Lon: ${currentLocation.longitude.toFixed(6)}` : ''}
                  className="w-full h-20 p-2 border rounded-lg resize-none"
                />
                <button
                  onClick={copyLocation}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Location</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-2">Connected Users</h2>
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="text-sm">
                    User {user.id.slice(0, 5)}: Lat {user.latitude.toFixed(4)}, Lon {user.longitude.toFixed(4)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-2">Log</h2>
              <div className="space-y-1 h-40 overflow-y-auto text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-600">{log}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;