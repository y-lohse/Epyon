include('epyon.ls');

function prefightByPreference(behaviors, allocatedAP, allocatedMP){
	var byPreference = [];
	
	arrayIter(behaviors, function(behavior){
		var score = 0;
		if (behavior['name'] == 'shield'){
			score = (EPYON_TARGET_DISTANCE < 15) ? 3 : 0;
		}
		if (behavior['name'] == 'helmet'){
			score = (EPYON_TARGET_DISTANCE < 15 && getCoolDown(CHIP_SHIELD) > 0) ? 3 : 0;
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

function postfightByPreference(behaviors, allocatedAP, allocatedMP){
	return behaviors[0];
}

function attackByDamage(attacks, allocatedAP, allocatedMP){
	//find the one with the msot damages
	var byDamages = [];
	
	arrayIter(attacks, function(attack){
		byDamages[attack['damage']] = attack;
	});
	
	keySort(byDamages, SORT_DESC);
	
	return shift(byDamages);
}

if (getTurn() == 1){
	EPYON_CONFIG[EPYON_FIGHT] = [WEAPON_PISTOL, CHIP_SPARK];
	EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_BANDAGE, CHIP_HELMET, CHIP_WALL,CHIP_SHIELD];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [EQUIP_PISTOL];
	
	EPYON_CONFIG['select_prefight'] = prefightByPreference;
	EPYON_CONFIG['select_postfight'] = postfightByPreference;
	EPYON_CONFIG['select_fight'] = attackByDamage;
}

epyon_startStats('global');

epyon_aquireTarget();
epyon_updateAgressions();
epyon_act();

var globalStats = epyon_stopStats('global');
epyon_debug('instructions: '+globalStats['i']+'/'+INSTRUCTIONS_LIMIT);
epyon_debug('operations: '+globalStats['o']+'/'+OPERATIONS_LIMIT);
