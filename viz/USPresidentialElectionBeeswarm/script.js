//represents a presidential election year with a list of candidateOptions and election year
class ElectionYear{
    electionYear
    candidateOptions

    constructor(electionYear) {
        this.electionYear = electionYear;
        this.candidateOptions = [];
    }
}

//represents a valid candidate for a specific election year with a electionYear, candidate, party, list of votesByState, yearCandidateCode (for id matching), nationwide votes for the candidate, and place
class CandidateOption {
    electionYear
    candidate
    party
    votesByState
    yearCandidateCode
    nationwideVotes
    place 

    constructor(electionYear, candidate, party) {
        this.electionYear = electionYear;
        this.candidate = candidate;
        this.party = party;
        this.place = null;
        this.votesByState = []; 
        this.yearCandidateCode = electionYear + " " + candidate;
        this.nationwideVotes = 0;
    }
}

//represents a state's vote for a candidate with a candidate vote total, overall state vote total, state PO, stateFullName, electionYear, candidate, party, candidatePartyElectionYearCode (for id matching), and place
class StateVote {
    totalStateVotes
    totalStateCandidateVotes
    statePO
    stateFullName
    electionYear
    candidate
    party
    candidatePartyElectionYearCode
    place

    constructor(totalStateVotes, totalStateCandidateVotes, statePO, stateFullName, electionYear, candidate, party) {
        this.totalStateVotes = totalStateVotes;
        this.totalStateCandidateVotes = totalStateCandidateVotes; 
        this.statePO = statePO;
        this.stateFullName = stateFullName;
        this.electionYear = electionYear;
        this.candidate = candidate;
        this.party = party;
        this.candidatePartyElectionYearCode = candidate + " " + party + " " + electionYear;
        this.place = null;
    }
}

//map for election years, allCandidateOptions, and unique Parties: these are global variables for ease of use
let electionYears = new Map();
let allCandidateOptions = new Map();
let uniqueParties = [];

//global variable for currentElectionIndex, set to null for now
let currentElectionIndex = null;

let prevMobileOrDesktop = null;

/* 
PRE-PROCESSING THE DATA
Only keep dataset columns that are used
*/

//parses CSV to rename columns as specified below and fix mistakes in row entries
function parseCsv(d) {

    //fix backwards Romney, Mitt candidate fields in csv 
    if (d.candidate == "MITT, ROMNEY") {
        d.candidate = "ROMNEY, MITT";
    }

    //rename party fields that are blank to "UNKNOWN"
    if (d.party_detailed == "") {
        d.party_detailed = "UNKNOWN";
    }

    //rename columns as the following names and make number based columns (vote totals) into Numbers data type
    return {
        electionYear: d.year,
        stateFullName: d.state,
        statePO: d.state_po,
        office: d.office,
        candidate: d.candidate,
        party: d.party_detailed,
        writeIn: d.writein,
        totalStateCandidateVotes: +d.candidatevotes,
        totalStateVotes: +d.totalvotes,
    }
}

//load CSV then parse, then sort rows into multi-level data structure, create svg + scales, draw 1976 ElectionYear (0-index) as first state, and set OnClick for Next and Prev Buttons to initialize visualization update
d3.csv("./csv/1976-2020-president.csv", parseCsv).then(function(data) {


    /*
    SORT DATA IN ELECTIONYEARS DATA STRUCTURE WITH AN INTERNAL HEIRARCHY OF ElectionYear > CandidateOption > StateVote
    */
    
    //filter out rows that have no candidate name or that are writeIns
    data = data.filter(function(d) {
        return !d.writeIn || d.candidate !== "";
    })

    //sort each row into StateVote objects and place those StateVotes into the appropriate CandidateOption
    data.forEach(function (d) {
        //sort row into StateVote objects
        let currStateVote = new StateVote(d.totalStateVotes, d.totalStateCandidateVotes, d.statePO, d.stateFullName, d.electionYear, d.candidate, d.party)

        //determine if CandidateOption has already been created based on yearCandidateCode key
        let currYearCandidateCode = d.electionYear + " " + d.candidate;
        //if CandidateOption has been already made, then add currStateVote to the CandidateOption's votesByState list
        if (allCandidateOptions.has(currYearCandidateCode)) {
            let prevCandidateOption = allCandidateOptions.get(currYearCandidateCode);
            //add state vote count from row to CandiateOption's total votes
            prevCandidateOption.nationwideVotes = prevCandidateOption.nationwideVotes + d.totalStateCandidateVotes;
            prevCandidateOption.votesByState.push(currStateVote);
        }
        //if no CandidateOption has been already made, then create a new CandidateOption object and add currStateVote to it, then add new CandidateOption to allCandidateOptions
        else {
            let newCandidateOption = new CandidateOption(d.electionYear, d.candidate, d.party);
            newCandidateOption.votesByState.push(currStateVote);
            //add state vote count from row to CandiateOption's total nationwide votes
            newCandidateOption.nationwideVotes = d.totalStateCandidateVotes;
            allCandidateOptions.set(currYearCandidateCode, newCandidateOption);
        }
    });

    //sort each object in allCandidateOptions into ElectionYear Objects
    allCandidateOptions.forEach(function (candidateOption) {
        let currElectionYearString = candidateOption.electionYear;

        //if ElectionYear has already been made, then add CandidateOption to its candidate options field
        if (electionYears.has(currElectionYearString)) {
            let currElectionYearObject = electionYears.get(currElectionYearString);
            currElectionYearObject.candidateOptions.push(candidateOption);
        }
        //else if ElectionYear has not been made, then add current CandidateOption to new ElectionYear object, then add new ElectionYear to electionYears
        else {
            let newElectionYearObj = new ElectionYear(currElectionYearString);
            newElectionYearObj.candidateOptions.push(candidateOption);
            electionYears.set(currElectionYearString, newElectionYearObj);
        }
    });

    //sort CandidateOptions within each ElectionYear in electionYears from greatest to least and slice off top 4 CandidateOptions
    electionYears.forEach(function (electionYear) {
        electionYear.candidateOptions.sort(function (a, b) { return b.nationwideVotes - a.nationwideVotes; })
        electionYear.candidateOptions = electionYear.candidateOptions.slice(0, 4);
    });

    //set places for each CandidateOption and its internal stateVotes after sorting from greatest to least
    electionYears.forEach(function (electionYear) {
        let place = 1;
        electionYear.candidateOptions.forEach(function (candidateOption) {
            //set place for CandidateOption
            candidateOption.place = place;
            //set place for its internal StateVotes
            candidateOption.votesByState.forEach(function (stateVote) {
                stateVote.place = place;
            });
            place = place + 1;
        })
        place = 1;
    });

    //get unique parties for fillscale
    const partyColumn = d3.map(data, function(d){ return d.party;});
    uniqueParties = partyColumn.filter(function(d, i) {
        return partyColumn.indexOf(d) == i;
    }); 


    /*
    DEFINE DIMENSIONS OF SVG + CREATE SVG CANVAS
    */

    //desktop canvas sizing variables and their subsequent chart
    let width = 1300;
    let height = 700;
    let margin = {top: 370, left: 200, right: 200, bottom: 100};

    let chart = d3.select("#chart");
    let svg = chart
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr('class', "desktop-SVG");

    //mobile canvas sizing variables and their subsequent chart
    let mobileWidth = 825;
    let mobileHeight = 825;
    let mobileMargin = {top: 300, left: 425, right: 500, bottom: 200};

    let mobileSVG = chart
        .append("svg")
        .attr("viewBox", `0 0 ${mobileWidth} ${mobileHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr('class', "mobile-SVG");

    //initialize desktop or mobile svg based on screen size
    toggleDesktopOrMobileSVG(svg, mobileSVG);


    /*
    CREATE SCALES
    */

    //determine min and max of votes Per Candidate per state across all presidential elections 1976-2020
    const minMaxVotesPerStatePerCandidate = {
        min: d3.min(data, function(d) { return +d.totalStateCandidateVotes; }),
        max: d3.max(data, function(d) { return +d.totalStateCandidateVotes; })
    };

    //scales for placing circles on 4x4 grid for Desktop svg
    const xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([margin.left, width-margin.right]);
    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height-margin.bottom, margin.top]);

    //scales for placing circles on 4x4 grid for Mobile svg
    const mobileXScale = d3.scaleLinear()
        .domain([0, 1])
        .range([mobileMargin.left, mobileWidth-mobileMargin.right]);
    const mobileYScale = d3.scaleLinear()
        .domain([0, 1])
        .range([mobileHeight-mobileMargin.bottom, mobileMargin.top]);

    //swap red and orange so republican party (index 2 in unique parties) is colored in red 
    orange = d3.schemeTableau10[1];
    red = d3.schemeTableau10[2];
    d3.schemeTableau10[1] = red;
    d3.schemeTableau10[2] = orange;

    //fill scale for coloring circles in a distinct color representing each party
    const fillScale = d3.scaleOrdinal()
        .domain(uniqueParties)
        .range(d3.schemeTableau10);

    //size radius according to the votes a candidate got from a particular state party subsection
    const rScale = d3.scaleSqrt()
        .domain([minMaxVotesPerStatePerCandidate.min, minMaxVotesPerStatePerCandidate.max])
        .range([6,45]);

    //size strokeWidth according to the votes a candidate got from a particular state party subsection
    const strokeWidthScale = d3.scaleSqrt()
        .domain([minMaxVotesPerStatePerCandidate.min, minMaxVotesPerStatePerCandidate.max])
        .range([3,8]);


    /*
    UPDATE VISUALIZATION TO 1976 ELECTION YEAR STARTING POINT AUTOMATICALLY (at index 0 in ElectionYears master map)
    */

    //set currentElectionIndex to 0 to begin the visualization
    currentElectionYearIndex = 0;
    
    //update visualization to first state, the 0-index 1976 election
    updateVisualization(xScale, yScale, mobileXScale, mobileYScale, rScale, fillScale, strokeWidthScale, width, height, mobileWidth, mobileHeight, svg, mobileSVG);


    /*
    ADD ON-CLICK EVENT LISTENERS TO UPDATE VISUALIZATION ON CLICK OF NEXT OR PREV
    */

    //get next and prev btns in control panel
    let prevBtn = d3.select("#prev");
    let nextBtn = d3.select("#next");

    //set event listener to change visualization on click of prev, after subtracting 1 from currentElectionYearIndex
    prevBtn.on("click", function() {
        currentElectionYearIndex = (currentElectionYearIndex - 1).mod(electionYears.size);
        updateVisualization(xScale, yScale, mobileXScale, mobileYScale, rScale, fillScale, strokeWidthScale, width, height, mobileWidth, mobileHeight, svg, mobileSVG)
    });

    //set event listener to change visualization on click of next, after adding 1 to currentElectionYearIndex
    nextBtn.on("click", function() {
        currentElectionYearIndex = (currentElectionYearIndex + 1).mod(electionYears.size);
        updateVisualization(xScale, yScale, mobileXScale, mobileYScale, rScale, fillScale, strokeWidthScale, width, height, mobileWidth, mobileHeight, svg, mobileSVG)
    });
});


//updates visualization on given svgs, based on given scales, svg widths and heights, and currentElectionYearIndex global variable
function updateVisualization(xScale, yScale, mobileXScale, mobileYScale, rScale, fillScale, strokeWidthScale, width, height, mobileWidth, mobileHeight, svg, mobileSVG) {

    /*
    GET CURRENT, NEXT, AND PREVIOUS YEAR INDICES + UNWRAP THE CURRENT ELECTIONYEAR INTO A LIST OF STATEVOTES 
    */

    //get next, and previous year indices
    let nextElectionYearIndex = (currentElectionYearIndex + 1).mod(electionYears.size);
    let prevElectionYearIndex = (currentElectionYearIndex - 1).mod(electionYears.size);

    //get a list of the values from electionYears compiled list of ElectionYear from 1976-2020
    let currElectionYear = Array.from(electionYears.values())[(currentElectionYearIndex).mod(electionYears.size)];
    //will hold list of StateVotes compiled from three level datastructure
    let currYearStateVotes = []

    //add each StateVote within each CandidateOption for the current year to currYearStateVotes
    for (let candidateOption of (currElectionYear.candidateOptions)) {
        for (let stateVote of (candidateOption.votesByState)) {
            currYearStateVotes.push(stateVote);
        }
    }


    /*
    INPUT CURRENT ELECTION YEAR STATEVOTES INTO FORCE SIMULATIONS
    */

    //initialize force simulation to organize currYearStateVotes into clusters of circles representing the votes for top 4 candidate DESKTOP SVG
    var simulation = d3.forceSimulation(currYearStateVotes, function(d){ return d.candidatePartyElectionYearCode})
        .force('center', d3.forceCenter(width / 2, (height/5) *2.8))
        .force('x', d3.forceX().x(function (d) {
            return xScale(placeToCoordXOrY("x", d.place));
        }).strength(0.4))
        .force('y', d3.forceY().y(function (d) {
            return yScale(placeToCoordXOrY("y", d.place));
        }).strength(0.4))
        .force('collision', d3.forceCollide().radius(function (d) { // prevent circle overlap when collide
            return rScale(d.totalStateCandidateVotes) + 1;
        }).strength(0.8))
        .force('charge', d3.forceManyBody().strength(-10)) // send nodes away from eachother
        .on('tick', ticked);

    // initialize force simulation to organize currYearStateVotes into clusters of circles representing the votes for top 4 candidate MOBILE SVG 
    var simulationMobile = d3.forceSimulation(currYearStateVotes, function(d){ return d.candidatePartyElectionYearCode})
        .force('center', d3.forceCenter(mobileWidth / 2, (mobileHeight/5) *2.8))
        .force('x', d3.forceX().x(function (d) {
            return mobileXScale(placeToCoordXOrY("x", d.place));
        }).strength(0.4))
        .force('y', d3.forceY().y(function (d) {
            return mobileYScale(placeToCoordXOrY("y", d.place));
        }).strength(0.4))
        .force('collision', d3.forceCollide().radius(function (d) { // prevent circle overlap when collide
            return rScale(d.totalStateCandidateVotes) + 1;
        }).strength(0.8))
        .force('charge', d3.forceManyBody().strength(-10)) // send nodes away from eachother
        .on('tick', tickedMobile);


    /*
    DRAW TOOLTIP AND CIRCLES
    */  
    //create tooltip div
    const tooltip = d3.select("#chart")
        .append("div")
        .style("visibility", "hidden");

    //intialize sizing variables to proportionally place tooltip for Desktop
    let tw = svg.node().clientWidth;
    let th = svg.node().clientHeight;
    let sx = tw / width;
    let sy = th / height;

    //intialize sizing variables to proportionally place tooltip for Mobile
    let twMobile = mobileSVG.node().clientWidth;
    let thMobile = mobileSVG.node().clientHeight;
    let sxMobile = twMobile / mobileWidth;
    let syMobile = thMobile / mobileHeight;

    //update svg (mobile vs desktop) being shown based on new screen size after resize, then update sizing variables on window resize to proportionally place tooltip
    d3.select(window).on("resize", function(e) {
        //toggle between desktop and mobile svg canvases being visible based on window size adjusted to in resize event
        toggleDesktopOrMobileSVG(svg, mobileSVG);

        //Desktop sizing variable updates
        tw = svg.node().clientWidth;
        th = svg.node().clientHeight;
        sx = tw / width;
        sy = th / height;

        //Mobile sizing variable updates
        twMobile = mobileSVG.node().clientWidth;
        thMobile = mobileSVG.node().clientHeight;
        sxMobile = twMobile / mobileWidth;
        syMobile = thMobile / mobileHeight;
    })

    // draws circles representing a StateVote for a candidate from a particular party, then initalizes a tooltip that provides the necessary information about a StateVote circle representation when hovered
    // Pertains to circles drawn on desktop svg canvas
    function ticked() {

        //draws circles based on its data's current positioning
        // var drawnStateVoteCircleRepresentationsDesktop = drawCircles(svg, currYearStateVotes, fillScale, rScale);
        drawnStateVoteCircleRepresentationsDesktop = drawCircles(svg, currYearStateVotes, fillScale, rScale);

        //on mouse over of a circle within the given drawnStateVoteCircleRepresentations, set the given tooltip div's information and positioning (based on if it lies on the left or right of the canvas)
        drawnStateVoteCircleRepresentationsDesktop.on("mouseover", function(event, d) {
            //get cx and cy positioning of the click and variables that will be used to set tooltip div according to screen width
            const tooltipOffsetX = 1;
            const tooltipOffsetY = 1;
            let cx = sx*(+d3.select(this).attr("cx"));
            let cy = sy*(+d3.select(this).attr("cy"));
            const toolTipPositions = ["left", "right"];
            let toolTipPosIndex = 0;
            let notToolTipPosIndex = 1;
    
            //rightside of svg canvas, show on left of circle
            if (cx > (tw / 2)) {
                toolTipPosIndex = 1;
                notToolTipPosIndex = 0;
                tooltip.attr("class", "tooltip-right");
                cx = tw - cx + (tooltipOffsetX * 1.1);
                cy = cy + (tooltipOffsetY * 1.1);
            }
            //leftside of svg canvas, show on right of circle
            else {
                tooltip.attr("class", "tooltip-left");
                cx = cx + tooltipOffsetX;
                cy = cy + tooltipOffsetY;
            }
    
            //format numbers appearing in tooltip with Commmas
            let formattedTotalStateCandidateVotes = formatWithCommaSeperators(d.totalStateCandidateVotes);
    
            //get rid of nicknames at end of candidate names to avoid overly wide tooltips
            formatStringWithoutNickname(d.candidate); 
    
            //place tooltip at a pixel location on the canvas, inject information about the StateVote hovered, and make tooltip visible
            tooltip.style("visibility", "visible")
                .style(toolTipPositions[toolTipPosIndex], `${cx}px`)
                .style(toolTipPositions[notToolTipPosIndex], "")
                .style("top", `${cy}px`)
                .html(`<span style="font-size: 21px"><span style="font-weight: 700;">${formattedCandidateName}</span> <span style="font-size:17px;font-weight:600;">${d.statePO} </span></span>
                <br><span class="smallcaps">PARTY: </span>${d.party}
                <br><span class="smallcaps">STATE VOTES: </span>${formattedTotalStateCandidateVotes}`)
    
            //make hovered over circle have a outline and bring it to the front of svg for appearance (using z-index)
            d3.select(this).attr("opacity", 1.0)
                .attr("stroke", "rgba(97, 97, 97, 0.975")
                .attr("stroke-width", function() {
                    return strokeWidthScale(d.totalStateCandidateVotes);
                })
                .attr("cursor", "pointer")
                .attr("z-index", 5);
            
        })
        //on mouseout reset hide tooltip and reset hovered circle
        .on("mouseout", function() {
    
            //hide tooltip on mouse out
            tooltip.style("visibility", "hidden");
    
            //remove stroke around circle 
            d3.select(this).attr("cursor", "default")
                .attr("stroke-width", 0)
                .attr("z-index", "initial")
                .attr("opacity", 0.85);
        });
    }

    //draws circles representing a StateVote for a candidate from a particular party, then initalizes a tooltip that provides the necessary information about a StateVote circle representation when hovered
    //Pertains to circles drawn on mobile svg canvas
    function tickedMobile() {

        //draws circles based on its data's current positioning
        var drawnStateVoteCircleRepresentationsMobile = drawCircles(mobileSVG, currYearStateVotes, fillScale, rScale);

        //on mouse over of a circle within the given drawnStateVoteCircleRepresentations, set the given tooltip div's information and positioning (based on if it lies on the left or right of the canvas)
        drawnStateVoteCircleRepresentationsMobile.on("mouseover", function(event, d) {

            //get cx and cy positioning of the click and variables that will be used to set tooltip div according to screen width
            const tooltipOffsetX = 1;
            const tooltipOffsetY = 1;
            let cx = sxMobile*(+d3.select(this).attr("cx"));
            let cy = syMobile*(+d3.select(this).attr("cy"));
            const toolTipPositions = ["left", "right"];
            let toolTipPosIndex = 0;
            let notToolTipPosIndex = 1;
    
            //rightside of svg canvas, show on left of circle
            if (cx > (twMobile / 2)) {
                toolTipPosIndex = 1;
                notToolTipPosIndex = 0;
                tooltip.attr("class", "tooltip-right");
                cx = twMobile - cx + (tooltipOffsetX * 1.1);
                cy = cy + (tooltipOffsetY * 1.1);
            }
            //leftside of svg canvas, show on right of circle
            else {
                tooltip.attr("class", "tooltip-left");
                cx = cx + tooltipOffsetX;
                cy = cy + tooltipOffsetY;
            }

            //format numbers appearing in tooltip with Commmas
            let formattedTotalStateCandidateVotes = formatWithCommaSeperators(d.totalStateCandidateVotes);
    
            //get rid of nicknames at end of candidate names to avoid overly wide tooltips
            formatStringWithoutNickname(d.candidate); 
    
            //place tooltip at a pixel location on the canvas, inject information about the StateVote hovered, and make tooltip visible
            tooltip.style("visibility", "visible")
                .style(toolTipPositions[toolTipPosIndex], `${cx}px`)
                .style(toolTipPositions[notToolTipPosIndex], "")
                .style("top", `${cy}px`)
                .html(`<span style="font-size: 21px"><span style="font-weight: 700;">${formattedCandidateName}</span> <span style="font-size:17px;font-weight:600;">${d.statePO} </span></span>
                <br><span class="smallcaps">PARTY: </span>${d.party}
                <br><span class="smallcaps">STATE VOTES: </span>${formattedTotalStateCandidateVotes}`)
    
            //make hovered over circle have a outline and bring it to the front of svg for appearance (using z-index)
            d3.select(this)
                .attr("opacity", 1.0)
                .attr("stroke", "rgba(97, 97, 97, 0.975")
                .attr("stroke-width", function() {
                    return strokeWidthScale(d.totalStateCandidateVotes);
                })
                .attr("cursor", "pointer")
                .attr("z-index", 5);
        })
        //on mouseout reset hide tooltip and reset hovered circle
        .on("mouseout", function() {
    
            //hide tooltip on mouse out
            tooltip.style("visibility", "hidden");
    
            //remove stroke around circle 
            d3.select(this).attr("cursor", "default")
                .attr("opacity", 0.85)
                .attr("stroke-width", 0)
                .attr("z-index", "initial");
        });  
    }


    /*
    SET CORNER ANNOTATIONS THAT DISPLAY TOP FOUR CANDIDATES
    */  
    setTopFourCandidateAnnotations(currElectionYear, fillScale);

    /*
    SET CONTROL PANEL WITH CURRENT, NEXT, AND PREV YEARS
    */  
    setControlPanel(currentElectionYearIndex, prevElectionYearIndex, nextElectionYearIndex);
}


//draws circles on given svgCanvas based on the given list of StateVotes from the current year, as well as the provided scales
function drawCircles(svgCanvas, currYearStateVotes, fillScale, rScale) {
    //draws State Vote circles based on its data's current positioning
    var stateVoteCircleRepresentations = svgCanvas
        .selectAll('circle')
        .data(currYearStateVotes)
        .join('circle')
            .attr('fill', function (d) {
                return fillScale(d.party);
            })
            .attr("pointer-events", "all")
            .attr('r', function (d) {
                return rScale(d.totalStateCandidateVotes);
            })
            .attr('cx', function (d) {
                return d.x;
            })
            .attr('cy', function (d) {
                return d.y
            })
            .attr("opacity", 0.85
            );

    //return StateVote circles for access to the circles that were just drawn
    return stateVoteCircleRepresentations;
}


//toggle between desktop and mobile svg based on window width to optimize for mobile and desktop views
function toggleDesktopOrMobileSVG(svg, mobileSVG) {
    //desktop svg active for window widths greater than 950
    if (window.innerWidth > 950) {
        svg.style("display", "initial");
        mobileSVG.style("display", "none");
    }
    //else if window width is less than 950 and window height is less than 450 then desktop svg should be active
    else if (window.innerWidth < 950 && window.innerHeight < 450) {
        svg.style("display", "initial");
        mobileSVG.style("display", "none");
    }
    //mobile svg active for window widths less than 950 with heights greater than or equal to 450
    else {
        mobileSVG.style("display", "initial");
        svg.style("display", "none");
    }
}


//returns the coord destination for a StateVote based on its candidate's place in the election, provides either a x or y coord based on the given xOrY
function placeToCoordXOrY(xOrY, place) {
    //Intended layout of places on screen: top left-1st (0,1), top right-2nd (1,1), bottom left-3rd (0,0), and bottom right-4th(1,0)
    //if asking for an x coord
    if (xOrY == "x") {
        //if asking for x placement for 1st or 3rd place, return 0
        if (place == 1 || place == 3) {
            return 0;
        }
        //if asking for x placement for 2nd or 4th place, return 1
        else if (place == 2 || place == 4) {
            return 1;
        }
    }
    //if asking for a y coord
    else if (xOrY == "y") {
        //if asking for y placement for 1st or 2nd place, return 1
        if (place == 1 || place == 2) {
            return 1;
        }
        //if asking for y placement for 3rd or 4th place, return 0
        else if (place == 3 || place == 4) {
            return 0;
        }
    }
}


//set control panel previous and next buttons with appropriate ElectionYear for their labels, and input currrent ElectionYear, using provided indicies and globally available electionYears
function setControlPanel(currentElectionYearIndex, prevElectionYearIndex, nextElectionYearIndex) {
    //get btns in control panel
    let prevBtn = d3.select("#prev");
    let nextBtn = d3.select("#next");
    let electionYearDisplay = d3.select("#election-year");

    //get keys (String representations) for current ElectionYear, next ElectionYear, and previous ElectionYear
    let currentElectionYearKey = Array.from(electionYears.keys())[currentElectionYearIndex];
    let prevElectionYearKey = Array.from(electionYears.keys())[prevElectionYearIndex];
    let nextElectionYearKey = Array.from(electionYears.keys())[nextElectionYearIndex];

    //get next year, current year, and previous year
    electionYearDisplay.html(currentElectionYearKey);
    prevBtn.html("<span class='skipbtn-icon'>&#8249;</span>" + prevElectionYearKey + "&nbsp");
    nextBtn.html("&nbsp" + nextElectionYearKey + "<span class='skipbtn-icon'>&#8250;</span>");
}


//set corner annotation that display top four candidates based on current ElectionYear using given chart div and fillScale
function setTopFourCandidateAnnotations(currElectionYear, fillScale) {

    //TOP LEFT annotation div with a candidate name, party, nationwide vote count, and place ranking

    //select and empty top left annotation div
    let topLeftAnnotationDiv = d3.select("#top-left-annotation");
    topLeftAnnotationDiv.html(""); //empty div of any potentially preexisitng content

    //append candidate name to div
    topLeftAnnotationDiv.append("p")
        .attr("class","president-annotation")
        .html(formatStringWithoutNickname(currElectionYear.candidateOptions[0].candidate));

    //append candidate party with appropriate color based on fillScale
    topLeftAnnotationDiv.append("p")
        .attr("class","party-annotation")
        .style("color", function() {
            return fillScale(currElectionYear.candidateOptions[0].party);
        })
        .html(currElectionYear.candidateOptions[0].party);

    //append popular vote count for candidate
    topLeftAnnotationDiv.append("p")
        .attr("class","vote-count-annotation")
        .html("<span class='nationwide-candidate-vote-total'>" + formatWithCommaSeperators(currElectionYear.candidateOptions[0].nationwideVotes) + "</span>" + " popular votes");

    //append place for candidate
    topLeftAnnotationDiv.append("p")
        .attr("class","place-number-annotation")
        .html("1<span class='place-suffix-annotation'>st</span>");

    //TOP RIGHT annotation div with a candidate name, party, nationwide vote count, and place ranking

    //select and empty top right annotation div
    let topRightAnnotationDiv = d3.select("#top-right-annotation");
    topRightAnnotationDiv.html(""); //empty div of any potentially preexisitng content
    
    //append candidate name to div
    topRightAnnotationDiv.append("p")
        .attr("class","president-annotation")
        .html(formatStringWithoutNickname(currElectionYear.candidateOptions[1].candidate));

    //append candidate party with appropriate color based on fillScale
    topRightAnnotationDiv.append("p")
        .attr("class","party-annotation")
        .style("color", function() {
            return fillScale(currElectionYear.candidateOptions[1].party);
        })
        .html(currElectionYear.candidateOptions[1].party);

    //append popular vote count for candidate
    topRightAnnotationDiv.append("p")
        .attr("class","vote-count-annotation")
        .html("<span class='nationwide-candidate-vote-total'>" + formatWithCommaSeperators(currElectionYear.candidateOptions[1].nationwideVotes) + "</span>" + " popular votes");

    //append place for candidate
    topRightAnnotationDiv.append("p")
        .attr("class","place-number-annotation")
        .html("2<span class='place-suffix-annotation'>nd</span>");

    //BOTTOM LEFT annotation div with a candidate name, party, nationwide vote count, and place ranking

    //select and empty bottom left annotation div
    let bottomLeftAnnotationDiv = d3.select("#bottom-left-annotation");
    bottomLeftAnnotationDiv.html(""); //empty div of any potentially preexisitng content
    
    //append candidate name to div
    bottomLeftAnnotationDiv.append("p")
        .attr("class","president-annotation")
        .html(formatStringWithoutNickname(currElectionYear.candidateOptions[2].candidate));
    
    //append candidate party with appropriate color based on fillScale
    bottomLeftAnnotationDiv.append("p")
        .attr("class","party-annotation")
        .style("color", function() {
            return fillScale(currElectionYear.candidateOptions[2].party);
        })
        .html(currElectionYear.candidateOptions[2].party);

    //append popular vote count for candidate
    bottomLeftAnnotationDiv.append("p")
        .attr("class","vote-count-annotation")
        .html("<span class='nationwide-candidate-vote-total'>" + formatWithCommaSeperators(currElectionYear.candidateOptions[2].nationwideVotes) + "</span>" + " popular votes");

    //append place for candidate
    bottomLeftAnnotationDiv.append("p")
        .attr("class","place-number-annotation")
        .html("3<span class='place-suffix-annotation'>rd</span>");

    //BOTTOM RIGHT annotation div with a candidate name, party, nationwide vote count, and place ranking

    //select and empty bottom right annotation div
    let bottomRightAnnotationDiv = d3.select("#bottom-right-annotation");
    bottomRightAnnotationDiv.html(""); //empty div of any potentially preexisitng content
    
    //append candidate name to div
    bottomRightAnnotationDiv.append("p")
        .attr("class","president-annotation")
        .html(formatStringWithoutNickname(currElectionYear.candidateOptions[3].candidate));

    //append candidate party with appropriate color based on fillScale
    bottomRightAnnotationDiv.append("p")
        .attr("class","party-annotation")
        .style("color", function() {
            return fillScale(currElectionYear.candidateOptions[3].party);
        })
        .html(currElectionYear.candidateOptions[3].party);

    //append popular vote count for candidate
    bottomRightAnnotationDiv.append("p")
        .attr("class","vote-count-annotation")
        .html("<span class='nationwide-candidate-vote-total'>" + formatWithCommaSeperators(currElectionYear.candidateOptions[3].nationwideVotes) + "</span>" + " popular votes");

    //append place for candidate
    bottomRightAnnotationDiv.append("p")
        .attr("class","place-number-annotation")
        .html("4<span class='place-suffix-annotation'>th</span>");
}


/*
String Formatting Functions
*/

//removes nickname from the end of a candidate's name String for brevity
function formatStringWithoutNickname(candidateName) {
    //get rid of nicknames at end of candidate names to avoid overly wide tooltips
    formattedCandidateName = "";
    for (letter of candidateName) {
        //stop appending letters when the first " is reached because that means a nickname has started 
        if (letter === '"') {
            break;
        }
        else {
            formattedCandidateName = formattedCandidateName + letter;
        }
    }
    return formattedCandidateName;
}

//modulo function for moving between indices (years) in control panel
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}

//for formatting numbers with commas 
let formatWithCommaSeperators = d3.format(",");