global EPYON_VERSION = '0.0.0';
global EPYON_WATCHLIST = [];

include('epyon.leek.ls');
include('epyon.map.ls');
include('epyon.behavior.ls');

function epyon_debug(message){
	debug('epyon: '+message);
}

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
	
	arrayIter(EPYON_WATCHLIST, epyon_updateAgression);
}

function epyon_updateAgression(epyonLeek){
	epyon_debug('update agression for '+epyonLeek['name']);
	epyonLeek['agression'] = 1;
}

function epyon_act(){
	var BERSERK = 0.2;//a high valu in berserking will make the leek charge towards the enemy even when the fight is not estimaed in his favor. A low value will make him bck off more easily.
	
	//compute S
	var S = self['agression'] - target['agression'];
	epyon_debug('S computed to '+S);
	
	var totalMP = 3,
		totalAP = 10;
		
	var allocatedMP = epyon_allocateAttackMP(S, totalMP);
	var spentAP = epyon_priorityActions(S, totalAP);
	var allocatedAP = totalAP - spentAP;
	
	var remainingMP = totalMP - allocatedMP;
	var remainingAP = 0;//totalAP - spentAP - allocatedAP is always 0
	
	if (allocatedMP > 0){
		epyon_debug('allocated movement points: '+AP);
		
		var attacks = epyon_listAttacks(allocatedMP, allocatedAP);//getPotentialAttacks(allocatedMP, remainingAP)//renvois un cout en MP, AP, une estimation de degats et une fonctio na executer
		
		if (count(attacks) > 0){
			//@TODO: tarnsformer tout ce if en un while si possible?
			var canAttack = true;
			
			while (canAttack){
				canAttack = false;//hard limit to one attack
				
				//@TODO: trouver la meilleure attaque possible
				attacks[0]['fn']();
				allocatedAP -= attacks[0]['AP'];
				allocatedMP -= attacks[0]['MP'];
			};
			
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
	
	epyon_moveToSafety(remainingMP);
	
	if (remainingAP > 0){
		//@TODO actions non prioritaires:
		//- équiper une arme
		//- se soigner
		//- communiquer
	}
}

//determines how many Mp it is safe to spend on attacks this turn
function epyon_allocateAttackMP(S, max){
	if (S < -0.5) return 0;
	else if (S < 0) return round(max / 2);
	else return max;
}

//spends AP on actions that are prioritzed over combat
//returns the amount of AP spent
function epyon_priorityActions(S, AP){
	//@TODO: activer les bouclier
	//@TODO: s'équiper d'une arme
	//@TODO: déterminer s'il faut se soigner en urgence
	return 0;//didn't spend any AP
}