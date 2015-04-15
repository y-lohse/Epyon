module.exports = function(grunt) {

// Project configuration.
grunt.initConfig( {
	pkg: grunt.file.readJSON('package.json'),
	watch: {
		files: ['./*.ls', 'Gruntfile.js'],
		tasks: ['build']
	},
	concat: {
		epyon: {
			src: ['./epyon.head.ls', './epyon.leek.ls', './epyon.map.ls', './epyon.behaviors.ls', './epyon.core.ls'],
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
