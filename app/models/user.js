var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  defaults: {
    username: "Guest",
    password: "",
    salt: ""
  },

  initialize: function(params) {
    console.log("CONSTRCUTOR", params['username'], params['password']);
    // make salt
    var that = this;
    bcrypt.genSalt(null, function(err, salt) {
      if (err) {
        throw err;
      }
      // hash password + salt
      bcrypt.hash(params.password, salt, null, function(error, hashed) {
        if (error) {
          throw error;
        }
        // store into database
        // that.username = params['username'];
        // that.password = hashed;
        // that.salt = salt;
        console.log("MODEL CREATED", that);
        that.save({username: params['username'], password: hashed, salt: salt})
      });
    });
  }
});





module.exports = User;