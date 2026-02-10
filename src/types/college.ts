export interface Coach {
  name: string;
  title: string;
  email: string;
  phone?: string;
}

export type Division = "D1" | "D2" | "D3" | "ECNL";

export type AppMode = 'collegiate' | 'ecnl';

export interface College {
  id: string;
  name: string;
  division: Division;
  conference: string;
  city: string;
  state: string;
  region: Region;
  lat: number;
  lng: number;
  coaches: Coach[];
  website?: string;
}

export type Region =
  | "Northeast"
  | "Southeast"
  | "Midwest"
  | "Southwest"
  | "West";

export interface LocationSearch {
  lat: number;
  lng: number;
  radiusMiles: number;
  label: string;
}

export type CoachRole = 'head' | 'assistant' | 'associate';

export interface CollegeFilters {
  divisions: Division[];
  conferences: string[];
  regions: Region[];
  states: string[];
  searchQuery: string;
  locationSearch: LocationSearch | null;
}
