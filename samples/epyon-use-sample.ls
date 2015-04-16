include('epyon.ls');

if (getTurn() == 1){
	EPYON_CONFIG['attacks'] = ['pistol', 'spark'];
	EPYON_CONFIG['preparations'] = ['bandage', 'helmet', 'wall'];
	EPYON_CONFIG['behaviors'] = ['equip_pistol'];
}

epyon_startStats('global');

epyon_aquireTarget();
epyon_updateAgressions();
epyon_act();


var globalStats = epyon_stopStats('global');
epyon_debug('instructions: '+globalStats['i']+'/'+INSTRUCTIONS_LIMIT);
epyon_debug('operations: '+globalStats['o']+'/'+OPERATIONS_LIMIT);