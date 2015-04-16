module.exports = function(grunt) {

// Project configuration.
grunt.initConfig( {
	pkg: grunt.file.readJSON('package.json'),
	watch: {
		files: ['./epyon/*.js', 'Gruntfile.js'],
		tasks: ['build']
	},
	concat: {
		epyon: {
			src: ['./epyon/head.js', './epyon/leek.js', './epyon/map.js', './epyon/behaviors.js', './epyon/core.js'],
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
