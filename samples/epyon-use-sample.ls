include('epyon.ls');

include('prefight.ls');
include('fight.ls');
include('postfight.ls');

if (getTurn() == 1){
	EPYON_CONFIG[EPYON_FIGHT] = [WEAPON_PISTOL, CHIP_SPARK];
	EPYON_CONFIG[EPYON_PREFIGHT] = [CHIP_BANDAGE, CHIP_HELMET, CHIP_WALL, CHIP_SHIELD];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [EQUIP_PISTOL];
}

epyon_denyChallenge();
epyon_loadAliveEnemies();
epyon_updateAgressions();
epyon_aquireTarget();
epyon_act();