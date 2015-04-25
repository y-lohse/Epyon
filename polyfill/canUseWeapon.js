//lvl29
function canUseWeapon(weapon, leek){
	//handles the polimorphic nature of the original function
	if (!leek){
		leek = weapon;
		weapon = getWeapon();
	}

	var myCell = getCell(),
		leekCell = getCell(leek);

	var maxScope = getWeaponMaxScope(weapon),
		minScope = getWeaponMinScope(weapon),
		inline = isInlineWeapon(weapon),
		distance = getDistance(myCell, leekCell);

	var lineIsOk;
	if (!inline) lineIsOk = true;
	else lineIsOk = isOnSameLine(myCell, leekCell);

	//should work the same for all area types
	return distance <= maxScope && distance >= minScope && lineIsOk && lineOfSight(myCell, leekCell);
}