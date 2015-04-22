function attackByDamage(attacks, allocatedAP, allocatedMP){
	//find the one with the msot damages
	var byDamages = [];
	
	arrayIter(attacks, function(attack){
		byDamages[attack['damage']] = attack;
	});
	
	keySort(byDamages, SORT_DESC);
	
	return shift(byDamages);
}

EPYON_CONFIG['select_fight'] = attackByDamage;