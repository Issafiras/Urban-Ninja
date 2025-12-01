/**
 * Urban Ninja - Modern Navigation App
 * Clean, modular ES6+ architecture
 */

// Configuration
const CONFIG = {
    MAPBOX_TOKEN: 'pk.eyJ1IjoiaXNzYWZpcmFzMTk5MCIsImEiOiJjbWluMTEzaHYxeXRjM2ZzNjM4aG54MjNnIn0.7sTv1tWfPgmWc2Uwlp_GnQ',
    DEFAULT_LOCATION: [56.208, 10.035], // Århus, Denmark
    TRAFFIC_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
    AUTOCOMPLETE_DEBOUNCE: 300, // ms
    ANIMATION_DURATION: 300, // ms
    ROUTING_PROFILES: {
        DRIVING: 'mapbox/driving-traffic',
        WALKING: 'mapbox/walking',
        CYCLING: 'mapbox/cycling'
    }
};

// Utility Functions
class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static showToast(message, type = 'info', duration = 3000) {
        console.log(`${type.toUpperCase()}: ${message}`);
        // In a real app, you'd implement a proper toast system
    }

    static formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    }

    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}t ${minutes}min`;
        }
        return `${minutes}min`;
    }

    static calculateBearing(start, end) {
        const startLat = start.lat * Math.PI / 180;
        const startLng = start.lng * Math.PI / 180;
        const endLat = end.lat * Math.PI / 180;
        const endLng = end.lng * Math.PI / 180;

        const dLng = endLng - startLng;
        const y = Math.sin(dLng) * Math.cos(endLat);
        const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }
}

// State Management
class AppState {
    constructor() {
        this.wizardStep = 1;
        this.startLocation = null;
        this.destination = null;
        this.activeHacks = new Set();
        this.routingControl = null;
        this.isRouting = false;
        this.trafficData = null;
        this.lastTrafficUpdate = 0;
        this.userLocation = null;
        this.mapInstance = null;
    }

    reset() {
        this.wizardStep = 1;
        this.startLocation = null;
        this.destination = null;
        this.activeHacks.clear();
        this.isRouting = false;
        if (this.routingControl) {
            this.mapInstance.removeControl(this.routingControl);
            this.routingControl = null;
        }
    }

    setWizardStep(step) {
        this.wizardStep = step;
        this.emit('wizardStepChanged', step);
    }

    toggleHack(hack) {
        if (this.activeHacks.has(hack)) {
            this.activeHacks.delete(hack);
        } else {
            this.activeHacks.add(hack);
        }
        this.emit('hackToggled', { hack, active: this.activeHacks.has(hack) });
    }

    emit(event, data) {
        // Simple event system - in a real app, use a proper event emitter
        console.log(`Event: ${event}`, data);
    }
}

// Map Manager
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.layers = {};
    }

    init() {
        this.map = L.map('map', {
            zoomControl: true,
            attributionControl: true
        }).setView(CONFIG.DEFAULT_LOCATION, 13);

        // Add base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);

        this.setupEventListeners();
        return this.map;
    }

    setupEventListeners() {
        this.map.on('click', (e) => {
            console.log('Map clicked at:', e.latlng);
        });
    }

    addMarker(latlng, options = {}) {
        const marker = L.marker(latlng, options).addTo(this.map);
        this.markers.push(marker);
        return marker;
    }

    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }

    fitBounds(bounds) {
        this.map.fitBounds(bounds, { padding: [20, 20] });
    }

    setView(latlng, zoom) {
        this.map.setView(latlng, zoom);
    }

    addClass(className) {
        document.getElementById('map').classList.add(className);
    }

    removeClass(className) {
        document.getElementById('map').classList.remove(className);
    }
}

// Search Service
class SearchService {
    constructor() {
        this.cache = new Map();
    }

    async geocodeAddress(address) {
        if (this.cache.has(address)) {
            return this.cache.get(address);
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${CONFIG.MAPBOX_TOKEN}&limit=5&country=dk&language=da`
            );

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }

            const data = await response.json();
            const results = data.features || [];
            this.cache.set(address, results);
            return results;
        } catch (error) {
            console.error('Geocoding error:', error);
            return [];
        }
    }

    async reverseGeocode(latlng) {
        const { lat, lng } = latlng;
        const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${CONFIG.MAPBOX_TOKEN}&limit=1&language=da`
            );

            if (!response.ok) {
                throw new Error(`Reverse geocoding failed: ${response.status}`);
            }

            const data = await response.json();
            const result = data.features?.[0] || null;
            this.cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                    return;
                }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const latlng = L.latLng(latitude, longitude);

                    try {
                        const address = await this.reverseGeocode(latlng);
                        resolve({
                            latlng,
                            address: address?.place_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                        });
                    } catch (error) {
                        resolve({
                            latlng,
                            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                        });
                    }
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
}

// Traffic Service
class TrafficService {
    constructor() {
        this.trafficData = null;
        this.lastUpdate = 0;
    }

    async getTrafficData() {
        const now = Date.now();

        // Return cached data if recent
        if (this.trafficData && (now - this.lastUpdate) < CONFIG.TRAFFIC_UPDATE_INTERVAL) {
            return this.trafficData;
        }

        // Simulate traffic based on time of day
        const currentHour = new Date().getHours();
        let multiplier = 1.0;
        let description = 'Normal trafik';

        if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 15 && currentHour <= 18)) {
            multiplier = 1.5;
            description = 'Tung trafik';
        } else if (currentHour >= 22 || currentHour <= 5) {
            multiplier = 0.8;
            description = 'Let trafik';
            } else {
            multiplier = 1.1;
            description = 'Moderat trafik';
        }

        this.trafficData = {
            multiplier,
            description,
            timestamp: now
        };
        this.lastUpdate = now;

        return this.trafficData;
    }

    updateUI() {
        const trafficElement = document.getElementById('trafficStatus');
        if (trafficElement && this.trafficData) {
            const { description, multiplier } = this.trafficData;
            let emoji = '🚦';
            let className = '';

            if (multiplier > 1.3) {
                emoji = '🚨';
                className = 'high-traffic';
            } else if (multiplier < 1.0) {
                emoji = '✅';
                className = 'low-traffic';
            }

            trafficElement.className = `traffic-status ${className}`;
            trafficElement.textContent = `${emoji} ${description} (${multiplier}x)`;
        }
    }
}

// Routing Service
class RoutingService {
    constructor(mapManager, trafficService) {
        this.mapManager = mapManager;
        this.trafficService = trafficService;
        this.routingControl = null;
    }

    async calculateRoute(start, destination, hacks = new Set()) {
        const traffic = await this.trafficService.getTrafficData();

        // Remove existing route
        if (this.routingControl) {
            this.mapManager.map.removeControl(this.routingControl);
        }

        // Determine routing strategy based on hacks
        let router;

        if (hacks.has('extreme')) {
            router = this.createExtremeRouter(start, destination, traffic);
        } else if (hacks.has('urban-ninja') || hacks.has('aggressive')) {
            router = this.createUrbanNinjaRouter(hacks, traffic);
            } else {
            router = this.createStandardRouter(traffic);
        }

        this.routingControl = L.Routing.control({
            router: router,
            waypoints: [start.latlng, destination.latlng],
            routeWhileDragging: false,
            createMarker: (i, wp) => {
                const marker = L.marker(wp.latLng);
                if (i === 0) {
                    marker.bindPopup('START: ' + start.name).openPopup();
                } else if (i === 1) {
                    marker.bindPopup('MÅL: ' + destination.name).openPopup();
                }
                return marker;
            }
        }).addTo(this.mapManager.map);

        return new Promise((resolve, reject) => {
            this.routingControl.on('routesfound', (e) => {
                resolve(e.routes[0]);
            });

            this.routingControl.on('routingerror', (error) => {
                reject(error);
                });
            });
        }

    createExtremeRouter(start, destination, traffic) {
        return {
            route: (waypoints, callback) => {
                const startPoint = waypoints[0].latLng;
                const endPoint = waypoints[1].latLng;
                const distance = startPoint.distanceTo(endPoint);

                const extremeRoute = {
                    name: '🔥 EXTREME URBAN NINJA',
                    coordinates: [startPoint, endPoint],
                    instructions: [{
                        type: 'Extreme',
                        text: `🔥 Ignorerer ALLE restriktioner - absolut korteste distance! Trafik: ${traffic.description}`,
                        distance: distance,
                        time: distance / 1000 * 60,
                        index: 0
                    }],
                    summary: {
                        totalDistance: distance,
                        totalTime: distance / 1000 * 60,
                        trafficAdjustedTime: distance / 1000 * 60 * traffic.multiplier
                    }
                };

                callback(null, [extremeRoute]);
            }
        };
    }

    createUrbanNinjaRouter(hacks, traffic) {
        return {
            route: async (waypoints, callback) => {
                try {
                    const osrmRouter = L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                        profile: 'driving',
                        useHints: false,
                        suppressDemoServerWarning: true
                    });

                    osrmRouter.route(waypoints, (err, routes) => {
                        if (err) {
                            console.warn('OSRM routing failed, using fallback');
                            this.fallbackRoute(waypoints, callback);
                            return;
                        }

                        if (routes && routes.length > 0) {
                            routes.forEach(route => {
                                route.originalTime = route.summary.totalTime;
                                route.trafficAdjustedTime = route.originalTime * traffic.multiplier;

                                if (hacks.has('urban-ninja')) {
                                    // Urban Ninja: Distance-based timing
                                    route.summary.totalTime = route.summary.totalDistance / 1000 * 60;
                                    route.name = '🦹 URBAN NINJA MODE';
                } else {
                                    // Aggressive: Avoid motorways
                                    route.summary.totalTime = route.trafficAdjustedTime;
                                    route.name = '🏎️ AGGRESSIVE MODE';
                                }
                            });

                            // Sort by distance for Urban Ninja, by time for others
                            if (hacks.has('urban-ninja')) {
                                routes.sort((a, b) => a.summary.totalDistance - b.summary.totalDistance);
                            }
                        }

                        callback(null, routes);
                    });
                } catch (error) {
                    console.error('Urban Ninja routing error:', error);
                    this.fallbackRoute(waypoints, callback);
                }
            }
        };
    }

    createStandardRouter(traffic) {
        return L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving',
            useHints: false,
            suppressDemoServerWarning: true
        });
    }

    fallbackRoute(waypoints, callback) {
        const start = waypoints[0].latLng;
        const end = waypoints[1].latLng;
        const distance = start.distanceTo(end);

        const fallbackRoute = {
            name: '🚨 EMERGENCY ROUTE',
            coordinates: [start, end],
            instructions: [{
                type: 'Straight',
                text: '🚨 Straight line emergency route',
                distance: distance,
                time: distance / 1000 * 60,
                index: 0
            }],
            summary: {
                totalDistance: distance,
                totalTime: distance / 1000 * 60
            }
        };

        callback(null, [fallbackRoute]);
    }
}

// UI Manager
class UIManager {
    constructor(appState) {
        this.appState = appState;
        this.elements = this.cacheElements();
        this.setupEventListeners();
    }

    cacheElements() {
        return {
            // Control panel elements
            controlPanel: document.querySelector('.control-panel'),
            emergencyToggle: document.getElementById('emergencyToggle'),

            // Wizard steps
            step1: document.getElementById('wizard-step-1'),
            step2: document.getElementById('wizard-step-2'),
            step3: document.getElementById('wizard-step-3'),
            missionControls: document.getElementById('mission-controls'),

            // Input elements
            startInput: document.getElementById('startInput'),
            destInput: document.getElementById('destInput'),
            startSuggestions: document.getElementById('startSuggestions'),
            destSuggestions: document.getElementById('destSuggestions'),
            startSearchBtn: document.getElementById('startSearchBtn'),
            destSearchBtn: document.getElementById('destSearchBtn'),

            // Buttons
            useLocationBtn: document.getElementById('useLocationBtn'),
            step1Next: document.getElementById('step1Next'),
            step2Back: document.getElementById('step2Back'),
            step2Next: document.getElementById('step2Next'),
            step3Back: document.getElementById('step3Back'),
            startMissionBtn: document.getElementById('startMissionBtn'),
            newMissionBtn: document.getElementById('newMissionBtn'),

            // Status elements
            status: document.getElementById('status'),
            progressBar: document.getElementById('progressBar'),

            // Special panels
            socialPanel: document.getElementById('socialPanel'),
            applePanel: document.getElementById('appleIntegrationPanel'),

            // Visual effects
            matrixRain: document.getElementById('matrixRain'),
            particleContainer: document.getElementById('particleContainer'),
            arOverlay: document.getElementById('arOverlay')
        };
    }

    setupEventListeners() {
        // Emergency toggle
        this.elements.emergencyToggle?.addEventListener('click', () => {
            this.showControlPanel();
        });

        // Step navigation
        this.elements.step1Next?.addEventListener('click', () => this.handleStep1Next());
        this.elements.step2Back?.addEventListener('click', () => this.appState.setWizardStep(1));
        this.elements.step2Next?.addEventListener('click', () => this.handleStep2Next());
        this.elements.step3Back?.addEventListener('click', () => this.appState.setWizardStep(2));

        // Mission controls
        this.elements.startMissionBtn?.addEventListener('click', () => this.handleStartMission());
        this.elements.newMissionBtn?.addEventListener('click', () => this.handleNewMission());

    // Hack toggles
    document.querySelectorAll('.hack-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const hack = e.currentTarget.dataset.hack;
            this.appState.toggleHack(hack);
            e.currentTarget.classList.toggle('active', this.appState.activeHacks.has(hack));

            // Apply immediate effects for special modes
            this.handleHackToggle(hack, this.appState.activeHacks.has(hack));
        });
    });

        // Location button
        this.elements.useLocationBtn?.addEventListener('click', () => this.handleGetLocation());

        // Search buttons
        this.elements.startSearchBtn?.addEventListener('click', () => this.handleManualSearch('start'));
        this.elements.destSearchBtn?.addEventListener('click', () => this.handleManualSearch('dest'));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // State change listeners
        this.appState.onWizardStepChanged = (step) => this.showStep(step);
    }

    showStep(step) {
        // Hide all steps
        [this.elements.step1, this.elements.step2, this.elements.step3, this.elements.missionControls]
            .forEach(el => el?.classList.remove('active'));

        // Show current step
        switch(step) {
            case 1:
                this.elements.step1?.classList.add('active');
                break;
            case 2:
                this.elements.step2?.classList.add('active');
                break;
            case 3:
                this.elements.step3?.classList.add('active');
                break;
            case 4:
                this.elements.missionControls?.classList.add('active');
                this.showControlPanel();
                break;
        }
    }

    showControlPanel() {
        this.elements.controlPanel.style.display = 'block';
        this.elements.emergencyToggle.classList.remove('show');
    }

    hideControlPanel() {
        this.elements.controlPanel.style.display = 'none';
        this.elements.emergencyToggle.classList.add('show');
    }

    setStatus(message, type = 'info') {
        const statusEl = this.elements.status;
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status ${type}`;
        }
    }

    updateProgress(percent) {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percent}%`;
        }
    }

    showSuggestions(suggestionsElement, suggestions) {
        suggestionsElement.innerHTML = '';

        if (suggestions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'suggestion-item';
            noResults.textContent = 'Ingen resultater fundet';
            suggestionsElement.appendChild(noResults);
            } else {
            suggestions.forEach(feature => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = feature.place_name;
                div.addEventListener('click', () => this.selectSuggestion(feature, suggestionsElement));
                suggestionsElement.appendChild(div);
            });
        }

        suggestionsElement.classList.add('show');
    }

    hideSuggestions(suggestionsElement) {
        suggestionsElement.classList.remove('show');
        suggestionsElement.innerHTML = '';
    }

    selectSuggestion(feature, suggestionsElement) {
        const input = suggestionsElement === this.elements.startSuggestions
            ? this.elements.startInput
            : this.elements.destInput;

        input.value = feature.place_name;
        this.hideSuggestions(suggestionsElement);

        const location = {
            latlng: L.latLng(feature.center[1], feature.center[0]),
            name: feature.place_name
        };

        if (suggestionsElement === this.elements.startSuggestions) {
            this.appState.startLocation = location;
            } else {
            this.appState.destination = location;
        }

        Utils.showToast(`Adresse valgt: ${feature.place_name}`, 'success');
    }

    async handleManualSearch(type) {
        const input = type === 'start' ? this.elements.startInput : this.elements.destInput;
        const suggestionsElement = type === 'start' ? this.elements.startSuggestions : this.elements.destSuggestions;

        const query = input.value.trim();
        if (query.length < 2) {
            Utils.showToast('Indtast mindst 2 tegn', 'error');
            return;
        }

        this.setStatus(`Søger efter: ${query}`, 'loading');

        try {
            const suggestions = await window.searchService.geocodeAddress(query);

            if (suggestions.length === 0) {
                Utils.showToast('Ingen resultater fundet', 'error');
                this.setStatus('Ingen resultater fundet', 'error');
                return;
            }

            this.showSuggestions(suggestionsElement, suggestions);
            this.setStatus('Vælg fra søgeresultater', 'success');
        } catch (error) {
            console.error('Search error:', error);
            Utils.showToast('Fejl ved søgning', 'error');
            this.setStatus('Søgningsfejl', 'error');
        }
    }

    async handleGetLocation() {
        this.setStatus('Finder din position...', 'loading');

        try {
            const location = await window.searchService.getUserLocation();
            this.elements.startInput.value = location.address;
            this.appState.startLocation = location;
            this.setStatus('Position fundet!', 'success');
            Utils.showToast('GPS position fundet!', 'success');
                } catch (error) {
            console.error('Location error:', error);
            this.setStatus('Kunne ikke finde position', 'error');
            Utils.showToast('GPS fejl - tjek tilladelser', 'error');
        }
    }

    handleStep1Next() {
        if (this.elements.startInput.value.trim()) {
            this.appState.startLocation = {
                latlng: null,
                name: this.elements.startInput.value.trim()
            };
            this.appState.setWizardStep(2);
            Utils.showToast('Start adresse sat!', 'success');
            } else {
            Utils.showToast('Indtast start adresse', 'error');
        }
    }

    handleStep2Next() {
        if (this.elements.destInput.value.trim()) {
            this.appState.destination = {
                latlng: null,
                name: this.elements.destInput.value.trim()
            };
            this.appState.setWizardStep(3);
            Utils.showToast('Destination sat!', 'success');
        } else {
            Utils.showToast('Indtast destination', 'error');
        }
    }

    async handleStartMission() {
        if (!this.appState.startLocation || !this.appState.destination) {
            Utils.showToast('Vælg start og destination først', 'error');
                return;
            }

        this.appState.isRouting = true;
        this.setStatus('Beregner rute...', 'loading');
        this.updateProgress(10);

        try {
            await window.routingService.calculateRoute(
                this.appState.startLocation,
                this.appState.destination,
                this.appState.activeHacks
            );

            this.updateProgress(100);
            this.setStatus('Rute fundet!', 'success');
            Utils.showToast('Urban Ninja rute klar!', 'success');
            this.appState.setWizardStep(4);
        } catch (error) {
            console.error('Routing error:', error);
            this.setStatus('Routing fejl', 'error');
            Utils.showToast('Kunne ikke finde rute', 'error');
            this.appState.isRouting = false;
        }
    }

    handleNewMission() {
        this.appState.reset();
        this.elements.startInput.value = '';
        this.elements.destInput.value = '';
        this.appState.setWizardStep(1);
        this.setStatus('Klar til ny mission');
    }

    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.key.toLowerCase()) {
            case 'n':
                e.preventDefault();
                this.appState.toggleHack('ninja');
                this.toggleNinjaMode();
                break;
            case 'u':
                e.preventDefault();
                this.appState.toggleHack('urban-ninja');
                break;
            case 'x':
                e.preventDefault();
                this.appState.toggleHack('extreme');
                break;
            case 'p':
                e.preventDefault();
                window.visualEffects?.toggleParticles(!this.particlesActive);
                this.particlesActive = !this.particlesActive;
                Utils.showToast(`Partikler ${this.particlesActive ? 'aktiveret' : 'deaktiveret'}`, 'info');
                break;
            case 'c':
                e.preventDefault();
                this.showControlPanel();
                Utils.showToast('Kontrolpanel gendannet!', 'success');
                break;
        }
    }

    handleHackToggle(hack, active) {
        const mapElement = document.getElementById('map');

        switch(hack) {
            case 'ninja':
                if (active) {
                    mapElement.classList.add('ninja-mode');
                    Utils.showToast('🥷 Ninja Mode aktiveret!', 'success');
                } else {
                    mapElement.classList.remove('ninja-mode');
                    Utils.showToast('Ninja Mode deaktiveret', 'success');
                }
                break;

            case 'stealth':
                if (active) {
                    mapElement.classList.add('stealth-mode');
                    Utils.showToast('👤 Stealth Mode: Kortet er nu diskret', 'success');
                } else {
                    mapElement.classList.remove('stealth-mode');
                    Utils.showToast('Stealth Mode deaktiveret', 'success');
                }
                break;

            case 'nightvision':
                if (active) {
                    mapElement.classList.add('night-vision');
                    Utils.showToast('🌙 Night Vision aktiveret', 'success');
                } else {
                    mapElement.classList.remove('night-vision');
                    Utils.showToast('Night Vision deaktiveret', 'success');
                }
                break;

            case 'ar':
                if (active) {
                    window.visualEffects?.toggleAR(true);
                    this.elements.socialPanel?.classList.add('active');
                    Utils.showToast('📱 AR Overlay aktiveret', 'success');
                } else {
                    window.visualEffects?.toggleAR(false);
                    Utils.showToast('AR Overlay deaktiveret', 'success');
                }
                break;

            case 'social':
                if (active) {
                    this.elements.socialPanel?.classList.add('active');
                    Utils.showToast('🫂 Social Mode aktiveret', 'success');
                } else {
                    this.elements.socialPanel?.classList.remove('active');
                    Utils.showToast('Social Mode deaktiveret', 'success');
                }
                break;

            case 'apple':
                if (active) {
                    this.elements.applePanel?.classList.add('active');
                    Utils.showToast(' Apple Integration aktiveret', 'success');
                } else {
                    this.elements.applePanel?.classList.remove('active');
                    Utils.showToast('Apple Integration deaktiveret', 'success');
                }
                break;

            case 'voice':
                if (active) {
                    Utils.showToast('🎤 Voice Commands aktiveret - sig "Urban Ninja"', 'success');
                    this.initVoiceCommands();
                } else {
                    Utils.showToast('Voice Commands deaktiveret', 'success');
                    this.stopVoiceCommands();
                }
                break;

            case 'urban-ninja':
                if (active) {
                    Utils.showToast('🐀 Urban Ninja Mode: Scanner efter genveje...', 'error', 5000);
                    // Trigger matrix rain for dramatic effect
                    window.visualEffects?.toggleMatrixRain(true);
                    setTimeout(() => {
                        if (!this.appState.activeHacks.has('urban-ninja')) {
                            window.visualEffects?.toggleMatrixRain(false);
                        }
                    }, 3000);
                } else {
                    Utils.showToast('Urban Ninja Mode deaktiveret', 'success');
                    window.visualEffects?.toggleMatrixRain(false);
                }
                break;

            case 'extreme':
                if (active) {
                    Utils.showToast('🔥 EXTREME Mode aktiveret - ignorerer ALLE restriktioner!', 'error', 5000);
                    window.visualEffects?.triggerCyberpunkEffects();
                } else {
                    Utils.showToast('EXTREME Mode deaktiveret', 'success');
                }
                break;
        }
    }

    initVoiceCommands() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            Utils.showToast('Voice commands ikke understøttet i denne browser', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'da-DK';

        this.recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            console.log('Voice command:', command);

            if (command.includes('urban ninja') || command.includes('find mig')) {
                this.handleGetLocation();
            } else if (command.includes('stealth')) {
                this.appState.toggleHack('stealth');
                this.handleHackToggle('stealth', this.appState.activeHacks.has('stealth'));
            } else if (command.includes('navigation') || command.includes('start mission')) {
                this.handleStartMission();
            }
        };

        this.recognition.onend = () => {
            if (this.appState.activeHacks.has('voice')) {
                // Restart listening for continuous voice commands
                setTimeout(() => {
                    if (this.recognition && this.appState.activeHacks.has('voice')) {
                        this.recognition.start();
                    }
                }, 1000);
            }
        };

        this.recognition.start();
        Utils.showToast('🎤 Lytter efter stemmekommandoer...', 'info');
    }

    stopVoiceCommands() {
        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }
    }
}

// Visual Effects Manager
class VisualEffectsManager {
    constructor() {
        this.matrixRain = document.getElementById('matrixRain');
        this.particleContainer = document.getElementById('particleContainer');
        this.arOverlay = document.getElementById('arOverlay');
        this.matrixActive = false;
        this.particlesActive = false;
        this.arActive = false;
        this.particles = [];
        this.animationId = null;
    }

    init() {
        this.setupMatrixRain();
        this.setupParticles();
        this.setupResizeHandler();
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            if (this.matrixRain) {
                this.matrixRain.width = window.innerWidth;
                this.matrixRain.height = window.innerHeight;
            }
        });
    }

    setupMatrixRain() {
        if (!this.matrixRain) return;

        const canvas = this.matrixRain;
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const matrixChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const matrixArray = matrixChars.split("");

        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(1);

        const draw = () => {
            if (!this.matrixActive) return;

            // Semi-transparent black background for trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Matrix characters
            ctx.fillStyle = '#00FFFF';
            ctx.font = `${fontSize}px 'Courier New', monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                // Reset drop to top randomly
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

            this.animationId = requestAnimationFrame(draw);
        };

        // Start the animation loop
        this.matrixAnimationId = requestAnimationFrame(draw);
    }

    setupParticles() {
        if (!this.particleContainer) return;

        this.particles = [];
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            this.createParticle();
        }

        this.animateParticles();
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';

        this.particleContainer.appendChild(particle);
        this.particles.push(particle);
    }

    animateParticles() {
        // CSS animations handle the particle movement
        // This could be enhanced with JavaScript for more complex effects
    }

    toggleMatrixRain(active) {
        this.matrixActive = active;
        if (this.matrixRain) {
            this.matrixRain.classList.toggle('active', active);
            if (!active && this.matrixAnimationId) {
                cancelAnimationFrame(this.matrixAnimationId);
                // Clear canvas
                const ctx = this.matrixRain.getContext('2d');
                ctx.clearRect(0, 0, this.matrixRain.width, this.matrixRain.height);
            } else if (active) {
                this.setupMatrixRain();
            }
        }
    }

    toggleParticles(active) {
        this.particlesActive = active;
        if (this.particleContainer) {
            this.particleContainer.classList.toggle('active', active);
        }
    }

    toggleAR(active) {
        this.arActive = active;
        if (this.arOverlay) {
            this.arOverlay.classList.toggle('active', active);
        }
    }

    triggerCyberpunkEffects() {
        // Flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #FFFFFF;
            opacity: 0.8;
            z-index: 9999;
            pointer-events: none;
            animation: flash 0.1s ease-out;
        `;

        document.body.appendChild(flash);
        setTimeout(() => document.body.removeChild(flash), 100);

        // Screen glitch effect
        document.body.classList.add('glitch');
        setTimeout(() => document.body.classList.remove('glitch'), 200);
    }

    addGlitchEffect() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flash {
                0% { opacity: 0; }
                50% { opacity: 0.8; }
                100% { opacity: 0; }
            }

            .glitch {
                animation: glitch 0.2s ease-in-out;
            }

            @keyframes glitch {
                0% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
                100% { transform: translate(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Main Application Class
class UrbanNinjaApp {
    constructor() {
        this.state = new AppState();
        this.mapManager = new MapManager();
        this.searchService = new SearchService();
        this.trafficService = new TrafficService();
        this.routingService = null;
        this.uiManager = null;
        this.visualEffects = new VisualEffectsManager();
    }

    async init() {
        console.log('🚀 Initializing Urban Ninja...');

        // Initialize map
        this.state.mapInstance = this.mapManager.init();

        // Initialize services
        this.routingService = new RoutingService(this.mapManager, this.trafficService);
        this.uiManager = new UIManager(this.state);

        // Initialize visual effects
        this.visualEffects.init();
        this.visualEffects.addGlitchEffect();

        // Make services globally available for UI callbacks
        window.searchService = this.searchService;
        window.routingService = this.routingService;
        window.visualEffects = this.visualEffects;

        // Initialize traffic data
        await this.trafficService.getTrafficData();
        this.trafficService.updateUI();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Setup periodic traffic updates
        setInterval(() => {
            this.trafficService.getTrafficData().then(() => {
                this.trafficService.updateUI();
            });
        }, CONFIG.TRAFFIC_UPDATE_INTERVAL);

        console.log('✅ Urban Ninja initialized successfully');
        this.uiManager.setStatus('Velkommen til Urban Ninja!');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key.toLowerCase()) {
                case 'y':
                    e.preventDefault();
                    // Test routing with Copenhagen coordinates
                    this.testRouting();
                    break;
                case 't':
                    e.preventDefault();
                    this.trafficService.getTrafficData().then(traffic => {
                        Utils.showToast(`Trafik opdateret: ${traffic.description}`, 'info');
                        this.trafficService.updateUI();
                    });
                    break;
            }
        });
    }

    async testRouting() {
        console.log('🧪 Starting test routing...');

        this.state.startLocation = {
            latlng: L.latLng(55.6761, 12.5683),
            name: 'København Test Start'
        };

        this.state.destination = {
            latlng: L.latLng(55.6761, 12.6000),
            name: 'København Test Mål'
        };

        try {
            await this.routingService.calculateRoute(
                this.state.startLocation,
                this.state.destination,
                this.state.activeHacks
            );
            Utils.showToast('Test rute beregnet!', 'success');
        } catch (error) {
            console.error('Test routing failed:', error);
            Utils.showToast('Test routing fejlede', 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new UrbanNinjaApp();
    app.init().catch(error => {
        console.error('Failed to initialize Urban Ninja:', error);
        Utils.showToast('Fejl ved initialisering af app', 'error');
    });
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UrbanNinjaApp, Utils, MapManager, SearchService, TrafficService, RoutingService, UIManager };
}