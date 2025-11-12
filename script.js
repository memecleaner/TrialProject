// Elemen utama
const lokasiEl = document.getElementById("lokasi");
const cuacaSekarangEl = document.getElementById("cuaca-sekarang");
const cuacaPrediksiEl = document.getElementById("cuaca-prediksi");
const refreshBtn = document.getElementById("refresh-btn");

// Daftar lokasi BMKG (kode ADM4 BMKG)
const lokasiBMKG = [
  {nama:"Beji", kode:"32.76.06.1001"},
  {nama:"Tugu", kode:"32.76.02.1009"},
  {nama:"Pondok Cina", kode:"32.76.06.1005"},
  {nama:"Depok Jaya", kode:"32.76.01.1007"},
  {nama:"Sawangan", kode:"32.76.03.1010"},
  {nama:"Cipayung", kode:"32.76.07.1001"},
  {nama:"Harjamukti", kode:"32.76.02.1007"},
  {nama:"Duren Seribu (Bojongsari)", kode:"32.76.11.1007"},
  {nama:"Depok (Pancoran Mas)", kode:"32.76.01.1006"},
  {nama:"Citayam (Tajurhalang)", kode:"32.01.37.2002"},
  {nama:"Cipayung Jaya", kode:"32.76.07.1002"},
  {nama:"Cimanggis", kode:"32.76.02.1001"},
  {nama:"Sukmajaya", kode:"32.76.05.1003"},
  {nama:"Tapos", kode:"32.76.04.1001"},
  {nama:"Cilodong", kode:"32.76.09.1002"},
  {nama:"Limo", kode:"32.76.10.1001"},
  {nama:"Cinere", kode:"32.76.08.1001"},
  // pinggiran Depok
  {nama:"Cibinong", kode:"32.01.07.1001"},
  {nama:"Parung", kode:"32.01.13.1001"},
  {nama:"Gunung Sindur", kode:"32.01.09.1001"},
  {nama:"Jagakarsa", kode:"31.74.10.1001"},
  {nama:"Lenteng Agung", kode:"31.74.10.1003"},
  {nama:"Pasar Minggu", kode:"31.74.09.1003"},
  {nama:"Cinangka", kode:"32.76.03.1009"}
];

// Koordinat wilayah untuk pencocokan lokasi & marker peta
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
  "Cipayung Jaya": {lat:-6.3805, lon:106.8442},
  "Cimanggis": {lat:-6.3525, lon:106.8673},
  "Sukmajaya": {lat:-6.3810, lon:106.8446},
  "Tapos": {lat:-6.4060, lon:106.8900},
  "Cilodong": {lat:-6.4225, lon:106.8640},
  "Limo": {lat:-6.3668, lon:106.7897},
  "Cinere": {lat:-6.3459, lon:106.7875},
  "Cibinong": {lat:-6.4850, lon:106.8540},
  "Parung": {lat:-6.4548, lon:106.7398},
  "Gunung Sindur": {lat:-6.3921, lon:106.7087},
  "Jagakarsa": {lat:-6.3345, lon:106.8223},
  "Lenteng Agung": {lat:-6.3395, lon:106.8331},
  "Pasar Minggu": {lat:-6.2892, lon:106.8316},
  "Cinangka": {lat:-6.3660, lon:106.7800}
};


// Fungsi hitung jarak (Haversine)
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
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Marker & garis
let userMarker = null;
let bmkgMarker = null;
let lineBetween = null;

// Custom icon
const iconUser = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const iconBMKG = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// ===== Tambahkan semua tower BMKG ke map =====
Object.keys(lokasiBMKGKoord).forEach(nama => {
  const {lat, lon} = lokasiBMKGKoord[nama];
  L.marker([lat, lon], {icon: iconBMKG}).addTo(map).bindPopup(`BMKG: ${nama}`);
});

// ===== Fungsi tampilkan posisi user + BMKG terdekat =====
function tampilkanLokasi(lat, lon) {
  let terdekat = lokasiBMKG[0];
  let minJarak = Infinity;
  lokasiBMKG.forEach(lok => {
    const k = lokasiBMKGKoord[lok.nama];
    const jarak = hitungJarak(lat, lon, k.lat, k.lon);
    if(jarak < minJarak) {
      minJarak = jarak;
      terdekat = lok;
    }
  });

  const bmkgCoord = lokasiBMKGKoord[terdekat.nama];

  // marker user (biru)
  if (userMarker) userMarker.setLatLng([lat, lon]);
  else userMarker = L.marker([lat, lon], {icon: iconUser}).addTo(map).bindPopup("Lokasi Anda");

  // garis penghubung
  if (lineBetween) map.removeLayer(lineBetween);
  lineBetween = L.polyline([[lat, lon],[bmkgCoord.lat, bmkgCoord.lon]], {color:'#0078d7', weight:3, opacity:0.7}).addTo(map);

  // perbarui info
  lokasiEl.innerHTML = `📍 Lokasi terdeteksi: <b>${terdekat.nama}, Depok</b>
                        <div class="info-distance">Jarak ke stasiun BMKG: ${minJarak.toFixed(2)} km</div>`;

  map.fitBounds([[lat, lon], [bmkgCoord.lat, bmkgCoord.lon]], {padding:[40,40]});

  // fetch cuaca
  fetchCuaca(terdekat.kode);
}

// ===== Ambil lokasi user =====
async function deteksiLokasi() {
  lokasiEl.textContent = "📡 Mendeteksi lokasi...";
  if (userMarker) map.removeLayer(userMarker);
  if (lineBetween) map.removeLayer(lineBetween);

  navigator.geolocation.getCurrentPosition(
    pos => tampilkanLokasi(pos.coords.latitude, pos.coords.longitude),
    err => {
      lokasiEl.textContent = "❌ Gagal mendeteksi lokasi.";
      console.warn("Geolocation error:", err);
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

// ===== Tombol refresh =====
refreshBtn.addEventListener("click", deteksiLokasi);

// ===== Ambil data cuaca =====
async function fetchCuaca(kode) {
  const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${kode}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.data || !data.data[0].cuaca) {
      cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
      return;
    }

    const semuaSlot = data.data[0].cuaca.flat();
    const now = new Date();

    // slot terdekat
    let slotTerdekat = semuaSlot.reduce((a,b)=>{
      return Math.abs(new Date(a.local_datetime)-now) < Math.abs(new Date(b.local_datetime)-now) ? a:b;
    });

    // tampilkan cuaca sekarang
    cuacaSekarangEl.innerHTML = `
      <div>🌤️ ${slotTerdekat.weather_desc}</div>
      <div>Suhu: ${slotTerdekat.t}°C</div>
      <div>Kelembaban: ${slotTerdekat.hu}%</div>
      <div class="cuaca-slot">🕒 ${new Date(slotTerdekat.local_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
    `;

    // tampilkan prediksi 3 slot berikutnya
    cuacaPrediksiEl.innerHTML = "";
    const idx = semuaSlot.indexOf(slotTerdekat);
    semuaSlot.slice(idx+1, idx+4).forEach(addPrediksi);

  } catch(err) {
    console.error(err);
    cuacaSekarangEl.textContent = "Prediksi cuaca tidak tersedia.";
  }
}

function addPrediksi(slot){
  const div = document.createElement("div");
  div.className = "cuaca-item";
  div.innerHTML = `
    <div>🌤️ ${slot.weather_desc}</div>
    <div>Suhu: ${slot.t}°C</div>
    <div>Kelembaban: ${slot.hu}%</div>
    <div class="cuaca-slot">🕒 ${new Date(slot.local_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
  `;
  cuacaPrediksiEl.appendChild(div);
}

// Jalankan pertama kali
deteksiLokasi();
