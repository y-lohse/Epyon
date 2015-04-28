function epyon_cScorerDestination(eCell){
	var distance = getPathLength(eCell['id'], EPYON_CONFIG['_destination']);
	
	if (!distance) return null;
	
	debug(eCell['x']+'/'+eCell['y']);
	distance -= EPYON_CONFIG['pack'];
	debug('distance to ideal position: '+distance);
	
	return 1 - (distance / EPYON_CONFIG['_destination_distance']);
}

function epyon_cScorerEngage(eCell){
	var engageCell = eGetCell(target);
	var distance = getPathLength(eCell['id'], engageCell);
	var dif = abs(distance - EPYON_CONFIG['engage']);
	debug('difference to engage: '+dif);
	
	if (dif > EPYON_CONFIG['engage']) return null;
	else return 1 - (dif / EPYON_CONFIG['engage']);
}

function epyon_cScorerBorder(eCell){
	var edge = 4;
	
	if (abs(eCell['x']) >= MAP_WIDTH - edge || 
		abs(eCell['y']) >= MAP_HEIGHT - edge)
		return 0;
	else return 1;
}

function epyon_cScorerObstacles(eCell){	
	var adjacent = epyon_getAdjacentCells(eCell['id']),
		obstacleCount = 0;
		
	arrayIter(adjacent, function(cell){
		if (isObstacle(cell)) obstacleCount++;
	});
	
	//0 obstacle is shit, 1 is ideal, anything more than that tends towards 0
	//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiIxLSh4KjAuMSkrMC4xIiwiY29sb3IiOiIjMDAwMDAwIn0seyJ0eXBlIjoxMDAwLCJ3aW5kb3ciOlsiLTMuNyIsIjkuMjk5OTk5OTk5OTk5OTk5IiwiLTMuODgiLCI0LjEyIl19XQ--
	if (obstacleCount === 0) return 0;
	else return 1 - ( obstacleCount * 0.1) + 0.1;
}

function epyon_cScorerLoS(eCell){
	var inLoSCounter = 0;
	
	arrayIter(EPYON_LEEKS, function(eLeek){
		if (eLeek['ally'] == false &&										//only enemies
			getDistance(eCell['id'], eGetCell(eLeek)) < eLeek['range'] &&	//within range
			lineOfSight(eCell['id'], eGetCell(eLeek)))						//with clean LoS
		{
			inLoSCounter++;
		}
	});
	
	var score = inLoSCounter / getAliveEnemiesCount(),
		baseMultiplier = (inLoSCounter > 0) ? 1 : 0;
		
	return 1 - (0.7 * baseMultiplier + 0.3 * score);
}

function epyon_cScorerEnemyProximity(eCell){
	var maxDistance = self['MP'];//self['range'] would be another candidate
	var cumulatedDistance = 0,
		enemiesInRange = 0;
	
	arrayIter(eGetAliveEnemies(), function(eLeek){
		var distance = getDistance(eCell['id'], eGetCell(eLeek));
		if (distance < maxDistance){
			cumulatedDistance += distance;
			enemiesInRange++;
		}
	});
	
	if (enemiesInRange === 0) return 1;
	else return cumulatedDistance / (maxDistance * enemiesInRange);
}

function epyon_cScorerAllyProximity(eCell){
	if (count(getAliveAllies()) === 0) return null;
	
	var maxDistance = self['range'];//MP would be "right", but range let's us explore more cells
	var cumulatedScore = 0,
		alliesInRange = 0;
	
	arrayIter(eGetAliveAllies(), function(eLeek){
		var distance = getDistance(eCell['id'], eGetCell(eLeek));
		if (distance < maxDistance){
			//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiJzaW4oKHgrMSkvMi41KSIsImNvbG9yIjoiIzAwMDAwMCJ9LHsidHlwZSI6MTAwMCwid2luZG93IjpbIi0xLjk4NDAwMDAwMDAwMDAwMDkiLCI4LjQxNTk5OTk5OTk5OTk5NyIsIi0zLjU2IiwiMi44Mzk5OTk5OTk5OTk5OTk0Il19XQ--
			cumulatedScore += sin((distance+1)/2.5);
			alliesInRange++;
		}
	});
	
	if (alliesInRange === 0) return null;
	else return cumulatedScore / alliesInRange;
}