'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { College, LocationSearch } from '@/types/college';
import { milesToMeters } from '@/lib/geo';

interface CollegeMapProps {
  colleges: (College & { distanceMiles?: number })[];
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
  hoveredId: string | null;
  locationSearch?: LocationSearch | null;
  checkedIds?: Set<string>;
}

export default function CollegeMap({
  colleges,
  selectedId,
  onMarkerClick,
  hoveredId,
  locationSearch,
  checkedIds,
}: CollegeMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const radiusLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView([39.8283, -98.5795], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when colleges change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Filter colleges with valid coordinates
    const validColleges = colleges.filter(c => c.lat != null && c.lng != null);

    // Add new markers
    validColleges.forEach(college => {
      const marker = L.circleMarker([college.lat, college.lng], {
        radius: 7,
        fillColor: '#c8f000',
        color: '#0a0a0a',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85
      });

      marker.bindPopup(`
        <div style="min-width: 180px;">
          <strong style="font-size: 13px; color: #ffffff;">${college.name}</strong>
          <p style="margin: 4px 0; color: #888; font-size: 12px;">${college.city}${college.state ? ', ' + college.state : ''}</p>
          <p style="margin: 4px 0;"><span style="background: #c8f000; color: #000; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600;">${college.division}</span> <span style="color: #666; font-size: 11px; margin-left: 4px;">${college.conference}</span></p>
        </div>
      `);

      marker.on('click', () => {
        onMarkerClick(college.id);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.set(college.id, marker);
    });

    // Fit bounds if there are colleges with valid coordinates
    if (validColleges.length > 0) {
      const bounds = L.latLngBounds(validColleges.map(c => [c.lat, c.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [colleges, onMarkerClick]);

  // Highlight selected/hovered marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedId;
      const isHovered = id === hoveredId;

      marker.setStyle({
        radius: isSelected ? 11 : isHovered ? 9 : 7,
        fillColor: isSelected ? '#ffffff' : '#c8f000',
        color: isSelected ? '#c8f000' : '#0a0a0a',
        weight: isSelected ? 2.5 : isHovered ? 2 : 1.5,
        fillOpacity: isSelected ? 1 : 0.85,
      });

      if (isSelected) {
        marker.bringToFront();
      }
    });
  }, [selectedId, hoveredId]);

  // Center on selected college
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;

    const college = colleges.find(c => c.id === selectedId);
    if (college && college.lat != null && college.lng != null) {
      mapRef.current.setView([college.lat, college.lng], 10, { animate: true });
    }
  }, [selectedId, colleges]);

  // Draw radius circle and location marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous radius layers
    if (radiusLayerRef.current) {
      radiusLayerRef.current.clearLayers();
      radiusLayerRef.current.remove();
      radiusLayerRef.current = null;
    }

    if (!locationSearch) return;

    const group = L.layerGroup().addTo(mapRef.current);
    radiusLayerRef.current = group;

    // Radius circle
    const circle = L.circle([locationSearch.lat, locationSearch.lng], {
      radius: milesToMeters(locationSearch.radiusMiles),
      color: '#c8f000',
      fillColor: '#c8f000',
      fillOpacity: 0.05,
      weight: 1.5,
      dashArray: '6 4',
    });
    circle.addTo(group);

    // Center marker
    const centerMarker = L.circleMarker([locationSearch.lat, locationSearch.lng], {
      radius: 8,
      fillColor: '#c8f000',
      color: '#0a0a0a',
      weight: 2,
      fillOpacity: 1,
    });
    centerMarker.bindPopup(`<strong>${locationSearch.label}</strong><br/>${locationSearch.radiusMiles} mile radius`);
    centerMarker.addTo(group);

    // Fit bounds to circle
    mapRef.current.fitBounds(circle.getBounds(), { padding: [30, 30] });
  }, [locationSearch]);

  // Update marker styles for checked colleges
  useEffect(() => {
    if (!checkedIds) return;
    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedId;
      const isHovered = id === hoveredId;
      const isChecked = checkedIds.has(id);

      if (!isSelected && !isHovered && isChecked) {
        marker.setStyle({
          color: '#ffffff',
          weight: 2.5,
        });
      }
    });
  }, [checkedIds, selectedId, hoveredId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px]"
      style={{ zIndex: 1 }}
    />
  );
}
