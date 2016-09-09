var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API, domain: process.env.MAILGUN_DOMAIN});
var passport = require('passport');
var models = require('../models/user');

/**
 * Login required middleware
 */
exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login?redirURL=' + req.url);
  }
};

/**
 * GET /login
 */
exports.loginGet = function(req, res) {
  if (req.user) {
    return res.redirect('/mycards');
  }
  if (req.query.redirURL != undefined && req.query.redirURL.includes("?user=")) {
    res.render('account/login', {
      title: 'Log in',
      redirURL: req.query.redirURL + "&card=" + req.query.card
    });
  } else {
    res.render('account/login', {
      title: 'Log in',
      redirURL: req.query.redirURL
    });
  }
};

/**
 * POST /login
 */
exports.loginPost = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });
  var errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', function(err, user, info) {
    if (!user) {
      req.flash('error', info);
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (req.body.redirURL !== 'undefined') {
   	    res.redirect(req.body.redirURL);
      } else {
        res.redirect('/mycards');
      }
    });
  })(req, res, next);
};

/**
 * GET /logout
 */
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 */
exports.signupGet = function(req, res) {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Sign up'
  });
};

/**
 * POST /signup
 */
exports.signupPost = function(req, res, next) {
  req.assert('first_name', 'Name cannot be blank').notEmpty();
  req.assert('last_name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirm', 'Passwords must match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/signup');
  }

  
  models.User.findOne({ email: req.body.email }, function(err, user) {
    if (user) {
      req.flash('error', { msg: 'The email address you have entered is already associated with another account.' });
      return res.redirect('/signup');
    }
    user = new models.User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password 
    });
    user.save(function(err) {
      req.logIn(user, function(err) {
        res.redirect('/');
      });
    });
  });
};

/**
 * GET /account
 */
exports.accountGet = function(req, res) {
  res.render('account/profile', {
    title: 'My Account'
  });
};

/**
 * PUT /account
 * Update profile information OR change password.
 */
exports.accountPut = function(req, res, next) {
  if ('password' in req.body) {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirm', 'Passwords must match').equals(req.body.password);
  } else {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });
  }

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/account');
  }

  models.User.findById(req.user.id, function(err, user) {
    if ('password' in req.body) {
      user.password = req.body.password;
    } else {
      user.first_name = req.body.first_name;
      user.last_name = req.body.last_name;
      user.email = req.body.email;
      user.facebook = req.body.facebook;
      user.twitter = req.body.twitter;
      user.linkedin = req.body.linkedin;
      user.name = req.body.name;
      user.gender = req.body.gender;
      user.location = req.body.location;
      user.website = req.body.website;
      user.home_phone = req.body.home_phone;
      user.work_phone = req.body.work_phone;
      user.cell_phone = req.body.cell_phone;

    }
    user.save(function(err) {
      if ('password' in req.body) {
        req.flash('success', { msg: 'Your password has been changed.' });
      } else if (err && err.code === 11000) {
        req.flash('error', { msg: 'The email address you have entered is already associated with another account.' });
      } else {
        req.flash('success', { msg: 'Your profile information has been updated.' });
      }
      res.redirect('/account');
    });
  });
};

/**
 * DELETE /account
 */
exports.accountDelete = function(req, res, next) {
  models.User.remove({ _id: req.user.id }, function(err) {
    req.logout();
    req.flash('info', { msg: 'Your account has been permanently deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /unlink/:provider
 */
exports.unlink = function(req, res, next) {
  models.User.findById(req.user.id, function(err, user) {
    if (user.password && user.email) {
      models.User.findById(req.user.id, function(err, user) {
        switch (req.params.provider) {
          case 'facebook':
            user.facebook = undefined;
            break;
          case 'google':
            user.google = undefined;
            break;
          case 'twitter':
            user.twitter = undefined;
            break;
          case 'linkedin':
            user.linkedin = undefined;
            break;
          default:
            req.flash('error', { msg: 'Invalid OAuth Provider' });
            res.redirect('/account');
        }
        user.save(function(err) {
          req.flash('success', { msg: 'Your account has been unlinked.' });
          res.redirect('/account');
        });
      });
    }
    else {
      if (!user.password)
        req.flash('error', { msg: 'You must create a password before unlinking your account.' });
      if (!user.email)
        req.flash('error', { msg: 'You must enter an email before unlinking your account.' });
      res.redirect('/account');
    }
  });
};

/**
 * GET /forgot
 */
exports.forgotGet = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 */
exports.forgotPost = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      models.User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', { msg: 'The email address ' + req.body.email + ' is not associated with any account.' });
          return res.redirect('/forgot');
        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // expire in 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var mailOptions = {
        to: user.email,
        from: 'support@YOUR_DOMAIN_HERE',
        subject: '✔ Reset your password on MetaCard',
        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      mailgun.messages().send(mailOptions, function(error, body) {
        req.flash('info', { msg: 'An email has been sent to ' + user.email + ' with further instructions.' });
        res.redirect('/forgot');
      });
    }
  ]);
};

/**
 * GET /reset
 */
exports.resetGet = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  models.User.findOne({ passwordResetToken: req.params.token })
    .where('passwordResetExpires').gt(Date.now())
    .exec(function(err, user) {
      if (!user) {
        req.flash('error', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset
 */
exports.resetPost = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirm', 'Passwords must match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('error', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      models.User.findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            req.flash('error', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
          }
          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save(function(err) {
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USER,
          pass: process.env.MAILGUN_PASS
        }
      });
      var mailOptions = {
        from: 'support@YOUR_DOMAIN_HERE',
        to: user.email,
        subject: 'Your MetaCard password has been changed',
        text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      mailgun.messages().send(mailOptions, function(error, body) {
        req.flash('success', { msg: 'Your password has been changed successfully.' });
        res.redirect('/account');
      });
    }
  ]);
};
