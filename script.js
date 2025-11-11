// 🌍 Inisialisasi peta Leaflet
let map = L.map('map').setView([-2.5, 118], 5); // default Indonesia tengah
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);
let marker;

// 🧭 Mulai deteksi lokasi
document.getElementById("status").textContent = "Mengambil lokasi GPS...";

navigator.geolocation.getCurrentPosition(
  successGPS,
  failGPS,
  { enableHighAccuracy: true, timeout: 15000 }
);

// ✅ Jika GPS berhasil
function successGPS(pos) {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  updateMap(lat, lon);
  getWeather(lat, lon);
}

// ⚠️ Jika GPS gagal
async function failGPS(err) {
  console.warn("GPS gagal:", err.message);
  document.getElementById("status").textContent = "GPS gagal, mencari lokasi via IP...";

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    const lat = data.latitude;
    const lon = data.longitude;

    updateMap(lat, lon);
    getWeather(lat, lon);
  } catch {
    document.getElementById("status").textContent = "Gagal mendeteksi lokasi 😢";
  }
}

// 🗺️ Update tampilan peta
function updateMap(lat, lon) {
  map.setView([lat, lon], 13);
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon]).addTo(map)
    .bindPopup(`Lokasi Anda<br>Lat: ${lat.toFixed(3)}, Lon: ${lon.toFixed(3)}`)
    .openPopup();
}

// 🌦️ Ambil data cuaca dari BMKG (pakai dataset publik lokal)
async function getWeather(lat, lon) {
  document.getElementById("status").textContent = "Mengambil data cuaca dari BMKG...";

  try {
    // Gunakan proxy gratis untuk bypass CORS
    const proxy = "https://api.allorigins.win/get?url=";
    const url = "https://api.bmkg.go.id/publik/prakiraan-wilayah.json";
    const response = await fetch(proxy + encodeURIComponent(url));
    const raw = await response.json();
    const data = JSON.parse(raw.contents);

    // ...lanjutkan proses mencari lokasi terdekat
    let nearest = null;
    let minDist = Infinity;
    data.data.forEach((loc) => {
      const d = Math.hypot(lat - loc.lat, lon - loc.lon);
      if (d < minDist) {
        minDist = d;
        nearest = loc;
      }
    });

    if (nearest) {
      showWeather(nearest);
      document.getElementById("status").textContent = `Lokasi terdeteksi: ${nearest.nama}`;
    } else {
      document.getElementById("status").textContent = "Gagal menemukan data BMKG.";
    }
  } catch (err) {
    document.getElementById("status").innerHTML = `<span class='error'>Gagal ambil data BMKG: ${err.message}</span>`;
  }
}


// 💧 Tampilkan data cuaca
function showWeather(data) {
  const weatherDiv = document.getElementById("weather");
  weatherDiv.innerHTML = `
    <div class="weather-detail">🌍 Wilayah: <b>${data.nama}</b></div>
    <div class="weather-detail">🌦️ Cuaca: <b>${data.cuaca}</b></div>
    <div class="weather-detail">🌡️ Suhu: <b>${data.tmin}°C - ${data.tmax}°C</b></div>
    <div class="weather-detail">💧 Kelembaban: <b>${data.humin}% - ${data.humax}%</b></div>
  `;
}
