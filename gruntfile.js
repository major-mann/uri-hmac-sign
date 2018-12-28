module.exports = function initializeGrunt(grunt) {
    grunt.initConfig({
        mochaTest: {
            spec: {
                src: ['index.spec.js'],
                options: {
                    reporter: 'spec',
                    quiet: false,
                    clearRequireCache: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.registerTask('default', ['mochaTest:spec']);
};