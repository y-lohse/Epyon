global EPYON_LEEKS = [];
global EPYON_TARGET_DISTANCE;

global self;
global target;

function epyon_getLeek(leekId){
	if (EPYON_LEEKS[leekId]){
		return epyon_updateLeek(EPYON_LEEKS[leekId]);
	}
	
	debug('creating leek '+leekId);
	var eLeek = [];
	
	//static props
	eLeek['id'] = leekId;
	eLeek['name'] = getName(leekId);
	eLeek['totalLife'] = getTotalLife(leekId);
	eLeek['agility'] = getAgility(leekId);
	eLeek['force'] = getForce(leekId);
	eLeek['summon'] = isSummon(leekId);
	
	if (EPYON_LEVEL < 14){
		//below that level, there's no way to get an ally, so everything that is not us is an enemy
		eLeek['ally'] = (getLeek() === leekId) ? true : false;
	}
	else{
		eLeek['ally'] = isAlly(leekId);
	}
	
	//try to get the inventory
	if (EPYON_LEVEL >= 57){
		eLeek['chips'] = getChips(leekId);
		eLeek['weapons'] = getWeapons(leekId);
	}
	
	//try to load the max shielding values
	eLeek['maxAbsShield'] = 0;
	
	if (eLeek['chips']){
		arrayIter(eLeek['chips'], function(CHIP_ID){
			if (CHIP_ID == CHIP_HELMET) eLeek['maxAbsShield'] += 15;
			else if (CHIP_ID == CHIP_SHIELD) eLeek['maxAbsShield'] += 20;
			else if (CHIP_ID == CHIP_ARMOR) eLeek['maxAbsShield'] += 25;
			else if (eLeek['summon'] && CHIP_ID == CHIP_CARAPACE) eLeek['maxAbsShield'] += 55;
		});
	}
	else if (EPYON_LEVEL >= 13){
		var level = getLevel(eLeek['id']);

		if (level >= 11) eLeek['maxAbsShield'] += 15;//helmet
		if (level >= 19) eLeek['maxAbsShield'] += 20;//shield
		if (level >= 55) eLeek['maxAbsShield'] += 25;//armor
		if (eLeek['summon'] && level >= 259) eLeek['maxAbsShield'] += 55;//carapace
	}
	
	//dynamic props
	eLeek['agression'] = 1;
	
	//dynamic props
	return epyon_updateLeek(eLeek);
}

function epyon_updateLeek(eLeek){
	eLeek['_cell'] = getCell(eLeek['id']);
	eLeek['_cellIsDirty'] = false;
	eLeek['agility'] = getAgility(eLeek['id']);
	eLeek['force'] = getForce(eLeek['id']);
	
	if (EPYON_LEVEL < 10){
		eLeek['_weapon'] = (eLeek['id'] === getLeek()) ? getWeapon() : WEAPON_PISTOL;
		eLeek['MP'] = 3;
		eLeek['AP'] = 10;
		eLeek['range'] = 3 + (eLeek['_weapon'] === WEAPON_PISTOL) ? 7 : 0;
	}
	else{
		eLeek['_weapon'] = getWeapon(eLeek['id']);
		eLeek['MP'] = getMP(eLeek['id']);
		eLeek['AP'] = getTP(eLeek['id']);
		if (EPYON_LEVEL < 57) eLeek['range'] = getWeaponMaxScope(eLeek['_weapon']) + eLeek['MP'];
		else eLeek['range'] = 0;
	}
	
	if (EPYON_LEVEL >= 57){
		var attackChips = arrayFilter(eLeek['chips'], function(CHIP_ID){
			return inArray([CHIP_SHOCK, CHIP_PEBBLE, CHIP_SPARK, CHIP_ICE, 
							CHIP_ROCK, CHIP_FLASH, CHIP_FLAME, CHIP_STALACTITE,
							CHIP_LIGHTNING, CHIP_ROCKFALL, CHIP_ICEBERG, 
							CHIP_METEORITE, CHIP_DEVIL_STRIKE], CHIP_ID);
		});

		arrayIter(attackChips, function(CHIP_ID){
			eLeek['range'] = max(eLeek['range'], eLeek['MP'] + getChipMaxScope(CHIP_ID));
		});

		arrayIter(eLeek['weapons'], function(WEAPON_ID){
			eLeek['range'] = max(eLeek['range'], eLeek['MP'] + getWeaponMaxScope(WEAPON_ID));
		});
	}
	
	EPYON_LEEKS[eLeek['id']] = eLeek;
	return eLeek;
}

function epyon_loadAliveEnemies() {
	if (EPYON_LEVEL >= 16){
		var leeks = getAliveEnemies();
		var l = count(leeks);
		for (var i = 0; i < l; i++){
			epyon_getLeek(leeks[i]);
		}
	}
}

function epyon_loadAliveAllies() {
	if (EPYON_LEVEL >= 14){
		var leeks = getAliveAllies();
		var l = count(leeks);
		for (var i = 0; i < l; i++){
			epyon_getLeek(leeks[i]);
		}
	}
}

function epyon_updateSelfRef(){
	//THIS RETURNS A COPY, NOT A REFERENCE. You can't get a reference.
	self = epyon_getLeek(getLeek());
}

function eGetCell(eLeek){
	if (eLeek['_cellIsDirty']){
		eLeek['_cell'] = getCell(eLeek['id']);
		eLeek['_cellIsDirty'] = false;
	}
	return eLeek['_cell'];
}

function eGetLife(eLeek){
	return getLife(eLeek['id']);
}

function eGetWeapon(eLeek){
	return eLeek['_weapon'];
}

function eSetWeapon(WEAPON_ID){
	EPYON_LEEKS[self['id']]['_weapon'] = WEAPON_ID;
	self['_weapon'] = WEAPON_ID;
	return setWeapon(WEAPON_ID);
}

function eMoveTowardCell(cell){
	EPYON_LEEKS[self['id']]['_cellIsDirty'] = true;
	self['_cellIsDirty'] = true;
	return moveTowardCell(cell);
}

function eMoveTowardCellWithMax(cell, max){
	EPYON_LEEKS[self['id']]['_cellIsDirty'] = true;
	self['_cellIsDirty'] = true;
	return moveTowardCell(cell, max);
}

function eMoveAwayFrom(eLeek, max){
	EPYON_LEEKS[self['id']]['_cellIsDirty'] = true;
	self['_cellIsDirty'] = true;
	return moveAwayFrom(eLeek['id'], max);
}

function eGetAliveEnemies(){
	var enemies = [];
	
	for (var eLeek in EPYON_LEEKS){
		if (isAlive(eLeek['id']) && !eLeek['ally']) push(enemies, eLeek);
	}
	
	return enemies;
}

function eGetAliveAllies(){
	var allies = [];
	
	for (var eLeek in EPYON_LEEKS){
		if (isAlive(eLeek['id']) && eLeek['ally']) push(allies, eLeek);
	}
	
	return allies;
}

function eGetTurnsToImpact(eLeek){
	var turns = 64,
		enemyLeeks;
	
	if (eLeek['ally']) enemyLeeks = eGetAliveEnemies();
	else enemyLeeks = eGetAliveAllies();
	
	arrayIter(enemyLeeks, function(leek){
		var distance = getPathLength(eGetCell(leek), eGetCell(eLeek)),
			leekTurns = (distance - leek['range']) / leek['MP'];
		
		if (leekTurns < turns) turns = leekTurns;
	});
	
	return turns;
}

epyon_updateSelfRef();
