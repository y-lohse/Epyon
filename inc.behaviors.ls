include('inc.self');
include('inc.weapon');
include('inc.chip');
include('inc.map');

//on se soigne?
function behave_heal(){
	var maxHeal = 15;//actually compute this, depending on the chip
	if (self['max_life']-self['life'] >= maxHeal &&
		getChipCooldown(CHIP_BANDAGE) <= 0){
		debug('healing');
		//useChip(CHIP_BANDAGE, getLeek());
	}
}

//cherche la meileure cible
function behave_aquireTarget(){
	//@TODO: recuperer la liste des enemis, les noter selon distance/vie restante
	if (self['target'] and isAlive(self['target'])){
		return self['target'];
	}
	else{
		self['target'] = getNearestEnemy();
		debug('aquired new target: '+self['target']);
	}
}

//se rapproche du combat
function behave_engage(){
	var attackChip = CHIP_SPARK;
	if (!canUseChipOnEnemy(attackChip) && !canUseWeaponOnEnemy()){
		//on peut rien utiliser, on se rapproche
		//@TODO: prendre une decision intelligente sur se rapprocher ou non basé sur:
		//-la portée de mes equipements
		//-la portée de ses equipements
		//-les degats respectifs
		//var dest = getCellToUseWeapon(self['weapon'], self['target']);
		debug('to far away, moving in');
		var dest = getCellToUseChip(attackChip, self['target']);
		myMoveTowardsCell(dest);
	}
	else{
		debug('no need to move closer');
	}
}

//attaque l'adversaire aussi bien que possible
function behave_attack(){
	var attackChip = CHIP_SPARK;
	var INFINITY = 9999999*999999999;
	//@TODO: prioriser ce qui fait le plus de degats a cette distance
	if (canUseWeaponOnEnemy()){
		debug('shooting');
		shootForCost(INFINITY);
	}
	if (canUseChipOnEnemy(attackChip)){
		debug('using attack chip');
		useChipFor(attackChip, INFINITY);
	}
}

//s'éloigne du combat
function behave_flee(){
	var safeCells = findSafeCells();
	var l = count(safeCells);
	if (l > 0){
		debug('found safe cells');
		//@TODO: trouver la meilleure safe cell
		var dest = safeCells[0];
		for (var i = 0; i < l; i++){
			if (safeCells[i] == myGetCell()){
				debug('current cell is safe');
				dest = safeCells[i];
			}
		}
		
		mark(dest);
		myMoveTowardsCell(dest);
	}
	else{
		debug('no safe cells within reach');
		myMoveAwayFrom(self['target']);
	}
}
