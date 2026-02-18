'use client';

import { useState } from 'react';
import { LocationSearch } from '@/types/college';

interface LocationSearchPanelProps {
  locationSearch: LocationSearch | null;
  onLocationChange: (location: LocationSearch | null) => void;
}

const RADIUS_OPTIONS = [25, 50, 100, 150, 200, 300, 500];

export default function LocationSearchPanel({
  locationSearch,
  onLocationChange,
}: LocationSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [radius, setRadius] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Location not found');
        return;
      }
      const data = await res.json();
      onLocationChange({ lat: data.lat, lng: data.lng, radiusMiles: radius, label: data.label });
    } catch {
      setError('Failed to search location');
    } finally {
      setLoading(false);
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radiusMiles: radius,
          label: 'My Location',
        });
        setLoading(false);
      },
      () => {
        setError('Unable to get location');
        setLoading(false);
      }
    );
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (locationSearch) {
      onLocationChange({ ...locationSearch, radiusMiles: newRadius });
    }
  };

  const handleClear = () => {
    onLocationChange(null);
    setQuery('');
    setError('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Zip code or city, state"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-3 py-1.5 bg-[#1e1e1e] border border-[#2a2a2a] text-white placeholder-[#555] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#c8f000] focus:border-[#c8f000]"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-3 py-1.5 bg-[#c8f000] text-black rounded-lg text-sm font-medium hover:bg-[#a0c000] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '...' : 'Go'}
        </button>
        <button
          onClick={handleGPS}
          disabled={loading}
          title="Use my location"
          className="px-2 py-1.5 border border-[#2a2a2a] bg-[#1e1e1e] text-[#888] rounded-lg text-sm hover:border-[#c8f000] hover:text-[#c8f000] disabled:opacity-40 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-[#555] uppercase tracking-wider">Radius:</label>
        <select
          value={radius}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          className="appearance-none bg-[#1e1e1e] border border-[#2a2a2a] text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#c8f000] cursor-pointer"
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>{r} miles</option>
          ))}
        </select>
        {locationSearch && (
          <button
            onClick={handleClear}
            className="text-xs text-[#888] hover:text-[#c8f000] ml-auto transition-colors"
          >
            Clear location
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
