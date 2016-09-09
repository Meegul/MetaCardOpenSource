var models = require('../models/user');
var FB = require('fb'); //needed to add friends

/**
 * GET /createcard
 */
exports.cardGet = function(req, res) {
  res.render('account/createcard', {
    title: 'My Cards'
  });
};

/**
 * Generates a new CardID
 * Ensures that the generated CardID is not in use already
 * by that user. It doesn't matter if another user is using
 * that CardID, because /viewcard requires the CardID
 * and the user.
 */
function generateCardID(user) {
  var maxNumber = 100000;
  var generated = Math.floor(Math.random() * maxNumber) + "";//last part ensures it's a string, as per the schema
  if (!user.card) {
    return generated;
  } else {
    while (true) {
      var found = false;
      generated = Math.floor(Math.random() * maxNumber) + "";//last part ensures it's a string, as per the schema
      user.card.forEach(function(element) {
        if (element.card_id === generated)
          found = true;
      }, this);
      if (!found)
        break;
    }
    return generated;
  }
}



/**
 * POST /createcard
 */
exports.cardPost = function(req, res, next) {
  models.User.findById(req.user.id, function(err, user) {
    console.log(req.body);
    var new_card = new models.Card({
      owner_id: req.user.id,
      card_name: req.body.card_name,
      card_id: generateCardID(user),
      email: req.body.email == 'true',
      facebook: req.body.facebook == 'true',
      linkedin: req.body.linkedin == 'true',
      cell_phone: req.body.cell_phone == 'true',
      home_phone: req.body.home_phone == 'true',
      work_phone: req.body.work_phone == 'true',
      gender: req.body.gender == 'true',
      protected: req.body.protected == 'true',
      created_at: Date.now(),
      updated_at: Date.now()
    });
    console.log("Card: " + new_card);
    new_card.save(function(err) {});
    user.card.push(new_card);
    user.save(function(err) {
      req.flash('success', { msg: 'Your card has been created.' });
      res.redirect('/mycards');
    });
  });
};

/**
 * PUT /createcard
 */
exports.profInfoPut = function(req, res, next) {
  models.User.findById(req.user.id, function(err, user) {
      user.home_phone = req.body.home_phone || user.home_phone;
      user.cell_phone = req.body.cell_phone || user.cell_phone;
      user.work_phone = req.body.work_phone || user.work_phone;
    user.save(function(err) {
      if (req.body.home_phone)
        req.flash('success', {msg: 'You have updated your home phone.' });
      if (req.body.cell_phone)
        req.flash('success', {msg: 'You have updated your cell phone.' });
      if (req.body.work_phone)
        req.flash('success', {msg: 'You have updated your work phone.' });
      res.redirect('/createcard');
    });
  });
};

/**
 * GET /mycards
 */
exports.cardView = function(req, res, next) {
  res.render('account/mycards', {
    title: 'My cards'
  });
};


/**
 * PUT /mycards
 */
exports.cardPut = function(req, res) {
  res.redirect('/mycards');
}

/**
 * DELETE /mycards
 */
exports.cardDelete = function(req, res, next) {
  var index = req.body.index;
  models.User.findById(req.user.id, function (err, user) {
    var card_name = req.user.card[index].card_name
    user.card.splice(index, 1);
    user.save(function (err) {
      if (card_name)
        req.flash('success', { msg: 'Your card "' + card_name +  '" has been deleted.' });
      else
        req.flash('success', {msg: 'Your card has been deleted.'});
      res.redirect('/mycards');
    });
  });
};

/**
 * Helper method to find a card given a user thier card's ids
 */
function findCard(user, card) {
  if (!user || !user.card)
    return null;
  var indexFound = null;
  user.card.forEach(function(element, index) {
    if (element.card_id === card)
      indexFound = index;
    //else 
      //console.log(element.id + "!=" + card);
  }, this);
  return indexFound;
}

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
 * GET /viewcard
 */
exports.viewCard = function (req, res, next) {
  if (req.query.user === undefined && req.query.card === undefined) {
    res.render('errors/404', {title:'Page not found'});
    return;
  }
  models.User.findById(req.query.user, function (err, user) {
    var owner = user;
    if (err) {
      res.render('errors/500', {title:'User not found', userID:req.query.user, cardID:req.query.card});
      return;
    }
    console.log(user);
    var cardIndex = null;
    cardIndex = findCard(user, req.query.card);
    if (cardIndex == undefined) {
      res.render('errors/500', {title:'Card not found', userID:req.query.user, cardID:req.query.card});
      return;
    }
    var card = user.card[cardIndex];
    if (card.protected) {
      if (!req.user) {
        req.flash('error', { msg: 'Please log in and try again' });
        res.redirect('/login?redirURL=' + req.url);
      } else { 
        isFriend(user, req.user.email, function(result) {
          if (result || owner.id === req.user.id) {//if the card owner is friends with the logged in user or if it's their card
            console.log(req.user.id + ' === ' + owner.id);
            res.render('viewcard', {card_user: user, card: card});
          } else {
            req.flash('error', { msg: 'You are not allowed to see that card' });
            res.redirect('/mycards');
          }
        });
      }
    } else {
      res.render('viewcard', {card_user: user, card: card});
    }
  });
}