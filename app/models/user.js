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

  createHash: function(password, callback, saltArg) {

    bcrypt.genSalt(null, function(err, salt) {
      if (err) {
        throw err;
      }

      if (saltArg) salt = saltArg;
      // hash password + salt
      bcrypt.hash(password, salt, null, function(error, hashed) {
        if (error) {
          throw error;
        }
        // store into database
        // that.username = params['username'];
        // that.password = hashed;
        // that.salt = salt;
        // console.log("MODEL CREATED", that);
        callback(hashed, salt);
      });
    });


  }
});





module.exports = User;