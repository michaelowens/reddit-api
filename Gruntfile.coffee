module.exports = (grunt) ->

	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'
		
		coffee: compile: files: 'index.js': 'src/index.coffee'
			
	grunt.loadNpmTasks 'grunt-contrib-coffee'
	
	grunt.registerTask 'default', ['coffee']
