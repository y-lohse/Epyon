global EPYON_LEEKS = [];
global EPYON_TARGET_DISTANCE;

global self;
global target;

function epyon_getLeek(leekId){
	if (EPYON_LEEKS[leekId]){
		return epyon_updateLeek(EPYON_LEEKS[leekId]);
	}
	
	debug('creating leek '+leekId);
	var leek = [];
	
	//static props
	leek['id'] = leekId;
	leek['name'] = getName(leekId);
	leek['totalLife'] = getTotalLife(leekId);
	leek['agility'] = getAgility(leekId);
	leek['force'] = getForce(leekId);
	
	if (EPYON_LEVEL < 14){
		//below that level, there's no way to get an ally, so everything that is not us is an enemy
		leek['ally'] = (getLeek() === leekId) ? true : false;
	}
	else{
		leek['ally'] = isAlly(leekId);
	}
	
	//dynamic props
	leek['agression'] = 1;
	
	//private props
	return epyon_updateLeek(leek);
}

function epyon_updateLeek(eLeek){
	eLeek['_cell'] = getCell(eLeek['id']);
	eLeek['_cellIsDirty'] = false;
	
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
	
	if (!eLeek['chips'] && EPYON_LEVEL >= 57){
		eLeek['chips'] = getChips(eLeek['id']);
		eLeek['weapons'] = getWeapons(eLeek['id']);

		//update range
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

epyon_updateSelfRef();
