window.addEventListener("DOMContentLoaded", function() {
	var video = document.querySelector("#cameraVideo");

	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({video:true}).then(function(stream) {
			video.srcObject = stream;
		});
	} else {
		console.log("Hmmm");
	}
}, false);