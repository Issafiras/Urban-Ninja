        // Mapbox token - Replace with your actual token
        const MAPBOX_TOKEN = 'pk.eyJ1IjoiaXNzYWZpcmFzMTk5MCIsImEiOiJjbWluMTEzaHYxeXRjM2ZzNjM4aG54MjNnIn0.7sTv1tWfPgmWc2Uwlp_GnQ';

        // Debug logging
        console.log('Urban Ninja script loaded');

        // Initialize the map
        const map = L.map('map').setView([56.208, 10.035], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Â© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(map);

        // Define waypoints: Sabro to Aarhus C
        const sabro = L.latLng(56.208, 10.035);      // Sabro, Denmark
        const aarhusC = L.latLng(56.1572, 10.2107);   // Aarhus Central Station

        // Create routing control with Mapbox Directions API for real-time traffic
        const routingControl = L.Routing.control({
            router: L.Routing.mapbox(MAPBOX_TOKEN, { profile: 'mapbox/driving-traffic' }),
            waypoints: [sabro, aarhusC],
            routeWhileDragging: true,
            createMarker: function(i, waypoint, n) {
                const markerOptions = {
                    draggable: true,
                };

                if (i === 0) {
                    // Start marker (Sabro)
                    markerOptions.icon = L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    });
                } else if (i === n-1) {
                    // End marker (Aarhus C)
                    markerOptions.icon = L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    });
                }

                return L.marker(waypoint.latLng, markerOptions);
            },
            lineOptions: {
                styles: [{
                    color: '#00FFFF',      // Neon Cyan
                    weight: 6,
                    opacity: 0.8
                }, {
                    color: '#0080FF',      // Slightly darker cyan for outline
                    weight: 10,
                    opacity: 0.4
                }]
            }
        }).addTo(map);

        // UI Elements
        const ninjaToggle = document.getElementById('ninjaToggle');
        const mapElement = document.getElementById('map');
        const aggressiveButton = document.getElementById('aggressiveButton');
        const resetButton = document.getElementById('resetButton');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const statusDiv = document.getElementById('status');
        const addressSearch = document.getElementById('addressSearch');
        const searchButton = document.getElementById('searchButton');
        const addressSuggestions = document.getElementById('addressSuggestions');
        const routeTypeRadios = document.querySelectorAll('input[name="routeType"]');

        // Advanced Ninja Elements
        const stealthModeButton = document.getElementById('stealthModeButton');
        const nightVisionButton = document.getElementById('nightVisionButton');
        const ninjaAlertsButton = document.getElementById('ninjaAlertsButton');

        // Voice Integration Elements
        const voiceCommandButton = document.getElementById('voiceCommandButton');

        // Predictive Routing Elements
        const predictiveRoutingButton = document.getElementById('predictiveRoutingButton');

        // Advanced Visual Effects Elements
        const matrixRain = document.getElementById('matrixRain');
        const particleContainer = document.getElementById('particleContainer');

        // AR Overlay Elements
        const arOverlay = document.getElementById('arOverlay');
        const arCompass = document.getElementById('arCompass');
        const arNavigationHint = document.getElementById('arNavigationHint');

        // Offline Mode Elements
        const offlineModeButton = document.getElementById('offlineModeButton');
        const offlineIndicator = document.getElementById('offlineIndicator');

        // Social Features Elements
        const socialModeButton = document.getElementById('socialModeButton');
        const socialPanel = document.getElementById('socialPanel');
        const shareRouteButton = document.getElementById('shareRouteButton');
        const findBuddiesButton = document.getElementById('findBuddiesButton');
        const buddyList = document.getElementById('buddyList');

        // Apple Integration Elements
        const appleModeButton = document.getElementById('appleModeButton');
        const appleIntegrationPanel = document.getElementById('appleIntegrationPanel');
        const openInAppleMapsButton = document.getElementById('openInAppleMapsButton');
        const shareWithSiriButton = document.getElementById('shareWithSiriButton');
        const carplayModeButton = document.getElementById('carplayModeButton');
        const carplayIndicator = document.getElementById('carplayIndicator');
        const siriSuggestion = document.getElementById('siriSuggestion');

        console.log('UI elements loaded:', {
            ninjaToggle: !!ninjaToggle,
            addressSearch: !!addressSearch,
            routeTypeRadios: routeTypeRadios.length
        });

        // Check if required elements exist
        if (!mapElement) {
            console.error('Map element not found!');
        }

        const googleMapsButton = document.getElementById('googleMapsButton');

        // State variables
        let isNinjaMode = false;
        let isAggressive = false;
        let isRouting = false;
        let isSearching = false;
        let currentSuggestions = [];
        let selectedSuggestionIndex = -1;
        let currentRouteType = 'destination'; // 'start' or 'destination'

        // Advanced Ninja Features State
        let isStealthMode = false;
        let isNightVision = false;
        let isNinjaAlerts = false;
        let ninjaAlertMarkers = [];

        // Voice Integration State
        let isVoiceCommandActive = false;
        let recognition = null;
        let isListening = false;

        // Predictive Routing State
        let isPredictiveRoutingActive = false;
        let predictiveInterval = null;
        let lastTrafficUpdate = null;
        let userBehaviorPatterns = {
            preferredTimes: {},
            routePreferences: {},
            trafficPatterns: {}
        };

        // Advanced Visual Effects State
        let matrixRainActive = false;
        let particleSystem = [];
        let visualEffectsInterval = null;

        // AR Overlay State
        let isAROverlayActive = false;
        let arPoiMarkers = [];
        let arInfoTimeout = null;

        // Offline Mode State
        let isOfflineModeActive = false;
        let isOnline = navigator.onLine;
        let cachedRoutes = [];
        let cachedTiles = new Map();
        let serviceWorkerRegistration = null;

        // Social Features State
        let isSocialModeActive = false;
        let ninjaBuddies = [];
        let sharedRoutes = [];
        let userStats = {
            totalDistance: 0,
            routesCompleted: 0,
            ninjaRank: 'Apprentice',
            achievements: []
        };

        // Apple Integration State
        let isAppleModeActive = false;
        let isCarPlayMode = false;
        let appleMapsURL = 'maps://';

        // UI Helper functions
        function showProgress() {
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            setTimeout(() => progressBar.style.width = '90%', 100);
        }

        function hideProgress() {
            progressBar.style.width = '100%';
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
            }, 300);
        }

        function setStatus(message, type = '') {
            statusDiv.textContent = message;
            statusDiv.className = 'status ' + type;
        }

        function showToast(message, type = 'info', duration = 3000) {
            // Remove existing toast
            const existingToast = document.querySelector('.toast');
            if (existingToast) {
                existingToast.remove();
            }

            // Create new toast
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            // Auto remove after duration
            setTimeout(() => {
                toast.style.animation = 'toastFadeOut 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        function setButtonLoading(button, loading) {
            if (loading) {
                button.classList.add('button-loading');
                button.disabled = true;
            } else {
                button.classList.remove('button-loading');
                button.disabled = false;
            }
        }

        // Geocoding function using Mapbox API
        async function geocodeAddress(address, limit = 1) {
            if (!address || !address.trim()) {
                throw new Error('Adresse mÃ¥ ikke vÃ¦re tom');
            }

            if (address.trim().length < 3) {
                throw new Error('Adresse skal vÃ¦re mindst 3 tegn lang');
            }

            const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address.trim())}.json?access_token=${MAPBOX_TOKEN}&limit=${limit}&country=dk&language=da`;

            try {
                // Add timeout to prevent hanging requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch(geocodingUrl, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Ugyldig API-nÃ¸gle - kontakt support');
                    } else if (response.status === 429) {
                        throw new Error('For mange sÃ¸gninger - vent et Ã¸jeblik');
                    } else if (response.status === 422) {
                        throw new Error('Ugyldig sÃ¸gning - prÃ¸v en anden adresse');
                    } else {
                        throw new Error(`Serverfejl (${response.status}) - prÃ¸v igen`);
                    }
                }

                if (!data.features || data.features.length === 0) {
                    throw new Error('Adresse ikke fundet - prÃ¸v en mere specifik adresse');
                }

                // Return all features for suggestions, or first feature for direct search
                if (limit === 1) {
                    const feature = data.features[0];
                    return {
                        latlng: L.latLng(feature.center[1], feature.center[0]),
                        name: feature.place_name_da || feature.place_name,
                        bbox: feature.bbox
                    };
                } else {
                    return data.features.map(feature => ({
                        latlng: L.latLng(feature.center[1], feature.center[0]),
                        name: feature.place_name_da || feature.place_name,
                        bbox: feature.bbox,
                        context: feature.context
                    }));
                }
            } catch (error) {
                console.error('Geocoding error:', error);

                if (error.name === 'AbortError') {
                    throw new Error('SÃ¸gning tog for lang tid - tjek internetforbindelse');
                }

                // Re-throw custom errors
                if (error.message.includes('API-nÃ¸gle') ||
                    error.message.includes('for mange') ||
                    error.message.includes('Serverfejl') ||
                    error.message.includes('Adresse ikke fundet') ||
                    error.message.includes('mindst 3 tegn') ||
                    error.message.includes('Ugyldig sÃ¸gning') ||
                    error.message.includes('for lang tid')) {
                    throw error;
                }

                // Generic network error
                throw new Error('NetvÃ¦rksfejl - tjek internetforbindelse');
            }
        }

        // Address suggestions functions
        function showSuggestions(suggestions) {
            addressSuggestions.innerHTML = '';
            currentSuggestions = suggestions;

            if (suggestions.length === 0) {
                hideSuggestions();
                return;
            }

            suggestions.forEach((suggestion, index) => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = suggestion.name;
                item.setAttribute('role', 'option');
                item.addEventListener('click', () => selectSuggestion(suggestion));
                item.addEventListener('mouseenter', () => highlightSuggestion(index));
                addressSuggestions.appendChild(item);
            });

            addressSuggestions.classList.add('show');
        }

        function hideSuggestions() {
            addressSuggestions.classList.remove('show');
            currentSuggestions = [];
            selectedSuggestionIndex = -1;
        }

        function highlightSuggestion(index) {
            const items = addressSuggestions.querySelectorAll('.suggestion-item');
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('highlighted');
                } else {
                    item.classList.remove('highlighted');
                }
            });
            selectedSuggestionIndex = index;
        }

        function selectSuggestion(suggestion) {
            addressSearch.value = suggestion.name;
            hideSuggestions();
            updateRouteToAddress(suggestion.name);
        }

        async function loadSuggestions(query) {
            if (query.length < 3) {
                hideSuggestions();
                return;
            }

            try {
                const suggestions = await geocodeAddress(query, 5);
                showSuggestions(suggestions);
            } catch (error) {
                hideSuggestions();
            }
        }

        // Update route with new destination
        async function updateRouteToAddress(address) {
            if (isSearching || isRouting) return;

            isSearching = true;
            setButtonLoading(searchButton, true);
            setStatus('SÃ¸ger efter adresse...', 'loading');

            try {
                const result = await geocodeAddress(address);

                // Store current destination for potential reset
                const previousDestination = routingControl.getWaypoints()[1];

                // Update waypoints based on route type
                const currentWaypoints = routingControl.getWaypoints();

                if (currentRouteType === 'start') {
                    // Update start point, keep current destination
                    routingControl.setWaypoints([result.latlng, currentWaypoints[1]]);
                    updateStartMarker(result.latlng, result.name);
                } else {
                    // Update destination, keep current start
                    routingControl.setWaypoints([currentWaypoints[0], result.latlng]);
                    updateDestinationMarker(result.latlng, result.name);
                }

                // Fit map to show both points
                const newWaypoints = routingControl.getWaypoints();
                const bounds = L.latLngBounds([newWaypoints[0], newWaypoints[1]]);
                map.fitBounds(bounds, { padding: [20, 20] });

                // Apply current aggressive mode settings to new route
                if (isAggressive) {
                    // Temporarily remove and re-add routing control with aggressive settings
                    const currentWaypoints = routingControl.getWaypoints();
                    map.removeControl(routingControl);

                    const newRoutingControl = L.Routing.control({
                        router: L.Routing.mapbox(MAPBOX_TOKEN, { profile: 'mapbox/driving-traffic', exclude: 'motorway' }),
                        waypoints: currentWaypoints,
                        routeWhileDragging: true,
                        createMarker: createRouteMarker,
                        lineOptions: getLineOptions()
                    }).addTo(map);

                    routingControl = newRoutingControl;
                    attachRoutingEventHandlers(routingControl);
                }

                setStatus(`Rute opdateret: Sabro â†’ ${result.name.split(',')[0]}`, 'success');
                showToast(`Adresse fundet: ${result.name.split(',')[0]}`, 'success');
                addressSearch.value = '';

            } catch (error) {
                let errorMessage = error.message;
                let shouldRetry = false;

                // Provide user-friendly error messages and retry logic
                if (error.message.includes('Adresse ikke fundet')) {
                    errorMessage = 'Adresse ikke fundet - prÃ¸v en mere specifik adresse eller tjek stavning';
                } else if (error.message.includes('for mange sÃ¸gninger')) {
                    errorMessage = 'For mange sÃ¸gninger - vent 1 minut fÃ¸r nÃ¦ste forsÃ¸g';
                    shouldRetry = true;
                } else if (error.message.includes('NetvÃ¦rksfejl') || error.message.includes('for lang tid')) {
                    errorMessage = 'NetvÃ¦rksfejl - tjek internetforbindelse og prÃ¸v igen';
                    shouldRetry = true;
                } else if (error.message.includes('API-nÃ¸gle')) {
                    errorMessage = 'Systemfejl - kontakt support hvis problemet fortsÃ¦tter';
                }

                setStatus(errorMessage, 'error');
                showToast(errorMessage, 'error');

                // Auto-retry for network errors after 3 seconds
                if (shouldRetry) {
                    setTimeout(() => {
                        if (!isSearching && addressSearch.value.trim()) {
                            updateRouteToAddress(addressSearch.value.trim());
                        }
                    }, 3000);
                }
            } finally {
                setButtonLoading(searchButton, false);
                isSearching = false;
            }
        }

        // Helper function to update destination marker
        function updateDestinationMarker(latlng, name) {
            // Remove existing destination markers (not start marker)
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker && !layer.getLatLng().equals(sabro)) {
                    map.removeLayer(layer);
                }
            });

            // Add new destination marker
            L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup(`<b>Destination</b><br/>${name}`);
        }

        // Helper function to update start marker
        function updateStartMarker(latlng, name) {
            // Remove existing start markers (not destination markers)
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker && !layer.getLatLng().equals(aarhusC)) {
                    map.removeLayer(layer);
                }
            });

            // Add new start marker
            L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup(`<b>Startpunkt</b><br/>${name}`);
        }

        // Helper function to create route markers
        function createRouteMarker(i, waypoint, n) {
            const markerOptions = { draggable: true };

            if (i === 0) {
                // Start marker (Sabro)
                markerOptions.icon = L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
            } else if (i === n-1) {
                // End marker (Destination)
                markerOptions.icon = L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
            }

            return L.marker(waypoint.latLng, markerOptions);
        }

        // Helper function to get line options
        function getLineOptions() {
            return {
                styles: [{
                    color: '#00FFFF',
                    weight: 6,
                    opacity: 0.8
                }, {
                    color: '#0080FF',
                    weight: 10,
                    opacity: 0.4
                }]
            };
        }

        // Helper function to attach routing event handlers
        function attachRoutingEventHandlers(control) {
            control.on('routesfound', function(e) {
                const routes = e.routes;
                const summary = routes[0].summary;
                const distance = Math.round(summary.totalDistance / 1000);
                const time = Math.round(summary.totalTime / 60);

                setStatus(`Rute: ${distance}km, ${time}min`, 'success');
                setButtonLoading(aggressiveButton, false);
                hideProgress();
                isRouting = false;

                // Update user stats for completed route
                updateUserStats(routes[0]);

                // Trigger predictive routing suggestions after route completion
                if (isPredictiveRoutingActive) {
                    setTimeout(() => suggestRouteOptimization(), 2000);
                }
            });

            control.on('routingstart', function(e) {
                isRouting = true;
                setStatus('Beregner rute...', 'loading');
                showProgress();
            });

            control.on('routingerror', function(e) {
                console.warn('Routing error:', e.error);
                let errorMessage = 'Fejl: Kunne ikke beregne rute';

                if (e.error && e.error.status) {
                    switch(e.error.status) {
                        case 401:
                            errorMessage = 'API-nÃ¸gle ugyldig - kontakt support';
                            break;
                        case 429:
                            errorMessage = 'For mange forespÃ¸rgsler - prÃ¸v igen om lidt';
                            break;
                        case -1:
                            errorMessage = 'NetvÃ¦rksfejl - tjek internetforbindelse';
                            // Try offline fallback
                            if (isOfflineModeActive && loadOfflineRoute()) {
                                return; // Successfully loaded offline route
                            }
                            break;
                        default:
                            errorMessage = `Serverfejl (${e.error.status}) - prÃ¸v igen`;
                    }
                }

                setStatus(errorMessage, 'error');
                setButtonLoading(aggressiveButton, false);
                hideProgress();
                isRouting = false;
            });
        }

        // Advanced Ninja Features Functions
        function toggleStealthMode() {
            isStealthMode = !isStealthMode;
            mapElement.classList.toggle('stealth-mode');

            if (isStealthMode) {
                stealthModeButton.textContent = 'STEALTH MODE: ON';
                stealthModeButton.classList.add('active');
                setStatus('Stealth Mode aktiveret - BevÃ¦g musen for at se kortet', 'success');
                showToast('Stealth Mode: Navigation i skyggerne!', 'success');
            } else {
                stealthModeButton.textContent = 'STEALTH MODE: OFF';
                stealthModeButton.classList.remove('active');
                setStatus('Stealth Mode deaktiveret', 'success');
                showToast('Stealth Mode deaktiveret', 'success');
            }
        }

        function toggleNightVision() {
            isNightVision = !isNightVision;
            mapElement.classList.toggle('night-vision');

            if (isNightVision) {
                nightVisionButton.textContent = 'NIGHT VISION: ON';
                nightVisionButton.classList.add('active');
                setStatus('Night Vision aktiveret - Perfekt til nattlige missioner', 'success');
                showToast('Night Vision aktiveret!', 'success');
            } else {
                nightVisionButton.textContent = 'NIGHT VISION: OFF';
                nightVisionButton.classList.remove('active');
                setStatus('Night Vision deaktiveret', 'success');
                showToast('Night Vision deaktiveret', 'success');
            }
        }

        function toggleNinjaAlerts() {
            isNinjaAlerts = !isNinjaAlerts;

            if (isNinjaAlerts) {
                ninjaAlertsButton.textContent = 'NINJA ALERTS: ON';
                ninjaAlertsButton.classList.add('active');
                setStatus('Ninja Alerts aktiveret - OvervÃ¥ger trafikfÃ¦lder', 'success');
                showToast('Ninja Alerts aktiveret!', 'success');
                startNinjaAlertMonitoring();
            } else {
                ninjaAlertsButton.textContent = 'NINJA ALERTS: OFF';
                ninjaAlertsButton.classList.remove('active');
                setStatus('Ninja Alerts deaktiveret', 'success');
                showToast('Ninja Alerts deaktiveret', 'success');
                stopNinjaAlertMonitoring();
            }
        }

        function startNinjaAlertMonitoring() {
            // Clear existing alerts
            stopNinjaAlertMonitoring();

            // Add sample ninja alert points (in a real app, these would come from a database/API)
            const alertPoints = [
                { lat: 56.18, lng: 10.12, type: 'speed_camera', message: 'Fartkamera fremad!' },
                { lat: 56.22, lng: 10.18, type: 'police', message: 'Politi i omrÃ¥det' },
                { lat: 56.15, lng: 10.22, type: 'traffic_jam', message: 'Trafikprop 2km fremme' },
                { lat: 56.19, lng: 10.08, type: 'construction', message: 'Vejarbejde - alternativ rute anbefales' }
            ];

            alertPoints.forEach(point => {
                const marker = L.marker([point.lat, point.lng], {
                    icon: L.divIcon({
                        className: 'ninja-alert-marker',
                        html: '<div></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                });

                marker.bindPopup(`<b style="color: #FF6600;">âš ï¸ NINJA ALERT</b><br/>${point.message}`);
                marker.addTo(map);
                ninjaAlertMarkers.push(marker);

                // Add click handler to show alert
                marker.on('click', function() {
                    showToast(point.message, 'error', 5000);
                });
            });
        }

        function stopNinjaAlertMonitoring() {
            ninjaAlertMarkers.forEach(marker => {
                map.removeLayer(marker);
            });
            ninjaAlertMarkers = [];
        }

        // Voice Integration Functions
        function toggleVoiceCommand() {
            isVoiceCommandActive = !isVoiceCommandActive;

            if (isVoiceCommandActive) {
                voiceCommandButton.textContent = 'VOICE COMMAND: ON';
                voiceCommandButton.classList.add('active');
                setStatus('Voice commands aktiveret - Sig "Urban Ninja" efterfulgt af kommando', 'success');
                showToast('Voice commands aktiveret! Sig "Urban Ninja help" for kommandoer', 'success');
                initializeVoiceRecognition();
            } else {
                voiceCommandButton.textContent = 'VOICE COMMAND: OFF';
                voiceCommandButton.classList.remove('active');
                setStatus('Voice commands deaktiveret', 'success');
                showToast('Voice commands deaktiveret', 'success');
                stopVoiceRecognition();
            }
        }

        function initializeVoiceRecognition() {
            // Check if browser supports speech recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setStatus('Din browser understÃ¸tter ikke voice commands', 'error');
                showToast('Voice recognition ikke understÃ¸ttet i denne browser', 'error');
                toggleVoiceCommand(); // Turn off since not supported
                return;
            }

            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'da-DK'; // Danish language

            recognition.onstart = function() {
                isListening = true;
                setStatus('Lytter efter stemmekommandoer...', 'loading');
            };

            recognition.onresult = function(event) {
                const last = event.results.length - 1;
                const command = event.results[last][0].transcript.toLowerCase().trim();

                console.log('Voice command detected:', command);
                processVoiceCommand(command);
            };

            recognition.onerror = function(event) {
                console.error('Voice recognition error:', event.error);
                setStatus('Fejl i voice recognition - prÃ¸ver igen', 'error');
                // Restart recognition after error
                setTimeout(() => {
                    if (isVoiceCommandActive) {
                        startVoiceRecognition();
                    }
                }, 1000);
            };

            recognition.onend = function() {
                isListening = false;
                if (isVoiceCommandActive) {
                    // Restart listening if still active
                    setTimeout(() => {
                        if (isVoiceCommandActive) {
                            startVoiceRecognition();
                        }
                    }, 500);
                }
            };

            startVoiceRecognition();
        }

        function startVoiceRecognition() {
            if (recognition && !isListening) {
                try {
                    recognition.start();
                } catch (error) {
                    console.error('Error starting voice recognition:', error);
                }
            }
        }

        function stopVoiceRecognition() {
            if (recognition && isListening) {
                recognition.stop();
            }
        }

        function processVoiceCommand(command) {
            console.log('Processing voice command:', command);

            // Check if command starts with wake word
            if (!command.includes('urban ninja') && !command.includes('urban') && !command.includes('ninja')) {
                return; // Ignore commands that don't start with wake word
            }

            // Remove wake word and process command
            let cleanCommand = command
                .replace(/urban ninja/g, '')
                .replace(/urban/g, '')
                .replace(/ninja/g, '')
                .trim();

            console.log('Clean command:', cleanCommand);

            // Process different commands
            if (cleanCommand.includes('hjÃ¦lp') || cleanCommand.includes('help')) {
                showVoiceHelp();
            } else if (cleanCommand.includes('stealth') || cleanCommand.includes('skjul')) {
                toggleStealthMode();
                speakResponse('Stealth mode aktiveret');
            } else if (cleanCommand.includes('night vision') || cleanCommand.includes('nat')) {
                toggleNightVision();
                speakResponse('Night vision aktiveret');
            } else if (cleanCommand.includes('alert') || cleanCommand.includes('advarsel')) {
                toggleNinjaAlerts();
                speakResponse('Ninja alerts aktiveret');
            } else if (cleanCommand.includes('find mig') || cleanCommand.includes('position')) {
                if (!isLocating) {
                    findUserLocation();
                    speakResponse('Finder din position');
                }
            } else if (cleanCommand.includes('aggressive') || cleanCommand.includes('hurtig')) {
                if (!isRouting) {
                    aggressiveButton.click();
                    speakResponse('Aggressive route aktiveret');
                }
            } else if (cleanCommand.includes('reset') || cleanCommand.includes('nulstil')) {
                if (!isRouting) {
                    resetButton.click();
                    speakResponse('Rute nulstillet');
                }
            } else if (cleanCommand.includes('google') || cleanCommand.includes('maps')) {
                openInGoogleMaps();
                speakResponse('Ã…bner i Google Maps');
            } else if (cleanCommand.includes('predictive') || cleanCommand.includes('smart')) {
                togglePredictiveRouting();
                speakResponse('Predictive routing aktiveret');
            } else if (cleanCommand.includes('cyberpunk') || cleanCommand.includes('matrix') || cleanCommand.includes('visual')) {
                triggerCyberpunkSequence();
                speakResponse('Cyberpunk visual effects aktiveret');
            } else if (cleanCommand.includes('ar') || cleanCommand.includes('augmented') || cleanCommand.includes('reality')) {
                toggleAROverlay();
                speakResponse('AR overlay aktiveret');
            } else if (cleanCommand.includes('offline') || cleanCommand.includes('cache')) {
                toggleOfflineMode();
                speakResponse('Offline mode aktiveret');
            } else if (cleanCommand.includes('social') || cleanCommand.includes('buddy') || cleanCommand.includes('del')) {
                if (cleanCommand.includes('del')) {
                    shareCurrentRoute();
                    speakResponse('Rute delt');
                } else {
                    toggleSocialMode();
                    speakResponse('Social ninja mode aktiveret');
                }
            } else if (cleanCommand.includes('apple') || cleanCommand.includes('carplay') || cleanCommand.includes('siri')) {
                if (cleanCommand.includes('carplay')) {
                    toggleCarPlayMode();
                    speakResponse('CarPlay mode aktiveret');
                } else if (cleanCommand.includes('siri')) {
                    shareWithSiri();
                    speakResponse('Siri integration aktiveret');
                } else {
                    toggleAppleMode();
                    speakResponse('Apple integration aktiveret');
                }
            } else {
                speakResponse('Ukendt kommando. Sig "Urban Ninja hjÃ¦lp" for kommandoer');
            }
        }

        function showVoiceHelp() {
            const voiceHelp = `
VOICE COMMANDS - Sig "Urban Ninja" efterfulgt af:

â€¢ HJÃ†LP - Vis denne hjÃ¦lp
â€¢ STEALTH - Toggle stealth mode
â€¢ NIGHT VISION - Toggle night vision
â€¢ ALERT - Toggle ninja alerts
â€¢ FIND MIG - Find min position
â€¢ AGGRESSIVE - Toggle aggressive route
â€¢ RESET - Nulstil rute
â€¢ GOOGLE MAPS - Ã…bn i Google Maps
â€¢ PREDICTIVE - Toggle predictive routing
â€¢ AR - Toggle augmented reality overlay
â€¢ OFFLINE - Toggle offline mode
â€¢ SOCIAL - Toggle social ninja mode
â€¢ DEL - Del nuvÃ¦rende rute
â€¢ APPLE - Toggle Apple integration
â€¢ CARPLAY - Toggle CarPlay mode
â€¢ SIRI - Aktiver Siri integration
â€¢ CYBERPUNK - Trigger visual effects sequence

Eksempel: "Urban Ninja stealth"
            `;
            alert(voiceHelp);
            speakResponse('Her er voice command hjÃ¦lpen');
        }

        function speakResponse(text) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'da-DK'; // Danish
                utterance.rate = 0.8;
                utterance.pitch = 1;

                // Use Danish voice if available
                const voices = speechSynthesis.getVoices();
                const danishVoice = voices.find(voice => voice.lang === 'da-DK');
                if (danishVoice) {
                    utterance.voice = danishVoice;
                }

                speechSynthesis.speak(utterance);
            }
        }

        // Predictive Routing Functions
        function togglePredictiveRouting() {
            isPredictiveRoutingActive = !isPredictiveRoutingActive;

            if (isPredictiveRoutingActive) {
                predictiveRoutingButton.textContent = 'PREDICTIVE ROUTING: ON';
                predictiveRoutingButton.classList.add('active');
                setStatus('Smart predictive routing aktiveret - Optimerer ruter baseret pÃ¥ trafik og tid', 'success');
                showToast('AI-drevet ruteoptimering aktiveret!', 'success');
                startPredictiveRouting();
            } else {
                predictiveRoutingButton.textContent = 'PREDICTIVE ROUTING: OFF';
                predictiveRoutingButton.classList.remove('active');
                setStatus('Predictive routing deaktiveret', 'success');
                showToast('Predictive routing deaktiveret', 'success');
                stopPredictiveRouting();
            }
        }

        function startPredictiveRouting() {
            // Start monitoring traffic and optimizing routes
            updateTrafficPatterns();
            predictiveInterval = setInterval(() => {
                optimizeRouteBasedOnTimeAndTraffic();
            }, 30000); // Check every 30 seconds

            // Initial optimization
            optimizeRouteBasedOnTimeAndTraffic();
        }

        function stopPredictiveRouting() {
            if (predictiveInterval) {
                clearInterval(predictiveInterval);
                predictiveInterval = null;
            }
        }

        function updateTrafficPatterns() {
            const now = new Date();
            const hour = now.getHours();
            const dayOfWeek = now.getDay();

            // Simulate traffic pattern learning (in real app, this would use real traffic data)
            const trafficMultiplier = getTrafficMultiplier(hour, dayOfWeek);

            userBehaviorPatterns.trafficPatterns[hour] = trafficMultiplier;
            lastTrafficUpdate = now;
        }

        function getTrafficMultiplier(hour, dayOfWeek) {
            // Simulate realistic Danish traffic patterns
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                // Weekend
                if (hour >= 10 && hour <= 16) return 1.2; // Moderate weekend traffic
                return 0.8; // Lighter weekend traffic
            } else {
                // Weekday
                if ((hour >= 7 && hour <= 9) || (hour >= 15 && hour <= 17)) {
                    return 1.8; // Rush hour
                }
                if (hour >= 11 && hour <= 14) {
                    return 1.1; // Lunch time
                }
                return 0.9; // Off-peak
            }
        }

        function optimizeRouteBasedOnTimeAndTraffic() {
            if (isRouting) return; // Don't interrupt active routing

            const now = new Date();
            const hour = now.getHours();
            const trafficMultiplier = getTrafficMultiplier(hour, now.getDay());

            // Only optimize if traffic is significantly different
            const shouldOptimize = Math.abs(trafficMultiplier - 1) > 0.3;

            if (shouldOptimize && !isAggressive) {
                setStatus(`Optimerer rute - Trafik niveau: ${trafficMultiplier.toFixed(1)}x normal`, 'loading');

                // Temporarily enable aggressive routing during high traffic
                if (trafficMultiplier > 1.5) {
                    showToast(`HÃ¸j trafik detekteret - Skifter til aggressive rute for at spare tid`, 'error');
                    aggressiveButton.click();
                }
            } else if (isAggressive && trafficMultiplier < 1.2) {
                // Switch back to normal routing when traffic improves
                showToast(`Trafik normaliseret - Skifter tilbage til normal rute`, 'success');
                aggressiveButton.click();
            }

            // Update user behavior patterns
            userBehaviorPatterns.preferredTimes[hour] = (userBehaviorPatterns.preferredTimes[hour] || 0) + 1;
            userBehaviorPatterns.routePreferences[isAggressive ? 'aggressive' : 'normal'] =
                (userBehaviorPatterns.routePreferences[isAggressive ? 'aggressive' : 'normal'] || 0) + 1;
        }

        function getOptimalRouteType() {
            const now = new Date();
            const hour = now.getHours();
            const trafficMultiplier = getTrafficMultiplier(hour, now.getDay());

            // Use learned preferences and current conditions
            const aggressiveUsage = userBehaviorPatterns.routePreferences.aggressive || 0;
            const normalUsage = userBehaviorPatterns.routePreferences.normal || 0;
            const totalUsage = aggressiveUsage + normalUsage;

            // If high traffic and user prefers aggressive routes, suggest aggressive
            if (trafficMultiplier > 1.4 && aggressiveUsage > normalUsage) {
                return 'aggressive';
            }

            // If low traffic and user prefers normal routes, suggest normal
            if (trafficMultiplier < 1.1 && normalUsage > aggressiveUsage) {
                return 'normal';
            }

            // Default to normal routing
            return 'normal';
        }

        function suggestRouteOptimization() {
            if (!isPredictiveRoutingActive) return;

            const optimalType = getOptimalRouteType();
            const currentType = isAggressive ? 'aggressive' : 'normal';

            if (optimalType !== currentType) {
                const message = optimalType === 'aggressive'
                    ? 'AI foreslÃ¥r aggressive rute for bedre trafikflow'
                    : 'AI foreslÃ¥r normal rute - trafik er rolig';

                showToast(message, 'success', 8000);

                // Auto-optimize after 5 seconds if no user action
                setTimeout(() => {
                    if (isPredictiveRoutingActive && getOptimalRouteType() !== (isAggressive ? 'aggressive' : 'normal')) {
                        if (!isRouting) {
                            aggressiveButton.click();
                            speakResponse('Rute optimeret baseret pÃ¥ AI analyse');
                        }
                    }
                }, 5000);
            }
        }

        // Advanced Visual Effects Functions
        function initializeAdvancedVisualEffects() {
            // Start with subtle effects
            startMatrixRain();
            initializeParticleSystem();

            // Add enhanced button effects
            document.querySelectorAll('.ninja-toggle').forEach(button => {
                button.classList.add('liquid-button');
            });

            // Add neon glow to title
            document.querySelector('h2').classList.add('neon-glow');
        }

        function startMatrixRain() {
            if (matrixRainActive) return;

            matrixRainActive = true;
            matrixRain.classList.add('active');

            // Create matrix columns
            for (let i = 0; i < 20; i++) {
                const column = document.createElement('div');
                column.className = 'matrix-column';
                column.style.left = `${(i / 20) * 100}%`;
                column.style.animationDuration = `${Math.random() * 3 + 2}s`;
                column.style.animationDelay = `${Math.random() * 2}s`;

                // Generate random matrix characters
                const chars = '01ã‚¢ã‚¤ã‚¦ã‚¨ã‚ªã‚«ã‚­ã‚¯ã‚±ã‚³ã‚µã‚·ã‚¹ã‚»ã‚½ã‚¿ãƒãƒ„ãƒ†ãƒˆãƒŠãƒ‹ãƒŒãƒãƒŽãƒãƒ’ãƒ•ãƒ˜ãƒ›ãƒžãƒŸãƒ ãƒ¡ãƒ¢ãƒ¤ãƒ¦ãƒ¨ãƒ©ãƒªãƒ«ãƒ¬ãƒ­ãƒ¯ãƒ²ãƒ³';
                let text = '';
                for (let j = 0; j < Math.floor(Math.random() * 20) + 10; j++) {
                    text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
                }
                column.innerHTML = text;

                matrixRain.appendChild(column);
            }
        }

        function stopMatrixRain() {
            matrixRainActive = false;
            matrixRain.classList.remove('active');
            matrixRain.innerHTML = '';
        }

        function initializeParticleSystem() {
            // Create particle pool for explosions
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.display = 'none';
                particleContainer.appendChild(particle);
                particleSystem.push(particle);
            }
        }

        function createParticleExplosion(x, y) {
            const particles = particleSystem.slice(0, 20); // Use 20 particles for explosion

            particles.forEach((particle, index) => {
                // Reset particle
                particle.style.display = 'block';
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;

                // Random explosion direction and distance
                const angle = (index / particles.length) * Math.PI * 2;
                const distance = Math.random() * 200 + 50;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;

                particle.style.setProperty('--tx', `${tx}px`);
                particle.style.setProperty('--ty', `${ty}px`);
                particle.style.animationDelay = `${Math.random() * 0.5}s`;

                // Hide particle after animation
                setTimeout(() => {
                    particle.style.display = 'none';
                }, 2000);
            });
        }

        function addGlitchEffect(element, duration = 1000) {
            element.classList.add('glitch');
            element.setAttribute('data-text', element.textContent);

            setTimeout(() => {
                element.classList.remove('glitch');
                element.removeAttribute('data-text');
            }, duration);
        }

        function triggerCyberpunkSequence() {
            // Matrix rain activation
            startMatrixRain();

            // Particle explosions at random positions
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const x = Math.random() * window.innerWidth;
                    const y = Math.random() * window.innerHeight;
                    createParticleExplosion(x, y);
                }, i * 200);
            }

            // Glitch title
            addGlitchEffect(document.querySelector('h2'), 2000);

            // Add cyberpunk loading effect to buttons
            document.querySelectorAll('.ninja-toggle').forEach(button => {
                button.classList.add('cyberpunk-loader');
                setTimeout(() => {
                    button.classList.remove('cyberpunk-loader');
                }, 3000);
            });

            setTimeout(() => {
                stopMatrixRain();
            }, 5000);
        }

        // AR Overlay Functions
        function toggleAROverlay() {
            isAROverlayActive = !isAROverlayActive;

            if (isAROverlayActive) {
                arOverlayButton.textContent = 'AR OVERLAY: ON';
                arOverlayButton.classList.add('active');
                arOverlay.classList.add('active');
                setStatus('AR Overlay aktiveret - Augmented Reality navigation tilgÃ¦ngelig', 'success');
                showToast('AR Overlay aktiveret! Se efter POI markÃ¸rer og navigation hints', 'success');
                initializeARFeatures();
            } else {
                arOverlayButton.textContent = 'AR OVERLAY: OFF';
                arOverlayButton.classList.remove('active');
                arOverlay.classList.remove('active');
                setStatus('AR Overlay deaktiveret', 'success');
                showToast('AR Overlay deaktiveret', 'success');
                clearARFeatures();
            }
        }

        function initializeARFeatures() {
            // Add POI markers for points of interest
            addARPOIMarkers();

            // Show navigation hint
            arNavigationHint.style.display = 'block';

            // Update compass (simulate GPS heading)
            updateARCompass();

            // Update AR elements every 2 seconds
            arInfoTimeout = setInterval(() => {
                updateARCompass();
                updateARNavigationHints();
            }, 2000);
        }

        // Offline Mode Functions
        function toggleOfflineMode() {
            isOfflineModeActive = !isOfflineModeActive;

            if (isOfflineModeActive) {
                offlineModeButton.textContent = 'OFFLINE MODE: ON';
                offlineModeButton.classList.add('active');
                setStatus('Offline mode aktiveret - Cacher kort og ruter for stealth operation', 'success');
                showToast('Offline mode aktiveret! Klar til ninja stealth navigation', 'success');
                initializeOfflineMode();
            } else {
                offlineModeButton.textContent = 'OFFLINE MODE: OFF';
                offlineModeButton.classList.remove('active');
                setStatus('Offline mode deaktiveret', 'success');
                showToast('Offline mode deaktiveret', 'success');
                disableOfflineMode();
            }
        }

        function initializeOfflineMode() {
            // Register service worker for caching
            registerServiceWorker();

            // Cache current route
            cacheCurrentRoute();

            // Pre-cache map tiles for current view
            cacheMapTiles();

            // Monitor online/offline status
            updateOfflineStatus();
            window.addEventListener('online', updateOfflineStatus);
            window.addEventListener('offline', updateOfflineStatus);

            // Set up periodic cache refresh when online
            if (isOnline) {
                setInterval(() => {
                    if (isOnline && isOfflineModeActive) {
                        refreshOfflineCache();
                    }
                }, 300000); // Refresh every 5 minutes when online
            }
        }

        function disableOfflineMode() {
            // Unregister service worker
            if (serviceWorkerRegistration) {
                serviceWorkerRegistration.unregister();
                serviceWorkerRegistration = null;
            }

            // Clear cached data
            clearOfflineCache();

            // Remove event listeners
            window.removeEventListener('online', updateOfflineStatus);
            window.removeEventListener('offline', updateOfflineStatus);
        }

        function registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        serviceWorkerRegistration = registration;
                        console.log('Service Worker registered for offline caching');
                    })
                    .catch(error => {
                        console.error('Service Worker registration failed:', error);
                        setStatus('Service Worker fejlede - offline caching begrÃ¦nset', 'error');
                    });
            } else {
                setStatus('Service Worker ikke understÃ¸ttet - offline funktioner begrÃ¦nset', 'error');
            }
        }

        function updateOfflineStatus() {
            isOnline = navigator.onLine;

            if (isOnline) {
                offlineIndicator.textContent = 'ONLINE';
                offlineIndicator.className = 'offline-indicator online';
                setTimeout(() => {
                    offlineIndicator.style.display = 'none';
                }, 3000);
            } else {
                offlineIndicator.textContent = 'OFFLINE - NINJA STEALTH MODE';
                offlineIndicator.className = 'offline-indicator offline';
                offlineIndicator.style.display = 'block';

                if (isOfflineModeActive) {
                    speakResponse('Offline mode aktiveret - fortsÃ¦tter navigation');
                }
            }
        }

        function cacheCurrentRoute() {
            const currentWaypoints = routingControl.getWaypoints();
            if (currentWaypoints.length >= 2) {
                const routeData = {
                    waypoints: currentWaypoints,
                    timestamp: Date.now(),
                    profile: isAggressive ? 'aggressive' : 'normal'
                };

                // Store in localStorage (in real app, use IndexedDB)
                cachedRoutes.push(routeData);
                localStorage.setItem('urbanNinja_cachedRoutes', JSON.stringify(cachedRoutes));

                console.log('Route cached for offline use:', routeData);
            }
        }

        function cacheMapTiles() {
            // Get current map bounds
            const bounds = map.getBounds();
            const zoom = Math.round(map.getZoom());

            // Pre-cache tiles for current view (simplified - in real app use proper tile caching)
            const tilesToCache = [];

            // Generate tile URLs for current view
            for (let x = Math.floor(bounds.getWest()); x <= Math.floor(bounds.getEast()); x++) {
                for (let y = Math.floor(bounds.getSouth()); y <= Math.floor(bounds.getNorth()); y++) {
                    const tileUrl = `https://{s}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
                    tilesToCache.push(tileUrl);
                }
            }

            // Cache tiles using Cache API
            if ('caches' in window) {
                caches.open('urban-ninja-tiles-v1').then(cache => {
                    tilesToCache.forEach(url => {
                        cache.add(url).catch(() => {
                            // Ignore cache failures
                        });
                    });
                });
            }

            console.log(`Caching ${tilesToCache.length} map tiles for offline use`);
        }

        function refreshOfflineCache() {
            if (!isOnline) return;

            // Refresh route cache
            cacheCurrentRoute();

            // Refresh tile cache for current area
            cacheMapTiles();

            console.log('Offline cache refreshed');
        }

        function clearOfflineCache() {
            // Clear cached routes
            cachedRoutes = [];
            localStorage.removeItem('urbanNinja_cachedRoutes');

            // Clear cached tiles
            if ('caches' in window) {
                caches.delete('urban-ninja-tiles-v1');
            }

            console.log('Offline cache cleared');
        }

        function loadOfflineRoute() {
            // Load cached route if current route fails and we're offline
            const cached = localStorage.getItem('urbanNinja_cachedRoutes');
            if (cached && !isOnline) {
                try {
                    const routes = JSON.parse(cached);
                    if (routes.length > 0) {
                        const latestRoute = routes[routes.length - 1];
                        routingControl.setWaypoints(latestRoute.waypoints);
                        setStatus('Offline rute indlÃ¦st - fortsÃ¦tter navigation', 'success');
                        showToast('Offline rute aktiveret', 'success');
                        return true;
                    }
                } catch (error) {
                    console.error('Error loading offline route:', error);
                }
            }
            return false;
        }

        // Social Features Functions
        function toggleSocialMode() {
            isSocialModeActive = !isSocialModeActive;

            if (isSocialModeActive) {
                socialModeButton.textContent = 'SOCIAL NINJA: ON';
                socialModeButton.classList.add('active');
                socialPanel.classList.add('active');
                setStatus('Social Ninja aktiveret - find buddies og del routes!', 'success');
                showToast('Social mode aktiveret! Find dine ninja venner', 'success');
                initializeSocialFeatures();
            } else {
                socialModeButton.textContent = 'SOCIAL NINJA: OFF';
                socialModeButton.classList.remove('active');
                socialPanel.classList.remove('active');
                setStatus('Social Ninja deaktiveret', 'success');
                showToast('Social mode deaktiveret', 'success');
                clearSocialFeatures();
            }
        }

        function initializeSocialFeatures() {
            // Load user stats
            loadUserStats();

            // Find nearby ninja buddies
            findNearbyBuddies();

            // Set up periodic buddy updates
            setInterval(() => {
                if (isSocialModeActive) {
                    updateBuddyLocations();
                }
            }, 10000); // Update every 10 seconds
        }

        function clearSocialFeatures() {
            // Remove all buddy markers
            ninjaBuddies.forEach(buddy => {
                if (buddy.marker) {
                    map.removeLayer(buddy.marker);
                }
            });
            ninjaBuddies = [];

            // Clear buddy list
            buddyList.innerHTML = '<div class="leaderboard-entry">Social mode deaktiveret</div>';
        }

        function loadUserStats() {
            // Load stats from localStorage (in real app, this would be from a server)
            const savedStats = localStorage.getItem('urbanNinja_userStats');
            if (savedStats) {
                userStats = JSON.parse(savedStats);
            }

            // Update leaderboard with current user
            updateLeaderboard();
        }

        function saveUserStats() {
            localStorage.setItem('urbanNinja_userStats', JSON.stringify(userStats));
        }

        function findNearbyBuddies() {
            // Simulate finding nearby ninja buddies (in real app, use geolocation and server)
            const mockBuddies = [
                { id: 'ninja1', name: 'ShadowMaster', lat: 56.16, lng: 10.22, status: 'Navigerer til mission', distance: '2.3km' },
                { id: 'ninja2', name: 'NightRunner', lat: 56.14, lng: 10.18, status: 'Stealth mode aktiv', distance: '1.8km' },
                { id: 'ninja3', name: 'CyberPhantom', lat: 56.18, lng: 10.25, status: 'AR navigation', distance: '3.1km' }
            ];

            ninjaBuddies = mockBuddies;
            displayBuddyList();
            addBuddyMarkers();
        }

        function displayBuddyList() {
            buddyList.innerHTML = '';

            if (ninjaBuddies.length === 0) {
                buddyList.innerHTML = '<div class="leaderboard-entry">Ingen ninja buddies fundet i nÃ¦rheden</div>';
                return;
            }

            ninjaBuddies.forEach(buddy => {
                const buddyEntry = document.createElement('div');
                buddyEntry.className = 'leaderboard-entry';
                buddyEntry.innerHTML = `
                    <strong>${buddy.name}</strong><br/>
                    <small>${buddy.status} â€¢ ${buddy.distance} vÃ¦k</small>
                `;
                buddyEntry.addEventListener('click', () => focusOnBuddy(buddy));
                buddyList.appendChild(buddyEntry);
            });
        }

        function addBuddyMarkers() {
            ninjaBuddies.forEach(buddy => {
                const marker = L.marker([buddy.lat, buddy.lng], {
                    icon: L.divIcon({
                        className: 'buddy-marker',
                        html: 'ðŸ‘¤',
                        iconSize: [25, 25],
                        iconAnchor: [12, 12]
                    })
                });

                marker.bindPopup(`
                    <b style="color: #FF1493;">${buddy.name}</b><br/>
                    <small>${buddy.status}</small><br/>
                    <small>Afstand: ${buddy.distance}</small>
                `);

                marker.addTo(map);
                buddy.marker = marker;
            });
        }

        function focusOnBuddy(buddy) {
            map.setView([buddy.lat, buddy.lng], 15);
            if (buddy.marker) {
                buddy.marker.openPopup();
            }
            createParticleExplosion(buddy.lat * 1000, buddy.lng * 1000); // Rough conversion for effect
        }

        function updateBuddyLocations() {
            // Simulate buddy movement (in real app, this would come from server updates)
            ninjaBuddies.forEach(buddy => {
                // Small random movement
                buddy.lat += (Math.random() - 0.5) * 0.001;
                buddy.lng += (Math.random() - 0.5) * 0.001;

                if (buddy.marker) {
                    buddy.marker.setLatLng([buddy.lat, buddy.lng]);
                }
            });
        }

        function shareCurrentRoute() {
            const currentWaypoints = routingControl.getWaypoints();
            if (currentWaypoints.length < 2) {
                showToast('Ingen aktiv rute at dele', 'error');
                return;
            }

            const routeData = {
                waypoints: currentWaypoints,
                sharer: 'Du',
                timestamp: Date.now(),
                distance: Math.round(map.distance(currentWaypoints[0], currentWaypoints[1]) / 1000),
                profile: isAggressive ? 'aggressive' : 'normal'
            };

            sharedRoutes.push(routeData);
            localStorage.setItem('urbanNinja_sharedRoutes', JSON.stringify(sharedRoutes));

            // Share via Web Share API if available
            if (navigator.share) {
                navigator.share({
                    title: 'Urban Ninja Route',
                    text: `Jeg har delt en ${routeData.distance}km ninja rute med dig!`,
                    url: window.location.href
                }).catch(() => {
                    // Fallback to clipboard
                    copyRouteToClipboard(routeData);
                });
            } else {
                copyRouteToClipboard(routeData);
            }

            showToast('Rute delt med ninja community!', 'success');
            speakResponse('Rute delt med andre ninjas');
        }

        function copyRouteToClipboard(routeData) {
            const routeText = `Urban Ninja Route: ${routeData.distance}km fra ${routeData.waypoints[0].lat.toFixed(4)},${routeData.waypoints[0].lng.toFixed(4)} til ${routeData.waypoints[1].lat.toFixed(4)},${routeData.waypoints[1].lng.toFixed(4)}`;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(routeText).then(() => {
                    showToast('Rute kopieret til udklipsholder', 'success');
                });
            }
        }

        function updateLeaderboard() {
            // Update user's own stats
            const leaderboardContent = document.getElementById('leaderboardContent');

            // Add current user to leaderboard
            const userEntry = document.createElement('div');
            userEntry.className = 'leaderboard-entry';
            userEntry.innerHTML = `ðŸŽ¯ ${userStats.ninjaRank} - ${userStats.totalDistance}km`;
            leaderboardContent.appendChild(userEntry);
        }

        function updateUserStats(route) {
            if (route && route.summary) {
                userStats.totalDistance += Math.round(route.summary.totalDistance / 1000);
                userStats.routesCompleted += 1;

                // Update rank based on distance
                if (userStats.totalDistance > 10000) {
                    userStats.ninjaRank = 'Master Ninja';
                } else if (userStats.totalDistance > 5000) {
                    userStats.ninjaRank = 'Expert Ninja';
                } else if (userStats.totalDistance > 1000) {
                    userStats.ninjaRank = 'Advanced Ninja';
                }

                saveUserStats();
                updateLeaderboard();
            }
        }

        // Apple Integration Functions
        function toggleAppleMode() {
            isAppleModeActive = !isAppleModeActive;

            if (isAppleModeActive) {
                appleModeButton.textContent = 'APPLE MODE: ON';
                appleModeButton.classList.add('active');
                appleIntegrationPanel.classList.add('active');
                setStatus('Apple integration aktiveret - CarPlay og Apple Maps klar!', 'success');
                showToast('Apple integration aktiveret! Velkommen til Ã¸kosystemet', 'success');
                initializeAppleFeatures();
            } else {
                appleModeButton.textContent = 'APPLE MODE: OFF';
                appleModeButton.classList.remove('active');
                appleIntegrationPanel.classList.remove('active');
                carplayIndicator.classList.remove('active');
                siriSuggestion.classList.remove('active');
                setStatus('Apple integration deaktiveret', 'success');
                showToast('Apple integration deaktiveret', 'success');
                isCarPlayMode = false;
            }
        }

        function initializeAppleFeatures() {
            // Detect CarPlay environment
            detectCarPlay();

            // Set up Siri integration
            initializeSiriIntegration();

            // Apply Apple-style UI changes
            applyAppleStyling();
        }

        function detectCarPlay() {
            // Check for CarPlay environment (simplified detection)
            const isCarPlay = window.navigator.userAgent.includes('CarPlay') ||
                             window.innerWidth < 800 ||
                             window.innerHeight < 600;

            if (isCarPlay) {
                isCarPlayMode = true;
                carplayIndicator.classList.add('active');
                setStatus('CarPlay detekteret - Optimeret til bilnavigation', 'success');
                applyCarPlayOptimizations();
            }
        }

        function applyCarPlayOptimizations() {
            // Larger buttons and text for CarPlay
            document.documentElement.style.fontSize = '18px';

            // Simplify UI for driving
            document.querySelectorAll('.control-panel h2').forEach(title => {
                title.style.fontSize = '24px';
            });

            document.querySelectorAll('.ninja-toggle').forEach(button => {
                button.style.fontSize = '16px';
                button.style.padding = '15px 25px';
            });

            // Auto-enable voice commands for hands-free operation
            if (!isVoiceCommandActive) {
                toggleVoiceCommand();
                showToast('Voice commands aktiveret automatisk for CarPlay', 'success');
            }
        }

        function openInAppleMaps() {
            const currentWaypoints = routingControl.getWaypoints();

            if (currentWaypoints.length < 2) {
                showToast('Ingen aktiv rute at Ã¥bne i Apple Maps', 'error');
                return;
            }

            const start = currentWaypoints[0];
            const end = currentWaypoints[currentWaypoints.length - 1];

            // Create Apple Maps URL
            const appleMapsUrl = `maps:///?saddr=${start.lat},${start.lng}&daddr=${end.lat},${end.lng}&dirflg=${isAggressive ? 'r' : 'd'}`;

            // Try to open in Apple Maps
            window.location.href = appleMapsUrl;

            // Fallback for browsers that don't support maps://
            setTimeout(() => {
                window.open(`https://maps.apple.com/?saddr=${start.lat},${start.lng}&daddr=${end.lat},${end.lng}&dirflg=${isAggressive ? 'r' : 'd'}`, '_blank');
            }, 1000);

            setStatus('Ã…bner rute i Apple Maps...', 'success');
            showToast('Rute Ã¥bnet i Apple Maps!', 'success');
            speakResponse('Rute Ã¥bnet i Apple Maps');
        }

        function shareWithSiri() {
            // Show Siri integration suggestion
            siriSuggestion.classList.add('active');

            // Hide after 5 seconds
            setTimeout(() => {
                siriSuggestion.classList.remove('active');
            }, 5000);

            // Speak Siri instruction
            speakResponse('Sig Hey Siri, start Urban Ninja navigation til at aktivere Siri integration');

            // In a real implementation, this would integrate with Siri Shortcuts API
            showToast('Siri integration aktiveret - brug "Hey Siri, Urban Ninja"', 'success');
        }

        function toggleCarPlayMode() {
            isCarPlayMode = !isCarPlayMode;

            if (isCarPlayMode) {
                carplayIndicator.classList.add('active');
                carplayModeButton.textContent = 'CARPLAY: ACTIVE';
                setStatus('CarPlay mode aktiveret - Optimeret til kÃ¸rsel', 'success');
                applyCarPlayOptimizations();
            } else {
                carplayIndicator.classList.remove('active');
                carplayModeButton.textContent = 'CARPLAY MODE';
                setStatus('CarPlay mode deaktiveret', 'success');

                // Reset styling
                document.documentElement.style.fontSize = '';
                document.querySelectorAll('.control-panel h2').forEach(title => {
                    title.style.fontSize = '';
                });
                document.querySelectorAll('.ninja-toggle').forEach(button => {
                    button.style.fontSize = '';
                    button.style.padding = '';
                });
            }
        }

        function applyAppleStyling() {
            // Apply Apple-like styling to enhance the experience
            document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';

            // Add subtle Apple-style blur effects
            document.querySelectorAll('.control-panel').forEach(panel => {
                panel.style.backdropFilter = 'blur(20px)';
                panel.style.webkitBackdropFilter = 'blur(20px)';
            });
        }

        function initializeSiriIntegration() {
            // Set up Siri shortcut suggestions
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                // Enable advanced voice features for Siri-like experience
                console.log('Siri-like voice integration ready');
            }
        }

        function clearARFeatures() {
            // Remove all POI markers
            arPoiMarkers.forEach(marker => {
                marker.marker.remove();
                if (marker.info) marker.info.remove();
            });
            arPoiMarkers = [];

            // Hide navigation hint
            arNavigationHint.style.display = 'none';

            // Clear update interval
            if (arInfoTimeout) {
                clearInterval(arInfoTimeout);
                arInfoTimeout = null;
            }
        }

        function addARPOIMarkers() {
            // Sample POI locations (in real app, these would come from APIs)
            const poiLocations = [
                { lat: 56.158, lng: 10.210, type: 'restaurant', name: 'Ninja Ramen', info: 'Bedste ramen i Aarhus - kun 200m vÃ¦k' },
                { lat: 56.155, lng: 10.215, type: 'gas', name: 'Ninja Fuel Station', info: 'Benzin station med ninja rabat' },
                { lat: 56.160, lng: 10.205, type: 'shop', name: 'Cyber Store', info: 'Gadgets og tech til ninja missioner' },
                { lat: 56.152, lng: 10.218, type: 'cafe', name: 'Matrix Coffee', info: 'Kaffe med augmented reality menu' },
                { lat: 56.162, lng: 10.202, type: 'parking', name: 'Stealth Parking', info: 'Hemmelig parkeringsplads - kun for ninjas' }
            ];

            poiLocations.forEach((poi, index) => {
                // Convert lat/lng to screen coordinates (simplified)
                const point = map.latLngToContainerPoint([poi.lat, poi.lng]);
                const emoji = getPOIEmoji(poi.type);

                // Create marker element
                const marker = document.createElement('div');
                marker.className = 'ar-poi-marker';
                marker.textContent = emoji;
                marker.style.left = `${point.x - 20}px`;
                marker.style.top = `${point.y - 20}px`;
                marker.title = poi.name;

                // Create info popup
                const info = document.createElement('div');
                info.className = 'ar-poi-info';
                info.innerHTML = `<strong>${poi.name}</strong><br/>${poi.info}`;
                info.style.left = `${point.x + 30}px`;
                info.style.top = `${point.y - 10}px`;

                // Add interaction
                marker.addEventListener('mouseenter', () => {
                    info.classList.add('show');
                });

                marker.addEventListener('mouseleave', () => {
                    info.classList.remove('show');
                });

                marker.addEventListener('click', () => {
                    speakResponse(`POI: ${poi.name}. ${poi.info}`);
                    createParticleExplosion(point.x, point.y);
                });

                // Add to overlay
                arOverlay.appendChild(marker);
                arOverlay.appendChild(info);

                // Store reference
                arPoiMarkers.push({ marker, info, poi });

                // Animate marker appearance
                setTimeout(() => {
                    marker.style.animation = 'ar-marker-bounce 2s infinite';
                }, index * 200);
            });
        }

        function getPOIEmoji(type) {
            const emojiMap = {
                'restaurant': 'ðŸœ',
                'gas': 'â›½',
                'shop': 'ðŸ›’',
                'cafe': 'â˜•',
                'parking': 'ðŸ…¿ï¸'
            };
            return emojiMap[type] || 'ðŸ“';
        }

        function updateARCompass() {
            // Simulate compass heading based on route direction
            const currentWaypoints = routingControl.getWaypoints();
            if (currentWaypoints.length >= 2) {
                const start = currentWaypoints[0];
                const end = currentWaypoints[currentWaypoints.length - 1];

                // Calculate bearing (simplified)
                const bearing = Math.atan2(end.lng - start.lng, end.lat - start.lat) * 180 / Math.PI;

                // Rotate compass arrow
                const arrow = arCompass.querySelector('::after');
                if (arrow) {
                    arrow.style.transform = `translateX(-50%) rotate(${bearing}deg)`;
                }
            }
        }

        function updateARNavigationHints() {
            const currentWaypoints = routingControl.getWaypoints();
            if (currentWaypoints.length < 2) return;

            // Get current route information
            const instructions = routingControl.getInstructions ? routingControl.getInstructions() : null;

            if (instructions && instructions.length > 0) {
                const nextInstruction = instructions[0];
                arNavigationHint.textContent = `AR Navigation: ${nextInstruction.text || 'FÃ¸lg den neon-blÃ¥ rute'}`;
            } else {
                const distance = Math.round(map.distance(currentWaypoints[0], currentWaypoints[1]) / 1000);
                arNavigationHint.textContent = `AR Navigation: ${distance}km til destination`;
            }
        }

        ninjaToggle.addEventListener('click', function() {
            isNinjaMode = !isNinjaMode;
            mapElement.classList.toggle('ninja-mode');

            if (isNinjaMode) {
                ninjaToggle.textContent = 'DEACTIVATE NINJA MODE';
                ninjaToggle.classList.add('active');
                document.body.style.background = '#111';
                document.querySelector('.control-panel').style.borderColor = '#FF0080';
                document.querySelector('h2').style.color = '#FF0080';
                document.querySelector('h2').style.textShadow = '0 0 10px #FF0080';

                // Advanced visual effects when activating ninja mode
                createParticleExplosion(window.innerWidth / 2, window.innerHeight / 2);
                addGlitchEffect(ninjaToggle, 500);
                speakResponse('Ninja mode aktiveret med avancerede visual effects');
            } else {
                ninjaToggle.textContent = 'ACTIVATE NINJA MODE';
                ninjaToggle.classList.remove('active');
                document.body.style.background = '#000';
                document.querySelector('.control-panel').style.borderColor = '#00FFFF';
                document.querySelector('h2').style.color = '#00FFFF';
                document.querySelector('h2').style.textShadow = '0 0 10px #00FFFF';
            }
        });

        // Aggressive Mode Toggle
        aggressiveButton.addEventListener('click', function() {
            if (isRouting) return; // Prevent multiple clicks while routing

            isAggressive = !isAggressive;
            setButtonLoading(aggressiveButton, true);
            setStatus('Beregner ny rute...', 'loading');
            showProgress();

            // Remove current routing control
            map.removeControl(routingControl);

            // Create new router with proper configuration
            const routerOptions = { profile: 'mapbox/driving-traffic' };
            if (isAggressive) {
                routerOptions.exclude = 'motorway';
            }

            // Get current waypoints to preserve any custom destination
            const currentWaypoints = routingControl.getWaypoints();

            // Create new routing control with updated router
            const newRoutingControl = L.Routing.control({
                router: L.Routing.mapbox(MAPBOX_TOKEN, routerOptions),
                waypoints: currentWaypoints,
                routeWhileDragging: true,
                createMarker: createRouteMarker,
                lineOptions: getLineOptions()
            }).addTo(map);

            // Update the global routing control reference
            routingControl = newRoutingControl;

            // Attach event handlers to the new control
            attachRoutingEventHandlers(routingControl);

            // Update button appearance and text
            if (isAggressive) {
                aggressiveButton.textContent = 'AGGRESSIVE ROUTE: ON';
                aggressiveButton.classList.add('active');
            } else {
                aggressiveButton.textContent = 'AGGRESSIVE ROUTE: OFF';
                aggressiveButton.classList.remove('active');
            }
        });

        // Attach initial routing event handlers
        attachRoutingEventHandlers(routingControl);

        // Add markers for start and end points with popups
        L.marker(sabro, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('<b>Sabro</b><br/>Starting Point');

        L.marker(aarhusC, {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('<b>Aarhus C</b><br/>Destination');

        // Location tracking functionality
        let userLocationMarker = null;
        let isLocating = false;

        // Add event listener to locate button
        const locateButton = document.getElementById('locateButton');
        locateButton.addEventListener('click', function() {
            if (isLocating) return;
            findUserLocation();
        });

        // Reset route functionality
        resetButton.addEventListener('click', function() {
            if (isRouting) return;

            // Reset aggressive mode
            if (isAggressive) {
                isAggressive = false;
                aggressiveButton.textContent = 'AGGRESSIVE ROUTE: OFF';
                aggressiveButton.classList.remove('active');
            }

            // Remove current routing control and create fresh one with default settings
            map.removeControl(routingControl);

            const defaultRoutingControl = L.Routing.control({
                router: L.Routing.mapbox(MAPBOX_TOKEN, { profile: 'mapbox/driving-traffic' }),
                waypoints: [sabro, aarhusC],
                routeWhileDragging: true,
                createMarker: createRouteMarker,
                lineOptions: getLineOptions()
            }).addTo(map);

            routingControl = defaultRoutingControl;
            attachRoutingEventHandlers(routingControl);

            // Re-add default markers
            L.marker(sabro, {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup('<b>Sabro</b><br/>Starting Point');

            L.marker(aarhusC, {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map).bindPopup('<b>Aarhus C</b><br/>Destination');

            setStatus('Rute nulstillet til Sabro â†’ Aarhus C', 'success');
            showToast('Rute nulstillet til standard', 'success');
        });

        // Google Maps integration
        googleMapsButton.addEventListener('click', function() {
            openInGoogleMaps();
        });

        // Advanced Ninja Features Event Listeners
        stealthModeButton.addEventListener('click', function() {
            toggleStealthMode();
        });

        nightVisionButton.addEventListener('click', function() {
            toggleNightVision();
        });

        ninjaAlertsButton.addEventListener('click', function() {
            toggleNinjaAlerts();
        });

        voiceCommandButton.addEventListener('click', function() {
            toggleVoiceCommand();
        });

        predictiveRoutingButton.addEventListener('click', function() {
            togglePredictiveRouting();
        });

        arOverlayButton.addEventListener('click', function() {
            toggleAROverlay();
        });

        offlineModeButton.addEventListener('click', function() {
            toggleOfflineMode();
        });

        socialModeButton.addEventListener('click', function() {
            toggleSocialMode();
        });

        shareRouteButton.addEventListener('click', function() {
            shareCurrentRoute();
        });

        findBuddiesButton.addEventListener('click', function() {
            findNearbyBuddies();
            showToast('SÃ¸ger efter nye ninja buddies...', 'loading');
        });

        appleModeButton.addEventListener('click', function() {
            toggleAppleMode();
        });

        openInAppleMapsButton.addEventListener('click', function() {
            openInAppleMaps();
        });

        shareWithSiriButton.addEventListener('click', function() {
            shareWithSiri();
        });

        carplayModeButton.addEventListener('click', function() {
            toggleCarPlayMode();
        });

        function openInGoogleMaps() {
            try {
                // Get current waypoints from routing control
                let waypoints = routingControl.getWaypoints();

                // Fallback to default waypoints if not available
                if (!waypoints || waypoints.length < 2) {
                    waypoints = [sabro, aarhusC];
                }

                // Extract coordinates from waypoints (they are L.latLng objects directly)
                const startLatLng = waypoints[0];
                const endLatLng = waypoints[waypoints.length - 1];

                // Format coordinates for Google Maps URL
                const startCoords = `${startLatLng.lat},${startLatLng.lng}`;
                const endCoords = `${endLatLng.lat},${endLatLng.lng}`;

                // Create Google Maps directions URL
                const googleMapsUrl = `https://www.google.com/maps/dir/${startCoords}/${endCoords}`;

                // Open in new window/tab
                window.open(googleMapsUrl, '_blank');

                setStatus('Ã…bner rute i Google Maps...', 'success');
                showToast('Ruten Ã¥bnes i Google Maps', 'success');

            } catch (error) {
                console.error('Error opening Google Maps:', error);
                setStatus('Kunne ikke Ã¥bne Google Maps', 'error');
                showToast('Fejl ved Ã¥bning af Google Maps', 'error');
            }
        }

        // Route type selection
        if (routeTypeRadios.length > 0) {
            routeTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                currentRouteType = this.value;
                // Update placeholder text based on selection
                if (currentRouteType === 'start') {
                    addressSearch.placeholder = 'SÃ¸g efter startadresse...';
                } else {
                    addressSearch.placeholder = 'SÃ¸g efter destinationsadresse...';
                }
                hideSuggestions();
            });
        });
        }

        // Check if search elements exist before adding listeners
        if (!addressSearch || !searchButton) {
            console.warn('Search elements not found, skipping search functionality');
        } else {

        // Address search functionality
        searchButton.addEventListener('click', function() {
            const address = addressSearch.value.trim();
            if (!address) {
                setStatus('Indtast venligst en adresse', 'error');
                addressSearch.focus();
                addressSearch.classList.add('error');
                return;
            }

            if (address.length < 3) {
                setStatus('Adresse skal vÃ¦re mindst 3 tegn lang', 'error');
                addressSearch.focus();
                addressSearch.classList.add('error');
                return;
            }

            hideSuggestions();
            addressSearch.classList.remove('error');
            updateRouteToAddress(address);
        });

        // Handle search input events
        let searchTimeout;
        addressSearch.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            clearTimeout(searchTimeout);

            // Clear any previous error styling
            addressSearch.classList.remove('error');

            // Validate input and provide feedback
            if (query.length > 0 && query.length < 3) {
                addressSearch.classList.add('error');
                setStatus('Indtast mindst 3 tegn for sÃ¸gning', 'error');
            } else if (query.length >= 3) {
                setStatus('SÃ¸ger efter forslag...', 'loading');
                searchTimeout = setTimeout(() => loadSuggestions(query), 300);
            } else {
                hideSuggestions();
                setStatus('Routing: Sabro â†’ Aarhus C');
            }
        });

        addressSearch.addEventListener('keydown', function(e) {
            if (!addressSuggestions.classList.contains('show')) return;

            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (selectedSuggestionIndex < currentSuggestions.length - 1) {
                        highlightSuggestion(selectedSuggestionIndex + 1);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (selectedSuggestionIndex > 0) {
                        highlightSuggestion(selectedSuggestionIndex - 1);
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedSuggestionIndex >= 0 && currentSuggestions[selectedSuggestionIndex]) {
                        selectSuggestion(currentSuggestions[selectedSuggestionIndex]);
                    } else {
                        const address = addressSearch.value.trim();
                        if (address && address.length >= 3) {
                            hideSuggestions();
                            addressSearch.classList.remove('error');
                            updateRouteToAddress(address);
                        } else if (!address) {
                            setStatus('Indtast venligst en adresse', 'error');
                            addressSearch.classList.add('error');
                        } else {
                            setStatus('Adresse skal vÃ¦re mindst 3 tegn lang', 'error');
                            addressSearch.classList.add('error');
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    hideSuggestions();
                    break;
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!addressSearch.contains(e.target) && !addressSuggestions.contains(e.target)) {
                hideSuggestions();
            }
        });

        function findUserLocation() {
            isLocating = true;
            setButtonLoading(locateButton, true);
            setStatus('Finder din position...', 'loading');
            map.locate({setView: true, maxZoom: 16, watch: false, timeout: 10000});
        }

        // Handle successful location found
        map.on('locationfound', function(e) {
            const radius = e.accuracy / 2;

            // Remove existing marker if it exists
            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
            }

            // Create pulsating cyan circle marker
            userLocationMarker = L.circleMarker(e.latlng, {
                color: '#00FFFF',
                fillColor: '#00FFFF',
                fillOpacity: 0.8,
                radius: 8,
                weight: 2,
                className: 'pulsating-circle'
            }).addTo(map);

            // Add pulsing animation CSS if not already added
            if (!document.getElementById('pulse-style')) {
                const style = document.createElement('style');
                style.id = 'pulse-style';
                style.textContent = `
                    .pulsating-circle {
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 0.8; }
                        50% { transform: scale(1.2); opacity: 0.4; }
                        100% { transform: scale(1); opacity: 0.8; }
                    }
                `;
                document.head.appendChild(style);
            }

            userLocationMarker.bindPopup('<b>Din Position</b><br/>GPS Tracking Aktiv').openPopup();
            setStatus('Position fundet!', 'success');
            showToast('Din position er nu vist pÃ¥ kortet', 'success');
            setButtonLoading(locateButton, false);
            isLocating = false;
        });

        // Handle location error
        map.on('locationerror', function(e) {
            setStatus('Kunne ikke finde position - tjek GPS', 'error');
            setButtonLoading(locateButton, false);
            isLocating = false;
            console.warn('Location error:', e.message);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ignore if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    ninjaToggle.click();
                    break;
                case 'l':
                    e.preventDefault();
                    if (!isLocating) locateButton.click();
                    break;
                case 'a':
                    e.preventDefault();
                    if (!isRouting) aggressiveButton.click();
                    break;
                case 'r':
                    e.preventDefault();
                    if (!isRouting) resetButton.click();
                    break;
                case 'g':
                    e.preventDefault();
                    googleMapsButton.click();
                    break;
                case 's':
                    e.preventDefault();
                    stealthModeButton.click();
                    break;
                case 'v':
                    e.preventDefault();
                    nightVisionButton.click();
                    break;
                case 't':
                    e.preventDefault();
                    ninjaAlertsButton.click();
                    break;
                case 'c':
                    e.preventDefault();
                    voiceCommandButton.click();
                    break;
                case 'p':
                    e.preventDefault();
                    predictiveRoutingButton.click();
                    break;
                case 'x':
                    e.preventDefault();
                    triggerCyberpunkSequence();
                    break;
                case 'o':
                    e.preventDefault();
                    arOverlayButton.click();
                    break;
                case 'f':
                    e.preventDefault();
                    offlineModeButton.click();
                    break;
                case 'z':
                    e.preventDefault();
                    socialModeButton.click();
                    break;
                case 'y':
                    e.preventDefault();
                    appleModeButton.click();
                    break;
                case '?':
                case 'h':
                    e.preventDefault();
                    showHelp();
                    break;
            }
        });

        // Help function
        function showHelp() {
            const helpText = `
URBAN NINJA - Genveje:
â€¢ N - Ninja Mode Toggle
â€¢ L - Find Min Position
â€¢ A - Aggressive Route Toggle
â€¢ R - Reset Route
â€¢ G - Ã…bn i Google Maps
â€¢ S - Stealth Mode Toggle
â€¢ V - Night Vision Toggle
â€¢ T - Ninja Alerts Toggle
â€¢ C - Voice Commands Toggle
â€¢ P - Predictive Routing Toggle
â€¢ O - AR Overlay Toggle
â€¢ F - Offline Mode Toggle
â€¢ Z - Social Ninja Toggle
â€¢ Y - Apple Integration Toggle
â€¢ X - Cyberpunk Visual Effects
â€¢ H/? - Vis Denne HjÃ¦lp

Avancerede Ninja Features:
â€¢ Stealth Mode: Ultra diskret navigation
â€¢ Night Vision: Perfekt til nattlige missioner
â€¢ Ninja Alerts: TrafikfÃ¦lder og politi advarsler
â€¢ Voice Commands: HÃ¦nderfri Siri-lignende kontrol
â€¢ Predictive Routing: AI-optimeret rutevalg baseret pÃ¥ trafik og tid
â€¢ AR Overlay: Augmented reality med POI markÃ¸rer og navigation hints
â€¢ Offline Mode: Service worker caching for stealth navigation uden internet
â€¢ Social Ninja: Find buddies, del routes, leaderboards og achievements
â€¢ Apple Integration: Apple Maps, CarPlay og Siri integration
â€¢ Avancerede Visual Effects: Matrix rain, particle explosions, 3D effects

Voice Commands: Sig "Urban Ninja" + kommando (stealth, night vision, alerts, etc.)

Mobil: Tryk pÃ¥ knapperne for interaktion.
Desktop: Brug genvejstaster for hurtig navigation.
            `;
            alert(helpText);
        }

        // Initialize advanced visual effects
        initializeAdvancedVisualEffects();

        // Show welcome message on load
        setTimeout(() => {
            setStatus('Velkommen til Urban Ninja! Ultimate features: Stealth, Night Vision, Alerts, Voice, Predictive, AR, Offline, Social, Apple & Visual Effects. Tryk H for hjÃ¦lp', 'success');
        }, 1000);
        }
    </script>
