global EPYON_VERSION = '0.0.0';
global EPYON_WATCHLIST = [];

include('epyon.leek.ls');

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
	return [];
}

function epyon_executeBehaviors(behaviors){
	epyon_debug('executing behaviors');
	arrayIter(behaviors, function(behavior){
		//behavior();
	});
}