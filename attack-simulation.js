// attack-simulator.js
document.addEventListener('DOMContentLoaded', () => {
  // === CONFIGURASI SIMULASI ===
  const ATTACK_INTERVAL = 2500;
  const MAX_ATTACKS = 8;
  const CLUSTER_THRESHOLD = 3;

  const threatSources = [
    { ip: "192.168.1.101", location: "Jakarta", type: "DDoS", country: "ID" },
    { ip: "192.168.1.102", location: "Jakarta", type: "DDoS", country: "ID" },
    { ip: "192.168.1.103", location: "Jakarta", type: "DDoS", country: "ID" },
    { ip: "10.0.0.45", location: "Bandung", type: "Phishing", country: "ID" },
    { ip: "10.0.0.46", location: "Bandung", type: "Phishing", country: "ID" },
    { ip: "172.16.0.10", location: "Surabaya", type: "BruteForce", country: "ID" },
    { ip: "172.16.0.11", location: "Surabaya", type: "BruteForce", country: "ID" },
    { ip: "198.51.100.1", location: "Medan", type: "Malware", country: "ID" },
    { ip: "203.0.113.5", location: "Yogyakarta", type: "Scan", country: "ID" },
    { ip: "203.0.113.6", location: "Yogyakarta", type: "Scan", country: "ID" },
    { ip: "198.51.100.2", location: "Semarang", type: "DDoS", country: "ID" },
    { ip: "198.51.100.3", location: "Semarang", type: "DDoS", country: "ID" }
  ];

  let activeThreats = [];
  let threatCounter = 0;
  let lastUpdatedEl = document.getElementById('last-updated');
  let networkLinesContainer = document.getElementById('network-lines');
  let mapEl = document.getElementById('map');
  let hackingEffect = document.getElementById('hacking-effect');

  // DOM Elements
  const activeThreatsEl = document.getElementById('active-threats');
  const citiesTargetedEl = document.getElementById('cities-targeted');
  const threatClustersEl = document.getElementById('threat-clusters');
  const activityFeedEl = document.getElementById('activity-feed');

  // Lokasi koordinat
  const locations = {
    "Jakarta": [-6.2088, 106.8456],
    "Bandung": [-6.9175, 107.6191],
    "Surabaya": [-7.2575, 112.7521],
    "Medan": [3.5955, 98.6722],
    "Yogyakarta": [-7.7956, 110.3694],
    "Semarang": [-6.9965, 110.4215]
  };

  // Inisialisasi Peta
  window.map = L.map('map').setView([-2.5489, 118.0149], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(window.map);

  // Fungsi: Tambahkan titik ke peta + animasi serang
  function addThreatToMap(threat) {
    if (!window.map || !locations[threat.location]) return;

    const coords = locations[threat.location];
    const latlng = L.latLng(coords[0], coords[1]);

    // Konversi ke pixel untuk animasi
    const point = window.map.latLngToLayerPoint(latlng);

    // Animasi Gelombang Serangan
    const wave = document.createElement('div');
    wave.classList.add('attack-wave');
    wave.style.left = point.x + 'px';
    wave.style.top = point.y + 'px';
    mapEl.appendChild(wave);

    // Animasi Aliran Data (streaming line)
    const stream = document.createElement('div');
    stream.classList.add('data-stream');
    stream.style.left = (point.x - 50) + 'px';
    stream.style.top = (point.y - 50) + 'px';
    stream.style.width = '150px';
    stream.style.transform = `rotate(${Math.random() * 360}deg)`;
    mapEl.appendChild(stream);

    // Animasi Ledakan Titik
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = point.x + 'px';
    explosion.style.top = point.y + 'px';
    mapEl.appendChild(explosion);

    // Aktifkan efek hacking saat ada serangan
    hackingEffect.classList.add('active');
    setTimeout(() => hackingEffect.classList.remove('active'), 2000);

    // Marker asli
    const marker = L.marker(latlng, {
      icon: L.divIcon({
        html: `<div style="
          background: linear-gradient(135deg, #ff0000, #cc0000);
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid #ff6666;
          box-shadow: 0 0 18px rgba(255, 0, 0, 0.9);
          animation: pulseMarker 1.6s infinite;
        "></div>`,
        className: '',
        iconSize: [18, 18]
      })
    }).addTo(window.map);

    threat.marker = marker;
    activeThreats.push(threat);

    addToActivityFeed(`🚨 NEW ${threat.type} ATTACK FROM ${threat.ip} (${threat.location})`, 'danger');
    updateStats();

    // Trigger particle trail
    createParticleTrail(coords);

    // Generate network lines
    generateNetworkLines();
  }

  // Hapus titik dari peta
  function removeThreatFromMap(threat) {
    if (threat.marker) window.map.removeLayer(threat.marker);
    activeThreats = activeThreats.filter(t => t !== threat);
  }

  // Update statistik
  function updateStats() {
    const uniqueCities = [...new Set(activeThreats.map(t => t.location))];
    const clusters = detectClusters();

    activeThreatsEl.textContent = activeThreats.length;
    citiesTargetedEl.textContent = uniqueCities.length;
    threatClustersEl.textContent = clusters.length;

    const now = new Date().toLocaleTimeString('id-ID');
    lastUpdatedEl.textContent = now;
  }

  // Deteksi klaster
  function detectClusters() {
    const locations = {};
    activeThreats.forEach(t => {
      if (!locations[t.location]) locations[t.location] = [];
      locations[t.location].push(t);
    });
    return Object.entries(locations).filter(([_, threats]) => threats.length >= CLUSTER_THRESHOLD);
  }

  // Tambahkan ke feed
  function addToActivityFeed(message, type = 'info') {
    const li = document.createElement('li');
    li.className = `list-group-item list-group-item-${type}`;
    li.innerHTML = `
      <span>${message}</span>
      <span class="time">${new Date().toLocaleTimeString('id-ID')}</span>
    `;

    li.style.opacity = 0;
    li.style.transform = 'translateX(-20px)';
    activityFeedEl.prepend(li);

    setTimeout(() => {
      li.style.transition = 'all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      li.style.opacity = 1;
      li.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
      li.style.opacity = 0;
      li.style.transform = 'translateX(-20px)';
      setTimeout(() => li.remove(), 700);
    }, 10000);
  }

  // Buat jejak partikel saat serangan
  function createParticleTrail(coords) {
    const mapEl = document.getElementById('map');
    const rect = mapEl.getBoundingClientRect();
    const x = (coords[1] + 180) * (rect.width / 360) + rect.left;
    const y = (90 - coords[0]) * (rect.height / 180) + rect.top;

    for (let i = 0; i < 8; i++) {
      const trail = document.createElement('div');
      trail.classList.add('particle-trail');
      trail.style.left = x + 'px';
      trail.style.top = y + 'px';
      trail.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
      trail.style.setProperty('--ty', (Math.random() * 200 - 100) + 'px');
      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 1500);
    }
  }

  // Buat garis jaringan antar klaster
  function generateNetworkLines() {
    const clusters = detectClusters();
    if (clusters.length < 2) return;

    // Hapus garis lama
    document.querySelectorAll('.network-line').forEach(el => el.remove());

    // Ambil 2 lokasi klaster acak
    const randomClusters = clusters.sort(() => 0.5 - Math.random()).slice(0, 2);
    const loc1 = locations[randomClusters[0][0]];
    const loc2 = locations[randomClusters[1][0]];

    if (!loc1 || !loc2) return;

    // Konversi latlng ke pixel
    const point1 = window.map.latLngToLayerPoint(loc1);
    const point2 = window.map.latLngToLayerPoint(loc2);

    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Buat garis
    const line = document.createElement('div');
    line.classList.add('network-line');
    line.style.width = `${length}px`;
    line.style.left = `${point1.x}px`;
    line.style.top = `${point1.y}px`;
    line.style.transformOrigin = 'left center';
    line.style.transform = `rotate(${angle}deg)`;

    networkLinesContainer.appendChild(line);

    // Animate garis
    setTimeout(() => {
      line.style.opacity = '0.8';
    }, 100);
  }

  // Blokir semua
  window.blockAllThreats = function() {
    // Simpan fungsi asli
    const original = window.originalBlockAllThreats;
    if (original) original();

    // Efek visual
    const blackhole = document.getElementById('blackhole');
    blackhole.classList.add('active');
    setTimeout(() => blackhole.classList.remove('active'), 3000);

    // Partikel jatuh
    for (let i = 0; i < 40; i++) {
      const trail = document.createElement('div');
      trail.classList.add('particle-trail');
      trail.style.left = (Math.random() * 100) + '%';
      trail.style.top = (Math.random() * 100) + '%';
      trail.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
      trail.style.setProperty('--ty', (Math.random() * 200 - 100) + 'px');
      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 1500);
    }
  };

  // Simulasi serangan
  function simulateAttack() {
    if (activeThreats.length >= MAX_ATTACKS) return;

    const randomSource = threatSources[Math.floor(Math.random() * threatSources.length)];
    const newThreat = {
      id: ++threatCounter,
      ...randomSource,
      timestamp: new Date().toISOString()
    };

    addThreatToMap(newThreat);

    // Cek cluster
    const clusters = detectClusters();
    if (clusters.length > 0) {
      clusters.forEach(([location, threats]) => {
        addToActivityFeed(`⚠️ COORDINATED ATTACK DETECTED: ${threats.length} IPs from ${location}`, 'warning');
      });
    }
  }

  // Jalankan simulasi
  setInterval(simulateAttack, ATTACK_INTERVAL);

  // Tambahkan 3 titik awal
  for (let i = 0; i < 3; i++) {
    simulateAttack();
  }

  console.log("✅ NCG THREAT MAP — ULTIMATE ELEGANT VERSION ACTIVE");
});
