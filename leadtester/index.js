function loadImage(input) {
	if (input.files && input.files[0]) {
		var waterImage = document.getElementById('waterImage');
		waterImage.src = URL.createObjectURL(input.files[0]);
	}
}