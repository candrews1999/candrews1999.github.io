// JavaScript Document
		
		//on hover of panel in landing page, change cover brightness
		function fadecover(numPanel) {
			var selectedImg = imgs[numPanel];
			var allPanels = document.querySelectorAll(".panel");
			var selectedPanel = allPanels[numPanel];
			selectedImg.style.opacity = ".8";
			
			//when mouse is no longer hovering, revert opacity
			selectedPanel.onmouseleave = function() {
				console.log("hello");
				selectedImg.style.opacity = "1.0";
			}
		}

		//frame pic on click of any image
		var imgs = document.images;
		var numImgs = document.images.length;
		var blur = document.querySelector(".blur");
		var numImgClicked = 0;
		var selectedImg = imgs[0];
		var selectedImgSrc = selectedImg.src;
		var slideImg = document.querySelector(".slideimg");
		var caption = document.createElement("h4");

		//check keys for switching slideshow slide
		document.addEventListener("keydown", function(event) {
			slideshowkeys(event);
		});

		//helper function for switching slideshow slide by keys
		function slideshowkeys(event) {
			if ((event.code == "ArrowRight") ||(event.code == "39")){
				if (numImgClicked == numImgs - 1) {
					slideshow(0);
				}
				else {
					slideshow(numImgClicked + 1);
				}
			}
			if ((event.code == "ArrowLeft") ||(event.code == "37")){
				if (numImgClicked == 0) {
					slideshow(numImgs - 1);
				}
				else {
					slideshow(numImgClicked - 1);
				}
			}
			
		}
		
		function slideshow(imgNum) {
			//remove the previous image
			slideImg.innerHTML = "";
			blur.style.display = "block";
			numImgClicked = imgNum;
			var projectedImg = document.createElement("img");
			selectedImg = imgs[imgNum];
			selectedImgSrc = selectedImg.src;
			projectedImg.src = selectedImgSrc;
			projectedImg.classList.add("projected");
			slideImg.height = "100vh";
			slideImg.width = "100vw";
			slideImg.appendChild(projectedImg);
			
			//frame projected image to take up optimal space
			
			projectedImg.style.maxWidth = "100vw";
			projectedImg.style.maxHeight = "82vh";

			
//			if (projectedImg.width > projectedImg.height) {
//				if (selectedImg.classList.contains("shrink")) {
//					projectedImg.classList.add("scaledownArt");
//				}
//				else {
//					projectedImg.style.width = "92vw";
//					projectedImg.classList.add("scaleDownWhenTooWide");
//				}
//			}
//			//tall
//			else if (projectedImg.width < projectedImg.height){
//				if (selectedImg.classList.contains("shrinkheight")) {
//					projectedImg.classList.add("scaleDownTallArt");
//				}
//				else {
//					projectedImg.style.height = "72vh";
//				}
//			}
//			//square
//			else {
//				projectedImg.classList.add("scaleDownSquare");
//			}

			projectedImg.style.display = "block";
			projectedImg.style.marginLeft = "auto";
			projectedImg.style.marginRight = "auto";
			
			//switch slide if image is clicked
			imgs[numImgs].onclick = function() {
				if (numImgClicked == numImgs - 1) {
					slideshow(0);
				}
				else {
					slideshow(numImgClicked + 1);
				}
			}
			
			//caption for slideshow
			var correspondingCaption = getCaption(imgNum);
			caption.innerHTML = correspondingCaption;
			blur.appendChild(caption);
			caption.style.top = "0px";
			caption.style.left = "30px";
			caption.style.right = "100px"
			caption.style.position = "absolute";
			caption.style.color = "white";
			caption.style.textShadow = "0px 0px 8px black";	
		}
		
		//onclick of X, close pop up
		var exitBtn = document.querySelector(".close");
		exitBtn.onclick = function() {
			blur.style.display ="none"
		}
		
		//get Caption that corresponds with given captionNum
		function getCaption(captionNum) {
			
			var allCaptions = document.querySelectorAll(".caption");
			return allCaptions[captionNum].innerHTML;
		}
		