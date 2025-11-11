async function getLocationAndWeather() {
  const status = document.getElementById("status");
  const cuacaDiv = document.getElementById("cuaca");

  if (!navigator.geolocation) {
    status.textContent = "Browser Anda tidak mendukung GPS.";
    return;
  }

  status.textContent = "Mengambil lokasi Anda...";

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    status.textContent = `Lokasi terdeteksi: ${lat.toFixed(3)}, ${lon.toFixed(3)} 🌍`;

    // --- 1️⃣ Dapatkan nama provinsi dari koordinat (pakai Nominatim)
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    const provinsi = geoData.address.state;
    if (!provinsi) {
      cuacaDiv.textContent = "Gagal mengenali provinsi.";
      return;
    }

    status.textContent = `📍 Provinsi terdeteksi: ${provinsi}`;

    // --- 2️⃣ Ambil data XML BMKG sesuai provinsi
    const provinsiBMKG = provinsi.replace(/\s+/g, "");
    const url = `https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-${provinsiBMKG}.xml`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal ambil data BMKG");
      const text = await res.text();

      // --- 3️⃣ Parse XML
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");

      const areas = xml.getElementsByTagName("area");
      const forecasts = xml.getElementsByTagName("parameter");

      // Ambil 1 data contoh suhu & cuaca
      const temp = xml.querySel
