function epyon_bulb(){
	epyon_startStats('bulb');
	var configBackup = EPYON_CONFIG;
	
	EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_HELMET, CHIP_BANDAGE, CHIP_PROTEIN];
	EPYON_CONFIG[EPYON_FIGHT] = [CHIP_PEBBLE];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	EPYON_CONFIG['engage'] = configBackup['engage'] + 2;//stay out of the fights
	
	var summoner = epyon_getLeek(getSummoner());
	
	EPYON_CONFIG['select_prefight'] = function(behaviors, allocatedAP, allocatedMP){
		var byPreference = [];
		var turnsToImpact = eGetTurnsToImpact(summoner);
		debug('imapct for summoner: '+turnsToImpact);
	
		arrayIter(behaviors, function(behavior){
			var score = 0;
			
			if (behavior['type'] == CHIP_BANDAGE){
				score = 1;
			}
			else if (behavior['type'] == CHIP_HELMET && turnsToImpact < 1){
				score = 2;
			}
			else if (behavior['type'] == CHIP_PROTEIN && turnsToImpact < 1){
				score = 3;
			}

			if (score > 0) byPreference[score] = behavior;
		});

		keySort(byPreference, SORT_DESC);

		return shift(byPreference);
	};
	EPYON_CONFIG['select_fight'] = function(attacks, allocatedAP, allocatedMP){
		return attacks[0];
	};
	EPYON_CONFIG['select_postfight'] = function(behaviors, allocatedAP, allocatedMP){
		return behaviors[0];
	};
	
	EPYON_CONFIG['destination'] = function(){
		return eGetCell(summoner);
	};
	
	EPYON_CONFIG['cell_scoring'] = function(S){
		EPYON_CONFIG['C']['destination']['coef'] = 5;
		EPYON_CONFIG['C']['engage']['coef'] = 2;
		EPYON_CONFIG['C']['border']['coef'] = 3;
		EPYON_CONFIG['C']['obstacles']['coef'] = 0;
		EPYON_CONFIG['C']['los']['coef'] = 2;
		EPYON_CONFIG['C']['enemyprox']['coef'] = 1;
		EPYON_CONFIG['C']['allyprox']['coef'] = 2;
	};
	
	epyon_updateAgressions();
	epyon_aquireTarget();
	epyon_act();
	
	EPYON_CONFIG = configBackup;
	
	var bulbStats = epyon_stopStats('bulb');
	epyon_debug('bulb '+bulbStats['i']+' i & '+bulbStats['o']+' o');
}

function epyon_findCellToSummon(){
	var adjacents = epyon_getAdjacentCells(eGetCell(self)),
		l = count(adjacents);
	
	for (var i = 0; i < l; i++){
		if (getCellContent(adjacents[i]) === CELL_EMPTY) return adjacents[i];
	}
	
	return eGetCell(self) + 2;//and hope for the best
}