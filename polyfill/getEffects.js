//lvl 9
function getChipEffects(CHIP_ID){
	if (CHIP_ID === CHIP_SHOCK) return [[1,5,7,0,3]];
	else if (CHIP_ID === CHIP_PEBBLE) return [[1,2,17,0,3]];
	else if (CHIP_ID === CHIP_SPARK) return [[1,8,16,0,3]];
}

function getWeaponEffects(WEAPON_ID){
	if (WEAPON_ID === WEAPON_PISTOL) return [[1,15,20,0,3]];
	else if (WEAPON_ID === WEAPON_MACHINE_GUN) return [[1,20,24,0,3]];
}