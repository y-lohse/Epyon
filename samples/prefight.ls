function prefightByPreference(behaviors, allocatedAP, allocatedMP){
	var byPreference = [];
	
	arrayIter(behaviors, function(behavior){
		var score = 0;
		if (behavior['name'] == 'shield'){
			score = (EPYON_TARGET_DISTANCE < 15) ? 4 : 0;
		}
		if (behavior['name'] == 'helmet'){
			score = (EPYON_TARGET_DISTANCE < 15 && (!inArray(EPYON_CONFIG[EPYON_PREFIGHT], CHIP_SHIELD) || getCoolDown(CHIP_SHIELD) < 4)) ? 3 : 0;
		}
		else if (behavior['name'] == 'wall'){
			score = (EPYON_TARGET_DISTANCE < 15 ) ? 2 : 0;
		}
		else if (behavior['name'] == 'bandage'){
			score = 1;
		}
		
		debug('preparation '+behavior['name']+' scored '+score);
		
		if (score > 0) byPreference[score] = behavior;
	});
	
	keySort(byPreference, SORT_DESC);
	
	return shift(byPreference);
}

EPYON_CONFIG['select_prefight'] = prefightByPreference;