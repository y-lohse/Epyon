//include('epyon.leek.ls');

function epyon_moveTowardsTarget(maxMp){
	//@TODO: se déplace vers l'adversaire mais essayer de rester a couvert
	var cell = getCell(target['id']);
	moveTowardCell(cell, maxMp);
}

function epyon_moveToSafety(maxMp){
	//@TODO:essayer de se mettre à l'abris plutot que fuir en ligne droite
	moveAwayFrom(target['id'], maxMp);
}