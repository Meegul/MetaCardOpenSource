var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var cardSchema = new mongoose.Schema({
  //user shows who the card belongs to
  owner_id: {type: Schema.ObjectId, ref: 'User'},
  card_name: String,
  card_id: String,
  email: Boolean,
  facebook: Boolean,
  linkedin: Boolean,
  cell_phone: Boolean,
  home_phone: Boolean,
  work_phone: Boolean, 
  gender: Boolean,
  protected: Boolean,
  created_at: Date,
  updated_at: Date,
}, schemaOptions);

cardSchema.pre('save', function(next) {
  var currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  var newCard = this;
  next();
});

var Card = mongoose.model('Card', cardSchema);


var userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: { type: String, unique: true},
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  gender: String,
  location: String,
  website: String,
  picture: String,
  facebook: String,
  twitter: String,
  google: String,
  linkedin: String,
  home_phone: String,
  work_phone: String,
  cell_phone: String,
  friend: [String],
  card: [cardSchema],
}, schemaOptions);



userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    cb(err, isMatch);
  });
};

userSchema.virtual('gravatar').get(function() {
  if (!this.get('email')) {
    return 'https://gravatar.com/avatar/?s=200&d=retro';
  }
  var md5 = crypto.createHash('md5').update(this.get('email')).digest('hex');
  return 'https://gravatar.com/avatar/' + md5 + '?s=200&d=retro';
});

var User = mongoose.model('User', userSchema);

module.exports = {
    User: User,
    Card: Card
};