import cancelImage from "./x-circle.svg";
import playImage from './play-btn.svg';
import pauseImage from './pause-btn.svg';
import saveImage from './save.svg';
import {ll} from "./locator";
let streaming = false; //flag for a 1st-time init
const video = document.getElementById('video');
// const canvas = document.getElementById('canvas');

let photo = document.getElementById("photo");
const playPauseButton = document.getElementById("playPause");
const saveButton = document.getElementById("save");

window.onload = () => {


    //setup UI
    playPauseButton.src = pauseImage;
    saveButton.src = saveImage;
    saveButton.addEventListener("click", savePicture);

    const cancelButton = document.getElementById("cancelButton");

    playPauseButton.addEventListener("click", takePicture)
    //setup UI
    cancelButton.src = cancelImage;
    cancelButton.addEventListener("click", () => {

        console.log("test button");
        location.href = "/"
    });
}

//start video playback
navigator.mediaDevices.getUserMedia(
    { video: true, audio: false })
    .then((stream) => {
        video.srcObject = stream;
        video.play();
    })
    .catch((err) => {
        console.error(`An error occurred: ${err}`);
    });



function pauseImageFunction() {
    playPauseButton.removeEventListener("click", pauseImageFunction);
    video.style.display = "block";
    playPauseButton.src = pauseImage;
    playPauseButton.addEventListener("click", takePicture);
    photo.style.display = "none";
}
let canvasImgBlob;
function takePicture(event) {
    playPauseButton.src = playImage;
    playPauseButton.removeEventListener("click", takePicture);
    playPauseButton.addEventListener("click", pauseImageFunction);


    let width = video.offsetWidth;
    let height = video.offsetHeight;
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, width, height);

    canvas.convertToBlob({ type: 'image/jpeg' }).then(
        (blob) => {
            canvasImgBlob = blob;
            const imageData = URL.createObjectURL(blob);
            photo.width = width;
            photo.height = height;
            photo.src = imageData;
        }
    );

    video.style.display = "none";
    photo.style.display = "block";

}

function savePicture(){
    const reader = new FileReader();
    reader.onloadend = function () {
        let images = JSON.parse(localStorage.getItem("images"));
        if (images == null) {
            images = {};
        }
        images[localStorage.getItem("lastCoordinates")] = reader.result;

        localStorage.setItem("images", JSON.stringify(images));
        //localStorage.setItem('my-image', reader.result);
    };
    reader.readAsDataURL(canvasImgBlob);
}
