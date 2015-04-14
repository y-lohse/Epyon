include('inc.self');

//@TODO niveau 21, mapper la carte en tableau assoc, false pour obstacle, sinon l'id.
//Niveau 37 le pathLength sera meilleur

//renvois les ids des 8 cellules adjacentes
function getAdjacentCells(center){
	var x = getCellX(center),
		y = getCellY(center);
	
	var cells = [];
	push(cells, getCellFromXY(x + 1, y));
	push(cells, getCellFromXY(x - 1, y));
	push(cells, getCellFromXY(x, y + 1));
	push(cells, getCellFromXY(x, y - 1));
	push(cells, getCellFromXY(x + 1, y + 1));
	push(cells, getCellFromXY(x - 1, y - 1));
	push(cells, getCellFromXY(x + 1, y - 1));
	push(cells, getCellFromXY(x - 1, y + 1));
	
	return cells;
}

//renvois toutes les celulles a moins de X de déplacement. Pas optimisé.
function getCellsWithin(center, distance){
	if (!center) return;
	var cells = [];
	
	var centerX = getCellX(center),
		centerY = getCellY(center);
		
	var maxX = centerX + distance,
		maxY = centerY + distance;
	for (var x = centerX - distance; x < maxX; x++){
		for (var y = centerY - distance; y < maxY; y++){
			var cell = getCellFromXY(x, y);
			if (cell && getCellDistance(cell, center) <= distance) push(cells, cell);
		}
	}
	
	return cells;
}

function findSafeCells(){
	var maxDistance = getMP();
	var position = getCell(self['target']);
	var toCheck = getCellsWithin(position, maxDistance);
	
	var safes = [];
	//@TODO: pour le moment, ne prend que le line of sight; plutot utiliser celle
	//qui ckec si larme adverse peut etre utilisée
	//@TODO: prendre en compte les chips
	//@TODO prendre en compte les trajectoires d'armes
	//@TODO; calculer le path probable de l'adversaire et calculer à partir de la
	for (var cell in toCheck){
		if (!lineOfSight(position, cell)) push(safes, cell);
	}
	
	return safes;
}
