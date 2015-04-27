//lvl12
global PF_TURN = 0;
PF_TURN++;

function getTurn(){
	return PF_TURN;
}
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
//level 37
function getPathLength(cell1, cell2){
	return (cell1 && cell2) ? getCellDistance(cell1, cell2) : null;
}
global EPYON_VERSION = '4.0';
global EPYON_LEVEL = getLevel();

function epyon_debug(message){
	debug('epyon: '+message);
}
//compute the amount of operations & instructions between two arbitrary moments
global epyon_stats = [];

function epyon_startStats(name){
	epyon_stats[name] = [
		'i': getInstructionsCount(),
		'o': getOperations()
	];
}

function epyon_stopStats(name){
	if (epyon_stats[name]){
		var instructionDif = getInstructionsCount() - epyon_stats[name]['i'];
		var operationDif = getOperations() - epyon_stats[name]['o'];
		
		return ['i': instructionDif, 'o': operationDif];
	}
	else{
		return ['i': 'err', 'o': 'err'];
	}
}

if (getTurn() == 1){
	epyon_debug('v'+EPYON_VERSION);
	epyon_startStats('init');
}
global EPYON_LEEKS = [];
global EPYON_TARGET_DISTANCE;

global self;
global target;

function epyon_getLeek(leekId){
	if (EPYON_LEEKS[leekId]){
		return epyon_updateLeek(EPYON_LEEKS[leekId]);
	}
	
	debug('creating leek '+leekId);
	var eLeek = [];
	
	//static props
	eLeek['id'] = leekId;
	eLeek['name'] = getName(leekId);
	eLeek['totalLife'] = getTotalLife(leekId);
	eLeek['agility'] = getAgility(leekId);
	eLeek['force'] = getForce(leekId);
	eLeek['summon'] = isSummon(leekId);
	
	if (EPYON_LEVEL < 14){
		//below that level, there's no way to get an ally, so everything that is not us is an enemy
		eLeek['ally'] = (getLeek() === leekId) ? true : false;
	}
	else{
		eLeek['ally'] = isAlly(leekId);
	}
	
	//try to get the inventory
	if (EPYON_LEVEL >= 57){
		eLeek['chips'] = getChips(leekId);
		eLeek['weapons'] = getWeapons(leekId);
	}
	
	//try to load the max shielding values
	eLeek['maxAbsShield'] = 0;
	
	if (eLeek['chips']){
		arrayIter(eLeek['chips'], function(CHIP_ID){
			if (CHIP_ID == CHIP_HELMET) eLeek['maxAbsShield'] += 15;
			else if (CHIP_ID == CHIP_SHIELD) eLeek['maxAbsShield'] += 20;
			else if (CHIP_ID == CHIP_ARMOR) eLeek['maxAbsShield'] += 25;
			else if (CHIP_ID == CHIP_CARAPACE) eLeek['maxAbsShield'] += 55;
		});
	}
	else if (EPYON_LEVEL >= 13){
		var level = getLevel(eLeek['id']);

		if (level >= 11) eLeek['maxAbsShield'] += 15;//helmet
		if (level >= 19) eLeek['maxAbsShield'] += 20;//shield
		if (level >= 55) eLeek['maxAbsShield'] += 25;//armor
		if (level >= 259) eLeek['maxAbsShield'] += 55;//carapace
	}
	
	//dynamic props
	eLeek['agression'] = 1;
	
	//dynamic props
	return epyon_updateLeek(eLeek);
}

function epyon_updateLeek(eLeek){
	eLeek['_cell'] = getCell(eLeek['id']);
	eLeek['_cellIsDirty'] = false;
	
	if (EPYON_LEVEL < 10){
		eLeek['_weapon'] = (eLeek['id'] === getLeek()) ? getWeapon() : WEAPON_PISTOL;
		eLeek['MP'] = 3;
		eLeek['AP'] = 10;
		eLeek['range'] = 3 + (eLeek['_weapon'] === WEAPON_PISTOL) ? 7 : 0;
	}
	else{
		eLeek['_weapon'] = getWeapon(eLeek['id']);
		eLeek['MP'] = getMP(eLeek['id']);
		eLeek['AP'] = getTP(eLeek['id']);
		if (EPYON_LEVEL < 57) eLeek['range'] = getWeaponMaxScope(eLeek['_weapon']) + eLeek['MP'];
		else eLeek['range'] = 0;
	}
	
	if (EPYON_LEVEL >= 57){
		var attackChips = arrayFilter(eLeek['chips'], function(CHIP_ID){
			return inArray([CHIP_SHOCK, CHIP_PEBBLE, CHIP_SPARK, CHIP_ICE, 
							CHIP_ROCK, CHIP_FLASH, CHIP_FLAME, CHIP_STALACTITE,
							CHIP_LIGHTNING, CHIP_ROCKFALL, CHIP_ICEBERG, 
							CHIP_METEORITE, CHIP_DEVIL_STRIKE], CHIP_ID);
		});

		arrayIter(attackChips, function(CHIP_ID){
			eLeek['range'] = max(eLeek['range'], eLeek['MP'] + getChipMaxScope(CHIP_ID));
		});

		arrayIter(eLeek['weapons'], function(WEAPON_ID){
			eLeek['range'] = max(eLeek['range'], eLeek['MP'] + getWeaponMaxScope(WEAPON_ID));
		});
	}
	
	EPYON_LEEKS[eLeek['id']] = eLeek;
	return eLeek;
}

function epyon_loadAliveEnemies() {
	if (EPYON_LEVEL >= 16){
		var leeks = getAliveEnemies();
		var l = count(leeks);
		for (var i = 0; i < l; i++){
			epyon_getLeek(leeks[i]);
		}
	}
}

function epyon_loadAliveAllies() {
	if (EPYON_LEVEL >= 14){
		var leeks = getAliveAllies();
		var l = count(leeks);
		for (var i = 0; i < l; i++){
			epyon_getLeek(leeks[i]);
		}
	}
}

function epyon_updateSelfRef(){
	//THIS RETURNS A COPY, NOT A REFERENCE. You can't get a reference.
	self = epyon_getLeek(getLeek());
}

function eGetCell(eLeek){
	if (eLeek['_cellIsDirty']){
		eLeek['_cell'] = getCell(eLeek['id']);
		eLeek['_cellIsDirty'] = false;
	}
	return eLeek['_cell'];
}

function eGetLife(eLeek){
	return getLife(eLeek['id']);
}

function eGetWeapon(eLeek){
	return eLeek['_weapon'];
}

function eSetWeapon(WEAPON_ID){
	EPYON_LEEKS[self['id']]['_weapon'] = WEAPON_ID;
	self['_weapon'] = WEAPON_ID;
	return setWeapon(WEAPON_ID);
}

function eMoveTowardCell(cell){
	EPYON_LEEKS[self['id']]['_cellIsDirty'] = true;
	self['_cellIsDirty'] = true;
	return moveTowardCell(cell);
}

function eMoveTowardCellWithMax(cell, max){
	EPYON_LEEKS[self['id']]['_cellIsDirty'] = true;
	self['_cellIsDirty'] = true;
	return moveTowardCell(cell, max);
}

function eMoveAwayFrom(eLeek, max){
	EPYON_LEEKS[self['id']]['_cellIsDirty'] = true;
	self['_cellIsDirty'] = true;
	return moveAwayFrom(eLeek['id'], max);
}

function eGetAliveEnemies(){
	var enemies = [];
	
	for (var eLeek in EPYON_LEEKS){
		if (isAlive(eLeek['id']) && !eLeek['ally']) push(enemies, eLeek);
	}
	
	return enemies;
}

function eGetAliveAllies(){
	var allies = [];
	
	for (var eLeek in EPYON_LEEKS){
		if (isAlive(eLeek['id']) && eLeek['ally']) push(allies, eLeek);
	}
	
	return allies;
}

epyon_updateSelfRef();

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

function epyon_moveTowardsTarget(mpCost){
	var cell = getCell(target['id']);
	eMoveTowardCellWithMax(cell, mpCost);
}

function epyon_moveToSafety(mpCost){
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
		eMoveAwayFrom(target, mpCost);
	}
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
			'distance': getPathLength(center, cell)
		];
		
		var cumulatedScore = 0,
			totalCoef = 0;
		
		arrayIter(EPYON_CONFIG['C'], function(scorerName, scorer){
			if (scorer['coef'] > 0){
				var returnedScore = scorer['fn'](eCell);
				if (returnedScore === null) return;
				
				var score = min(1, max(returnedScore, 0));
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
		
	//we're using getPathLength, but getCellDistance could be a good approximation
	for (var x = centerX - distance; x <= maxX; x++){
		for (var y = centerY - distance; y <= maxY; y++){
			var cell = getCellFromXY(x, y),
				dist = getPathLength(center, cell);
				
			if (cell && dist && dist <= distance) push(cells, cell);
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
//Each scorer returns a value between 0 and 1, representing the level of aggression relative to a particular aspect.
//0 is flee, .5 is normal and 1 is engage

function epyon_aScorerHealth(eLeek){
	// see http://gizma.com/easing/	//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiItMSooeCooeC0yKSkiLCJjb2xvciI6IiMwMDAwMDAifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyItMS40MjQ5OTk5OTk5OTk5OTk0IiwiMS44MjUwMDAwMDAwMDAwMDA2IiwiLTAuNzE5OTk5OTk5OTk5OTk5OCIsIjEuMjgwMDAwMDAwMDAwMDAwMiJdfV0-
	var t = eGetLife(eLeek) / eLeek['totalLife'];
	return -1 * (t * (t-2)) + EPYON_CONFIG['suicidal'];
}

function epyon_aScorerAbsoluteShield(eLeek){
	var absShield = getAbsoluteShield(eLeek['id']);
	
	return (absShield > 0) ? absShield / (eLeek['maxAbsShield'] || 1) : null;
}

function epyon_aScorerRelativeShield(eLeek){
	var relShield = getRelativeShield(eLeek['id']);
	
	return (relShield > 0) ? relShield/100 : null;
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
global EPYON_PREFIGHT = 'prefight';
global EPYON_FIGHT = 'fight';
global EPYON_POSTFIGHT = 'postfight';
global EPYON_BEHAVIORS = [];

//arbitrary numbers
var stupidBaseId = 80484;
global EQUIP_PISTOL 	= stupidBaseId++;
global EQUIP_MAGNUM 	= stupidBaseId++;
global BANDAGE_OTHER 	= stupidBaseId++;
global CURE_OTHER 		= stupidBaseId++;
global VACCINE_OTHER 	= stupidBaseId++;
global PROTEIN_OTHER 	= stupidBaseId++;
global STEROID_OTHER 	= stupidBaseId++;
global WARM_UP_OTHER 	= stupidBaseId++;
global HELMET_OTHER 	= stupidBaseId++;


/*
* @param type EPYON_PREFIGHT || EPYON_FIGHT || EPYON_POSTFIGHT
*/
function epyon_listBehaviors(type, maxAP, maxMP){
	var behaviors = [];
	
	arrayIter(EPYON_BEHAVIORS, function(candidateName, candidateFn){
		if (inArray(EPYON_CONFIG[type], candidateName)){
			var result = candidateFn(maxAP, maxMP);
			if (result) push(behaviors, result);
		}
	});
	
	return behaviors;
}

function epyon_getHumanBehaviorName(BEHAVIOR_ID){
	if (BEHAVIOR_ID === CHIP_ARMOR) return 'armor';
	else if (BEHAVIOR_ID === CHIP_SHIELD) return 'shield';
	else if (BEHAVIOR_ID === CHIP_HELMET) return 'helmet';
	else if (BEHAVIOR_ID === CHIP_WALL) return 'wall';
	else if (BEHAVIOR_ID === CHIP_PROTEIN) return 'protein';
	else if (BEHAVIOR_ID === CHIP_STEROID) return 'steroid';
	else if (BEHAVIOR_ID === CHIP_WARM_UP) return 'warm-up';
	else if (BEHAVIOR_ID === CHIP_BANDAGE) return 'bandage';
	else if (BEHAVIOR_ID === CHIP_CURE) return 'cure';
	else if (BEHAVIOR_ID === CHIP_VACCINE) return 'vaccine';
	else if (BEHAVIOR_ID === CHIP_PUNY_BULB) return 'puny bulb';
	else if (BEHAVIOR_ID === CHIP_PEBBLE) return 'pebble';
	else if (BEHAVIOR_ID === CHIP_SPARK) return 'spark';
	else if (BEHAVIOR_ID === CHIP_STALACTITE) return 'stalactite';
	else if (BEHAVIOR_ID === WEAPON_PISTOL) return 'pistol';
	else if (BEHAVIOR_ID === WEAPON_MAGNUM) return 'magnum';
	else if (BEHAVIOR_ID === EQUIP_PISTOL) return 'equip pistol';
	else if (BEHAVIOR_ID === EQUIP_MAGNUM) return 'equip magnum';
	else return 'Behavior#'+BEHAVIOR_ID;
}

//factories to create behavior with less code
function epyon_weaponBehaviorFactory(WEAPON_ID){
	var effects = getWeaponEffects(WEAPON_ID);
	//average of damage + stats modifiers
	var damage = ((effects[0][1]+effects[0][2]) / 2) * (1 + self['force'] / 100);
	
	var cost = getWeaponCost(WEAPON_ID);
	var distance, minCell;
	
	return function(maxAP, maxMP){	
		if (EPYON_LEVEL >= 29  && canUseWeapon(WEAPON_ID, target['id'])) distance = 0;
		else{
			minCell = getCellToUseWeapon(WEAPON_ID, target['id']);
			var currentCell = eGetCell(self);

			distance = getPathLength(currentCell, minCell);
		}

		if (cost > maxAP || distance > maxMP) return false;
		
		epyon_debug(epyon_getHumanBehaviorName(WEAPON_ID)+' is a candidate');

		var excute = function(){
			var mp = 0;
			//ne pas utiliser de OR, canUseWeapon plante e ndessous du level 29
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseWeapon(WEAPON_ID, target['id'])) mp = eMoveTowardCell(minCell);
			
			if (mp > distance) debugW('Epyon: '+(mp-distance)+' extra MP was spent on moving');
			
			if (eGetWeapon(self) != WEAPON_ID){
				debugW('Epyon: 1 extra AP was spent on equiping '+epyon_getHumanBehaviorName(WEAPON_ID));
				eSetWeapon(WEAPON_ID);
			}
			useWeapon(target['id']);
		};

		return [
			'type': WEAPON_ID,
			'MP': distance,
			'AP': cost,
			'damage': damage,
			'fn': excute
		];
	};
}

function epyon_equipBehaviorFactory(WEAPON_ID, type){
	return function(maxAP, maxMP){
		if (eGetWeapon(self) == WEAPON_ID || maxAP < 1) return false;

		epyon_debug(epyon_getHumanBehaviorName(type)+' is a candidate');

		var fn = function(){
			if (eGetWeapon(self) != WEAPON_ID) eSetWeapon(WEAPON_ID);
		};

		return [
			'type': type,
			'AP': 1,
			'MP': 0,
			'fn': fn
		];
	};
}

function epyon_offensiveChipBehaviorFactory(CHIP_ID){
	var effects = getChipEffects(CHIP_ID);
	var damage = ((effects[0][1]+effects[0][2]) / 2) * (1 + self['force'] / 100);
	var cost = getChipCost(CHIP_ID);
	var distance, minCell;
	
	return function(maxAP, maxMP){
		if (EPYON_LEVEL >= 29 && canUseChip(CHIP_ID, target['id'])) distance = 0;
		else{
			minCell = getCellToUseChip(CHIP_ID, target['id']);
			var currentCell = eGetCell(self);

			distance = getPathLength(currentCell, minCell);
		}

		if (getCooldown(CHIP_ID) > 0 || cost > maxAP || distance > maxMP) return false;
		
		epyon_debug(epyon_getHumanBehaviorName(CHIP_ID)+' is a candidate');

		var excute = function(){
			var mp = 0;
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, target['id'])) mp = eMoveTowardCell(minCell);
			
			if (mp > distance) debugW('Epyon: '+(mp-distance)+' extra MP was spent on moving');
			
			useChipShim(CHIP_ID, target['id']);
		};

		return [
			'type': CHIP_ID,
			'MP': distance,
			'AP': cost,
			'damage': damage,
			'fn': excute
		];
	};
}

function epyon_simpleSelfChipBehaviorFactory(CHIP_ID){
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		epyon_debug(epyon_getHumanBehaviorName(CHIP_ID)+' is a candidate');

		var fn = function(){
			useChipShim(CHIP_ID, self['id']);
		};

		return [
			'type': CHIP_ID,
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
}

function epyon_healChipBehaviorFactory(CHIP_ID){
	var effects = getChipEffects(CHIP_ID);
	var maxHeal = effects[0][2] * (1 + self['agility'] / 100);
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (self['totalLife']-eGetLife(self) < maxHeal || getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		epyon_debug(epyon_getHumanBehaviorName(CHIP_ID)+' is a candidate');

		var fn = function(){
			useChipShim(CHIP_ID, self['id']);
		};

		return [
			'type': CHIP_ID,
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
}

function epyon_healOtherChipBehaviorFactory(CHIP_ID, type){
	var cost = getChipCost(CHIP_ID);
	var effects = getChipEffects(CHIP_ID);
	var maxHeal = effects[0][2] * (1 + self['agility'] / 100);
	
	return function(maxAP, maxMP){	
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;

		//find potential targets
		var targets = [];

		arrayIter(eGetAliveAllies(), function(eLeek){
			var cell = getCellToUseChip(CHIP_ID, eLeek['id']),
				mpToBeInReach = getPathLength(eGetCell(self), cell),
				toHeal = eLeek['totalLife'] - eGetLife(eLeek);

			if (!eLeek['summon'] && mpToBeInReach <= maxMP && toHeal > maxHeal){
				push(targets, ['id': eLeek['id'], 
								'MP': mpToBeInReach,
								'cell': cell, 
								'heal': toHeal]);
			}
		});

		if (count(targets) === 0) return false;

		//try to select the one taht needs most healing
		var MPcost,
			healTarget,
			minCell,
			maxToHeal = 0;

		arrayIter(targets, function(data){
			if (maxToHeal < data['heal']){
				maxToHeal = data['heal'];
				MPcost = data['MP'];
				minCell = data['cell'];
				healTarget = data['id'];
			}
		});

		epyon_debug(epyon_getHumanBehaviorName(type)+' is a candidate');

		var fn = function(){
			var mp = 0;
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, healTarget)) mp = eMoveTowardCell(minCell);
			
			if (mp > MPcost) debugW('Epyon: '+(mp-MPcost)+' extra MP was spent on moving');
			
			useChipShim(CHIP_ID, healTarget);
		};

		return [
			'type': type,
			'AP': cost,
			'MP': MPcost,
			'fn': fn
		];
	};
}

function epyon_simpleOtherChipBehaviorFactory(CHIP_ID, type){
	var cost = getChipCost(CHIP_ID);
	
	return function(maxAP, maxMP){
		if (getCooldown(CHIP_ID) > 0 || maxAP < cost) return false;
		
		//find potential targets
		var targets = [];

		arrayIter(eGetAliveAllies(), function(eLeek){
			var cell = getCellToUseChip(CHIP_ID, eLeek['id']),
				mpToBeInReach = getPathLength(eGetCell(self), cell);

			if (!eLeek['summon'] && mpToBeInReach <= maxMP){
				push(targets, ['id': eLeek['id'], 
								'MP': mpToBeInReach,
								'cell': cell]);
			}
		});

		if (count(targets) === 0) return false;
		else{
			debug('possible targets');
			debug(targets);
		}

		epyon_debug(epyon_getHumanBehaviorName(type)+' chip other is a candidate');
		
		//try to select the one that cost the least mp
		var MPcost = maxMP + 1,
			chipTarget,
			minCell;

		arrayIter(targets, function(data){
			if (data['MP'] < MPcost){
				MPcost = data['MP'];
				minCell = data['cell'];
				chipTarget = data['id'];
				debug('new  target '+chipTarget);
			}
		});

		var fn = function(){
			var mp = 0;
			if (EPYON_LEVEL < 29) mp = eMoveTowardCell(minCell);
			else if (!canUseChip(CHIP_ID, chipTarget)) mp = eMoveTowardCell(minCell);
			
			if (mp > MPcost) debugW('Epyon: '+(mp-MPcost)+' extra MP was spent on moving');
			
			useChipShim(CHIP_ID, chipTarget);
		};

		return [
			'type': type,
			'AP': cost,
			'MP': MPcost,
			'fn': fn
		];
	};
}


/*********************************
*********** BEHAVIORS ************
*********************************/
if (getTurn() === 1){
	
	//shielding
	EPYON_BEHAVIORS[CHIP_ARMOR] = epyon_simpleSelfChipBehaviorFactory(CHIP_ARMOR);
	EPYON_BEHAVIORS[CHIP_SHIELD] = epyon_simpleSelfChipBehaviorFactory(CHIP_SHIELD);
	EPYON_BEHAVIORS[CHIP_HELMET] = epyon_simpleSelfChipBehaviorFactory(CHIP_HELMET);
	EPYON_BEHAVIORS[CHIP_WALL] = epyon_simpleSelfChipBehaviorFactory(CHIP_WALL);
	
	//shielding others
	EPYON_BEHAVIORS[HELMET_OTHER] = epyon_simpleOtherChipBehaviorFactory(CHIP_HELMET, HELMET_OTHER);
	
	//power ups
	EPYON_BEHAVIORS[CHIP_PROTEIN] = epyon_simpleSelfChipBehaviorFactory(CHIP_PROTEIN);
	EPYON_BEHAVIORS[CHIP_STEROID] = epyon_simpleSelfChipBehaviorFactory(CHIP_STEROID);
	EPYON_BEHAVIORS[CHIP_WARM_UP] = epyon_simpleSelfChipBehaviorFactory(CHIP_WARM_UP);
	
	//power up other
	EPYON_BEHAVIORS[PROTEIN_OTHER] = epyon_simpleOtherChipBehaviorFactory(CHIP_PROTEIN, PROTEIN_OTHER);
	EPYON_BEHAVIORS[STEROID_OTHER] = epyon_simpleOtherChipBehaviorFactory(CHIP_STEROID, STEROID_OTHER);
	EPYON_BEHAVIORS[WARM_UP_OTHER] = epyon_simpleOtherChipBehaviorFactory(CHIP_WARM_UP, WARM_UP_OTHER);

	//heal
	EPYON_BEHAVIORS[CHIP_BANDAGE] = epyon_healChipBehaviorFactory(CHIP_BANDAGE);
	EPYON_BEHAVIORS[CHIP_CURE] = epyon_healChipBehaviorFactory(CHIP_CURE);
	EPYON_BEHAVIORS[CHIP_VACCINE] = epyon_healChipBehaviorFactory(CHIP_VACCINE);
	
	//heal others
	EPYON_BEHAVIORS[BANDAGE_OTHER] = epyon_healOtherChipBehaviorFactory(CHIP_BANDAGE, BANDAGE_OTHER);
	EPYON_BEHAVIORS[CURE_OTHER] = epyon_healOtherChipBehaviorFactory(CHIP_CURE, CURE_OTHER);
	EPYON_BEHAVIORS[VACCINE_OTHER] = epyon_healOtherChipBehaviorFactory(CHIP_VACCINE, VACCINE_OTHER);
	
	//summon
	EPYON_BEHAVIORS[CHIP_PUNY_BULB] = function(maxAP, maxMP){
		var cost = getChipCost(CHIP_PUNY_BULB);
	
		if (getCooldown(CHIP_PUNY_BULB) > 0 || maxAP < cost) return false;

		epyon_debug('puny bulb is a candidate');

		var fn = function(){
			summon(CHIP_PUNY_BULB, epyon_findCellToSummon(), epyon_bulb);
		};

		return [
			'type': CHIP_PUNY_BULB,
			'AP': cost,
			'MP': 0,
			'fn': fn
		];
	};
	
	//offensive chips
	EPYON_BEHAVIORS[CHIP_SPARK] = epyon_offensiveChipBehaviorFactory(CHIP_SPARK);
	EPYON_BEHAVIORS[CHIP_PEBBLE] = epyon_offensiveChipBehaviorFactory(CHIP_PEBBLE);
	EPYON_BEHAVIORS[CHIP_STALACTITE] = epyon_offensiveChipBehaviorFactory(CHIP_STALACTITE);
	
	//weapons
	EPYON_BEHAVIORS[WEAPON_PISTOL] = epyon_weaponBehaviorFactory(WEAPON_PISTOL);
	EPYON_BEHAVIORS[WEAPON_MAGNUM] = epyon_weaponBehaviorFactory(WEAPON_MAGNUM);
	
	//equip weapons
	EPYON_BEHAVIORS[EQUIP_PISTOL] = epyon_equipBehaviorFactory(WEAPON_PISTOL, EQUIP_PISTOL);
	EPYON_BEHAVIORS[EQUIP_MAGNUM] = epyon_equipBehaviorFactory(WEAPON_MAGNUM, EQUIP_MAGNUM);
}

global EPYON_CONFIG = [];

global epyon_dummy_selector = function(candidates){
	return candidates[0];
};

if (getTurn() === 1){
	//inventory
	EPYON_CONFIG[EPYON_PREFIGHT] = [];
	EPYON_CONFIG[EPYON_FIGHT] = [];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [];
	
	//chanllenge whitelisting
	EPYON_CONFIG['whitelist'] = [
		'farmers': [],
		'teams': []
	];
	
	//selectors
	EPYON_CONFIG['select_prefight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_fight'] = epyon_dummy_selector;
	EPYON_CONFIG['select_postfight'] = epyon_dummy_selector;
	
	//scorer functions receive a leek as parameter and score him on any criteria the ysee fit, where 0 is shit and 1 is great. Return values are clamped between 0 and 1 anyway. Each scorer is weighted. If the weight (coef) is 0 for a scorer, the scorer is ignored.
	EPYON_CONFIG['A'] = [
		'health': ['fn': epyon_aScorerHealth, 'coef': 1],
		'absShield': ['fn': epyon_aScorerAbsoluteShield, 'coef': (EPYON_LEVEL >= 38) ? 3 : 0],
		'relShield': ['fn': epyon_aScorerRelativeShield, 'coef': (EPYON_LEVEL >= 38) ? 3 : 0],
	];
	
	EPYON_CONFIG['C'] = [
		'border': ['fn': epyon_cScorerBorder, 'coef': 1],
		'obstacles': ['fn': epyon_cScorerObstacles, 'coef': (EPYON_LEVEL >= 21) ? 2 : 0],
		'los': ['fn': epyon_cScorerLoS, 'coef': 2],
		'enemyprox': ['fn': epyon_cScorerEnemyProximity, 'coef': 3],
		'allyprox': ['fn': epyon_cScorerAllyProximity, 'coef': 1],
	];
	
	EPYON_CONFIG['suicidal'] = 0;//[0;1] with a higher suicidal value, the leek will stay agressive despite being low on health
	
	EPYON_CONFIG['engage'] = 5;
	EPYON_CONFIG['flee'] = -0.4;//[-1;1] relative to the S score. With S lower or equal than the flee value, the IA will back off
}
function epyon_aquireTarget(){
	var enemy = null;
	// On recupere les ennemis, vivants, à porté
	var enemiesInRange = [];
	for (var leek in eGetAliveEnemies()){
		if (getPathLength(eGetCell(self),eGetCell(leek)) <= self['range'] && !leek['summon']) enemiesInRange[leek['id']] = leek;
	}
	// On détermine le plus affaibli d'entre eux
	var lowerHealth = 1;
	var actualHealth;
	var leekInRange;
	for(var leek in enemiesInRange) {
		actualHealth = getLife(leek['id'])/leek['totalLife'];
		if (actualHealth < lowerHealth) {	
			lowerHealth = actualHealth;
			enemy = leek;
		}
		
		leekInRange = leek;
	}
	// Si aucun n'est affaibli, on prend le plus proche
	if(!enemy) enemy = epyon_getLeek(getNearestEnemy());
	
	if (enemy['summon'] && leekInRange) enemy = leekInRange;
	
	EPYON_TARGET_DISTANCE = getPathLength(eGetCell(self), eGetCell(enemy));
	
	if (enemy != target){
		target = enemy;
		epyon_debug('target is now '+target['name']);
	}
	
	return target;
}

function epyon_updateAgressions(){	
	var copy = EPYON_LEEKS;
	arrayIter(copy, function(leekId, eLeek){
		EPYON_LEEKS[leekId]['agression'] = epyon_computeAgression(eLeek);
		epyon_debug('A for '+EPYON_LEEKS[leekId]['name']+' : '+EPYON_LEEKS[leekId]['agression']);
	});
	
	epyon_updateSelfRef();
}

function epyon_computeAgression(epyonLeek){
	var cumulatedA = 0,
		totalCoef = 0;
	
	arrayIter(EPYON_CONFIG['A'], function(scorerName, scorer){
		if (scorer['coef'] > 0){
			var returnedScore = scorer['fn'](epyonLeek);
			if (returnedScore == null) return;
			
			var score = min(1, max(returnedScore, 0));
			epyon_debug(scorerName+' score '+score+' coef '+scorer['coef']);
			cumulatedA += score * scorer['coef'];
			totalCoef += scorer['coef'];
		}
	});
	
	return (totalCoef > 0) ? cumulatedA / totalCoef : 1;
}

function epyon_act(){
	//compute S
	var S = self['agression'] - target['agression'];
	epyon_debug('S computed to '+S);
	
	var totalMP = self['MP'],
		totalAP = self['AP'];
		
	var spentPoints = epyon_prefight(S, totalAP, totalMP);
	
	var allocatedAP = totalAP - spentPoints[0];
	var allocatedMP = epyon_allocateAttackMP(S, totalMP - spentPoints[1]);
	
	//init vars for later
	var remainingMP = totalMP - allocatedMP - spentPoints[1];
	var remainingAP = 0;//totalAP - spentAP - allocatedAP is always 0
	
//	if (allocatedMP > 0){
	epyon_debug('allocated MP: '+allocatedMP);
	epyon_debug('allocated AP: '+allocatedAP);
		
	//try to find attacks for as long as the AP & MP last
	var attacks = [];
	var foundSuitableAttacks = false;
	while(count(attacks = epyon_listBehaviors(EPYON_FIGHT, allocatedAP, allocatedMP)) > 0){
		var selected = EPYON_CONFIG['select_fight'](attacks, allocatedAP, allocatedMP);
		if (!selected) break;
		epyon_debug('using '+epyon_getHumanBehaviorName(selected['type'])+' for '+selected['AP']+'AP and '+selected['MP']+'MP');
		allocatedAP -= selected['AP'];
		allocatedMP -= selected['MP'];
		selected['fn']();
		foundSuitableAttacks = true;
	};
		
	remainingAP += allocatedAP;
	remainingMP += allocatedMP;
	
	epyon_debug('remaining MP after attacks: '+remainingMP);
	epyon_debug('remaining AP after attacks: '+remainingAP);
	
	if (remainingMP > 0 && S > EPYON_CONFIG['flee']){
		var distanceToEnemy = getPathLength(eGetCell(self), eGetCell(target)),
			dif = distanceToEnemy - EPYON_CONFIG['engage'];
		
		epyon_debug('diff from ideal distance: '+dif);
		
		if (dif > 0){
			epyon_debug('moving closer');
			epyon_moveTowardsTarget(min(remainingMP, dif));
		}
		else if (dif < 0){
			epyon_debug('backing off');
			epyon_moveToSafety(min(remainingMP, abs(dif)));
		}
		else{
			epyon_debug('staying in position');
		}
	}
	else if (S <= EPYON_CONFIG['flee']){
		epyon_debug('fleeing');
		epyon_moveToSafety(remainingMP);
	}
	
	if (remainingAP > 0) epyon_postfight(remainingAP, 0);//spend the remaining AP on whatever
}

//determines how many Mp it is safe to spend on attacks this turn
function epyon_allocateAttackMP(S, max){
	if (S <= EPYON_CONFIG['flee']) return 0;
	else if (S < 0) return round(max / 2);
	else return max;
}

//spends AP on actions that are prioritized over combat
//returns the amount of AP and MP spent
function epyon_prefight(S, maxAP, maxMP){
	epyon_debug('Running prefight');
	var APcounter = 0,
		MPcounter = 0;
	var behaviors = [];
	
	while(count(behaviors = epyon_listBehaviors(EPYON_PREFIGHT, maxAP, maxMP)) > 0){
		var selected = EPYON_CONFIG['select_prefight'](behaviors, maxAP, maxMP);
		if (!selected) break;
		epyon_debug('using '+epyon_getHumanBehaviorName(selected['type'])+' for '+selected['AP']+'AP and '+selected['MP']+'MP');
		maxAP -= selected['AP'];
		maxMP -= selected['MP'];
		APcounter += selected['AP'];
		MPcounter += selected['MP'];
		selected['fn']();
	};
	
	return [APcounter, MPcounter];
}

//spends the AP on bonus actions
function epyon_postfight(maxAP, maxMP){
	epyon_debug('Running postfight');
	var behaviors = [];
	
	while(count(behaviors = epyon_listBehaviors(EPYON_POSTFIGHT, maxAP, maxMP)) > 0){
		var selected = EPYON_CONFIG['select_postfight'](behaviors, maxAP, maxMP);
		if (!selected) break;
		epyon_debug('using '+epyon_getHumanBehaviorName(selected['name'])+' for '+selected['AP']+'AP');
		maxAP -= selected['AP'];
		selected['fn']();
	};
}

function epyon_denyChallenge(){
	if (getFightContext() === FIGHT_CONTEXT_CHALLENGE){
		var denied = true,
			enemies = getEnemies(),
			l = count(enemies);
		
		for (var i = 0; i < l; i++){
			if (inArray(EPYON_CONFIG['whitelist']['farmers'], getFarmerName(enemies[i])) ||
				inArray(EPYON_CONFIG['whitelist']['teams'], getTeamName(enemies[i]))){
				denied = false;
				break;
			}
		}
		
		//challenge denied, just fuck up everything
		if (denied){
			debugW('challenge denied');
			EPYON_CONFIG[EPYON_PREFIGHT] = [];
			EPYON_CONFIG[EPYON_FIGHT] = [];
			EPYON_CONFIG[EPYON_POSTFIGHT] = [];
		}
	}
}

function epyon_bulb(){
	epyon_startStats('bulb');
	var configBackup = EPYON_CONFIG;
	
	EPYON_CONFIG[EPYON_PREFIGHT] = [HELMET_OTHER, BANDAGE_OTHER, PROTEIN_OTHER];
	EPYON_CONFIG[EPYON_FIGHT] = [CHIP_PEBBLE];
	EPYON_CONFIG[EPYON_POSTFIGHT] = [CHIP_BANDAGE];
	
	EPYON_CONFIG['engage'] = configBackup['engage'] + 2;//stay out of the fights
	
	EPYON_CONFIG['select_prefight'] = function(behaviors, allocatedAP, allocatedMP){
		var byPreference = [];
	
		arrayIter(behaviors, function(behavior){
			var score = 0;
			
			if (behavior['type'] == BANDAGE_OTHER){
				score = 3;
			}
			else if (behavior['type'] == HELMET_OTHER && EPYON_TARGET_DISTANCE < 14){
				score = 1;
			}
			else if (behavior['type'] == PROTEIN_OTHER && EPYON_TARGET_DISTANCE < 8){
				score = 2;
			}

			if (score > 0) byPreference[score] = behavior;
		});

		keySort(byPreference, SORT_DESC);

		return shift(byPreference);
	};
	EPYON_CONFIG['select_fight'] = function(attacks, allocatedAP, allocatedMP){
		return attacks[0];
	};
	EPYON_CONFIG['select_postfight'] = function(behaviors, allocatedAP, allocatedMP){
		return behaviors[0];
	};
	
	epyon_loadAliveEnemies();
	epyon_loadAliveAllies();
	epyon_updateAgressions();
	epyon_aquireTarget();
	if (getTurn() < getBirthTurn()+2) self['MP'] = 0;
	epyon_act();
	
	EPYON_CONFIG = configBackup;
	
	var bulbStats = epyon_stopStats('bulb');
	epyon_debug('bulb '+bulbStats['i']+' i & '+bulbStats['o']+' o');
}

function epyon_findCellToSummon(){
	var adjacents = epyon_getAdjacentCells(eGetCell(self)),
		l = count(adjacents);
	
	for (var i = 0; i < l; i++){
		if (getCellContent(adjacents[i]) === CELL_EMPTY) return adjacents[i];
	}
	
	return eGetCell(self) + 2;//and hope for the best
}
if (getTurn() == 1){
	var initStats = epyon_stopStats('init');
	epyon_debug('init '+initStats['i']+' i & '+initStats['o']+' o');
}