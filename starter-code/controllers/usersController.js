var passport = require("passport")

// GET /signup
function getSignup(req, res) {
}

// POST /signup
function postSignup(req, res) {
}

// GET /login
function getLogin(req, res) { 
}

// POST /login 
function postLogin(req, res) {
}

// GET /logout
function getLogout(req, res) {
}

// Restricted page
function getSecret(req, res){
}

module.exports = {
  getLogin:   getLogin,
  postLogin:  postLogin,
  getSignup:  getSignup,
  postSignup: postSignup,
  getLogout:  getLogout,
  getSecret:  getSecret
}