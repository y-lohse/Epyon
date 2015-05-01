global EPYON_CONFIG = [];

global epyon_dummy_selector = function(candidates){
	return candidates[0];
};

if (getTurn() === 1){
	//inventory
	EPYON_CONFIG[EPYON_PREFIGHT] = [];
	EPYON_CONFIG[EPYON_FIGHT] = [];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	//chanllenge whitelisting
	EPYON_CONFIG['whitelist'] = [
		'farmers': [],
		'teams': []
	];
	
	//selectors
	EPYON_CONFIG['select_prefight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_fight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_postfight'] = epyon_dummy_selector;
	
	EPYON_CONFIG['destination'] = epyon_getDefaultDestination;
	EPYON_CONFIG['cell_scoring'] = epyon_defaultCellCoef;
	
	//scorer functions receive a leek as parameter and score him on any criteria the ysee fit, where 0 is shit and 1 is great. Return values are clamped between 0 and 1 anyway. Each scorer is weighted. If the weight (coef) is 0 for a scorer, the scorer is ignored.
	EPYON_CONFIG['A'] = [
		'health': ['fn': epyon_aScorerHealth, 'coef': 2],
		'absShield': ['fn': epyon_aScorerAbsoluteShield, 'coef': (EPYON_LEVEL >= 38) ? 1 : 0],
		'relShield': ['fn': epyon_aScorerRelativeShield, 'coef': (EPYON_LEVEL >= 38) ? 1 : 0],
	];
	
	EPYON_CONFIG['C'] = [
		'destination': ['fn': epyon_cScorerDestination, 'coef': 1],
		'engage': ['fn': epyon_cScorerEngage, 'coef': 1],
		'border': ['fn': epyon_cScorerBorder, 'coef': 1],
		'obstacles': ['fn': epyon_cScorerObstacles, 'coef': (EPYON_LEVEL >= 21) ? 1 : 0],
		'los': ['fn': epyon_cScorerLoS, 'coef': 1],
		'enemyprox': ['fn': epyon_cScorerEnemyProximity, 'coef': 1],
		'allyprox': ['fn': epyon_cScorerAllyProximity, 'coef': 1],
	];
	
	EPYON_CONFIG['suicidal'] = 0;//[0;1] with a higher suicidal value, the leek will stay agressive despite being low on health
	
	EPYON_CONFIG['engage'] = 5;
	EPYON_CONFIG['pack'] = 3;
	EPYON_CONFIG['flee'] = -0.4;
}