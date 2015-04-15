//include('epyon.leek.ls');

global EPYON_ATTACKS = [];

function epyon_registerAttack(name, candidateFn){
	EPYON_ATTACKS[name] = candidateFn;
}

function epyon_listAttacks(maxMP, maxAP){
	var attacks = [];
	
	arrayIter(EPYON_ATTACKS, function(candidateFn){
		var result = candidateFn(maxMP, maxAP);
		if (result) push(attacks, result);
	});
	
	return attacks;
}

epyon_registerAttack('pistol', function(maxMP, maxAP){
	//candidature à l'appel. Doit décrire le mieux possible ce que ce comportement va faire
	epyon_debug('candidating pistol attack');
	var PISTOl_AP_COST = 3;
	var minCell = getCellToUseWeapon(WEAPON_PISTOL, target['id']);
	var currentCell = getCell();

	var distance = getCellDistance(minCell, currentCell);
	
	if (distance <= maxMP && PISTOl_AP_COST <= maxAP){
		var excute = function(){
			moveTowardCell(minCell);//, maxMP? 
			if (getWeapon() != WEAPON_PISTOL) setWeapon(WEAPON_PISTOL);
			useWeapon(target['id']);
		};
		
		return [
			'name': 'pistol',
			'MP': distance,
			'AP': PISTOl_AP_COST,
			'damage': 15,
			'fn': excute
		];
	}
	else{
		return false;
	}
});