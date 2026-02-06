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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
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
        radius: 8,
        fillColor: '#dc2626',
        color: '#991b1b',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong style="font-size: 14px;">${college.name}</strong>
          <p style="margin: 4px 0; color: #666;">${college.city}</p>
          <p style="margin: 4px 0;"><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${college.division}</span> <span style="color: #666; font-size: 12px;">${college.conference}</span></p>
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
        radius: isSelected || isHovered ? 12 : 8,
        fillColor: isSelected ? '#2563eb' : '#dc2626',
        color: isSelected ? '#1d4ed8' : '#991b1b',
        weight: isSelected || isHovered ? 3 : 2,
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
      color: '#d97706',
      fillColor: '#fbbf24',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '6 4',
    });
    circle.addTo(group);

    // Center marker
    const centerMarker = L.circleMarker([locationSearch.lat, locationSearch.lng], {
      radius: 10,
      fillColor: '#d97706',
      color: '#92400e',
      weight: 3,
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
          color: '#16a34a',
          weight: 3,
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
