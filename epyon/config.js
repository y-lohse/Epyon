global EPYON_CONFIG = [];

global epyon_dummy_selector = function(candidates){
	return candidates[0];
};

if (getTurn() === 1){
	//inventory
	EPYON_CONFIG[EPYON_PREFIGHT] = [];
	EPYON_CONFIG[EPYON_FIGHT] = [];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	//selectors
	EPYON_CONFIG['select_prefight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_fight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_postfight'] = epyon_dummy_selector;
	
	EPYON_CONFIG['A'] = [
		'health': ['fn': epyon_aScorerHealth, 'coef': 1],
	];
	
	//charcter traits
	EPYON_CONFIG['suicidal'] = 0;//[0;1] with a higher suicidal value, the leek will stay agressive despite beeing low on health
}