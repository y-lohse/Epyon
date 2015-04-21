global EPYON_PREFIGHT = 'prefight';
global EPYON_FIGHT = 'fight';
global EPYON_POSTFIGHT = 'postfight';
global EPYON_BEHAVIORS = [EPYON_PREFIGHT: [], EPYON_FIGHT: [], EPYON_POSTFIGHT: []];

global EQUIP_PISTOL = 80484;//arbitrary & hopefully temporary
global EQUIP_MAGNUM = 80485;//arbitrary & hopefully temporary


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

//factories to create behavior with less code
function epyon_weaponBehaviorFactory(WEAPON_ID, name, damage){//damage is temp
	var cost = getWeaponCost(WEAPON_ID);
	var distance, minCell;
	
	return function(maxAP, maxMP){	
		if (canUseWeapon(target['id'], WEAPON_ID)) distance = 0;
		else{
			minCell = getCellToUseWeapon(WEAPON_ID, target['id']);
			var currentCell = getCell();

			distance = getCellDistance(minCell, currentCell);
		}

		if (cost > maxAP || distance > maxMP) return false;
		
		epyon_debug(name+' is a candidate');

		var excute = function(){
			//@TODO: verifier  si on e peut pas déja tirer
			if (!canUseWeapon(target['id'], WEAPON_ID)) moveTowardCell(minCell);//, maxMP? 
			if (getWeapon() != WEAPON_ID){
				debugW('Epyon: 1 extra AP was spent on equiping '+name);
				setWeapon(WEAPON_ID);
			}
			useWeapon(target['id']);
		};

		return [
			'name': name,
			'MP': distance,
			'AP': cost,
			'damage': damage,
			'fn': excute
		];
	};
}

function epyon_equipBehaviorFactory(WEAPON_ID, name){
	return function(maxAP, maxMP){
		if (getWeapon() == WEAPON_ID || maxAP < 1) return false;

		epyon_debug('equiping '+name+' is a candidate');

		var fn = function(){
			if (getWeapon() != WEAPON_ID) setWeapon(WEAPON_ID);
		};

		return [
			'name': 'equip '+name,
			'AP': 1,
			'fn': fn
		];
	};
}

function epyon_simpleSelfChipBehaviorFactory(CHIP_ID, name){
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		epyon_debug(name+' is a candidate');

		var fn = function(){
			useChipShim(CHIP_ID, self['id']);
		};

		return [
			'name': name,
			'AP': cost,
			'fn': fn
		];
	};
}

function epyon_healChipBehaviorFactory(CHIP_ID, name, maxHeal){
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (getTotalLife()-getLife() < maxHeal || getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		epyon_debug(name+' preparation is a candidate');

		var fn = function(){
			useChipShim(CHIP_ID, self['id']);
		};

		return [
			'name': name,
			'AP': cost,
			'fn': fn
		];
	};
}



/*********************************
*********** BEHAVIORS ************
*********************************/
if (getTurn() === 1){
	
	//PREFIGHT
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_SHIELD] = epyon_simpleSelfChipBehaviorFactory(CHIP_SHIELD, 'shield');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_HELMET] = epyon_simpleSelfChipBehaviorFactory(CHIP_HELMET, 'helmet');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_WALL] = epyon_simpleSelfChipBehaviorFactory(CHIP_WALL, 'wall');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_STEROID] = epyon_simpleSelfChipBehaviorFactory(CHIP_STEROID, 'steroid');

	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_BANDAGE] = epyon_healChipBehaviorFactory(CHIP_BANDAGE, 'bandage', 15);
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_CURE] = epyon_healChipBehaviorFactory(CHIP_CURE, 'cure', 70);
	
	
	//FIGHT
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
	
	EPYON_BEHAVIORS[EPYON_FIGHT][WEAPON_PISTOL] = epyon_weaponBehaviorFactory(WEAPON_PISTOL, 'pîstol', 20);
	EPYON_BEHAVIORS[EPYON_FIGHT][WEAPON_MAGNUM] = epyon_weaponBehaviorFactory(WEAPON_MAGNUM, 'magnum', 40);
	
	
	//POSTFIGHT
	EPYON_BEHAVIORS[EPYON_POSTFIGHT][EQUIP_PISTOL] = epyon_equipBehaviorFactory(WEAPON_PISTOL, 'pistol');
	EPYON_BEHAVIORS[EPYON_POSTFIGHT][EQUIP_MAGNUM] = epyon_equipBehaviorFactory(WEAPON_MAGNUM, 'magnum');

	EPYON_BEHAVIORS[EPYON_POSTFIGHT][CHIP_BANDAGE] = epyon_healChipBehaviorFactory(CHIP_BANDAGE, 'bandage', 15);
	EPYON_BEHAVIORS[EPYON_POSTFIGHT][CHIP_CURE] = epyon_healChipBehaviorFactory(CHIP_CURE, 'cure', 70);
}
