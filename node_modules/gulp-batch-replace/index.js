var es = require('event-stream');

module.exports = function(arr) {
  var doReplace = function(file, callback) {


    var isStream = file.contents && typeof file.contents.on === 'function' && typeof file.contents.pipe === 'function';
    var isBuffer = file.contents instanceof Buffer;


    if (isStream)
    {
      file.contents = file.contents.pipe(es.map(function(chunk,cb){
        for( var i=0, max = arr.length; i<max; i++ ){
          var search  = arr[i][0],
              replace = arr[i][1];

          var isRegExp = search instanceof RegExp;

          var result = isRegExp
          ? String( chunk ).replace( search, replace )
          : String( chunk ).split( search ).join( replace );
          chunk = new Buffer(result);
        };
        cb(null,chunk);
      }));
    }

    else if(isBuffer)

    {
      for( var i=0, max = arr.length; i<max; i++ ){
        var search  = arr[i][0],
            replace = arr[i][1];

        file.contents = search instanceof RegExp
        ? new Buffer( String( file.contents ).replace( search, replace ) )
        : new Buffer( String( file.contents ).split( search ).join( replace ) );
      }
    }

    callback(null,file);
  };


  return es.map(doReplace);
};