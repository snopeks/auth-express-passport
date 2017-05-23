var express        = require('express');
var app            = express();
var mongoose       = require('mongoose');
var passport       = require('passport');
var flash          = require('connect-flash');
var ejsLayouts     = require("express-ejs-layouts");
var morgan         = require('morgan');
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var session        = require('express-session');
var methodOverride = require('method-override'); 

// Setup database
var databaseURL = 'mongodb://localhost/local-authentication-with-passport'
mongoose.connect(databaseURL); 

// Setup middleware
app.use(morgan('dev')); 
app.use(cookieParser());
app.use(bodyParser()); 
app.use(ejsLayouts);
app.use(express.static(__dirname + '/public'));
// use express.session() before passport.session() to ensure that the login session is restored in the correct order
app.use(session({ secret: 'WDI-GENERAL-ASSEMBLY-EXPRESS' }));
// passport.initialize() middleware is required to initialize Passport.
app.use(passport.initialize());
// If your application uses persistent login sessions, passport.session()
app.use(passport.session()); 
app.use(flash());
app.use(methodOverride(function(request, response) {
  if(request.body && typeof request.body === 'object' && '_method' in request.body) {
    var method = request.body._method;
    delete request.body._method;
    return method;
  }
}));

// Express settings
app.set('view engine', 'ejs');
app.set("views", __dirname + "/views");

require('./config/passport')(passport);

// Custom middleware to allow global access to currentUser variable
app.use(function(req, res, next) {
  global.currentUser = req.user;
  next();
});

var routes = require(__dirname + "/config/routes");
app.use(routes);

app.listen(3000);

