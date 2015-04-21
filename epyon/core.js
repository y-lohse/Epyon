global EPYON_WATCHLIST = [];

function epyon_aquireTarget(){
	var enemy = epyon_getLeek(getNearestEnemy());
	
	EPYON_TARGET_DISTANCE = getPathLength(getCell(), getCell(enemy['id']));
	
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
		else{
			//this behavior could posibly lead to flee too easily
			epyon_debug('no suitable attacks found');
			remainingAP += allocatedAP;//re-alocate all APs
			remainingMP += allocatedMP;//and MPs
		}
	}
	else{
		remainingAP = allocatedAP;
	}
	
	epyon_debug('remaining MP after attacks: '+remainingMP);
	epyon_debug('remaining AP after attacks: '+remainingAP);
	
	if (remainingMP > 0){
		//do we move forward, back off or staywhere we are?
		if (S >= EPYON_CONFIG['march']){
			epyon_debug('moving closer');
			epyon_moveTowardsTarget(remainingMP);
		}
		else if (S <= EPYON_CONFIG['flee']){
			epyon_debug('backing off');
			epyon_moveToSafety(remainingMP);
		}
		else{
			epyon_debug('staying in position');
		}
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