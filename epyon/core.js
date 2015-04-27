function epyon_aquireTarget(){
	var enemy = null;
	// On recupere les ennemis, vivants, à porté
	var enemiesInRange = [];
	for (var leek in eGetAliveEnemies()){
		if (getPathLength(eGetCell(self),eGetCell(leek)) <= self['range'] && !leek['summon']) enemiesInRange[leek['id']] = leek;
	}
	// On détermine le plus affaibli d'entre eux
	var lowerHealth = 1;
	var actualHealth;
	var leekInRange;
	for(var leek in enemiesInRange) {
		actualHealth = getLife(leek['id'])/leek['totalLife'];
		if (actualHealth < lowerHealth) {	
			lowerHealth = actualHealth;
			enemy = leek;
		}
		
		leekInRange = leek;
	}
	// Si aucun n'est affaibli, on prend le plus proche
	if(!enemy) enemy = epyon_getLeek(getNearestEnemy());
	
	if (enemy['summon'] && leekInRange) enemy = leekInRange;
	
	EPYON_TARGET_DISTANCE = getPathLength(eGetCell(self), eGetCell(enemy));
	
	if (enemy != target){
		target = enemy;
		epyon_debug('target is now '+target['name']);
	}
	
	return target;
}

function epyon_updateAgressions(){	
	var copy = EPYON_LEEKS;
	arrayIter(copy, function(leekId, eLeek){
		EPYON_LEEKS[leekId]['agression'] = epyon_computeAgression(eLeek);
		epyon_debug('A for '+EPYON_LEEKS[leekId]['name']+' : '+EPYON_LEEKS[leekId]['agression']);
	});
	
	epyon_updateSelfRef();
}

function epyon_computeAgression(epyonLeek){
	var cumulatedA = 0,
		totalCoef = 0;
	
	arrayIter(EPYON_CONFIG['A'], function(scorerName, scorer){
		if (scorer['coef'] > 0){
			var returnedScore = scorer['fn'](epyonLeek);
			if (returnedScore == null) return;
			
			var score = min(1, max(returnedScore, 0));
			epyon_debug(scorerName+' score '+score+' coef '+scorer['coef']);
			cumulatedA += score * scorer['coef'];
			totalCoef += scorer['coef'];
		}
	});
	
	return (totalCoef > 0) ? cumulatedA / totalCoef : 1;
}

function epyon_act(){
	//compute S
	var S = self['agression'] - target['agression'];
	epyon_debug('S computed to '+S);
	
	var totalMP = self['MP'],
		totalAP = self['AP'];
		
	var spentPoints = epyon_prefight(S, totalAP, totalMP);
	
	var allocatedAP = totalAP - spentPoints[0];
	var allocatedMP = epyon_allocateAttackMP(S, totalMP - spentPoints[1]);
	
	//init vars for later
	var remainingMP = totalMP - allocatedMP - spentPoints[1];
	var remainingAP = 0;//totalAP - spentAP - allocatedAP is always 0
	
//	if (allocatedMP > 0){
	epyon_debug('allocated MP: '+allocatedMP);
	epyon_debug('allocated AP: '+allocatedAP);
		
	//try to find attacks for as long as the AP & MP last
	var attacks = [];
	var foundSuitableAttacks = false;
	while(count(attacks = epyon_listBehaviors(EPYON_FIGHT, allocatedAP, allocatedMP)) > 0){
		var selected = EPYON_CONFIG['select_fight'](attacks, allocatedAP, allocatedMP);
		if (!selected) break;
		epyon_debug('using fight move '+selected['type']+' for '+selected['AP']+'AP and '+selected['MP']+'MP');
		allocatedAP -= selected['AP'];
		allocatedMP -= selected['MP'];
		selected['fn']();
		foundSuitableAttacks = true;
	};
		
	remainingAP += allocatedAP;
	remainingMP += allocatedMP;
	
	epyon_debug('remaining MP after attacks: '+remainingMP);
	epyon_debug('remaining AP after attacks: '+remainingAP);
	
	if (remainingMP > 0 && S > EPYON_CONFIG['flee']){
		var distanceToEnemy = getPathLength(eGetCell(self), eGetCell(target)),
			dif = distanceToEnemy - EPYON_CONFIG['engage'];
		
		epyon_debug('diff from ideal distance: '+dif);
		
		if (dif > 0){
			epyon_debug('moving closer');
			epyon_moveTowardsTarget(min(remainingMP, dif));
		}
		else if (dif < 0){
			epyon_debug('backing off');
			epyon_moveToSafety(min(remainingMP, abs(dif)));
		}
		else{
			epyon_debug('staying in position');
		}
	}
	else if (S <= EPYON_CONFIG['flee']){
		epyon_debug('fleeing');
		epyon_moveToSafety(remainingMP);
	}
	
	if (remainingAP > 0) epyon_postfight(remainingAP, 0);//spend the remaining AP on whatever
}

//determines how many Mp it is safe to spend on attacks this turn
function epyon_allocateAttackMP(S, max){
	if (S <= EPYON_CONFIG['flee']) return 0;
	else if (S < 0) return round(max / 2);
	else return max;
}

//spends AP on actions that are prioritized over combat
//returns the amount of AP and MP spent
function epyon_prefight(S, maxAP, maxMP){
	epyon_debug('Running prefight');
	var APcounter = 0,
		MPcounter = 0;
	var behaviors = [];
	
	while(count(behaviors = epyon_listBehaviors(EPYON_PREFIGHT, maxAP, maxMP)) > 0){
		var selected = EPYON_CONFIG['select_prefight'](behaviors, maxAP, maxMP);
		if (!selected) break;
		epyon_debug('using prefight '+selected['type']+' for '+selected['AP']+'AP and '+selected['MP']+'MP');
		maxAP -= selected['AP'];
		maxMP -= selected['MP'];
		APcounter += selected['AP'];
		MPcounter += selected['MP'];
		selected['fn']();
	};
	
	return [APcounter, MPcounter];
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

function epyon_denyChallenge(){
	if (getFightContext() === FIGHT_CONTEXT_CHALLENGE){
		var denied = true,
			enemies = getEnemies(),
			l = count(enemies);
		
		for (var i = 0; i < l; i++){
			if (inArray(EPYON_CONFIG['whitelist']['farmers'], getFarmerName(enemies[i])) ||
				inArray(EPYON_CONFIG['whitelist']['teams'], getTeamName(enemies[i]))){
				denied = false;
				break;
			}
		}
		
		//challenge denied, just fuck up everything
		if (denied){
			debugW('challenge denied');
			EPYON_CONFIG[EPYON_PREFIGHT] = [];
			EPYON_CONFIG[EPYON_FIGHT] = [];
			EPYON_CONFIG[EPYON_POSTFIGHT] = [];
		}
	}
}
