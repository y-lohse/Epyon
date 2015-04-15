global EPYON_VERSION = '0.0.2';

function epyon_debug(message){
	debug('epyon: '+message);
}

function epyon_budget(){
	epyon_debug('instructions: '+getInstructionsCount()+'/'+INSTRUCTIONS_LIMIT);
	epyon_debug('operations: '+getOperations()+'/'+OPERATIONS_LIMIT);
}

epyon_debug('v'+EPYON_VERSION);