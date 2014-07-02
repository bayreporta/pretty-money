	// ------- GLOBAL ------- //
		var race = 0; //leave default
		var raceTotal = []; //manually enter the number of candidates for each race, in order you placed in list above
		var raceColumns = [2]; // manually enter the column where this race data starts on the Summary sheet of GSheet
		var gsheet = "https://docs.google.com/spreadsheets/d/1q5EO4otxPF-t6QsoHTbffkVlvKBjrt8Fopi_dAWQMe0/pubhtml"; 
		var summaryDB = [], mainDB = [], ieDB = []; //stores all summary data
		var updated, ieUpdated; //when was the data updated?
		var view = "Summary"; //leave default
		var stacked = 0; //leave default
		var thisCandidate = 2;
		var defaultSubTopics = ["Ranking","Summary","IE Overview","Percent of Contributions"];
		var ieLength; //ie length
		
		//input dimensions for graphic
		var dimensions = {
			overall:550, //entire app size
			label:125, //labels for bars
			maxBarWidth:375 //max bar length
		}
		
		//candidate names, IE committees and measures
		var candidateDB = [], candidateList = [], ieNames = [];
		
		//input options for stacked bar graphs
		var stackedControl = {
			ie:{
				footer:"All money spent by independent expenditure committees in support or opposition to a candidate.",
				legendItems:2,
				legendLabels:["Support","Oppose"],
				legendColor:["rgb(145, 207, 96)","rgb(206, 95, 117)"],
				legendBars:"<div class=\"ie-bar-row\" id=\"0\"><div class=\"bar-label\"><p class=\"the-label\"></p></div><div class=\"bar-data\"><div id=\"geo1\" class=\"bar-seg\"></div><div id=\"geo2\" class=\"bar-seg\"></div></div>"
			},
			geography:{
				footer:"Contributions shown here refer to itemized cash contributions with a location attached. Bay Area refers to all donations from incorporated and unincorporated communities in what is generally considered the Bay Area Region, minus Oakland. California contributions include all contributions from California EXCLUDING the Bay Area and Oakland. Numbers may not add up to 100% due to rounding.",
				legendItems:4,
				legendLabels:["Oakland","Bay Area","California","Elsewhere"],
				legendColor:["#5fce80","#5fadce","#ce5fad","#ce805f"],
				legendBars:{
					two:"<div class=\"stacked-bar-row\" id=\"0\"><div class=\"bar-label\"><p class=\"the-label\"></p></div><div class=\"bar-data\"><div id=\"geo1\" class=\"bar-seg\"></div><div id=\"geo2\" class=\"bar-seg\"></div></div>",
					three:"<div class=\"stacked-bar-row\" id=\"0\"><div class=\"bar-label\"><p class=\"the-label\"></p></div><div class=\"bar-data\"><div id=\"geo1\" class=\"bar-seg\"></div><div id=\"geo2\" class=\"bar-seg\"></div><div id=\"geo3\" class=\"bar-seg\"></div></div></div>",
					four:"<div class=\"stacked-bar-row\" id=\"0\"><div class=\"bar-label\"><p class=\"the-label\"></p></div><div class=\"bar-data\"><div id=\"geo1\" class=\"bar-seg\"></div><div id=\"geo2\" class=\"bar-seg\"></div><div id=\"geo3\" class=\"bar-seg\"></div><div id=\"geo4\" class=\"bar-seg\"></div></div></div>"
				}
			}	
		}
		// ------- UTILITY FUNCTIONS------- //
		var utilityFunctions = {
			executeChosen:function(){
				var config = {
			      '.chosen-select'           : {},
			      '.chosen-select-deselect'  : {allow_single_deselect:true},
			      '.chosen-select-no-single' : {disable_search_threshold:10},
			      '.chosen-select-no-results': {no_results_text:'Oops, nothing found!'},
			      '.chosen-select-width'     : {width:"95%"}
			    }
			    for (var selector in config) {
			      $(selector).chosen(config[selector]);
			    }
			
				//connect listeners to Chosen elements
				$("#race_options_chosen").on("click","ul > li", function(){
					race = parseInt($(this).attr("value"));	
					thisCandidate = raceColumns[race];
					$("#candidates_options_"+race+"_chosen .chosen-single span").text(candidateDB[race][0]);
					chartFunctions.redrawCanvas();			
				})

				$("#overall_options_chosen").on("click","ul > li", function(){
					view = $(this).html(); //detect view
					chartFunctions.redrawCanvas();
				})

				$("#stacked_options_chosen").on("click","ul > li", function(){
					var $x = $(this).html(); //detect view
					if ($x === "Percent of Contributions"){
						stacked = 0;
					}
					else {
						stacked = 1;
					}
					chartFunctions.redrawCanvas();
				})
				$("#contribute_options_chosen").on("click","ul > li", function(){
					view = $(this).attr("value"); //detect view
					chartFunctions.redrawCanvas();			
				})
				$("#expenses_options_chosen").on("click","ul > li", function(){
					view = $(this).attr("value"); //detect view
					chartFunctions.redrawCanvas();			
				})
				$("#summary_options_chosen").on("click","ul > li", function(){
					view = $(this).attr("value"); //detect view
					chartFunctions.redrawCanvas();			
				})
				$("#ie_options_chosen").on("click","ul > li", function(){
					view = $(this).attr("value"); //detect view
					chartFunctions.redrawCanvas();			
				})
				for(i=0 ; i < raceTotal.length ; i++){
					$("#candidates_options_"+i+"_chosen").on("click","ul > li", function(){
						thisCandidate = parseInt($(this).attr("value")); //detect candidate
						chartFunctions.redrawCanvas();			
					})
				}
			},
			commaSeparateNumber:function(val){
			    while (/(\d+)(\d{3})/.test(val.toString())){
			      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
			    }
			    return val;
			},
			dateDetectIE:function(){
				var dates = [], z;
				//determine last update
				for (i=0 ; i < ieLength ; i++){
					dates[i] = ieDB[i][2];
					
				}
				z = new Date(Math.max.apply(null,dates)).toString();
				split = z.split(" ")
				ieUpdated = split[1] + " " + split[2] + ", " + split[3];
				$("#cf-ie .cf-title h4").text("Data Updated on " + ieUpdated);
			},
			grabIEcommittees:function(){
				var ii = 0;
				for (i=0 ; i < ieLength / 2 ; i++){
					ieNames[i] = ieDB[ii][0];
					ii = ii + 2;
				}
			},
			grabCandidates:function(){
				var tempNames = [], tempRaces = [], parseRaces = [];
				var ii = 0, iii = 0, iv = 0, v = 2, vi = 2, countRaces = 0, countCandidates = 0;
				//grab names and races
				for (i = 2 ; i < mainDB[0].length ; i++){
					tempNames[ii] = mainDB[0][i];
					tempRaces[ii] = mainDB[1][i];
					ii = ii + 1;
				}				
				
				//Get unique races and count of total number of races
				parseRaces = _.uniq(tempRaces);
				countRaces = parseRaces.length;
				
				//populate races in race tab
				for (i=0 ; i < parseRaces.length ; i++){
					$("#race-options").append("<option value=" + i + ">" + parseRaces[i] + "</option>")
				}

				//create arrays within candidateDB for each race
				for (i = 0 ; i < countRaces ; i++){
					candidateDB[i] = new Array();
				}
				
				//Determine which candidate applies to which race
				for (i=0; i < tempRaces.length ; i++){
					var thisRace = tempRaces[i];
					if (thisRace === parseRaces[iii]){
						candidateDB[iii][iv] = tempNames[i];
						iv = iv + 1;
						countCandidates = countCandidates + 1;
					}
					else if (thisRace !== parseRaces[iii]){
						raceTotal[iii] = countCandidates;
						countCandidates = 1;
						iii = iii + 1;
						iv = 0;
						candidateDB[iii][iv] = tempNames[i];
						iv = iv + 1;		
						//get first column on GSheet for race
						raceColumns[iii] = v; 	
									
					}
					v = v + 1;
				}		
				raceTotal[iii] = countCandidates;
				
				//populate selection dropdown for candidates per race
				for (i=0 ; i < countRaces ; i++){
					$("#cf-expense-type .cf-title").append("<select id=\"candidates-options-"+i+"\" class=\"candidate-options chosen-select\" value=" + i + " class=\"chosen-select\" style=\"width:200px;float:left;\" tabindex=\"2\"></select>");
					for (x=0 ; x < candidateDB[i].length ; x++){
						$("#candidates-options-"+i+"").append("<option value=" + vi + ">" + candidateDB[i][x] + "</option>");
						vi = vi + 1;
					}
				}		
			}
		}
		// ------- ALL CHARING FUNCTIONS HERE ------- //
		var chartFunctions = {
			// ------- INITIALIZE FIRST CHART ------- //
			setTheScene:function(data, tabletop){
				//pull spreadsheet data into arrays
				$.each( tabletop.sheets("Summary").all(), function(i, summary) {
					var insertRow = [];
					insertRow[0] = summary.category;
					insertRow[1] = summary.all;
					insertRow[2] = summary.mccullough;
					insertRow[3] = summary.parker;
					insertRow[4] = summary.quan;
					insertRow[5] = summary.schaaf;
					insertRow[6] = summary.tuman;
					summaryDB.push(insertRow);
				});

				$.each( tabletop.sheets("Main").all(), function(i, main) {
					var insertRow = [];
					insertRow[0] = main.item;
					insertRow[1] = main.all;
					insertRow[2] = main.mccullough;
					insertRow[3] = main.parker;
					insertRow[4] = main.quan;
					insertRow[5] = main.schaaf;
					insertRow[6] = main.tuman;
					mainDB.push(insertRow);
				});	
				
				$.each( tabletop.sheets("IE_Overview").all(), function(i, ie) {
					var insertRow = [];
					insertRow[0] = ie.committee;
					insertRow[1] = ie.position;
					insertRow[2] = new Date(ie.updated);
					insertRow[3] = ie.total;
					insertRow[4] = ie.mccullough;
					insertRow[5] = ie.parker;
					insertRow[6] = ie.quan;
					insertRow[7] = ie.schaaf;
					insertRow[8] = ie.tuman;
					ieDB.push(insertRow);
				});		

				//determine number of IE committees
				ieLength = ieDB.length;

				//when last updated non-IE
				updated = mainDB[5][1];
				$(".cf-title h4").html("Data Updated on " + updated); 
				
				//when last updated IE
				utilityFunctions.dateDetectIE();

				//loading
				$("#cf-chart").css("visibility","visible");
				$("#loading").remove();

				//populate candidates and measures
				utilityFunctions.grabCandidates();
				
				//populate IE committees
				utilityFunctions.grabIEcommittees();

				//chosen
				utilityFunctions.executeChosen();
				
				//draw first chart				
				chartFunctions.resetCanvas(view);
				chartFunctions.renameCanvas(view);
				$(".bar-label").css("width",dimensions.label);
				$(".cf-canvas").css("display","none");
				$("#cf-overview").css("display","block");
				chartFunctions.drawSummary();
			},
			// ------- DRAWING CHARTS BY TYPE ------- //
			drawSummary:function(){
				var data = [];
				$("#summary_options_chosen").css("visibility","visibile").insertAfter("#overall_options_chosen");
				$("#summary_options_chosen .chosen-single span").text(defaultSubTopics[0]);
				$("#cf-choose-text h4:eq(2)").css("display","block");
				//size up data
				var ii = raceColumns[race];				
				for (i=0 ; i < raceTotal[race]; i++){
					var temp = parseInt(mainDB[23][ii]);
					$(".summary-row:eq("+i+")").attr("value",temp);
					data[i] = new Array();
					data[i][0] = "$" + utilityFunctions.commaSeparateNumber(temp);
					switch(race){
						case 0:
							data[i][1] = mainDB[24][ii];
							data[i][2] = mainDB[26][ii];
							break;
						case 1:
							data[i][1] = mainDB[25][ii];
							data[i][2] = mainDB[27][ii];
							break;
						case 2:
							data[i][1] = mainDB[25][ii];
							data[i][2] = mainDB[27][ii];
							break;
						case 3:
							data[i][1] = mainDB[25][ii];
							data[i][2] = mainDB[27][ii];
							break;
					}
					ii = ii + 1;
				}

				//populate data
				for (i=0 ; i < data.length ; i++){
					$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(1) p:eq(0)").html(data[i][0]);
					$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(2) p:eq(0)").html(data[i][1]);
					$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(3) p:eq(0)").html(data[i][2]);

					//Ranking colors
					if (data[i][1] === "1st"){
						$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(2) p:eq(0)").css("color","#91cf60");
					}
					else if (data[i][1] === "2nd" || data[i][1] === "3rd"){
						$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(2) p:eq(0)").css("color","#5FADCE");
					}
					else {
						$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(2) p:eq(0)").css("color","#CE5F75");
					}
					if (data[i][2] === "1st"){
						$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(3) p:eq(0)").css("color","#91cf60");
					}
					else if (data[i][2] === "2nd" || data[i][2] === "3rd"){
						$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(3) p:eq(0)").css("color","#5FADCE");
					}
					else {
						$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(3) p:eq(0)").css("color","#CE5F75");
					}
				}
				
				$(".cf-title h2").text("Candidate Rankings");
				chartFunctions.sortSummary();
			},
			drawStatistics:function(){
				var data = [];
				$("#summary_options_chosen").css("visibility","visibile").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");
				//size up data
				var ii = raceColumns[race];				
				for (i=0 ; i < raceTotal[race]; i++){
					var temp = parseInt(mainDB[9][ii]); //grabbing average contribution amount
					$(".summary-row:eq("+i+")").attr("value",temp); //for sorting
					data[i] = new Array();
					data[i][0] = parseInt(mainDB[8][ii]); //grab # of contributions
					data[i][1] = "$" + utilityFunctions.commaSeparateNumber(temp); //average contribution
					data[i][2] = parseInt(mainDB[6][ii]); //days since first disclosed contributions
					ii = ii + 1;
				}

				//populate data
				for (i=0 ; i < data.length ; i++){
					$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(1) p:eq(0)").html(data[i][0]).css("color","#5FADCE");
					$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(2) p:eq(0)").html(data[i][1]).css("color","rgb(145, 207, 96)");;
					$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(3) p:eq(0)").html(data[i][2]).css("color","#5FADCE");
				}
				chartFunctions.sortStatistics();
			},
			drawTopDonors:function(){
				var data = [];
				//size up data
				var ii = raceColumns[race];				
				for (i=0 ; i < raceTotal[race]; i++){
					data[i] = new Array();
					data[i][0] = mainDB[11][ii];
					data[i][1] = "$" + utilityFunctions.commaSeparateNumber(parseInt(mainDB[10][ii]));
					data[i][2] = mainDB[13][ii];
					data[i][3] = "$" + utilityFunctions.commaSeparateNumber(parseInt(mainDB[12][ii]));
					data[i][4] = mainDB[15][ii];
					data[i][5] = "$" + utilityFunctions.commaSeparateNumber(parseInt(mainDB[14][ii]));
					data[i][6] = mainDB[17][ii];
					data[i][7] = "$" + utilityFunctions.commaSeparateNumber(parseInt(mainDB[16][ii]));
					data[i][8] = mainDB[19][ii];
					data[i][9] = "$" + utilityFunctions.commaSeparateNumber(parseInt(mainDB[18][ii]));
					data[i][10] = mainDB[21][ii];
					data[i][11] = "$" + utilityFunctions.commaSeparateNumber(parseInt(mainDB[20][ii]));
					ii = ii + 1;
				}

				//populate data
				for (i=0 ; i < data.length ; i++){
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(0) span:eq(0)").html(data[i][0]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(0) span:eq(1)").html(data[i][1]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(1) span:eq(0)").html(data[i][2]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(1) span:eq(1)").html(data[i][3]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(2) span:eq(0)").html(data[i][4]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(2) span:eq(1)").html(data[i][5]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(0) span:eq(0)").html(data[i][6]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(0) span:eq(1)").html(data[i][7]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(1) span:eq(0)").html(data[i][8]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(1) span:eq(1)").html(data[i][9]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(2) span:eq(0)").html(data[i][10]);
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(2) span:eq(1)").html(data[i][11]);		

					var $a = $("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(0) span:eq(1)").html();
					var $b = $("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(1) span:eq(1)").html();
					var $c = $("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(2) span:eq(1)").html();
					var $d = $("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(0) span:eq(1)").html();
					var $e = $("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(1) span:eq(1)").html();
					var $f = $("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(2) span:eq(1)").html();

					if ($a === "$NaN"){
						$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(0) span:eq(1)").remove();
					}
					if ($b === "$NaN"){
						$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(1) span:eq(1)").remove();
					}
					if ($c === "$NaN"){
						$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(1) p:eq(2) span:eq(1)").remove();
					}
					if ($d === "$NaN"){
						$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(0) span:eq(1)").remove();
					}
					if ($e === "$NaN"){
						$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(1) span:eq(1)").remove();
					}
					if ($f === "$NaN"){
						$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(2) p:eq(2) span:eq(1)").remove();
					}

				}			
				if ($("#cf-donors .donor-row .donor-cell p span").html() === "$NaN"){
					$("#cf-donors .donor-row:eq("+ i +") .donor-cell p").remove();
				}
			},
			drawContributions:function(){
				var data = [];
				var all = 0;
				var dataWidth = [];
				var commas = [];
				$("#contribute_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#contribute_options_chosen .chosen-single span").text(defaultSubTopics[1]);
				$("#cf-choose-text h4:eq(2)").css("display","block");
				//size up data
				var ii = raceColumns[race];
				for (i=0 ; i < raceTotal[race]; i++){
					data[i] = parseInt(summaryDB[5][ii]) + parseInt(summaryDB[11][ii]);
					commas[i] = utilityFunctions.commaSeparateNumber(data[i]);
					ii = ii + 1;
				}

				//find total
				for (i=0 ; i < data.length ; i++){
					all = all + data[i]
				}

				//find highest value in array
				var maxValue = Math.max.apply(null, data);

				//figure out the width for each bar
				for (i = 0 ; i < data.length ; i++){
					dataWidth[i] = (data[i] / maxValue) * dimensions.maxBarWidth;
				}

				//populate data
				for (i=0 ; i < data.length ; i++){
					$("#cf-summary .bar-row:eq(" + i + ")").attr("value",data[i]);
					$("#cf-summary .bar-data:eq(" + i + ") p").text("$" + commas[i]);
					$("#cf-summary .bar-data:eq(" + i + ")").animate({
						width:dataWidth[i]
					})
				}

				//meta
				$(".bar-data").css("background","#91cf60");
				$("#cf-summary .cf-title h2").text("Total Cash Raised 2013-14");
				$("#cf-summary").append("<h4 class=\"chart-h4\">$" + utilityFunctions.commaSeparateNumber(all) + " contributed total</h4>");
				$("#cf-summary").append("<p class=\"chart-footer\">Cash raised includes all cash raised by the candidate excluding non-monetary contributions and loans, but including miscellaneous increases in cash, usually from auctioning items given to a candidate through non-monetary contributions.</p>");
				chartFunctions.sortBars();
				$(".bar-row[value='0']").css("display","none");
			},
			drawLoans:function(){
				var data = [];
				var all = 0;
				var dataWidth = [];
				var commas = [];
				$("#contribute_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");

				//size up data
				var ii = raceColumns[race];
				for (i=0 ; i < raceTotal[race]; i++){
					data[i] = parseInt(summaryDB[12][ii]);
					commas[i] = utilityFunctions.commaSeparateNumber(data[i]);
					ii = ii + 1;
				}
				//find total
				for (i=0 ; i < data.length ; i++){
					all = all + data[i]
				}

				//find highest value in array
				var maxValue = Math.max.apply(null, data);

				//figure out the width for each bar
				for (i = 0 ; i < data.length ; i++){
					dataWidth[i] = (data[i] / maxValue) * dimensions.maxBarWidth;
				}

				//populate data
				for (i=0 ; i < data.length ; i++){
					$("#cf-summary .bar-row:eq(" + i + ")").attr("value",data[i]);
					$("#cf-summary .bar-data:eq(" + i + ") p").text("$" + commas[i]);
					$("#cf-summary .bar-data:eq(" + i + ")").animate({
						width:dataWidth[i]
					})
				}


				//meta
				$(".bar-data").css("background","#5FADCE");
				$("#cf-summary .cf-title h2").text("Loans: 2013-14");
				$("#cf-summary").append("<h4 class=\"chart-h4\" style=\"color:#5FADCE;>$" + utilityFunctions.commaSeparateNumber(all) + " contributed total</h4>");
				$("#cf-summary").append("<p class=\"chart-footer\">A candidate or others can loan money to a committee, but that loan must be paid off by a predesignated time, such as through contributions.</p>");
				chartFunctions.sortBars();
				$(".bar-row[value='0']").css("display","none");
			},
			drawExpenseType:function(){
				var all = 0, data = [], commas = [], ii = 23, dataWidth = [], $thisBar, workaround = [], workaroundCommas = [];
				
				$("#candidates_options_" + race + "_chosen").css("visibility","visible").insertAfter("#cf-expense-type .cf-title");
				$("#expenses_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");				
				//get data
				for (i=0 ; i < 27;  i++){
					data[i] = parseInt(summaryDB[ii][thisCandidate]);
					commas[i] = utilityFunctions.commaSeparateNumber(data[i]);
					all = all + data[i];
					ii = ii + 1;
				}

				//find highest value in array
				var maxValue = Math.max.apply(null, data);
				
				//figure out the width for each bar
				for (i = 0 ; i < data.length ; i++){
					dataWidth[i] = (data[i] / maxValue) * dimensions.maxBarWidth;
				}

				//populate data vlaues for sorting
				for (i=0 ; i < data.length ; i++){
					$("#cf-expense-type .bar-row:eq(" + i + ")").attr("value",data[i]);
				}
				
				//sort
				chartFunctions.sortBars();
				
				//weird sorting/drawing workaround (EVALUATE MORE LATER)
				for (i=0 ; i < data.length ; i++){
					workaround[i] = parseInt($("#cf-expense-type .bar-row:eq(" + i + ")").attr("id") - 1);
				}
				
				//draw charts
				for (i=0 ; i < data.length ; i++){
					$("#cf-expense-type .bar-data:eq(" + i + ") p").text("$" + commas[workaround[i]]);
					$("#cf-expense-type .bar-data:eq(" + i + ")").animate({
						width:dataWidth[workaround[i]]
					})
				}
				
				//destroy no value bars
				$(".bar-row[value='0']").css("display","none");
							
				$("#cf-expense-type .bar-data").css("background","#CE5F75");
				$("#cf-expense-type .cf-title h2").text("Total Cash Spent by Expense Type 2013-14");
				$("#cf-expense-type").append("<h4 class=\"chart-h4\" style=\"color:rgb(206, 95, 117);\">$" + utilityFunctions.commaSeparateNumber(all) + " spent total</h4>");
				$("#cf-expense-type").append("<p class=\"chart-footer\">Cash spent includes all expenses including accured expenses. Numbers are rounded to nearest dollar. Expense type omitted if no expense was made.</p>");
			},
			drawRetired:function(){
				var data = [];
				var all = 0;
				var dataWidth = [];
				var commas = [];
				$("#contribute_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");
				//size up data
				var ii = raceColumns[race];
				for (i=0 ; i < raceTotal[race]; i++){
					data[i] = parseInt(mainDB[22][ii]);
					commas[i] = utilityFunctions.commaSeparateNumber(data[i]);
					ii = ii + 1;
				}
				//find total
				for (i=0 ; i < data.length ; i++){
					all = all + data[i]
				}

				//find highest value in array
				var maxValue = Math.max.apply(null, data);

				//figure out the width for each bar
				for (i = 0 ; i < data.length ; i++){
					dataWidth[i] = (data[i] / maxValue) * dimensions.maxBarWidth;
				}

				//populate data
				for (i=0 ; i < data.length ; i++){
					$("#cf-summary .bar-row:eq(" + i + ")").attr("value",data[i]);
					$("#cf-summary .bar-data:eq(" + i + ") p").text("$" + commas[i]);
					$("#cf-summary .bar-data:eq(" + i + ")").animate({
						width:dataWidth[i]
					})
				}

				//meta
				$(".bar-data").css("background","#91cf60");
				$("#cf-summary .cf-title h2").text("Total Cash from Retirees: 2013-14");
				$("#cf-summary").append("<h4 class=\"chart-h4\">$" + utilityFunctions.commaSeparateNumber(all) + " contributed total</h4>");
				$("#cf-summary").append("<p class=\"chart-footer\">This includes all reported contributions and miscellaneous increases to cash from people who identified themselves as Retired.</p>");
				chartFunctions.sortBars();
				$(".bar-row[value='0']").css("display","none");
			},
			drawSpent:function(){
				var data = [];
				var all = 0;
				var dataWidth = [];
				var commas = [];
				$("#expenses_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#expenses_options_chosen .chosen-single span").text(defaultSubTopics[1]);
				$("#cf-choose-text h4:eq(2)").css("display","block");
				//size up data
				var ii = raceColumns[race];
				for (i=0 ; i < raceTotal[race] ;  i++){
					data[i] = parseInt(summaryDB[18][ii]);
					commas[i] = utilityFunctions.commaSeparateNumber(data[i]);
					ii = ii + 1;
				}

				//find total
				for (i=0 ; i < data.length ; i++){
					all = all + data[i]
				}

				//find highest value in array
				var maxValue = Math.max.apply(null, data);

				//figure out the width for each bar
				for (i = 0 ; i < data.length ; i++){
					dataWidth[i] = (data[i] / maxValue) * dimensions.maxBarWidth;
				}

				//populate data
				for (i=0 ; i < data.length ; i++){
					$("#cf-summary .bar-row:eq(" + i + ")").attr("value",data[i]);
					$("#cf-summary .bar-data:eq(" + i + ") p").text("$" + commas[i]);
					$("#cf-summary .bar-data:eq(" + i + ")").animate({
						width:dataWidth[i]
					})
				}

				$("#cf-summary .bar-data").css("background","#CE5F75");
				$("#cf-summary .cf-title h2").text("Total Cash Spent 2013-14");
				$("#cf-summary").append("<h4 class=\"chart-h4\" style=\"color:#CE5F75;\">$" + utilityFunctions.commaSeparateNumber(all) + " spent total</h4>");
				$("#cf-summary").append("<p class=\"chart-footer\">Cash spent includes all expenses including accured expenses. Numbers are rounded to nearest dollar.</p>");
				chartFunctions.sortBars();
				$(".bar-row[value='0']").css("display","none");
			},
			drawCashPerDays:function(){
				var data = [], dataWidth = [], commas = [], all = 0;
				$("#contribute_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");
				//size up data
				var ii = raceColumns[race];
				for (i=0 ; i < raceTotal[race]; i++){
					data[i] = parseInt(mainDB[7][ii]);
					commas[i] = utilityFunctions.commaSeparateNumber(data[i]);
					ii = ii + 1;
				}

				//find total
				all = parseInt(mainDB[7][1]);


				//find highest value in array
				var maxValue = Math.max.apply(null, data);

				//figure out the width for each bar
				for (i = 0 ; i < data.length ; i++){
					dataWidth[i] = (data[i] / maxValue) * dimensions.maxBarWidth;
				}

				//populate data
				for (i=0 ; i < data.length ; i++){
					$("#cf-summary .bar-row:eq(" + i + ")").attr("value",data[i]);
					$("#cf-summary .bar-data:eq(" + i + ") p").text("$" + commas[i]);
					$("#cf-summary .bar-data:eq(" + i + ")").animate({
						width:dataWidth[i]
					})
				}

				//meta
				$(".bar-data").css("background","#91cf60");
				$("#cf-summary .cf-title h2").text("Cash Raised per Days Fundraising");
				$("#cf-summary").append("<h4 class=\"chart-h4\">Average Overall $" + utilityFunctions.commaSeparateNumber(all) + "</h4>");
				$("#cf-summary").append("<p class=\"chart-footer\">Figures represent the amount of cash contributions, including misc. increases to cash, divided by the number of days fundraising. Day one for fundraising is based off the earliest campaign contribution disclosed by the candidate.</p>");
				chartFunctions.sortBars();
				$(".bar-row[value='0']").css("display","none");
			},
			drawGeography:function(){
				var data = [], dataWidth = [], total = [], commas = [], colors = [];
				//unhide stacked option
				$("#stacked_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");	
				$(".cf-title h2").html("Where Contributions Came From <br>(hover over bars for details)");
					
				if (stacked === 0){
					//size up data
					var ii = raceColumns[race];
					for (i=0 ; i < raceTotal[race] ;  i++){
						data[i] = new Array();
						commas[i] = new Array();
						data[i][0] = parseInt(summaryDB[19][ii]);
						data[i][1] = parseInt(summaryDB[20][ii]) - data[i][0];
						data[i][2] = parseInt(summaryDB[21][ii]) - (data[i][0] + data[i][1]);
						data[i][3] = parseInt(summaryDB[22][ii]);
						commas[i][0] = utilityFunctions.commaSeparateNumber(data[i][0]);
						commas[i][1] = utilityFunctions.commaSeparateNumber(data[i][1]);
						commas[i][2] = utilityFunctions.commaSeparateNumber(data[i][2]);
						commas[i][3] = utilityFunctions.commaSeparateNumber(data[i][3]);
						ii = ii + 1;
					}
					//calculate the total for each candidate
					for (i=0 ; i < raceTotal[race] ; i++){
						total[i] = (data[i][0] + data[i][1] + data[i][2] + data[i][3]);
					}
					//sorting by first legend item
					for (i=0 ; i < raceTotal[race] ; i++){
						$("#cf-stacked .stacked-bar-row:eq(" + i + ")").attr("value",((data[i][0] / total[i]) * 100));
					}
					//populate data
					colors = stackedControl.geography.legendColor;
					for (i=0 ; i < raceTotal[race] ; i++){
						for (x = 0 ; x < stackedControl.geography.legendItems ; x++){
							$("#cf-stacked .stacked-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").css("background",colors[x] ).animate({
								width:((data[i][x] / total[i]) * 100) + "%"
							}).attr("value", data[i][x]);
							$("#cf-stacked .stacked-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").caltip({
								title:stackedControl.geography.legendLabels[x],
								content:"$" + commas[i][x] + " (" + Math.round(((data[i][x] / total[i]) * 100)) + "%" + ")"
							})
						}
					}
					//footer
					$("#cf-stacked").append("<p class=\"chart-footer\">" + stackedControl.geography.footer + "</p>");
				}		
				else if (stacked === 1){
					//size up data
					var ii = raceColumns[race];
					for (i=0 ; i < raceTotal[race] ;  i++){
						data[i] = new Array();
						commas[i] = new Array();
						data[i][0] = parseInt(summaryDB[19][ii]);
						data[i][1] = parseInt(summaryDB[20][ii]) - data[i][0];
						data[i][2] = parseInt(summaryDB[21][ii]) - (data[i][0] + data[i][1]);
						data[i][3] = parseInt(summaryDB[22][ii]);
						commas[i][0] = utilityFunctions.commaSeparateNumber(data[i][0]);
						commas[i][1] = utilityFunctions.commaSeparateNumber(data[i][1]);
						commas[i][2] = utilityFunctions.commaSeparateNumber(data[i][2]);
						commas[i][3] = utilityFunctions.commaSeparateNumber(data[i][3]);
						ii = ii + 1;
					}
					//calculate the total for each candidate
					for (i=0 ; i < raceTotal[race] ; i++){
						total[i] = (data[i][0] + data[i][1] + data[i][2] + data[i][3]);
					}
					//sorting by first legend item
					for (i=0 ; i < raceTotal[race] ; i++){
						$("#cf-stacked .stacked-bar-row:eq(" + i + ")").attr("value",((data[i][0] / total[i]) * 100));
					}
					//find highest value in array
					var maxValue = Math.max.apply(null, total);
					//figure out the width for each bar
					for (i = 0 ; i < total.length ; i++){
						dataWidth[i] = (total[i] / maxValue) * dimensions.maxBarWidth;
					}
					//populate data
					colors = stackedControl.geography.legendColor;
					for (i=0 ; i < raceTotal[race] ; i++){
						for (x = 0 ; x < stackedControl.geography.legendItems ; x++){
							$("#cf-stacked .stacked-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").css("background",colors[x] ).animate({
								width:((data[i][x] / total[i]) * 100) + "%"
							}).attr("value", data[i][x]);
							$("#cf-stacked .stacked-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").caltip({
								title:stackedControl.geography.legendLabels[x],
								content:"$" + commas[i][x] + " (" + Math.round(((data[i][x] / total[i]) * 100)) + "%" + ")"
							})
						}
					}				
					for (i=0 ; i < total.length ; i++){
						$("#cf-stacked .stacked-bar-row:eq(" + i + ")").attr("value",total[i]);
						$("#cf-stacked .bar-data:eq(" + i + ")").animate({
							width:dataWidth[i] + "px"
						})
					}
					//footer
					$("#cf-stacked").append("<p class=\"chart-footer\">" + stackedControl.geography.footer + "</p>");
				}		
				chartFunctions.sortGeo();
			},
			drawAllDonors:function(){
				$("#candidates_options_" + race + "_chosen").css("visibility","visible").insertAfter("#cf-iframe .cf-title");
				$(".cf-iframe-hold").append(mainDB[28][thisCandidate]);	
				$("#cf-iframe .cf-title h2").text("All Donors 2013-14");
			
			},
			drawIEoverview:function(){
				var data = [], split, ieUpdated, dataWidth = [], commas = [], colors = [], total = [], all = 0;
				$("#ie_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#ie_options_chosen .chosen-single span").text(defaultSubTopics[2]);
				$("#cf-choose-text h4:eq(2)").css("display","block");
								
				//size up data
				var ii = raceColumns[race] + 2;
				for (i=0 ; i < raceTotal[race] ;  i++){
					var support = 0, oppose = 0, iii = 0, iv = 1;
					data[i] = new Array();
					commas[i] = new Array();
					for (x=0 ; x < ieNames.length ; x++){
						support = support + parseInt(ieDB[x+iii][ii]);
						oppose = oppose + parseInt(ieDB[x+iv][ii]);
						iii = iii + 1;
						iv = iv + 1;
					}
					data[i][0] = support; //support total
					data[i][1] = oppose;
					commas[i][0] = utilityFunctions.commaSeparateNumber(data[i][0]);
					commas[i][1] = utilityFunctions.commaSeparateNumber(data[i][1]);
					ii = ii + 1;
				}
				//calculate the total for each candidate
				for (i=0 ; i < raceTotal[race] ; i++){
					total[i] = (data[i][0] + data[i][1]);
				}
				
				//get total overall
				for (i=0; i < total.length; i++){
					all = all + total[i];
				}
				
				//sorting by first legend item
				for (i=0 ; i < raceTotal[race] ; i++){
					$("#cf-ie .ie-bar-row:eq(" + i + ")").attr("value",((data[i][0] / total[i]) * 100));
				}
								
				//populate data
				colors = stackedControl.ie.legendColor;
				for (i=0 ; i < raceTotal[race] ; i++){
					for (x = 0 ; x < stackedControl.ie.legendItems ; x++){
						$("#cf-ie .ie-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").css("background",colors[x] ).animate({
							width:((data[i][x] / total[i]) * 100) + "%"
						}).attr("value", data[i][x]);
						$("#cf-ie .ie-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").caltip({
							title:stackedControl.ie.legendLabels[x],
							content:"$" + commas[i][x] + " (" + Math.round(((data[i][x] / total[i]) * 100)) + "%" + ")"
						})
					}
				}
				

				//footer
				$("#cf-ie .cf-title h2").html("Independent Expenditures Overview <br> (hover over bars for details)");
				$("#cf-ie").append("<h4 class=\"chart-h4\" style=\"color:rgb(206, 95, 117);\">$" + utilityFunctions.commaSeparateNumber(all) + " spent total</h4>");
				$("#cf-ie").append("<p class=\"chart-footer\">" + stackedControl.ie.footer + "</p>");
				//sort
				chartFunctions.sortIE();
				//chartFunctions.sortGeo();
				$(".ie-bar-row[value='NaN']").css("display","none");
			},
			drawIEcommittees:function(){
				$("#ie_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");
				var parseData = [], data = [], dataWidth = [], commas = [], colors = [], total = [], all = 0;
				
				var ii = raceColumns[race] + 2;
				//Grab IE totals for relavant race
				for (x=0 ; x < ieLength ; x++){
					parseData[x] = 0;
					for (i=0 ; i < raceTotal[race] ; i++){
						parseData[x] = parseData[x] + parseInt(ieDB[x][ii]);
						ii = ii + 1;
					}
					ii = raceColumns[race] + 2;
				}
				
				//size up data
				ii = 0;
				for (i=0 ; i < ieNames.length ;  i++){
					data[i] = new Array();
					commas[i] = new Array();
					data[i][0] = parseData[ii];
					data[i][1] = parseData[ii+1];
					commas[i][0] = utilityFunctions.commaSeparateNumber(data[i][0]);
					commas[i][1] = utilityFunctions.commaSeparateNumber(data[i][1]);
					ii = ii + 2;
				}
								
				//calculate the total for each candidate
				for (i=0 ; i < ieNames.length ; i++){
					total[i] = (data[i][0] + data[i][1]);
				}

				//get total overall
				for (i=0; i < total.length; i++){
					all = all + total[i];
				}
				
				//sorting by first legend item
				for (i=0 ; i < ieNames.length ; i++){
					$("#cf-ie .ie-bar-row:eq(" + i + ")").attr("value",((data[i][0] / total[i]) * 100));
				}
				//find highest value in array
				var maxValue = Math.max.apply(null, total);
				
				//figure out the width for each bar
				for (i = 0 ; i < total.length ; i++){
					dataWidth[i] = (total[i] / maxValue) * dimensions.maxBarWidth;
				}
				
				//populate data
				colors = stackedControl.ie.legendColor;
				for (i=0 ; i < ieNames.length ; i++){
					for (x = 0 ; x < stackedControl.ie.legendItems ; x++){
						$("#cf-ie .ie-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").css("background",colors[x] ).animate({
							width:((data[i][x] / total[i]) * 100) + "%"
						}).attr("value", data[i][x]);
						$("#cf-ie .ie-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").caltip({
							title:stackedControl.ie.legendLabels[x],
							content:"$" + commas[i][x] + " (" + Math.round(((data[i][x] / total[i]) * 100)) + "%" + ")"
						})
					}
				}				
				for (i=0 ; i < total.length ; i++){
					$("#cf-ie .ie-bar-row:eq(" + i + ")").attr("value",total[i]);
					$("#cf-ie .bar-data:eq(" + i + ")").animate({
						width:dataWidth[i] + "px"
					})
				}
				//meta
				$("#cf-ie .cf-title h2").html("Independent Expenditures Committees <br> (hover over bars for details)");
				$("#cf-ie").append("<h4 class=\"chart-h4\" style=\"color:rgb(206, 95, 117);\">$" + utilityFunctions.commaSeparateNumber(all) + " spent total</h4>");
				$("#cf-ie").append("<p class=\"chart-footer\">" + stackedControl.ie.footer + "</p>");
				
				//sort
				chartFunctions.sortIE();
				
				//kill zero rows
				$(".ie-bar-row[value='NaN']").add(".ie-bar-row[value='0']").css("display","none");
			},
			drawIEcandidates:function(){
				$("#ie_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");
				$("#candidates_options_" + race + "_chosen").css("visibility","visible").insertAfter("#cf-ie-legend");
				
				$("#ie_options_chosen").css("visibility","visible").insertAfter("#overall_options_chosen");
				$("#cf-choose-text h4:eq(2)").css("display","block");
				var parseData = [], data = [], dataWidth = [], commas = [], colors = [], total = [], all = 0;
								
				//size up data
				ii = 0;
				for (i=0 ; i < ieNames.length ;  i++){
					data[i] = new Array();
					commas[i] = new Array();
					data[i][0] = parseInt(ieDB[ii][thisCandidate + 2]);
					data[i][1] = parseInt(ieDB[ii+1][thisCandidate + 2]);
					commas[i][0] = utilityFunctions.commaSeparateNumber(data[i][0]);
					commas[i][1] = utilityFunctions.commaSeparateNumber(data[i][1]);
					ii = ii + 2;
					
				}
								
				//calculate the total for each candidate
				for (i=0 ; i < ieNames.length ; i++){
					total[i] = (data[i][0] + data[i][1]);
				}

				//get total overall
				for (i=0; i < total.length; i++){
					all = all + total[i];
				}
				
				//sorting by first legend item
				for (i=0 ; i < ieNames.length ; i++){
					$("#cf-ie .ie-bar-row:eq(" + i + ")").attr("value",((data[i][0] / total[i]) * 100));
				}
				//find highest value in array
				var maxValue = Math.max.apply(null, total);
				
				//figure out the width for each bar
				for (i = 0 ; i < total.length ; i++){
					dataWidth[i] = (total[i] / maxValue) * dimensions.maxBarWidth;
				}
				
				//populate data
				colors = stackedControl.ie.legendColor;
				for (i=0 ; i < ieNames.length ; i++){
					for (x = 0 ; x < stackedControl.ie.legendItems ; x++){
						$("#cf-ie .ie-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").css("background",colors[x] ).animate({
							width:((data[i][x] / total[i]) * 100) + "%"
						}).attr("value", data[i][x]);
						$("#cf-ie .ie-bar-row:eq(" + i + ") .bar-seg:eq(" + x + ")").caltip({
							title:stackedControl.ie.legendLabels[x],
							content:"$" + commas[i][x] + " (" + Math.round(((data[i][x] / total[i]) * 100)) + "%" + ")"
						})
					}
				}				
				for (i=0 ; i < total.length ; i++){
					$("#cf-ie .ie-bar-row:eq(" + i + ")").attr("value",total[i]);
					$("#cf-ie .bar-data:eq(" + i + ")").animate({
						width:dataWidth[i] + "px"
					})
				}
				//meta
				$("#cf-ie .cf-title h2").html("Independent Expenditures to Candidates <br> (hover over bars for details)");
				$("#cf-ie").append("<h4 class=\"chart-h4\" style=\"color:rgb(206, 95, 117);\">$" + utilityFunctions.commaSeparateNumber(all) + " spent total</h4>");
				$("#cf-ie").append("<p class=\"chart-footer\">" + stackedControl.ie.footer + "</p>");
				//sort
				chartFunctions.sortIE();
				//kill zero rows
				$(".ie-bar-row[value='NaN']").add(".ie-bar-row[value='0']").css("display","none");
			},
			// ------- REFRESHING CANVAS ------- //
			redrawCanvas:function(){
				//magically hide and show chart divs
				//$("#cf-summary .bar-chart").css("display","block");
				//$("#cf-summary").css("display","block");
				//Change view
				if (view === "Cash Raised" || view === "Raised Summary"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-summary").css("display","block");
					chartFunctions.drawContributions()
				}
				else if (view === "IE Summary" || view == "Outside Money"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-ie").css("display","block");
					chartFunctions.drawIEoverview();
				}
				else if (view === "IE Committees"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-ie").css("display","block");
					chartFunctions.drawIEcommittees();
				}
				else if (view === "IE Candidates"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-ie").css("display","block");
					chartFunctions.drawIEcandidates();
				}
				else if (view === "All Donors"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-iframe").css("display","block");
					chartFunctions.drawAllDonors();
				}
				else if (view === "Summary" || view === "Ranking"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-overview").css("display","block");
					chartFunctions.drawSummary();
				}
				else if (view === "Stats"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-overview").css("display","block");
					chartFunctions.drawStatistics();
				}
				else if (view === "CPD"){			
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-summary").css("display","block");
					chartFunctions.drawCashPerDays();
				}
				else if (view === "Top Donors"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-donors").css("display","block");
					chartFunctions.drawTopDonors();
				}
				else if (view === "Loans"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-summary").css("display","block");
					chartFunctions.drawLoans();
				}
				else if (view === "Retirees"){
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-summary").css("display","block");
					chartFunctions.drawRetired();
				}
				else if (view === "Geography"){
					$(".cf-canvas").css("display","none");
					$("#cf-stacked").css("display","block");
					chartFunctions.resetCanvas(view);
					chartFunctions.renameCanvas(view);
					chartFunctions.drawGeography();
				}
				else if (view === "Cash Spent" || view === "Expenses Summary"){
					chartFunctions.resetCanvas(view)
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-summary").css("display","block");
					chartFunctions.drawSpent()
				}
				else if (view === "Expense Type"){
					chartFunctions.resetCanvas(view)
					chartFunctions.renameCanvas(view);
					$(".cf-canvas").css("display","none");
					$("#cf-expense-type").css("display","block");
					chartFunctions.drawExpenseType()
				}
				else if (view === "Achievements"){
					$(".cf-canvas").css("display","none");
					$("#cf-achieve").css("display","block").animate({
						height:300
					});
				}
			},
			resetCanvas:function(view){
				//visibility stacked and summary options
				$("#stacked_options_chosen").css("visibility","hidden");
				$("#summary_options_chosen").css("visibility","hidden");
				$("#contribute_options_chosen").css("visibility","hidden");
				$("#expenses_options_chosen").css("visibility","hidden");
				$("#ie_options_chosen").css("visibility","hidden");
				$("#cf-choose-text h4:eq(2)").css("display","none");
				$("#cf-chart").css("overflow-y","auto");
				for (i = 0 ; i < raceTotal.length ; i++){
					$("#candidates_options_"+i+"_chosen").css("visibility","hidden");
				}
				//reset text and colors for chart
				$(".chart-h4").add(".chart-footer").add(".bar-row").add(".stacked-bar-row").add(".ie-bar-row").add(".cf-legend-opt").add(".cf-ie-legend-opt").add(".summary-row").add(".donor-row").remove();

				if (view === "Cash Raised" || view === "Raised Summary" || view === "Retirees" || view === "CPD" || view === "Loans" || view === "Cash Spent" || view === "Expenses Summary"){			
					for (i = 1 ; i < raceTotal[race] + 1; i++){
						$("#cf-summary .bar-chart").append("<div class=\"bar-row\" id=\"" + i + "\"><div class=\"bar-label\"><p class=\"the-label\"></p></div><div class=\"bar-data\"><p></p></div></div>");
					}
				}		
				else if (view === "IE Summary" || view === "Outside Money"){
					$(".cf-ie-head").css("height","170px");
					//populate bars based on number of candidates
					for (i = 1 ; i < raceTotal[race] + 1; i++){
						$(".ie-bar-chart").append(stackedControl.ie.legendBars);
					}				
					//tag each row with unique ID
					for (i = 1 ; i < raceTotal[race] + 1; i++){
						$("#cf-ie .ie-bar-row:eq(" + i + ")").attr("id", i);
					}
					//Give Max Width to Bars
					$(".ie-bar-row").css("width", dimensions.overall);
					$(".ie-bar-row .bar-data").css("width", dimensions.maxBarWidth);
					//populate legend
					for (i = 0 ; i < stackedControl.ie.legendItems ; i++){
						$("#cf-ie-legend").append("<div class=\"cf-ie-legend-opt\"><p>" + stackedControl.ie.legendLabels[i] + "</p></div>");
						$(".cf-ie-legend-opt:eq(" + i + ")").css("background", stackedControl.ie.legendColor[i]);
					}					
				}
				else if (view === "IE Committees"){
					$(".cf-ie-head").css("height","170px");
					//populate IE committees
					for (i=1 ; i < ieNames.length ; i++){
						$(".ie-bar-chart").append(stackedControl.ie.legendBars);
					}
					//tag each row with unique ID
					for (i=1 ; i < ieNames.length ; i++){
						$(".ie-bar-chart").append(stackedControl.ie.legendBars);
					}
					//Give Max Width to Bars
					$(".ie-bar-row").css("width", dimensions.overall);
					$(".ie-bar-row .bar-data").css("width", dimensions.maxBarWidth);
					//populate legend
					for (i = 0 ; i < stackedControl.ie.legendItems ; i++){
						$("#cf-ie-legend").append("<div class=\"cf-ie-legend-opt\"><p>" + stackedControl.ie.legendLabels[i] + "</p></div>");
						$(".cf-ie-legend-opt:eq(" + i + ")").css("background", stackedControl.ie.legendColor[i]);
					}
				}
				else if (view === "IE Candidates"){
					$(".cf-ie-head").css("height","260px");
					//populate IE committees
					for (i=1 ; i < ieNames.length ; i++){
						$(".ie-bar-chart").append(stackedControl.ie.legendBars);
					}
					//tag each row with unique ID
					for (i=1 ; i < ieNames.length ; i++){
						$(".ie-bar-chart").append(stackedControl.ie.legendBars);
					}
					//Give Max Width to Bars
					$(".ie-bar-row").css("width", dimensions.overall);
					$(".ie-bar-row .bar-data").css("width", dimensions.maxBarWidth);
					//populate legend
					for (i = 0 ; i < stackedControl.ie.legendItems ; i++){
						$("#cf-ie-legend").append("<div class=\"cf-ie-legend-opt\"><p>" + stackedControl.ie.legendLabels[i] + "</p></div>");
						$(".cf-ie-legend-opt:eq(" + i + ")").css("background", stackedControl.ie.legendColor[i]);
					}
				}
				else if (view === "Expense Type"){
					for (i = 1 ; i < 28; i++){
						$("#cf-expense-type .bar-chart").append("<div class=\"bar-row\" id=\"" + i + "\"><div class=\"bar-label\"><p class=\"the-label\"></p></div><div class=\"bar-data\"><p></p></div></div>");
					}
				}
				else if (view === "All Donors"){
					$("#cf-chart").css("overflow-y","hidden");
					$("#cf-iframe iframe").remove();
				}
				else if (view === "Geography"){
					var geographyStackedSubBars;
					//determine number of stacked sub bars
					switch(stackedControl.geography.legendItems){
						case 2:
							geographyStackedSubBars = stackedControl.geography.legendBars.two;
							break;
						case 3:
							geographyStackedSubBars = stackedControl.geography.legendBars.three;
							break;
						case 4:
							geographyStackedSubBars = stackedControl.geography.legendBars.four;
							break;
					}
					//populate bars based on number of candidates
					for (i = 1 ; i < raceTotal[race] + 1; i++){
						$(".stacked-bar-chart").append(geographyStackedSubBars);
					}				
					//tag each row with unique ID
					for (i = 1 ; i < raceTotal[race] + 1; i++){
						$("#cf-stacked .stacked-bar-row:eq(" + i + ")").attr("id", i);
					}
					//Give Max Width to Bars
					$(".stacked-bar-row").css("width", dimensions.overall);
					$(".stacked-bar-row .bar-data").css("width", dimensions.maxBarWidth);
					//populate legend
					for (i = 0 ; i < stackedControl.geography.legendItems ; i++){
						$("#cf-legend").append("<div class=\"cf-legend-opt\"><p>" + stackedControl.geography.legendLabels[i] + "</p></div>");
						$(".cf-legend-opt:eq(" + i + ")").css("background", stackedControl.geography.legendColor[i]);
					}

				}			
				else if (view === "Summary" || view === "Ranking"){
					for (i = 1 ; i < raceTotal[race] + 1; i++){
						$("#cf-overview").append("<div class=\"summary-row\" id=\""+i+"\"><div class=\"summary-cell\"><img src=\"\"><p></p><p></p></div><div class=\"summary-cell\"><p></p><p></p></div><div class=\"summary-cell\"><p></p><p></p></div><div class=\"summary-cell\"><p></p><p></p></div></div>");
					}
					$("#cf-head-label-0").html("<p style=\"left:31%\">War Chest</p>");
					$("#cf-head-label-1").html("<p style=\"left:54%\">Cash Raised</p>");
					$("#cf-head-label-2").html("<p style=\"left:80%\">Cash Spent</p>");
				}
				else if (view === "Stats"){
					for (i = 1 ; i < raceTotal[race] + 1; i++){
						$("#cf-overview").append("<div class=\"summary-row\" id=\""+i+"\"><div class=\"summary-cell\"><img src=\"\"><p></p><p></p></div><div class=\"summary-cell\"><p></p><p></p></div><div class=\"summary-cell\"><p></p><p></p></div><div class=\"summary-cell\"><p></p><p></p></div></div>");
					}		
					$("#cf-head-label-0").html("<p style=\"left:29%\">Contributions</p>");
					$("#cf-head-label-1").html("<p style=\"left:52%\">Average Amount</p>");
					$("#cf-head-label-2").html("<p style=\"left:78%\">Days Fundraising</p>");				
					$("#cf-donors").append("<p class=\"chart-footer\">Average Amount is the total amount of reported cash contributions divided by the number of reported cash contributions. Days Fundraising starts with the first disclosed reported contribution listed on campaigin finance disclosure form.</p>");			
				}
				else if (view === "Top Donors"){
					for (i = 1 ; i < raceTotal[race] + 1; i++){
						$("#cf-donors").append("<div class=\"donor-row\" id=\""+i+"\"><div class=\"donor-cell\"><img src=\"\"><p></p><p></p></div><div class=\"donor-cell\"><p><span></span><br><span></span></p><p><span></span><br><span></span></p><p><span></span><br><span></span></p></div><div class=\"donor-cell\"><p><span></span><br><span></span></p><p><span></span><br><span></span></p><p><span></span><br><span></span></p></div></div>");
					}
					$("#cf-donors").append("<p class=\"chart-footer\">Top contributors include the total value of both cash and non-cash contributions from both individuals and entites that gave to the candidate. In the event of a tie, the top contributors are listed alphabetically. Top employers include the total value of both cash and non-cash contributions from both individuals who work for the employer and contributions made by the employer itself. Contributions where a person who identified themself as Retired have been excluded from this list as it is an entire category in and of itself.</p>");
				}	
				//resize labels
				$(".bar-label").css("width",dimensions.label);
			},
			renameCanvas:function(view){
					var ii = raceColumns[race];
					if (view === "Cash Raised" || view === "Raised Summary" || view === "Cash Spent" || view === "CPD" || view === "Retirees" || view === "Loans" || view === "Expenses Summary"){
						for (i = 0; i < raceTotal[race]; i++){
							$("#cf-summary .bar-row:eq("+ i +") .bar-label p").html(summaryDB[0][ii]);
							ii = ii + 1;
						}			
					}
					else if (view === "Expense Type"){
						var iii = 23;
						for (i = 0; i < 27; i++){
							$("#cf-expense-type .bar-row:eq("+ i +") .bar-label p").html(summaryDB[iii][0]);
							iii = iii + 1;
						}
					}
					else if (view === "IE Summary" || view === "Outside Money"){
						for (i = 0; i < raceTotal[race]; i++){
							$("#cf-ie .ie-bar-row:eq("+ i +") .bar-label p").html(summaryDB[0][ii]);
							ii = ii + 1;
						}
					}
					else if (view === "IE Committees"){
						for (i=0 ; i < ieNames.length ; i++){
							$("#cf-ie .ie-bar-row:eq("+ i +") .bar-label p").html(ieNames[i]);
						}
						
					}
					else if (view === "IE Candidates"){
						for (i=0 ; i < ieNames.length ; i++){
							$("#cf-ie .ie-bar-row:eq("+ i +") .bar-label p").html(ieNames[i]);
						}
						
					}
					else if (view === "Geography"){
						for (i = 0; i < raceTotal[race]; i++){
							$("#cf-stacked .stacked-bar-row:eq("+ i +") .bar-label p").html(summaryDB[0][ii]);
							ii = ii + 1;
						}
					}
					else if (view === "Summary" || view === "Ranking" || view === "Stats"){
						for (i = 0; i < raceTotal[race]; i++){
							$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(0) img").attr("src", mainDB[2][ii]);
							$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(0) p:eq(0)").html(summaryDB[0][ii]);
							$("#cf-overview .summary-row:eq("+ i +") .summary-cell:eq(0) p:eq(1)").html(summaryDB[1][ii]);
							ii = ii + 1;
						}			
					}
					else if (view === "Top Donors"){
						for (i = 0; i < raceTotal[race]; i++){
							$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(0) img").attr("src", mainDB[2][ii]);
							$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(0) p:eq(0)").html(summaryDB[0][ii]);
							$("#cf-donors .donor-row:eq("+ i +") .donor-cell:eq(0) p:eq(1)").html(summaryDB[1][ii]);
							ii = ii + 1;
						}
					}
			},
			// ------- SORTING ------- //
			sortSummary:function(){
					var $wrapper = $('#cf-overview'),
				        $articles = $wrapper.find('.summary-row');
				    [].sort.call($articles, function(a,b) {
				        return +$(b).attr('value') - +$(a).attr('value');
				    });
				    $articles.each(function(){
				        $wrapper.append(this);
				    });
			},
			sortStatistics:function(){
				var $wrapper = $('#cf-overview'),
			        $articles = $wrapper.find('.summary-row');
			    [].sort.call($articles, function(a,b) {
			        return +$(b).attr('value') - +$(a).attr('value');
			    });
			    $articles.each(function(){
			        $wrapper.append(this);
			    });
			},
			sortGeo:function(){
				//percent or total sort
				if (stacked === 0){
					var $wrapper = $('.stacked-bar-chart'),
				        $articles = $wrapper.find('.stacked-bar-row');
				    [].sort.call($articles, function(a,b) {
				        return +$(b).attr('value') - +$(a).attr('value');
				    });
				    $articles.each(function(){
				        $wrapper.append(this);
				    });
				}
				else {
					var $wrapper = $('.stacked-bar-chart'),
				        $articles = $wrapper.find('.stacked-bar-row');
				    [].sort.call($articles, function(a,b) {
				        return +$(b).attr('value') - +$(a).attr('value');
				    });
				    $articles.each(function(){
				        $wrapper.append(this);
				    });
				}
			},
			sortBars:function(){
				var $wrapper = $('.bar-chart'),
			        $articles = $wrapper.find('.bar-row');
			    [].sort.call($articles, function(a,b) {
			        return +$(b).attr('value') - +$(a).attr('value');
			    });
			    $articles.each(function(){
			        $wrapper.append(this);
			    });
			},
			sortIE:function(){
				var $wrapper = $('.ie-bar-chart'),
			        $articles = $wrapper.find('.ie-bar-row');
			    [].sort.call($articles, function(a,b) {
			        return +$(b).attr('value') - +$(a).attr('value');
			    });
			    $articles.each(function(){
			        $wrapper.append(this);
			    });
			}
		}

	// ------- ADJUST DIMENSIONS ------- //
	$(document).ready(function(){
		$("#loading").add("#cf-choose-text").add("#cf-container").add("#cf-options").add("#cf-chart").add("#cf-legend").add(".ie-bar-chart").add(".stacked-bar-chart").add("#cand-highlight").add("#cf-options").add("#cf-choose").add("#cf-contribute").add(".bar-chart").add(".cf-stack-head").add(".cf-head").add(".cf-title").add("#cf-summary").add("#cf-overview").add(".summary-row").css("width",dimensions.overall);
	});
// ------- FUNNY GREETINGS ------- //
	$(document).ready(function(){
		var random = Math.round(Math.random() * 10);
		if (random === 0){
			$("#loading h1:eq(0)").html("Scanning Disclosure Forms...");
		}
		else if (random === 1){
			$("#loading h1:eq(0)").html("Lubricating Political Wheels...");
		} 
		else if (random === 2){
			$("#loading h1:eq(0)").html("Connecting to DAC Server...");
		}
		else if (random === 3){
			$("#loading h1:eq(0)").html("Circumventing NSA Snooping...");
		}
		else if (random === 4){
			$("#loading h1:eq(0)").html("Consulting Consultants...");
		}
		else if (random === 5){
			$("#loading h1:eq(0)").html("Populating Politicans...");
		}
		else if (random === 6){
			$("#loading h1:eq(0)").html("Sizing Up War Chests...");
		}
		else if (random === 7){
			$("#loading h1:eq(0)").html("Crossing T's and Dotting I's...");
		}
		else if (random === 8){
			$("#loading h1:eq(0)").html("Verifying Accounting...");
		}
		else if (random === 9){
			$("#loading h1:eq(0)").html("Handshaking Good Ole Boys...");
		}
		else if (random === 10){
			$("#loading h1:eq(0)").html("Dishing Out Dough...");
		}
	});
// ------- TABLETOP ------- //
	$(document).ready(function(){
			Tabletop.init( { key: gsheet,
		                     callback: chartFunctions.setTheScene,
		                     wanted: ["Summary","Main","IE_Overview"],
		                     debug: true } );
	});
