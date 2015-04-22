function postfightByPreference(behaviors, allocatedAP, allocatedMP){
	return behaviors[0];
}

EPYON_CONFIG['select_postfight'] = postfightByPreference;