global EPYON_CONFIG = [];

global epyon_dummy_selector = function(candidates){
	return candidates[0];
};

//easing functions, see http://gizma.com/easing/
//b=0,  c=1, d=1

//quart out
global EPYON_EVAl_RECKLESS = function(t){
	//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiItMSooKHgtMSkqKHgtMSkqKHgtMSkqKHgtMSktMSkiLCJjb2xvciI6IiMwMDAwMDAifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyItMS40MjQ5OTk5OTk5OTk5OTk0IiwiMS44MjUwMDAwMDAwMDAwMDA2IiwiLTAuNzE5OTk5OTk5OTk5OTk5OCIsIjEuMjgwMDAwMDAwMDAwMDAwMiJdfV0-
	return -1 * ((t-1) * (t-1) * (t-1) * (t-1) -1);
};

//quad out
global EPYON_EVAl_BRAVE = function(t){
	//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiItMSooeCooeC0yKSkiLCJjb2xvciI6IiMwMDAwMDAifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyItMS40MjQ5OTk5OTk5OTk5OTk0IiwiMS44MjUwMDAwMDAwMDAwMDA2IiwiLTAuNzE5OTk5OTk5OTk5OTk5OCIsIjEuMjgwMDAwMDAwMDAwMDAwMiJdfV0-
	return -1 * (t * (t-2));
};

//linear
global EPYON_EVAl_NORMAL = function(t){
	return t;
};

if (getTurn() === 1){
	//inventory
	EPYON_CONFIG[EPYON_PREFIGHT] = [];
	EPYON_CONFIG[EPYON_FIGHT] = [];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	//selectors
	EPYON_CONFIG['select_prefight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_fight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_postfight'] = epyon_dummy_selector;
	
	//socrer functions receive a leek as parameter and score him on any criteria the ysee fit, where 0 is shit and 1 is great. Return values are clamped between 0 and 1 anyway. Each scorer is weighted. If the weight (coef) is 0 for a scorer, the scorer is ignored.
	EPYON_CONFIG['A'] = [
		'health': ['fn': epyon_aScorerHealth, 'coef': 1],
	];
	
	//charcter traits
	EPYON_CONFIG['evaluation'] = EPYON_EVAl_BRAVE;//this must be a function that receives a value between 0 and 1, and rreturns another value between 0 and 1. Built-ins are EPYON_EVAl_NORMAL, EPYON_EVAl_BRAVE, and EPYON_EVAl_RECKLESS. It influences how the AI will 
	
	EPYON_CONFIG['suicidal'] = 0;//[0;1] with a higher suicidal value, the leek will stay agressive despite being low on health
}