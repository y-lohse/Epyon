include('epyon.ls');

include('prefight.ls');
include('fight.ls');
include('postfight.ls');

if (getTurn() == 1){
	EPYON_CONFIG[EPYON_FIGHT] = [WEAPON_PISTOL, CHIP_SPARK];
	EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_BANDAGE, CHIP_HELMET, CHIP_WALL, CHIP_SHIELD];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [EQUIP_PISTOL];
}

epyon_startStats('global');

epyon_aquireTarget();
epyon_updateAgressions();
epyon_act();

var globalStats = epyon_stopStats('global');
epyon_debug('instructions: '+globalStats['i']+'/'+INSTRUCTIONS_LIMIT);
epyon_debug('operations: '+globalStats['o']+'/'+OPERATIONS_LIMIT);
