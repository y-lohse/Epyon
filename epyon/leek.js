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
	leek['_cell'] = getCell(leekId);
	leek['_cellIsDirty'] = false;
	leek['_weapon'] = getWeapon(leekId);
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
	return leek['_weapon'];
}

function eSetWeapon(WEAPON_ID){
	leek['_weapon'] = WEAPON_ID;
	return setWeapon(WEAPON_ID);
}

function eMoveTowardCell(cell){
	eLeek['_cellIsDirty'] = true;
	return moveTowardCell(cell);
}

function eMoveTowardCellWithMax(cell, max){
	eLeek['_cellIsDirty'] = true;
	return moveTowardCell(cell, max);
}

function eMoveAwayFrom(eLeek, max){
	eLeek['_cellIsDirty'] = true;
	return moveAwayFrom(eLeek['id'], max);
}

global self = epyon_getLeek(getLeek());
global target = null;