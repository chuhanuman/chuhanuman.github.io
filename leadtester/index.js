//Based on ColorThief github.com/fengsp/color-thief-py/
var sigbits = 5;
var rshift = 8 - sigbits;
var maxColors = 10;
var testColors = [[252,205,205,0],[251,167,168,10],[192,162,163,25],[133,104,129,50],[95,60,93,100],[64,34,63,200]];
function getColorIndex(r, g, b) {
	return (r << (2 * sigbits)) + (g << sigbits) + b;
}

class PriorityQueue {
	constructor(sortKey)
	{
		this.contents = [];
		this.sortKey = sortKey;
		this.sorted = false;
	}
	
	sort() {
		this.contents.sort(this.sortKey);
		this.sorted = true;
	}
	
	push(item) {
		this.contents.push(item);
	}
	
	peek(index) {
		if (!this.sorted) {
			this.sort();
		}
		return this.contents[index];
	}
	
	pop() {
		if (!this.sorted) {
			this.sort();
		}
		return this.contents.pop();
	}
	
	size() {
		return this.contents.length;
	}
}

class VBox {
	constructor(r1, r2, g1, g2, b1, b2, hist) {
		this.r1 = r1;
		this.r2 = r2;
		this.g1 = g1;
		this.g2 = g2;
		this.b1 = b1;
		this.b2 = b2;
		this.hist = hist;
	}
	
	get volume() {
		var vol = (this.r2 - this.r1 + 1) * (this.g2 - this.g1 + 1) * (this.b2 - this.b1 + 1);
		
		Object.defineProperty(this, "volume", {
			value: vol,
			writable: false,
			configurable: false,
			enumerable: false
		});
		return vol;
	}

	copy() {
		return new VBox(this.r1, this.r2, this.g1, this.g2,
					this.b1, this.b2, this.hist);
	}
	
	get average() {
		var nTot = 0;
		var mult = 1 << (8 - sigbits);
		var rSum = 0, gSum = 0, bSum = 0;
		var index;
		var hVal;
		var i = this.r1, j, k;
		while (i < this.r2 + 1) {
			j = this.g1;
			while (j < this.g2 + 1) {
				k = this.b1;
				while (k < this.b2 + 1) {
					index = getColorIndex(i, j, k);
					hVal = (index in this.hist) ? this.hist[index] : 0;
					nTot += hVal;
					rSum += hVal*(i+0.5)*mult;
					gSum += hVal*(j+0.5)*mult;
					bSum += hVal*(k+0.5)*mult;
					k++;
				}
				j++;
			}
			i++;
		}
		
		var avg;
		if (nTot != 0) {
			avg = [~~(rSum/nTot), ~~(gSum/nTot), ~~(bSum/nTot)];
		} else {
			avg = [~~(mult*(this.r1+this.r2+1)/2), ~~(mult*(this.g1+this.g2+1)/2), ~~(mult*(this.b1+this.b2+1)/2)];
		}
		
		Object.defineProperty(this, "average", {
			value: avg,
			writable: false,
			configurable: false,
			enumerable: false
		});
		return avg;
	}
	
	get count() {
		var numPixels = 0;
		var index;
		var i = this.r1, j, k;
		while (i < this.r2 + 1) {
			j = this.g1;
			while (j < this.g2 + 1) {
				k = this.b1;
				while (k < this.b2 + 1) {
					index = getColorIndex(i, j, k);
					numPixels += (index in this.hist) ? this.hist[index] : 0;
					k++;
				}
				j++;
			}
			i++;
		}
		
		Object.defineProperty(this, "count", {
			value: numPixels,
			writable: false,
			configurable: false,
			enumerable: false
		});
		return numPixels;
	}
}

function medianCut(hist, vBox) {
	var rWidth = vBox.r2 - vBox.r1 + 1, gWidth = vBox.g2 - vBox.g1 + 1, bWidth = vBox.b2 - vBox.b1 + 1;
	var maxWidth = Math.max.apply(Math, [rWidth, gWidth, bWidth]);
	
	if (vBox.count == 1) {
		return [vBox.copy()];
	}
	
	var total = 0;
	var sum;
	var start;
	var i, j, k;
	var index;
	var partialSum = [];
	var lookaheadsum = [];
	var cutColor;
	
	if (maxWidth == rWidth) {
		cutColor = "r";
		start = vBox.r1;
		
		i = start;
		while (i < vBox.r2 + 1) {
			sum = 0;
			j = vBox.g1;
			while (j < vBox.g2 + 1) {
				k = vBox.b1;
				while (k < vBox.b2 + 1) {
					index = getColorIndex(i, j, k);
					sum += (index in hist) ? hist[index] : 0;
					k++;
				}
				j++;
			}
			i++;
			total += sum
			partialSum.push(total);
		}
	} else if (maxWidth == gWidth) {
		cutColor = "g";
		start = vBox.g1;
		
		i = start;
		while (i < vBox.g2 + 1) {
			sum = 0;
			j = vBox.r1;
			while (j < vBox.r2 + 1) {
				k = vBox.b1;
				while (k < vBox.b2 + 1) {
					index = getColorIndex(j, i, k);
					sum += (index in hist) ? hist[index] : 0;
					k++;
				}
				j++;
			}
			i++;
			total += sum
			partialSum.push(total);
		}
	} else {
		cutColor = "b";
		start = vBox.b1;
		
		i = start;
		while (i < vBox.b2 + 1) {
			sum = 0;
			j = vBox.r1;
			while (j < vBox.r2 + 1) {
				k = vBox.g1;
				while (k < vBox.g2 + 1) {
					index = getColorIndex(j, k, i);
					sum += (index in hist) ? hist[index] : 0;
					k++;
				}
				j++;
			}
			i++;
			total += sum
			partialSum.push(total);
		}
	}
	
	i = 0;
	while (i < partialSum.length) {
		lookaheadsum[i] = total - partialSum[i];
		i++;
	}
	
	var dim1 = cutColor + '1', dim2 = cutColor + '2';
	var dimVal1 = vBox[dim1], dimVal2 = vBox[dim2];
	i = dimVal1;
	while (i < dimVal2 + 1) {
		if (partialSum[i-start] > (total / 2)) {
			var vBox1 = vBox.copy(), vBox2 = vBox.copy();
			var left = i - dimVal1, right = dimVal2 - i;
			var d2;
			if (left <= right) {
				d2 = Math.min.apply(Math, [dimVal2-1, ~~(i+right/2)]);
			} else {
				d2 = Math.max.apply(Math, [dimVal1, ~~(i-1-left/2)]);
			}
			
			while (partialSum[d2-start] == null) {
				d2 += 1;
			}
			
			var count2 = lookaheadsum[d2-start];
			while (count2 == null && partialSum[d2-1] != null) {
				d2--;
				count2 = lookaheadsum[d2-start];
			}
			
			vBox1[dim2] = d2;
			vBox2[dim1] = d2 + 1;
			return [vBox1, vBox2];
		}
		i++;
	}
}

function testImage(imageData) {
	var i = 0;
	var r,g,b;
	var hist = {};
	var index;
	while (i < imageData.length) {
		r = imageData[i] >> rshift;
		g = imageData[i+1] >> rshift;
		b = imageData[i+2] >> rshift;
		index = getColorIndex(r,g,b);
		
		if (!(index in hist)) {
			hist[index] = 0;
		}
		hist[index]++;
		i += 4;
	}
	
	var rMin = 1000000, gMin = 1000000, bMin = 1000000, rMax = 0, gMax = 0, bMax = 0;
	i = 0;
	while (i < imageData.length) {
		r = imageData[i] >> rshift;
		g = imageData[i+1] >> rshift;
		b = imageData[i+2] >> rshift;
		rMin = Math.min(r, rMin);
		gMin = Math.min(g, gMin);
		bMin = Math.min(b, bMin);
		rMax = Math.max(r, rMax);
		gMax = Math.max(g, gMax);
		bMax = Math.max(b, bMax);
		i += 4;
	}
	
	var pQ = new PriorityQueue(x => x.count);
	pQ.push(new VBox(rMin, rMax, gMin, gMax, bMin, bMax, hist));

	function iter(lh, target) {
		var numColors = 1;
		var iter = 0;
		var vBox;
		while (iter < 1000 && numColors < target) {
			vBox = lh.pop();
			if (vBox.count == 0) {
				lh.push(vBox);
				iter++;
				continue;
			}
			
			vBoxes = medianCut(hist, vBox);
			
			lh.push(vBoxes[0]);
			if (vBoxes.length == 2) {
				lh.push(vBoxes[1]);
				numColors++;
			}
			iter++;
		}
	}
	
	iter(pQ, 0.75*maxColors);
	
	var pQ2 = new PriorityQueue(x => x.count * x.volume);
	while (pQ.size() > 0) {
		pQ2.push(pQ.pop());
	}

	iter(pQ2, maxColors-pQ2.size());
	
	var result = "";
	var color;
	var maxAmount = 0;
	var example;
	while (pQ2.size() > 0) {
		color = pQ2.pop().average;
		r = color[0];
		g = color[1];
		b = color[2];
		
		//result += "rgb(" + r + ", " + g + ", " + b + ")<br>";
		for (i in testColors) {
			example = testColors[i];
			if (Math.sqrt(Math.pow(r-example[0],2)+Math.pow(g-example[1],2)+Math.pow(b-example[2],2)) < 20) {
				maxAmount = Math.max(example[3], maxAmount);
			}
		}
	}
	result = maxAmount + " mg/L";
	
	return result;
}

function loadImage(input) {
	if (input.files && input.files[0]) {
		var canvas = document.getElementById("waterImage");
		var ctx = canvas.getContext("2d");
		
		var tempImage = new Image;
		tempImage.src = URL.createObjectURL(input.files[0]);
		tempImage.onload = function(){
			canvas.width = tempImage.width;
			canvas.height = tempImage.height;
			ctx.drawImage(tempImage, 0, 0, tempImage.width, tempImage.height, 0, 0, canvas.width, canvas.height);
			
			var output = document.getElementById("testResult");
			output.innerHTML = testImage(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
			
			var form = document.getElementById("submissionForm");
			form.style.display = "block";
		};
		tempImage.src = URL.createObjectURL(input.files[0]);
	}
}

function submitForm() {
	return false;
}