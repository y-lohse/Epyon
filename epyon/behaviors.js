global EPYON_PREFIGHT = 'prefight';
global EPYON_FIGHT = 'fight';
global EPYON_POSTFIGHT = 'postfight';
global EPYON_BEHAVIORS = [];

//arbitrary numbers
var stupidBaseId = 80484;
global EQUIP_PISTOL 	= stupidBaseId++;
global EQUIP_MAGNUM 	= stupidBaseId++;
global BANDAGE_OTHER 	= stupidBaseId++;
global CURE_OTHER 		= stupidBaseId++;
global VACCINE_OTHER 	= stupidBaseId++;
global PROTEIN_OTHER 	= stupidBaseId++;
global STEROID_OTHER 	= stupidBaseId++;
global WARM_UP_OTHER 	= stupidBaseId++;
global HELMET_OTHER 	= stupidBaseId++;


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
function epyon_weaponBehaviorFactory(WEAPON_ID){
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

			distance = getPathLength(currentCell, minCell);
		}

		if (cost > maxAP || distance > maxMP) return false;
		
		epyon_debug(WEAPON_ID+' weapon is a candidate');

		var excute = function(){
			var mp = 0;
			//ne pas utiliser de OR, canUseWeapon plante e ndessous du level 29
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseWeapon(WEAPON_ID, target['id'])) mp = eMoveTowardCell(minCell);
			
			if (mp > distance) debugW('Epyon: '+(mp-distance)+' extra MP was spent on moving');
			
			if (eGetWeapon(self) != WEAPON_ID){
				debugW('Epyon: 1 extra AP was spent on equiping '+WEAPON_ID);
				eSetWeapon(WEAPON_ID);
			}
			useWeapon(target['id']);
		};

		return [
			'type': WEAPON_ID,
			'MP': distance,
			'AP': cost,
			'damage': damage,
			'fn': excute
		];
	};
}

function epyon_equipBehaviorFactory(WEAPON_ID, type){
	return function(maxAP, maxMP){
		if (eGetWeapon(self) == WEAPON_ID || maxAP < 1) return false;

		epyon_debug(type+' equip is a candidate');

		var fn = function(){
			if (eGetWeapon(self) != WEAPON_ID) eSetWeapon(WEAPON_ID);
		};

		return [
			'type': type,
			'AP': 1,
			'MP': 0,
			'fn': fn
		];
	};
}

function epyon_offensiveChipBehaviorFactory(CHIP_ID){
	var effects = getChipEffects(CHIP_ID);
	var damage = ((effects[0][1]+effects[0][2]) / 2) * (1 + self['force'] / 100);
	var cost = getChipCost(CHIP_ID);
	var distance, minCell;
	
	return function(maxAP, maxMP){
		if (EPYON_LEVEL >= 29 && canUseChip(CHIP_ID, target['id'])) distance = 0;
		else{
			minCell = getCellToUseChip(CHIP_ID, target['id']);
			var currentCell = eGetCell(self);

			distance = getPathLength(currentCell, minCell);
		}

		if (getCooldown(CHIP_ID) > 0 || cost > maxAP || distance > maxMP) return false;
		
		epyon_debug(CHIP_ID+' attack chip is a candidate');

		var excute = function(){
			var mp = 0;
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, target['id'])) mp = eMoveTowardCell(minCell);
			
			if (mp > distance) debugW('Epyon: '+(mp-distance)+' extra MP was spent on moving');
			
			useChipShim(CHIP_ID, target['id']);
		};

		return [
			'type': CHIP_ID,
			'MP': distance,
			'AP': cost,
			'damage': damage,
			'fn': excute
		];
	};
}

function epyon_simpleSelfChipBehaviorFactory(CHIP_ID){
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		epyon_debug(CHIP_ID+' chip is a candidate');

		var fn = function(){
			useChipShim(CHIP_ID, self['id']);
		};

		return [
			'type': CHIP_ID,
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
}

function epyon_healChipBehaviorFactory(CHIP_ID){
	var effects = getChipEffects(CHIP_ID);
	var maxHeal = effects[0][2] * (1 + self['agility'] / 100);
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (self['totalLife']-eGetLife(self) < maxHeal || getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		epyon_debug(CHIP_ID+' heal is a candidate');

		var fn = function(){
			useChipShim(CHIP_ID, self['id']);
		};

		return [
			'type': CHIP_ID,
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
}

function epyon_healOtherChipBehaviorFactory(CHIP_ID, type){
	var cost = getChipCost(CHIP_ID);
	var effects = getChipEffects(CHIP_ID);
	var maxHeal = effects[0][2] * (1 + self['agility'] / 100);
	
	return function(maxAP, maxMP){	
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		//find potential targets
		var targets = [];

		arrayIter(eGetAliveAllies(), function(eLeek){
			var cell = getCellToUseChip(CHIP_ID, eLeek['id']),
				mpToBeInReach = getPathLength(eGetCell(self), cell),
				toHeal = eLeek['totalLife'] - eGetLife(eLeek);

			if (!eLeek['summon'] && mpToBeInReach <= maxMP && toHeal > maxHeal){
				push(targets, ['id': eLeek['id'], 
								'MP': mpToBeInReach,
								'cell': cell, 
								'heal': toHeal]);
			}
		});

		if (count(targets) === 0) return false;

		//try to select the one taht needs most healing
		var MPcost,
			healTarget,
			minCell,
			maxToHeal = 0;

		arrayIter(targets, function(data){
			if (maxToHeal < data['heal']){
				maxToHeal = data['heal'];
				MPcost = data['MP'];
				minCell = data['cell'];
				healTarget = data['id'];
			}
		});

		epyon_debug(type+' heal other is a candidate');

		var fn = function(){
			var mp = 0;
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, healTarget)) mp = eMoveTowardCell(minCell);
			
			if (mp > MPcost) debugW('Epyon: '+(mp-MPcost)+' extra MP was spent on moving');
			
			useChipShim(CHIP_ID, healTarget);
		};

		return [
			'type': type,
			'AP': cost,
			'MP': MPcost,
			'fn': fn
		];
	};
}

function epyon_simpleOtherChipBehaviorFactory(CHIP_ID, type){
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;
		
		//find potential targets
		var targets = [];

		arrayIter(eGetAliveAllies(), function(eLeek){
			var cell = getCellToUseChip(CHIP_ID, eLeek['id']),
				mpToBeInReach = getPathLength(eGetCell(self), cell);

			if (!eLeek['summon'] && mpToBeInReach <= maxMP){
				push(targets, ['id': eLeek['id'], 
								'MP': mpToBeInReach,
								'cell': cell]);
			}
		});

		if (count(targets) === 0) return false;
		else{
			debug('possible targets');
			debug(targets);
		}

		epyon_debug(type+' chip other is a candidate');
		
		//try to select the one that cost the least mp
		var MPcost = maxMP + 1,
			chipTarget,
			minCell;

		arrayIter(targets, function(data){
			if (data['MP'] < MPcost){
				MPcost = data['MP'];
				minCell = data['cell'];
				chipTarget = data['id'];
				debug('new  target '+chipTarget);
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
			'type': type,
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
	EPYON_BEHAVIORS[CHIP_ARMOR] = epyon_simpleSelfChipBehaviorFactory(CHIP_ARMOR);
	EPYON_BEHAVIORS[CHIP_SHIELD] = epyon_simpleSelfChipBehaviorFactory(CHIP_SHIELD);
	EPYON_BEHAVIORS[CHIP_HELMET] = epyon_simpleSelfChipBehaviorFactory(CHIP_HELMET);
	EPYON_BEHAVIORS[CHIP_WALL] = epyon_simpleSelfChipBehaviorFactory(CHIP_WALL);
	
	//shielding others
	EPYON_BEHAVIORS[HELMET_OTHER] = epyon_simpleOtherChipBehaviorFactory(CHIP_HELMET, HELMET_OTHER);
	
	//power ups
	EPYON_BEHAVIORS[CHIP_PROTEIN] = epyon_simpleSelfChipBehaviorFactory(CHIP_PROTEIN);
	EPYON_BEHAVIORS[CHIP_STEROID] = epyon_simpleSelfChipBehaviorFactory(CHIP_STEROID);
	EPYON_BEHAVIORS[CHIP_WARM_UP] = epyon_simpleSelfChipBehaviorFactory(CHIP_WARM_UP);
	
	//power up other
	EPYON_BEHAVIORS[PROTEIN_OTHER] = epyon_simpleOtherChipBehaviorFactory(CHIP_PROTEIN, PROTEIN_OTHER);
	EPYON_BEHAVIORS[STEROID_OTHER] = epyon_simpleOtherChipBehaviorFactory(CHIP_STEROID, STEROID_OTHER);
	EPYON_BEHAVIORS[WARM_UP_OTHER] = epyon_simpleOtherChipBehaviorFactory(CHIP_WARM_UP, WARM_UP_OTHER);

	//heal
	EPYON_BEHAVIORS[CHIP_BANDAGE] = epyon_healChipBehaviorFactory(CHIP_BANDAGE);
	EPYON_BEHAVIORS[CHIP_CURE] = epyon_healChipBehaviorFactory(CHIP_CURE);
	EPYON_BEHAVIORS[CHIP_VACCINE] = epyon_healChipBehaviorFactory(CHIP_VACCINE);
	
	//heal others
	EPYON_BEHAVIORS[BANDAGE_OTHER] = epyon_healOtherChipBehaviorFactory(CHIP_BANDAGE, BANDAGE_OTHER);
	EPYON_BEHAVIORS[CURE_OTHER] = epyon_healOtherChipBehaviorFactory(CHIP_CURE, CURE_OTHER);
	EPYON_BEHAVIORS[VACCINE_OTHER] = epyon_healOtherChipBehaviorFactory(CHIP_VACCINE, VACCINE_OTHER);
	
	//summon
	EPYON_BEHAVIORS[CHIP_PUNY_BULB] = function(maxAP, maxMP){
		var cost = getChipCost(CHIP_PUNY_BULB);
	
		if (getCooldown(CHIP_PUNY_BULB) > 0 || maxAP < cost) return false;

		epyon_debug('puny bulb is a candidate');

		var fn = function(){
			summon(CHIP_PUNY_BULB, epyon_findCellToSummon(), epyon_bulb);
		};

		return [
			'type': CHIP_PUNY_BULB,
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
	
	//offensive chips
	EPYON_BEHAVIORS[CHIP_SPARK] = epyon_offensiveChipBehaviorFactory(CHIP_SPARK);
	EPYON_BEHAVIORS[CHIP_PEBBLE] = epyon_offensiveChipBehaviorFactory(CHIP_PEBBLE);
	EPYON_BEHAVIORS[CHIP_STALACTITE] = epyon_offensiveChipBehaviorFactory(CHIP_STALACTITE);
	
	//weapons
	EPYON_BEHAVIORS[WEAPON_PISTOL] = epyon_weaponBehaviorFactory(WEAPON_PISTOL);
	EPYON_BEHAVIORS[WEAPON_MAGNUM] = epyon_weaponBehaviorFactory(WEAPON_MAGNUM);
	
	//equip weapons
	EPYON_BEHAVIORS[EQUIP_PISTOL] = epyon_equipBehaviorFactory(WEAPON_PISTOL, EQUIP_PISTOL);
	EPYON_BEHAVIORS[EQUIP_MAGNUM] = epyon_equipBehaviorFactory(WEAPON_MAGNUM, EQUIP_MAGNUM);
}
