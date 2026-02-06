'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { College, CollegeFilters, Region } from '@/types/college';
import { haversineDistance } from '@/lib/geo';
import CollegeList from '@/components/sidebar/CollegeList';
import FilterPanel from '@/components/sidebar/FilterPanel';
import SelectionActionBar from '@/components/sidebar/SelectionActionBar';
import EmailModal from '@/components/email/EmailModal';

// Dynamic import for map (needs client-side only)
const CollegeMap = dynamic(() => import('@/components/map/CollegeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

// State to region mapping for filtering
const STATE_TO_REGION: Record<string, Region> = {
  // Northeast
  CT: 'Northeast', ME: 'Northeast', MA: 'Northeast', NH: 'Northeast',
  RI: 'Northeast', VT: 'Northeast', NJ: 'Northeast', NY: 'Northeast',
  PA: 'Northeast', DC: 'Northeast', MD: 'Northeast', DE: 'Northeast',
  // Southeast
  AL: 'Southeast', AR: 'Southeast', FL: 'Southeast', GA: 'Southeast',
  KY: 'Southeast', LA: 'Southeast', MS: 'Southeast', NC: 'Southeast',
  SC: 'Southeast', TN: 'Southeast', VA: 'Southeast', WV: 'Southeast',
  // Midwest
  IL: 'Midwest', IN: 'Midwest', IA: 'Midwest', KS: 'Midwest',
  MI: 'Midwest', MN: 'Midwest', MO: 'Midwest', NE: 'Midwest',
  ND: 'Midwest', OH: 'Midwest', SD: 'Midwest', WI: 'Midwest',
  // Southwest
  AZ: 'Southwest', NM: 'Southwest', OK: 'Southwest', TX: 'Southwest',
  // West
  AK: 'West', CA: 'West', CO: 'West', HI: 'West',
  ID: 'West', MT: 'West', NV: 'West', OR: 'West',
  UT: 'West', WA: 'West', WY: 'West'
};

export default function Home() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [filters, setFilters] = useState<CollegeFilters>({
    divisions: ['D1'],
    conferences: [],
    regions: [],
    states: [],
    searchQuery: '',
    locationSearch: null,
  });

  // Fetch colleges from API
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/colleges');
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        const data = await response.json();
        setColleges(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching colleges:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter colleges (with optional distance)
  const filteredColleges = useMemo(() => {
    const loc = filters.locationSearch;

    const results: (College & { distanceMiles?: number })[] = [];

    for (const college of colleges) {
      // Division filter
      if (!filters.divisions.includes(college.division)) continue;
      // Conference filter
      if (filters.conferences.length > 0 && !filters.conferences.includes(college.conference)) continue;
      // Region filter
      if (filters.regions.length > 0 && !filters.regions.includes(college.region)) continue;
      // State filter
      if (filters.states.length > 0 && !filters.states.includes(college.state)) continue;
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !college.name.toLowerCase().includes(query) &&
          !college.city.toLowerCase().includes(query) &&
          !college.conference.toLowerCase().includes(query) &&
          !college.state.toLowerCase().includes(query)
        ) continue;
      }

      // Location/radius filter
      if (loc && college.lat != null && college.lng != null) {
        const dist = haversineDistance(loc.lat, loc.lng, college.lat, college.lng);
        if (dist > loc.radiusMiles) continue;
        results.push({ ...college, distanceMiles: Math.round(dist) });
      } else if (loc) {
        continue; // skip colleges without coords when location filter is active
      } else {
        results.push(college);
      }
    }

    // Sort by distance when location search is active
    if (loc) {
      results.sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0));
    }

    return results;
  }, [colleges, filters]);

  // Get conferences available for current filters
  const availableConferences = useMemo(() => {
    const filtered = colleges.filter(c => {
      if (!filters.divisions.includes(c.division)) return false;
      if (filters.regions.length > 0 && !filters.regions.includes(c.region)) return false;
      if (filters.states.length > 0 && !filters.states.includes(c.state)) return false;
      return true;
    });
    return [...new Set(filtered.map(c => c.conference))].sort();
  }, [colleges, filters.divisions, filters.regions, filters.states]);

  // Get available states based on selected regions
  const availableStates = useMemo(() => {
    let filtered = colleges.filter(c => filters.divisions.includes(c.division));

    // If regions are selected, only show states in those regions
    if (filters.regions.length > 0) {
      filtered = filtered.filter(c =>
        filters.regions.includes(STATE_TO_REGION[c.state])
      );
    }

    return [...new Set(filtered.map(c => c.state))].filter(Boolean).sort();
  }, [colleges, filters.divisions, filters.regions]);

  const toggleCheck = useCallback((id: string) => {
    setSelectedCollegeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedCollegeIds(prev => {
      const next = new Set(prev);
      for (const c of filteredColleges) next.add(c.id);
      return next;
    });
  }, [filteredColleges]);

  const deselectAllVisible = useCallback(() => {
    setSelectedCollegeIds(prev => {
      const next = new Set(prev);
      for (const c of filteredColleges) next.delete(c.id);
      return next;
    });
  }, [filteredColleges]);

  const clearSelection = useCallback(() => {
    setSelectedCollegeIds(new Set());
  }, []);

  const selectedColleges = useMemo(() => {
    return colleges.filter(c => selectedCollegeIds.has(c.id));
  }, [colleges, selectedCollegeIds]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading colleges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-sm">
            R
          </div>
          <h1 className="text-xl font-semibold">Recruit360</h1>
        </div>
        <nav className="text-sm text-slate-300">
          College Soccer Database
        </nav>
      </header>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        conferences={availableConferences}
        availableStates={availableStates}
        onFiltersChange={setFilters}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[400px] border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
          <CollegeList
            colleges={filteredColleges}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onHover={setHoveredId}
            selectedCollegeIds={selectedCollegeIds}
            onToggleCheck={toggleCheck}
            onSelectAll={selectAllVisible}
            onDeselectAll={deselectAllVisible}
          />
          <SelectionActionBar
            count={selectedCollegeIds.size}
            onEmail={() => setShowEmailModal(true)}
            onClear={clearSelection}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <CollegeMap
            colleges={filteredColleges}
            selectedId={selectedId}
            onMarkerClick={setSelectedId}
            hoveredId={hoveredId}
            locationSearch={filters.locationSearch}
            checkedIds={selectedCollegeIds}
          />
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          colleges={selectedColleges}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
