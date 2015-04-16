global EPYON_VERSION = '0.4.2';

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
global EPYON_CONFIG = [];

if (getTurn() === 1){
	EPYON_CONFIG['attacks'] = [];
	EPYON_CONFIG['preparations'] = [];
	EPYON_CONFIG['behaviors'] = [];
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
//include('epyon.leek.ls');

//attacking behaviors
global EPYON_ATTACKS = [];

function epyon_registerAttack(name, candidateFn){
	EPYON_ATTACKS[name] = candidateFn;
}

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

function epyon_registerBehavior(name, candidateFn){
	EPYON_BONUS_BEHAVIORS[name] = candidateFn;
}

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

function epyon_registerPreparation(name, candidateFn){
	EPYON_PREPARATIONS[name] = candidateFn;
}

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
	var spentAP = epyon_preparations(S, totalAP);
	var allocatedAP = totalAP - spentAP;
	
	var remainingMP = totalMP - allocatedMP;
	var remainingAP = 0;//totalAP - spentAP - allocatedAP is always 0
	
	if (allocatedMP > 0){
		epyon_debug('allocated MP: '+allocatedMP);
		epyon_debug('allocated AP: '+allocatedAP);
		
		//try to find attacks for as long as the AP & MP last
		var attacks = [];
		var foundSUitableAttacks = false;
		while(count(attacks = epyon_listAttacks(allocatedMP, allocatedAP)) > 0){
			var selected = epyon_selectSuitableAttack(attacks);
			epyon_debug('attacking with '+selected['name']+' for '+selected['AP']+'AP and '+selected['MP']+'MP');
			allocatedAP -= selected['AP'];
			allocatedMP -= selected['MP'];
			selected['fn']();
			foundSUitableAttacks = true;
		};
		
		if (foundSUitableAttacks){
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
			remainingAP += allocatedAP;//re-aalocate all APs
			remainingMP += allocatedMP;
		}
	}
	
	epyon_debug('remaining MP after attacks: '+remainingMP);
	epyon_debug('remaining AP after attacks: '+remainingAP);
	
	if (remainingMP > 0) epyon_moveToSafety(remainingMP);
	
	if (remainingAP > 0) epyon_bonusBehaviors(remainingAP);//spend the remaining AP on whatever
}

//determines how many Mp it is safe to spend on attacks this turn
function epyon_allocateAttackMP(S, max){
	if (S < -0.5) return 0;
	else if (S < 0) return round(max / 2);
	else return max;
}

//spends AP on actions that are prioritzed over combat
//returns the amount of AP spent
function epyon_preparations(S, maxAP){
	//@TODO: activer les bouclier
	//@TODO: s'équiper d'une arme
	//@TODO: déterminer s'il faut se soigner en urgence
	epyon_debug('Running preparations');
	var APcounter = 0;
	var preparations = [];
	
	while(count(preparations = epyon_listPreparations(maxAP)) > 0){
		var selected = epyon_selectSuitableBehavior(preparations);
		epyon_debug('preparation '+selected['name']+' for '+selected['AP']+'AP');
		maxAP -= selected['AP'];
		APcounter += selected['AP'];
		selected['fn']();
	};
	
	return APcounter;
}

//spends the AP on bonus actions
function epyon_bonusBehaviors(maxAP){
	//@TODO actions non prioritaires:
	//- équiper une arme
	//- se soigner
	//- communiquer
	epyon_debug('Running bonus behaviors');
	var behaviors = [];
	
	while(count(behaviors = epyon_listBonusBehaviors(maxAP)) > 0){
		var selected = epyon_selectSuitableBehavior(behaviors);
		epyon_debug('behavior '+selected['name']+' for '+selected['AP']+'AP');
		maxAP -= selected['AP'];
		selected['fn']();
	};
}

//selects what is estimated as the most suitable attack for whatever reason
function epyon_selectSuitableAttack(attacks){
	//find the one with the msot damages
	var damages = [];
	
	var ratios = arrayIter(attacks, function(index, attack){
		damages[attack['damage']] = attack;
	});
	
	keySort(damages, SORT_DESC);
	
	return shift(damages);
}

//elects what is estimated as the most suitable ehavior for whatever reason
function epyon_selectSuitableBehavior(behaviors){
	//@TODo: faire un choix pertinent
	return behaviors[0];
}

//same shit
function epyon_selectSuitablePreparation(preparations){
	//@TODo: faire un choix pertinent
	return preparations[0];
}
if (getTurn() == 1){
	var initStats = epyon_stopStats('init');
	epyon_debug('init '+initStats['i']+' i & '+initStats['o']+' o');
}