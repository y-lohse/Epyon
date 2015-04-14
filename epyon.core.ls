global EPYON_VERSION = '0.0.0';
global EPYON_WATCHLIST = [];

include('epyon.leek.ls');
include('epyon.map.ls');

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

function epyon_computeStrategy(){
	epyon_debug('computing strategy');
	
	var behaviors = [];
	
	var S = self['agression'] - target['agression'];
	epyon_debug('S computed to '+S);
	
	//S always = 0 for now, which means equals chances to win
	
	//we're not fleeing, so all MV to the attack
	var allocatedMP = 3;
	
	//...but no weapon or chips to use, so we allocate everything to moving
	var remainingMP = 3;
	
	//we spend the remaining points moving either towards or away from the target
	var cell = findBestCell(S, remainingMP);
	epyon_debug('moving towards cell '+cell);
	push(behaviors, function(){
		moveTowardCell(cell, remainingMP);
	});
	
	return behaviors;
}

function epyon_executeBehaviors(behaviors){
	epyon_debug('executing behaviors');
	arrayIter(behaviors, function(behavior){
		behavior();
	});
}