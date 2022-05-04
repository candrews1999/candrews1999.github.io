//represents an Era of Disney, with a given eraIndexValue that matches a return value in getEraStartAndEndYear that determines this startYear and endYear 
class Era {
    eraIndexValue
    startYear 
    endYear
    label

    constructor(eraIndexValue) {
        this.eraIndexValue = eraIndexValue;
        let response = getEraStartAndEndYear(eraIndexValue);
        this.startYear = response[0];
        this.endYear = response[1];
        this.label = response[2]
    }
}

//represents a Summary of an Era of Disney, with an Era corresponding to the given eraIndexValue, 
//also calculates averages for fan ratings, critic ratings, and box office earnings in the Era based on given data
class EraSummary {
    eraIndexValue
    era
    averageFanRating
    averageCriticRating
    averageBoxOffice

    constructor(eraIndexValue, data) {
        this.eraIndexValue = eraIndexValue;
        this.era = new Era(eraIndexValue);
        this.averageFanRating = findColumnAverage(data, "FanRating");
        this.averageCriticRating = findColumnAverage(data, "CriticRating");
        this.averageBoxOffice = findColumnAverage(data, "BoxOffice");
    }
}

//read csv then populate visualization and initiate interactivity
d3.csv("./csv/DisneyMovieswithRatingsAndBoxOffice.csv").then(function(data) {

    //set ReleaseDateShortHand field to just the year because month and day data will not be used in this viz
    //set N/A values as 0 (placeholder for NaN values in FanRating, CriticRating, and Box Office data from OMBD)
    //multiply fan rating (#/10) by 10 to get percent
    data.forEach(function(d) {
        //set ReleaseDateShortHand as just the 4 digit year
        d.ReleaseDateShortHand = d.ReleaseDateShortHand.substring(0, 4);

        //if FanRating, CriticRating, and/or BoxOffice is N/A, the assign the cell as 0 for UI purposes
        if (d.FanRating == "N/A") {
            d.FanRating = 0;
        }
        if (d.CriticRating == "N/A") {
            d.CriticRating = 0;
        }
        if (d.BoxOffice == "N/A") {
            d.BoxOffice = 0;
        }

        //multiply FanRating by 10 to get percent (Fan Rating is a number out of 10)
        d.FanRating = d.FanRating * 10;
    });

    /* OVERVIEW CHART SECTION */

    /* Sort Data */

    //create empty list of EraSummary to gather EraSummaries in 
    let listOfEraSummary = [];

    //collect EraSummaries for each Era + the overall Era, adding each to listOfEraSummary that will be used to graph the average data
    for (i=0; i <= 7; i++) {
        //create Era object for current Era index then get currentData in range
        let eraIteration = new Era(i);
        let currentData = getCurrentDataInRange(eraIteration, data);

        //feed currentData and index (i) into EraSummary constructor to get a EraSummaryObject, then push to listOfEraSummary for later
        let currEraSummary = new EraSummary(i, currentData)
        listOfEraSummary.push(currEraSummary);
    }

    //reverse listOfEraSummary
    listOfEraSummary = listOfEraSummary.reverse();

    //create list of average fan ratings, average critic ratings, and average box office proceeds for each Era of Disney
    allAverageFanRatings = [];
    allAverageCriticRatings = [];
    allAverageBoxOffice = [];
    listOfEraSummary.forEach(function(eraSummary) {
        allAverageFanRatings.push(eraSummary.averageFanRating);
        allAverageCriticRatings.push(eraSummary.averageCriticRating);
        allAverageBoxOffice.push(eraSummary.averageBoxOffice);
    });

    //get list of era text to label bars with
    let listOfEraText = getListOfEraText(listOfEraSummary);

    /* Create Chart */

    // margin should not change, so make it a const
    const margin = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    }

    // global svg width and height variables to edit later
    let svgWidth, svgHeight;

    // append the SVGs, but don't assign any attr yet
    const svgBoxOffice = d3.select("#chart-boxoffice").append("svg");
    const svgRating = d3.select("#chart-rating").append("svg");

    //determine min and max of average fan rating, critic rating, and box office earnings
    const boxOfficeMinMax = {
        min: Math.floor(d3.min(allAverageBoxOffice)),
        max: Math.floor(d3.max(allAverageBoxOffice))
    };
    const fanRatingMinMax = {
        min: Math.floor(d3.min(allAverageFanRatings)),
        max: Math.floor(d3.max(allAverageFanRatings))
    };
    const criticRatingMinMax = {
        min: Math.floor(d3.min(allAverageCriticRatings)),
        max: Math.floor(d3.max(allAverageCriticRatings))
    };

    // create xScales (for combined ratings and box office earnings) and only set domain for now, no range yet
    // xscale is the max value across average fan rating + critic for an era, and the max value across average box office proceeds
    let xScaleBoxOffice = d3.scaleLinear().domain([0, Math.floor(boxOfficeMinMax.max)]);
    let xScaleRating = d3.scaleLinear().domain([0, Math.floor(fanRatingMinMax.max) + Math.floor(criticRatingMinMax.max)]);
    let yScale = d3.scaleBand().domain(listOfEraText).padding(0.4);

    //initialize bars for each svg (ratings and box office)
    let boxOfficeBars = svgBoxOffice.selectAll("rect")
        .filter(function(d) { return false}) //filter out previously made bars
        .data(listOfEraSummary, function(d, i){ return listOfEraText[i] + "-BoxOffice"})
        .enter()
        .append("rect")
            .attr("opacity", 0.8)
            .attr("fill", "#3969A9");

    let fanBars = svgRating.selectAll("rect")
        .filter(function(d) { return false}) //filter out previously made bars
        .data(listOfEraSummary, function(d, i){ return listOfEraText[i] + "-Fan"})
        .enter()
        .append("rect")
            .attr("opacity", 0.8)
            .attr("fill", "#3695E7");

    let criticBars = svgRating.selectAll("rect")
        .filter(function(d) { return false}) //filter out previously made bars
        .data(listOfEraSummary, function(d, i){ return listOfEraText[i] + "-Critic"})
        .enter()
        .append("rect")
            .attr("opacity", 0.8)
            .attr("fill", "#3969A9");

    // resize svg width and height for both bar charts and reformat bars and text for new svg dimensions
    // it will fire anytime the browser window is resized
    function updateChartSize() {

        // calculate width and height based on screenWidth and desired dimensions
        svgWidth = window.innerWidth * 0.8;
        svgHeight = window.innerHeight * 0.975;

        //at small window widths, svg takes up more width real estate
        if (window.innerWidth < 1000) {
            svgWidth = window.innerWidth * 0.94;
        }

        //at small window heights, svg takes up more width real estate than just window height
        if (window.innerHeight < 550) {
            svgHeight = window.innerHeight * 1.4;
        }

        // update/set the svg height and width (for rating svg and box office svg) using current width and height values for svg
        svgBoxOffice.attr("width", svgWidth).attr("height", svgHeight);
        svgRating.attr("width", svgWidth).attr("height", svgHeight);
        
        // redefine the pixel range for x and y scales
        xScaleBoxOffice.range([margin.left, svgWidth - margin.right]);
        xScaleRating.range([margin.left, svgWidth - margin.right]);
        yScale.range([svgHeight - margin.bottom, margin.top]);

        // draw each Era's average box office proceeds bar
        boxOfficeBars
            .attr("x", margin.left)
            .attr("y", function (d, i) {
                return yScale(listOfEraText[i]);
            })
            .attr("width", function (d) {

                return xScaleBoxOffice(d.averageBoxOffice) - margin.left;
            })
            .attr("height", yScale.bandwidth());

        // draw each Era's average fan rating bar
        fanBars
            .attr("x", margin.left)
            .attr("y", function (d, i) {
                return yScale(listOfEraText[i]);
            })
            .attr("width", function (d) {

                return xScaleRating(d.averageFanRating) - margin.left;
            })
            .attr("height", yScale.bandwidth());
            
        // draw each Era's average critic rating bar
        criticBars
            .attr("x", function (d) {
                return xScaleRating(d.averageFanRating);
            })
            .attr("y", function (d, i) {
                return yScale(listOfEraText[i]);
            })
            .attr("width", function (d) {
                return xScaleRating(d.averageCriticRating) - margin.left;
            })
            .attr("height", yScale.bandwidth());

        //draw text annotations for each bar
        d3.selectAll("text").remove();
        listOfEraSummary.forEach(function(d, index) {

            //Era Bar Label (for both svg)
            svgBoxOffice.append("text")
                .attr("class","era-bar-label")
                .attr("text-anchor", "start")
                .attr("alignment-baseline", "middle")
                .attr("x", margin.left)
                .attr("y", yScale(listOfEraText[index]) - yScale.bandwidth()/5)
                .attr("opacity", 1.0)
                .text(listOfEraText[index]);
            svgRating.append("text")
                .attr("class","era-bar-label")
                .attr("text-anchor", "start")
                .attr("alignment-baseline", "middle")
                .attr("x", margin.left)
                .attr("y", yScale(listOfEraText[index]) - yScale.bandwidth()/5)
                .attr("opacity", 1.0)
                .text(listOfEraText[index]);

            //Box Office Bar Label
            svgBoxOffice.append("text")
                .attr("class","boxoffice-bar-label-percent")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("x", margin.left + ((xScaleBoxOffice(d.averageBoxOffice)-margin.left)/2))
                .attr("y", yScale(listOfEraText[index]) + window.innerHeight * 0.002)
                .text("$" + Math.floor(d.averageBoxOffice) + " Million");
            svgBoxOffice.append("text")
                .attr("class","boxoffice-bar-label")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("x", margin.left + ((xScaleBoxOffice(d.averageBoxOffice)-margin.left)/2))
                .attr("y", yScale(listOfEraText[index]) + yScale.bandwidth() * 0.65)
                .text("Avg Box Office Earnings");

            //Fan Rating Bar Label
            svgRating.append("text")
                .attr("class","fan-bar-label-percent")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("x", margin.left + ((xScaleRating(d.averageFanRating)-margin.left)/2))
                .attr("y", yScale(listOfEraText[index]) + window.innerHeight * 0.002)
                .text(Math.floor(d.averageFanRating) + "%");
            svgRating.append("text")
                .attr("class","fan-bar-label")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("x", margin.left + ((xScaleRating(d.averageFanRating)-margin.left)/2))
                .attr("y", yScale(listOfEraText[index]) + yScale.bandwidth() * 0.65)
                .text("Avg Fan Score");

            //Critic Rating Bar Label
            svgRating.append("text")
                .attr("class","critic-bar-label-percent")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("x", xScaleRating(d.averageFanRating) + ((xScaleRating(d.averageCriticRating)-margin.left)/2))
                .attr("y", yScale(listOfEraText[index]) + window.innerHeight * 0.002)
                .text(Math.floor(d.averageCriticRating) + "%");
            svgRating.append("text")
                .attr("class","critic-bar-label")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                .attr("x", xScaleRating(d.averageFanRating) + ((xScaleRating(d.averageCriticRating)-margin.left)/2))
                .attr("y", yScale(listOfEraText[index]) + yScale.bandwidth() * 0.65)
                .text("Avg Critic Score");
        });
    }

    // init the chart the first time
    updateChartSize();

    //update chart on resize
    d3.select(window).on("resize", function(e) {
        updateChartSize();
    });


    /* MOVIE POSTER SECTION */

    //set default Era to 0 (Golden Age of Disney) then populate poster-container with era-specific data
    let currentEra = new Era(0);
    setMoviePostersAccordingToEra(currentEra, data);

    //on change of era selector UI element, empty poster container, then update currentEra and reset poster-container with newly selected era-specific data
    d3.select("#era-selector").on("change", function() {
        //empty poster-container
        d3.select("#poster-container").html("");

        //update poster-container
        currentEra = new Era(this.value);
        setMoviePostersAccordingToEra(currentEra, data);
    })

});

//returns the start, end year, and text representation of the era at the given eraValue in the form of a 3 item list 
function getEraStartAndEndYear(eraValue) {
    if (eraValue == 0) {
        return [1937, 1942, "Golden Age"];
    }
    else if (eraValue == 1) {
        return [1943, 1949, "Wartime Era"];
    }
    else if (eraValue == 2) {
        return [1950, 1969, "Silver Age"];
    }
    else if (eraValue == 3) {
        return [1970, 1988, "Bronze Age"];
    }
    else if (eraValue == 4) {
        return [1989, 1998, "Disney Renaissance"];
    }
    else if (eraValue == 5) {
        return [1999, 2009, "Post-Renaissance Era"];
    }
    else if (eraValue == 6) {
        return [2010, 2022, "Revival Era"];
    }
    else if (eraValue == 7) {
        return [1937, 2022, "All Eras"];
    }
}

//returns a list of text to represent each Era of disney movie using each Era object in the given listOfEraSummary
function getListOfEraText(listOfEraSummary) {

    //gather each text representation
    let returnListOfText = [];
    listOfEraSummary.forEach(function(eraSummary){
        returnListOfText.push(eraSummary.era.label + " (" + eraSummary.era.startYear + "-" + eraSummary.era.endYear + ")")
    })
    //return list of text representation
    return returnListOfText;
}

//function that gets movie poster and adds data caption below poster
function addPoster(movieName, year, fanRating, criticRating, boxOffice) {

    //create div to have a set place for the movie poster to populate when its poster is recieved from the movie db (prevents movie posters from being put in wrong ranking slot)
    let currDiv = d3.select("#poster-container").append("div")
        .attr("class", "poster-div");

    //get movie poster from the movie db that matches the movieName and release year
    $.getJSON(
        "https://api.themoviedb.org/3/search/movie?api_key=2b3f4a20e8ba9738f436c83f9111437a" + "&query=" + movieName + "&year=" + year, 
        function(json) { 

            //if no poster results are provided by the Movie DB based on the given movieName and year, then erase currDiv and stop function
            if (json.results.length == 0) {
                currDiv.style("display", "none")
                return false;
            }

            //add poster at first result slot from the Movie DB
            currDiv.append("img")
                .attr("src", "http://image.tmdb.org/t/p/w500/" + json.results[0].poster_path)
                .attr("class", "poster");

            //create and save current rating div that caption text will go in below the image
            let currRatingDiv = currDiv.append("div")
                .attr("class", "poster-rating-div");
            
            //add data labels below the poster as a caption
            currRatingDiv.append("h2")
                .html(ifNaNThenBreakElseSpanFormat(fanRating, "FAN SCORE")
                + ifNaNThenBreakElseSpanFormat(criticRating, "CRITIC SCORE")
                + ifNaNThenBreakElseSpanFormat(year, "RELEASE")
                + ifNaNThenBreakElseSpanFormat(boxOffice, "BOX OFFICE"))
                .attr("class", "poster-rating");
        }
    );

    return true;
}

//populates poster-container with currently selected era-specific data (poster and ratings)
function setMoviePostersAccordingToEra(currentEra, data) {
    
    // filter data by year range of currentEra and save as currentData for later
    let currentData = getCurrentDataInRange(currentEra, data);

    //sort currentData by FanRating
    currentData.sort(function (a, b) { return b.FanRating - a.FanRating; });

    //get and add poster to webpage based on each row of movie data after filtering by era year range
    currentData.forEach(function(d) {

        //get and add poster to webpage with appropriate data
        addPoster(d.Title, d.ReleaseDateShortHand, d.FanRating, d.CriticRating, d.BoxOffice);
    });         
}

// filter data by year range of currentEra and save + return as currentData
function getCurrentDataInRange(currentEra, data) {
    let currentData = data.filter(function(d) {
        let movieYear = d.ReleaseDateShortHand;
        return (movieYear >= currentEra.startYear && movieYear <= currentEra.endYear);
    });

    return currentData;
}

//determines the average for a column matching the given columnName in the given data
function findColumnAverage(data, columnName) {

    //find length of data entries
    let dataLength = data.length;

    //create addedUp variable to keep track of total for column as its rows are added up
    let addedUp = 0;

    //total up each value in the column by adding value to addedUp saved variable
    data.map(function(d) {
        //get current value and add to addedUp
        let currValue = +d[`${columnName}`];
        addedUp = addedUp + currValue;

        //subtract 1 from length if value is 0 (0 is the NaN placeholder for Critic Score, Fan Score, and Box Office values) as NaNs should not be apart of length total in the average calculation
        if (currValue == 0) {
            dataLength = dataLength - 1;
        }
    });

    //return average for column (sum/length)
    return addedUp/dataLength;
}

//formats value into html code for poster caption based on given label, however if value is N/A then return placeholder
function ifNaNThenBreakElseSpanFormat(value, label) {
    //if value is 0 (the assigned N/A placeholder for fan score, critic score, and box office) and label is not "FAN SCORE" then return line break span as a visual placeholder
    if (value == 0 && label != "FAN SCORE") {
        return "<span class='hide-text'><br>" + "<span class='poster-rating-label hide-text'>NAN </span>" + (value) + "</span>";
    }
    //if value is 0 (the assigned N/A placeholder for fan score, critic score, and box office) and label is "FAN SCORE" then return visual placeholder with no line break because fan score is first in the currRatingDiv
    else if (value == 0 && label == "FAN SCORE") {
        return "<span class='hide-text'>" + "<span class='poster-rating-label hide-text'>NAN </span>" + (value) + "</span>";
    }
    //else value is not N/A so return formatted html for value (based on the label requested)
    else {
        if (label == "FAN SCORE") {
            return "<span>" + "<span class='poster-rating-label fan-score-label'>FAN SCORE </span>" + (value) + "%" + "</span>";
        }
        else if (label == "CRITIC SCORE") {
            return "<span><br>" +"<span class='poster-rating-label'>CRITIC SCORE </span>" + (value) + "%" + "</span>";
        }
        else if (label == "RELEASE") {
            return "<span><br>" + "<span class='poster-rating-label'>RELEASE </span>" + (value) + "</span>";
        }
        else if (label == "BOX OFFICE") {
            return "<span><br>" + "<span class='poster-rating-label'>BOX OFFICE </span>" + "$" + (value) + " M" + "</span>";
        }
    }
}