/* ===== State ===== */
let userLat = null;
let userLon = null;
let restaurants = [];
let isSpinning = false;

/* ===== DOM Elements ===== */
const btnLocate = document.getElementById('btn-locate');
const btnSearch = document.getElementById('btn-search');
const addressInput = document.getElementById('address-input');
const btnSpin = document.getElementById('btn-spin');
const locationStatus = document.getElementById('location-status');
const reelStrip = document.getElementById('reel-strip');
const statusDisplay = document.getElementById('status-display');
const machineSection = document.getElementById('machine-section');
const resultSection = document.getElementById('result-section');
const resultName = document.getElementById('result-name');
const resultCuisine = document.getElementById('result-cuisine');
const resultAddress = document.getElementById('result-address');
const resultMap = document.getElementById('result-map');

/* ===== Sound & Haptics ===== */

const SoundManager = (() => {
    let ctx = null;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    // Short click/tick sound for reel changes
    function playTick() {
        try {
            const c = getCtx();
            const osc = c.createOscillator();
            const gain = c.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(800, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.05);

            gain.gain.setValueAtTime(0.08, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(c.currentTime);
            osc.stop(c.currentTime + 0.05);
        } catch (e) { /* Audio not available */ }
    }

    // Heavy thud for reel stop
    function playStop() {
        try {
            const c = getCtx();

            // Low frequency thud
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(c.currentTime);
            osc.stop(c.currentTime + 0.15);

            // Click component
            const osc2 = c.createOscillator();
            const gain2 = c.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1200, c.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.08);
            gain2.gain.setValueAtTime(0.15, c.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
            osc2.connect(gain2);
            gain2.connect(c.destination);
            osc2.start(c.currentTime);
            osc2.stop(c.currentTime + 0.08);
        } catch (e) { /* Audio not available */ }
    }

    // Win jingle - ascending notes
    function playWin() {
        try {
            const c = getCtx();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const now = c.currentTime;

            notes.forEach((freq, i) => {
                const osc = c.createOscillator();
                const gain = c.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;

                const startTime = now + i * 0.12;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

                osc.connect(gain);
                gain.connect(c.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
        } catch (e) { /* Audio not available */ }
    }

    // Haptic feedback (vibration)
    function haptic(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    return {
        muted: false,

        // Initialize audio context on user gesture
        init() { getCtx(); },

        toggleMute() {
            this.muted = !this.muted;
            return this.muted;
        },

        tick() {
            if (this.muted) return;
            playTick();
            haptic(10);
        },

        stop() {
            if (this.muted) return;
            playStop();
            haptic(50);
        },

        win() {
            if (this.muted) return;
            playWin();
            haptic([100, 50, 100, 50, 200]);
        }
    };
})();

/* ===== Location ===== */

btnLocate.addEventListener('click', () => {
    SoundManager.init(); // Initialize audio on first user interaction

    if (!navigator.geolocation) {
        locationStatus.textContent = 'Geolocation not supported. Please enter an address.';
        return;
    }
    locationStatus.textContent = 'Getting your location...';
    btnLocate.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            userLat = pos.coords.latitude;
            userLon = pos.coords.longitude;
            locationStatus.textContent = `📍 Location found (${userLat.toFixed(4)}, ${userLon.toFixed(4)})`;
            btnLocate.disabled = false;
            fetchRestaurants();
        },
        (err) => {
            locationStatus.textContent = 'Location access denied. Please enter an address.';
            btnLocate.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
});

btnSearch.addEventListener('click', searchAddress);
addressInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchAddress();
});

async function searchAddress() {
    const query = addressInput.value.trim();
    if (!query) return;

    locationStatus.textContent = 'Searching...';
    btnSearch.disabled = true;

    try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await resp.json();

        if (data.length === 0) {
            locationStatus.textContent = 'Address not found. Try again.';
            btnSearch.disabled = false;
            return;
        }

        userLat = parseFloat(data[0].lat);
        userLon = parseFloat(data[0].lon);
        locationStatus.textContent = `📍 Found: ${data[0].display_name.split(',').slice(0, 2).join(',')}`;
        fetchRestaurants();
    } catch (e) {
        locationStatus.textContent = 'Search failed. Try again.';
    }

    btnSearch.disabled = false;
}

/* ===== Overpass API ===== */

async function fetchRestaurants() {
    statusDisplay.textContent = 'Finding nearby restaurants...';

    // Search radius from selector
    const radius = parseInt(document.getElementById('radius-select').value, 10);

    const query = `
        [out:json][timeout:30];
        (
            node["amenity"~"^(restaurant|fast_food|cafe)$"](around:${radius},${userLat},${userLon});
            way["amenity"~"^(restaurant|fast_food|cafe)$"](around:${radius},${userLat},${userLon});
        );
        out center body;
    `;

    try {
        const resp = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: 'data=' + encodeURIComponent(query),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = await resp.json();
        processRestaurants(data.elements);
    } catch (e) {
        statusDisplay.textContent = 'Failed to fetch restaurants. Try again.';
        console.error('Overpass error:', e);
    }
}

function processRestaurants(elements) {
    const now = new Date();
    const seen = new Set();
    restaurants = [];

    for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name;
        if (!name) continue;

        // Deduplicate by name
        if (seen.has(name)) continue;
        seen.add(name);

        // Skip if explicitly closed
        if (tags['opening_hours:covid19'] === 'closed' ||
            tags['opening_hours'] === 'off' ||
            tags['opening_hours'] === 'closed') {
            continue;
        }

        // Check if currently open
        const hours = tags['opening_hours'];
        const isOpen = hours ? checkOpeningHours(hours, now) : true; // Unknown hours = assume open
        if (!isOpen) continue;

        // Get coordinates
        let lat, lon;
        if (el.type === 'node') {
            lat = el.lat;
            lon = el.lon;
        } else if (el.type === 'way' && el.center) {
            lat = el.center.lat;
            lon = el.center.lon;
        } else {
            continue;
        }

        const cuisine = tags.cuisine ? tags.cuisine.split(';')[0] : '';
        const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');

        restaurants.push({
            name,
            cuisine,
            address: street,
            lat,
            lon,
            hours
        });
    }

    // Sort by distance
    restaurants.sort((a, b) => {
        const distA = haversine(userLat, userLon, a.lat, a.lon);
        const distB = haversine(userLat, userLon, b.lat, b.lon);
        return distA - distB;
    });

    // Take top 50 (keep it manageable for the slot machine)
    restaurants = restaurants.slice(0, 50);

    if (restaurants.length === 0) {
        statusDisplay.textContent = 'No open restaurants found nearby. Try a different location or larger radius.';
        btnSpin.disabled = true;
        return;
    }

    statusDisplay.textContent = `${restaurants.length} open restaurants found. Ready to spin!`;
    btnSpin.disabled = false;

    // Show first restaurant in reel
    updateReelItem(restaurants[0]);
}

/* ===== Opening Hours Parser ===== */

function checkOpeningHours(hours, now) {
    if (!hours || hours === '24/7') return true;
    if (hours === 'off' || hours === 'closed') return false;

    const day = now.getDay(); // 0=Sun, 1=Mon, ...
    const minutes = now.getHours() * 60 + now.getMinutes();

    // Normalize day: OSM uses Mo=1..Su=7
    const dayNum = day === 0 ? 7 : day;

    const dayAbbr = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const todayAbbr = dayAbbr[day];

    // Split by semicolons for multiple rules
    const rules = hours.split(';').map(r => r.trim());

    for (const rule of rules) {
        // Handle "24/7" within rules
        if (rule === '24/7') return true;

        // Parse: "Mo-Fr 09:00-17:00" or "Mo,Tu,We 08:00-20:00" or "Mo 10:00-22:00"
        const match = rule.match(/^([A-Za-z,\-\s]+?)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
        if (match) {
            const daysStr = match[1];
            const start = timeToMinutes(match[2]);
            const end = timeToMinutes(match[3]);

            if (dayMatches(daysStr, dayNum, dayAbbr)) {
                if (start <= end) {
                    if (minutes >= start && minutes <= end) return true;
                } else {
                    // Overnight (e.g., 22:00-03:00)
                    if (minutes >= start || minutes <= end) return true;
                }
            }
        }
    }

    return false;
}

function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function dayMatches(daysStr, targetDay, dayAbbr) {
    // Handle ranges like "Mo-Fr" and lists like "Mo,We,Fr"
    const parts = daysStr.split(',').map(s => s.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            // Range: Mo-Fr
            const [start, end] = part.split('-').map(d => {
                const trimmed = d.trim();
                return dayAbbr.indexOf(trimmed) === 0 ? dayAbbr.indexOf(trimmed) + 1 : null;
            });
            if (start !== null && end !== null) {
                if (start <= end) {
                    if (targetDay >= start && targetDay <= end) return true;
                } else {
                    // Wraps around week (e.g., Fr-Mo)
                    if (targetDay >= start || targetDay <= end) return true;
                }
            }
        } else {
            // Single day
            const idx = dayAbbr.indexOf(part);
            if (idx >= 0 && (idx === 0 ? 7 : idx) === targetDay) return true;
        }
    }

    return false;
}

/* ===== Haversine Distance ===== */

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ===== Slot Machine Animation ===== */

const REEL_ITEM_HEIGHT = 120;

function updateReelItem(restaurant) {
    reelStrip.innerHTML = `
        <div class="reel-item">
            <div class="name">${restaurant.name}</div>
            ${restaurant.cuisine ? `<div class="cuisine">${restaurant.cuisine}</div>` : ''}
        </div>
    `;
    reelStrip.style.transform = 'translateY(0)';
}

async function spinSlotMachine() {
    if (isSpinning || restaurants.length === 0) return;
    isSpinning = true;
    btnSpin.disabled = true;
    resultSection.classList.add('hidden');
    machineSection.classList.add('spinning');
    statusDisplay.textContent = 'Spinning...';

    // Pick a random winner
    const winnerIndex = Math.floor(Math.random() * restaurants.length);
    const winner = restaurants[winnerIndex];

    // Spin animation: cycle through restaurants with varying speed
    const totalSpins = 40 + Math.floor(Math.random() * 20); // 40-60 cycles
    const currentIndex = { value: 0 };

    for (let i = 0; i < totalSpins; i++) {
        // Calculate delay: fast at start, slows down at the end
        const progress = i / totalSpins;
        let delay;
        if (progress < 0.3) {
            delay = 50; // Fast spin
        } else if (progress < 0.6) {
            delay = 80 + (progress - 0.3) * 200; // Medium
        } else if (progress < 0.85) {
            delay = 150 + (progress - 0.6) * 600; // Slowing
        } else {
            delay = 300 + (progress - 0.85) * 2000; // Very slow
        }

        // Cycle through restaurants
        currentIndex.value = i % restaurants.length;
        updateReelItem(restaurants[currentIndex.value]);

        // Add blur during fast spins
        if (progress < 0.7) {
            reelStrip.querySelector('.reel-item')?.classList.add('blur');
        } else {
            reelStrip.querySelector('.reel-item')?.classList.remove('blur');
        }

        // Sound & haptics on each reel change
        SoundManager.tick();

        await sleep(delay);
    }

    // Land on the winner
    updateReelItem(winner);
    reelStrip.querySelector('.reel-item')?.classList.remove('blur');

    // Final stop sound
    SoundManager.stop();

    await sleep(500);

    // Show result
    machineSection.classList.remove('spinning');
    showResult(winner);

    // Win sound
    SoundManager.win();

    isSpinning = false;
    btnSpin.disabled = false;
}

function showResult(restaurant) {
    resultName.textContent = restaurant.name;
    resultCuisine.textContent = restaurant.cuisine || '';
    resultAddress.textContent = restaurant.address || 'Address not available';
    resultMap.href = `https://www.openstreetmap.org/?mlat=${restaurant.lat}&mlon=${restaurant.lon}#map=17/${restaurant.lat}/${restaurant.lon}`;

    resultSection.classList.remove('hidden');
    statusDisplay.textContent = '🎉 Winner! 🎉';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* ===== Event Listeners ===== */

btnSpin.addEventListener('click', spinSlotMachine);

/* ===== Mute Toggle ===== */
const btnMute = document.getElementById('btn-mute');
if (btnMute) {
    btnMute.addEventListener('click', () => {
        const muted = SoundManager.toggleMute();
        btnMute.textContent = muted ? '🔇' : '🔊';
    });
}
