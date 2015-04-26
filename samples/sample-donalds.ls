include('donalds.epyon');
include('common.bydamage');

function prefightByPreference(behaviors, allocatedAP, allocatedMP){
	var byPreference = [];
	
	arrayIter(behaviors, function(behavior){
		var score = 0;
		if (behavior['name'] == 'shield' && EPYON_TARGET_DISTANCE < 14){
				score = 2;
		}
		else if (behavior['name'] == 'helmet' && 
				EPYON_TARGET_DISTANCE < 14 &&
				getCooldown(CHIP_SHIELD) < 3){
				score = 1;
		}
		else if (behavior['name'] == 'bandage' && eGetLife(self)/self['totalLife'] < 0.5){
				score = 4;
		}
		else if (behavior['name'] == 'bandage other' && behavior['MP'] < 2){
				score = 3;
		}
		
		if (score > 0) byPreference[score] = behavior;
	});
	
	keySort(byPreference, SORT_DESC);
	
	return shift(byPreference);
}

function postfightByPreference(behaviors, allocatedAP, allocatedMP){
	return behaviors[0];
}

if (getTurn() == 1){
EPYON_CONFIG[EPYON_PREFIGHT] = [BANDAGE_OTHER, CHIP_HELMET, CHIP_BANDAGE, CHIP_SHIELD];
	EPYON_CONFIG[EPYON_FIGHT] = [WEAPON_PISTOL, CHIP_SPARK];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [EQUIP_PISTOL, CHIP_PEBBLE];
	
	EPYON_CONFIG['select_prefight'] = prefightByPreference;
	EPYON_CONFIG['select_postfight'] = postfightByPreference;
	EPYON_CONFIG['select_fight'] = attackByDamage;
	
	EPYON_CONFIG['engage'] = 7;
	EPYON_CONFIG['flee'] = -0.5;
	
	push(EPYON_CONFIG['whitelist']['teams'], 'Sudo');
}

epyon_startStats('global');

epyon_denyChallenge();
epyon_loadAliveEnemies();
epyon_updateAgressions();
epyon_aquireTarget();
epyon_act();

var globalStats = epyon_stopStats('global');
epyon_debug('instructions: '+globalStats['i']+'/'+INSTRUCTIONS_LIMIT);
epyon_debug('operations: '+globalStats['o']+'/'+OPERATIONS_LIMIT);
