function epyon_bulb(){
	var configBackup = EPYON_CONFIG;
	
	EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_BANDAGE, CHIP_HELMET, CHIP_PROTEIN];
	EPYON_CONFIG[EPYON_FIGHT] = [CHIP_PEBBLE];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	epyon_loadAliveEnemies();
	epyon_updateAgressions();
	epyon_aquireTarget();
	epyon_act();
	
	EPYON_CONFIG = configBackup;
}