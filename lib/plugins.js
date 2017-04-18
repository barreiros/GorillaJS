'use strict';

var argv = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var through = require('through2');
var fs = require('fs');
var fsx = require('fs-extra');
var path = require('path');

var cross = require(__dirname + '/crossExec.js');

module.exports = {

    init: function(pluginsPath){

        var streamList, streamInclude, buffer, results;

        if(argv._[0] === 'plugin'){

             
            if(argv._[1] === 'add'){

                cross.moveFiles(path.join(pluginsPath, path.basename(argv._[2])), false, '', argv._[2]);
                        
            }else if(argv._[1] === 'remove'){


                if(fs.existsSync(path.join(pluginsPath, argv._[2]))){

                    fsx.removeSync(path.join(pluginsPath, argv._[2]));

                }else{
    
                    fsx.removeSync(path.join(pluginsPath, argv._[2] + '.js'));

                }

            }else if(argv._[1] === 'list'){

                streamList = gulp.src(pluginsPath + '/**/*.js')

                    .pipe(through.obj(function (chunk, enc, cb) {

                        if(chunk._contents){

                            buffer = chunk._contents.toString();
                            results = buffer.match(/Plugin name/g);

                            if(results){

                                if(path.dirname(path.dirname(chunk.path)) === path.dirname(pluginsPath)){

                                    console.log(path.basename(chunk.path, '.js'));

                                }else{

                                    console.log(path.basename(path.dirname(chunk.path)));

                                }

                            }

                        }

                        cb();

                    }

                ));

                streamList.on('finish', function(){

                });

            }

        }

        streamInclude = gulp.src(pluginsPath + '/**/*.js')

            .pipe(through.obj(function (chunk, enc, cb) {

                if(chunk._contents){

                    buffer = chunk._contents.toString();
                    results = buffer.match(/Plugin name/g);

                    if(results){

                        require(chunk.path);


                    }

                }

                cb();

            }

        ));

    }

}
