"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { DisasterLocation, Request, Resource } from "@/lib/types";

// ─── Marker Icons ───
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface MapViewProps {
  disasters: DisasterLocation[];
  requests: Request[];
  resources: Resource[];
}

export function MapView({ disasters, requests, resources }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // ─── Initialize map once ───
    if (mapContainerRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView(
        [7.8731, 80.7718], // Default Sri Lanka
        7
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // ─── Clear only markers, keep base layer ───
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const markerGroup: L.LatLngExpression[] = [];

    // ─── Plot Disasters (red) ───
    disasters.forEach((d) => {
      const { latitude, longitude } = d.location;
      if (isFinite(latitude) && isFinite(longitude)) {
        L.marker([latitude, longitude], { icon: redIcon })
          .addTo(map)
          .bindPopup(`<strong>${d.name}</strong>`);
        markerGroup.push([latitude, longitude]);
      }
    });

    // ─── Plot Requests (blue) ───
    requests.forEach((r) => {
      const { latitude, longitude } = r.location;
      if (isFinite(latitude) && isFinite(longitude)) {
        L.marker([latitude, longitude], { icon: blueIcon })
          .addTo(map)
          .bindPopup(
            `<strong>${r.title}</strong><br/>
             Type: ${r.type}<br/>
             Status: ${r.status}`
          );
        markerGroup.push([latitude, longitude]);
      }
    });

    // ─── Plot Resources (green) ───
    resources.forEach((res) => {
      const { latitude, longitude } = res.location;
      if (isFinite(latitude) && isFinite(longitude)) {
        L.marker([latitude, longitude], { icon: greenIcon })
          .addTo(map)
          .bindPopup(
            `<strong>${res.name}</strong><br/>
             Type: ${res.type}<br/>
             Status: ${res.status}`
          );
        markerGroup.push([latitude, longitude]);
      }
    });

    // ─── Auto-fit bounds to show all markers ───
    if (markerGroup.length > 0) {
      const bounds = L.latLngBounds(markerGroup);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // ─── Add legend only once ───
    if (!(map as any)._legend) {
      const legend = L.control({ position: "bottomright" });

      legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend bg-white p-2 rounded shadow");
        div.innerHTML = `
          <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" style="width:15px;vertical-align:middle;"/> Disaster</div>
          <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" style="width:15px;vertical-align:middle;"/> Request</div>
          <div><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" style="width:15px;vertical-align:middle;"/> Resource</div>
        `;
        return div;
      };

      legend.addTo(map);
      (map as any)._legend = legend; // store ref
    }
  }, [disasters, requests, resources]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />;
}
