//level 37
function getPathLength(cell1, cell2){
	return (cell1 && cell2) ? getCellDistance(cell1, cell2) : null;
}