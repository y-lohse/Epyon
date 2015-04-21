module.exports = function(grunt) {

// Project configuration.
//var polyfills = ['./polyfill/*.js'].concat(['!./polyfill/getTurn.js']);
var polyfills = [];

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
