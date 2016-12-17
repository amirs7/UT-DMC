'use strict';
const EmailTemplate = require('email-templates').EmailTemplate;
const User = require('./../models/user');
const nodemailer = require('nodemailer');

const mailOptions = {
    from: '', // Your email id
    subject: 'DM Contest'
};

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: '', // Your email id
        pass: '' // Your password
    }
});

module.exports = {
    sendTemplateToAll: function (pathToTemplate, params, callback) {
        User.find({}, 'email', function(err, docs) {
            if(err)
                return callback(err);
            if(!docs)
                return callback(null);
            new EmailTemplate(pathToTemplate).render(params, function(err, res)  {
                if(err)
                    return callback(err);
                delete res.text;
                if(!res.html)
                    return callback(new Error("no html file in template"));
                let receivers = docs.map(x => x.email).join(', ');
                let options = Object.assign({}, mailOptions, {to: receivers}, res);
                return transporter.sendMail(options, callback);
            });
        });
    },

    sendTemplateTo: function(pathToTemplate, params, email, callback) {
        new EmailTemplate(pathToTemplate).render(params, function(err, res) {
            if(err)
                return callback(err);
            delete res.text;
            if(!res.html)
                return callback(new Error("no html file in template"));
            let options = Object.assign({}, mailOptions, {to: email}, res);
            return transporter.sendMail(options, callback);
        });
    },

    sendHtmlToAll: function(html, callback)  {
        User.find({}, 'email', function(err, docs) {
            if(err)
                return callback(err);
            if(!docs)
                return callback(null);
            let receivers = docs.map( x.email).join(', ');
            let options = Object.assign({}, mailOptions, {to: receivers, html: html});
            return transporter.sendMail(options, callback);
        });
    },

    sendHtmlTo: function (html, email, callback)  {
        let options = Object.assign({}, mailOptions, {to: email, html: html});
        return transporter.sendMail(options, callback);
    }
};
