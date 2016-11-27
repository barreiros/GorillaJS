var express = require('express');
var app = express();

app.get('/', function(req, res){

    res.send('Another Express.js site built with GorillaJS!');

});

app.listen(80);

