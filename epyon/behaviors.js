global EPYON_PREFIGHT = 'prefight';
global EPYON_FIGHT = 'fight';
global EPYON_POSTFIGHT = 'postfight';
global EPYON_BEHAVIORS = [EPYON_PREFIGHT: [], EPYON_FIGHT: [], EPYON_POSTFIGHT: []];

global EQUIP_PISTOL = 80484;//arbitrary & hopefully temporary

/*
* @param type EPYON_PREFIGHT || EPYON_FIGHT || EPYON_POSTFIGHT
*/
function epyon_listBehaviors(type, maxAP, maxMP){
	var behaviors = [];
	
	arrayIter(EPYON_BEHAVIORS[type], function(candidateName, candidateFn){
		if (inArray(EPYON_CONFIG[type], candidateName)){
			var result = candidateFn(maxAP, maxMP);
			if (result) push(behaviors, result);
		}
	});
	
	return behaviors;
}

//actual behaviors
if (getTurn() === 1){
	EPYON_BEHAVIORS[EPYON_FIGHT][CHIP_SPARK] = function(maxAP, maxMP){
		var cost = getChipCost(CHIP_SPARK);
		//@TODO: si utiliser la fonction canUseWeaponOnCell, faire un polyfill pour les niveaux moins de 40
		var minCell = getCellToUseChip(CHIP_SPARK, target['id']);
		var currentCell = getCell();

		var distance = getCellDistance(minCell, currentCell);

		if (distance <= maxMP && cost <= maxAP){
			epyon_debug('spark is a candidate');

			var excute = function(){
				//@TODO: verifier  si on e peut pas déja tirer
				moveTowardCell(minCell);//, maxMP? 
				useChipShim(CHIP_SPARK, target['id']);
			};

			return [
				'name': 'spark',
				'MP': distance,
				'AP': cost,
				'damage': 16,
				'fn': excute
			];
		}
		else{
			return false;
		}
	};

	EPYON_BEHAVIORS[EPYON_FIGHT][WEAPON_PISTOL] = function(maxAP, maxMP){
		var cost = getWeaponCost(WEAPON_PISTOL);
		//@TODO: si utiliser la fonction canUseWeaponOnCell, faire un polyfill pour les niveaux moins de 40
		var minCell = getCellToUseWeapon(WEAPON_PISTOL, target['id']);
		var currentCell = getCell();

		var distance = getCellDistance(minCell, currentCell);

		if (distance <= maxMP && cost <= maxAP){
			epyon_debug('pistol is a candidate');

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
				'AP': cost,
				'damage': 20,
				'fn': excute
			];
		}
		else{
			return false;
		}
	};

	EPYON_BEHAVIORS[EPYON_POSTFIGHT][EQUIP_PISTOL] = function(maxAP, maxMP){
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
	
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_SHIELD] = function(maxAP, maxMP){
		if (getCoolDown(CHIP_SHIELD) > 0 || maxAP < getChipCost(CHIP_SHIELD)) return false;

		epyon_debug('shield preparation is a candidate');

		var fn = function(){
			useChipShim(CHIP_SHIELD, self['id']);
		};

		return [
			'name': 'shield',
			'AP': 4,
			'fn': fn
		];
	};

	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_HELMET] = function(maxAP, maxMP){
		if (getCoolDown(CHIP_HELMET) > 0 || maxAP < getChipCost(CHIP_HELMET)) return false;

		epyon_debug('helmet preparation is a candidate');

		var fn = function(){
			useChipShim(CHIP_HELMET, self['id']);
		};

		return [
			'name': 'helmet',
			'AP': 3,
			'fn': fn
		];
	};
	

	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_WALL] = function(maxAP, maxMP){
		if (getCoolDown(CHIP_WALL) > 0 || maxAP < getChipCost(CHIP_WALL)) return false;

		epyon_debug('wall preparation is a candidate');

		var fn = function(){
			useChipShim(CHIP_WALL, self['id']);
		};

		return [
			'name': 'wall',
			'AP': 4,
			'fn': fn
		];
	};

	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_BANDAGE] = function(maxAP, maxMP){
		var maxHeal = 15;
		if (getTotalLife()-getLife() < maxHeal || maxAP < 2 || getCoolDown(CHIP_BANDAGE) > 0) return false;

		epyon_debug('heal preparation is a candidate');

		var fn = function(){
			useChipShim(CHIP_BANDAGE, self['id']);
		};

		return [
			'name': 'bandage',
			'AP': 2,
			'fn': fn
		];
	};
}
