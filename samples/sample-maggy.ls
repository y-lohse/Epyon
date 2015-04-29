include('gy.epyon');

global isTeamfight = (count(getAllies()) > 1);

function gyDestination(){
	if (!isTeamfight) return eGetCell(target);
	else{
		//find the closes tank
		var myCell = eGetCell(self);
		var closestCell = eGetCell(target);
		var closestDistance = getDistance(myCell, closestCell);//par défaut l'adversaire
		arrayIter(eGetAliveAllies(), function(ally){
			var allyCell = eGetCell(ally);
			var distance = getDistance(myCell, allyCell);
			
			if (inArray(['magdonalds', 'Shiki', 'Senjougahara'], ally['name']) && distance < closestDistance){
				closestCell = allyCell;
				closestDistance = distance;
			}
		});
		
		return closestCell;
	}
}

function needsTurtle(){
	var turtle = false;
	
	if (eGetLife(self)/self['totalLife'] < 0.4) turtle = true;
}

var targetCriticalHealth = 150;

function attackByDamage(attacks, allocatedAP, allocatedMP){
	var byDamages = [];
	
	arrayIter(attacks, function(attack){
		var score = 1;
	
		if (attack['type'] == CHIP_STALACTITE &&
			allocatedAP < 10){
			score = 3;
		}
		else if (attack['type'] == WEAPON_MAGNUM){
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
		
		if (behavior['type'] == CHIP_PUNY_BULB){
			if (EPYON_TARGET_DISTANCE > 13){
				score = 10;
			}
		}
		else if (behavior['type'] == CHIP_SHIELD){
			if (EPYON_TARGET_DISTANCE < 14 && //moins de 14 cases
				eGetLife(target) > targetCriticalHealth){
				score = 4;
			}
		}
		else if (behavior['type'] == CHIP_STEROID){
			score = (EPYON_TARGET_DISTANCE < 15 && 
					eGetLife(target) > targetCriticalHealth &&
					!needsTurtle()) ? 2 : 0;
		}
		else if (behavior['type'] == CHIP_CURE && behavior['target']['id'] == getLeek()){
			if (needsTurtle()) score = 4;
			else score = 1;
		}
		
		debug('preparation '+behavior['type']+' scored '+score);
		
		if (score > 0) byPreference[score] = behavior;
	});
	
	keySort(byPreference, SORT_DESC);
	
	return shift(byPreference);
}

function postfightByPreference(behaviors, allocatedAP, allocatedMP){
	return behaviors[0];
}

if (getTurn() == 1){
	EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_PUNY_BULB, CHIP_CURE, CHIP_SHIELD, CHIP_STEROID];
	EPYON_CONFIG[EPYON_FIGHT] = [WEAPON_MAGNUM, CHIP_STALACTITE];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [EQUIP_MAGNUM, CHIP_CURE, CHIP_SPARK, CHIP_BANDAGE];
	
	EPYON_CONFIG['select_prefight'] = prefightByPreference;
	EPYON_CONFIG['select_postfight'] = postfightByPreference;
	EPYON_CONFIG['select_fight'] = attackByDamage;
	
	EPYON_CONFIG['destination'] = gyDestination;
	
	EPYON_CONFIG['engage'] = 8;
	EPYON_CONFIG['flee'] = -0.3;
	
	push(EPYON_CONFIG['whitelist']['teams'], 'Sudo');
}

epyon_startStats('global');

epyon_denyChallenge();
epyon_updateAgressions();
epyon_aquireTarget();
epyon_act();

var globalStats = epyon_stopStats('global');
epyon_debug('instructions: '+globalStats['i']+'/'+INSTRUCTIONS_LIMIT);
epyon_debug('operations: '+globalStats['o']+'/'+OPERATIONS_LIMIT);
