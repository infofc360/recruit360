export interface Coach {
  name: string;
  title: string;
  email: string;
  phone?: string;
}

export interface College {
  id: string;
  name: string;
  division: "D1" | "D2" | "D3";
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
  divisions: ("D1" | "D2" | "D3")[];
  conferences: string[];
  regions: Region[];
  states: string[];
  searchQuery: string;
  locationSearch: LocationSearch | null;
}
