function createLeek(leekId){
	var leek = [];
	
	leek['id'] = leekId;
	leek['agression'] = 1;
	
	return leek;
}

global self = createLeek(getLeek());