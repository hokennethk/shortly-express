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


app.get('/', utils.restrictHandler,
function(req, res) {
  res.render('index');
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

  //check for user
  Users
    .query({where: {username: username}})
    .fetch()
    .then(function(collection){
      console.log("THIS IS THE MODEL", collection.models.length);
      if (!collection.models.length){
        console.log(collection.models.length);
        console.log("NO MODEL");
        Users.add({username: username, password: password});
        // console.log("MODEL CREATED");
        
      } else {
        console.log("MODEL FOUND", collection.models.length);
      }
    });

  console.log("TOTAL LENGTH, SIR", Users.models.length);



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
