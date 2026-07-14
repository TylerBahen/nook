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
      <div class="friend-avatar"></div>
      <span class="friend-name">${friend}</span>`
    document.getElementById('friends-list').appendChild(tile)
  })
  if (network.requests.length>0){
    const heading = document.createElement('h3')
    heading.innerHTML = 'Friend Requests'
    document.getElementById('friends-section').appendChild(heading)
    const tile = document.createElement('ul')
    network.requests.forEach(request => {
      tile.innerHTML += `
      <li class="friend-item" onclick="acceptRequest('${request}')">
        <div class="friend-avatar"></div>
        <span class="friend-name">${request}</span>
      </li>`
    })
    document.getElementById('friends-section').appendChild(tile)
  }
}

function friendRequest(){
  const username = document.getElementById('friend-search').value
  socket.emit('friend','send',username,sessionToken(),(success,message = '') => {
    if(success){
      alert('Freind request sent!')
      document.getElementById('friend-search').value = ''
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

function post(){
  closepopup()
  const message = document.getElementById('postBody').value
  socket.emit('post',message,sessionToken(),(success,message = '') => {
    if (success){
      alert('Message posted!')
      document.getElementById('postBody').value = ''
    } else {
      alert(message)
    }
  })
}

function openpopup(){
  document.getElementById('postBox').style.visibility = 'visible'
  document.getElementById('blanket').style.visibility = 'visible'
}
function closepopup(){
  document.getElementById('postBox').style.visibility = 'hidden'
  document.getElementById('blanket').style.visibility = 'hidden'
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

function logout(){
  localStorage.setItem('sessionToken','')
  window.location.href = '/login'
}