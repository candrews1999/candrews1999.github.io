// JavaScript Document

//ease in nav background at top of page
onscroll = (event) => { 
	//no background when user is at less than 20 y pixels scrolled
	if (window.scrollY < 87) {
		d3.select("#nav-bar")
		.transition()
		.duration(100)
		.delay(0)
		.ease(d3.easeLinear)
		.style("background-color", "rgb(255, 255, 255, 0.0)")
		.style("-webkit-backdrop-filter", "blur(0px")
		.style("backdrop-filter", "blur(0px)")
	}
	else {
		d3.select("#nav-bar")
			.transition()
			.duration(100)
			.delay(0)
			.ease(d3.easeLinear)
			.style("background-color", "rgb(255, 255, 255, 0.8)")
			.style("-webkit-backdrop-filter", "blur(13px")
			.style("backdrop-filter", "blur(13px)");
	}
};

function setPageColor(backgroundColor, h1Color, h2Color) {

	//set h1 and h4, and text-accent-color as given h1Color
	d3.selectAll("h1").style("color", h1Color);
	d3.selectAll("h4").style("color", h1Color);
	d3.selectAll(".text-accent-color")
		.style("color", h1Color)
		.style("font-weight", "650");
	d3.selectAll("button")
		.style("border", `2.5px solid ${h1Color}`)
		.style("color", h1Color);

	// set button colors to same as h1
	d3.selectAll("button")
		.on("mouseover", function() {
			d3.select(this)
				.style("background-color", h1Color)
				.style("color", "white");
		})
		.on("mouseout", function() {
			d3.select(this)
				.style("background-color", "transparent")
				.style("border", `2.5px solid ${h1Color}`)
				.style("color", h1Color);
		});

	//set h2 and text-accent-color as given h2Color
	d3.selectAll("h2")
		.style("color", h2Color);
	d3.selectAll(".text-accent-color2")
		.style("color", h2Color)
		.style("font-weight", "900");


	//set accent backgraound color
	d3.selectAll(".background-color").style("background-color", backgroundColor);
}


//FOR LATER: FIND OUT WHY CLOUDS ARE NOT ADDING NEW CLOUD THEN MOVING OLD CLOUD ACROSS SCREEN AND DELETING
//represents a Cloud
class Cloud {
	circles
	radiusSize
	speed
	height
}

//represents a circle
class CloudCircle {
	cx
	cy
	id
	radiusSize
	speed

	constructor(cx, cy, id, radiusSize, speed, placementCoefficent) {
		this.cx = cx;
		this.cy = cy;
		this.id = id;
		this.radiusSize = radiusSize;
		this.speed = speed;
		this.placementCoefficent = placementCoefficent;
	}
}

//draw moving clouds animation
function drawMovingCloudsOnSplash(id, delay, color) {

	//start from scratch on resize
	d3.select(window).on("resize", function(e) {
		//reload page on window resize IN THE FUTURE FIGURE OUT HOW TO UNSET TIMERS
		location.reload();
		// d3.selectAll("svg").remove();
		// drawMovingCloudsOnSplash(id, delay, color);
	});

	// append the SVGs, but don't assign any attr yet
	const svg = d3.select(id).append("svg");

	//initialize svg dimensions based on current window size
	let svgWidth;
	let svgHeight;
	svgWidth = window.innerWidth * 1.0;
	svgHeight = window.innerHeight * 1.0;

	//create index variable;
	let index = 0;

	//Generate Cloud data object
	function generateCloud() {
		//Create New Cloud
		cloudData = new Cloud();

		//initialize variables
		let randomCloudSpeed;
		let randomCloudRadius;
		let randomCloudHeight;

		//generate new cloud random values for unique cloud based on screen dimensions
		if (window.innerWidth > 1050) {
			let baseSpeed = svgWidth * 14;
			let baseRadius = svgWidth / 22;
			randomCloudSpeed = Math.random() * 4000 + baseSpeed; 
			randomCloudRadius = Math.random() * ((2 * svgWidth)/22) + baseRadius; 
			randomCloudHeight = Math.random() * ((3.5 * svgHeight)/7) + (svgHeight * 1.2)/4; 
		}
		else if (window.innerWidth > 650 && window.innerWidth < 1050){
			let baseSpeed = svgWidth * 16;
			let baseRadius = svgWidth / 17;
			randomCloudSpeed = Math.random() * 4000 + baseSpeed; 
			randomCloudRadius = Math.random() * ((2 * svgWidth)/16) + baseRadius; 
			randomCloudHeight = Math.random() * ((3.5 * svgHeight)/7) + (svgHeight * 1.2)/4; 
		}
		else {
			let baseSpeed = svgWidth * 18;
			let baseRadius = svgWidth / 12;
			randomCloudSpeed = Math.random() * 4000 + baseSpeed; 
			randomCloudRadius = Math.random() * ((2 * svgWidth)/10) + baseRadius; 
			randomCloudHeight = Math.random() * ((3.5 * svgHeight)/7) + (svgHeight * 1.2)/4; 
		}

		//save current cloud radius, speed and height;
		cloudData.radiusSize = randomCloudRadius;
		cloudData.speed = randomCloudSpeed;
		cloudData.height = randomCloudHeight;

		//empty list to keeping record of circles with
		let circles = []

		//bottom left
		circles.push(
			new CloudCircle(svgWidth + (cloudData.radiusSize * 1.25), cloudData.height, "bottom1-" + index, cloudData.radiusSize, cloudData.speed, 1)
		);

		//top left
		circles.push(
			new CloudCircle(svgWidth + 1.5 * (cloudData.radiusSize * 1.25), cloudData.height - cloudData.radiusSize * .825, "top1-" + index, cloudData.radiusSize, cloudData.speed, 1.5)
		);

		//bottom middle
		circles.push(
			new CloudCircle(svgWidth + 2 * (cloudData.radiusSize * 1.25), cloudData.height, "bottom2-" + index, cloudData.radiusSize, cloudData.speed, 2)
		);

		//top right
		circles.push(
			new CloudCircle(svgWidth + 2.5 * (cloudData.radiusSize * 1.25), cloudData.height - cloudData.radiusSize * .825, "top2-" + index, cloudData.radiusSize, cloudData.speed, 2.5)
		);

		//bottom right
		circles.push(
			new CloudCircle(svgWidth + 3 * (cloudData.radiusSize * 1.25), cloudData.height, "bottom3-" + index, cloudData.radiusSize, cloudData.speed, 3)
		);

		//add one to index
		index = index + 1;

		//save circles list
		cloudData.circles = circles;

		return cloudData;
	}

	//after cloud is made, have it travel off screen and make a new cloud
	function updateChart() {

		//set svg dimensions based on current window size
		svgWidth = window.innerWidth * 1.0;
        svgHeight = window.innerHeight * 1.0;

		// update/set the svg height and width using current width and height values for svg
		svg.attr("width", svgWidth).attr("height", svgHeight);

		//generate new Cloud
		let cloudData = generateCloud();

		//Get all circles and assign id as identifier
		let drawnCloud = svg.selectAll("circle")
			.data(cloudData.circles, function(d) {return d.id; });

		//Add new cloud data
		drawnCloud.enter()
			.append("circle")
			.transition()
			.duration(0)
			.delay(cloudData.speed)
			.ease(d3.easeLinear)
				.attr("cx", function(d) { return d.cx; })
				.attr("cy", function(d) { return d.cy; })
				.attr("r", function(d) { return d.radiusSize; })
				.attr("fill", function(d) { return color; });

		//remove old cloud data after it travels off screen to the left
		drawnCloud.exit()
			.attr("class", "circle-remove" + color.substring(1))
			.transition()
			.duration(cloudData.speed)
			.delay(0)
			.ease(d3.easeLinear)
			.attr("cx", function(d){ 
				return -svgWidth + d.cx - d.radiusSize * 5 ;
			})
			.on("end", function(d) {
				//remove all old cloud circles by selecting all circles with circle-remove and the corresponding color
				//the usual .remove() didn't work with this on end function so i had to manually remove the correct circles
				d3.selectAll(".circle-remove" + color.substring(1)).remove()

				//after last circle of old cloud is removed, update chart
				if (d.id.substring(0, 7) == "bottom3") {
					updateChart()
				}
			})
	}

	//set svg dimensions based on current window size
	svgWidth = window.innerWidth * 1.0;
	svgHeight = window.innerHeight * 1.0;

	// update/set the svg height and width using current width and height values for svg
	svg.attr("width", svgWidth).attr("height", svgHeight);

	//generate new Cloud to start with and it is saved in global variable
	generateCloud();

	//draw first cloud (off screen to right)
	let firstDrawnCloud = svg.selectAll("circle")
		.data(cloudData.circles, function(d) {return d.id})
		.enter()
		.append("circle")
			.attr("cx", function(d) { return d.cx; })
			.attr("cy", function(d) { return d.cy; })
			.attr("r", cloudData.radiusSize)
			.attr("fill", color);

	// init the chart the first time to move the inital cloud and then make a new cloud, delay for given amount of time
	setTimeout(function() {
		updateChart();
	}, 
	delay
	);
}