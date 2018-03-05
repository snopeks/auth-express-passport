var LocalStrategy   = require('passport-local').Strategy;
var User            = require('../models/user');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
  passport.use('local-signup', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  }, function(req, email, password, done) {
    User.findOne({ 'local.email': email }, function (err, user){
      if(err) return done(err);
      //if there is a user with this email
      if(user){
        return done(null, false, req.flash('errorMessage', 'This email is already in use!'));
      } else {
        var newUser            = new User();
        newUser.local.email    = email;
        newUser.local.password = User.encrypt(password);
        newUser.save(function(err, user){
          if(err) return done(err);
          return done(null, user);
        })
      }
    });
  }));
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function(req, email, password, done) {
    User.findOne({ 'local.email' : email }, function(err, user){
      if(err) return done(err);

      //if no user is found
      if(!user) return done(null, false, req.flash('errorMessage', 'no user found.'));
      //check if password is correct

      if(!user.validPassword(password)) return done(null, false, req.flash('errorMessage', "oops, wrong password!"));
      return done(null, user);
    })
  }));
}