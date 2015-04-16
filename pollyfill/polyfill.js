//EPYON Polyfill
if (getLevel() < 12){
	global PF_TURN = 0;
	PF_TURN++;
	
	function getTurn(){
		return PF_TURN;
	}
}

//canUseWeapon polyfill
if (getLevel() < 29){
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
			
		var area = getWeaponArea(weapon);
		
		if (area === AREA_POINT || area === AREA_LASER_LINE){
			return distance <= maxScope && distance >= minScope && lineIsOk && lineOfSight(myCell, leekCell);
		}
		else if (area === AREA_CIRCLE_1){//3
			return round(distance) == 3 && lineIsOk;
		}
		else if (area === AREA_CIRCLE_2){//5
			return round(distance) == 5 && lineIsOk;
		}
		else if (area === AREA_CIRCLE_3){//7
			return round(distance) == 7 && lineIsOk;
		}
		else{
			//should not happen, but just in case...
			return false;
		}
	}
}

//getCoolDown polyfill
if (getLevel() < 36){
	global PF_CHIP_COOLDOWNS = [];
	
	//only works for onw chips
	function getCoolDown(CHIP){
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
}
else{
	global useChipShim = useChip;
}