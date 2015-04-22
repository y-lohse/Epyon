//Each scorer returns a value between 0 and 1, representing the level of aggression relative to a particular aspect.
//0 is flee, .5 is normal and 1 is engage

function epyon_aScorerHealth(eLeek){
	// see http://gizma.com/easing/	//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiItMSooeCooeC0yKSkiLCJjb2xvciI6IiMwMDAwMDAifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyItMS40MjQ5OTk5OTk5OTk5OTk0IiwiMS44MjUwMDAwMDAwMDAwMDA2IiwiLTAuNzE5OTk5OTk5OTk5OTk5OCIsIjEuMjgwMDAwMDAwMDAwMDAwMiJdfV0-
	var t = eGetLife(eLeek) / eLeek['totalLife'];
	return -1 * (t * (t-2)) + EPYON_CONFIG['suicidal'];
}

//requires lvl40
//function epyon_aScorerAbsoluteShield(eLeek){
//	var level = getlevel(eLeek['id']);
//	var maxAbsShield = 1;
//	
//	//@TODO: utiliser getChips() pour lister les puces équipés
//	if (level >= 11) maxAbsShield += 15;//helmet
//	if (level >= 19) maxAbsShield += 20;//shield
//	if (level >= 55) maxAbsShield += 25;//armor
//	if (level >= 259) maxAbsShield += 55;//carapace
//	
//	maxAbsShield = max(maxAbsShield, 100);//chances that everything is used at once is rather low
//	
//	return getAbsoluteShield(eLeek['id']) / maxAbsShield;
//}