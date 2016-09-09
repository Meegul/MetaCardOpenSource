var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var graph = require('fbgraph');
var models = require('../models/user');
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  models.User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Sign in with Email and Password
passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  models.User.findOne({ email: email }, function(err, user) {
    if (!user) {
      return done(null, false, { msg: 'The email address ' + email + ' is not associated with any account. ' +
      'Double-check your email address and try again.' });
    }
    user.comparePassword(password, function(err, isMatch) {
      if (!isMatch) {
        return done(null, false, { msg: 'Invalid email or password' });
      }
      return done(null, user);
    });
  });
}));

// Sign in with Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: 'https://metacard.xyz/auth/google/callback',
  passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    models.User.findOne({ google: profile.id }, function(err, user) {
      if (user) {
        req.flash('error', { msg: 'There is already an existing account linked with Google that belongs to you.' });
      } else {
        models.User.findById(req.user.id, function(err, user) {
          user.name = user.name || profile.displayName;
          user.gender = user.gender || profile._json.gender;
          user.picture = user.picture || profile._json.image.url;
          user.google = profile.id;
          user.save(function(err) {
            req.flash('success', { msg: 'Your Google account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    models.User.findOne({ google: profile.id }, function(err, user) {
      if (user) {
        return done(null, user);
      }
      models.User.findOne({ email: profile.emails[0].value }, function(err, user) {
        if (user) {
          req.flash('error', { msg: user.email + ' is already associated with another account.' });
          done(err);
        } else {
          var newUser = new models.User({
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            email: profile.emails[0].value,
            gender: profile._json.gender,
            location: profile._json.location,
            picture: profile._json.image.url,
            google: profile.id
          });
          newUser.save(function(err) {
            done(err, newUser);
          });
        }
      });
    });
  }
}));

// Sign in with Facebook
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: 'https://metacard.xyz/auth/facebook/callback',
  profileFields: ['name', 'email', 'gender', 'location'],
  passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    models.User.findOne({ facebook: profile.id }, function(err, user) {
      if (user) {
        req.flash('error', { msg: 'There is already an existing account linked with Facebook that belongs to you.' });
        done(err);
      } else {
        models.User.findById(req.user.id, function(err, user) {
              user.first_name = user.first_name || profile.name.givenName;
              user.last_name = user.last_name || profile.name.familyName;
              user.gender = user.gender || profile._json.gender;
              user.picture = user.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
              user.facebook = profile.id;
              user.location = user.location || profile._json.location.name;
              user.save(function(err) {
                req.flash('success', { msg: 'Your Facebook account has been linked.' });
                done(err, user);
              });
        });
      }
    });
  } else {
    models.User.findOne({ facebook: profile.id }, function(err, user) {
      if (user) {
        return done(err, user);
      }
      models.User.findOne({ email: profile._json.email }, function(err, user) {
        if (user) {
          req.flash('error', { msg: user.email + ' is already associated with another account.' });
          done(err);
        } else {
            var newUser = new models.User({
              first_name: profile.name.givenName,
              last_name: profile.name.familyName,
              email: profile._json.email,
              gender: profile._json.gender,
              picture: 'https://graph.facebook.com/' + profile.id + '/picture?type=large',
              facebook: profile.id,
              location: profile._json.location.name,
            });
            newUser.save(function(err) {
              done(err, newUser);
            });
          }
      });
    });
  }
}));

// Sign on with LinkedIn
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: 'https://metacard.xyz/auth/linkedin/callback',
  scope: ['r_basicprofile'],
  profileFields: ['first-name', 'last-name', 'public-profile-url', 'location'],
  passReqToCallback: true,
  state: true
}, function(req, accessToken, refreshToken, profile, done) {
    console.log(profile);
    models.User.findById(req.user.id, function(err, user) {
        user.first_name = user.first_name || profile._json.firstName;
        user.last_name = user.last_name || profile._json.lastName;
        user.linkedin = profile._json.publicProfileUrl;
        user.location = user.location || profile._json.location.name;
        user.save(function(err) {
          req.flash('success', { msg: 'Your LinkedIn account has been linked.' });
          done(err, user);
        });
    });
}));
