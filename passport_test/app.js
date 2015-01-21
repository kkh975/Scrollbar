var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser' );
var session = require( 'express-session' );
var http = require('http');
var ejs = require( 'ejs' );
var fs = require( 'fs' );

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, '/passport_test/views/'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'adfadfafafa',
    resave: true,
    saveUninitialized: true
}));

// passport load
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

// passport use
app.use(passport.initialize());
app.use(passport.session());

// passport init
passport.use( new FacebookStrategy({
    clientID: '493065400723583',
    clientSecret: '8b5dedfc560653fccb60341f685eca7f',
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
}, function( accessToken, refreshToken, profile, done ){
    console.log( '+ facebook info ======' );
    console.log( accessToken );
    console.log( refreshToken );
    console.log( profile );

    // done 메서드에 전달된 정보가 세션에 저장    
    return done( null, profile );
}));


app.get( '/', function( req, res ){
    console.log( '--- main facebook ---' );  
    console.log( '+ session: ======' );
    console.log( req.session );

    res.render( 'index', {
        user: req.session.passport.user || {}
    });
});

app.get( '/auth/facebook', passport.authenticate('facebook'), function( req, res ){
    console.log( '--- to facebook ---' );
});

app.get( '/auth/facebook/callback', function( req, res ){
    console.log( '--- callback facebook ---' );  
    console.log( '+ session: ======' );
    console.log( req.session.passport );

    res.render( 'index', {
        user: req.session.passport.user || {}
    });
});

app.get( '/logout', function( req, res ){
    req.logout();
    res.redirect( '/' );
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// production error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// server
var server = http.createServer(app);

server.listen(3000, function () {
    console.log('Server Running...');
});
server.on('error', function(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
server.on('listening', function(){
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
});


module.exports = app;