const { lat, lng, key } = mapConfig;

const map = L.map('map').setView([lat, lng], 14);

L.tileLayer(`https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.webp?key=${key}`, {
  attribution:
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
    '<a href="https://www.openstreetmap.org/copyright/" target="_blank">&copy; OpenStreetMap contributors</a>'
}).addTo(map);

const marker = L.marker([lat, lng]).addTo(map);

marker.bindPopup(`<h5>${listingTitle}</h5><p>Exact Location will be provided after booking</p>`).openPopup();

L.circle([lat,lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);
