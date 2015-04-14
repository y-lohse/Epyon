include('epyon.leek.ls');

global EPYON_BEHAVIORS = [];

function epyon_registerBehavior(name, candidateFn){
	EPYON_BEHAVIORS[name] = candidateFn;
}

epyon_registerBehavior('pistol', function(maxMP){
	//candidature à l'appel. Doit décrire le mieux possible ce que ce comportement va faire
	debug('candidating behavior pistol');
	var minCell = getCellToUseWeapon(WEAPON_PISTOL, target['id']);
	var currentCell = getCell();

	var distance = getCellDistance(minCell, currentCell);
	
	if (distance <= maxMP){
		var excute = function(){
			moveTowardCell(minCell);//, maxMP
			setWeapon(WEAPON_PISTOL);
			useWeapon(target['id']);
		};
		
		return [
			'MP': distance,
			'PT': 4,
			'fn': excute
		];
	}
	else{
		return false;
	}
});