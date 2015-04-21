module.exports = function(grunt) {

var level = 37;

// Project configuration.
//var polyfills = ['./polyfill/*.js'].concat(['!./polyfill/getTurn.js']);
var polyfills = [];

if (level < 12) polyfills.push('./polyfill/getTurn.js');
if (level < 29) polyfills.push('./polyfill/canUseWeapon.js');

if (level < 36) polyfills.push('./polyfill/getCooldown.js');
else polyfills.push('./polyfill/useChipShim.js');

var epyonFiles = [	'./epyon/head.js', 
					'./epyon/leek.js',
					'./epyon/map.js', 
					'./epyon/Ascorers.js',
					'./epyon/behaviors.js',
					'./epyon/config.js', 
					'./epyon/core.js', 
					'./epyon/footer.js'];

grunt.initConfig( {
	pkg: grunt.file.readJSON('package.json'),
	watch: {
		files: ['./epyon/*.js', './polyfill/*.js', 'Gruntfile.js'],
		tasks: ['build']
	},
	concat: {
		epyon: {
			src: polyfills.concat(epyonFiles),
			dest: 'dist/epyon.ls'
		},
	},
});

// Load the plugin that provides tasks.
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-concat');
  
// Default task(s).
grunt.registerTask('build', ['concat']);
grunt.registerTask('default', ['build']);

};
