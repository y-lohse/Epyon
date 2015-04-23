global EPYON_LEEKS = [];
global EPYON_TARGET_DISTANCE;

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
	leek['ally'] = isAlly(leekId);
	
	//dynamic props
	leek['agression'] = 1;
	
	//private props
	leek['_cell'] = getCell(leekId);
	leek['_cellIsDirty'] = false;
	leek['_weapon'] = getWeapon(leekId);
	
	EPYON_LEEKS[leekId] = leek;
	
	return leek;
}

function epyon_updateLeek(epyonLeek){
	epyonLeek['_cell'] = getCell(epyonLeek['id']);
	epyonLeek['_cellIsDirty'] = false;
	epyonLeek['_weapon'] = getWeapon(epyonLeek['id']);
	return epyonLeek;
}

function eGetCell(eLeek){
	if (eLeek['_cellIsDirty']) eLeek['cell'] = getCell(eLeek['id']);
	return eLeek['_cell'];
}

function eGetLife(eLeek){
	return getLife(eLeek['id']);
}

function eGetWeapon(eLeek){
	return eLeek['_weapon'];
}

function eSetWeapon(WEAPON_ID){
	self['_weapon'] = WEAPON_ID;
	return setWeapon(WEAPON_ID);
}

function eMoveTowardCell(cell){
	self['_cellIsDirty'] = true;
	return moveTowardCell(cell);
}

function eMoveTowardCellWithMax(cell, max){
	self['_cellIsDirty'] = true;
	return moveTowardCell(cell, max);
}

function eMoveAwayFrom(eLeek, max){
	self['_cellIsDirty'] = true;
	return moveAwayFrom(eLeek['id'], max);
}

global self;
global target = null;

self = epyon_getLeek(getLeek());