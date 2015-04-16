// On prend le pistolet s'il n'est pas équipé
if(!getWeapon()) setWeapon(WEAPON_PISTOL); 

// On récupère tout un tas de truc
var me = getLeek();
var enemy = getNearestEnemy();
var place = getCellToUseWeapon(enemy);
var myPlace = getCell();
var enemyPlace = getCell(enemy);
var result;


// On avance vers l'ennemi (mais pas au contact)
moveTowardCell(place);

// Dés que possible, si on est proche, on essaye de lancer les buff bouclier/wall
if(getCellDistance(myPlace,enemyPlace) <= 13) {
	do{
	result = useChip(CHIP_HELMET,me);
	}
	while(result === USE_SUCCESS or result === USE_FAILED);
	do{
	result = useChip(CHIP_WALL,me);
	}
	while(result === USE_SUCCESS or result === USE_FAILED);
}

// On essaye de lui tirer dessus
var shot = 1;
var hitted = 0;
while(getTP() >= 3 and shot == 1) {
	result = useWeapon(enemy);
	if(result != USE_SUCCESS and result != USE_FAILED) shot = 0;
	else hitted = 1;
}


// S'il nous reste des actions
do{
	result = useChip(CHIP_SPARK,enemy);
}
while(result === USE_SUCCESS or result === USE_FAILED);

// Cassos !
moveAwayFrom(enemy);
