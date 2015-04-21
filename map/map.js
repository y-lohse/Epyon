//returnsall cells within a certain walking distance
function getCellsWithin(center, distance){
	var cells = [];
	if (!center) return cells;
	
	var centerX = getCellX(center),
		centerY = getCellY(center);
		
	var maxX = centerX + distance,
		maxY = centerY + distance;
		
	//we're using getPathLength, but getCellDistance could be a good approximation
	for (var x = centerX - distance; x < maxX; x++){
		for (var y = centerY - distance; y < maxY; y++){
			var cell = getCellFromXY(x, y);
			if (cell && getPathLength(cell, center) <= distance) push(cells, cell);
		}
	}
	
	return cells;
}

function map_findNearbyCover(fromCell, withWeapon, maxDistance){
	var toCheck = getCellsWithin(fromCell, maxDistance);
	
	var safes = [];
	for (var cell in toCheck){
		if (!canUseWeaponOnCell(withWeapon, fromCell)){
			push(safes, cell);//level 40
			mark(cell, COLOR_GREEN);
		}
		else{
			mark(cell, COLOR_RED);
		}
	}
	
	return safes;
}
