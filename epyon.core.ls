//include('epyon.core.ls');
//include('epyon.leek.ls');
//include('epyon.map.ls');
//include('epyon.behavior.ls');

global EPYON_WATCHLIST = [];

function epyon_aquireTarget(){
	var enemy = epyon_getLeek(getNearestEnemy());
	
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

//elects what is estimated as the mos tsuitable attack for whatever reason
function epyon_selectSuitableAttack(attacks){
	//@TODo: renvoyer celle qui consomme le moins de MP
	return attacks[0];
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