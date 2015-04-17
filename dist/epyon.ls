function canUseWeapon(weapon, leek){
	//handles the polimorphic nature of the original function
	if (!leek){
		leek = weapon;
		weapon = getWeapon();
	}

	var myCell = getCell(),
		leekCell = getCell(leek);

	var maxScope = getWeaponMaxScope(weapon),
		minScope = getWeaponMinScope(weapon),
		inline = isInlineWeapon(weapon),
		distance = getDistance(myCell, leekCell);

	var lineIsOk;
	if (!inline) lineIsOk = true;
	else lineIsOk = isOnSameLine(myCell, leekCell);

	//should work the same for all area types
	return distance <= maxScope && distance >= minScope && lineIsOk && lineOfSight(myCell, leekCell);
}
global PF_CHIP_COOLDOWNS = [];
global PF_CHIP_COOLDOWNS_MIN_LVL = 36;
	
//only works for own chips
function getCoolDown(CHIP){
	if (PF_CHIP_COOLDOWNS[CHIP]){
		return max(0, getChipCooldown(CHIP) - (getTurn() - PF_CHIP_COOLDOWNS[CHIP]));
	}
	else return 0;
}

function useChipShim(CHIP, leek){
	var r = useChip(CHIP, leek);
	if (r === USE_SUCCESS) PF_CHIP_COOLDOWNS[CHIP] = getTurn();
	return r;
}
global EPYON_VERSION = '0.8.0';

function epyon_debug(message){
	debug('epyon: '+message);
}
//compute the amount of operations & instructions between two arbitrary moments
global epyon_stats = [];

function epyon_startStats(name){
	epyon_stats[name] = [
		'i': getInstructionsCount(),
		'o': getOperations()
	];
}

function epyon_stopStats(name){
	if (epyon_stats[name]){
		var instructionDif = getInstructionsCount() - epyon_stats[name]['i'];
		var operationDif = getOperations() - epyon_stats[name]['o'];
		
		return ['i': instructionDif, 'o': operationDif];
	}
	else{
		return ['i': 'err', 'o': 'err'];
	}
}

if (getTurn() == 1){
	epyon_debug('v'+EPYON_VERSION);
	epyon_startStats('init');
}
global EPYON_LEEKS = [];
global EPYON_TARGET_DISTANCE; 

function epyon_getLeek(leekId){
	if (EPYON_LEEKS[leekId]){
		return epyon_updateLeek(EPYON_LEEKS[leekId]);
	}
	
	debug('creating leek '+leekId);
	var leek = [];
	
	leek['id'] = leekId;
	leek['name'] = getName(leekId);
	leek['agression'] = 1;
	
	EPYON_LEEKS[leekId] = leek;
	
	return leek;
}

function epyon_updateLeek(epyonLeek){
	//@TODO: maj des propriétés qui changent
	return epyonLeek;
}

global self = epyon_getLeek(getLeek());
global target = null;
//include('epyon.leek.ls');

function epyon_moveTowardsTarget(maxMp){
	//@TODO: se déplace vers l'adversaire mais essayer de rester a couvert
	var cell = getCell(target['id']);
	moveTowardCell(cell, maxMp);
}

function epyon_moveToSafety(maxMp){
	//@TODO:essayer de se mettre à l'abris plutot que fuir en ligne droite
	moveAwayFrom(target['id'], maxMp);
}
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
global EPYON_CONFIG = [];

global epyon_dummy_selector = function(candidates){
	return candidates[0];
};

if (getTurn() === 1){
	EPYON_CONFIG[EPYON_PREFIGHT] = [];
	EPYON_CONFIG[EPYON_FIGHT] = [];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	EPYON_CONFIG['select_prefight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_fight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_postfight'] = epyon_dummy_selector;
}
//include('epyon.core.ls');
//include('epyon.leek.ls');
//include('epyon.map.ls');
//include('epyon.behavior.ls');

global EPYON_WATCHLIST = [];

function epyon_aquireTarget(){
	var enemy = epyon_getLeek(getNearestEnemy());
	
	EPYON_TARGET_DISTANCE = getCellDistance(getCell(), getCell(enemy['id']));
	
	if (enemy != target){
		EPYON_WATCHLIST = [enemy];
		target = enemy;
		epyon_debug('target is now '+target['name']);
	}
	
	return target;
}

function epyon_updateAgressions(){
	epyon_updateAgression(self);
	
	arrayIter(EPYON_WATCHLIST, function(epyonLeek){
		epyon_debug('update agression for '+epyonLeek['name']);
		epyonLeek['agression'] = epyon_updateAgression(epyonLeek);
	});
}

function epyon_updateAgression(epyonLeek){
	return 1;
}

function epyon_act(){
	var BERSERK = 0.2;//a high valu in berserking will make the leek charge towards the enemy even when the fight is not estimaed in his favor. A low value will make him bck off more easily.
	
	//compute S
	var S = self['agression'] - target['agression'];
	epyon_debug('S computed to '+S);
	
	var totalMP = 3,
		totalAP = 10;
		
	var allocatedMP = epyon_allocateAttackMP(S, totalMP);
	var spentAP = epyon_prefight(S, totalAP, 0);
	var allocatedAP = totalAP - spentAP;
	
	var remainingMP = totalMP - allocatedMP;
	var remainingAP = 0;//totalAP - spentAP - allocatedAP is always 0
	
	if (allocatedMP > 0){
		epyon_debug('allocated MP: '+allocatedMP);
		epyon_debug('allocated AP: '+allocatedAP);
		
		//try to find attacks for as long as the AP & MP last
		var attacks = [];
		var foundSuitableAttacks = false;
		while(count(attacks = epyon_listBehaviors(EPYON_FIGHT, allocatedAP, allocatedMP)) > 0){
			var selected = EPYON_CONFIG['select_fight'](attacks, allocatedAP, allocatedMP);
			if (!selected) break;
			epyon_debug('using fight move '+selected['name']+' for '+selected['AP']+'AP and '+selected['MP']+'MP');
			allocatedAP -= selected['AP'];
			allocatedMP -= selected['MP'];
			selected['fn']();
			foundSuitableAttacks = true;
		};
		
		if (foundSuitableAttacks){
			//re ttaribut unsuded points
			remainingAP += allocatedAP;
			remainingMP += allocatedMP;
		}
		else if (S >= 0 - BERSERK){
			epyon_debug('no suitable attacks found, moving towards enemy');
			remainingAP += allocatedAP;//re-aalocate all APs
			epyon_moveTowardsTarget(allocatedMP);
		}
		else{
			//this behavior could posibly lead to flee too easily
			epyon_debug('no suitable attacks found, backing off');
			remainingAP += allocatedAP;//re-alocate all APs
			remainingMP += allocatedMP;
		}
	}
	
	epyon_debug('remaining MP after attacks: '+remainingMP);
	epyon_debug('remaining AP after attacks: '+remainingAP);
	
	if (remainingMP > 0) epyon_moveToSafety(remainingMP);
	
	if (remainingAP > 0) epyon_postfight(remainingAP, 0);//spend the remaining AP on whatever
}

//determines how many Mp it is safe to spend on attacks this turn
function epyon_allocateAttackMP(S, max){
	if (S < -0.5) return 0;
	else if (S < 0) return round(max / 2);
	else return max;
}

//spends AP on actions that are prioritized over combat
//returns the amount of AP spent
function epyon_prefight(S, maxAP, maxMP){
	epyon_debug('Running prefight');
	var APcounter = 0;
	var behaviors = [];
	
	while(count(behaviors = epyon_listBehaviors(EPYON_PREFIGHT, maxAP, maxMP)) > 0){
		var selected = EPYON_CONFIG['select_prefight'](behaviors, maxAP, maxMP);
		if (!selected) break;
		epyon_debug('using prefight '+selected['name']+' for '+selected['AP']+'AP');
		maxAP -= selected['AP'];
		APcounter += selected['AP'];
		selected['fn']();
	};
	
	return APcounter;
}

//spends the AP on bonus actions
function epyon_postfight(maxAP, maxMP){
	epyon_debug('Running postfight');
	var behaviors = [];
	
	while(count(behaviors = epyon_listBehaviors(EPYON_POSTFIGHT, maxAP, maxMP)) > 0){
		var selected = EPYON_CONFIG['select_postfight'](behaviors, maxAP, maxMP);
		if (!selected) break;
		epyon_debug('using postfight '+selected['name']+' for '+selected['AP']+'AP');
		maxAP -= selected['AP'];
		selected['fn']();
	};
}
if (getTurn() == 1){
	var initStats = epyon_stopStats('init');
	epyon_debug('init '+initStats['i']+' i & '+initStats['o']+' o');
}