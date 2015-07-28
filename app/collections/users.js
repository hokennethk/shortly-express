var db = require('../config');
var User = require('../models/user');

var Users = new db.Collection({

});

// var addNewAccount = function(username, password){
//   console.log("USERS", Users);

//   Users({username: username})
//     .fetch()
//     .then(function(model){
//       // make salt
//         // hash password + salt
//           // store into database
      
//     });
// };

Users.model = User;

module.exports = Users;
