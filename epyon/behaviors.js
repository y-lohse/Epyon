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

epyon_registerAttack('spark', function(maxMP, maxAP){
	//candidature à l'appel. Doit décrire le mieux possible ce que ce comportement va faire
	var SPARK_AP_COST = 3;
	//@TODO: si utiliser la fonction canUseWeaponOnCell, faire un polyfill pour les niveaux moins de 40
	var minCell = getCellToUseChip(CHIP_SPARK, target['id']);
	var currentCell = getCell();

	var distance = getCellDistance(minCell, currentCell);
	
	if (distance <= maxMP && SPARK_AP_COST <= maxAP){
		epyon_debug('spark attack is a candidate');
		
		var excute = function(){
			//@TODO: verifier  si on e peut pas déja tirer
			moveTowardCell(minCell);//, maxMP? 
			useChip(CHIP_SPARK, target['id']);
		};
		
		return [
			'name': 'spark',
			'MP': distance,
			'AP': SPARK_AP_COST,
			'damage': 16,
			'fn': excute
		];
	}
	else{
		return false;
	}
});

epyon_registerAttack('pistol', function(maxMP, maxAP){
	//candidature à l'appel. Doit décrire le mieux possible ce que ce comportement va faire
	var PISTOl_AP_COST = 3;
	//@TODO: si utiliser la fonction canUseWeaponOnCell, faire un polyfill pour les niveaux moins de 40
	var minCell = getCellToUseWeapon(WEAPON_PISTOL, target['id']);
	var currentCell = getCell();

	var distance = getCellDistance(minCell, currentCell);
	
	if (distance <= maxMP && PISTOl_AP_COST <= maxAP){
		epyon_debug('pistol attack is a candidate');
		
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
			'damage': 20,
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
	if (getWeapon() == WEAPON_PISTOL || maxAP < 1) return false;
		
	epyon_debug('pistol equip behavior is a candidate');

	var fn = function(){
		if (getWeapon() != WEAPON_PISTOL) setWeapon(WEAPON_PISTOL);
	};

	return [
		'name': 'equip_pistol',
		'AP': 1,
		'fn': fn
	];
});

//epyon_registerBehavior('bandage', function(maxAP){
//	var maxHeal = 15;
//	if (getTotalLife()-getLife() < maxHeal || maxAP < 2) return false;
//		
//	epyon_debug('bandage behavior is a candidate');
//
//	var fn = function(){
//		useChip(CHIP_BANDAGE, self['id']);
//	};
//
//	return [
//		'name': 'bandage',
//		'AP': 2,
//		'fn': fn
//	];
//});

//prepartion turns
global EPYON_PREPARATIONS = [];

function epyon_registerPreparation(name, candidateFn){
	EPYON_PREPARATIONS[name] = candidateFn;
}

function epyon_listPreparations(maxAP){
	var preparations = [];
	
	arrayIter(EPYON_PREPARATIONS, function(candidateFn){
		var result = candidateFn(maxAP);
		if (result) push(preparations, result);
	});
	
	return preparations;
}

global lastHelmetUse = -5;//juste pour commencers hors cooldown

epyon_registerPreparation('helmet', function(maxAP){
	var shouldUseHelmetNow = true;
	//if (getCoolDown(CHIP_HELMET) > 0) shouldUseHelmetNow = false;
	if (getTurn() - lastHelmetUse < 3) shouldUseHelmetNow = false;//trouver une façonn plus élégante de faire ca
	if (EPYON_TARGET_DISTANCE > 15) shouldUseHelmetNow = false;//@TODO: esayer de mieux deviner quand aura lieu la prochaine attaque. ie forcer a regfarder l'ennemi el plus proche, predire ou il sera a la fin de son tour et sa portée d'attaque
	if (maxAP < 3) shouldUseHelmetNow = false;
	
	if (!shouldUseHelmetNow) return false;
	
	epyon_debug('helmet preparation is a candidate');

	var fn = function(){
		var result = useChip(CHIP_HELMET, self['id']);
		if (result === USE_SUCCESS) lastHelmetUse = getTurn();
	};

	return [
		'name': 'helmet',
		'AP': 3,
		'fn': fn
	];
});

global lastWallUse = -6;//juste pour commencers hors cooldown

epyon_registerPreparation('wall', function(maxAP){
	var shouldUseWallNow = true;
	if (getTurn() - lastWallUse < 6) shouldUseWallNow = false;//trouver une façonn plus élégante de faire ca
	if (EPYON_TARGET_DISTANCE > 15) shouldUseWallNow = false;//@TODO: esayer de mieux deviner quand aura lieu la prochaine attaque. ie forcer a regfarder l'ennemi el plus proche, predire ou il sera a la fin de son tour et sa portée d'attaque
	if (maxAP < 4) shouldUseWallNow = false;
	
	if (!shouldUseWallNow) return false;
	
	epyon_debug('wall preparation is a candidate');

	var fn = function(){
		var result = useChip(CHIP_WALL, self['id']);
		if (result === USE_SUCCESS) lastWallUse = getTurn();
	};

	return [
		'name': 'wall',
		'AP': 4,
		'fn': fn
	];
});

global lastBandageUse = -5;

epyon_registerPreparation('bandage', function(maxAP){
	var maxHeal = 15;
	if (getTotalLife()-getLife() < maxHeal || maxAP < 2 || getTurn() - lastBandageUse < 1) return false;
	
	epyon_debug('heal preparation is a candidate');

	var fn = function(){
		var result = useChip(CHIP_BANDAGE, self['id']);
		if (result === USE_SUCCESS) lastBandageUse = getTurn();
	};

	return [
		'name': 'heal',
		'AP': 2,
		'fn': fn
	];
});