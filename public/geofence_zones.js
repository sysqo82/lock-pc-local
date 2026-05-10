(function () {
    'use strict';

    var zonesCache = [];

    function renderZones(zones) {
        zonesCache = zones || [];
        var list = document.getElementById('geofence-zones-list');
        if (!list) return;
        if (!zonesCache.length) {
            list.innerHTML = '<p class="geofence-empty">No zones defined yet.</p>';
            return;
        }
        list.innerHTML = zonesCache.map(function (z) {
            return '<div class="geofence-zone-item" data-id="' + z.id + '">' +
                '<div class="geofence-zone-info">' +
                    '<span class="geofence-zone-name">' + escapeHtml(z.name) + '</span>' +
                    '<span class="geofence-zone-coords">' +
                        z.latitude.toFixed(6) + ', ' + z.longitude.toFixed(6) +
                        ' &mdash; ' + z.radius_meters + ' m' +
                    '</span>' +
                '</div>' +
                '<button class="btn-geofence-delete" data-id="' + z.id + '">Delete</button>' +
            '</div>';
        }).join('');

        list.querySelectorAll('.btn-geofence-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                deleteZone(parseInt(this.getAttribute('data-id'), 10));
            });
        });
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fetchZones() {
        fetch(API_CONFIG.getUrl('api/geofence-zones'), { credentials: 'include' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(renderZones)
            .catch(function (err) {
                console.error('Failed to fetch geofence zones:', err);
            });
    }

    function deleteZone(id) {
        if (!confirm('Delete this zone?')) return;
        fetch(API_CONFIG.getUrl('api/geofence-zones/' + id), {
            method: 'DELETE',
            credentials: 'include'
        })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(fetchZones)
            .catch(function (err) {
                alert('Failed to delete zone: ' + err.message);
            });
    }

    function addZone(name, lat, lng, radius) {
        fetch(API_CONFIG.getUrl('api/geofence-zones'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, latitude: lat, longitude: lng, radius_meters: radius })
        })
            .then(function (r) {
                if (!r.ok) return r.json().then(function (e) { throw new Error(e.error || 'HTTP ' + r.status); });
                return r.json();
            })
            .then(function () { fetchZones(); })
            .catch(function (err) {
                alert('Failed to add zone: ' + err.message);
            });
    }

    // -- Map picker --
    var pickMap = null;
    var pickMarker = null;
    var pickCircle = null;

    function initPickMap() {
        if (pickMap) return;
        var mapEl = document.getElementById('geofence-pick-map');
        if (!mapEl || typeof L === 'undefined') return;

        // Force Leaflet to use our icon paths — delete _getIconUrl first so
        // mergeOptions actually takes effect instead of the auto-detection logic
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconUrl:       '/leaflet/marker-icon.png',
            iconRetinaUrl: '/leaflet/marker-icon-2x.png',
            shadowUrl:     '/leaflet/marker-shadow.png'
        });

        pickMap = L.map(mapEl).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(pickMap);

        pickMap.on('click', function (e) {
            setPickedPoint(e.latlng.lat, e.latlng.lng);
        });
    }

    function setPickedPoint(lat, lng) {
        // Leaflet can return longitudes outside [-180, 180] when the map is
        // panned across the date line — normalize before storing
        lng = ((lng + 180) % 360 + 360) % 360 - 180;

        document.getElementById('geofence-lat').value = lat;
        document.getElementById('geofence-lng').value = lng;

        var display = document.getElementById('geofence-coords-display');
        display.textContent = lat.toFixed(6) + ', ' + lng.toFixed(6);
        display.classList.add('has-point');

        if (!pickMap) return;
        if (pickMarker) {
            pickMarker.setLatLng([lat, lng]);
        } else {
            pickMarker = L.marker([lat, lng]).addTo(pickMap);
        }
        updatePickCircle(lat, lng);
    }

    function updatePickCircle(lat, lng) {
        if (!pickMap) return;
        var radiusInput = document.getElementById('geofence-radius');
        var radius = radiusInput ? (parseInt(radiusInput.value, 10) || 150) : 150;
        if (pickCircle) {
            pickCircle.setLatLng([lat, lng]);
            pickCircle.setRadius(radius);
        } else {
            pickCircle = L.circle([lat, lng], {
                radius: radius,
                color: '#3388ff',
                weight: 2,
                fillColor: '#3388ff',
                fillOpacity: 0.15
            }).addTo(pickMap);
        }
    }

    function togglePickMap(forceOpen) {
        var mapEl = document.getElementById('geofence-pick-map');
        if (!mapEl) return;
        var isHidden = mapEl.style.display === 'none' || mapEl.style.display === '';
        var shouldShow = forceOpen !== undefined ? forceOpen : isHidden;

        mapEl.style.display = shouldShow ? 'block' : 'none';
        if (shouldShow) {
            initPickMap();
            if (pickMap) setTimeout(function () { pickMap.invalidateSize(); }, 50);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        fetchZones();

        var form = document.getElementById('geofence-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var name   = document.getElementById('geofence-name').value.trim();
                var lat    = parseFloat(document.getElementById('geofence-lat').value);
                var lng    = parseFloat(document.getElementById('geofence-lng').value);
                var radius = parseInt(document.getElementById('geofence-radius').value, 10);
                if (!name) { alert('Please enter a zone name.'); return; }
                if (isNaN(lat) || isNaN(lng)) { alert('Please pick a location on the map first.'); return; }
                if (isNaN(radius)) return;
                addZone(name, lat, lng, radius);
                form.reset();
                document.getElementById('geofence-radius').value = '150';
                pickMap = null;
                pickMarker = null;
                pickCircle = null;
                togglePickMap(false);
                var display = document.getElementById('geofence-coords-display');
                display.textContent = 'No location selected';
                display.classList.remove('has-point');
            });
        }

        var radiusInput = document.getElementById('geofence-radius');
        if (radiusInput) {
            radiusInput.addEventListener('input', function () {
                var lat = parseFloat(document.getElementById('geofence-lat').value);
                var lng = parseFloat(document.getElementById('geofence-lng').value);
                if (!isNaN(lat) && !isNaN(lng)) updatePickCircle(lat, lng);
            });
        }

        var btnPickMap = document.getElementById('btn-pick-on-map');
        if (btnPickMap) {
            btnPickMap.addEventListener('click', function () { togglePickMap(); });
        }

        var btnCurrentLoc = document.getElementById('btn-use-current-location');
        if (btnCurrentLoc) {
            btnCurrentLoc.addEventListener('click', function () {
                if (!navigator.geolocation) {
                    alert('Geolocation is not supported by this browser.');
                    return;
                }
                btnCurrentLoc.disabled = true;
                btnCurrentLoc.textContent = 'Locating...';
                navigator.geolocation.getCurrentPosition(
                    function (pos) {
                        var lat = pos.coords.latitude;
                        var lng = pos.coords.longitude;
                        togglePickMap(true);
                        setTimeout(function () {
                            pickMap.setView([lat, lng], 16);
                            setPickedPoint(lat, lng);
                        }, 80);
                        btnCurrentLoc.disabled = false;
                        btnCurrentLoc.textContent = 'My location';
                    },
                    function () {
                        alert('Could not get your location.');
                        btnCurrentLoc.disabled = false;
                        btnCurrentLoc.textContent = 'My location';
                    }
                );
            });
        }

        if (typeof io !== 'undefined' && typeof API_CONFIG !== 'undefined') {
            var sock = io(API_CONFIG.wsUrl, {
                transports: ['websocket'],
                withCredentials: true,
                extraHeaders: { 'bypass-tunnel-reminder': 'true' }
            });
            sock.on('connect', function () { sock.emit('identify', { type: 'dashboard' }); });
            sock.on('geofence_zones_update', renderZones);
        }
    });
})();
