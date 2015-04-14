include('epyon.core.ls');

epyon_aquireTarget();
epyon_updateAgressions();
epyon_computeStrategy();
epyon_executeBehaviors();

debug('instructions: '+getInstructionsCount()+'/'+INSTRUCTIONS_LIMIT);
debug('operations: '+getOperations()+'/'+OPERATIONS_LIMIT);