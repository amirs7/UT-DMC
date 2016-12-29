var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var sanitize = require('mongo-sanitize');
var nodemailer = require('nodemailer');
var request = require('request');
var middleware = require('../middleware/index');
var mailer = require('../middleware/mailSender');
var mailTemplates = 'middleware/mailTemplates';
var token = require('../middleware/token');
var crypto = require("crypto");
var async = require("async");
var SMTPServer = require('smtp-server').SMTPServer;
var simplesmtp = require("simplesmtp");
var fs = require("fs");
var smtpTransport = require('nodemailer-smtp-transport');
var directTransport = require('nodemailer-direct-transport');
'use strict';

// router.all("/admin/*",middleware.isLoggedIn,middleware.havePermission);

router.get("/", function(req, res){
    req.flash("info","dsdadasdasdasdsd");
    res.render('landing', { messages: req.flash('info') });
});

// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});

router.post('/register',function(req, res,next) {
    var username = sanitize(req.body.username);
    var password = sanitize(req.body.password);
    var firstname = sanitize(req.body.firstname);
    var lastname = sanitize(req.body.lastname);
    var studentId = sanitize(req.body.studentId);
    var email = sanitize(req.body.email);
    var user = {
        firstname: firstname,
        lastname: lastname,
        username: username,
        studentId: studentId,
        email: email,
        password: password,
    };

    User.findOne({username: user.username}).exec(function (err, existUser) {
        if (err) return next(err);
        if (existUser) {
            req.flash('error', 'Username already exist');
            res.redirect('/register');
        } else {
            // mailer.sendTemplateTo(mailTemplates+"/resetpass/html.ejs",{address:req.headers.host,link:"/register/"+ token.setToken(user)},user.email,function (err,info) {
            //     console.log("ERR: "+err);
            //     console.log("INF: "+info);
            console.log("http://"+req.headers.host+"/register/"+token.setToken(user));
                res.redirect('/');
            // });

        }
    });
});

router.get('/register/:verification_token',function(req, res,next) {
    var user = token.decodeToken(req.params.verification_token);
    console.log(user);
    User.create(user,function (err, newUser) {
        if (err) return next(err);

            res.redirect('/login');
        });
});
//show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

router.post('/login', function(req, res, next){
    passport.authenticate('local', function(err, user, info) {
                if (err) return next(err);
                if (!user) {
                    return res.redirect('/login')
                }
                req.logIn(user, function(err) {
                    if (err) return next(err);
                    return res.redirect('/dashboard');
                });
            })(req, res, next);
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "LOGGED YOU OUT!");
   res.redirect("/");
});

router.get('/forgot', function(req, res,next) {
    res.render('forgot_password', {user: req.user});
});

router.post('/forgot', function(req, res, next) {
    User.findOne({ username: req.body.username}, function(err, user) {
        // mailer.sendTemplateTo(mailTemplates+"/resetpass/html.ejs",{address:req.headers.host,link:"/register/"+token.setToken(user)},user.email,function (err,info) {
        //     console.log(info);
        //     console.log(err);
            console.log("http://"+req.headers.host+"/reset/"+token.setToken(user));
            res.redirect('/');
        // });
    });
});

router.get('/reset/:token', function(req, res,next) {
    var user = token.decodeToken(req.params.token);
    User.findOne({ _id:user._id,
        resetPasswordExpires: { $gt: Date.now() }
    }
        , function(err, user) {
        if(err) return next(err);
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        } else{
            res.render('reset_password', {user:user,token:req.params.token});
        }
    });
});

router.post('/reset/:token', function(req, res,next) {
    var user = token.decodeToken(req.params.token);
    async.waterfall([
        function(done) {
            User.findOne({$and:[{_id:user._id},{resetPasswordExpires: { $gt: Date.now() }} ]},
                function(err, user) {
                    if (!user) {
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }
                    user.password = req.body.password;
                    user.resetPasswordExpires = undefined;
                    user.save(function(err) {
                    req.logIn(user, function(err) {
                        req.flash('success', 'Success! Your password has been changed.');
                        done(err, user);
                    });
                });
            });
        },
    ], function(err) {
        res.redirect('/login');
    });
});



module.exports = router;