var crypto = require('crypto');
var bcrypt = require('bcrypt');
var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var UserSchema = new mongoose.Schema({
    firstname:String,
    lastname:String,
    studentId:Number,
    email:String,
    username: String,
    password: String,
    groupname:String,
    rycode:String,
    isAdmin:Boolean,
    group:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    token:String,
    tokenExpires:Date
});

UserSchema.pre('save', function(next) {
    var user = this;
    var SALT_FACTOR = 5;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
        if (err) return next(err);
        var hash = bcrypt.hashSync(user.password, salt, null);
        user.password = hash;
        return next();
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.virtual('name').get(function () {
    return this.firstname+" "+this.lastname;
});


UserSchema.plugin(passportLocalMongoose)
UserSchema.plugin(deepPopulate);

module.exports = mongoose.model("User", UserSchema);