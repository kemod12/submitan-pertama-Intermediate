import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

class MapService {
  #map = null;
  #markers = [];
  #defaultCenter = [-6.2088, 106.8456]; // Jakarta, Indonesia
  #defaultZoom = 13;

  constructor() {
    // Fix for marker icon in webpack
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });
  }

  initializeMap(containerId, options = {}) {
    const { center = this.#defaultCenter, zoom = this.#defaultZoom } = options;

    this.#map = L.map(containerId).setView(center, zoom);

    // Add default OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.#map);

    // Add satellite view tile layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Add layer control
    const baseMaps = {
      "Street View": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }),
      "Satellite View": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      })
    };

    L.control.layers(baseMaps).addTo(this.#map);

    return this.#map;
  }

  addMarker(lat, lng, options = {}) {
    const marker = L.marker([lat, lng], options).addTo(this.#map);
    this.#markers.push(marker);
    return marker;
  }

  removeMarker(marker) {
    const index = this.#markers.indexOf(marker);
    if (index > -1) {
      this.#markers.splice(index, 1);
      this.#map.removeLayer(marker);
    }
  }

  clearMarkers() {
    this.#markers.forEach(marker => this.#map.removeLayer(marker));
    this.#markers = [];
  }

  setView(lat, lng, zoom) {
    this.#map.setView([lat, lng], zoom);
  }

  on(event, callback) {
    this.#map.on(event, callback);
  }

  getMap() {
    return this.#map;
  }
}

export default new MapService();