/**
 * Created by NagarjunaYendluri on 4/11/16.
 */

'use strict';

var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    sessions = require( 'client-sessions' ),
    app = express(),
    _getAudio,
    _getImage,
    _startRoute;
var speakeasy = require('speakeasy');

// Set session information
app.use( sessions({
    cookieName: 'session',
    secret: 'someRandomSecret!',
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
}) );

// Enable CORS
app.use( function( req, res, next ) {
    res.header( 'Access-Control-Allow-Origin', '*' );
    next();
} );

// parse application/x-www-form-urlencoded
app.use( bodyParser.urlencoded({ extended: false }) );
// parse application/json
app.use( bodyParser.json() );

// Set public path
app.use( express.static( __dirname + '/public' ) );

// Define routes functions
// Fetches and streams an audio file
_getAudio = function( req, res, next ) {
    var visualCaptcha;

    // Default file type is mp3, but we need to support ogg as well
    if ( req.params.type !== 'ogg' ) {
        req.params.type = 'mp3';
    }

    // Initialize visualCaptcha
    visualCaptcha = require( 'visualcaptcha' )( req.session, req.query.namespace );

    visualCaptcha.streamAudio( res, req.params.type );
};

// Fetches and streams an image file
_getImage = function( req, res, next ) {
    var visualCaptcha,
        isRetina = false;

    // Initialize visualCaptcha
    visualCaptcha = require( 'visualcaptcha' )( req.session, req.query.namespace );

    // Default is non-retina
    if ( req.query.retina ) {
        isRetina = true;
    }

    visualCaptcha.streamImage( req.params.index, res, isRetina );
};

// Start and refresh captcha options
_startRoute = function( req, res, next ) {
    var visualCaptcha;

    // Initialize visualCaptcha
    visualCaptcha = require( 'visualcaptcha' )( req.session, req.query.namespace );

    visualCaptcha.generate( req.params.howmany );

    // We have to send the frontend data to use on POST.
    res.status( 200 ).send( visualCaptcha.getFrontendData() );
};

// Try to validate the captcha
// We need to make sure we generate new options after trying to validate, to avoid abuse
var validateCaptcha = function( req, formData ) {
    var visualCaptcha,
        frontendData,
        imageAnswer,
        audioAnswer;

    // Initialize visualCaptcha
    visualCaptcha = require( 'visualcaptcha' )( req.session, req.query.namespace );

    frontendData = visualCaptcha.getFrontendData();

    // It's not impossible this method is called before visualCaptcha is initialized, so we have to send a 404
    if ( typeof frontendData === 'undefined' ) {
        return 1;//noCaptcha

    } else {
        // If an image field name was submitted, try to validate it
        if ( ( imageAnswer = formData[ frontendData.imageFieldName ] ) ) {
            if ( visualCaptcha.validateImage( imageAnswer ) ) {
                return 0;//validImage

            } else {
                return 1;//failedImage

            }
        } else if ( ( audioAnswer = formData[ frontendData.audioFieldName ] ) ) {
            // We set lowercase to allow case-insensitivity, but it's actually optional
            if ( visualCaptcha.validateAudio( audioAnswer.toLowerCase() ) ) {
                return 0;//validAudio

            } else {
                return 1;//failedAudio

            }
        } else {
            return 1;//failedPost

        }
    }

};

var _trySubmission = function( req, res, next ){
    var captchaResult = validateCaptcha(req, req.body);

    if(captchaResult != 0){
        var result = {
            text: "Not Valid Captcha"
        }
        res.json(result);
    }

    res.json("valid captcha");


};

//variable that stores current session secret key- changes on page reload
var sessionSecret;
//function that generates QR code details
var generateQRcode = function(req,res){

    //generate secret key
    var secret = speakeasy.generateSecret({length: 20});

    //save the current secret in session variable
    sessionSecret = secret.base32;

    //build response object
    var totpData = {
        "otpauthurl":secret.otpauth_url
    }

    //return qr data
    res.json(totpData);
}

//function to verify if user key is valid TOTP
var verifyQrCode = function(base32secret,userKey){
    var verified = speakeasy.totp.verify({ secret: base32secret,
        encoding: 'base32',
        token: userKey });
    return verified;
}

//function that registers users
var _tryRegister = function(req, res, next){

    //validate user key
    var validKey = verifyQrCode(sessionSecret,req.body.userKey);

    if(validKey){
        res.json(0);
    }

    //if here not valid key
    var response = {
        text:"Authentication key is not valid"
    }
    res.json(response);
}

// Routes definition
app.post( '/login', _trySubmission );
app.post('/register', _tryRegister);
app.get('/getqrcode', generateQRcode);
// @param type is optional and defaults to 'mp3', but can also be 'ogg'
app.get( '/audio', _getAudio );
app.get( '/audio/:type', _getAudio );

// @param index is required, the index of the image you wish to get
app.get( '/image/:index', _getImage );

// @param howmany is required, the number of images to generate
app.get( '/start/:howmany', _startRoute );

module.exports = app;

// API Listening Port
app.listen( process.env.PORT || 8282 );
console.log("Server started at http://localhost:8282");