const statusEl = document.getElementById("status");
const lokasiEl = document.getElementById("lokasi");
const cuacaSekarangEl = document.getElementById("cuaca-sekarang");
const cuacaPrediksiEl = document.getElementById("cuaca-prediksi");

// Peta
const map = L.map('map').setView([-6.2, 106.8], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
}).addTo(map);
let marker;

// Fungsi untuk menampilkan cuaca dari BMKG
async function fetchCuaca(adm4, namaWilayah) {
  try {
    const res = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`);
    const data = await res.json();
    const semuaSlot = data.data[0].cuaca.flat();

    const now = new Date();
    let slotTerdekat = semuaSlot.reduce((terdekat, slot) => {
      const diff = Math.abs(new Date(slot.local_datetime) - now);
      return diff < Math.abs(new Date(terdekat.local_datetime) - now)
        ? slot : terdekat;
    });

    cuacaSekarangEl.innerHTML = `
      <div>🌤️ ${slotTerdekat.weather_desc}</div>
      <div>🌡️ Suhu: ${slotTerdekat.t}°C</div>
      <div>💧 Kelembapan: ${slotTerdekat.hu}%</div>
    `;

    cuacaPrediksiEl.innerHTML = "";
    const idx = semuaSlot.indexOf(slotTerdekat);
    semuaSlot.slice(idx+1, idx+4).forEach(slot => {
      const div = document.createElement("div");
      div.className = "cuaca-item";
      div.innerHTML = `
        <div>${slot.weather_desc}</div>
        <div>Suhu: ${slot.t}°C</div>
        <div>Kelembapan: ${slot.hu}%</div>
        <div>🕒 ${new Date(slot.local_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
      `;
      cuacaPrediksiEl.appendChild(div);
    });

    statusEl.textContent = "✅ Data cuaca berhasil dimuat";
    lokasiEl.textContent = `📍 ${namaWilayah}`;

  } catch (e) {
    console.error(e);
    statusEl.textContent = "⚠️ Gagal ambil data BMKG";
  }
}

// Dapatkan lokasi pengguna via GPS
navigator.geolocation.getCurrentPosition(async (pos) => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  map.setView([lat, lon], 13);
  marker = L.marker([lat, lon]).addTo(map).bindPopup("Lokasimu").openPopup();

  statusEl.textContent = "📍 Lokasi ditemukan, mencari wilayah...";

  // Reverse geocoding via Nominatim (gratis)
  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
  const res = await fetch(nominatimUrl);
  const data = await res.json();

  const kel = data.address.village || data.address.suburb || data.address.town || "Wilayah Tidak Dikenal";
  const kota = data.address.city || data.address.county || "Depok";

  lokasiEl.textContent = `📍 ${kel}, ${kota}`;

  // Ambil daftar wilayah BMKG via redirect Netlify (tanpa CORS)
  const wilayahRes = await fetch("/bmkg/publik/prakiraan-wilayah.json");
  const wilayahData = await wilayahRes.json();

  // Cari kode adm4 berdasarkan kecocokan nama wilayah
  const kecocokan = wilayahData.filter(w => w.desa.toLowerCase().includes(kel.toLowerCase()));
  if (kecocokan.length > 0) {
    fetchCuaca(kecocokan[0].kode, kel);
  } else {
    statusEl.textContent = "⚠️ Wilayah tidak ditemukan di data BMKG.";
  }

}, async (err) => {
  statusEl.textContent = "⚠️ GPS gagal, mencoba lokasi berdasarkan IP...";
  const ip = await fetch("https://ipapi.co/json/");
  const data = await ip.json();
  map.setView([data.latitude, data.longitude], 12);
  marker = L.marker([data.latitude, data.longitude]).addTo(map);
});
