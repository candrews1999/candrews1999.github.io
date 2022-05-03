let myData;
let highestInvestmentTotal = 0;
let clicked;
let mycanvas;

//ENUMS
const BLUE = "#348498";
const DARKBLUE = "#1F4F5B";
const GREEN = "#88B87A";
const DARKGREEN = "#548547";
const STROKEWEIGHT = 4;
let MARGIN = {side: null, top: null, bottom: null};
let NUMCOL = 20;
const NUMROW = 5;
let NUMFORTOP = 100;
const DEVISORCOMPANY = 8;
const DEVISORINVESTOR = 8;
const FRAMERATE = 40;

//create list of all companies and investors
let companies = new Map();
let investors = new Map();

//create list of top companies and investors
let topCompanies = [];
let topInvestors = [];

//desktop top companies and investors
let topCompaniesDesktop;
let topInvestorsDesktop;

//mobile top companies and investors
let topCompaniesMobile;
let topInvestorsMobile;

//waits til data is loaded to visualize
function preload() {
    myData = loadTable("investments.csv", "csv", "header")
}


//creates canvas and sets it up as a dom element
function setup() {

    //set margin
    marginReset();

    //create canvas
    mycanvas = createCanvas(windowWidth, windowHeight);
    mycanvas.parent("my-sketch")

    //fix the null values for the amts in dataset
    for(let row of myData.rows) {
        let amt = row.get("amount_usd");
        //if row holds an emtpy string, set as $0 to avoid null error
        if (amt == "") {
            row.setNum("amount_usd", 0);
        }
    }

    //set the rest of the rows into companies and investor maps
    for (let row of myData.rows) {
        let cname = row.getString("company_name");
        let iname = row.getString("investor_name");

        let company;
        let investor;
        let amt = row.getNum("amount_usd");
        let date = row.getString("funded_when")

        //if companies already has a pair with the cname key, then access that company
        if(companies.has(cname)){
            company = companies.get(cname);
        } 
        //else create new Company object and add a new Map pair to the companies list
        //key: cname
        //value: Company object
        else {
            company = new Company(cname);
            companies.set(cname, company);
        }
        

        //if investors already has a pair with the iname key, then access that investor
        if(investors.has(iname)){
            investor = investors.get(iname);
        } 
        //else create new Investor object and add a new Map pair to the investors list
        //key: iname
        //value: Investor object
        else{
            investor = new Investor(iname)
            investors.set(iname, investor);
        }

        //make new investment object
        let investment = new Investment(company, investor, amt, date);

        //add investment to company's list of investments
        company.investments.push(investment);
        company.total += amt;

        //add investment to investors list of investments
        investor.investments.push(investment);
        investor.total += amt;
    }

    //compute my top companies and investors
    let allTopCompanies = Array.from(companies.values());
    let allTopInvestors = Array.from(investors.values());

    allTopCompanies.sort( (a, b) => b.total - a.total);
    allTopInvestors.sort( (a, b) => b.total - a.total);

    //correct NUMFORTOP if it exceeds the slots available in the grid
    if ((NUMCOL * NUMROW) < NUMFORTOP) {
        NUMFORTOP = NUMCOL * NUMROW;
    }

    //create list of top companies and top investors based on NUMFORTOP
    topCompanies = allTopCompanies.slice(0, NUMFORTOP);
    topInvestors = allTopInvestors.slice(0, NUMFORTOP);

    //organizeInvestments within each topCompany and topInvestor by greatest ot least
    organizeInvestmentsLeastToGreatest();

    // set highest valued investment 
    for (let c of topCompanies) {
        for (let inv of c.investments) {
            if (highestInvestmentTotal < inv.amt) {
                highestInvestmentTotal = inv.amt; 
            }
        }
    }
    for (let i of topInvestors) {
        for (let inv of i.investments) {
            if (highestInvestmentTotal < inv.amt) {
                highestInvestmentTotal = inv.amt;
            }
        }
    }

    // setFrameRate
    frameRate(FRAMERATE);

    //save desktop topCompanies and topInvestors
    topCompaniesDesktop = topCompanies;
    topInvestorsDesktop = topInvestors;

    //save mobile topCompanies and topInvestors
    topCompaniesMobile = topCompanies.slice(0, Math.round(NUMFORTOP/2));
    topInvestorsMobile = topInvestors.slice(0, Math.round(NUMFORTOP/2));

    //save mobile and desktop NUMCOLS
    numColDesktop = NUMCOL;
    numColMobile = Math.round(NUMCOL / 2);

    //update NUMCOL, topCompanies, and topInvestors based on screen size
    updateGridBasedOnScreenWidth();

    // center the anchor point for squares
    rectMode(CENTER);
    ellipseMode(CENTER);

    //set coords for topCompanies and topInvestors
    setXAndYTopCompanies();
    setXAndYTopInvestors();
}


//organizes investments within company and investor objects from greatest to least by usd total
function organizeInvestmentsLeastToGreatest() {
    for (let c of topCompanies) {
        c.investments.sort( (a, b) => b.amt - a.amt);
    }
    for (let i of topInvestors) {
        i.investments.sort( (a, b) => b.amt - a.amt);
    }
}

//updates topCompanies, topInvestors, and NUMCOL based on screenwidth (using saved desktop and mobile variables from setup)
function updateGridBasedOnScreenWidth() {
    if (windowWidth > 1000) {
        //set topCompanies and topInvestors to be Desktop array saved at setup
        topCompanies = topCompaniesDesktop;
        topInvestors = topInvestorsDesktop;

        //update NUMCOL to desktop 
        NUMCOL = numColDesktop;
    }
    else {
        //set topCompanies and topInvestors to be Mobile array saved at setup
        topCompanies = topCompaniesMobile;
        topInvestors = topInvestorsMobile;

        //update NUMCOL to mobile 
        NUMCOL = numColMobile;
    }
}


//draws circles (company) and squares (investor) based on data
function draw() {
    background(200);
    textSize(10);

    //set hovering states for each company based on mouse positioning
    for (let c of topCompanies) {
        c.setHovering();
    }
    //set hovering states for each investor based on mouse positioning
    for (let i of topInvestors) {
        i.setHovering();
    }
    //set related companies if a company is being hovered
    for(let c of topCompanies) {
        c.setRelatedInvestors();
    }
    //set related companies if a investor is being hovered, then draw symbols for each topInvestor
    for(let i of topInvestors) {
        i.setRelatedCompanies();
    }

    // draw default symbols for each topCompanies
    for(let c of topCompanies) {
        c.drawDefaultCompanies();
    }
    // draw default symbols for each topInvestor
    for(let i of topInvestors) {
        i.drawDefaultInvestors();
    }
    //draw relationships for topCompanies (if a Company is being hovered)
    for(let c of topCompanies) {
        c.drawRelationships();
    }
    //draw relationships for top Investors (if an Investor is being hovered)
    for(let i of topInvestors) {
        i.drawRelationships();
    }
    //draw hovered companies or companies related to hovered investor
    for(let c of topCompanies) {
        c.drawHoveredOrRelatedCompanies();
    }
    //draw hovered investors or investors related to hovered company
    for(let i of topInvestors) {
        i.drawHoveredOrRelatedInvestors();
    }

    //draw labels below symbols
    drawLabelsBelowSymbols();

    //adjust Cursor based on if anything is being hovered
    adjustCursorBasedOnHovering();

    //draw tooltip
    let tooltipOnClick = mycanvas.mouseClicked(function() {
        tooltip();
    })
}


//adjust cursor based on hovering
function adjustCursorBasedOnHovering() {
    //if any topInvestor or topCompany is being hovered then change cursor to hand, otherwise default
    let isHovered = false;
    for(let c of topCompanies) {
        isHovered = c.hover || isHovered;
    }
    for(let i of topInvestors) {
        isHovered = i.hover || isHovered;
    }

    //if symbol has been hovered before tooltip has been activated, then make cursor hand
    if (isHovered && clicked == null) {
        cursor(HAND);
    }
    // else make cursor arrow
    else {
        cursor(ARROW);
    }
}


//resizes visualization based on window size
function windowResized() {
    updateGridBasedOnScreenWidth();
    resizeCanvas(windowWidth, windowHeight);
    tooltip(true);
    marginReset();
    setXAndYTopCompanies();
    setXAndYTopInvestors();
    drawLabelsBelowSymbols();
    draw();
}


//lays out top Companies and Investors
function setXAndYTopCompanies() {
    let index = 0;
    for(let x = MARGIN.side; x < (windowWidth/2 - MARGIN.side/2); x += ((windowWidth/2 - MARGIN.side*1.5)/NUMCOL)) {
        for(let y = MARGIN.top; y < (windowHeight - MARGIN.bottom); y += ((windowHeight - MARGIN.top - MARGIN.bottom)/NUMROW)) {

            //if the layout has reached the end of available Companies, stop laying out shapes
            if (index >= (topCompanies.length)) {
                return;
            }

            topCompanies[index].x = x;
            topCompanies[index].y = y;

            text(topInvestors[index].name, x, y + 20);

            index = index + 1;
        }
    }
}
function setXAndYTopInvestors() {
    let index = 0;
    for(let x = windowWidth/2 + MARGIN.side/2; x < (windowWidth - MARGIN.side); x += ((windowWidth/2 - MARGIN.side*1.5)/NUMCOL)) {
        for(let y = MARGIN.top; y < (windowHeight - MARGIN.bottom); y += ((windowHeight - MARGIN.top - MARGIN.bottom)/NUMROW)) {

            //if the layout has reached the end of available Companies, stop laying out shapes
            if (index >= (topInvestors.length)) {
                return;
            }

            topInvestors[index].x = x;
            topInvestors[index].y = y;

            text(topInvestors[index].name, x, y + 20);

            index = index + 1;
        }
    }
}

//draw labels below symbols of names of investors and companies
function drawLabelsBelowSymbols() {
    let index = 0;
    //investors on the right
    for(let x = windowWidth/2 + MARGIN.side/2; x < (windowWidth - MARGIN.side); x += ((windowWidth/2 - MARGIN.side*1.5)/NUMCOL)) {
        for(let y = MARGIN.top; y < (windowHeight - MARGIN.bottom); y += ((windowHeight - MARGIN.top - MARGIN.bottom)/NUMROW)) {

            //if the layout has reached the end of available Investors, stop laying out labels
            if (index >= (topInvestors.length)) {
                break;
            }

            push();

            translate(x, y + 20);
            rotate(radians(45));
            strokeWeight(1.5);
            //if hovered
            if (topInvestors[index].hover) {
                textStyle(BOLD);
                textSize(14);
            }
            //if related to hovered, bold and increase font size
            else if (topInvestors[index].related != "") {
                textStyle(BOLD);
                textSize(11);
            }
            text(topInvestors[index].name, 0, 0);
            pop();

            index = index + 1;
        }
        //if the layout has reached the end of available Investors, stop laying out labels
        if (index >= (topInvestors.length)) {
            break;
        }
    }
    index = 0;
    //companies on the left
    for(let x = MARGIN.side; x < (windowWidth/2 - MARGIN.side/2); x += ((windowWidth/2 - MARGIN.side*1.5)/NUMCOL)) {
        for(let y = MARGIN.top; y < (windowHeight - MARGIN.bottom); y += ((windowHeight - MARGIN.top - MARGIN.bottom)/NUMROW)) {

            //if the layout has reached the end of available Companies, stop laying out labels
            if (index >= (topCompanies.length)) {
                break;
            }

            push();

            translate(x, y + 20);
            rotate(radians(45));
            strokeWeight(1.5);
            //if hovered
            if (topCompanies[index].hover) {
                textStyle(BOLD);
                textSize(14);
            }
            //if related to hovered, bold and increase font size
            else if (topCompanies[index].related != "") {
                textStyle(BOLD);
                textSize(11);
            }
            text(topCompanies[index].name, 0, 0);
            pop();

            index = index + 1;
        }
        //if the layout has reached the end of available Companies, stop laying out labels
        if (index >= (topCompanies.length)) {
            break;
        }
    }

    //Label Companies vs Investors in bottom margin
    push();
    strokeWeight(1.5);
    textStyle(BOLD);
    textSize(20);
    fill("white")
        push();
        translate(MARGIN.side, windowHeight - MARGIN.bottom/2);
        text("top " + topCompanies.length + " companies", 0, 0);
        pop();
        push();
        translate(windowWidth/2 + MARGIN.side/2, windowHeight - MARGIN.bottom/2);
        text("top " + topInvestors.length + " investors", 0, 0);
        pop();
    pop();
}

//resets margin at different screen widths
function marginReset() {
    if (windowWidth > 1000) {
        MARGIN = {side: 50, top: 50, bottom: 100};
    }
    else {
        MARGIN = {side: 25, top: 25, bottom: 50};
    }
}

//draws tooltip when a symbol is clicked or when the window is resized and a symbol has already been clicked
function tooltip(windowWasJustResized) {

    //select tooltip parts
    let tooltip = select("#tooltip");
    let name = select("#name");
    let companyOrInvestorLabels = select("#companyorinvestorlabels");
    let bars = select("#bars");
    let investmentTotals = select("#investmenttotals");
    let closeBtn = select("#close")

    //determine if any symbol is being hovered and save the hovered Company or Investor
    let hovered = null;
    for(let c of topCompanies) {
        if (c.hover) {
            hovered = c;
        }
    }
    for(let i of topInvestors) {
        if (i.hover) {
            hovered = i
        }
    }

    //when a symbol is being hovered and click has not been detected yet then add tooltip, if window is resized during a tooltip then redraw bars
    if ((hovered != null && clicked == null)|| (hovered != null && clicked !=null && windowWasJustResized)) {

        //reset for window resizing
        if (windowWasJustResized) {
            tooltip.style("visibility", "hidden");
            companyOrInvestorLabels.html("");
            investmentTotals.html("");
            bars.html("");
            clicked = null;
        }

        //set clicked to true to remember that modal has appeared and click on symbol has occured
        clicked = hovered;

        //set tooltip to visible
        tooltip.style("visibility", "visible");

        if (!windowWasJustResized) {
             //set modal name for company or investor and total investment
            let modalNameElement = createElement("p");
            modalNameElement.html(
                clicked.name 
                + `<span id="typestring"> ${clicked.getStringType()}</span>` + "<br>"
                + `<span id="totalamt"> $${nfc(clicked.total)}</span>`
                + `<span id="totallabel"> investment total</span>`
                );
            modalNameElement.id("modalname");
            name.child(modalNameElement);
        }

        //prepare for tooltip data population
        let index = 0;

        //go through each of the clicked symbols investments and draw them in modal
        for(let inv of clicked.investments) {

            // get investment company name (if clicked is investor) or investor name (if clicked is company)
            let investmentLabel = clicked.getInvestorOrCompanyInvestedInName(index);
            //add label p element
            let investmentLabelElement = createElement("p");
            investmentLabelElement.html(investmentLabel);
            investmentLabelElement.class("investmenttotal");
            companyOrInvestorLabels.child(investmentLabelElement);

            // get investment amount and formatted amount
            let investmentTotal = inv.amt;
            let investmentTotalFormatted = "$" + nfc(investmentTotal);
            //add investment p element
            let investmentAmtElement = createElement("p");
            investmentAmtElement.html(investmentTotalFormatted);
            investmentAmtElement.class("investmenttotal");
            investmentTotals.child(investmentAmtElement);

            //add bar div
            let bar = createDiv('');
            bars = select("#bars");
            bar.class("totalbar");
            bar.size((investmentTotal / highestInvestmentTotal)* (bars.width * .99), 12);
            bar.style("background-color", DARKBLUE);
            bars.child(bar);

            //increase index
            index = index + 1;
        }

        //when tooltip is closed, set tooltip visibility to hidden and reset tooltip contents
        closeBtn.mouseClicked(function() {
            tooltip.style("visibility", "hidden");
            companyOrInvestorLabels.html("");
            investmentTotals.html("");
            bars.html("");
            name.html("");
            hovered = null;
            clicked = null;
        })
    }
}


//represents a Company with a name, list of investments in its company, total investments in usd, x-coord, y-coord, and if it is being hovered
class Company{
    name
    investments
    total = 0
    x
    y
    hover = false
    related = ""

    constructor(name) {
        this.name = name;
        this.investments = [];
        this.x = 0;
        this.y = 0;
    }

    // determines the radius of the company based on their total
    radius() {
        return sqrt(this.total / 1E6) / DEVISORCOMPANY;
    };

    //sets hovering state based on if it is in bounds of the circle
    setHovering() { 
        
        if (clicked == null) {
            let d = dist(this.x, this.y, mouseX, mouseY);
                
            //if d is less than c.radius, then circle is not being hovered
            this.hover = d < this.radius();

            return this.hover;
        };
    };

    //set related Investors related field as this Company's name if this Company is hovered
    setRelatedInvestors() {
        for (let inv of this.investments) {
            //get associatedInvestor with current investment
            let associatedInvestor = inv.investor;

            //determine if related Investor has a currently hovered company relationship, if so then leave as is, otherwise reset to ""
            for (let c of topCompanies) {
                //if associated Investor has a related name matching a non-hovered topCompany, then reset related field to default ""
                if (associatedInvestor.related == c.name && !c.hover) {
                    associatedInvestor.related = "";
                }
            }

            //if this Company is being hovered, then make each of its related Investors (In topInvestors) have the name 
            if (this.hover) {
                //if investor that is related to hovered company is in topInvestors, then make its related field the name of the company
                for (let i of topInvestors) {
                    if (associatedInvestor.name == i.name) {
                        associatedInvestor.related = this.name;
                    }
                }
            }
        }
    }

    //draws Investors that are not hovered or related to the company that is hovered
    drawDefaultCompanies() {
        if (!(this.related != "" && this.hover)){
            push();
            stroke(0, 0);
            strokeWeight(0);
            fill(255);  
            ellipse(this.x, this.y, this.radius()*2, this.radius()*2);
            pop();
        }
    }

    //draw hovered company and investors related 
    drawHoveredOrRelatedCompanies() {
        if(this.hover) {
            push();
            stroke(DARKBLUE);
            strokeWeight(STROKEWEIGHT);
            fill(BLUE);
            ellipse(this.x, this.y, this.radius()*2, this.radius()*2);
            pop();
        } 
        else if(this.related != "") {
            push();
            stroke(DARKGREEN);
            strokeWeight(STROKEWEIGHT);
            fill(GREEN);
            ellipse(this.x, this.y, this.radius()*2, this.radius()*2);
            pop();
        }
    }

    //draws relationship line to related investors if this company is being hovered.
    drawRelationships() {
        for (let inv of this.investments) {
            let associatedInvestor = inv.investor;

            //if associatedInvestor has a related field that isnt default "" then draw line to represent relationships
            if(associatedInvestor.related != "" && this.hover) {
                push();
                stroke(DARKGREEN);
                strokeWeight(STROKEWEIGHT);
                line(associatedInvestor.x, associatedInvestor.y, this.x, this.y);
                stroke(0, 0);
                strokeWeight(0);
                pop();
                
            }
        }
    }

    //returns a string of the type 
    getStringType() {
        return "company";
    }

    //returns the name of the investment's investor at the given index
    getInvestorOrCompanyInvestedInName(index) {
        return this.investments[index].investor.name;
    }
}

//represents an Investor with a name, list of investments in other companies, total investments in usd, x-coord, and y-coord
class Investor{
    name
    investments
    total = 0
    x
    y
    hover = false;
    related = "";

    constructor(name) {
        this.name = name;
        this.investments = []
        this.x = 0;
        this.y = 0;
    }

    // determines the radius of the investor based on their total
    radius() {
        return sqrt(this.total / 1E6) / DEVISORINVESTOR;
    }

    //sets hovering state based on if it is in bounds of the square
    setHovering() {   

        if (clicked == null) {
            let rLeft = this.x - this.radius();
            let rRight = this.x + this.radius();
            let rTop = this.y - this.radius();
            let rBottom = this.y + this.radius()
    
            //if d exceeds bounds of square, then it is being hovered
            this.hover = !(mouseX < rLeft || mouseY < rTop || mouseX > rRight || mouseY > rBottom);
    
            return this.hover;
        }

    }

    //set related companies related field as this Investor's name if this Investor is hovered
    setRelatedCompanies() {
        for (let inv of this.investments) {
            //get associatedCompany with current investment
            let associatedCompany = inv.company;

            //determine if related company has a currently hovered investor relationship, if so then leave as is, otherwise reset to ""
            for (let i of topInvestors) {
                //if associated company has a related name matching a non-hovered topInvestor, then reset related field to default""
                if (associatedCompany.related == i.name && !i.hover) {
                        associatedCompany.related = "";
                }
            }

            //if this Investor is being hovered, then make each of its related Companies (In topCompanies) have the name 
            if (this.hover) {
                //if company that is related to hovered investor is in topCompanies, then make its related field the name of the investor
                for (let c of topCompanies) {
                    if (associatedCompany.name == c.name) {
                        associatedCompany.related = this.name;
                    }
                }
            }
        }
    }

    //draws Investors that are not hovered or related to the company that is hovered
    drawDefaultInvestors() {
        if (!(this.related != "" && this.hover)){
            push();
            stroke(0, 0);
            strokeWeight(0);
            fill(255);  
            rect(this.x, this.y, this.radius() * 2, this.radius() * 2, this.radius()/5);
            pop();
        }
    }

    //draw hovered investor and related companies
    drawHoveredOrRelatedInvestors() {
        if(this.hover) {
            push();
            stroke(DARKBLUE);
            strokeWeight(STROKEWEIGHT);
            fill(BLUE);
            rect(this.x, this.y, this.radius() * 2, this.radius() * 2, this.radius()/5);
            pop();
        } 
        else if(this.related != "") {
            push();
            stroke(DARKGREEN);
            strokeWeight(STROKEWEIGHT);
            fill(GREEN);
            rect(this.x, this.y, this.radius() * 2, this.radius() * 2, this.radius()/5);
            pop();
        }
    }

    //draws relationship line to related companies if this investor is being hovered.
    drawRelationships() {
        for (let inv of this.investments) {
            let associatedCompany = inv.company;

            //if associatedCompany has a related field that isnt default "" then draw line to represent relationships
            if(associatedCompany.related != "" && this.hover) {
                push();
                stroke(DARKGREEN);
                strokeWeight(STROKEWEIGHT);
                line(associatedCompany.x, associatedCompany.y, this.x, this.y);
                stroke(0, 0);
                strokeWeight(0);
                pop();
            }
        }
    }

    //returns a string of the type 
    getStringType() {
        return "investor";
    }

    //returns the name of the investment's company at the given index
    getInvestorOrCompanyInvestedInName(index) {
        return this.investments[index].company.name;
    }
}

//represents an Investment in a company by an investor
class Investment{
    company
    investor
    amt
    date

    constructor(company, investor, amt, date) {
        this.company = company;
        this.investor = investor;
        this.amt = amt;
        this.date = date;
    }
}