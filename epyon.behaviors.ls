//include('epyon.leek.ls');

//attacking behaviors
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
	//@TODO: si utiliser la fonction canUseWeaponOnCell, faire un polyfill pour les niveaux moins de 40
	var minCell = getCellToUseWeapon(WEAPON_PISTOL, target['id']);
	var currentCell = getCell();

	var distance = getCellDistance(minCell, currentCell);
	
	if (distance <= maxMP && PISTOl_AP_COST <= maxAP){
		var excute = function(){
			//@TODO: verifier  si on e peut pas déja tirer
			moveTowardCell(minCell);//, maxMP? 
			if (getWeapon() != WEAPON_PISTOL){
				debugW('Epyon: 1 extra AP was spent on equiping the pistol');
				setWeapon(WEAPON_PISTOL);
			}
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

//regular, bonus behaviors
global EPYON_BONUS_BEHAVIORS = [];

function epyon_registerBehavior(name, candidateFn){
	EPYON_BONUS_BEHAVIORS[name] = candidateFn;
}

function epyon_listBonusBehaviors(maxAP){
	var behaviors = [];
	
	arrayIter(EPYON_BONUS_BEHAVIORS, function(candidateFn){
		var result = candidateFn(maxAP);
		if (result) push(behaviors, result);
	});
	
	return behaviors;
}

epyon_registerBehavior('equip_pistol', function(maxAP){
	if (getWeapon() != WEAPON_PISTOL){
		var fn = function(){
			if (getWeapon() != WEAPON_PISTOL) setWeapon(WEAPON_PISTOL);
		};

		return [
			'name': 'equip_pistol',
			'AP': 1,
			'fn': fn
		];
	}
	else{
		return false;
	}
});

//@TODO: implement preparations