include('epyon.leek.ls');

function epyon_moveTowardsTarget(maxMp){
	var cell = getCell(target['id']);
	moveTowardCell(cell, maxMp);
}

function epyon_moveToSafety(maxMp){
	moveAwayFrom(target['id'], maxMp);
}