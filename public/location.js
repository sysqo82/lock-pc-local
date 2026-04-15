(function () {
    'use strict';

    var map = null;
    var markers = {}; // keyed by userEmail (or 'default' for non-admin view)
    var locationSocket = null;
    var mapVisible = false;

    function formatTimestamp(updatedAt, timestamp) {
        var d = updatedAt ? new Date(updatedAt) : (timestamp ? new Date(Number(timestamp)) : null);
        if (!d || isNaN(d.getTime())) return 'Unknown time';
        return d.toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
    }

    function showError(msg) {
        var statusEl = document.getElementById('location-status');
        if (statusEl) statusEl.textContent = msg;
    }

    function initMap(lat, lng, accuracy, updatedAt, timestamp, userEmail, deviceId, deviceModel) {
        var mapEl = document.getElementById('location-map');
        if (!mapEl) return;

        mapEl.style.display = 'block';
        mapVisible = true;

        if (!map) {
            // Fix default marker icon paths when Leaflet is served locally
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: '/leaflet/marker-icon.png',
                iconRetinaUrl: '/leaflet/marker-icon-2x.png',
                shadowUrl: '/leaflet/marker-shadow.png'
            });
            map = L.map('location-map').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
        }

        var popupText = '<b>Last known location</b>' +
            (userEmail ? '<br><b>User:</b> ' + userEmail : '') +
            (deviceModel ? '<br><b>Device:</b> ' + deviceModel : '') +
            (deviceId ? '<br><b>ID:</b> ' + deviceId : '') +
            '<br>' + lat.toFixed(6) + ', ' + lng.toFixed(6) +
            (accuracy ? '<br>Accuracy: ~' + Math.round(accuracy) + ' m' : '') +
            '<br>Updated: ' + formatTimestamp(updatedAt, timestamp);

        var markerKey = deviceId || userEmail || 'default';
        if (!markers[markerKey]) {
            markers[markerKey] = L.marker([lat, lng]).addTo(map).bindPopup(popupText).openPopup();
        } else {
            markers[markerKey].setLatLng([lat, lng]).getPopup().setContent(popupText).update();
        }

        // Invalidate size after the container becomes visible
        setTimeout(function () { if (map) map.invalidateSize(); }, 100);
    }

    function fitMapToMarkers() {
        var keys = Object.keys(markers);
        if (!map || keys.length === 0) return;
        if (keys.length === 1) {
            map.setView(markers[keys[0]].getLatLng(), 15);
        } else {
            var group = L.featureGroup(keys.map(function (k) { return markers[k]; }));
            map.fitBounds(group.getBounds().pad(0.3));
        }
    }

    function fetchLocation() {
        var statusEl = document.getElementById('location-status');
        var btn = document.getElementById('btn-check-location');

        if (statusEl) statusEl.textContent = 'Fetching location\u2026';
        if (btn) btn.disabled = true;

        fetch(API_CONFIG.getUrl('api/location/current'), { credentials: 'include' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (rows) {
                if (btn) btn.disabled = false;
                if (!Array.isArray(rows) || rows.length === 0) {
                    showError('No location data available yet.');
                    return;
                }
                rows.forEach(function (loc) {
                    initMap(
                        parseFloat(loc.latitude),
                        parseFloat(loc.longitude),
                        loc.accuracy,
                        loc.updated_at,
                        loc.timestamp,
                        loc.user_email || null,
                        loc.device_id || null,
                        loc.device_model || null
                    );
                });
                fitMapToMarkers();
                if (statusEl) statusEl.textContent = rows.length > 1 ? rows.length + ' devices shown' : '';
            })
            .catch(function (err) {
                if (btn) btn.disabled = false;
                showError('Failed to fetch location: ' + err.message);
            });
    }

    function connectLocationSocket() {
        if (locationSocket) return;
        locationSocket = io(API_CONFIG.wsUrl, {
            transports: ['websocket'],
            withCredentials: true,
            extraHeaders: { 'bypass-tunnel-reminder': 'true' }
        });

        locationSocket.on('connect', function () {
            locationSocket.emit('identify', { type: 'dashboard' });
        });

        locationSocket.on('location_update', function (data) {
            if (!mapVisible) return;
            var statusEl = document.getElementById('location-status');
            if (statusEl) statusEl.textContent = '';
            initMap(
                parseFloat(data.latitude),
                parseFloat(data.longitude),
                data.accuracy,
                data.updatedAt,
                data.timestamp,
                data.userEmail || null,
                data.deviceId || null,
                data.deviceModel || null
            );
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('btn-check-location');
        if (btn) {
            btn.addEventListener('click', fetchLocation);
        }
        connectLocationSocket();
    });
})();
