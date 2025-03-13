// Initialize the Leaflet map with a default view
let map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variable to hold the marker and watch ID
let marker;
let watchId;

function logMessage(message, type = 'info') {
    const logDiv = document.querySelector('#log');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    logDiv.appendChild(logEntry);
    // Scroll to the bottom of the log
    logDiv.scrollTop = logDiv.scrollHeight;
}

function geoFindMe() {
    const status = document.querySelector("#status");
    const startButton = document.querySelector("#find-me");
    const stopButton = document.querySelector("#stop-tracking");

    function success(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        logMessage(`Location updated: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}, Accuracy ${accuracy.toFixed(0)}m`);

        // Create or update the marker (red dot)
        if (!marker) {
            marker = L.circleMarker([latitude, longitude], {
                radius: 5,
                color: 'red',
                fillColor: 'red',
                fillOpacity: 1
            }).addTo(map);
            logMessage('Marker created on map');
        } else {
            marker.setLatLng([latitude, longitude]);
            logMessage('Marker position updated');
        }

        // Center and zoom the map to the user's location
        map.setView([latitude, longitude], 18);
        logMessage('Map view updated');

        // Clear the status message after successful update
        status.textContent = "";
        status.className = "";
    }

    function error(err) {
        const errorMessages = {
            1: 'Permission denied. Please allow location access.',
            2: 'Position unavailable. Try switching networks or enabling high-accuracy mode.',
            3: 'Request timed out. Please try again.'
        };
        const message = errorMessages[err.code] || 'Unknown error occurred.';
        status.textContent = message;
        status.className = 'error';
        logMessage(`Error: ${message}`, 'error');
    }

    if (!navigator.geolocation) {
        status.textContent = "Geolocation is not supported by your browser";
        status.className = 'error';
        logMessage('Geolocation not supported by browser', 'error');
    } else {
        status.textContent = "Locating…";
        status.className = 'loading';
        logMessage('Requesting geolocation...');

        // Use watchPosition for live updates with high accuracy
        watchId = navigator.geolocation.watchPosition(success, error, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });

        // Show stop button and hide start button
        startButton.style.display = 'none';
        stopButton.style.display = 'block';
    }
}

function stopTracking() {
    if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
        logMessage('Tracking stopped');
        document.querySelector("#status").textContent = "Tracking stopped.";
        document.querySelector("#status").className = '';
        document.querySelector("#find-me").style.display = 'block';
        document.querySelector("#stop-tracking").style.display = 'none';
    }
}

// Add click event listeners
document.querySelector("#find-me").addEventListener("click", geoFindMe);
document.querySelector("#stop-tracking").addEventListener("click", stopTracking);