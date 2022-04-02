d3.csv("csv/salaries-by-college-type.csv").then(function(data) {

    //Changes: Implemented data update pattern, added rect annotations to show below and below average salary, scaled toopTip dot outline and info panel
    //dataset with startingMedianSalary, rewrote introduction and visualization sections of narrative, animations for y-axis label changes, added ","
    //seperators to tooltip for easier reading comprehension, and made narrative sections's overflow property auto so that overflow text could scroll,
    //disabled buttons as dataupdate pattern is running to prevent transition from getting interrupted, removed tooltip after dataupdate so tooltip element 
    //was not duplicated

    /*
    DEFINE DIMENSIONS OF SVG + CREATE SVG CANVAS
    */
    const width = document.querySelector("#chart").clientWidth;
    const height = document.querySelector("#chart").clientHeight;
    const margin = {top: 40, left: 100, right:20, bottom: 80};
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    const pointOpacity = 0.875;
    const transitionDuration = 2000;
    const transitionDelay = 250;

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


    // return list of checked school type filters by collecting checkboxes of schooltype class
    function getCheckedFilters() {
        let checkedFilters = [];

        d3.selectAll(".school-type").each(function() {
            let thisType = d3.select(this).property("value");
            let isChecked = d3.select(this).property("checked");

            if (isChecked == true) {
                checkedFilters.push(thisType);
            }
        });

        return checkedFilters;
    }


    // return opacity of scatterpoint (based on school type filtering) for scatter plot drawing
    function schoolTypeFilteringAttrbuteGetter(d, checkedFilters, attrRequest) {   
        if(checkedFilters.includes(d.schoolType)) {
            if(attrRequest === "opacity") {
                return pointOpacity;
            }
            else if(attrRequest === "pointer-events") {
                return "all";
            }
            else {
                return null;
            }
        }
        else {
            if(attrRequest === "opacity") {
                return 0;
            }
            else if(attrRequest === "pointer-events") {
                return "none";
            }
            else {
                return null;
            }
        }
    }


    //determines mean of a column located within filteredData using yAxiscolumnName identifier
    function meanOfCSVCol(filteredData, yAxisColumnName) {
        var yAxisColumn = [];
        yAxisColumn = filteredData.map(function(d) { return d[`${yAxisColumnName}`]; });
        yAxisMean = d3.mean(yAxisColumn);

        return yAxisMean;
    }


    //on click of schooltype filtering, update based on the checkboxes that are checked and not checked 
    function onClickFilteringBySchoolType(){
        // on click, update filtering of checked/unchecked schoolType scatterplot dots
        d3.selectAll(".school-type").on("click", function() {
            let thisType = d3.select(this).property("value");
            let isChecked = d3.select(this).property("checked");
        
            let selection = svg.selectAll("circle").filter(function(d) {
                return d.schoolType === thisType;
            });
        
            if(isChecked == true) {
                selection.transition()
                    .duration(transitionDuration/3)
                    .delay(transitionDelay/3)
                    .attr("opacity", pointOpacity)
                    .attr("pointer-events", "all");
            }
            else {
                selection.transition()
                    .duration(transitionDuration/3)
                    .delay(transitionDelay/3)
                    .attr("opacity", 0)
                    .attr("pointer-events", "none");
            }
        });
    }


    /* 
    TOOLTIP Function

    When you hover over a circle in the scatterplot, the tooltip should
    display ALL of the following information:
    - The School Name
    - The value of Starting Median Salary
    - The value of Mid-Career Median Salary
    */
    
    function initializeToolTip(yAxisColumnName, toolTipScaleBasedOnRScale) {

        //remove left over tooltips
        d3.select("div.tooltip").remove();
        d3.select("div.tooltip-left").remove();
        d3.select("div.tooltip-right").remove();

        //create new tooltip
        const tooltip = d3.select("#chart")
            .append("div")

        tooltip.attr("class", "tooltip");

        svg.selectAll("circle").on("mouseover", function(event, d) {
            const tooltipOffsetX = toolTipScaleBasedOnRScale(d.startingMedianSalary) * 2;
            const tooltipOffsetY = toolTipScaleBasedOnRScale(d.startingMedianSalary) * 2;
            let cx = +d3.select(this).attr("cx");
            let cy = +d3.select(this).attr("cy");
            const toolTipPositions = ["left", "right"];
            let toolTipPosIndex = 0;
            let notToolTipPosIndex = 1;

            //rightside of svg canvas
            if (cx > (width / 2)) {
                toolTipPosIndex = 1;
                notToolTipPosIndex = 0;
                tooltip.attr("class", "tooltip-right");
                cx = width - cx + (tooltipOffsetX * 1.1);
                cy = cy + (tooltipOffsetY * 1.1);
            }
            //leftside of svg canvas
            else {
                tooltip.attr("class", "tooltip-left");
                cx = cx + tooltipOffsetX;
                cy = cy + tooltipOffsetY;
            }

            //format numbers appearing in tooltip with Commmas
            let formatWithCommaSeperators = d3.format(",");
            let dFormattedStartingMedianSalary = formatWithCommaSeperators(d.startingMedianSalary);
            let dFormattedYAxisValue = formatWithCommaSeperators(d[`${yAxisColumnName}`]);

            tooltip.style("visibility", "visible")
                .style(toolTipPositions[toolTipPosIndex], `${cx}px`)
                .style(toolTipPositions[notToolTipPosIndex], "")
                .style("top", `${cy}px`)
                .html(`${d.schoolName}<br><b>Start:</b> $${dFormattedStartingMedianSalary}<br><b>Mid:</b> $${dFormattedYAxisValue}`)

            d3.select(this)
                .attr("stroke", "rgba(97, 97, 97, 0.975)")
                .attr("stroke-width", toolTipScaleBasedOnRScale(d.startingMedianSalary))
                .attr("cursor", "pointer");

        }).on("mouseout", function() {

            tooltip.style("visibility", "hidden");

            d3.select(this)
                .attr("stroke", "none")
                .attr("stoke-width", 0);
        });
    }
        

    // Function to filter out N/A in csv, create scales based on min/max, add scales and labels, axes, scatterplot points, and add clickable behavior
    function initializeViz(yAxisColumnName){
        
        /*
        FILTER THE DATA
        */
        let filtered_data = data.filter(function(d) {
            return d[`${yAxisColumnName}`] !== "N/A";
        });

        /*
        DETERMINE MIN AND MAX VALUES OF VARIABLES
        */
        const startingMedSalary = {
            min: d3.min(filtered_data, function(d) { return +d.startingMedianSalary;}),
            max: d3.max(filtered_data, function(d) { return +d.startingMedianSalary;})
        };

        const yAxisMinMax= {
            min: d3.min(filtered_data, function(d) { return +d[`${yAxisColumnName}`];}),
            max: d3.max(filtered_data, function(d) { return +d[`${yAxisColumnName}`];})
        };

        /*
        CREATE SCALES
        */
        const xScale = d3.scaleLinear()
        .domain([startingMedSalary.min, startingMedSalary.max])
        .range([margin.left, width-margin.right]);

        const yScale = d3.scaleLinear()
            .domain([yAxisMinMax.min, yAxisMinMax.max])
            .range([height-margin.bottom, margin.top]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const rScale = d3.scaleSqrt()
            .domain([startingMedSalary.min, startingMedSalary.max])
            .range([6, 15]);

        const toolTipScaleBasedOnRScale = d3.scaleSqrt()
            .domain([startingMedSalary.min, startingMedSalary.max])
            .range([4, 6.5]);

        /*
        DRAW AXES
        */
        const xAxis = svg.append("g")
            .attr("class","axis")
            .attr("transform", `translate(0,${height-margin.bottom})`)
            .call(d3.axisBottom().scale(xScale).tickFormat(d3.format(".2s")));

        const yAxis = svg.append("g")
            .attr("class","axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft().scale(yScale).tickFormat(d3.format(".2s")));

        /*
        DRAW AXIS LABELS
        */
        const xAxisLabel = svg.append("text")
            .attr("class","axisLabel")
            .attr("text-anchor","middle")
            .attr("x", margin.left + (width-margin.left-margin.right)/2)
            .attr("y", height-((margin.bottom/4)*1.75))
            .text("Starting Median Salary (USD)");

        const yAxisLabel = svg.append("text")
            .attr("class","axisLabel")
            .attr("transform","rotate(-90)")
            .attr("text-anchor","middle")
            .attr("x", -(height-margin.bottom)/2)
            .attr("y", margin.left/2)
            .text("Mid-Career Median Salary (USD)");

        // Draw Median Rectangles
        let yAxisMean = meanOfCSVCol(filtered_data, yAxisColumnName);

        const upperMidCareerAnnotationRect = svg.append("rect")
            .attr("x", margin.left)
            .attr("y", yScale(yAxisMinMax.max))
            .attr("width", width - margin.left - margin.right)
            .attr("height", yScale(yAxisMean) - yScale(yAxisMinMax.max))
            .attr("fill", "gray")
            .attr("opacity", 0.2);

        const upperMidCareerAnnotationText = svg.append("text")
            .attr("class","annotation")
            .attr("text-anchor", "end")
            .attr("x", xScale(startingMedSalary.max * .9975))
            .attr("y", yScale(yAxisMean) * .98)
            .attr("opacity", 0.4)
            .text("Above Average Mid-Career Salary");

        const lowerMidCareerAnnotationRect = svg.append("rect")
            .attr("x", margin.left)
            .attr("y", yScale(yAxisMean))
            .attr("width", width - margin.left - margin.right)
            .attr("height", yScale(yAxisMinMax.min) - yScale(yAxisMean))
            .attr("fill", "lightgray")
            .attr("opacity", 0.225);

        const lowerMidCareerAnnotationText = svg.append("text")
            .attr("class","annotation")
            .attr("text-anchor", "end")
            .attr("x", xScale(startingMedSalary.max * .9975))
            .attr("y", yScale(yAxisMinMax.min) * .9875)
            .attr("opacity", 0.4)
            .text("Below Average Mid-Career Salary");

        /*
        DRAW SCATTERPLOT POINTS
        */
        //function that draws scatter points with the y-axis being populated by the medianSalaryColumnName given
    
        //Get checkedFilters school types
        let checkedFilters = getCheckedFilters();

        let scatterPoints = svg.selectAll("circle")
            .data(filtered_data, function(d) { return d.schoolName; })
            .enter()
            .append("circle")
                .attr("cx", function(d) { return xScale(d.startingMedianSalary); })
                .attr("cy", function(d) { return yScale(d[`${yAxisColumnName}`]); })
                .attr("r", function(d) { return rScale(d.startingMedianSalary); })
                .attr("fill", function(d) { return colorScale(d.schoolType); })
                .attr("opacity", pointOpacity)
                .attr("pointer-events","all");

        // Tool Tip
        initializeToolTip(yAxisColumnName, toolTipScaleBasedOnRScale);

        // Filter scatterPoints on click of filtering by schooltype checkboxes
        onClickFilteringBySchoolType();

        // on click of a radio button, change y-axis that is plotted and redraw everything
        d3.selectAll(".percentile-type").on("click", function() {
            let thisType = d3.select(this).property("value");
            let midCareerColumns = data.columns;
            midCareerColumns.forEach(function(columnName, i) {
                //when column name match is found to radio that was clicked, change y-axis data that is being graphed
                if (columnName == thisType) {
                    //Look at only column headers past startingMedianSalary
                    if (i > 2) {
                        updateBasedOnYAxis(columnName, xAxis, yAxis, yAxisLabel, xScale, yScale, rScale, colorScale, toolTipScaleBasedOnRScale, 
                            upperMidCareerAnnotationRect, upperMidCareerAnnotationText, lowerMidCareerAnnotationRect, lowerMidCareerAnnotationText);
                    }
                }
            });
        });
    };


    function updateBasedOnYAxis(yAxisColumnName, xAxis, yAxis, yAxisLabel, xScale, yScale, rScale, colorScale, toolTipScaleBasedOnRScale, 
        upperMidCareerAnnotationRect, upperMidCareerAnnotationText, lowerMidCareerAnnotationRect, lowerMidCareerAnnotationText) {

        /*
        FILTER THE DATA
        */
        let filtered_data = data.filter(function(d) {
            return d[`${yAxisColumnName}`] !== "N/A";
        });

        const yAxisMinMax = {
            min: d3.min(filtered_data, function(d) { return +d[`${yAxisColumnName}`];}),
            max: d3.max(filtered_data, function(d) { return +d[`${yAxisColumnName}`];})
        };

        // Reset Scales
        yScale.domain([yAxisMinMax.min, yAxisMinMax.max]);

        // Reset Annotations based on new yAxisMean
        let yAxisMean = meanOfCSVCol(filtered_data, yAxisColumnName);

        upperMidCareerAnnotationRect.transition()
            .duration(transitionDuration)
            .delay(transitionDelay/2)
            .attr("y", yScale(yAxisMinMax.max))
            .attr("height", yScale(yAxisMean) - yScale(yAxisMinMax.max));

        upperMidCareerAnnotationText.transition()
            .duration(transitionDuration)
            .delay(transitionDelay/2)
            .attr("y", yScale(yAxisMean) * .98);

        lowerMidCareerAnnotationRect.transition()
            .duration(transitionDuration)
            .delay(transitionDelay/2)
            .attr("y", yScale(yAxisMean))
            .attr("height", yScale(yAxisMinMax.min) - yScale(yAxisMean));

        lowerMidCareerAnnotationText.transition()
            .duration(transitionDuration)
            .delay(transitionDelay/2)
            .attr("y", yScale(yAxisMinMax.min) * .9875);

        /*
        UPDATE SCATTERPLOT POINTS 
        */

        //Get all circles and assign schoolName as identifier
        let scatterPoints = svg.selectAll("circle")
            .data(filtered_data, function(d) { return d.schoolName; });

        //Get checkedFilters school types
        let checkedFilters = getCheckedFilters();

        //disable filters for transition duration to prevent the dataupdate transition from being interrupted
        disableForTransitionDuration(".school-type");

        //disable filters for transition duration to prevent the dataupdate transition from being interrupted
        disableForTransitionDuration(".percentile-type");

        //Add new data points from filtered data
        scatterPoints.enter()
            .append("circle")
            .attr("cx", function(d) { return xScale(d.startingMedianSalary); })
            .attr("cy", function(d) { return yScale(d[`${yAxisColumnName}`]); })
            .transition()
                .duration(transitionDuration)
                .delay(transitionDelay)
                .attr("r", function(d) { return rScale(d.startingMedianSalary); })
                .attr("fill", function(d) { return colorScale(d.schoolType); })
                .attr("opacity", function(d) {return schoolTypeFilteringAttrbuteGetter(d, checkedFilters, "opacity")})
                .attr("pointer-events",function(d) {return schoolTypeFilteringAttrbuteGetter(d, checkedFilters, "pointer-events")});

        //Merge existing scatterPoints
        scatterPoints.merge(scatterPoints)
                .transition()
                    .duration(transitionDuration)
                    .delay(transitionDelay)
                    .attr("cx", function(d) { return xScale(d.startingMedianSalary); })
                    .attr("cy", function(d) { return yScale(d[`${yAxisColumnName}`]); })
                    .attr("r", function(d) { return rScale(d.startingMedianSalary); });

        //remove scatterpoints with N/A yAxis value
        scatterPoints.exit()
            .transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .attr("r", 0)
            .remove();

        // Tool Tip
        initializeToolTip(yAxisColumnName, toolTipScaleBasedOnRScale);

        // Filter scatterPoints on click of filtering by schooltype checkboxes, had to put this in update function so the right y-axis column is 
        // searched in instances where a scatterpoint's y-axis value is "N/A" and thus should not be shown after being unfiltered out
        onClickFilteringBySchoolType();

        //update xAxis
        xAxis.transition()
                .duration(transitionDuration)
                .delay(transitionDelay)
                .call(d3.axisBottom().scale(xScale).tickFormat(d3.format(".2s"))); //draws Axis

        //update yAxis
        yAxis.transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .call(d3.axisLeft().scale(yScale).tickFormat(d3.format(".2s"))); //draws Axis

        //update yAxis label
        yAxisLabel.transition()
            .duration(transitionDuration/30)
            .attr("opacity", 0)
        yAxisLabel.transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .attr("opacity", 1)
            .text(function() {
                if (yAxisColumnName.includes("Percentile")) {
                    return `Mid-Career ${yAxisColumnName.substring(9, 13)} Percentile Salary (USD)`
                }
                else {
                    return "Mid-Career Median Salary (USD)";
                }
            });
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
        
                    //add label, with color of scatterplot dot if a checkbox input
                    d3.select(`#${filterDivId}`)
                        .insert("label")
                        //format Percentile Labels for Brevity
                        .text(function() {
                            //if radio, format text based on column name
                            if (inputType == "radio") {
                                //Remove Mid-Career Substring
                                let stringInProgress = currItem.substring(9);
                                //Remove Salary Substring
                                stringInProgress = stringInProgress.substring(0, stringInProgress.length - 6);

                                //Add percent if not the first midCareer column header, midCareerMedianSalary
                                if (i > 0) {
                                    stringInProgress = stringInProgress.substring(0, 4);
                                }

                                return stringInProgress;
                            }
                            //if checkbox, return school type currItem
                            else if (inputType == "checkbox") {
                                return currItem;
                            }
                        })
                        .style('color', function() {
                            if (inputType == "checkbox"){
                                return d3.schemeCategory10[i];
                            }
                        });
                });
    };


    //Get Unique School Types
    let schoolTypes = d3.map(data, function(d){return d.schoolType;});
    let uniqueSchoolTypes = schoolTypes.filter(function(d, i) {
        return schoolTypes.indexOf(d) == i;
    });

    //Populate Filter Checkboxes
    populateFilters(uniqueSchoolTypes, "school-filters", "school-type", "checkbox");

    //Get Unique Percentile Column Names (3rd index and after in csv column headers)
    const midCareerPercentiles = data.columns.slice(3);

    //Populate Filter Checkboxes
    populateFilters(midCareerPercentiles, "percentile-filters", "percentile-type", "radio");

    //Intial Viz Rendering: filter and draw data as midCareerMedianSalary default
    initializeViz("midCareerMedianSalary");
});