var gulp = require('gulp-param')(require('gulp'), process.argv);
var babel = require('gulp-babel');
var using = require('gulp-using');
var exec = require('child_process').exec;
var fs = require('fs');
var fsx = require('fs-extra');

function compileNoJSFiles(file, stats){

    var target;

    target = file.path;
    target = target.replace(__dirname, '');
    target = target.replace('/src', './app');

    fsx.copySync(file.path, target);

}

function removeNoJSFiles(path){

    var target;

    target = file.path;
    target = target.replace(__dirname, '');
    target = target.replace('/src', './app');

    fsx.removeSync(target);

}

gulp.task('compile', function(){

    var response;

    response = gulp.src('./src/**/*.js')
        .pipe(using())
        .pipe(babel())
        .pipe(gulp.dest('./app'));

    exec('npm link');

    return response;

});

/////////// WATCHERS ///////////////////

gulp.task('watch', function (browser, docs) {

    var watchMigrate;

    gulp.watch('./src/**/*.js', ['compile']);

    watchMigrate = gulp.watch(['./src/**/*', '!./src/**/*.js']);
    watchMigrate.on('change', compileNoJSFiles);
    watchMigrate.on('unlink', removeNoJSFiles);

});

