global EPYON_LEEKS = [];
global EPYON_TARGET_DISTANCE; 

function epyon_getLeek(leekId){
	if (EPYON_LEEKS[leekId]){
		return epyon_updateLeek(EPYON_LEEKS[leekId]);
	}
	
	debug('creating leek '+leekId);
	var leek = [];
	
	leek['id'] = leekId;
	leek['name'] = getName(leekId);
	leek['totalLife'] = getTotalLife(leekId);
	leek['agression'] = 1;
	
	EPYON_LEEKS[leekId] = leek;
	
	return leek;
}

function epyon_updateLeek(epyonLeek){
	//@TODO: maj des propriétés qui changent
	return epyonLeek;
}

function eGetCell(eLeek){
	return getCell(eLeek['id']);
}

function eGetLife(eLeek){
	return getLife(eLeek['id']);
}

function eGetWeapon(eLeek){
	return getWeapon(eLeek['id']);
}

function eSetWeapon(WEAPON_ID){
	return setWeapon(WEAPON_ID);
}

function eMoveTowardCell(cell){
	return moveTowardCell(cell);
}

function eMoveTowardCellWithMax(cell, max){
	return moveTowardCell(cell, max);
}

function eMoveAwayFrom(eLeek, max){
	return moveAwayFrom(eLeek['id'], max);
}

global self = epyon_getLeek(getLeek());
global target = null;