//lvl 36
global PF_CHIP_COOLDOWNS = [];
	
//only works for own chips
function getCooldown(CHIP){
	if (PF_CHIP_COOLDOWNS[CHIP]){
		return max(0, getChipCooldown(CHIP) - (getTurn() - PF_CHIP_COOLDOWNS[CHIP]));
	}
	else return 0;
}

function useChipShim(CHIP, leek){
	var r = useChip(CHIP, leek);
	if (r === USE_SUCCESS) PF_CHIP_COOLDOWNS[CHIP] = getTurn();
	return r;
}