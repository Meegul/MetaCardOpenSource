var models = require('../models/user');
/**
 * GET /friends
 */
exports.index = function(req, res) {
  res.render('./account/friends', {
    title: 'Friends'
  });
};


/**
 * Helper function that determines if a friend is a friend of another user
 * Requires a user to be passed to it (not an id, the actual user object)
 */
function isFriend(user, friend_email, callback) {
  if (!user || user === undefined || friend_email === undefined) //ensures that bad values passed don't cause problems
    return false;
  var found = false;
  models.User.findOne({ email: friend_email }, function(err, friend) {
    if (!friend || friend === null)
      return false; //Friend_email isn't attached to a user
    user.friend.forEach(function(element) {
      if (element === friend_email)
        found = true;
    }, this);
    return callback(found);
  });
}

/**
 * POST /friends
 */
exports.friendsPost = function(req, res) {
  models.User.findById(req.user.id, function(err, user) {
    if (err) {
      req.flash('error', { msg: 'Please log in' });
      res.redirect('/login');
    } else if (req.body.friend_email === user.email){
      req.flash('error', { msg: 'No, you cannot add yourself. Nice try though.' });
      res.redirect('/friends');
    } else {
      models.User.findOne({ email: req.body.friend_email }, function(err, friend) {
        if (err || friend === null) {
          req.flash('error', { msg: 'User not found' });
          res.redirect('/friends');
        } else {
          isFriend(user, req.body.friend_email, function callback(result) { 
            if (result) { //if is friend 
              console.log("Is Friend");
              req.flash('error', { msg: 'You are already friends with this user' });
              res.redirect('/friends');
            } else {
              user.friend.push(req.body.friend_email);
              user.save(function(err) {
                req.flash('success', { msg: 'You added ' + req.body.friend_email});
                res.redirect('/friends');
              });
            }
          });
        }
      });
    }
  });
}

/**
 * POST /friends?_method=DELETE
 * Used to delete friends
 */
exports.friendsDelete = function(req, res) {
  models.User.findById(req.user.id, function(err, user) {
    if (err) {
      req.flash('error', { msg: 'Please log in' });
      res.redirect('/login');
    } else {
      if (!user.friend[0]) {
        req.flash('error', { msg: 'You do not have any friends to delete.' });
        res.redirect('/friends');
      } else {
        var indexFound = -1;
        user.friend.forEach(function(element, index) {
          if (element === req.body.delete_email) {
            indexFound = index;
          }
        }, this);
        if (indexFound === -1) {
          req.flash('error', { msg: req.body.delete_email + ' is not your friend.'});
          res.redirect('/friends');
        } else {
          user.friend.splice(indexFound, 1);
          user.save(function (err) {
            req.flash('success', { msg: req.body.delete_email +  ' is no longer your friend.' });
            res.redirect('/friends');
          });
        }
      }
    }
  });
}