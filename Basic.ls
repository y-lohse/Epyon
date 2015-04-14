global nearestEnemy;
if (!nearestEnemy) nearestEnemy = getNearestEnemy();//@TODO voir s'il est pas mort

moveToward(nearestEnemy);
if (!getWeapon()) setWeapon(WEAPON_PISTOL);
var result;
do{
	result = useWeapon(nearestEnemy);
}
while(result === USE_SUCCESS or result === USE_FAILED);

