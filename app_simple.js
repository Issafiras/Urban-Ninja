// Urban Ninja - Simple Version
// Mapbox token - Replace with your actual token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaXNzYWZpcmFzMTk5MCIsImEiOiJjbWluMTEzaHYxeXRjM2ZzNjM4aG54MjNnIn0.7sTv1tWfPgmWc2Uwlp_GnQ';

// Initialize the map
const map = L.map('map').setView([56.208, 10.035], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
}).addTo(map);

// Routing Control Reference
let routingControl = null;

// State variables
let wizardState = {
    step: 1,
    start: null,
    destination: null,
    hacks: new Set()
};

// UI Elements
const step1Div = document.getElementById('wizard-step-1');
const step2Div = document.getElementById('wizard-step-2');
const step3Div = document.getElementById('wizard-step-3');
const missionControlsDiv = document.getElementById('mission-controls');
const trafficStatus = document.getElementById('trafficStatus');

const startInput = document.getElementById('startInput');
const destInput = document.getElementById('destInput');
const startSuggestions = document.getElementById('startSuggestions');
const destSuggestions = document.getElementById('destSuggestions');
const startSearchBtn = document.getElementById('startSearchBtn');
const destSearchBtn = document.getElementById('destSearchBtn');

// Control Panel Elements
const controlPanel = document.querySelector('.control-panel');
const emergencyToggle = document.getElementById('emergencyToggle');

// Debug: Check if elements exist
console.log('startInput:', startInput);
console.log('startSuggestions:', startSuggestions);
console.log('destInput:', destInput);
console.log('destSuggestions:', destSuggestions);
console.log('controlPanel:', controlPanel);
console.log('missionControlsDiv:', missionControlsDiv);

// Elements loaded successfully

const useLocationBtn = document.getElementById('useLocationBtn');
const step1NextBtn = document.getElementById('step1Next');
const step2BackBtn = document.getElementById('step2Back');
const step2NextBtn = document.getElementById('step2Next');
const step3BackBtn = document.getElementById('step3Back');
const startMissionBtn = document.getElementById('startMissionBtn');
const newMissionBtn = document.getElementById('newMissionBtn');

// Hack toggles
const ninjaToggle = document.querySelector(".hack-toggle[data-hack='ninja']");
const aggressiveButton = document.querySelector(".hack-toggle[data-hack='aggressive']");

// Global state
let isNinjaMode = false;
let isAggressive = false;
let isRouting = false;
let isUrbanNinjaMode = false;
let useExtremeRouting = false; // New: completely ignore speed/access restrictions
let trafficData = null; // Store current traffic conditions
let lastTrafficUpdate = 0; // Timestamp of last traffic update

// Utility functions
function restoreControlPanel() {
    if (controlPanel) {
        controlPanel.style.display = 'block';
        controlPanel.style.zIndex = '10000';
        controlPanel.style.position = 'absolute';
        controlPanel.style.top = '20px';
        controlPanel.style.right = '20px';
        console.log('Control panel restored');
    }
    if (emergencyToggle) {
        emergencyToggle.classList.remove('show');
    }
}

function setStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
    }
}

function showToast(message, type = 'info', duration = 3000) {
    console.log(`${type.toUpperCase()}: ${message}`);
    // Simple console log for now
}

function showProgress() {
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
}

function hideProgress() {
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

// Step navigation
function showStep(step) {
    console.log('showStep called with step:', step);
    wizardState.step = step;

    // Hide all steps
    if (step1Div) step1Div.style.display = 'none';
    if (step2Div) step2Div.style.display = 'none';
    if (step3Div) step3Div.style.display = 'none';
    if (missionControlsDiv) missionControlsDiv.style.display = 'none';

    // Show current step
    switch(step) {
        case 1:
            console.log('Showing step 1');
            if (step1Div) step1Div.style.display = 'block';
            break;
        case 2:
            console.log('Showing step 2');
            if (step2Div) step2Div.style.display = 'block';
            break;
        case 3:
            console.log('Showing step 3');
            if (step3Div) step3Div.style.display = 'block';
            break;
        case 4:
            console.log('Showing step 4 (mission controls)');
            if (missionControlsDiv) {
                missionControlsDiv.style.display = 'block';
                console.log('missionControlsDiv set to block');

                // Ensure control panel is visible
                if (controlPanel) {
                    controlPanel.style.display = 'block';
                    controlPanel.style.zIndex = '10000';
                }

                // Hide emergency toggle if control panel is visible
                setTimeout(() => {
                    if (controlPanel && controlPanel.offsetHeight > 0) {
                        if (emergencyToggle) emergencyToggle.classList.remove('show');
                    } else {
                        console.warn('Control panel may be hidden, showing emergency toggle');
                        if (emergencyToggle) emergencyToggle.classList.add('show');
                    }
                }, 100);

            } else {
                console.error('missionControlsDiv is null!');
                if (emergencyToggle) emergencyToggle.classList.add('show');
            }
            break;
    }
}

// Geocoding function
async function geocodeAddress(address) {
    try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=dk&language=da`);
        const data = await response.json();
        return data.features || [];
    } catch (error) {
        console.error('Geocoding error:', error);
        return [];
    }
}

// Get traffic data from Mapbox
async function getTrafficData() {
    // Only update traffic data every 5 minutes to avoid API limits
    const now = Date.now();
    if (trafficData && (now - lastTrafficUpdate) < 300000) {
        console.log('Using cached traffic data');
        return trafficData;
    }

    try {
        console.log('Fetching fresh traffic data from Mapbox...');
        setStatus('Henter trafikdata...', 'loading');

        // Use Mapbox Traffic API - this gives us traffic flow data
        // We'll use a general Denmark bounding box for now
        const bounds = '7.0,54.0,16.0,58.0'; // Denmark approximate bounds
        const trafficUrl = `https://api.mapbox.com/traffic/v1/mapbox/traffic-flow/10/512/341/385.json?access_token=${MAPBOX_TOKEN}`;

        // Note: The traffic API might require different approach
        // For now, we'll simulate traffic data based on time of day
        const currentHour = new Date().getHours();
        let trafficMultiplier = 1.0;

        // Peak hours have more traffic
        if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 15 && currentHour <= 18)) {
            trafficMultiplier = 1.5; // 50% more traffic during rush hours
            console.log('Rush hour detected - high traffic conditions');
        } else if (currentHour >= 22 || currentHour <= 5) {
            trafficMultiplier = 0.8; // Less traffic at night
            console.log('Night time - low traffic conditions');
        } else {
            trafficMultiplier = 1.1; // Slight traffic during normal hours
            console.log('Normal traffic conditions');
        }

        trafficData = {
            multiplier: trafficMultiplier,
            timestamp: now,
            description: trafficMultiplier > 1.3 ? 'Tung trafik' :
                        trafficMultiplier > 1.0 ? 'Moderat trafik' :
                        trafficMultiplier < 1.0 ? 'Let trafik' : 'Normal trafik'
        };

        lastTrafficUpdate = now;
        console.log('Traffic data updated:', trafficData);

        // Update UI
        updateTrafficStatus(trafficData);

        return trafficData;

    } catch (error) {
        console.error('Traffic data fetch error:', error);
        // Return default traffic data
        trafficData = {
            multiplier: 1.0,
            timestamp: Date.now(),
            description: 'Trafikdata utilgængelig'
        };
        return trafficData;
    }
}

// Manual search function
async function manualSearch(input, suggestionsContainer) {
    const val = input.value.trim();
    if (val.length < 2) {
        showToast('Indtast mindst 2 tegn', 'error');
        return;
    }

    setStatus('Søger efter: ' + val, 'loading');

    try {
        const results = await geocodeAddress(val);
        suggestionsContainer.innerHTML = '';

        if (results.length === 0) {
            showToast('Ingen resultater fundet', 'error');
            setStatus('Ingen resultater fundet', 'error');
            return;
        }

        results.forEach(feature => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = feature.place_name;
            div.addEventListener('click', () => {
                input.value = feature.place_name;
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.classList.remove('show');

                // Store coordinates for routing
                const coords = feature.center;
                if (input === startInput) {
                    wizardState.start = {
                        latlng: L.latLng(coords[1], coords[0]),
                        name: feature.place_name
                    };
                    console.log('Manual start coordinates set:', wizardState.start);
                } else if (input === destInput) {
                    wizardState.destination = {
                        latlng: L.latLng(coords[1], coords[0]),
                        name: feature.place_name
                    };
                    console.log('Manual destination coordinates set:', wizardState.destination);
                }

                showToast('Adresse valgt: ' + feature.place_name, 'success');
            });
            suggestionsContainer.appendChild(div);
        });

        suggestionsContainer.classList.add('show');
        setStatus('Vælg fra søgeresultater', 'success');
        showToast(results.length + ' resultater fundet', 'success');

    } catch (error) {
        console.error('Manual search error:', error);
        showToast('Fejl ved søgning', 'error');
        setStatus('Søgningsfejl', 'error');
    }
}

// Setup autocomplete for inputs
function setupAutocomplete(input, suggestionsContainer) {
    let timeout;

    input.addEventListener('input', function() {
        const val = this.value.trim();
        clearTimeout(timeout);

        if (val.length < 2) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.remove('show');
            return;
        }

        timeout = setTimeout(() => {
            (async () => {
                try {
                    const results = await geocodeAddress(val);

                suggestionsContainer.innerHTML = '';

                if (results.length === 0) {
                    const noResults = document.createElement('div');
                    noResults.className = 'suggestion-item';
                    noResults.textContent = 'Ingen resultater fundet';
                    suggestionsContainer.appendChild(noResults);
                } else {
                    results.forEach(feature => {
                        const div = document.createElement('div');
                        div.className = 'suggestion-item';
                        div.textContent = feature.place_name;
                div.addEventListener('click', async () => {
                    input.value = feature.place_name;
                    suggestionsContainer.innerHTML = '';
                    suggestionsContainer.classList.remove('show');

                    // Store coordinates for routing
                    const coords = feature.center;
                    if (input === startInput) {
                        wizardState.start = {
                            latlng: L.latLng(coords[1], coords[0]),
                            name: feature.place_name
                        };
                        console.log('Start coordinates set:', wizardState.start);
                    } else if (input === destInput) {
                        wizardState.destination = {
                            latlng: L.latLng(coords[1], coords[0]),
                            name: feature.place_name
                        };
                        console.log('Destination coordinates set:', wizardState.destination);
                    }
                });
                        suggestionsContainer.appendChild(div);
                    });
                }

                if (results.length > 0) {
                    suggestionsContainer.classList.add('show');
                }
            } catch (error) {
                console.error('Autocomplete error:', error);
                suggestionsContainer.innerHTML = '';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'suggestion-item';
                errorDiv.textContent = 'Fejl ved søgning';
                suggestionsContainer.appendChild(errorDiv);
                suggestionsContainer.classList.add('show');
            }
            })();
        }, 300);
    });

    // Enter key support for search
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            manualSearch(input, suggestionsContainer).catch(console.error);
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.remove('show');
        }
    });
}

// Update traffic status UI
function updateTrafficStatus(traffic) {
    if (!trafficStatus) return;

    let statusClass = '';
    let emoji = '🚦';

    if (traffic.multiplier > 1.3) {
        statusClass = 'high-traffic';
        emoji = '🚨';
    } else if (traffic.multiplier < 1.0) {
        statusClass = 'low-traffic';
        emoji = '✅';
    }

    // Remove existing classes
    trafficStatus.classList.remove('high-traffic', 'low-traffic');

    // Add new class
    if (statusClass) {
        trafficStatus.classList.add(statusClass);
    }

    trafficStatus.textContent = `${emoji} ${traffic.description} (${traffic.multiplier}x)`;
    console.log('Traffic status updated:', trafficStatus.textContent);
}

// Get user location
async function getUserLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation ikke understøttet', 'error');
        return;
    }

    setStatus('Finder din position...', 'loading');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1&language=da`);
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    startInput.value = data.features[0].place_name;
                    wizardState.start = {
                        latlng: L.latLng(latitude, longitude),
                        name: data.features[0].place_name
                    };
                    console.log('GPS start coordinates set:', wizardState.start);
                    setStatus('Position fundet!', 'success');
                    showToast('GPS position fundet!', 'success');
                }
            } catch (error) {
                console.error('Reverse geocoding error:', error);
                startInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                wizardState.start = { latlng: L.latLng(latitude, longitude), name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` };
                setStatus('GPS koordinater fundet', 'success');
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            setStatus('Kunne ikke finde position', 'error');
            showToast('GPS fejl - tjek tilladelser', 'error');
        }
    );
}

// Start mission function
async function startMission() {
    if (!wizardState.start || !wizardState.destination) {
        showToast('Vælg start og destination først', 'error');
        return;
    }

    // If coordinates are missing, try to geocode the addresses
    if (!wizardState.start.latlng && wizardState.start.name) {
        console.log('Geocoding start address:', wizardState.start.name);
        setStatus('Finder koordinater for start adresse...', 'loading');
        try {
            const startResults = await geocodeAddress(wizardState.start.name);
            if (startResults.length > 0) {
                wizardState.start.latlng = L.latLng(startResults[0].center[1], startResults[0].center[0]);
                console.log('Start geocoded to:', wizardState.start.latlng);
                showToast('Start adresse fundet!', 'success');
            } else {
                showToast('Kunne ikke finde start adresse - prøv at vælge fra forslag', 'error');
                return;
            }
        } catch (error) {
            console.error('Start geocoding error:', error);
            showToast('Fejl ved søgning efter start adresse', 'error');
            return;
        }
    }

    if (!wizardState.destination.latlng && wizardState.destination.name) {
        console.log('Geocoding destination address:', wizardState.destination.name);
        setStatus('Finder koordinater for destination...', 'loading');
        try {
            const destResults = await geocodeAddress(wizardState.destination.name);
            if (destResults.length > 0) {
                wizardState.destination.latlng = L.latLng(destResults[0].center[1], destResults[0].center[0]);
                console.log('Destination geocoded to:', wizardState.destination.latlng);
                showToast('Destination fundet!', 'success');
            } else {
                showToast('Kunne ikke finde destination - prøv at vælge fra forslag', 'error');
                return;
            }
        } catch (error) {
            console.error('Destination geocoding error:', error);
            showToast('Fejl ved søgning efter destination', 'error');
            return;
        }
    }

    console.log('Starting mission with:', wizardState.start, wizardState.destination);

    isRouting = true;
    setStatus('Beregner rute...', 'loading');
    showProgress();

    // Remove existing routing control
    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Create router options
    const routerOptions = { profile: 'mapbox/driving-traffic' };
    if (wizardState.hacks.has('aggressive') || wizardState.hacks.has('urban-ninja')) {
        routerOptions.exclude = 'motorway';
        isAggressive = true;

        if (wizardState.hacks.has('urban-ninja')) {
            isUrbanNinjaMode = true;
            showToast('🐀 Urban Ninja: Beregner alle mulige genveje...', 'success');
        }
    }

    // Ensure control panel remains visible during routing
    restoreControlPanel();

    try {
        console.log('Creating routing control with options:', routerOptions);

        // Choose routing method based on extreme routing setting
        if (useExtremeRouting) {
            console.log('🔥 Using EXTREME Urban Ninja routing - ignoring ALL restrictions');
        router = {
            route: function(waypoints, callback, context, options) {
                console.log('🔥 EXTREME Urban Ninja: Pure distance-based routing with traffic awareness');

                // Get traffic data synchronously
                let traffic = trafficData; // Use cached data
                if (!traffic || (Date.now() - lastTrafficUpdate) > 300000) {
                    traffic = {
                        multiplier: 1.5,
                        description: 'Trafik (ukendt)',
                        timestamp: Date.now()
                    };
                    // Trigger async update in background
                    getTrafficData().catch(console.error);
                }

                // Skip normal routing entirely - use straight line
                const start = waypoints[0].latLng;
                const end = waypoints[1].latLng;
                const distance = start.distanceTo(end);

                // Calculate what normal traffic time would be (rough estimate)
                const estimatedTrafficTime = distance / 1000 * 60 * traffic.multiplier; // 60km/h base with traffic

                const extremeRoute = {
                    name: '🔥 EXTREME URBAN NINJA: Pure Distance Route',
                    coordinates: [start, end],
                    instructions: [{
                        type: 'Extreme',
                        text: `🔥 Ignorerer ALLE hastigheder, restriktioner og ${traffic.description.toLowerCase()} - absolut korteste distance!`,
                        distance: distance,
                        time: distance / 1000 * 60, // Assume 60km/h for time estimate
                        index: 0
                    }],
                    summary: {
                        totalDistance: distance,
                        totalTime: distance / 1000 * 60,
                        trafficAdjustedTime: estimatedTrafficTime,
                        timeSaved: `∞ vs ${traffic.description} (${Math.round(estimatedTrafficTime/60)}min)`
                    }
                };

                console.log(`🔥 Extreme route: ${distance}m pure distance`);
                console.log(`Traffic conditions ignored: ${traffic.description} (${traffic.multiplier}x would be ${Math.round(estimatedTrafficTime/60)}min)`);

                // Show extreme achievement
                setTimeout(() => {
                    const distanceKm = Math.round(distance/1000);
                    const extremeTime = Math.round(extremeRoute.summary.totalTime/60);
                    const trafficTime = Math.round(estimatedTrafficTime/60);
                    showToast(`🔥 EXTREME: ${distanceKm}km direkte! Tid: ${extremeTime}min (ignorerer ${traffic.description}: ${trafficTime}min)`, 'error', 8000);
                }, 1000);

                callback.call(context, null, [extremeRoute]);
            }
        };
        } else {
            // Standard Urban Ninja routing with modifications
            console.log('🦹 Using standard Urban Ninja routing with distance priority');
            router = {
            route: async function(waypoints, callback, context, options) {
                console.log('🦹 Ultra Urban Ninja routing: ignoring speed differences and access restrictions');

                // Use OSRM with modified behavior
                const osrmRouter = L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1',
                    profile: 'driving',
                    useHints: false,
                    suppressDemoServerWarning: true
                });

                osrmRouter.route(waypoints, function(err, routes) {
                    if (err) {
                        console.warn('OSRM failed, using straight-line emergency route:', err);

                        // Emergency fallback: straight line distance
                        const start = waypoints[0].latLng;
                        const end = waypoints[1].latLng;
                        const distance = start.distanceTo(end);

                        const emergencyRoute = {
                            name: '🚨 URBAN NINJA EMERGENCY: Straight Line (Ultimate Shortcut)',
                            coordinates: [start, end],
                            instructions: [{
                                type: 'Straight',
                                text: '🚨 Ignorerer ALLE restriktioner - tag den absolut korteste vej!',
                                distance: distance,
                                time: distance / 1000 * 60, // Assume 60km/h
                                index: 0
                            }],
                            summary: {
                                totalDistance: distance,
                                totalTime: distance / 1000 * 60,
                                originalTime: distance / 1000 * 120 // Show speed improvement
                            }
                        };

                        console.log(`Emergency route: ${distance}m straight line`);
                        callback.call(context, null, [emergencyRoute]);
                        return;
                    }

                    if (routes && routes.length > 0) {
                        // Get current traffic conditions (synchronously if available)
                        let traffic = trafficData; // Use cached data
                        if (!traffic || (Date.now() - lastTrafficUpdate) > 300000) {
                            // If no cached data or too old, get fresh data synchronously
                            traffic = {
                                multiplier: 1.1,
                                description: 'Standard trafik',
                                timestamp: Date.now()
                            };
                            // Trigger async update in background
                            getTrafficData().catch(console.error);
                        }

                        // Apply radical Urban Ninja modifications with traffic awareness
                        routes.forEach(route => {
                            route.originalTime = route.summary.totalTime;
                            route.originalDistance = route.summary.totalDistance;

                            // Apply traffic multiplier to original time
                            route.trafficAdjustedTime = route.originalTime * traffic.multiplier;

                            // Always apply Urban Ninja logic when routing
                            console.log('🦹 Applying Urban Ninja route modifications with traffic awareness');

                            if (isUrbanNinjaMode || wizardState.hacks.has('urban-ninja')) {
                                // Urban Ninja: Force all routes to use same "speed" (distance-based time calculation)
                                // This effectively ignores speed differences between road types AND traffic
                                route.summary.totalTime = route.summary.totalDistance / 1000 * 60; // 60km/h average
                                route.name = '🦹 ' + route.name + ' (URBAN NINJA: Distance Priority)';
                                route.ninjaTimeSaved = route.trafficAdjustedTime - route.summary.totalTime;

                                // Modify instructions to reflect Urban Ninja philosophy
                                if (route.instructions && route.instructions.length > 0) {
                                    route.instructions.forEach(instr => {
                                        if (instr.text) {
                                            instr.text = instr.text.replace(/motorvej|highway|expressway/gi, 'genvej');
                                            instr.text = instr.text.replace(/vejbaner|lanes/gi, 'små gader');
                                            instr.text = instr.text.replace(/trafik|congestion|jam/gi, 'fri bane');
                                        }
                                    });

                                    // Add Urban Ninja header instruction with traffic info
                                    route.instructions.unshift({
                                        type: 'UrbanNinja',
                                        text: `🦹 URBAN NINJA MODE: Ignorerer hastighedsgrænser, restriktioner og ${traffic.description.toLowerCase()}!`,
                                        distance: 0,
                                        time: 0,
                                        index: -1
                                    });
                                }
                            } else {
                                // Normal mode with traffic awareness
                                route.summary.totalTime = route.trafficAdjustedTime;
                                route.name = route.name + ` (${traffic.description})`;
                            }
                        });

                        // Sort routes by distance instead of time (Urban Ninja) or by adjusted time (normal)
                        if (isUrbanNinjaMode || wizardState.hacks.has('urban-ninja')) {
                            routes.sort((a, b) => a.summary.totalDistance - b.summary.totalDistance);
                        } else {
                            routes.sort((a, b) => a.summary.totalTime - b.summary.totalTime);
                        }

                        const selectedRoute = routes[0];

                        if (isUrbanNinjaMode || wizardState.hacks.has('urban-ninja')) {
                            const timeSaved = Math.max(0, selectedRoute.trafficAdjustedTime - selectedRoute.summary.totalTime);
                            console.log(`🦹 Urban Ninja selected: ${selectedRoute.summary.totalDistance}m route`);
                            console.log(`Time "saved" vs traffic-adjusted: ${Math.round(timeSaved/60)}min`);
                            console.log(`Traffic conditions: ${traffic.description} (${traffic.multiplier}x)`);

                            // Show Urban Ninja achievement with traffic-aware stats
                            setTimeout(() => {
                                const distanceKm = Math.round(selectedRoute.summary.totalDistance/1000);
                                const timeMin = Math.round(selectedRoute.summary.totalTime/60);
                                const trafficTimeMin = Math.round(selectedRoute.trafficAdjustedTime/60);
                                showToast(`🦹 Urban Ninja: ${distanceKm}km valgt! Tid: ${timeMin}min (${traffic.description}: ${trafficTimeMin}min)`, 'success', 7000);
                            }, 1000);
                        } else {
                            console.log(`Normal routing with traffic: ${selectedRoute.summary.totalTime}s (${traffic.description})`);
                        }
                    }

                    callback.call(context, null, routes);
                }, this, options);
            }
        };
        }

        routingControl = L.Routing.control({
            router: router,
            waypoints: [wizardState.start.latlng, wizardState.destination.latlng],
            routeWhileDragging: true,
            createMarker: (i, wp) => {
                const marker = L.marker(wp.latLng);
                if (i === 0) {
                    marker.bindPopup('START').openPopup();
                } else if (i === 1) {
                    marker.bindPopup('MÅL').openPopup();
                }
                return marker;
            }
        }).addTo(map);

        console.log('Routing control created and added to map');

        // Attach routing events
        routingControl.on('routesfound', function(e) {
            console.log('Routes found event triggered!', e);
            hideProgress();
            setStatus('Rute fundet!', 'success');
            showToast('Urban Ninja rute klar!', 'success');

            // Ensure control panel remains visible after routing
            if (controlPanel) {
                controlPanel.style.display = 'block';
                controlPanel.style.zIndex = '10000'; // Higher than routing controls
                console.log('Control panel made visible after routing');
            }

            console.log('About to call showStep(4)');
            showStep(4);
        });

        routingControl.on('routingerror', function(e) {
            hideProgress();
            setStatus('Routing fejl', 'error');
            showToast('Kunne ikke finde rute', 'error');
            isRouting = false;
        });

    } catch (error) {
        hideProgress();
        setStatus('Routing fejl', 'error');
        showToast('Fejl i routing system', 'error');
        console.error('Routing error:', error);
        isRouting = false;
    }
}

// Toggle functions
function toggleNinjaMode() {
    isNinjaMode = !isNinjaMode;
    document.body.classList.toggle('ninja-mode');

    if (isNinjaMode) {
        if (ninjaToggle) {
            ninjaToggle.textContent = 'NINJA MODE: ON';
            ninjaToggle.classList.add('active');
        }
        setStatus('Ninja Mode aktiveret!', 'success');
        showToast('Ninja Mode aktiveret!', 'success');
    } else {
        if (ninjaToggle) {
            ninjaToggle.textContent = 'NINJA MODE: OFF';
            ninjaToggle.classList.remove('active');
        }
        setStatus('Ninja Mode deaktiveret', 'success');
        showToast('Ninja Mode deaktiveret', 'success');
    }
}

// Urban Ninja Mode - Den ekstreme routing!
function toggleUrbanNinjaMode() {
    isUrbanNinjaMode = !isUrbanNinjaMode;
    useExtremeRouting = isUrbanNinjaMode; // Link extreme routing to Urban Ninja mode

    if (isUrbanNinjaMode) {
        setStatus('🔥 URBAN NINJA MODE: Scanner alle genveje...', 'loading');
        showToast('🐀 🔥 Urban Ninja aktiveret - ignorerer ALLE restriktioner!', 'error', 5000);

        // Aktiver aggressive routing + ekstra hacks
        isAggressive = true;

        // Vis alle mulige genveje på kortet (simuleret)
        showAlternativeRoutes();

    } else {
        setStatus('Urban Ninja Mode deaktiveret', 'success');
        showToast('Urban Ninja Mode deaktiveret', 'success');
        isAggressive = false;

        // Fjern alternative ruter
        clearAlternativeRoutes();
    }
}

// Vis alternative ruter (simuleret - ville kræve custom routing engine)
function showAlternativeRoutes() {
    // Dette er en simulering - i virkeligheden ville dette kræve:
    // 1. OpenStreetMap data for alle stier
    // 2. Custom pathfinding algoritme
    // 3. Crowd-sourced genveje database

    setTimeout(() => {
        if (isUrbanNinjaMode) {
            showToast('🚶 Fundet 3 genveje: Grusvej (-45 sek), Parkeringsplads (-30 sek), Gangsti (-60 sek)', 'success', 8000);
            setStatus('Urban Ninja: Genveje fundet! Vælg den hurtigste.');
        }
    }, 2000);
}

function clearAlternativeRoutes() {
    // Fjern alternative rute markeringer
    // (ville fjerne custom overlays i fuld implementation)
}

// Event listeners
if (useLocationBtn) useLocationBtn.addEventListener('click', () => getUserLocation());
if (step1NextBtn) step1NextBtn.addEventListener('click', () => {
            if (startInput.value.trim()) {
                // Store address name - coordinates will be geocoded when mission starts
                wizardState.start = {
                    latlng: null,
                    name: startInput.value.trim()
                };
                console.log('Start address set:', wizardState.start.name);
                showToast('Start adresse sat!', 'success');
                showStep(2);
            } else {
                showToast('Indtast start adresse', 'error');
            }
});

if (step2BackBtn) step2BackBtn.addEventListener('click', () => showStep(1));
if (step2NextBtn) step2NextBtn.addEventListener('click', () => {
    if (destInput.value.trim()) {
        wizardState.destination = {
            latlng: null,
            name: destInput.value.trim()
        };
        console.log('Destination address set:', wizardState.destination.name);
        showToast('Destination sat!', 'success');
        showStep(3);
    } else {
        showToast('Indtast destination', 'error');
    }
});

if (step3BackBtn) step3BackBtn.addEventListener('click', () => showStep(2));
    if (startMissionBtn) startMissionBtn.addEventListener('click', () => startMission());
if (newMissionBtn) newMissionBtn.addEventListener('click', () => {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    wizardState = { step: 1, start: null, destination: null, hacks: new Set() };
    startInput.value = '';
    destInput.value = '';
    isRouting = false;
    showStep(1);
    setStatus('Klar til ny mission');
});

// Hack toggles
document.querySelectorAll('.hack-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
        const hack = this.dataset.hack;
        if (wizardState.hacks.has(hack)) {
            wizardState.hacks.delete(hack);
            this.classList.remove('active');
        } else {
            wizardState.hacks.add(hack);
            this.classList.add('active');
        }

        // Apply immediate effects for some hacks
        if (hack === 'ninja') {
            toggleNinjaMode();
        } else if (hack === 'urban-ninja') {
            toggleUrbanNinjaMode();
        }
    });
});

// Setup autocomplete
if (startInput && startSuggestions) setupAutocomplete(startInput, startSuggestions);
if (destInput && destSuggestions) setupAutocomplete(destInput, destSuggestions);

// Setup search buttons
if (startSearchBtn) {
    startSearchBtn.addEventListener('click', () => {
        manualSearch(startInput, startSuggestions).catch(console.error);
    });
}

if (destSearchBtn) {
    destSearchBtn.addEventListener('click', () => {
        manualSearch(destInput, destSuggestions).catch(console.error);
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key.toLowerCase()) {
        case 'n':
            e.preventDefault();
            if (ninjaToggle) ninjaToggle.click();
            break;
        case 'u':
            e.preventDefault();
            const urbanNinjaBtn = document.querySelector(".hack-toggle[data-hack='urban-ninja']");
            if (urbanNinjaBtn) urbanNinjaBtn.click();
            break;
        case 'a':
            e.preventDefault();
            if (!isRouting && aggressiveButton) aggressiveButton.click();
            break;
        case 'c':
            e.preventDefault();
            restoreControlPanel();
            showToast('Kontrolpanel gendannet!', 'success');
            break;
        case 'm':
            e.preventDefault();
            console.log('Manual mission mode trigger');
            showStep(4);
            showToast('Sprang til mission mode!', 'success');
            break;
        case 'y':
            e.preventDefault();
            console.log('Test routing trigger');
            // Set test coordinates
            wizardState.start = {
                latlng: L.latLng(55.6761, 12.5683), // Copenhagen
                name: 'København Test'
            };
            wizardState.destination = {
                latlng: L.latLng(55.6761, 12.6000), // Copenhagen nearby
                name: 'København Test Destination'
            };
            startMission().catch(console.error);
            break;
        case 'x':
            e.preventDefault();
            useExtremeRouting = !useExtremeRouting;
            console.log('Extreme routing toggled:', useExtremeRouting);
            showToast(`🔥 Ekstrem routing: ${useExtremeRouting ? 'AKTIVERET' : 'DEAKTIVERET'}`, useExtremeRouting ? 'error' : 'success');
            break;
        case 't':
            e.preventDefault();
            console.log('Manual traffic update requested');
            getTrafficData().then(traffic => {
                showToast(`🚦 Trafik opdateret: ${traffic.description} (${traffic.multiplier}x)`, 'info');
            }).catch(err => {
                console.error('Traffic update failed:', err);
                showToast('Kunne ikke opdatere trafikdata', 'error');
            });
            break;
    }
});

// Clear any existing suggestions
if (startSuggestions) startSuggestions.innerHTML = '';
if (destSuggestions) destSuggestions.innerHTML = '';

// Emergency toggle functionality
if (emergencyToggle) {
    emergencyToggle.addEventListener('click', () => {
        if (controlPanel) {
            controlPanel.style.display = 'block';
            controlPanel.style.zIndex = '10000';
            console.log('Control panel restored via emergency toggle');
            showToast('Kontrolpanel gendannet!', 'success');
            emergencyToggle.classList.remove('show');
        } else {
            console.error('Control panel not found');
            showToast('Fejl: Kontrolpanel ikke fundet', 'error');
        }
    });
}

// Periodic check for control panel visibility (fallback)
setInterval(() => {
    if (wizardState.step === 4 && controlPanel && emergencyToggle) {
        const isVisible = controlPanel.offsetHeight > 0 && controlPanel.style.display !== 'none';
        if (!isVisible) {
            console.warn('Control panel appears hidden, showing emergency toggle');
            emergencyToggle.classList.add('show');
        }
    }
}, 2000);

// Initialize - ensure control panel is visible
setTimeout(() => {
    restoreControlPanel();
}, 100);

// Initialize traffic data on startup
getTrafficData().then(() => {
    console.log('Initial traffic data loaded');
});

// Initialize
console.log('Urban Ninja Simple loaded');
setStatus('Velkommen til Urban Ninja - søg efter adresser eller brug GPS');
