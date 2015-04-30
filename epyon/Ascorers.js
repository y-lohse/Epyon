//Each scorer returns a value between 0 and 1, representing the level of aggression relative to a particular aspect.
//0 is flee, .5 is normal and 1 is engage

function epyon_aScorerHealth(eLeek){
	// see http://gizma.com/easing/	//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiItMSooeCooeC0yKSkiLCJjb2xvciI6IiMwMDAwMDAifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyItMS40MjQ5OTk5OTk5OTk5OTk0IiwiMS44MjUwMDAwMDAwMDAwMDA2IiwiLTAuNzE5OTk5OTk5OTk5OTk5OCIsIjEuMjgwMDAwMDAwMDAwMDAwMiJdfV0-
	var t = eGetLife(eLeek) / eLeek['totalLife'];
	return -1 * (t * (t-2)) + EPYON_CONFIG['suicidal'];
}

function epyon_aScorerAbsoluteShield(eLeek){
	var absShield = getAbsoluteShield(eLeek['id']);
	
	return 0.3 + ((absShield / (eLeek['maxAbsShield'] || 1)) * 0.7);
}

function epyon_aScorerRelativeShield(eLeek){
	var relShield = getRelativeShield(eLeek['id']);
	
	return 0.3 + ((relShield / 100) * 0.7);
}