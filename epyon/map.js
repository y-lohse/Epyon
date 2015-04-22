global MAP_WIDTH = 0;
global MAP_HEIGHT = 0;

if (getTurn() == 1){
	var width = -1,
		height = -1,
		x = 0,
		y = 0,
		cell;
	do{
		cell = getCellFromXY(x++, 0);
		width++;
	}
	while(cell);
	
	do{
		cell = getCellFromXY(0, y++);
		height++;
	}
	while(cell);
	
	MAP_WIDTH = width;
	MAP_HEIGHT = height;
}

function epyon_moveTowardsTarget(maxMp){
	//@TODO: se déplace vers l'adversaire mais essayer de rester a couvert
	var cell = getCell(target['id']);
	eMoveTowardCellWithMax(cell, maxMp);
}

function epyon_moveToSafety(maxMp){
	//@TODO:essayer de se mettre à l'abris plutot que fuir en ligne droite
	eMoveAwayFrom(target, maxMp);
}

function epyon_analyzeCellsWithin(center, distance){
	var eCells = [],
		toGrade = getCellsWithin(center, distance);
	
	arrayIter(toGrade, function(cell){
		//grade each cell in reach
		var eCell = [
			'id': cell,
			'x': getCellX(cell),
			'y': getCellY(cell),
		];
		
		var cumulatedScore = 0,
			totalCoef = 0;
		
		arrayIter(EPYON_CONFIG['C'], function(scorerName, scorer){
			if (scorer['coef'] > 0){
				var score = min(1, max(scorer['fn'](eCell), 0));
				epyon_debug(eCell['x']+'/'+eCell['y']+' '+scorerName+' score '+score+' coef '+scorer['coef']);
				cumulatedScore += score;
				totalCoef += scorer['coef'];
			}
		});
		
		eCell['score'] = (totalCoef > 0) ? cumulatedScore / totalCoef : 1;
		push(eCells, eCell);
	});
	
	return eCells;
}

//returns all cells within a certain walking distance
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



//function map_findNearbyCover(fromCell, withWeapon, maxDistance){
//	var toCheck = getCellsWithin(fromCell, maxDistance);
//	
//	var safes = [];
//	for (var cell in toCheck){
//		if (!canUseWeaponOnCell(withWeapon, fromCell)){
//			push(safes, cell);//level 40
//			mark(cell, COLOR_GREEN);
//		}
//		else{
//			mark(cell, COLOR_RED);
//		}
//	}
//	
//	return safes;
//}