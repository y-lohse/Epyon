include('gy.epyon');

function attackByDamage(attacks, allocatedAP, allocatedMP){
	var byDamages = [];
	
	arrayIter(attacks, function(attack){
		var score = 1;
	
		if (attack['name'] == 'stalactite' &&
			allocatedAP < 10){
			score = 3;
		}
		else if (attack['name'] == 'magnum'){
			score = 2;
		}
		
		byDamages[score] = attack;
	});
	
	keySort(byDamages, SORT_DESC);
	
	return shift(byDamages);
}

function prefightByPreference(behaviors, allocatedAP, allocatedMP){
	var byPreference = [];
	
	arrayIter(behaviors, function(behavior){
		var score = 0;
		
		if (behavior['name'] == 'shield'){
			if (EPYON_TARGET_DISTANCE < 14 && //moins de 14 cases
				eGetLife(target) > 80){
				score = 4;
			}
		}
		else if (behavior['name'] == 'wall'){
			if (EPYON_TARGET_DISTANCE < 10 && 
				getCooldown(CHIP_SHIELD) < 3 &&
				eGetLife(target) > 50){
				score = 3;
			}
		}
		else if (behavior['name'] == 'puny bulb'){
			if (EPYON_TARGET_DISTANCE > 13){
				score = 10;
			}
		}
		else if (behavior['name'] == 'steroid'){
			score = (EPYON_TARGET_DISTANCE < 15 && 
					EPYON_TARGET_DISTANCE > 3 && 
					eGetLife(target) > 90 &&
					eGetLife(self) > 150) ? 2 : 0;
		}
		else if (behavior['name'] == 'cure'){
			if (eGetLife(self) < 150) score = 1;
			else if (eGetLife(self) < 70) score = 4;
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

if (getTurn() == 1){
	EPYON_CONFIG[EPYON_FIGHT] = [WEAPON_MAGNUM, CHIP_STALACTITE];
	EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_PUNY_BULB, CHIP_CURE, CHIP_WALL, CHIP_SHIELD, CHIP_STEROID];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [EQUIP_MAGNUM, CHIP_SPARK, CHIP_CURE, CHIP_BANDAGE];
	
	EPYON_CONFIG['select_prefight'] = prefightByPreference;
	EPYON_CONFIG['select_postfight'] = postfightByPreference;
	EPYON_CONFIG['select_fight'] = attackByDamage;
	
	EPYON_CONFIG['engage'] = 8;
	EPYON_CONFIG['flee'] = -0.3;
	
	push(EPYON_CONFIG['whitelist']['teams'], 'Sudo');
}

epyon_startStats('global');

epyon_denyChallenge();
epyon_loadAliveEnemies();
epyon_updateAgressions();
epyon_aquireTarget();
if (getTurn() == 1)self['MP'] = 0;
epyon_act();

var globalStats = epyon_stopStats('global');
epyon_debug('instructions: '+globalStats['i']+'/'+INSTRUCTIONS_LIMIT);
epyon_debug('operations: '+globalStats['o']+'/'+OPERATIONS_LIMIT);
