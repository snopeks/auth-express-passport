# Local Authentication with Express and Passport - GA WDI example

### Objectives
*After this lesson, students will be able to:*

- Create a login form with email & password
- Use passport-local to find a user and verify their password
- Restrict access to API without an authenticated user

### Preparation
*Before this lesson, students should already be able to:*

- Create an express application and add CRUD/REST resources
- Create a Mongoose Model
- Describe and authentication model


## Passport and the logics

From the [passport website](http://passportjs.org/docs):

"_Passport is authentication Middleware for Node. It is designed to serve a singular purpose: authenticate requests. When writing modules, encapsulation is a virtue, so Passport delegates all other functionality to the application. This separation of concerns keeps code clean and maintainable, and makes Passport extremely easy to integrate into an application._

_In modern web applications, authentication can take a variety of forms. Traditionally, users log in by providing a username and password._"

#### Strategies

The main concept when using passport is to register _Strategies_.  A strategy is a passport Middleware that will create some action in the background and execute a callback; the callback should be called with different arguments depending on whether the action that has been performed in the strategy was successful or not. Based on this and on some config params, passport will redirect the request to different paths.

Because strategies are packaged as individual modules, we can pick and choose what modules we need for our application. This logic allows the developer to keep the code simple - without unnecessary dependencies - in the controller and delegate the proper authentication job to some specific passport code. On a high-level, you can think of the passport module as authentication middleware the app uses and any passport strategy module (`passport-*`) as detailed authentication middleware that passport itself uses.


## Implementing Passport.js - Codealong

#### Setup/Review Starter Code

First, clone the starter code and setup with `npm install` to ensure that we have all of the correct dependencies.

The starter-code is structured like this:

```
.
└── app
    ├── server.js
    ├── config
    │   ├── passport.js
    │   └── routes.js
    ├── controllers
    │   └── users.js
    ├── models
    │   └── user.js
    ├── package.json
    ├── public
    │   └── css
    │       └── bootstrap.min.css
    └── views
        ├── index.ejs
        ├── layout.ejs
        ├── login.ejs
        ├── secret.ejs
        └── signup.ejs

7 directories, 12 files
```

Now let's open the code up in Atom with `atom .`.

#### Users & Statics Controller

Let's have a quick look at the `usersController.js` controller. As you can see, the file is structured like a module with six empty route handlers:

```
// GET /signup
// POST /signup
// GET /login
// POST /login
// GET /logout
// Restricted page
```

The statics controller, just has the home action.

#### Routes.js

We have separated the routes into a separate file, to remove them from the `server.js` file.

#### Signup

First we will implement the signup logic. For this, we will have:

1. a route action to display the signup form
2. a route action to receive the params sent by the form

When the server receives the signup params, the job of saving the user data into the database, hashing the password and validating the data will be delegated to the strategy allocated for this part of the authentication, this logic will be written in `config/passport.js`

Open the file `config/passport.js` and add:

```javascript
var LocalStrategy   = require('passport-local').Strategy;
var User            = require('../models/user');

module.exports = function(passport) {
  passport.use('local-signup', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  }, function(req, email, password, done) {

  }));
}
```

Here, we are declaring the strategy for the sign up. The first thing to note is that we are using a dependency, passport-local, to help configure the "strategy" middleware of passport. This module lets you authenticate using a username and password, however, it could easily be swapped out with another passport middleware strategy such as passport-google-oauth which lets your app authenticate using Google.

#### Configure Strategy

Just like how express has `.use()` available for mounting middleware, so does passport. At the first argument to `use`, we declare the name of the strategy we configure in the second argument. By declaring the name of the strategy, passport can refer to it later. The second argument argument given to `LocalStrategy` is an object giving info about the fields we will use for the authentication. Simply, this is where we configure the strategy middleware.

By default, passport-local expects to find the fields `username` and `password` in the request. If you use different field names, as we do, you rename them in `LocalStrategy`'s configuration.

Then, we pass the function that we want to be executed as a callback when this strategy is called: this callback method will receive the request object; the values corresponding to the fields name given in the object (usernameField and passwordField); and the callback method (`done`) to execute when this 'strategy' is done. You can think of `done` as the `next` callback we executed within our express middleware when we were ready to move on to the next functionality.

Now, inside this callback method, we will implement our custom logic to signup a user.

```javascript
...
}, function(req, email, password, callback) {

// Find a user with this email
    User.findOne({ 'local.email' : email }, function(err, user) {
      if (err) return done(err);

      // If there is a user with this email
      if (user) {
        return done(null, false, req.flash('errorMessage', 'This email is already used!'));
      } else {

        var newUser            = new User();
        newUser.local.email    = email;
        newUser.local.password = User.encrypt(password);

        newUser.save(function(err, user) {
          if (err) return done(err);
          return done(null, user);
        });
      }
    });
}));
...

```

First we will try to find a user with the same email, to make sure this email is not already use.

Once we have the result of this mongo request, we will check if a user document is returned - meaning that a user with this email already exists.  In this case, we will call the `callback` method with the two arguments `null` and `false` - the first argument is for when a server error happens; the second one corresponds to the user object, which in this case hasn't been created, so we return false.

If no user is returned, it means that the email received in the request can be used to create a new user object. We will, therefore create a new user object, hash the password and save the new created object to our mongo collection. When all this logic is created, we will call the `callback` method with the two arguments: `null` and the new user object created.

In the first situation we pass `false` as the second argument, in the second case, we pass a user object to the callback, corresponding to true, based on this argument, passport will know if the strategy has been successfully executed and if the request should redirect to the `success` or `failure` path. (see below).

#### User.js

The last thing is to add the method `encrypt` to the user model to hash the password received and save it as encrypted:

```javascript
userSchema.statics.encrypt = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
```

As we did in the previous lesson, we generate a salt token and then hash the password using this new salt.

That's all for the signup strategy.

#### Route Handler

Now we need to use this strategy in the route handler.


In the `usersController.js` controller, for the method `postSignup`, we will add the call to the strategy we've declared earlier, `local-signup`:


```javascript
function postSignup(req, res) {
  var signupStrategy = passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true
  });

  return signupStrategy(req, res);
}
```

Here we are calling the method `authenticate` (given to us by passport) and then telling passport which strategy (`'local-signup'`) to use.

The second argument tells passport what to do in case of a success or failure.

- If the authentication was successful, then the response will redirect to `/`
- In case of failure, the response will redirect back to the form `/signup`

#### Session

We've seen in previous lessons that authentication is based on a value stored in a cookie, and then, this cookie is sent to the server for every request until the session expires or is destroyed.

To use the session with passport, we need to create two new methods in `config/passport.js` :

```javascript
module.exports = function(passport) {

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
...

```

The method `serializeUser` will be used when a user signs in or signs up, passport will call this method, our code then call the `done` callback, the second argument is what we want to be serialized.

The second method will then be called every time there is a value for passport in the session cookie. In this method, we will receive the value stored in the cookie, in our case the `user.id`, then search for a user using this ID and then call the callback. The user object will then be stored in the request object passed to all controller methods calls.

## Flash Messages

Remember Rails? Flash messages were one-time messages that were rendered in the views and when the page was reloaded, the flash was destroyed.

In our current Node app, back when we have created the signup strategy, in the callback we had this code:

```javascript
req.flash('errorMessage', 'This email is already used.')
```

This will store the message 'This email is already used.' into the response object and then we will be able to use it in the views. This is really useful to send back details about the process happening on the server to the client.


## Incorporating Flash Messages
In the view `signup.ejs`, above the form, add:

```ejs
<% if (message.length > 0) { %>
  <div class="alert alert-danger"><%= message %></div>
<% } %>
```

Let's add some code into `getSignup` in the users Controller to render the template:

```javascript
function getSignup(req, res) {
  res.render('signup', { message: req.flash('errorMessage') });
}
```

Now, start up the app using `nodemon server.js` and visit `http://localhost:3000/signup` and try to signup two times with the same email, you should see the message "This email is already used." appearing when the form is reloaded.


## Test it out - Independent Practice

All the logic for the signup is now set - you should be able to go to `/signup` in a web browser and the signup form should be displayed, this is because by default, like in Rails, Node. will look for a template that have the same name than the route, in this case `signup.ejs`. When you submit the form, it should create a user document.


## Sign-in - Codealong
Now we need to write the `signin` logic.

We also need to implement a custom strategy for the login, In passport.js, after the signup strategy, add add a new LocalStrategy:

```javascript
passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done) {

}));
```

The first argument is the same as for the signup strategy - we ask passport to recognize the fields `email` and `password` and to pass the request to the callback function.

For this strategy, we will search for a user document using the email received in the request, then if a user is found, we will try to compare the hashed password stored in the database to the one received in the request params. If they are equal, the the user is authenticated; if not, then the password is wrong.

Inside `config/passport.js` let's add this code:

```javascript
...
}, function(req, email, password, done) {

  // Search for a use with this email
  User.findOne({ 'local.email': email }, function(err, user) {
    if (err) return done(err);

    // If no user is found
    if (!user) return done(null, false, req.flash('errorMessage', 'No user found.'));


    // Check if the password is correct
    if (!user.validPassword(password)) return done(null, false, req.flash('errorMessage', 'Oops wrong password!'));

    return done(null, user);
  });
}));
...

```

#### User validate method

We need to add a new method to the user schema in `user.js` so that we can use the method `user.validatePassword()`. Let's add:

```javascript
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};
```

#### Adding flash messages to the view

As we are again using flash messages, we will to add some code to display them in the view:

In `login.ejs`, add the same code that we added in `signup.ejs` to display the flash messages:

```javascript
  <% if (message.length > 0) { %>
    <div class="alert alert-danger"><%= message %></div>
  <% } %>
```

#### Login GET Route handler

Now, let's add the code to render the login form in the `getLogin` action in the controller (`users.js`):

```javascript
function getLogin(req, res) {
  res.render('login', { message: req.flash('errorMessage') });
}
```

#### Login POST Route handler

We also need to have a route handler that deals with the login form after we have submit it. So in `users.js` let’s also add:

```javascript
function postLogin(request, response) {
  var loginStrategy = passport.authenticate('local-login', {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
  });

  return loginStrategy(req, res);
}
```

You should be able to login now!

To reiterate, passport alone is not enough for authentication; it is middleware used directly by the application, but the passport module itself needs middleware with authentication logic, a strategy module, that serves to perform a specific type of authentication. Essentially, when creating authentication using passport, you will always need these two middlewares, at a minimum.


## Test it out
#### Invalid Login

First try to login with:

- a valid email
- an invalid password

You should also see the message 'Oops! Wrong password.'

#### Valid Login

Now, try to login with valid details and you should be taken to the index page with a message of "Welcome".

The login strategy has now been setup!

## Sign Out - Codealong
#### Logout

The last action to implement for our authentication system is to set the logout route and functionality.

#### Accessing the User object globally

By default, passport will make the user available on the object `request`. In most cases, we want to be able to use the user object everywhere, for that, we're going to add a middleware in `server.js`:

```javascript
require('./config/passport')(passport);

app.use(function (req, res, next) {
  global.currentUser = req.user;
  next();
});
```

Now in the layout, we can add:

```javascript
<% if (currentUser) { %>
  <li><a href="/logout">Logout</a></li>
<% } else { %>
 <li><a href="/login">Login</a></li>
 <li><a href="/signup">Signup</a></li>
<% } %>
<li><a href="/secret">Secret page (only if authenticated)</a></li>
```

Inside the `usersController.js`, we need to add the corresponding logout logic to the `getLogout` route handler:

```javascript
function getLogout(req, res) {
  req.logout();
  res.redirect('/');
}
```

Passport exposes a `logout()` function on req (also aliased as `logOut()`) that can be called from any route handler that needs to terminate a login session. Invoking `logout()` will remove the `req.user` property and clear the login session if one exists.

## Test it out

You should now be able to login and logout! Test this out.


## Sign Out, Restricting access - Demo

As you know, an authentication system is used to allow/deny access to some resources to authenticated users.

Let's now turn our attention to the `secret` route handler and its associated template.

To restrict access to this route, we're going to add a method at the top of `config/routes.js`:

```javascript
function authenticatedUser(req, res, next) {
  // If the user is authenticated, then we continue the execution
  if (req.isAuthenticated()) return next();

  // Otherwise the request is always redirected to the home page
  req.flash('errorMessage', 'Login to access!');
  res.redirect('/login');
}
```

Now when we want to "secure" access to a particular route, we will add a call to the method in the route definition.

For the `/secret` route, we need to add this to the `/config/routes.js` file:

```javascript
router.route("/secret")
  .get(authenticatedUser, usersController.getSecret)
```

Now every time the route `/secret` is called, the method `authenticatedUser` will be executed first. In this method, we either redirect to the homepage or go to the next method to execute.

Finally, we need to add the corresponding function to the `usersController.js`:

```javascript
function getSecret(req, res){
  res.render('secret.ejs');
}
```

Now test it out by clicking on the secret page link. You should see: "This page can only be accessed by authenticated users"

Now, let's move that in the navbar:

```ejs
<% if (currentUser) { %>
  <li><a href="/logout">Logout</a></li>
  <li><a href="/secret">Secret page (only if authenticated)</a></li>
<% } else { %>
  <li><a href="/login">Login</a></li>
  <li><a href="/signup">Signup</a></li>
<% } %>
```

## Independent Practice

> ***Note:*** _This can be a pair programming activity or done independently._

- Once the user is authenticated, make sure he/she can't access the sign-in or sign-up and redirect with a message, and vice-versa for the logout

#### Solution

Make a new unAuthenticatedUser function:

```javascript
function unAuthenticatedUser(req, res, next) {
  if(!req.isAuthenticated()) return next();
  req.flash('errorMessage', 'You are already logged in!')
  res.redirect('/');
}
```

And update the routes to be:

```javascript
router.route('/')
  .get(staticsController.home);

router.route('/signup')
  .get(unAuthenticatedUser, usersController.getSignup)
  .post(usersController.postSignup);

router.route('/login')
  .get(unAuthenticatedUser, usersController.getLogin)
  .post(usersController.postLogin);

router.route('/logout')
  .get(authenticatedUser, usersController.getLogout);

router.route('/secret')
  .get(authenticatedUser, usersController.getSecret);
```

Inside the statics controller add:

```javascript
function home(req, res) {  
  res.render('index.ejs', { message: req.flash('errorMessage') });
}
```

Then on the index page, add:

```ejs
<% if (message.length > 0) { %>
  <div class="alert alert-danger"><%= message %></div>
<% } %>
```

Test this by logging in and then revisiting "/login". We could obviously move these messages to the layout at a later date, but we would need to assign a global flash message.


## Conclusion

Passport is a really useful tool because it allows developers to abstract the logic of authentication and customize it, if needed. It comes with a lot of extensions that we will cover later.

- How do salts work with hashing?
- Briefly describe the authentication process using passport in Express.
