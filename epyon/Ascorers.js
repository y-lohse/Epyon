function epyon_aScorerHealth(eLeek){
	return getLife(eLeek['id']) / getTotalLife(eLeek['id']) + EPYON_CONFIG['suicidal'];
}

//function epyon_aScorerAbsoluteShield(){
//	if (epyon_has(PREFIGHT, SHIELD));
//}