socket = io()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

function load() {
  socket.emit('sessionStart',sessionToken(),(success,message = null) => {
    if(!success){
      window.location.href = '/login'
    } else {
      document.getElementById('user-display-name').innerHTML = message
    }
  })
}

var messages = []
var network = {"friends":[],"requests":[]}
socket.on('startpacket',(packet) => {
  //Unpack that john
  messages = packet.messages
  network = packet.network
  renderPage()
})

function renderPage(){
  document.getElementById('messages-container').innerHTML = ''
  messages.forEach(message => {
    const tile = document.createElement('div')
    tile.classList.add('message-tile')
    tile.innerHTML = `
    <div class="message-avatar"></div>
    <div class="message-content">
      <strong>${message.author}</strong>
      <p>${message.content}</p>
    </div>`
    document.getElementById('messages-container').appendChild(tile)
  })
  document.getElementById('friends-list').innerHTML = ''
  network.friends.forEach(friend => {
    const tile = document.createElement('li')
    tile.classList.add('friend-item')
    tile.innerHTML = `
    <li class="friend-item">
      <div class="friend-avatar"></div>
      <span class="friend-name">${friend}</span>
    </li>`
    document.getElementById('friends-list').appendChild(tile)
  })
}

function friendRequest(username){
  socket.emit('friend','send',username,sessionToken(),(success,message = '') => {
    if(success){
      alert('Freind request sent!')
    } else {
      alert(message)
    }
  })
}

function acceptRequest(username){
  socket.emit('friend','accept',username,sessionToken(),(success,message = '') => {
    if (success){
      alert(`You are now friends with ${username}!`)
      window.location.href = window.location.href
    } else {
      alert(message)
    }
  })
}

function post(message){
  socket.emit('post',message,sessionToken(),(success,message = '') => {
    if (success){
      alert('Message posted!')
    } else {
      alert(message)
    }
  })
}


function sessionToken(){
  const token = localStorage.getItem('sessionToken')
  if (token==undefined){
    window.location.href = '/login'
    return null
  } else {
    return token
  }
}