const socket = io();

// Initialize map and variables
let map;
let currentUserMarker; // Red marker for current user
const otherUserMarkers = new Map(); // Track others' markers by ID

const findMeButton = document.getElementById('find-me');
const stopTrackingButton = document.getElementById('stop-tracking');
const statusDiv = document.getElementById('status');
const logDiv = document.getElementById('log');
const locationOutput = document.getElementById('location-output');
const copyLocationButton = document.getElementById('copy-location');

let trackingInterval;

function logMessage(message, isError = false) {
    const logEntry = document.createElement('div');
    logEntry.classList.add('log-entry');
    if (isError) {
        logEntry.classList.add('error');
    }
    logEntry.textContent = message;
    logDiv.appendChild(logEntry);
    logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll
}

function initMap(lat, lng) {
    map = L.map('map').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

function updateLocation(position) {
    const { latitude, longitude } = position.coords;

    locationOutput.value = `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;

    if (!map) {
        initMap(latitude, longitude);
    } else {
        map.setView([latitude, longitude]);
    }

    // Update or create current user marker
    if (currentUserMarker) {
        currentUserMarker.setLatLng([latitude, longitude]);
    } else {
        currentUserMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
                className: 'user-icon',
                html: '<i class="fas fa-user" style="color: red;"></i>', // Red user icon
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(map);
    }

    socket.emit('updateLocation', { latitude, longitude });
    logMessage(`Location updated: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`);
}

function handleLocationError(error) {
    statusDiv.classList.add('error');
    let message;
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "Location access denied.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
        case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        case error.UNKNOWN_ERROR:
            message = "An unknown error occurred.";
            break;
    }
    statusDiv.textContent = `Error: ${message}`;
    logMessage(`Geolocation error: ${message}`, true);
}

function startTracking() {
    statusDiv.textContent = 'Tracking...';
    statusDiv.classList.add('loading');
    findMeButton.style.display = 'none';
    stopTrackingButton.style.display = 'block';

    if (navigator.geolocation) {
        trackingInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(updateLocation, handleLocationError);
        }, 5000);  // Update every 5 seconds

    } else {
        statusDiv.textContent = 'Geolocation is not supported.';
        logMessage('Geolocation is not supported by this browser.', true);
    }
}

function stopTracking() {
    clearInterval(trackingInterval);
    statusDiv.textContent = 'Tracking stopped.';
    statusDiv.classList.remove('loading', 'error');
    findMeButton.style.display = 'block';
    stopTrackingButton.style.display = 'none';
}

// Event listeners
findMeButton.addEventListener('click', startTracking);
stopTrackingButton.addEventListener('click', stopTracking);

copyLocationButton.addEventListener('click', () => {
    locationOutput.select();
    document.execCommand('copy');
    alert('Location copied to clipboard!');
});

// Socket event listeners

socket.on('updateUsers', (users) => {
    // Update connected users list
    const usersList = document.querySelector("#users-list");
    usersList.innerHTML = '';

    // Update map markers
    const currentIds = new Set(users.map(user => user.id));

    // Remove old markers
    otherUserMarkers.forEach((marker, id) => {
        if (!currentIds.has(id)) {
            map.removeLayer(marker);
            otherUserMarkers.delete(id);
        }
    });

    // Add/update markers
    users.forEach(user => {
        if (user.id === socket.id) return; // Skip current user

        if (!otherUserMarkers.has(user.id)) {
            // Create new marker
            const marker = L.marker([user.latitude, user.longitude], {
                icon: L.divIcon({
                    className: 'user-icon',
                    html: '<i class="fas fa-user" style="color: blue;"></i>', // Blue user icon
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
            otherUserMarkers.set(user.id, marker);
        } else {
            // Update existing marker
            otherUserMarkers.get(user.id).setLatLng([user.latitude, user.longitude]);
        }

        // Update users list
        const userDiv = document.createElement('div');
        userDiv.textContent = `User ${user.id.slice(0, 5)}: Lat ${user.latitude.toFixed(4)}, Lon ${user.longitude.toFixed(4)}`;
        usersList.appendChild(userDiv);
    });
});