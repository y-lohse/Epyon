function epyon_bulb(){
	epyon_startStats('bulb');
	var configBackup = EPYON_CONFIG;
	
	EPYON_CONFIG[EPYON_PREFIGHT] = [HELMET_OTHER, BANDAGE_OTHER, PROTEIN_OTHER];
	EPYON_CONFIG[EPYON_FIGHT] = [CHIP_PEBBLE];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [CHIP_BANDAGE];
	
	EPYON_CONFIG['engage'] = configBackup['engage'] + 2;//stay out of the fights
	
	EPYON_CONFIG['select_prefight'] = function(behaviors, allocatedAP, allocatedMP){
		var byPreference = [];
	
		arrayIter(behaviors, function(behavior){
			var score = 0;
			
			if (behavior['type'] == BANDAGE_OTHER){
				score = 3;
			}
			else if (behavior['type'] == HELMET_OTHER && EPYON_TARGET_DISTANCE < 14){
				score = 1;
			}
			else if (behavior['type'] == PROTEIN_OTHER && EPYON_TARGET_DISTANCE < 8){
				score = 2;
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
	
	epyon_loadAliveEnemies();
	epyon_loadAliveAllies();
	epyon_updateAgressions();
	epyon_aquireTarget();
	if (getTurn() < getBirthTurn()+2) self['MP'] = 0;
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