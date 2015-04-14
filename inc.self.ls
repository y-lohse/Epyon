global self = [];

function myGetCell(){
	if (self['_cellIsDirty']){
		self['_cell'] = getCell();
		self['_cellIsDirty'] = false;
	}
	
	return self['_cell'];
}

function myMoveTowardsCell(cell){
	moveTowardCell(cell);
	self['_cellIsDirty'] = true;
}

//@TODO: fusionner avec au dessus
function myMoveAwayFrom(something){
	moveAwayFrom(something);
	self['_cellIsDirty'] = true;
}

function equipWeapon(weapon){
	if (self['weapon'] != weapon){
		setWeapon(weapon);
		self['weapon'] = weapon;
		self['weapon_range'] = getWeaponMaxScope(weapon);
		self['weapon_cost'] = getWeaponCost(weapon);
	}
}

//autoinit
if (!self['init']){
	self['init'] = true;
	self['target'] = null;
	self['_cell'] = getCell();
	self['_cellIsDirty'] = false;
	
	self['weapon'] = null;
	self['weapon_range'] = 0;
	
	self['life'] = getLife();
	self['max_life'] = self['life'];
	
	say('Tu vas passer à la casserolle!');
	equipWeapon(WEAPON_PISTOL);
}

self['life'] = getLife();//reset a chaque tour
