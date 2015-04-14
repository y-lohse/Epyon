include('epyon.leek.ls');

function findBestCell(S, MP){
	if (S > -.5){
		//move towards target
		return getCell(target['id']);
	}
	else{
		//move away from target
		return getCell(target['id']);//FAUX
	}
}