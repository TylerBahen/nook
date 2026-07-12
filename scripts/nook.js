socket = io()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

function load() {
  const token = localStorage.getItem('sessionToken')
  socket.emit('sessionStart',token,(success,message = null) => {
    if(!success){
      window.location.href = '/login'
    } else {
      //Do all the onload things...
    }
  })
}