global EPYON_PREFIGHT = 'prefight';
global EPYON_FIGHT = 'fight';
global EPYON_POSTFIGHT = 'postfight';
global EPYON_BEHAVIORS = [];

//arbitrary numbers
var stupidBaseId = 80484;
global EQUIP_PISTOL 	= stupidBaseId++;
global EQUIP_MAGNUM 	= stupidBaseId++;

/*
* @param type EPYON_PREFIGHT || EPYON_FIGHT || EPYON_POSTFIGHT
*/
function epyon_listBehaviors(type, maxAP, maxMP){
	var behaviors = [];
	
	arrayIter(EPYON_BEHAVIORS, function(candidateName, candidateFn){
		if (inArray(EPYON_CONFIG[type], candidateName)){
			var result = candidateFn(maxAP, maxMP),
				hasCandidates = (count(result) > 0);
			
			if (hasCandidates && result[0]) behaviors = arrayConcat(behaviors, result);
			else if (hasCandidates) push(behaviors, result);
		}
	});
	
	return behaviors;
}

//helper functions
function epyon_getHumanBehaviorName(BEHAVIOR_ID){
	if (BEHAVIOR_ID === CHIP_ARMOR) return 'armor';
	else if (BEHAVIOR_ID === CHIP_SHIELD) return 'shield';
	else if (BEHAVIOR_ID === CHIP_HELMET) return 'helmet';
	else if (BEHAVIOR_ID === CHIP_WALL) return 'wall';
	else if (BEHAVIOR_ID === CHIP_PROTEIN) return 'protein';
	else if (BEHAVIOR_ID === CHIP_STEROID) return 'steroid';
	else if (BEHAVIOR_ID === CHIP_WARM_UP) return 'warm-up';
	else if (BEHAVIOR_ID === CHIP_BANDAGE) return 'bandage';
	else if (BEHAVIOR_ID === CHIP_CURE) return 'cure';
	else if (BEHAVIOR_ID === CHIP_VACCINE) return 'vaccine';
	else if (BEHAVIOR_ID === CHIP_PUNY_BULB) return 'puny bulb';
	else if (BEHAVIOR_ID === CHIP_PEBBLE) return 'pebble';
	else if (BEHAVIOR_ID === CHIP_SPARK) return 'spark';
	else if (BEHAVIOR_ID === CHIP_STALACTITE) return 'stalactite';
	else if (BEHAVIOR_ID === WEAPON_PISTOL) return 'pistol';
	else if (BEHAVIOR_ID === WEAPON_MAGNUM) return 'magnum';
	else if (BEHAVIOR_ID === EQUIP_PISTOL) return 'equip pistol';
	else if (BEHAVIOR_ID === EQUIP_MAGNUM) return 'equip magnum';
	else return 'Behavior#'+BEHAVIOR_ID;
}

function epyon_genericExecuteFn(TOOl_ID, targetId, cellId, theoreticalMpCost){
	var actualMpCost = 0,
		isAChip = (isChip(TOOl_ID)),
		canUseFunction = (isAChip) ? canUseChip : canUseWeapon;
	
	//ne pas utiliser de OR, canUseWeapon plante e ndessous du level 29
	if (EPYON_LEVEL < 29) actualMpCost = eMoveTowardCell(cellId);
	else if (!canUseFunction(TOOl_ID, targetId)) actualMpCost = eMoveTowardCell(cellId);

	if (actualMpCost > theoreticalMpCost) debugW('Epyon: '+(actualMpCost - theoreticalMpCost)+' extra MP was spent on moving');

	if (!isAChip && eGetWeapon(self) != TOOl_ID){
		debugW('Epyon: 1 extra AP was spent on equiping '+epyon_getHumanBehaviorName(TOOl_ID));
		eSetWeapon(TOOl_ID);
	}
	
	var result = (isAChip) ? useChipShim(TOOl_ID, targetId) : useWeapon(targetId);
	
	if (result != USE_FAILED && result != USE_SUCCESS) debugW('Epyon: usage failed - '+result);
	return result;
}

//factories to create behavior with less code
function epyon_factoryBehaviorEquip(WEAPON_ID, type){
	var fn = function(){
		if (eGetWeapon(self) != WEAPON_ID) eSetWeapon(WEAPON_ID);
	};
		
	return function(maxAP, maxMP){
		if (eGetWeapon(self) == WEAPON_ID || maxAP < 1) return [];

		epyon_debug(epyon_getHumanBehaviorName(type)+' is a candidate');

		return [
			'type': type,
			'AP': 1,
			'MP': 0,
			'fn': fn
		];
	};
}

function epyon_factoryBehaviorWeapon(WEAPON_ID){
	var effects = getWeaponEffects(WEAPON_ID);
	//average of damage + stats modifiers
	var damage = ((effects[0][1]+effects[0][2]) / 2) * (1 + self['force'] / 100);
	
	var cost = getWeaponCost(WEAPON_ID);
	var distance, minCell;
	
	return function(maxAP, maxMP){	
		if (EPYON_LEVEL >= 29  && canUseWeapon(WEAPON_ID, target['id'])) distance = 0;
		else{
			minCell = getCellToUseWeapon(WEAPON_ID, target['id']);
			distance = getPathLength(eGetCell(self), minCell);
		}

		if (cost > maxAP || distance > maxMP) return [];
		
		epyon_debug(epyon_getHumanBehaviorName(WEAPON_ID)+' is a candidate');

		return [
			'type': WEAPON_ID,
			'MP': distance,
			'AP': cost,
			'damage': damage,
			'fn': epyon_bind(epyon_genericExecuteFn, [WEAPON_ID, target['id'], minCell, distance])
		];
	};
}

function epyon_factoryBehaviorAttackChip(CHIP_ID){
	var effects = getChipEffects(CHIP_ID);
	var damage = ((effects[0][1]+effects[0][2]) / 2) * (1 + self['force'] / 100);
	var cost = getChipCost(CHIP_ID);
	var distance, minCell;
	
	return function(maxAP, maxMP){
		if (EPYON_LEVEL >= 29 && canUseChip(CHIP_ID, target['id'])) distance = 0;
		else{
			minCell = getCellToUseChip(CHIP_ID, target['id']);
			distance = getPathLength(eGetCell(self), minCell);
		}

		if (getCooldown(CHIP_ID) > 0 || cost > maxAP || distance > maxMP) return [];
		
		epyon_debug(epyon_getHumanBehaviorName(CHIP_ID)+' is a candidate');

		return [
			'type': CHIP_ID,
			'MP': distance,
			'AP': cost,
			'damage': damage,
			'fn': epyon_bind(epyon_genericExecuteFn, [CHIP_ID, target['id'], minCell, distance])
		];
	};
}

function epyon_factoryBehaviorHeal(CHIP_ID){
	var cost = getChipCost(CHIP_ID);
	var effects = getChipEffects(CHIP_ID);
	var maxHeal = effects[0][2] * (1 + self['agility'] / 100);
	
	return function(maxAP, maxMP){	
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return [];

		//find potential targets
		epyon_debug(epyon_getHumanBehaviorName(CHIP_ID)+' is a candidate');
		var candidates = [];

		arrayIter(eGetAliveAllies(), function(eLeek){
			var cell = getCellToUseChip(CHIP_ID, eLeek['id']),
				mpToBeInReach = getPathLength(eGetCell(self), cell),
				toHeal = eLeek['totalLife'] - eGetLife(eLeek);

			if (!eLeek['summon'] && mpToBeInReach <= maxMP && toHeal > maxHeal){
				push(candidates, [
					'type': CHIP_ID,
					'AP': cost,
					'MP': mpToBeInReach,
					'target': eLeek,
					'fn': epyon_bind(epyon_genericExecuteFn, [CHIP_ID, eLeek['id'], cell, mpToBeInReach])
				]);
			}
		});

		return candidates;
	};
}

function epyon_factoryBehaviorChip(CHIP_ID){
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return [];
		
		//find potential targets
		epyon_debug(epyon_getHumanBehaviorName(CHIP_ID)+' is a candidate');
		var candidates = [];

		arrayIter(eGetAliveAllies(), function(eLeek){
			var cell = getCellToUseChip(CHIP_ID, eLeek['id']),
				mpToBeInReach = getPathLength(eGetCell(self), cell);

			if (!eLeek['summon'] && mpToBeInReach <= maxMP){
				debug('adding '+eLeek['name']+' as a candidate');
				push(candidates, [
					'type': CHIP_ID,
					'AP': cost,
					'MP': mpToBeInReach,
					'target': eLeek,
					'fn': epyon_bind(epyon_genericExecuteFn, [CHIP_ID, eLeek['id'], cell, mpToBeInReach])
				]);
			}
		});
		
		return candidates;
	};
}

function epyon_factoryBehaviorSummon(CHIP_ID){
	var cost = getChipCost(CHIP_ID);
	
	var fn = function(){
		summon(CHIP_ID, epyon_findCellToSummon(), epyon_bulb);
	};
	
	return function(maxAP, maxMP){
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		epyon_debug(epyon_getHumanBehaviorName(CHIP_ID)+' is a candidate');

		return [
			'type': CHIP_PUNY_BULB,
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
}


/*********************************
*********** BEHAVIORS ************
*********************************/
if (getTurn() === 1){
	//shielding
	EPYON_BEHAVIORS[CHIP_ARMOR] = epyon_factoryBehaviorChip(CHIP_ARMOR);
	EPYON_BEHAVIORS[CHIP_SHIELD] = epyon_factoryBehaviorChip(CHIP_SHIELD);
	EPYON_BEHAVIORS[CHIP_HELMET] = epyon_factoryBehaviorChip(CHIP_HELMET);
	EPYON_BEHAVIORS[CHIP_WALL] = epyon_factoryBehaviorChip(CHIP_WALL);
	
	//power ups
	EPYON_BEHAVIORS[CHIP_PROTEIN] = epyon_factoryBehaviorChip(CHIP_PROTEIN);
	EPYON_BEHAVIORS[CHIP_STEROID] = epyon_factoryBehaviorChip(CHIP_STEROID);
	EPYON_BEHAVIORS[CHIP_WARM_UP] = epyon_factoryBehaviorChip(CHIP_WARM_UP);

	//heal
	EPYON_BEHAVIORS[CHIP_BANDAGE] = epyon_factoryBehaviorHeal(CHIP_BANDAGE);
	EPYON_BEHAVIORS[CHIP_CURE] = epyon_factoryBehaviorHeal(CHIP_CURE);
	EPYON_BEHAVIORS[CHIP_VACCINE] = epyon_factoryBehaviorHeal(CHIP_VACCINE);
	
	//summon
	EPYON_BEHAVIORS[CHIP_PUNY_BULB] = epyon_factoryBehaviorSummon(CHIP_PUNY_BULB);
	
	//offensive chips
	EPYON_BEHAVIORS[CHIP_SPARK] = epyon_factoryBehaviorAttackChip(CHIP_SPARK);
	EPYON_BEHAVIORS[CHIP_PEBBLE] = epyon_factoryBehaviorAttackChip(CHIP_PEBBLE);
	EPYON_BEHAVIORS[CHIP_STALACTITE] = epyon_factoryBehaviorAttackChip(CHIP_STALACTITE);
	
	//weapons
	EPYON_BEHAVIORS[WEAPON_PISTOL] = epyon_factoryBehaviorWeapon(WEAPON_PISTOL);
	EPYON_BEHAVIORS[WEAPON_MAGNUM] = epyon_factoryBehaviorWeapon(WEAPON_MAGNUM);
	
	//equip weapons
	EPYON_BEHAVIORS[EQUIP_PISTOL] = epyon_factoryBehaviorEquip(WEAPON_PISTOL, EQUIP_PISTOL);
	EPYON_BEHAVIORS[EQUIP_MAGNUM] = epyon_factoryBehaviorEquip(WEAPON_MAGNUM, EQUIP_MAGNUM);
}
