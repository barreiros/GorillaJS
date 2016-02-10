var fs = require('fs');
var exec = require('child_process').exec;
var using = require('gulp-using');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var htmlEncode = require('htmlencode').htmlEncode;
var url = require('openurl');
var path = require('path');

var BASE_PATH = process.cwd();
var PATHS = {
    scripts: {
        source: [
            BASE_PATH + '/index.js',
            BASE_PATH + '/lib/**/*.js'
        ]
    },
    videos: {
        source: [
            BASE_PATH + '/docs/videos/*.mov'
        ]
    },
    docs: {
        source: [
            BASE_PATH + '/README.md'
        ],
        main: BASE_PATH + '/docs/index.html'
    }
};

function compileDocs(file){
    var text, data;

    text = fs.readFileSync(file.path);
    data = {
        text: text.toString(),
        mode: "markdown"
    };

    exec('curl --data \'' + JSON.stringify(data) + '\' https://api.github.com/markdown > ' + PATHS.docs.main, function(err, stdout, stderr){
        console.log(err);
        console.log(stdout);
        console.log(stderr);

        text = fs.readFileSync(PATHS.docs.main);
        text = '<meta charset="UTF-8">' + text;
        fs.writeFileSync(PATHS.docs.main, text);

    });

}

function compileVideo(file){
    var output;

    output = path.dirname(file.path) + '/' + path.basename(file.path, '.mov') + '.gif';

    exec('ffmpeg -i ' + file.path + ' -vf scale=-1:-1 ' + output, function(err, stdout, stderr){
        console.log(err);
        console.log(stdout);
        console.log(stderr);
    });

}

gulp.task('compile-scripts', function(){

    return gulp.src(PATHS.scripts.source)
        .pipe(using())
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter())
        .pipe(jshint.reporter('fail'))
        .on('error', function(err){
            console.log(err); 
        })
});

gulp.task('watch', function () {

    gulp.watch(PATHS.docs.source).on('change', compileDocs);
    gulp.watch(PATHS.videos.source).on('change', compileVideo);
    gulp.watch(PATHS.scripts.source, ['compile-scripts']);

    url.open(PATHS.docs.main);
});
