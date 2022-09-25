d3.csv("csv/big_brother_us_data.csv").then(function(data) {

    /*
    DEFINE DIMENSIONS OF SVG + CREATE SVG CANVAS
    */
    const width = document.querySelector("#chart").clientWidth;
    const height = document.querySelector("#chart").clientHeight;
    const margin = {top: 40, left: 75, right:8, bottom: 63};
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    const pointOpacity = 0.875;
    const transitionDuration = 1600;
    const transitionDelay = 200;

    //record initial window width and height
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    //start from scratch on resize if width was change but for height just update svg height
    d3.select(window).on("resize", function(e) {

        //save previous svg width and height
        prevSvgWidth = windowWidth;
        prevSvgHeight = windowHeight;

        //get new window widths and save them as the current svgWidth and height
        svgWidth = window.innerWidth * 1.0;
        svgHeight = window.innerHeight * 1.0;

        //if window width was changed in resize reload page becauce animation will be messed up
        if (svgWidth != prevSvgWidth) {
            console.log(prevSvgWidth)
            console.log(svgWidth)
            location.reload();
        }
    });
    
    //Rank Filters available in UI
    const rankPercentFilterCategories = [1.0, 0.75, 0.5, 0.25]

    //Determine last season number in dataset
    const maxSeasonInDataSet = d3.max(data, function(d) { return +d.installment;})

    //Get Unique ethnicity names
    const ethnicitiesColumn = d3.map(data, function(d){ return d.race_ethnicity;});
    let allUniqueEthnicities = ethnicitiesColumn.filter(function(d, i) {
        return ethnicitiesColumn.indexOf(d) == i;
    });

    //Get Unique Genders
    const genderColumn = d3.map(data, function(d){ return d.gender;});
    let allUniqueGenders = genderColumn.filter(function(d, i) {
        return genderColumn.indexOf(d) == i;
    }); 
    
    //reformat colors that will be used in viz
    const blue = d3.schemeTableau10[0];

    d3.schemeTableau10.shift(blue);
    d3.schemeTableau10.unshift("#8C8C8C");
    d3.schemeTableau10.splice(9, 1);
    d3.schemeTableau10.splice(10, 0, blue);

    //finds max bar height (max number of players aross all seasons)
    function findMaxAcrossSeasons(dataBySeason) {
        let max = 0;
        dataBySeason.forEach(function(seasonArray) {
            barHeight = 0;
            seasonArray.forEach(function(ethnicityDatum) {
                barHeight = barHeight + ethnicityDatum.totalPlayers;
            });  
            if (barHeight > max) {
                max = barHeight;
            }
        });
        return max;
    };

    //determines current height of bar based on currIndex in seasonArray
    function findHeightSoFar(seasonArray, currIndex) {
        heightSoFar = 0
        for (let i = 0; i <= seasonArray.length; i++) { 
            if (currIndex == i) {
                return heightSoFar;
            }
            else {
                heightSoFar = heightSoFar + seasonArray[i].totalPlayers;
            }
        };
    };

    //Determines which buttons with the given classname are matches with the isChecked variable in their checked property
    function getCheckedOrUnCheckedValues(classname, isChecked) {
        let matches = []
        d3.selectAll(classname).each(function(){
            if (this.checked == isChecked) {
                matches.push(this.value);
            }
        })
        return matches;
    }


    // Disables buttons with the given className for the transitionDuration in between data update pattern animation
    function disableForTransitionDuration(className) {
        //disable filters for transition duration to prevent the dataupdate transition from being interrupted
        d3.selectAll(className).each(function() {
            this.disabled = true;
        });
        d3.selectAll(className).each(function() {
            let checkbox = this;
            setTimeout(function() {
                checkbox.disabled = false;
            }, transitionDuration);
        });
    }   
    

    //apppends appropriate ordinal suffix to number
    function ordinalSuffixFormat(number) {
        const ordinalSuffixes = ['th', 'st', 'nd', 'rd'];
        const value = number % 100;

        return `${number}${ordinalSuffixes[(value - 20) % 10] || ordinalSuffixes[value] || ordinalSuffixes[0]}`;
    }

    //capitalizes string at the beginning and after " " or "/" delimeters
    function capitalizeString(string) {
        let formattedString = `${string.charAt(0).toUpperCase()}${string.substring(1)}`
        let indexOfSpace = formattedString.indexOf(" ")
        if (indexOfSpace !== -1) {
            formattedString = `${formattedString.substring(0, indexOfSpace + 1)}${formattedString.charAt(indexOfSpace + 1).toUpperCase()}${formattedString.substring(indexOfSpace + 2)}`;
        }
        let indexOfSlash = formattedString.indexOf("/")
        if (indexOfSlash !== -1) {
            formattedString = `${formattedString.substring(0, indexOfSlash + 1)}${formattedString.charAt(indexOfSlash + 1).toUpperCase()}${formattedString.substring(indexOfSlash + 2)}`;
        }
        
        return formattedString;
    }
    
    
    /*
    REORGANIZE SEASONS DATA INTO A LIST OF DATA BY SEASON FUNCTION
    */ 

    //formats and outputs demographicsOfPlayersBySeason from CSV data for use in stacked bar graph (must have total number of players per ethnicity per season for bargraph)
    /*
    demographicsOfPlayersBySeason is a list of seasonsArrays

    Within the seasonArray are ethnicityDataObjects with the following columns:
        - id: string comprised of ethnicity and installmentNumber for identification when graphing
        - installment: the season number associated with the entry
        - ethnicity: ethnicity name
        - totalPlayers: the number of players represented from this ethnicity this season
        - farthestPersonName: the name of the player in this groping that made it the farthest
        - farthestPersonFinalPlacement: the farthest final placement within the grouping
    */
    function reorganizeToDemographicsOfPlayersBySeason() {
    
        let uncheckedEthnicityTypes = getCheckedOrUnCheckedValues(".ethnicity-type", false);
        let uncheckedGenderTypes = getCheckedOrUnCheckedValues(".gender-type", false);
        let checkedRankTypes = getCheckedOrUnCheckedValues(".rank-type", true);
        
        const demographicsOfPlayersBySeason = []
        for (let i = 3; i <= maxSeasonInDataSet; i++) { 
            let rawDataForThisSeason = data.filter(function(d) {
                return d.installment == i;
            });

            let dataForThisSeason = []

            allUniqueEthnicities.forEach(function(e, index) {

                //filter out to leave only this race_ethnicity
                let dataForThisEthnicity = {} 
                let rawDataForThisSeasonAndEthnicity = rawDataForThisSeason.filter(function(d) {
                    return d.race_ethnicity == e ;
                });

                //filter out raw data entries with unchecked ethnicities and genders buttons
                uncheckedEthnicityTypes.forEach(function(unchecked) {
                    rawDataForThisSeasonAndEthnicity = rawDataForThisSeasonAndEthnicity.filter(function(d) {
                        return d.race_ethnicity != unchecked;
                    });
                })
                uncheckedGenderTypes.forEach(function(unchecked) {
                    rawDataForThisSeasonAndEthnicity = rawDataForThisSeasonAndEthnicity.filter(function(d) {
                        return d.gender != unchecked;
                    });
                })

                //filter out rank placement percents outside of checked ank threshold 
                checkedRankTypes.forEach(function(checked) {
                    rawDataForThisSeasonAndEthnicity = rawDataForThisSeasonAndEthnicity.filter(function(d) {
                        return d.placement_rank_percent <= checked;
                    });
                })

                //if data enthnicity is represented in the season and is checked, then add a new entry to demographicsOfPlayersBySeason 
                if (rawDataForThisSeasonAndEthnicity.length > 0) {
                    dataForThisEthnicity[`id`] = `${e}${i}`;
                    dataForThisEthnicity[`installment`] = `${i}`;
                    dataForThisEthnicity[`totalPlayers`] = rawDataForThisSeasonAndEthnicity.length;
                    dataForThisEthnicity[`ethnicity`] = e;

                    //data for person in season/ethnicity grouping that made it the farthest in the game
                    fatherestPlacementForThisSeasonAndEthnicity = d3.min(rawDataForThisSeasonAndEthnicity, function(d) { return +d.final_placement;})
                    fatherestPlayerForThisSeasonAndEthnicity = rawDataForThisSeasonAndEthnicity.filter(function(d) {
                        return d.final_placement == fatherestPlacementForThisSeasonAndEthnicity;
                    });
                    dataForThisEthnicity[`farthestPersonName`] = `${fatherestPlayerForThisSeasonAndEthnicity[0].first} ${fatherestPlayerForThisSeasonAndEthnicity[0].last}`
                    dataForThisEthnicity[`farthestPersonFinalPlacement`] = `${fatherestPlayerForThisSeasonAndEthnicity[0].final_placement}`

                    dataForThisSeason.push(dataForThisEthnicity);
                }
            }) 
            demographicsOfPlayersBySeason.push(dataForThisSeason);
        };
        return demographicsOfPlayersBySeason;
    };


    /* 
    TOOLTIP Function

    When you hover over a bar, the tooltip should
    display ALL of the following information:
    - Number of Players of the Ethnicity in the Season
    - Farthest Placing Player
    - Farthest Placement Rank
    */
    
    function initializeToolTip(xScale, colorScale) {
        
        // remove left over tooltips
        d3.select("div.tooltip").remove();
        d3.select("div.tooltip-left").remove();
        d3.select("div.tooltip-right").remove();

        //create new tooltip
        const tooltip = d3.select("#chart")
            .append("div");

        svg.selectAll("rect").on("mouseover", function(event, d) {
            const tooltipOffsetX = xScale.bandwidth() * 1.05;
            const tooltipOffsetY = -2.5;
            let x = +d3.select(this).attr("x");
            let y = +d3.select(this).attr("y");
            const toolTipPositions = ["left", "right"];
            let toolTipPosIndex = 0;
            let notToolTipPosIndex = 1;

            //rightside of svg canvas
            if (x > (width / 2)) {
                toolTipPosIndex = 1;
                notToolTipPosIndex = 0;
                tooltip.attr("class", "tooltip-right");
                x = width - x + (tooltipOffsetX * .175);
                y = y + (tooltipOffsetY * 1);
            }
            //leftside of svg canvas
            else {
                tooltip.attr("class", "tooltip-left");
                x = x + (tooltipOffsetX * 1.125);
                y = y + (tooltipOffsetY * 1);
            }

            //determines if label should say Player or Players based on d.totalPlayers
            let playerOrPlayers = "PLAYER";
            if (d.totalPlayers > 1) {
                playerOrPlayers = "PLAYERS";
            }

            //capitalize Ethnicity Name in label
            let ethnicityName = capitalizeString(d.ethnicity) 

            tooltip.style("visibility", "visible")
                .style(toolTipPositions[toolTipPosIndex], `${x}px`)
                .style(toolTipPositions[notToolTipPosIndex], "")
                .style("top", `${y}px`)
                .html(`<span style="font-size: 21px"><span style="font-weight: 700;">${d.totalPlayers} ${ethnicityName}</span> <span style="font-size:17px;font-weight:600;">${playerOrPlayers}</span></span>
                <br><span class="smallcaps">BEST PLACEMENT: </span>${d.farthestPersonName}, ${ordinalSuffixFormat(d.farthestPersonFinalPlacement)}`)

            //make hovered over bar have a outline and bring it to the front of svg for appearance
            this.parentNode.appendChild(this);
            d3.select(this).attr("opacity", 1.0)
                .attr("stroke", "rgba(97, 97, 97, 0.975")
                .attr("stroke-width", 5)
                .attr("cursor", "pointer")
                .attr("rx", 4)
                .attr("ry", 4);

        }).on("mouseout", function() {

            tooltip.style("visibility", "hidden");

            //remove stroke and rounding around hovered bar
            d3.select(this).attr("cursor", "default")
                .attr("stroke-width", 0)
                .attr("rx", 0)
                .attr("ry", 0);;
        });
    }
        

    // Intializes visualization with all data shown by season and ethnicity groupings
    function initializeViz(){

        /*
        REORGANIZE SEASONS DATA INTO A LIST OF DATA BY SEASON 
        */ 

        //format demographicsOfPlayersBySeason from CSV data for use in stacked bar graph (must have total number of players per ethnicity per season for bargraph)
        /*
        demographicsOfPlayersBySeason is a list of seasonsArrays

        Within the seasonArray are ethnicityDataObjects with the following columns:
            - id: string comprised of ethnicity and installmentNumber for identification when graphing
            - installment: the season number associated with the entry
            - ethnicity: ethnicity name
            - totalPlayers: the number of players represented from this ethnicity this season
            - farthestPersonName: the name of the player in this groping that made it the farthest
            - farthestPersonFinalPlacement: the farthest final placement within the grouping
        */
        const demographicsOfPlayersBySeason = reorganizeToDemographicsOfPlayersBySeason();

        /*
        DETERMINE MIN AND MAX VALUES OF VARIABLES
        */

        const seasonsMinMax = {
            min: 3,
            max: maxSeasonInDataSet
        };

        const numPlayersPerSeasonMinMax = {
            min: 0,
            max: findMaxAcrossSeasons(demographicsOfPlayersBySeason)
        };

        /*
        CREATE SCALES
        */
        const xScale = d3.scaleBand()
            .domain(d3.map(demographicsOfPlayersBySeason, function(d, i) { return i + 3}))
            .range([margin.left, width-margin.right])
            .padding(0.4);;

        const yScale = d3.scaleLinear()
            .domain([numPlayersPerSeasonMinMax.min, numPlayersPerSeasonMinMax.max])
            .range([height-margin.bottom, margin.top]);

        const colorScale = d3.scaleOrdinal()
            .domain(allUniqueEthnicities)
            .range(d3.schemeTableau10);

        /*
        DRAW AXES
        */
        const xAxis = svg.append("g")
            .attr("class","axis")
            .attr("transform", `translate(0,${height-margin.bottom})`)
            .call(d3.axisBottom().scale(xScale));

        const yAxis = svg.append("g")
            .attr("class","axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft().scale(yScale));

        /*
        DRAW AXIS LABELS
        */
        const xAxisLabel = svg.append("text")
            .attr("class","axisLabel")
            .attr("text-anchor","middle")
            .attr("x", margin.left + (width-margin.left-margin.right)/2)
            .attr("y", height-((margin.bottom/4)*1))
            .text("Season #");

        const yAxisLabel = svg.append("text")
            .attr("class","axisLabel")
            .attr("transform","rotate(-90)")
            .attr("text-anchor","middle")
            .attr("x", -(height-margin.bottom)/2)
            .attr("y", margin.left/2)
            .text("# of Players");

        /*
        DRAW STACKED BARS
        */
        //function that draws each season based stacked bar with unfiltered demographicsOfPlayersBySeason
        demographicsOfPlayersBySeason.forEach(function(seasonArray, seasonIndex){
            let seasonBars = svg.selectAll("rect")
                .data(seasonArray, function(d){ return d.id})
                .enter()
                .append("rect")
                    .attr("x", function() {return xScale(seasonIndex + 3); })
                    .attr("y", function(d, i) { return yScale(d.totalPlayers + findHeightSoFar(seasonArray, i)); })
                    .attr("width", xScale.bandwidth())
                    .attr("height", function(d) { return height - margin.bottom - yScale(d.totalPlayers); })
                    .attr("fill", function(d) { return colorScale(d.ethnicity);})
                    .attr("pointer-events", "all");
        });

        // Tool Tip
        initializeToolTip(xScale);

        // on click of a button, update viz based on the checked/unchecked state of the buttons
        d3.selectAll(".ethnicity-type,.gender-type,.rank-type,#reset").on("click", function() {

            //if click was on the reset button, check all gender and ethniticity checkboxes and bring Placement Rank Percent back to 1st button being checked to return to default state
            let thisId = d3.select(this).property("id");
            if (thisId == "reset") {
                d3.selectAll(".ethnicity-type,.gender-type").each(function() {
                    this.checked = true;
                })
                d3.selectAll(".rank-type").each(function() {
                    let thisType = d3.select(this).property("value");
                    if (thisType == 1.0) {
                        this.checked = true;
                    }
                    else {
                        this.checked = false;
                    }
                })
            }

            //update viz on click of a filter button
            updateViz(xScale, yScale, colorScale);
        });
    };


    //Updates vizualization based on filtering done by user using buttons
    function updateViz(xScale, yScale, colorScale) {

        /*
        REORGANIZE SEASONS DATA INTO A LIST OF DATA BY SEASON 
        */ 

        //format demographicsOfPlayersBySeason from CSV data for use in stacked bar graph (must have total number of players per ethnicity per season for bargraph)
        /*
        demographicsOfPlayersBySeason is a list of seasonsArrays

        Within the seasonArray are ethnicityDataObjects with the following columns:
            - id: string comprised of ethnicity and installmentNumber for identification when graphing
            - installment: the season number associated with the entry
            - ethnicity: ethnicity name
            - totalPlayers: the number of players represented from this ethnicity this season
            - farthestPersonName: the name of the player in this groping that made it the farthest
            - farthestPersonFinalPlacement: the farthest final placement within the grouping
        */
        const demographicsOfPlayersBySeason = reorganizeToDemographicsOfPlayersBySeason();

        // Determine new numPlayersPerSeasonMinMax
        const numPlayersPerSeasonMinMax = {
            min: 0,
            max: findMaxAcrossSeasons(demographicsOfPlayersBySeason)
        };

        /*
        UPDATE STACKED BARS
        */

        //Update each season based stacked bar based on newly constructed demographicsOfPlayersBySeason
        demographicsOfPlayersBySeason.forEach(function(seasonArray, seasonIndex){
            let bars = svg.selectAll("rect")
                .filter(function(d) { 
                    return d.installment == seasonIndex + 3; })
                .data(seasonArray, function(d) { return d.id; });

            //Add new bars that were previously not in stack
            bars.enter()
                .append("rect")
                .attr("x", function() {return xScale(seasonIndex + 3); })
                .attr("y", function(d, i) { return yScale(d.totalPlayers + findHeightSoFar(seasonArray, i)); })
                .attr("width", xScale.bandwidth())
                .transition()
                    .duration(transitionDuration)
                    .delay(transitionDelay)
                    .attr("height", function(d) { return height - margin.bottom - yScale(d.totalPlayers); })
                    .attr("fill", function(d) { return colorScale(d.ethnicity);})
                    .attr("pointer-events", "all");

            //Merge existing bars in stack
            bars.merge(bars)
                .transition()
                    .attr("x", function() {return xScale(seasonIndex + 3); })
                    .attr("y", function(d, i) { return yScale(d.totalPlayers + findHeightSoFar(seasonArray, i)); })
                    .duration(transitionDuration)
                    .delay(transitionDelay)
                    .attr("width", xScale.bandwidth())
                    .attr("height", function(d) { return height - margin.bottom - yScale(d.totalPlayers); })
                    .attr("fill", function(d) { return colorScale(d.ethnicity);});

            //remove bar segments that are no longer in demographicsOfPlayersBySeason because their totalPlayers have been filtered to 0
            bars.exit()
                .transition()
                    .duration(transitionDuration)
                    .delay(transitionDelay)
                    .attr("height", 0)
                    .remove();
        });

        //disable filters for transition duration to prevent the data update transition from being interrupted
        disableForTransitionDuration(".ethnicity-type");
        disableForTransitionDuration(".gender-type");
        disableForTransitionDuration(".rank-type");
        disableForTransitionDuration("#resetBtn");

        // Tool Tip
        initializeToolTip(xScale);
    };


    /* 
    Populate filters
    */
    //Function that populates UI with filters for visualization
    function populateFilters(filterList, filterDivId, newFilterClassName, inputType) {
        filterList.forEach(
            function(currItem, i){
                    //insert br for filter spacing
                    if (i !== 0) {
                        d3.select(`#${filterDivId}`)
                            .insert("br");
                    }
        
                    //add input element, with the first radio checked if inputType is radio
                    d3.select(`#${filterDivId}`)
                        .insert("input")
                        .attr("class", newFilterClassName)
                        .attr('type', inputType)
                        .attr('value', currItem)
                        .attr('name', newFilterClassName)
                        .property('checked', function() {
                            if (inputType == "radio" && i == 0) {
                                return true;
                            }
                            else if (inputType == "radio" && i !== 0) {
                                return false;
                            }
                            else {
                                return true;
                            }
                        });
        
                    //add label
                    d3.select(`#${filterDivId}`)
                        .insert("label")
                        //format placement rank percent thresholds into buttons
                        .text(function() {
                            //if radio, format decimals into labels
                            if (inputType == "radio") {
                                if (i == 0) {
                                    return "All Players"
                                }
                                else {
                                    return `Top ${currItem * 100}%`;
                                }
                            }
                            //if checkbox, return filter text with proper capitalization
                            else if (inputType == "checkbox") {
                                capitalizedCurrItem = capitalizeString(currItem)
                                return capitalizedCurrItem;
                            }
                        })
                        .style('color', function() {
                            //if ethnicity button, then color label in its corresponding color
                            if (inputType == "checkbox" && newFilterClassName == "ethnicity-type"){
                                return d3.schemeTableau10[i];
                            }
                        });
                });
    };
    
    //Populate Ethnicity Checkboxes
    populateFilters(allUniqueEthnicities, "ethnicity-filters", "ethnicity-type", "checkbox");

    //Populate Gender Checkboxes
    populateFilters(allUniqueGenders, "gender-filters", "gender-type", "checkbox");

    //Populate Rank Percent Selector
    populateFilters(rankPercentFilterCategories, "rank-filters", "rank-type", "radio");

    //Intial Viz Rendering: filter and draw data in default state
    initializeViz();
});