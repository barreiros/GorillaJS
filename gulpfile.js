var gulp = require('gulp-param')(require('gulp'), process.argv);
var babel = require("gulp-babel");
var using = require('gulp-using');
var exec = require('child_process').exec;

gulp.task('compile', function(){

    var response;

    response = gulp.src('./src/**/*')
        .pipe(using())
        .pipe(babel())
        .pipe(gulp.dest('./app'));

    exec('npm link');

    return response;

});

/////////// WATCHERS ///////////////////

gulp.task('watch', function (browser, docs) {

    gulp.watch('./src/**/*', ['compile']);

});

