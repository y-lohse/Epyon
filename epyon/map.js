global MAP_WIDTH = 0;
global MAP_HEIGHT = 0;
global EPYON_MAP = [];

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
	
	//rpivate, DO NOT OVERRIDE
	EPYON_MAP['_destination'] = 1;
	EPYON_MAP['longest_destination'] = 1;
	EPYON_MAP['shortest_destination'] = MAP_WIDTH*2;
}

global EPYON_CACHED_PATH = [];

function epyon_getCachedPathLength(start, end){
	if (!EPYON_CACHED_PATH[start]){
		EPYON_CACHED_PATH[start] = [];
	}
	
	if (!EPYON_CACHED_PATH[start][end]){
		EPYON_CACHED_PATH[start][end] = getPathLength(start, end);
	}
	
	return EPYON_CACHED_PATH[start][end];
}

function epyon_getDefaultDestination(){
	return eGetCell(target);
}

function epyon_moveTowardsDestination(mpCost){
	debug('updating destination');
	EPYON_MAP['_destination'] = EPYON_CONFIG['destination']();
	
	debug('Destination is '+getCellX(EPYON_MAP['_destination'])+'/'+getCellY(EPYON_MAP['_destination']));
	mark(EPYON_MAP['_destination'], COLOR_BLUE);
	
	EPYON_CONFIG['C']['destination']['coef'] = 5;
	EPYON_CONFIG['C']['engage']['coef'] = 4;
	EPYON_CONFIG['C']['border']['coef'] = 2;
	EPYON_CONFIG['C']['obstacles']['coef'] = 1;
	EPYON_CONFIG['C']['los']['coef'] = 3;
	EPYON_CONFIG['C']['enemyprox']['coef'] = 2;
	EPYON_CONFIG['C']['allyprox']['coef'] = 1;
	
	//@TODO: load ignored cells
	var cellsAround = epyon_analyzeCellsWithin(eGetCell(self), mpCost);
	
	var scoredCells = [];
	
	arrayIter(cellsAround, function(eCell){
		scoredCells[round(eCell['score']*100)] = eCell;
	});
	
	keySort(scoredCells, SORT_DESC);
	
	var cell = shift(scoredCells);
	
	if (cell){
		epyon_debug('moving to '+cell);
		eMoveTowardCellWithMax(cell['id'], mpCost);
	}
	else{
		epyon_debug('no good cell found');
		eMoveTowardCellWithMax(EPYON_MAP['_destination'], mpCost);
	}
}

function epyon_moveToSafety(mpCost){
	EPYON_CONFIG['C']['destination']['coef'] = 0;
	EPYON_CONFIG['C']['engage']['coef'] = 0;
	EPYON_CONFIG['C']['border']['coef'] = 1;
	EPYON_CONFIG['C']['obstacles']['coef'] = 1;
	EPYON_CONFIG['C']['los']['coef'] = 4;
	EPYON_CONFIG['C']['enemyprox']['coef'] = 3;
	EPYON_CONFIG['C']['allyprox']['coef'] = 2;
	
	var cellsAround = epyon_analyzeCellsWithin(eGetCell(self), mpCost);
	
	var scoredCells = [];
	
	arrayIter(cellsAround, function(eCell){
		scoredCells[round(eCell['score']*100)] = eCell;
	});
	
	keySort(scoredCells, SORT_DESC);
	
	var cell = shift(scoredCells);
	
	if (cell){
		epyon_debug('moving to '+cell);
		eMoveTowardCellWithMax(cell['id'], mpCost);
	}
	else{
		epyon_debug('no good cell found');
		eMoveAwayFrom(eGetCell(target), mpCost);
	}
}

function epyon_analyzeCellsWithin(center, distance){
	var eCells = [],
		toGrade = getCellsWithin(center, distance);
		
	epyon_prepareDestinationScoring(toGrade);
	epyon_prepareEngageScoring(toGrade);
	
	arrayIter(toGrade, function(cell){
		//grade each cell in reach
		var eCell = [
			'id': cell,
			'x': getCellX(cell),
			'y': getCellY(cell),
//			'distance': getPathLength(center, cell)
		];
		
		var cumulatedScore = 0,
			totalCoef = 0;
		
		arrayIter(EPYON_CONFIG['C'], function(scorerName, scorer){
			if (scorer['coef'] > 0){
				var returnedScore = scorer['fn'](eCell);
				if (returnedScore === null) return;
				
				var score = min(1, max(returnedScore, 0));
				debug(scorerName+' for '+eCell['x']+'/'+eCell['y']+' scored '+score);
				
				cumulatedScore += score * scorer['coef'];
				totalCoef += scorer['coef'];
			}
		});
		
		eCell['score'] = (totalCoef > 0) ? cumulatedScore / totalCoef : 1;
		push(eCells, eCell);
		
		var color = getColor(round(255 - (255 * eCell['score'])), round(255 * eCell['score']), 0);
		mark(eCell['id'], color);
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
		
	for (var x = centerX - distance; x <= maxX; x++){
		for (var y = centerY - distance; y <= maxY; y++){
			var cell = getCellFromXY(x, y),
				dist = epyon_getCachedPathLength(center, cell);
				
			if ((cell && dist && dist <= distance) || cell == center) push(cells, cell);
		}
	}
	
	return cells;
}

function epyon_getAdjacentCells(center){
	var x = getCellX(center),
		y = getCellY(center);
	
	var cells = [],
		cell;
	
	//careful, those are test & assignments at the same time. It is NOT meant to be '==' instead of '='
	if (cell = getCellFromXY(x - 1, y - 1)) push(cells, cell);
	if (cell = getCellFromXY(x, y - 1)) push(cells, cell);
	if (cell = getCellFromXY(x + 1, y - 1)) push(cells, cell);
	if (cell = getCellFromXY(x - 1, y)) push(cells, cell);
	if (cell = getCellFromXY(x, y)) push(cells, cell);
	if (cell = getCellFromXY(x + 1, y)) push(cells, cell);
	if (cell = getCellFromXY(x - 1, y + 1)) push(cells, cell);
	if (cell = getCellFromXY(x, y + 1)) push(cells, cell);
	if (cell = getCellFromXY(x + 1, y + 1)) push(cells, cell);
	
	return cells;
}