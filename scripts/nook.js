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

socket.on('startpacket',(packet) => {
  //Unpack that john
  console.log(packet)
})

function friendRequest(username){
  socket.emit('friend','send',username,sessionToken(),(success,message = '') => {
    if(success){
      alert('Freind request sent!')
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