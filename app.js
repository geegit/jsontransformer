xmlparser = require('express-xml-bodyparser');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var transform = require('./routes/transform');
var distort = require('response-distort')
var url = require('url')
var fs = require('fs')


var compression = require('compression')
var express = require('express')
var app = express()
app.use(compression())


// compress all responses 
app.use(compression())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));
app.use(cookieParser());



app.use('/transform', transform);

process.env.HOMEDIR = path.join(__dirname);

process.env.SITEDIR = path.join(__dirname,"public","sites");


//Put before regular routes so they don't interfere

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public','sites')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('The Page is Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
   res.end(JSON.stringify(res.locals.message));
  //res.render('error');
});

var port = process.env.PORT || 3000;

app.listen(3000, function () {
  console.log('Example app listening on port ' + port + '!');
});


module.exports = app;
