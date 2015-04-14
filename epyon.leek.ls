global EPYON_LEEKS = [];

function epyon_getLeek(leekId){
	if (EPYON_LEEKS[leekId]) return EPYON_LEEKS[leekId];
	
	debug('creating leek '+leekId);
	var leek = [];
	
	leek['id'] = leekId;
	leek['name'] = getName(leekId);
	leek['agression'] = 1;
	
	EPYON_LEEKS[leekId] = leek;
	
	return leek;
}

global self = epyon_getLeek(getLeek());
global target = null;