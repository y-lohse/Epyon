global EPYON_VERSION = '5.0a';
global EPYON_LEVEL = getLevel();

function epyon_debug(message){
	debug('epyon: '+message);
}
//compute the amount of operations & instructions between two arbitrary moments
global epyon_stats = [];

function epyon_startStats(name){
	epyon_stats[name] = [
		'i': getInstructionsCount(),
		'o': getOperations()
	];
}

function epyon_stopStats(name){
	if (epyon_stats[name]){
		var instructionDif = getInstructionsCount() - epyon_stats[name]['i'];
		var operationDif = getOperations() - epyon_stats[name]['o'];
		
		return ['i': instructionDif, 'o': operationDif];
	}
	else{
		return ['i': 'err', 'o': 'err'];
	}
}

function epyon_bind(fn, args){
	return function(){
		var argLength = count(args);
		if (argLength === 1) fn(args[0]);
		else if (argLength === 2) fn(args[0], args[1]);
		else if (argLength === 3) fn(args[0], args[1], args[2]);
		else if (argLength === 4) fn(args[0], args[1], args[2], args[3]);
	};
}

if (getTurn() == 1){
	epyon_debug('v'+EPYON_VERSION);
	epyon_startStats('init');
}