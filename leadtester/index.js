function loadImage(input) {
	if (input.files && input.files[0]) {
		var waterImage = document.getElementById('waterImage');
		var ctx = waterImage.getContext("2d");
		var tempImage = new Image;
		tempImage.onload = function(){
		  ctx.drawImage(tempImage,0,0);
		};
		tempImage.src = URL.createObjectURL(input.files[0]);
	}
}