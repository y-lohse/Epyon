include('inc.self');

function canUseChipOnEnemy(chip){
	//@TODO: account for chip area type
	var myCell = myGetCell(),
		enemyCell = getCell(self['target']),
		chipArea = getChipMaxScope(chip);
	
	var distance = getDistance(myCell, enemyCell);
		
	return (distance <= chipArea && getChipCooldown(chip) <= 0);
}

function useChipFor(chip, maxCost){
	var result,
		costCount = 0,
		costIncrement = getChipCost(chip);
	
	do{
		costCount += costIncrement;
		result = useChip(chip, self['target']);
	}
	while(costCount <= maxCost && (result === USE_SUCCESS || result === USE_FAILED));
}
