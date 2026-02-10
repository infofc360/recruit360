'use client';

import { CollegeFilters, LocationSearch, Region, AppMode } from '@/types/college';
import LocationSearchPanel from './LocationSearchPanel';

interface FilterPanelProps {
  filters: CollegeFilters;
  conferences: string[];
  availableStates: string[];
  onFiltersChange: (filters: CollegeFilters) => void;
  mode: AppMode;
}

const REGIONS: Region[] = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'D.C.', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
};

export default function FilterPanel({
  filters,
  conferences,
  availableStates,
  onFiltersChange,
  mode,
}: FilterPanelProps) {
  const divisions: ("D1" | "D2" | "D3")[] = ['D1', 'D2', 'D3'];

  const toggleDivision = (div: "D1" | "D2" | "D3") => {
    const newDivisions = filters.divisions.includes(div)
      ? filters.divisions.filter(d => d !== div)
      : [...filters.divisions, div];

    onFiltersChange({
      ...filters,
      divisions: newDivisions.length > 0 ? newDivisions : ['D1']
    });
  };

  const toggleConference = (conf: string) => {
    const newConferences = filters.conferences.includes(conf)
      ? filters.conferences.filter(c => c !== conf)
      : [...filters.conferences, conf];

    onFiltersChange({
      ...filters,
      conferences: newConferences
    });
  };

  const toggleRegion = (region: Region) => {
    const newRegions = filters.regions.includes(region)
      ? filters.regions.filter(r => r !== region)
      : [...filters.regions, region];

    onFiltersChange({
      ...filters,
      regions: newRegions,
      states: [] // Clear state filter when region changes
    });
  };

  const toggleState = (state: string) => {
    const newStates = filters.states.includes(state)
      ? filters.states.filter(s => s !== state)
      : [...filters.states, state];

    onFiltersChange({
      ...filters,
      states: newStates
    });
  };

  const handleLocationChange = (location: LocationSearch | null) => {
    onFiltersChange({ ...filters, locationSearch: location });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      ...filters,
      conferences: [],
      regions: [],
      states: [],
      searchQuery: '',
      locationSearch: null,
    });
  };

  const hasActiveFilters = filters.conferences.length > 0 ||
    filters.regions.length > 0 ||
    filters.states.length > 0 ||
    filters.searchQuery ||
    filters.locationSearch;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={mode === 'ecnl' ? 'Search by club name' : 'Search by school name'}
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Division toggles — hidden in ECNL mode */}
        {mode !== 'ecnl' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Division:</span>
            {divisions.map(div => (
              <button
                key={div}
                onClick={() => toggleDivision(div)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.divisions.includes(div)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
        )}

        {/* Region dropdown — hidden in ECNL mode */}
        {mode !== 'ecnl' && (
          <div className="relative">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  toggleRegion(e.target.value as Region);
                }
              }}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">
                {filters.regions.length > 0
                  ? `${filters.regions.length} region${filters.regions.length > 1 ? 's' : ''}`
                  : 'All Regions'
                }
              </option>
              {REGIONS.map(region => (
                <option key={region} value={region}>
                  {filters.regions.includes(region) ? '✓ ' : ''}{region}
                </option>
              ))}
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* State dropdown — hidden in ECNL mode */}
        {mode !== 'ecnl' && (
          <div className="relative">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  toggleState(e.target.value);
                }
              }}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">
                {filters.states.length > 0
                  ? `${filters.states.length} state${filters.states.length > 1 ? 's' : ''}`
                  : 'All States'
                }
              </option>
              {availableStates.map(state => (
                <option key={state} value={state}>
                  {filters.states.includes(state) ? '✓ ' : ''}{STATE_NAMES[state] || state}
                </option>
              ))}
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Conference dropdown */}
        <div className="relative">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                toggleConference(e.target.value);
              }
            }}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">
              {filters.conferences.length > 0
                ? `${filters.conferences.length} conference${filters.conferences.length > 1 ? 's' : ''}`
                : 'All Conferences'
              }
            </option>
            {conferences.map(conf => (
              <option key={conf} value={conf}>
                {filters.conferences.includes(conf) ? '✓ ' : ''}{conf}
              </option>
            ))}
          </select>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Location Search */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 font-medium mb-2">Search by Location</p>
        <LocationSearchPanel
          locationSearch={filters.locationSearch}
          onLocationChange={handleLocationChange}
        />
      </div>

      {/* Selected filter chips */}
      {(filters.regions.length > 0 || filters.states.length > 0 || filters.conferences.length > 0 || filters.locationSearch) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.locationSearch && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              {filters.locationSearch.label} ({filters.locationSearch.radiusMiles} mi)
              <button
                onClick={() => handleLocationChange(null)}
                className="hover:bg-amber-200 rounded-full p-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.regions.map(region => (
            <span
              key={region}
              className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
            >
              {region}
              <button
                onClick={() => toggleRegion(region)}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {filters.states.map(state => (
            <span
              key={state}
              className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
            >
              {STATE_NAMES[state] || state}
              <button
                onClick={() => toggleState(state)}
                className="hover:bg-purple-200 rounded-full p-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {filters.conferences.map(conf => (
            <span
              key={conf}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
            >
              {conf}
              <button
                onClick={() => toggleConference(conf)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
