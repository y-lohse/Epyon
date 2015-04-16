//include('epyon.leek.ls');

//attacking behaviors
global EPYON_ATTACKS = [];

function epyon_listAttacks(maxMP, maxAP){
	var attacks = [];
	
	arrayIter(EPYON_ATTACKS, function(candidateName, candidateFn){
		if (inArray(EPYON_CONFIG['attacks'], candidateName)){
			var result = candidateFn(maxMP, maxAP);
			if (result) push(attacks, result);
		}
	});
	
	return attacks;
}

//regular, bonus behaviors
global EPYON_BONUS_BEHAVIORS = [];

function epyon_listBonusBehaviors(maxAP){
	var behaviors = [];
	
	arrayIter(EPYON_BONUS_BEHAVIORS, function(candidateName, candidateFn){
		if (inArray(EPYON_CONFIG['behaviors'], candidateName)){
			var result = candidateFn(maxAP);
			if (result) push(behaviors, result);
		}
	});
	
	return behaviors;
}

//prepartion turns
global EPYON_PREPARATIONS = [];

function epyon_listPreparations(maxAP){
	var preparations = [];
	
	arrayIter(EPYON_PREPARATIONS, function(candidateName, candidateFn){
		if (inArray(EPYON_CONFIG['preparations'], candidateName)){
			var result = candidateFn(maxAP);
			if (result) push(preparations, result);
		}
	});
	
	return preparations;
}

//actual behaviors
//juste pour commencers hors cooldown
global lastHelmetUse = -5;
global lastWallUse = -6;
global lastBandageUse = -5;


if (getTurn() === 1){
	EPYON_ATTACKS['spark'] = function(maxMP, maxAP){
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
	};

	EPYON_ATTACKS['pistol'] = function(maxMP, maxAP){
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
	};

	EPYON_BONUS_BEHAVIORS['equip_pistol'] = function(maxAP){
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
	};

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

	EPYON_PREPARATIONS['helmet'] = function(maxAP){
		var shouldUseHelmetNow = true;
		//if (getCoolDown(CHIP_HELMET) > 0) shouldUseHelmetNow = false;
		if (getTurn() - lastHelmetUse < 3) shouldUseHelmetNow = false;//trouver une façonn plus élégante de faire ca
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
	};

	EPYON_PREPARATIONS['wall'] = function(maxAP){
		var shouldUseWallNow = true;
		if (getTurn() - lastWallUse < 6) shouldUseWallNow = false;//trouver une façon plus élégante de faire ca
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
	};

	EPYON_PREPARATIONS['bandage'] = function(maxAP){
		var maxHeal = 15;
		if (getTotalLife()-getLife() < maxHeal || maxAP < 2 || getTurn() - lastBandageUse < 1) return false;

		epyon_debug('heal preparation is a candidate');

		var fn = function(){
			var result = useChip(CHIP_BANDAGE, self['id']);
			if (result === USE_SUCCESS) lastBandageUse = getTurn();
		};

		return [
			'name': 'bandage',
			'AP': 2,
			'fn': fn
		];
	};
}