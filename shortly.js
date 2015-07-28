var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var utils = require('./lib/utility');
var session = require('express-session');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// app.all(['/', '/create', '/links'], utils.restrictHandler);
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'get rekt'
}));


app.get('/', utils.restrictHandler,
function(req, res) {
  res.render('index');
});

app.post('/login', 
function(req, res) {
  // console.log('req', req);
  console.log(req.body);
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(user) {
    if (user) {
      // redirect to login
      var salt = user.get('salt');

      user.createHash(password, function(hashed){
        var passHash = hashed;
        if (hashed === user.get('password')) {
          console.log('SUPA HOT FIREE');
          req.session.regenerate(function() {
            req.session.user = username;
            console.log('VERIFIED');
            res.redirect('/');
          });
        } else {
          console.log('REJECTED');
          console.log('Ouch?');
        }

      }, salt);
      // if(username == 'demo' && password == 'demo'){
      //   req.session.regenerate(function(){
      //     req.session.user = username;
      //     res.redirect('/');
      //   });
      // } else {
      //   res.redirect('login');
      // } 

    } else {
      // create new user
      res.redirect('/signup');

    }
  });



});

app.get('/login', 
function(req, res) {
  // console.log('req', req);
  res.render('login');

});

app.get('/signup', 
function(req, res) {
  // console.log('req', req);
  res.render('signup');

});

app.get('/logout' ,
function(req, res){
  req.session.destroy();
  res.redirect('/login');
});

app.get('/create', utils.restrictHandler,
function(req, res) {
  res.render('index');
});

app.get('/links', utils.restrictHandler,
function(req, res) {
  // MIDDLEWARE RUNS HERE
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;
  console.log("URI", uri);

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', function(req, res) {
  // console.log(req.body);

  // Users.reset(); 


  var username = req.body["username"];
  var password = req.body["password"];

  new User({ username: username }).fetch().then(function(user) {
    if (user) {
      // redirect to login
      res.redirect('/login');
    } else {
      // create new user


      var user = new User();
      user.set('username', username);
      // set password and salt
      user.createHash(password, function(hashed, salt) {
        user.set('password', hashed);
        user.set('salt', salt);
        user.save().then(function(newUser) {
          console.log('done');
          res.send('<p>Accout has been created :) <a href= "/login">GO HERE</a></p>')
          Users.add(newUser);
        });
      });

    }
  });

});




/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      // console.log("REDIRECT");
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
