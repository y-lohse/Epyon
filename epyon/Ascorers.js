function epyon_aScorerHealth(eLeek){
	return getLife(eLeek['id']) / getTotalLife(eLeek['id']) + EPYON_CONFIG['suicidal'];
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