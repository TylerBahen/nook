//This Is The Server (Backend)

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const CryptoJS = require("crypto-js");
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

app.get('/',function (req,res){
    res.sendFile(__dirname + '/pages/landing.html')
})
app.get('/login',function (req,res){
    res.sendFile(__dirname + '/pages/login.html')
})
app.get('/signup',function (req,res){
    res.sendFile(__dirname + '/pages/signup.html')
})
app.get('/nook',function (req,res){
    res.sendFile(__dirname + '/pages/nook.html')
})
app.use('/scripts', express.static(__dirname + '/scripts'))
app.use('/styles', express.static(__dirname + '/styles'))
app.use('/images', express.static(__dirname + '/images'))

io.on('connection',function(client){
    client.emit('ioconnect')
})

server.listen(8889)
console.log('Server listening on 8889')
console.log('http://127.0.0.1:8889/nook')
console.log(new Date(Date.now()).toString())