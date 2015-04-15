global EPYON_VERSION = '0.4.1';

function epyon_debug(message){
	debug('epyon: '+message);
}

function epyon_budget(){
	epyon_debug('instructions: '+getInstructionsCount()+'/'+INSTRUCTIONS_LIMIT);
	epyon_debug('operations: '+getOperations()+'/'+OPERATIONS_LIMIT);
}

//@TODO: permettre de mesurer la conso de quelques lignes, avec un start/stop
if (getTurn() == 1) epyon_debug('v'+EPYON_VERSION);//@TODO: virer la dépendence envers getTurn