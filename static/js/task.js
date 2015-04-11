 /*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
	"instructions/instruct-1.html",
	"instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
	"instructions/instruct-ready.html"
];


var parseDatFile = function() {

}


/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }

        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}

/*********************
* Define the game *
*********************/
var Experiment = function() {

	// Variables
	var num_stim = 64;
	var current_trial = 0;

	var num_probs = 3; 				// number of problems to solve before game ends
	var current_prob = 0; 			// keep track of current problem
	var max_trials = 64; 			// quit or reduce difficulty if they don't solve current problem fast enough
	var solution_criterion = 4; 	// number of trials to classify correctly before advancing to next game
	var regress_criterion = 4;		// number of trials to classifiy incorretcly before difficulty goes down 1 level
	var consecutive_correct = 0; 	// keep track of number of consecutive correct responses 
	var consecutive_inccorect = 0;	// keep track of number of consecutive incorrect responses 
	var structure = 0; 				// rule determining category label assignments
	var max_structure = 4;			// maximum structures / rules defined in our switch (see below)

	var stim_onset; 					// time when stimulus is presented
	var listening = true; 				// is keyboard listening on?
	var max_time = 8; 					// max number of seconds per trial
	var timed_out = false; 				// out of time?
	var show_timeout;
	var show_timer, show_timer_2, timer;

	var times = [0, 500, 1000, 1500, 2000]; // Define trial event sequences
	var t = 0;

	// Pick the number of variable dimensions (happens num_probs times per game)
	var num_vary_dims = 6;

	// Pick the number of relevant dimensions (happens num_probs times per game)
	var num_rel_dims = 1;

	// Load master stimuli key (happens once per game)
	var stims_key = [[]];
	$.get("/static/images/stim_binary_6D/stimuli.txt", function(data){

		// stims_key = $.csv.toArrays(data,{delimiter:"",separator:"\n"});
		stims_key = CSVToArray(data," ");

		// Set total number of stimulus dimensions (happens once per game)
		var num_dims = stims_key[0].length - 1;

		// Load Stimuli
		stims = [];
	    for (var i = 0; i < num_stim; i++) {
	    	var arr = ["/static/images/stim_binary_6D/"+(i).toString()+".png"];
	    	stims.push(arr);
	    };

	    // create initial problem
		var prob_stims = []; 
		var prob_stims_key = [];
		var prob_stim_labels = [];
		new_problem();

		var next = function() {
			// Stop if game is over, else do next trial
			if (current_trial === max_trials) {
				finish();
			} else if (current_prob === num_probs) {
				finish();
			} else {

				current_trial += 1;				
				stim = prob_stims[current_trial];
				show_img(stim);

				// reset timer
				timer = max_time; 
				timed_out = false;
				
				stim_onset = new Date().getTime();
				d3.select("#time-left").html('This trial will end in ' + timer + ' seconds</p>')
				d3.select("#query").html('<span id="prompt">1</span><span id="prompt" style="margin-left:400px;">0</span>');
				
				// decrement timer every second
				show_timer = setInterval(
								function () {
									timer = timer - 1;
									d3.select("#time-left").html('This trial will end in ' + timer + ' seconds</p>')}, 
								1000);
				// if time is out, show time out warning
				show_timeout = setTimeout(
								function() {
									clearInterval(show_timer); 
									remove_img(); 
									show_respond_warning();
									d3.select("#query").html('<p id="prompt">Press "5" to continue</p>');
									timed_out = true}, 
								8100);
			}
		};
		
		var response_handler = function(e) {
			if (!listening) return;

			var key = e.keyCode;
			var response;

			if (timed_out) {
				switch (key) {
					case 53:
						response="-1";
						break;							
					default:
						response="";
						return;
				}
			} else {
				switch (key) {
					case 48:
						response = "0";
						break;
					case 49:
						response = "1";
						break;								
					default:
						response="";
						return;
				}
			}

			listening = false;
			clearInterval(show_timer);
			clearTimeout(show_timeout);
			setTimeout(function() {listening = true}, times[4] + t);

			if (response.length>0) {
				var hit = response == prob_stim_labels[current_trial];
				var rt = new Date().getTime() - stim_onset;

				// Keep track of number of consecutive correct responses
				if (hit) {
					consecutive_correct++;
					consecutive_incorrect = 0;
				} else {
					consecutive_correct = 0;
					consecutive_incorrect++;
				}

				// Check if they have solved the problem
				if (consecutive_correct == solution_criterion) {
					current_prob++;

					// If they have reached the most difficult category structure, then return to simplest, but increase num_vary_dims
					if(structure == max_structure) {
						structure = 0;
						num_vary_dims++;
					} else {
						structure++; 
					}

					// create new problem
					current_trial = 0;
					new_problem();
				}

				// Check if they need to be bumped down a level in diffiuclty
				if (consecutive_incorrect == regress_criterion) {
					current_prob++;

					// If they failed on the easiest structure and num_vary_dims == 1, quit
					if(structure == 0 && num_vary_dims==1) {
						finish();
					}
					// If they failed on the easiest structure, reduce num_vary_dims
					else if(structure == 0) {
						structure = 0;
						num_vary_dims--;
					} else {
						structure--;
					}

					// create new problem
					current_trial = 0;
					new_problem();
				}


				psiTurk.recordTrialData({'phase':"TEST",
	                                     'group':prob_stim_labels[current_trial],
	                                     'filename':stim,
	                                     'response':response,
	                                     'hit':hit,
	                                     'rt':rt}
	                                   );
				remove_img();
				remove_query();
				remove_respond_warning();

	    		setTimeout(function() {show_answer(hit);},times[1]);
	    		setTimeout(function() {remove_answer()},times[2]);
				setTimeout(function() {clearInterval(show_timer_2)},times[2]+t); 
	    		setTimeout(function() {show_img("/static/images/cross.png")},times[3]+t);
	    		setTimeout(function() {remove_img()},times[4]+t);
				setTimeout(function() {next()},times[4]+t);
				setTimeout(function() {t = 0}, times[4]+t);
			}
		};

		function new_problem() {

			// Pick the specific relevant dimensions 
			var all_dims = [];
			for (var i=0; i<num_dims; i++) {
				all_dims.push(i);
			}
			all_dims = _.shuffle(all_dims);

			var rel_dims = [];
			for (var i=0; i<num_rel_dims; i++) {
				rel_dims.push(all_dims[i]);
			}

			var vary_dims = [];
			for (var i=0; i<num_vary_dims; i++) {
				vary_dims.push(all_dims[i]);
			}

			// Find indices of stimuli to remove
			prob_stims = []; 
			prob_stims_key = [];
			var remove_ind = [];
			for (var i = 0; i < num_stim; i++) {
				for (var dim = 0; dim < num_dims; dim++) {
					if (vary_dims.indexOf(dim) === -1) {
						if (stims_key[i][dim+1] == 1) {
							remove_ind.push(i);		
				    	}
			    	}
				}
			}

			// Remove stimuli at remove_ind
			for(var i=0; i<num_stim; i++) {
				if(remove_ind.indexOf(i) === -1) {
					prob_stims.push(stims[i]);
					prob_stims_key.push(stims_key[i]);
				}
			}

			// Assign category labels
			prob_stim_labels = [];
			switch(structure) {
			    case 0:
			        // 1D
			   		for (var i=0; i<prob_stims.length; i++) {
						prob_stim_labels.push(prob_stims_key[i][rel_dims[0]]);
					}
			        break;

			    case 1:
			        // conjunctive
			        for (var i=0; i<prob_stims.length; i++) {
			        	if (prob_stims_key[i][rel_dims[0]] === 1 && prob_stims_key[i][rel_dims[1]] === 1) {
			        		prob_stim_labels.push(1);
			        	} else {
			        		prob_stim_labels.push(0);
			        	}
					}
			        break;

		        case 2:
			        // disjunctive
			        for (var i=0; i<prob_stims.length; i++) {
			        	if (prob_stims_key[i][rel_dims[0]] === 0 && prob_stims_key[i][rel_dims[1]] === 0) {
			        		prob_stim_labels.push(0);
			        	} else {
			        		prob_stim_labels.push(1);
			        	}
					}
			        break;

		        case 3:
					// conditional
					for (var i=0; i<prob_stims.length; i++) {
						if (prob_stims_key[i][rel_dims[0]] === 1 && prob_stims_key[i][rel_dims[1]] === 0) {
							prob_stim_labels.push(0);
						} else {
							prob_stim_labels.push(1);
						}
					}
					break;

		        case 4:
					// biconditional
					for (var i=0; i<prob_stims.length; i++) {
						if (prob_stims_key[i][rel_dims[0]] === 1 && prob_stims_key[i][rel_dims[1]] === 1) {
							prob_stim_labels.push(1);
						} else if (prob_stims_key[i][rel_dims[0]] === 0 && prob_stims_key[i][rel_dims[1]] === 0) {
							prob_stim_labels.push(1);
						} else {
							prob_stim_labels.push(0);
						}
					}
					break;

			    default:
					alert("Error creating new problem!")
					return;
			}

			// finally, shuffle stimuli 
			var sort_ind = new Array(prob_stims.length);
			for(var i=0; i<sort_ind.length; i++) {
				sort_ind[i] = i;
			}
			sort_ind = _.shuffle(sort_ind);

			prob_stims_copy = prob_stims;
			prob_stims_key_copy = prob_stims_key;
			prob_stim_labels_copy = prob_stim_labels;
			for(var i=0; i<sort_ind.length; i++) {
				prob_stims[i] = prob_stims_copy[sort_ind[i]];
				prob_stims_key[i] = prob_stims_key_copy[sort_ind[i]];
				prob_stim_labels[i] = prob_stim_labels_copy[sort_ind[i]];
			}

		}

		var finish = function() {
		    $("body").unbind("keydown", response_handler); // Unbind keys
		    currentview = new Questionnaire();
		};
		
		var show_img = function(url) {
	 	    var svg = d3.select("#stim")
		        .append("svg")
	        	.attr("width", 640)
		        .attr("height", 480)

		   	var imgs = svg.selectAll("image").data([0]);
	    	
	        imgs.enter()
		        .append("svg:image")
	        	.attr("xlink:href", url)
		        .attr("width", "640")
		        .attr("height", "480");
	 	}	

	 	var show_respond_warning = function() {
	  	  	d3.select("#status")
		  		.html('<p id="respond-warning" style="color:red;">Respond Quickly!!!</p>');
	 	}


	 	var show_answer = function(hit) {
	 		if (hit) {
	    		d3.select("#status")
		  			.html('<p id="answer" style="color:green;">Correct</p>');
	 		} else {
	    		d3.select("#status")
		  			.html('<p id="answer" style="color:red;">Incorrect</p>');
	 		}
	 	}


	 	var remove_answer = function() {
	 		d3.selectAll("#answer").remove();
	 	}

		var remove_respond_warning = function() {
	 		d3.selectAll("#respond-warning").remove();
	 	}
		
		var remove_img = function() {
			d3.select("svg").remove();
		};

		var remove_query = function() {
			d3.selectAll("#prompt").remove();
		}

		
		// Load the stage.html snippet into the body of the page
		psiTurk.showPage('stage.html');

		// Register the response handler that is defined above to handle any key down events.
		$("body").focus().keydown(response_handler);

		// Start the test
		next();

	});
};


/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() { 
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 
            }, 
            error: prompt_resubmit});
	});
    
	
};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Game
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() { currentview = new Experiment(); } // what you want to do when you are done with instructions
    );
});
