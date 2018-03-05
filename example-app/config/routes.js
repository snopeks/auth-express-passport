var express           = require('express');
var router            = express.Router();
var passport          = require("passport");
var usersController   = require('../controllers/usersController');
var staticsController = require('../controllers/staticsController');

function authenticatedUser(req, res, next) {
  // If the user is authenticated, then we continue the execution
  if (req.isAuthenticated()) return next();

  // Otherwise the request is always redirected to the home page
  req.flash('errorMessage', 'Login to access!');
  res.redirect('/login');
}

function unAuthenticatedUser(req, res, next) {
  if(!req.isAuthenticated()) return next();
  req.flash('errorMessage', 'You are already logged in!')
  res.redirect('/');
}

router.route('/')
  .get(staticsController.home);

router.route('/signup')
  .get(unAuthenticatedUser, usersController.getSignup)
  .post(usersController.postSignup)

router.route('/login')
  .get(unAuthenticatedUser, usersController.getLogin)
  .post(usersController.postLogin)

router.route("/logout")
  .get(usersController.getLogout)

router.route('/secret')
  .get(authenticatedUser, usersController.getSecret)

module.exports = router