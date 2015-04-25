module.exports = function(grunt) {

var epyonFiles = [	'./epyon/head.js', 
					'./epyon/leek.js',
					'./epyon/map.js', 
					'./epyon/Ascorers.js',
					'./epyon/Cscorers.js',
					'./epyon/behaviors.js',
					'./epyon/config.js', 
					'./epyon/core.js', 
					'./epyon/bulb.js', 
					'./epyon/footer.js'];

// Project configuration.
//var polyfills = ['./polyfill/*.js'].concat(['!./polyfill/getTurn.js']);
function loadPolyfills(level){
	var polyfills = [];

	if (level < 8) polyfills.push('./polyfill/isInlineWeapon.js');
	if (level < 9){
		polyfills.push('./polyfill/getWeaponScopes.js');
		polyfills.push('./polyfill/getEffects.js');
	}
	if (level < 12) polyfills.push('./polyfill/getTurn.js');
	if (level < 29) polyfills.push('./polyfill/canUseWeapon.js');

	if (level < 36) polyfills.push('./polyfill/getCooldown.js');
	else polyfills.push('./polyfill/useChipShim.js');
	
	if (level < 37) polyfills.push('./polyfill/getPathLength.js');
	
	return polyfills;
}


grunt.initConfig( {
	pkg: grunt.file.readJSON('package.json'),
	watch: {
		files: ['./epyon/*.js', './polyfill/*.js', 'Gruntfile.js'],
		tasks: ['build']
	},
	concat: {
	},
});

// Load the plugin that provides tasks.
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-concat');
  
// Default task(s).
grunt.registerTask('build', function(){
	var concat = grunt.config.get('concat') || {};
	
	[5, 9, 13, 50].forEach(function(level){
		var pfs = loadPolyfills(level);
	
		concat['epyon'+level] = {
			src: pfs.concat(epyonFiles),
			dest: './dist/epyon.'+level+'.ls',
		};
	});
	
	grunt.config.set('concat', concat);
	
	grunt.task.run('concat');
});

grunt.registerTask('default', ['build']);

};
