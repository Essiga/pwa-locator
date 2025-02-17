import cameraImage from './camera.svg';
import markerPath2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerPath from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import arrowUpImage from './arrow-up-circle.svg';

const COORD_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 6, maximumFractionDigits: 6, minimumIntegerDigits: 3, style: 'unit', unit: 'degree' });
const DIST_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1, style: 'unit', unit: 'meter' });
const DEG_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1, style: 'unit', unit: 'degree' });

const LOCATION_LEFT_ID = 'location-left';
const LOCATION_MIDDLE_ID = 'location-middle';
const CAMERA_INPUT_ID = 'camera';

//map state
var map;
var ranger;
export var ll;
let headingMarker;
let headingImage;

function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

function configureMap(latLngArray) {
    map = L.map('map').setView(latLngArray, 17);
    if (isTouchDevice()) {
        map.removeControl(map.zoomControl);
    }
    console.log("test");
    map.attributionControl.setPosition('bottomleft');

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    ranger = L.circle(latLngArray, { radius: 20.0 }).addTo(map);

    headingImage = new Image(32, 32);
    headingImage.src = arrowUpImage;
    const headingIcon = L.divIcon({html: headingImage, iconSize: [32, 32], className: ''});
    headingMarker = L.marker([0, 0], {icon: headingIcon});

    const markerIcon = new L.Icon.Default({
        iconUrl: markerPath,
        iconRetinaUrl: markerPath2x,
        shadowUrl: markerShadow
    });

    let images = localStorage.getItem("images");
    if (images == null) {
        images = JSON.stringify({});
    }
    images = JSON.parse(images);

    Object.keys(images).forEach((key) => {
        let coords = key.split(',');
        let latitude = coords[0];
        let longitude = coords[1];
        let photo = images[key];

        L.marker([latitude, longitude], {icon: markerIcon}).addTo(map)
            .bindPopup(`
                <div class="popup-container">
                    <img src='${photo}' width='200px' alt="Marker Image">          
                </div>
            `);
    });
}

function updatePosition(position) {
    const cameraButton = document.getElementById(CAMERA_INPUT_ID);
    cameraButton.disabled = false;
    const locatorLeftDiv = document.getElementById(LOCATION_LEFT_ID);
    const locatorMiddleDiv = document.getElementById(LOCATION_MIDDLE_ID);

    const coords = position.coords;
    console.debug(`got new coordinates: ${coords}`);
    locatorLeftDiv.innerHTML = `
        <dl>
            <dt>LAT</dt>
            <dd>${COORD_FORMATTER.format(coords.latitude)}</dd>
            <dt>LONG</dt>
            <dd>${COORD_FORMATTER.format(coords.longitude)}</dd>
            <dt>ALT</dt>
            <dd>${coords.altitude ? DIST_FORMATTER.format(coords.altitude) : '-'}</dd>
        </dl>`;
    locatorMiddleDiv.innerHTML = `
        <dl>
            <dt>ACC</dt>
            <dd>${DIST_FORMATTER.format(coords.accuracy)}</dd>
            <dt>HEAD</dt>
            <dd>${coords.heading ? DEG_FORMATTER.format(coords.heading) : '-'}</dd>
            <dt>SPD</dt>
            <dd>${coords.speed ? DIST_FORMATTER.format(coords.speed) : '-'}</dd>
        </dl>`;
    ll = [coords.latitude, coords.longitude];

    map.setView(ll);
    localStorage.setItem("lastCoordinates", ll);
    console.log("lastCoordinates: "+ ll);
    ranger.setLatLng(ll);
    ranger.setRadius(coords.accuracy);
}

var geolocation;
var watchID;

/* setup component */
window.onload = () => {
    const cameraButton = document.getElementById(CAMERA_INPUT_ID);
    const queryParams = new URLSearchParams(window.location.search);

    //setup UI
    cameraButton.src = cameraImage;
    cameraButton.addEventListener("click", () => {

       console.log("test button");
       location.href = "/camera.html"
    });

    //init leaflet

    configureMap([47.406653, 9.744844]);
    //configureMap();

    //init footer
    updatePosition({ coords: { latitude: 47.406653, longitude: 9.744844, altitude: 440, accuracy: 40, heading: 45, speed: 1.8 } });

    // setup service worker
    const swDisbaled = (queryParams.get('service-worker') === 'disabled');
    console.debug(`query param 'service-worker': ${queryParams.get('service-worker')}, disabled: ${swDisbaled}`);
    if (!swDisbaled && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register(
            new URL('serviceworker.js', import.meta.url),
            { type: 'module' }
        ).then(() => {
            console.log('Service worker registered!');
        }).catch((error) => {
            console.warn('Error registering service worker:');
            console.warn(error);
        });
    }

    if ('geolocation' in navigator) {
        geolocation = navigator.geolocation;
        const options = {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 27000
        }
        watchID = geolocation.watchPosition(
            updatePosition, handleErr, options);
    }
}
function locate(position) {
    const c = position.coords;
    updatePosition(position);
    console.debug(
        `my position: lat=${c.latitude} lng=${c.longitude}`);
}

function handleErr(err) {
    const cameraButton = document.getElementById(CAMERA_INPUT_ID);
    cameraButton.disabled = true;
    console.error(err.message);
}

window.onbeforeunload = (event) => {
    if (geolocation) {
        geolocation.clearWatch(watchID);
    }
};