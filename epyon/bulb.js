function epyon_bulb(){
	var configBackup = EPYON_CONFIG;
	
	EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_HELMET, CHIP_BANDAGE, CHIP_PROTEIN];
	EPYON_CONFIG[EPYON_FIGHT] = [CHIP_PEBBLE];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	EPYON_CONFIG['select_prefight'] = function(behaviors, allocatedAP, allocatedMP){
		var byPreference = [];
	
		debug(behaviors);
		arrayIter(behaviors, function(behavior){
			var score = 0;
			
			if (behavior['name'] == 'helmet'){
				if (EPYON_TARGET_DISTANCE < 14){
					score = 2;
				}
			}
			if (behavior['name'] == 'bandage'){
				score = 3;
			}
			if (behavior['name'] == 'protein'){
				if (EPYON_TARGET_DISTANCE < 14){
					score = 1;
				}
			}

			if (score > 0) byPreference[score] = behavior;
		});

		keySort(byPreference, SORT_DESC);

		return shift(byPreference);
	};
	EPYON_CONFIG['select_fight'] = function(attacks, allocatedAP, allocatedMP){
		return attacks[0];
	};
	
	epyon_loadAliveEnemies();
	epyon_updateAgressions();
	epyon_aquireTarget();
	epyon_act();
	
	EPYON_CONFIG = configBackup;
}