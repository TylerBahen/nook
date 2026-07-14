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
var serviceAccount = process.env.CREDS
if (serviceAccount==undefined){
    serviceAccount = require("./creds.json");
} else {
    serviceAccount = JSON.parse(serviceAccount)
    console.log('Found CREDS in env')
}
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
            if(user.includes('>') || user.includes('<') || user.includes('&') || user.includes("'") || user.includes('"')){
                callback(false,`One or more invalid characters in username\n(<,>,&,',")`)
            } else {
                dbQuery(user).then(((data) => {
                    if (data==null){
                        db.collection('users').doc(user).set({
                            username:user,
                            password:hashPassword(pass),
                            network:{friends:[],requests:[],sents:[]},
                            messages:[{author:"Nook",content:"Welcome to Nook!"}]
                        }).then(() => {
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
        }
    })
    client.on('login',(user,pass,callback) => {
        if (typeof user != 'string' || typeof pass != 'string') {
            callback(false, 'Invalid input types.');
        } else {
            dbQuery(user).then(((data) => {
                if (data==null){
                    callback(false,'Your username and password either do not match, or do not exist.')
                } else {
                    if (verifyHashedPassword(pass,data.password)){
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
            callback(true,session)
            console.log(`User Authenticated : ${session}`)
            dbQuery(session).then(data => {
                client.emit('startpacket',{
                    messages:data.messages,
                    network:data.network
                })
            })
        } else {
            callback(false)
        }
    })
    client.on('friend',(action,target,token,callback) => {
        const user = tokenSession(token)
        if (user==null){
            callback(false,'User session expired, please refresh your page.')
        } else if (target==user){
            callback(false,'You cannot friend yourself.')
        } else if (target=='' || typeof target!='string'){
            callback(false,'Please enter a name.')
        } else {
            console.log(`${user} is sending a friend request to ${target}`)
            dbQuery(target).then((targetdata) => {
                dbQuery(user).then((userdata) => {
                    if (targetdata==null){
                        callback(false,'The specified user does not exist.')
                    } else {
                        if (action=='send'){
                            //"Let's just be friends," she said...
                            let friends = {...targetdata.network}
                            if(friends.requests.includes(user)){
                                callback(false,'You already sent them an invitation.')
                            } else if (friends.friends.includes(user)){
                                callback(false,'You are already freinds!')
                            } else {
                                friends.requests.push(user)
                                dbUpdate(target,{network:friends})
                                callback(true)
                            }
                        } else if (action=='accept'){
                            if (userdata.network.requests.includes(target)){
                                let targetfriends = {...targetdata.network}
                                let userfriends = {...userdata.network}
                                const tid = targetfriends.requests.indexOf(user)
                                const uid = userfriends.requests.indexOf(target)
                                if (tid!=-1) {targetfriends.requests.splice(tid,1)}
                                if (uid!=-1) {userfriends.requests.splice(uid,1)}
                                targetfriends.friends.unshift(user)
                                userfriends.friends.unshift(target)
                                dbUpdate(user,{network:userfriends})
                                dbUpdate(target,{network:targetfriends})
                                callback(true)
                            } else {
                                callback(false,'You cannot accept a request that was never extended.')
                            }
                        }
                    }
                })
            })
        }
    })
    client.on('post',(post,token,callback) => {
        const user = tokenSession(token)
        if (user==null){
            callback(false,'User session expired, please refresh your page.')
        } else {
            const message = {author:user,content:sanitize(post).replaceAll('\n','<br>')}
            console.log(message)
            dbQuery(user).then(userdata => {
                userdata.network.friends.forEach(friend => {
                    dbQuery(friend).then(frienddata => {
                        let inbox = frienddata.messages
                        inbox.unshift(message)
                        dbUpdate(friend,{messages:inbox})
                    })
                })
            })
            callback(true)
        }
    })
})

//Boot that john
server.listen(8889)
console.log('Server listening on 8889')
console.log('http://127.0.0.1:8889/')
console.log(new Date(Date.now()).toString())



//Database Handling
async function dbQuery(id) {
    const ref = db.collection('users').doc(id)
    const snap = await ref.get()

    if (!snap.exists) return null
    return { ...snap.data() }
}
async function dbUpdate(id,data){
    const out = await db.collection('users').doc(id).update(data)
    return out
}

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