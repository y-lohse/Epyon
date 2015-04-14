include('inc.self');

//verifie s'il ya un interet a tirer tout de suite
function canUseWeaponOnEnemy(){
	//@TODO: prendre en compte le type de tir
	var myCell = myGetCell(),
		enemyCell = getCell(self['target']);
	
	var distance = getDistance(myCell, enemyCell),
		los = lineOfSight(myCell, enemyCell);
		
	return (distance <= self['weapon_range'] && los);
}

function shootForCost(maxCost){
	var tpCount = 0,
		tpIncrement = self['weapon_cost'],
		result;
	do{
		tpCount += tpIncrement;
		result = useWeapon(self['target']);
	}
	while(tpCount <= maxCost && (result == USE_SUCCESS || result == USE_FAILED));
}
