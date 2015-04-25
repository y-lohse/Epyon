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
function epyon_weaponBehaviorFactory(WEAPON_ID, name){
	var effects = getWeaponEffects(WEAPON_ID);
	//average of damage + stats modifiers
	var damage = ((effects[0][1]+effects[0][2]) / 2) * (1 + self['force'] / 100);
	
	var cost = getWeaponCost(WEAPON_ID);
	var distance, minCell;
	
	return function(maxAP, maxMP){	
		if (EPYON_LEVEL >= 29  && canUseWeapon(WEAPON_ID, target['id'])) distance = 0;
		else{
			minCell = getCellToUseWeapon(WEAPON_ID, target['id']);
			var currentCell = eGetCell(self);

			distance = getPathLength(minCell, currentCell);
		}

		if (cost > maxAP || distance > maxMP) return false;
		
		epyon_debug(name+' is a candidate');

		var excute = function(){
			//ne pas utiliser de OR, canUseWeapon plante e ndessous du level 29
			if (EPYON_LEVEL < 29) eMoveTowardCell(minCell);
			else if (!canUseWeapon(WEAPON_ID, target['id'])) eMoveTowardCell(minCell);
			
			if (eGetWeapon(self) != WEAPON_ID){
				debugW('Epyon: 1 extra AP was spent on equiping '+name);
				eSetWeapon(WEAPON_ID);
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
		if (eGetWeapon(self) == WEAPON_ID || maxAP < 1) return false;

		epyon_debug('equiping '+name+' is a candidate');

		var fn = function(){
			if (eGetWeapon(self) != WEAPON_ID) eSetWeapon(WEAPON_ID);
		};

		return [
			'name': 'equip '+name,
			'AP': 1,
			'fn': fn
		];
	};
}

function epyon_offensiveChipBehaviorFactory(CHIP_ID, name){
	var effects = getChipEffects(CHIP_ID);
	var damage = ((effects[0][1]+effects[0][2]) / 2) * (1 + self['force'] / 100);
	var cost = getChipCost(CHIP_ID);
	var distance, minCell;
	
	return function(maxAP, maxMP){
		if (EPYON_LEVEL >= 29 && canUseChip(CHIP_ID, target['id'])) distance = 0;
		else{
			minCell = getCellToUseChip(CHIP_ID, target['id']);
			var currentCell = eGetCell(self);

			distance = getPathLength(minCell, currentCell);
		}

		if (getCooldown(CHIP_ID) > 0 || cost > maxAP || distance > maxMP){
			debug(name+' not candidate');
			debug(cost+' > '+maxAP+' or '+distance+' > '+maxMP);
			return false;
		}
		
		epyon_debug(name+' is a candidate');

		var excute = function(){
			if (EPYON_LEVEL < 29) eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, target['id'])) eMoveTowardCell(minCell);
			useChipShim(CHIP_ID, target['id']);
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

function epyon_healChipBehaviorFactory(CHIP_ID, name){
	var effects = getChipEffects(CHIP_ID);
	var maxHeal = effects[0][2] * (1 + self['agility'] / 100);
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (self['totalLife']-eGetLife(self) < maxHeal || getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

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
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_ARMOR] = epyon_simpleSelfChipBehaviorFactory(CHIP_ARMOR, 'armor');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_SHIELD] = epyon_simpleSelfChipBehaviorFactory(CHIP_SHIELD, 'shield');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_HELMET] = epyon_simpleSelfChipBehaviorFactory(CHIP_HELMET, 'helmet');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_WALL] = epyon_simpleSelfChipBehaviorFactory(CHIP_WALL, 'wall');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_STEROID] = epyon_simpleSelfChipBehaviorFactory(CHIP_STEROID, 'steroid');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_WARM_UP] = epyon_simpleSelfChipBehaviorFactory(CHIP_WARM_UP, 'warm');

	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_BANDAGE] = epyon_healChipBehaviorFactory(CHIP_BANDAGE, 'bandage');
	EPYON_BEHAVIORS[EPYON_PREFIGHT][CHIP_CURE] = epyon_healChipBehaviorFactory(CHIP_CURE, 'cure');
	
	
	//FIGHT
	EPYON_BEHAVIORS[EPYON_FIGHT][CHIP_SPARK] = epyon_offensiveChipBehaviorFactory(CHIP_SPARK, 'spark');
	EPYON_BEHAVIORS[EPYON_FIGHT][CHIP_PEBBLE] = epyon_offensiveChipBehaviorFactory(CHIP_PEBBLE, 'pebble');
	
	EPYON_BEHAVIORS[EPYON_FIGHT][WEAPON_PISTOL] = epyon_weaponBehaviorFactory(WEAPON_PISTOL, 'pîstol');
	EPYON_BEHAVIORS[EPYON_FIGHT][WEAPON_MAGNUM] = epyon_weaponBehaviorFactory(WEAPON_MAGNUM, 'magnum');
	
	//POSTFIGHT
	EPYON_BEHAVIORS[EPYON_POSTFIGHT][EQUIP_PISTOL] = epyon_equipBehaviorFactory(WEAPON_PISTOL, 'pistol');
	EPYON_BEHAVIORS[EPYON_POSTFIGHT][EQUIP_MAGNUM] = epyon_equipBehaviorFactory(WEAPON_MAGNUM, 'magnum');

	EPYON_BEHAVIORS[EPYON_POSTFIGHT][CHIP_BANDAGE] = epyon_healChipBehaviorFactory(CHIP_BANDAGE, 'bandage');
	EPYON_BEHAVIORS[EPYON_POSTFIGHT][CHIP_CURE] = epyon_healChipBehaviorFactory(CHIP_CURE, 'cure');
	EPYON_BEHAVIORS[EPYON_POSTFIGHT][CHIP_SPARK] = EPYON_BEHAVIORS[EPYON_FIGHT][CHIP_SPARK];
}
