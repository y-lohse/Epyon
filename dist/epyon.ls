global useChipShim = useChip;
global EPYON_VERSION = '0.9.1';

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
function epyon_aScorerHealth(eLeek){
	return getLife(eLeek['id']) / getTotalLife(eLeek['id']) + EPYON_CONFIG['suicidal'];
}

//requires lvl40
//function epyon_aScorerAbsoluteShield(eLeek){
//	var level = getlevel(eLeek['id']);
//	var maxAbsShield = 1;
//	
//	//@TODO: utiliser getChips() pour lister les puces équipés
//	if (level >= 11) maxAbsShield += 15;//helmet
//	if (level >= 19) maxAbsShield += 20;//shield
//	if (level >= 55) maxAbsShield += 25;//armor
//	if (level >= 259) maxAbsShield += 55;//carapace
//	
//	maxAbsShield = max(maxAbsShield, 100);//chances that everything is used at once is rather low
//	
//	return getAbsoluteShield(eLeek['id']) / maxAbsShield;
//}
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
}

global EPYON_CONFIG = [];

global epyon_dummy_selector = function(candidates){
	return candidates[0];
};

//easing functions, see http://gizma.com/easing/
//b=0,  c=1, d=1

//quart out
global EPYON_EVAl_RECKLESS = function(t){
	//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiItMSooKHgtMSkqKHgtMSkqKHgtMSkqKHgtMSktMSkiLCJjb2xvciI6IiMwMDAwMDAifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyItMS40MjQ5OTk5OTk5OTk5OTk0IiwiMS44MjUwMDAwMDAwMDAwMDA2IiwiLTAuNzE5OTk5OTk5OTk5OTk5OCIsIjEuMjgwMDAwMDAwMDAwMDAwMiJdfV0-
	return -1 * ((t-1) * (t-1) * (t-1) * (t-1) -1);
};

//quad out
global EPYON_EVAl_BRAVE = function(t){
	//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiItMSooeCooeC0yKSkiLCJjb2xvciI6IiMwMDAwMDAifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyItMS40MjQ5OTk5OTk5OTk5OTk0IiwiMS44MjUwMDAwMDAwMDAwMDA2IiwiLTAuNzE5OTk5OTk5OTk5OTk5OCIsIjEuMjgwMDAwMDAwMDAwMDAwMiJdfV0-
	return -1 * (t * (t-2));
};

//linear
global EPYON_EVAl_NORMAL = function(t){
	return t;
};

if (getTurn() === 1){
	//inventory
	EPYON_CONFIG[EPYON_PREFIGHT] = [];
	EPYON_CONFIG[EPYON_FIGHT] = [];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	//selectors
	EPYON_CONFIG['select_prefight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_fight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_postfight'] = epyon_dummy_selector;
	
	//socrer functions receive a leek as parameter and score him on any criteria the ysee fit, where 0 is shit and 1 is great. Return values are clamped between 0 and 1 anyway. Each scorer is weighted. If the weight (coef) is 0 for a scorer, the scorer is ignored.
	EPYON_CONFIG['A'] = [
		'health': ['fn': epyon_aScorerHealth, 'coef': 1],
	];
	
	//charcter traits
	EPYON_CONFIG['evaluation'] = EPYON_EVAl_BRAVE;//this must be a function that receives a value between 0 and 1, and rreturns another value between 0 and 1. Built-ins are EPYON_EVAl_NORMAL, EPYON_EVAl_BRAVE, and EPYON_EVAl_RECKLESS. It influences how the AI will 
	
	EPYON_CONFIG['suicidal'] = 0;//[0;1] with a higher suicidal value, the leek will stay agressive despite being low on health
}
global EPYON_WATCHLIST = [];

function epyon_aquireTarget(){
	var enemy = epyon_getLeek(getNearestEnemy());
	
	EPYON_TARGET_DISTANCE = getCellDistance(getCell(), getCell(enemy['id']));
	
	if (enemy != target){
		target = enemy;
//		EPYON_WATCHLIST = [target];
		epyon_debug('target is now '+target['name']);
	}
	
	return target;
}

function epyon_updateAgressions(){
	epyon_debug('update own agression');
	self['agression'] = epyon_computeAgression(self, EPYON_CONFIG['evaluation']);
	epyon_debug('A:'+self['agression']);
	
	epyon_debug('update agression for '+target['name']);
	target['agression'] = epyon_computeAgression(target, EPYON_EVAl_NORMAL);
	epyon_debug('A:'+target['agression']);
	
	var l = count(EPYON_WATCHLIST);
	for (var i = 0; i < l; i++){
		epyon_debug('update agression for '+EPYON_WATCHLIST[i]['name']);
		EPYON_WATCHLIST[i]['agression'] = epyon_computeAgression(EPYON_WATCHLIST[i], EPYON_EVAl_NORMAL);
		epyon_debug('A:'+EPYON_WATCHLIST[i]['agression']);
	}
}

function epyon_computeAgression(epyonLeek, evalFunction){
	var cumulatedA = 0,
		totalCoef = 0;
	
	arrayIter(EPYON_CONFIG['A'], function(scorerName, scorer){
		if (scorer['coef'] > 0){
			var score = min(1, max(scorer['fn'](epyonLeek), 0));
			score = evalFunction(score);
			
			epyon_debug(scorerName+' score '+score+' coef '+scorer['coef']);
			cumulatedA += score;
			totalCoef += scorer['coef'];
		}
	});
	
	return (totalCoef > 0) ? cumulatedA / totalCoef : 1;
}

function epyon_act(){
	var BERSERK = 0.2;//a high valu in berserking will make the leek charge towards the enemy even when the fight is not estimaed in his favor. A low value will make him bck off more easily.
	
	//compute S
	debug('own agression: '+self['agression']);
	debug('target agression: '+target['agression']+' ('+target['name']+')');
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
	else{
		remainingAP = allocatedAP;
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