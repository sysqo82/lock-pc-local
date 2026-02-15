// API Configuration - default to the page origin so the dashboard works
// whether accessed via localhost or a public tunnel (e.g. dashboard.lockpc.co.uk)
const API_CONFIG = (function() {
    const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : 'http://localhost:3000';
    // Build ws/wss URL based on page protocol
    const wsProto = origin.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = origin.replace(/^https?:/, '');

    return {
        baseUrl: origin,
        wsUrl: `${wsProto}//${wsHost.replace(/^\/\//, '')}`,
        getUrl: function(path) {
            // Keep absolute paths relative to origin
            if (!path) return this.baseUrl;
            const clean = path.startsWith('/') ? path : '/' + path;
            return this.baseUrl + clean;
        },
        getHeaders: function(additionalHeaders = {}) {
            return {
                'bypass-tunnel-reminder': 'true',
                ...additionalHeaders
            };
        }
    };
})();
