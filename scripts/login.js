var socket = io()

function signup(event,form){
    event.preventDefault()
    const user = form.username.value
    const pass = form.password.value
    const pass2 = form.password2.value
    if (pass!=pass2){
        alert('Your passwords do not match. Please try again.')
    } else {
        socket.emit('register',user,pass,(success, message = null) => {
            if(success){
                alert('Registration Successful')
                window.location.href = '/nook'
            } else {
                alert(message)
            }
        })
    }
}

function login(event,form){
    event.preventDefault()
    const user = form.username.value
    const pass = form.password.value
    socket.emit('login',user,pass,(success,message = null)=>{
        if (success){
            alert('Login Succesful')
            window.location.href = '/nook'
        }
    })
}