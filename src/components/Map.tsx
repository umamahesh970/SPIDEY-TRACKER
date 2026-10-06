'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createSpiderIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0 #000; font-size: 16px;">🕷</div>`,
  className: 'custom-spider-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const greenSpider = createSpiderIcon('#8bc34a'); // Confirmed
const redSpider = createSpiderIcon('#f44336'); // Rumoured
const defaultIcon = createSpiderIcon('#ffffff'); 

interface Sighting {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  timestamp: string;
  status: 'rumoured' | 'confirmed';
  votes: number;
  creatorId?: string;
}

function LocationMarker({ onAdd, userPos }: { onAdd: (lat: number, lng: number, desc: string, status: 'rumoured'|'confirmed') => void, userPos: L.LatLng | null }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [description, setDescription] = useState('');
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (userPos) {
      setPosition(userPos);
    }
  }, [userPos]);

  useEffect(() => {
    if (position && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [position]);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (position) {
      onAdd(position.lat, position.lng, description, 'rumoured');
      setPosition(null);
      setDescription('');
    }
  };

  return position === null ? null : (
    <Marker position={position} icon={defaultIcon} ref={markerRef}>
      <Popup>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 min-w-[220px] font-pixel text-[10px]">
          <h3 className="font-bold text-center text-xs">REPORT SIGHTING</h3>
          <textarea 
            className="border-2 border-black rounded p-1 text-[10px] uppercase h-16 resize-none"
            placeholder="WHAT IS SPIDEY DOING?..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
          />
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-2 mt-2 border-2 border-black rounded shadow-[2px_2px_0_#000] hover:translate-y-[2px] hover:shadow-none transition-all uppercase">
            SUBMIT
          </button>
        </form>
      </Popup>
    </Marker>
  );
}

function LocateControl({ onLocationFound }: { onLocationFound: (pos: L.LatLng) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  
  const handleLocate = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      const success = (position: GeolocationPosition) => {
        const latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
        map.flyTo(latlng, 14);
        onLocationFound(latlng);
        setLoading(false);
      };

      const fallback = () => {
        navigator.geolocation.getCurrentPosition(
          success,
          (err) => {
            console.error("Fallback error:", err);
            alert("Location failed. (Note: Mobile browsers disable GPS entirely if you don't use a secure HTTPS link!). Just tap on the map to place a pin instead!");
            setLoading(false);
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      };

      navigator.geolocation.getCurrentPosition(
        success,
        (error) => {
          console.log("High accuracy failed, attempting low accuracy fallback...");
          fallback();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      alert("Geolocation is not supported by your browser or is blocked because you are not on HTTPS.");
      setLoading(false);
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000, pointerEvents: 'auto', margin: '10px' }}>
      <button 
        onClick={handleLocate}
        disabled={loading}
        className="bg-white border-2 border-black p-2 font-pixel text-[10px] rounded shadow-[2px_2px_0_#000] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
        title="Find My Location"
      >
        <span>📍</span> {loading ? 'LOCATING...' : 'LOCATE ME'}
      </button>
    </div>
  );
}

export default function SpideyMap() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<L.LatLng | null>(null);
  
  const [votedSet, setVotedSet] = useState<Set<string>>(new Set());
  const [deviceId, setDeviceId] = useState<string>('');

  const fetchSightings = async () => {
    try {
      const res = await fetch('/api/sightings');
      const data = await res.json();
      setSightings(data);
    } catch (err) {
      console.error("Failed to fetch sightings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Generate an anonymous device ID for this browser
    let id = localStorage.getItem('spidey_device_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      localStorage.setItem('spidey_device_id', id);
    }
    setDeviceId(id);

    // Load previously voted items from local storage
    const savedVotes = localStorage.getItem('spidey_voted_set');
    if (savedVotes) {
      try {
        setVotedSet(new Set(JSON.parse(savedVotes)));
      } catch (e) {}
    }

    fetchSightings();
    const interval = setInterval(fetchSightings, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSighting = async (lat: number, lng: number, description: string, status: 'rumoured'|'confirmed') => {
    try {
      const res = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng, description, status, creatorId: deviceId })
      });
      if (res.ok) {
        fetchSightings();
        setUserPos(null); 
      }
    } catch (err) {
      console.error("Failed to add sighting", err);
    }
  };

  const handleVote = async (id: string, action: 'upvote' | 'downvote') => {
    if (votedSet.has(id)) return;
    
    // Optimistic UI update
    const newVotedSet = new Set(votedSet).add(id);
    setVotedSet(newVotedSet);
    localStorage.setItem('spidey_voted_set', JSON.stringify(Array.from(newVotedSet)));

    setSightings(prev => prev.map(s => {
      if (s.id === id) {
        const newVotes = (s.votes || 0) + (action === 'upvote' ? 1 : -1);
        return { ...s, votes: newVotes, status: newVotes >= 5 ? 'confirmed' : s.status };
      }
      return s;
    }));

    try {
      await fetch('/api/sightings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      fetchSightings();
    } catch (err) {
      console.error("Failed to vote", err);
    }
  };

  if (loading) {
    return <div className="h-full w-full flex items-center justify-center text-white bg-[#0a192f] font-pixel text-sm">INITIALIZING MAP...</div>;
  }

  return (
    <MapContainer 
      center={[16.5062, 80.6480]} // Vijayawada
      zoom={12} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      className="font-pixel text-[10px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <LocateControl onLocationFound={(pos) => setUserPos(pos)} />
      
      {sightings.map((sighting) => {
        const isMySighting = sighting.creatorId === deviceId;
        const hasVoted = votedSet.has(sighting.id);
        const buttonsDisabled = isMySighting || hasVoted;

        return (
          <Marker 
            key={sighting.id} 
            position={[sighting.latitude, sighting.longitude]} 
            icon={sighting.status === 'confirmed' ? greenSpider : redSpider}
          >
            <Popup>
              <div className="font-pixel text-[10px] text-center w-36">
                <p className={sighting.status === 'confirmed' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  [{(sighting.status || 'rumoured').toUpperCase()}]
                </p>
                
                <div className="my-3 py-2 border-y border-gray-300 text-black uppercase break-words leading-tight">
                  {sighting.description}
                </div>
                
                <div className="flex items-center justify-between gap-1 mt-2">
                  <button 
                    onClick={() => handleVote(sighting.id, 'upvote')}
                    disabled={buttonsDisabled}
                    className="bg-[#8bc34a] text-black px-2 py-1 border border-black rounded shadow-[1px_1px_0_#000] disabled:opacity-50 active:translate-y-[1px] active:shadow-none"
                    title={isMySighting ? "You cannot vote on your own sighting" : "Vote True"}
                  >
                    TRUE
                  </button>
                  <div className="font-bold text-xs bg-gray-200 px-2 py-1 rounded border border-gray-400">
                    {sighting.votes || 0}
                  </div>
                  <button 
                     onClick={() => handleVote(sighting.id, 'downvote')}
                     disabled={buttonsDisabled}
                     className="bg-[#f44336] text-white px-2 py-1 border border-black rounded shadow-[1px_1px_0_#000] disabled:opacity-50 active:translate-y-[1px] active:shadow-none"
                     title={isMySighting ? "You cannot vote on your own sighting" : "Vote Fake"}
                  >
                    FAKE
                  </button>
                </div>
                {isMySighting && (
                   <p className="text-[7px] text-gray-500 mt-2 uppercase text-center block">Your submission</p>
                )}
                <p className="text-[7px] text-gray-500 mt-2 uppercase">Expires in 24h</p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <LocationMarker onAdd={handleAddSighting} userPos={userPos} />
    </MapContainer>
  );
}
