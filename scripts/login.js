var socket = io()

function signup(event,form){
    event.preventDefault()
    const user = form.username.value
    const pass = form.password.value
    const pass2 = form.password2.value
    if (pass!=pass2){
        alert('Your passwords do not match.')
    } else {
        form.querySelector('button[type="submit"]').disabled = true
        socket.emit('register',user,pass,(success, message) => {
            if(success){
                alert('Registration Successful!\nWelcome to Nook')
                localStorage.setItem('sessionToken',message)
                window.location.href = '/nook'
            } else {
                alert(message)
                form.querySelector('button[type="submit"]').disabled = false
            }
        })
    }
}

function login(event,form){
    event.preventDefault()
    form.querySelector('button[type="submit"]').disabled = true
    const user = form.username.value
    const pass = form.password.value
    socket.emit('login',user,pass,(success,message)=>{
        if (success){
            localStorage.setItem('sessionToken',message)
            window.location.href = '/nook'
        } else {
            alert(message)
            form.querySelector('button[type="submit"]').disabled = false
        }
    })
}