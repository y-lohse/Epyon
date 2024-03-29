function epyon_updateAgressions(){
	epyon_loadAliveEnemies();
	epyon_loadAliveAllies();
	
	var copy = EPYON_LEEKS;
	arrayIter(copy, function(leekId, eLeek){
		var a = epyon_computeAgression(eLeek);
		EPYON_LEEKS[leekId]['agression'] = a;
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

function epyon_act(){
	//compute S
	var totalEnemyA = 0;
	
	arrayIter(eGetAliveEnemies(), function(enemy){
		//plus on est dans la range d'un adversaire, plus on compte son score
		var distance = getPathLength(eGetCell(enemy), eGetCell(self));
		
		var adds = enemy['agression'] * (1 - max(0, min(1, (distance - enemy['range']) / (enemy['range']))));
		
		totalEnemyA += adds;
		debug(enemy['name']+' A '+enemy['agression']+' at distance '+distance+' with range '+enemy['range']+' weights for '+adds);
	});
	
	var S = self['agression'] - totalEnemyA;
	epyon_debug('S computed to '+S);
	
	var totalMP = self['MP'],
		totalAP = self['AP'];
		
	var spentPoints = epyon_prefight(S, totalAP, totalMP);
	
	var allocatedAP = totalAP - spentPoints[0];
	var allocatedMP = (S > EPYON_CONFIG['flee']) ? totalMP - spentPoints[1] : 0;
	
	//init vars for later
	var remainingMP = totalMP - allocatedMP - spentPoints[1];
	var remainingAP = 0;//totalAP - spentAP - allocatedAP is always 0
	
	epyon_debug('allocated MP: '+allocatedMP);
	epyon_debug('allocated AP: '+allocatedAP);
		
	//try to find attacks for as long as the AP & MP last
	var attacks = [];
	var foundSuitableAttacks = false;
	while(count(attacks = epyon_listBehaviors(EPYON_FIGHT, allocatedAP, allocatedMP)) > 0){
		var selected = EPYON_CONFIG['select_fight'](attacks, allocatedAP, allocatedMP);
		if (!selected) break;
		epyon_debug('using '+epyon_getHumanBehaviorName(selected['type'])+' for '+selected['AP']+'AP and '+selected['MP']+'MP');
		allocatedAP -= selected['AP'];
		allocatedMP -= selected['MP'];
		selected['fn']();
		foundSuitableAttacks = true;
	};
		
	remainingAP += allocatedAP;
	remainingMP += allocatedMP;
	
	epyon_debug('remaining MP after attacks: '+remainingMP);
	epyon_debug('remaining AP after attacks: '+remainingAP);
	
	EPYON_CONFIG['cell_scoring'](S);
	epyon_move(remainingMP);
	
	if (remainingAP > 0) epyon_postfight(remainingAP, 0);//spend the remaining AP on whatever
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
		epyon_debug('using '+epyon_getHumanBehaviorName(selected['type'])+' for '+selected['AP']+'AP and '+selected['MP']+'MP');
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
		epyon_debug('using '+epyon_getHumanBehaviorName(selected['name'])+' for '+selected['AP']+'AP');
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
