// Elements
const lokasiEl = document.getElementById("lokasi");
const cuacaSekarangEl = document.getElementById("cuaca-sekarang");
const cuacaPrediksiEl = document.getElementById("cuaca-prediksi");

// ===== Lokasi BMKG Depok (kode + koordinat) - tetap dipakai untuk pencocokan =====
const lokasiBMKG = [
  { nama:"Beji", kode:"32.76.06.1001"},
  { nama:"Tugu", kode:"32.76.02.1009"},
  { nama:"Pondok Cina", kode:"32.76.06.1005"},
  { nama:"Depok Jaya", kode:"32.76.01.1007"},
  { nama:"Sawangan", kode:"32.76.03.1010"},
  { nama:"Cipayung", kode:"32.76.07.1001"},
  { nama:"Harjamukti", kode:"32.76.02.1007"},
  { nama:"Duren Seribu (Bojongsari)", kode:"32.76.11.1007"},
  { nama:"Depok (Pancoran Mas)", kode:"32.76.01.1006"},
  { nama:"Citayam (Tajurhalang)", kode:"32.01.37.2002"},
  { nama:"Cipayung Jaya", kode:"32.76.07.1002"}
];

// koordinat untuk tiap nama (dipakai untuk menandai titik BMKG)
const lokasiBMKGKoord = {
  "Beji": {lat:-6.4026, lon:106.7940},
  "Tugu": {lat:-6.3615, lon:106.8497},
  "Pondok Cina": {lat:-6.3626, lon:106.8200},
  "Depok Jaya": {lat:-6.4000, lon:106.8300},
  "Sawangan": {lat:-6.3720, lon:106.8000},
  "Cipayung": {lat:-6.3885, lon:106.8410},
  "Harjamukti": {lat:-6.3557, lon:106.8575},
  "Duren Seribu (Bojongsari)": {lat:-6.4172, lon:106.7481},
  "Depok (Pancoran Mas)": {lat:-6.3950, lon:106.8180},
  "Citayam (Tajurhalang)": {lat:-6.4660, lon:106.7750},
  "Cipayung Jaya": {lat:-6.3805, lon:106.8442}
};

// Haversine (km) — tetap dipakai untuk perhitungan jarak
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}

// ===== Inisialisasi peta Leaflet =====
const map = L.map('map').setView([-6.4025, 106.7942], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let userMarker = null;
let bmkgMarker = null;
let lineBetween = null;

// Fungsi untuk menampilkan marker user & BMKG terdekat, tanpa menampilkan lat/lon angka
function showOnMap(userLat, userLon, namaBMKG, bmkgLat, bmkgLon, jarakKm) {
  // set view tengah antara dua titik supaya keduanya kelihatan
  const bounds = L.latLngBounds([[userLat, userLon], [bmkgLat, bmkgLon]]);
  map.fitBounds(bounds.pad(0.25));

  // user marker (biru)
  if (userMarker) userMarker.setLatLng([userLat, userLon]);
  else userMarker = L.marker([userLat, userLon], {title: "Lokasi Anda", opacity:0.95}).addTo(map).bindPopup("Lokasi Anda");

  // bmkg marker (hijau)
  if (bmkgMarker) {
    bmkgMarker.setLatLng([bmkgLat, bmkgLon]).setPopupContent(`${namaBMKG} (BMKG)`);
  } else {
    bmkgMarker = L.marker([bmkgLat, bmkgLon], {
      title: `${namaBMKG} (BMKG)`,
      opacity:0.95,
      icon: L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconSize:[25,41] })
    }).addTo(map).bindPopup(`${namaBMKG} (BMKG)`);
  }

  // garis penghubung
  if (lineBetween) map.removeLayer(lineBetween);
  lineBetween = L.polyline([[userLat, userLon],[bmkgLat, bmkgLon]], {color:'#0078d7', weight:3, opacity:0.7}).addTo(map);

  // tampilkan teks lokasi + jarak (tanpa angka lat/lon)
  lokasiEl.innerHTML = `📍 Lokasi terdeteksi: <b>${namaBMKG}, Depok</b>
                        <div class="info-distance">Jarak ke stasiun BMKG: ${jarakKm.toFixed(2)} km</div>`;
}

// ===== Ambil lokasi user =====
navigator.geolocation.getCurrentPosition(async (pos) => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  // cari stasiun BMKG terdekat (pencocokan dengan array lokasiBMKG & koordinat)
  let terdekat = lokasiBMKG[0];
  let minJarak = Infinity;
  lokasiBMKG.forEach(lok => {
    const k = lokasiBMKGKoord[lok.nama];
    if (!k) return;
    const jarak = hitungJarak(lat, lon, k.lat, k.lon);
    if (jarak < minJarak) {
      minJarak = jarak;
      terdekat = lok;
    }
  });

  // tampilkan peta + garis penghubung, tanpa lat/lon angka
  const bmkgCoord = lokasiBMKGKoord[terdekat.nama];
  showOnMap(lat, lon, terdekat.nama, bmkgCoord.lat, bmkgCoord.lon, minJarak);

  // ambil data cuaca dari BMKG berdasarkan kode
  await fetchCuaca(terdekat.kode, terdekat.nama);

}, (err) => {
  // Kalau gagal ambil GPS — tampilkan pesan dan coba fallback IP (ini tetap tidak tunjukkan lat/lon)
  lokasiEl.textContent = "Gagal mendeteksi lokasi otomatis. (Coba refresh atau buka di HP dengan GPS)";
  cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
  console.warn("Geolocation error:", err);
}, { enableHighAccuracy: true, timeout: 15000 });

// ===== Fungsi fetch cuaca (sama seperti milikmu) =====
async function fetchCuaca(kode, nama) {
  const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${kode}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if(!data.data || !data.data[0].cuaca) {
      cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
      return;
    }

    const semuaSlot = data.data[0].cuaca.flat();
    const now = new Date();

    // cari slot paling dekat sekarang
    let slotTerdekat = null;
    let diffMin = Infinity;
    semuaSlot.forEach(slot=>{
      const slotTime = new Date(slot.local_datetime);
      const diff = Math.abs(slotTime - now);
      if(diff < diffMin){
        diffMin = diff;
        slotTerdekat = slot;
      }
    });

    // tampilkan cuaca sekarang (rapi)
    if(slotTerdekat){
      cuacaSekarangEl.innerHTML = `
        <div>🌤️ ${slotTerdekat.weather_desc}</div>
        <div>Suhu: ${slotTerdekat.t}°C</div>
        <div>Kelembaban: ${slotTerdekat.hu}%</div>
        <div class="cuaca-slot">🕒 Slot BMKG: ${new Date(slotTerdekat.local_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
      `;
    } else {
      cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
    }

    // prediksi 3 slot berikutnya
    cuacaPrediksiEl.innerHTML = "";
    const indexTerdekat = semuaSlot.indexOf(slotTerdekat);
    const prediksiNext = semuaSlot.slice(indexTerdekat+1, indexTerdekat+4);
    prediksiNext.forEach(slot=> addPrediksi(slot));

  } catch(err){
    cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
    console.error(err);
  }
}

// ===== Tambah slot prediksi ke tampilan =====
function addPrediksi(slot){
  const div = document.createElement("div");
  div.className = "cuaca-item";
  div.innerHTML = `
    <div>🌤️ ${slot.weather_desc}</div>
    <div>Suhu: ${slot.t}°C</div>
    <div>Kelembaban: ${slot.hu}%</div>
    <div class="cuaca-slot">🕒 Slot BMKG: ${new Date(slot.local_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
  `;
  cuacaPrediksiEl.appendChild(div);
}
