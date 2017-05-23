var express           = require('express');
var router            = express.Router();
var passport          = require("passport");
var usersController   = require('../controllers/usersController');
var staticsController = require('../controllers/staticsController');

router.route('/')
  .get(staticsController.home);

router.route('/signup')
  .get(usersController.getSignup)
  .post(usersController.postSignup)

router.route('/login')
  .get(usersController.getLogin)
  .post(usersController.postLogin)

router.route("/logout")
  .get(usersController.getLogout)

module.exports = router