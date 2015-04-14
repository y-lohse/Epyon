global EPYON_VERSION = '0.0.0';
global EPYON_WATCHLIST = [];

include('epyon.leek.ls');

function epyon_debug(message){
	debug('epyon: '+message);
}

function epyon_aquireTarget(){
	debug('epyon: aquiring target');
	var enemy = createLeek(getNearestEnemy());
	EPYON_WATCHLIST = [enemy];
	epyon_debug('target is now '+enemy['id']);
	return enemy;
}

function epyon_updateAgressions(){
	epyon_updateAgression(self);
	
	arrayIter(EPYON_WATCHLIST, epyon_updateAgression);
}

function epyon_updateAgression(epyonLeek){
	epyon_debug('update agression for '+epyonLeek['id']);
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