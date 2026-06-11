//This Is The Server (Backend)

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var CryptoJS = require('crypto-js');
var fetch = require('node-fetch');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto')


//database stuff
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


//Manage all the user's requests and whatnot
io.on('connection',function(client){
    client.emit('ioconnect')
    client.on('register',(user,pass,callback) => {
        if (typeof user != 'string' || typeof pass != 'string') {
            callback(false, 'Invalid input types.');
        } else {
            db.collection('users').where('username','==',user).get().then(((matches) => {
                if (matches.empty){
                    db.collection('users').add({username:user,password:hashPassword(pass)}).then(() => {
                        const token = newSessionToken(user)
                        callback(true,token)
                    })
                } else {
                    callback(false,'Your username is already taken')
                }
            })).catch((error) => {
                console.error("Database error:", error);
                callback(false, 'An error occurred during sign-in.')
            })
        }
    })
    client.on('login',(user,pass,callback) => {
        if (typeof user != 'string' || typeof pass != 'string') {
            callback(false, 'Invalid input types.');
        } else {
            db.collection('users').where('username','==',user).get().then(((matches) => {
                if (matches.empty){
                    callback(false,'Your username and password either do not match, or do not exist.')
                } else {
                    const doc = matches.docs[0].data()
                    if (verifyHashedPassword(pass,doc.password)){
                        const token = newSessionToken(user)
                        callback(true,token)
                    } else {
                        callback(false,'Your username and password either do not match, or do not exist.')
                    }
                }
            })).catch((error) => {
                console.error("Database error:", error);
                callback(false, 'An error occurred during sign-in.')
            })
        }
    })
    client.on('sessionStart',(token,callback) => {
        const session = tokenSession(token)
        if (session!=null){
            callback(true)
            console.log(`User Authenticated : ${session}`)
        } else {
            callback(false)
        }
    })
})

//Boot that john
server.listen(8889)
console.log('Server listening on 8889')
console.log('http://127.0.0.1:8889/')
console.log(new Date(Date.now()).toString())




//Session Handling
var sessions = {}
function newSessionToken(username){
    const token = crypto.randomUUID()
    sessions[token] = {
        user: username,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 5
    }
    return token
}
function tokenSession(token) {
    const session = sessions[token]
    if (!session) return null
    if (session.expires < Date.now()) {
        delete sessions[token]
        return null
    }
    return session.user
}
setInterval(() => {
    const now = Date.now()
    for (const token in sessions) {
        if (sessions[token].expires < now) {
            delete sessions[token]
        }
    }
}, 1000 * 60 * 10)


//AI generated wrappers and boilerplate I was too lazy to write myself
function sanitize(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    
    return `${salt}:${hash}`;
}

function verifyHashedPassword(inputPassword, storedPasswordRecord) {
    const [salt, originalHash] = storedPasswordRecord.split(':');
    const verifyHash = crypto.pbkdf2Sync(inputPassword, salt, 1000, 64, 'sha512').toString('hex');
    
    return originalHash === verifyHash;
}