async function getLocationAndWeather() {
  const status = document.getElementById("status");
  const cuacaDiv = document.getElementById("cuaca");

  if (!navigator.geolocation) {
    status.textContent = "Browser Anda tidak mendukung GPS.";
    return;
  }

  status.textContent = "Mengambil lokasi Anda...";

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      status.textContent = `Lokasi terdeteksi: ${lat.toFixed(3)}, ${lon.toFixed(3)} 🌍`;

      // 1️⃣ Dapatkan nama provinsi dari koordinat (pakai Nominatim)
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        const provinsi = geoData.address.state;
        if (!provinsi) {
          cuacaDiv.textContent = "Gagal mengenali provinsi.";
          return;
        }

        status.textContent = `📍 Provinsi terdeteksi: ${provinsi}`;

        // 2️⃣ Ambil data XML BMKG sesuai provinsi
        // Ubah nama provinsi ke format BMKG
const mapProvinsi = {
  "West Java": "JawaBarat",
  "Central Java": "JawaTengah",
  "East Java": "JawaTimur",
  "Jakarta": "DKIJakarta",
  "Banten": "Banten",
  "Yogyakarta": "DI Yogyakarta",
  "Bali": "Bali",
  "West Sumatra": "SumateraBarat",
  "North Sumatra": "SumateraUtara",
  "South Sumatra": "SumateraSelatan",
  "Aceh": "Aceh",
  "Riau": "Riau",
  "West Kalimantan": "KalimantanBarat",
  "East Kalimantan": "KalimantanTimur",
  "South Kalimantan": "KalimantanSelatan",
  "Central Kalimantan": "KalimantanTengah",
  "North Kalimantan": "KalimantanUtara",
  "West Nusa Tenggara": "NusaTenggaraBarat",
  "East Nusa Tenggara": "NusaTenggaraTimur",
  "Papua": "Papua",
  "West Papua": "PapuaBarat",
  "Maluku": "Maluku",
  "North Maluku": "MalukuUtara",
  "Bangka Belitung Islands": "KepBangkaBelitung",
  "Riau Islands": "KepulauanRiau",
  "Lampung": "Lampung",
  "Bengkulu": "Bengkulu",
  "Jambi": "Jambi",
  "Gorontalo": "Gorontalo",
  "North Sulawesi": "SulawesiUtara",
  "Central Sulawesi": "SulawesiTengah",
  "South Sulawesi": "SulawesiSelatan",
  "Southeast Sulawesi": "SulawesiTenggara",
  "West Sulawesi": "SulawesiBarat"
};

const provinsiBMKG = mapProvinsi[provinsi] || provinsi.replace(/\s+/g, "");

        const url = `https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-${provinsiBMKG}.xml`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Gagal ambil data BMKG");

        const text = await res.text();

        // 3️⃣ Parse XML
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "application/xml");

        const temp = xml.querySelector('parameter[id="t"] timerange value')?.textContent;
        const weatherCode = xml.querySelector('parameter[id="weather"] timerange value')?.textContent;
        const weatherDesc = kodeCuaca(weatherCode);

        cuacaDiv.innerHTML = `
          <p><b>🌡️ Suhu:</b> ${temp ? temp + "°C" : "Tidak tersedia"}</p>
          <p><b>🌤️ Cuaca:</b> ${weatherDesc}</p>
        `;
      } catch (err) {
        cuacaDiv.textContent = "Gagal memuat data cuaca dari BMKG.";
        console.error(err);
      }
    },
    (err) => {
      status.textContent = `GPS gagal: ${err.message}`;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// 4️⃣ Fungsi konversi kode cuaca BMKG ke teks
function kodeCuaca(kode) {
  const mapping = {
    0: "Cerah",
    1: "Cerah Berawan",
    2: "Cerah Berawan",
    3: "Berawan",
    4: "Berawan Tebal",
    5: "Udara Kabur",
    10: "Asap",
    45: "Kabut",
    60: "Hujan Ringan",
    61: "Hujan Sedang",
    63: "Hujan Lebat",
    80: "Hujan Lokal",
    95: "Hujan Petir",
    97: "Hujan Petir Lebat",
  };
  return mapping[kode] || "Tidak diketahui";
}

getLocationAndWeather();
