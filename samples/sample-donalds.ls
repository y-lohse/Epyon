include('donalds.epyon');
include('common.bydamage');

function needsShield(leekId){
	return (getAbsoluteShield(leekId) == 0 && getRelativeShield(leekId) == 0);
}

function needsHeal(){
	var heal = false;
	
	if (eGetLife(self)/self['totalLife'] < 0.4) heal = true;
	
	return heal;
}

function prefightByPreference(behaviors, allocatedAP, allocatedMP){
	var byPreference = [];
	
	arrayIter(behaviors, function(behavior){
		var score = 0;
		
		var iAmTheTarget = behavior['target']['id'] == self['id'],
			iNeedAShield = needsShield(self['id']);
		
		if (inArray([CHIP_SHIELD, CHIP_HELMET, CHIP_WALL], behavior['type']){
			//shielding
			if (iAmTheTarget && iNeedAShield && EPYON_TARGET_DISTANCE < 14){
				//shield for me
				debug('i need a shield!');
				if (behavior['type'] == CHIP_SHIELD) score = 50;
				else if (behavior['type'] == CHIP_HELMET) score = 40;
				else score = 30;
			}
			else if (!iAmTheTarget && needsShield(behavior['target']['id']) && EPYON_TARGET_DISTANCE < 10){
				//shield someone else
				debug(behavior['target']['name']+' needs a shield!');
				if (behavior['type'] == CHIP_SHIELD) score = 5;
				else if (behavior['type'] == CHIP_HELMET) score = 4;
				else score = 3;
			}
		}
		
		if (inArray([CHIP_BANDAGE, CHIP_CURE], behavior['type'])){
			//healing chips
			if (iAmTheTarget && needsHeal()){
				debug('I need health');
				
				if (behavior['type'] == CHIP_CURE) score = 100;
				else if (behavior['type'] == CHIP_BANDAGE) score = 90;
			}
			else if (!iAmTheTarget){
				debug(behavior['target']['name']+' needs health!');
				
				if (behavior['type'] == CHIP_CURE) score = 10;
				else if (behavior['type'] == CHIP_BANDAGE) score = 9;
			}
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
EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_HELMET, CHIP_CURE, CHIP_BANDAGE, CHIP_SHIELD, CHIP_WALL];
	EPYON_CONFIG[EPYON_FIGHT] = [WEAPON_MAGNUM];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [EQUIP_MAGNUM, CHIP_SPARK, CHIP_PEBBLE];
	
	EPYON_CONFIG['select_prefight'] = prefightByPreference;
	EPYON_CONFIG['select_postfight'] = postfightByPreference;
	EPYON_CONFIG['select_fight'] = attackByDamage;
	
	EPYON_CONFIG['engage'] = 3;
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
