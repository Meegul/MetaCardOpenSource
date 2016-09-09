var express = require('express');
var path = require('path');
var logger = require('morgan');
var compression = require('compression');
var methodOverride = require('method-override');
var session = require('express-session');
var flash = require('express-flash');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var dotenv = require('dotenv');
var mongoose = require('mongoose');
var passport = require('passport');
var sass = require('node-sass-middleware');

/**
 * Load environment variables from .env file
 * You will need to create one and add:
 * a Mailgun username/password/session_secret
 * Facebook_id/Facebook_Secret
 * Google_id/Google_Secret
 * LinkedIn_id/LinkedIn_Secret
 * 
 * Additionally, change the callbackurls in ./config/passport.js
 * 
 * Optional:
 * PORT='INSERT PORT HERE'
 */

dotenv.load();

// Controllers
var UserController = require('./controllers/user');
var ContactController = require('./controllers/contact');
var SplashController = require('./controllers/splash');
var FriendsController = require('./controllers/friends');
var CardController = require('./controllers/card');

// Passport OAuth strategies
require('./config/passport');

var app = express();
//helmet modules for security I guess 
var helmet = require('helmet');
app.use(helmet());  

mongoose.connect('mongodb://PUT_YOUR_MONGODB_URL_HERE');


mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);
app.use(compression());

app.use(sass({ src: path.join(__dirname, 'public'), dest: path.join(__dirname, 'public') }));
app.use(express.static(__dirname + '/assets'))
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(methodOverride('_method'));
app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', SplashController.index);
app.get('/splash', SplashController.index);
app.get('/createcard', UserController.ensureAuthenticated, CardController.cardGet);
app.post('/createcard', UserController.ensureAuthenticated, CardController.cardPost);
app.put('/createcard', UserController.ensureAuthenticated, CardController.profInfoPut);
app.get('/mycards', UserController.ensureAuthenticated, CardController.cardView);
app.put('/mycards', UserController.ensureAuthenticated, CardController.cardPut);
app.delete('/mycards', UserController.ensureAuthenticated, CardController.cardDelete);
app.get('/viewcard', CardController.viewCard);
app.get('/friends', UserController.ensureAuthenticated, FriendsController.index);
app.post('/friends', UserController.ensureAuthenticated, FriendsController.friendsPost);
app.delete('/friends', UserController.ensureAuthenticated, FriendsController.friendsDelete);
app.get('/contact', ContactController.contactGet);
app.post('/contact', ContactController.contactPost);
app.get('/account', UserController.ensureAuthenticated, UserController.accountGet);
app.put('/account', UserController.ensureAuthenticated, UserController.accountPut);
app.delete('/account', UserController.ensureAuthenticated, UserController.accountDelete);
app.get('/signup', UserController.signupGet);
app.post('/signup', UserController.signupPost);
app.get('/login', UserController.loginGet);
app.post('/login', UserController.loginPost);
app.get('/forgot', UserController.forgotGet);
app.post('/forgot', UserController.forgotPost);
app.get('/reset/:token', UserController.resetGet);
app.post('/reset/:token', UserController.resetPost);
app.get('/logout', UserController.logout);
app.get('/unlink/:provider', UserController.ensureAuthenticated, UserController.unlink);
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }), function(req, res){});
app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/login'}), function(req, res){res.redirect('/mycards');});
app.get('/auth/linkedin', passport.authenticate('linkedin'), function(req, res){});
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {failureRedirect: '/account'}), function(req, res){res.redirect('/mycards');});
app.get('*', function(req, res){
  res.render('errors/404', {title:'Page not found'});
});


// Production error handler
if (app.get('env') === 'production') {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.sendStatus(err.status || 500);
  });
}

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
