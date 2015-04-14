include('inc.behaviors');

//replir l'inventaire
var attackChip = CHIP_SPARK;

//mise en place des strats
behave_heal();
behave_aquireTarget();
behave_engage();
behave_attack();
behave_flee();

debug('instructions: '+getInstructionsCount()+'/'+INSTRUCTIONS_LIMIT);
debug('operations: '+getOperations()+'/'+OPERATIONS_LIMIT);
