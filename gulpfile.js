var gulp = require('gulp-param')(require('gulp'), process.argv);
var babel = require("gulp-babel");
var using = require('gulp-using');

gulp.task('compile', function(){

    return gulp.src('./src/**/*')
        .pipe(using())
        .pipe(babel())
        .pipe(gulp.dest('./app'));

});

/////////// WATCHERS ///////////////////

gulp.task('watch', function (browser, docs) {

    gulp.watch('./src/**/*', ['compile']);

});

