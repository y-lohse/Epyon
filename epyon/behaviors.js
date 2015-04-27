global EPYON_PREFIGHT = 'prefight';
global EPYON_FIGHT = 'fight';
global EPYON_POSTFIGHT = 'postfight';
global EPYON_BEHAVIORS = [];

//arbitrary numbers
global EQUIP_PISTOL 	= 80484;
global EQUIP_MAGNUM 	= 80485;
global BANDAGE_OTHER 	= 80486;
global CURE_OTHER 		= 80487;


/*
* @param type EPYON_PREFIGHT || EPYON_FIGHT || EPYON_POSTFIGHT
*/
function epyon_listBehaviors(type, maxAP, maxMP){
	var behaviors = [];
	
	arrayIter(EPYON_BEHAVIORS, function(candidateName, candidateFn){
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
			var mp = 0;
			//ne pas utiliser de OR, canUseWeapon plante e ndessous du level 29
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseWeapon(WEAPON_ID, target['id'])) mp = eMoveTowardCell(minCell);
			
			if (mp > distance) debugW('Epyon: '+(mp-distance)+' extra MP was spent on moving');
			
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
			'MP': 0,
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

		if (getCooldown(CHIP_ID) > 0 || cost > maxAP || distance > maxMP) return false;
		
		epyon_debug(name+' is a candidate');

		var excute = function(){
			var mp = 0;
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, target['id'])) mp = eMoveTowardCell(minCell);
			
			if (mp > distance) debugW('Epyon: '+(mp-distance)+' extra MP was spent on moving');
			
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
			'MP': 0,
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

		epyon_debug(name+' is a candidate');

		var fn = function(){
			useChipShim(CHIP_ID, self['id']);
		};

		return [
			'name': name,
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
}

function epyon_healOtherChipBehaviorFactory(CHIP_ID, name){
	var cost = getChipCost(CHIP_ID);
	var effects = getChipEffects(CHIP_ID);
	var maxHeal = effects[0][2] * (1 + self['agility'] / 100);
	
	return function(maxAP, maxMP){	
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		//find potential targets
		var allies = getAliveAllies();
		var targets = [];

		arrayIter(allies, function(leekId){
			var cell = getCellToUseChip(CHIP_ID, leekId),
				mpToBeInReach = getPathLength(eGetCell(self), cell),
				toHeal = getTotalLife(leekId)-getLife(leekId);

			if (!isSummon(leekId) && mpToBeInReach <= maxMP && toHeal > maxHeal){
				push(targets, ['id': leekId, 
								'MP': mpToBeInReach,
								'cell': cell, 
								'heal': toHeal]);
			}
		});

		if (count(targets) === 0) return false;

		//try to select the best one
		var MPcost,
			healTarget,
			minCell,
			minToHeal = 0;

		arrayIter(targets, function(data){
			if (minToHeal < data['heal']){
				minToHeal = data['heal'];
				MPcost = data['MP'];
				minCell = data['cell'];
				healTarget = data['id'];
			}
		});

		epyon_debug(name+' is a candidate');

		var fn = function(){
			var mp = 0;
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, healTarget)) mp = eMoveTowardCell(minCell);
			
			if (mp > MPcost) debugW('Epyon: '+(mp-MPcost)+' extra MP was spent on moving');
			
			useChipShim(CHIP_ID, healTarget);
		};

		return [
			'name': name,
			'AP': cost,
			'MP': MPcost,
			'fn': fn
		];
	};
}

function epyon_simpleOtherChipBehaviorFactory(CHIP_ID, name){
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;
		
		//find potential targets
		var allies = getAliveAllies();
		var targets = [];

		arrayIter(allies, function(leekId){
			var cell = getCellToUseChip(CHIP_ID, leekId),
				mpToBeInReach = getPathLength(eGetCell(self), cell);

			if (!isSummon(leekId) && mpToBeInReach <= maxMP){
				push(targets, ['id': leekId, 
								'MP': mpToBeInReach,
								'cell': cell]);
			}
		});

		if (count(targets) === 0) return false;

		epyon_debug(name+' is a candidate');
		
		//try to select the best one
		var MPcost = maxMP + 1,
			chipTarget,
			minCell;

		arrayIter(targets, function(data){
			if (MPcost < data['MP']){
				MPcost = data['MP'];
				minCell = data['cell'];
				chipTarget = data['id'];
			}
		});

		var fn = function(){
			var mp = 0;
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, chipTarget)) mp = eMoveTowardCell(minCell);
			
			if (mp > MPcost) debugW('Epyon: '+(mp-MPcost)+' extra MP was spent on moving');
			
			useChipShim(CHIP_ID, chipTarget);
		};

		return [
			'name': name,
			'AP': cost,
			'MP': MPcost,
			'fn': fn
		];
	};
}


/*********************************
*********** BEHAVIORS ************
*********************************/
if (getTurn() === 1){
	
	//shielding
	EPYON_BEHAVIORS[CHIP_ARMOR] = epyon_simpleSelfChipBehaviorFactory(CHIP_ARMOR, 'armor');
	EPYON_BEHAVIORS[CHIP_SHIELD] = epyon_simpleSelfChipBehaviorFactory(CHIP_SHIELD, 'shield');
	EPYON_BEHAVIORS[CHIP_HELMET] = epyon_simpleSelfChipBehaviorFactory(CHIP_HELMET, 'helmet');
	EPYON_BEHAVIORS[CHIP_WALL] = epyon_simpleSelfChipBehaviorFactory(CHIP_WALL, 'wall');
	
	//power ups
	EPYON_BEHAVIORS[CHIP_PROTEIN] = epyon_simpleSelfChipBehaviorFactory(CHIP_PROTEIN, 'protein');
	EPYON_BEHAVIORS[CHIP_STEROID] = epyon_simpleSelfChipBehaviorFactory(CHIP_STEROID, 'steroid');
	EPYON_BEHAVIORS[CHIP_WARM_UP] = epyon_simpleSelfChipBehaviorFactory(CHIP_WARM_UP, 'warm');

	//heal
	EPYON_BEHAVIORS[CHIP_BANDAGE] = epyon_healChipBehaviorFactory(CHIP_BANDAGE, 'bandage');
	EPYON_BEHAVIORS[CHIP_CURE] = epyon_healChipBehaviorFactory(CHIP_CURE, 'cure');
	EPYON_BEHAVIORS[CHIP_VACCINE] = epyon_healChipBehaviorFactory(CHIP_VACCINE, 'vaccin');
	
	//heal others
	EPYON_BEHAVIORS[BANDAGE_OTHER] = epyon_healOtherChipBehaviorFactory(CHIP_BANDAGE, 'bandage other');
	EPYON_BEHAVIORS[CURE_OTHER] = epyon_healOtherChipBehaviorFactory(CHIP_CURE, 'cure other');
	
	//summon
	EPYON_BEHAVIORS[CHIP_PUNY_BULB] = function(maxAP, maxMP){
		var cost = getChipCost(CHIP_PUNY_BULB);
	
		if (getCooldown(CHIP_PUNY_BULB) > 0 || maxAP < cost) return false;

		epyon_debug('puny bulb is a candidate');

		var fn = function(){
			summon(CHIP_PUNY_BULB, epyon_findCellToSummon(), epyon_bulb);
		};

		return [
			'name': 'puny bulb',
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
	
	//offensive chips
	EPYON_BEHAVIORS[CHIP_SPARK] = epyon_offensiveChipBehaviorFactory(CHIP_SPARK, 'spark');
	EPYON_BEHAVIORS[CHIP_PEBBLE] = epyon_offensiveChipBehaviorFactory(CHIP_PEBBLE, 'pebble');
	EPYON_BEHAVIORS[CHIP_STALACTITE] = epyon_offensiveChipBehaviorFactory(CHIP_STALACTITE, 'stalactite');
	
	//weapons
	EPYON_BEHAVIORS[WEAPON_PISTOL] = epyon_weaponBehaviorFactory(WEAPON_PISTOL, 'pîstol');
	EPYON_BEHAVIORS[WEAPON_MAGNUM] = epyon_weaponBehaviorFactory(WEAPON_MAGNUM, 'magnum');
	
	//equip weapons
	EPYON_BEHAVIORS[EQUIP_PISTOL] = epyon_equipBehaviorFactory(WEAPON_PISTOL, 'pistol');
	EPYON_BEHAVIORS[EQUIP_MAGNUM] = epyon_equipBehaviorFactory(WEAPON_MAGNUM, 'magnum');
}
