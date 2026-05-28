//This Is The Server (Backend)

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const CryptoJS = require("crypto-js");
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');


//database init
var admin = require("firebase-admin");

var serviceAccount = require("./creds.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore()


//Serve Pages
app.get('/',function (req,res){
    res.sendFile(__dirname + '/pages/index.html')
})
app.get('/login',function (req,res){
    res.sendFile(__dirname + '/pages/login.html')
    console.log('User Logging In...')
})
app.get('/signup',function (req,res){
    res.sendFile(__dirname + '/pages/signup.html')
    console.log('User Signing Up...')
})
app.get('/nook',function (req,res){
    res.sendFile(__dirname + '/pages/nook.html')
})
//Serve Public Files
app.use('/scripts', express.static(__dirname + '/scripts'))
app.use('/styles', express.static(__dirname + '/styles'))
app.use('/images', express.static(__dirname + '/images'))
//Serve the PWA manifest and service worker
app.get('/manifest.json', function (req,res){
    res.type('application/manifest+json')
    res.sendFile(__dirname + '/manifest.json')
})
app.use('/service-worker.js', express.static(__dirname + '/service-worker.js'))



io.on('connection',function(client){
    client.emit('ioconnect')
    client.on('register',(user,pass,callback) => {
        db.collection('users').where('username','==',user).get().then(((matches) => {
            if (matches.empty){
                db.collection('users').add({username:user,password:pass}).then(() => {
                    callback(true)
                })
            } else {
                callback(false,'Your username is already taken')
            }
        }))
    })
    client.on('login',(user,pass,callback) => {
        console.log(user)
        console.log(pass)
        callback(true)
    })
})

server.listen(8889)
console.log('Server listening on 8889')
console.log('http://127.0.0.1:8889/')
console.log(new Date(Date.now()).toString())