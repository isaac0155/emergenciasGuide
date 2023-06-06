const input = document.getElementById('user');
const btn = document.querySelector('#btn');
const invalid = document.querySelector('#invalid')

input.addEventListener('input', () => {
    const value = input.value;
    if(value.length > 4){
        socket.emit('cliente:verifUser', value);
    }else{
        invalid.innerHTML = "Escoge un usuario de 5 o más caracteres.";
        input.className = 'form-control is-invalid';
        btn.disabled = true;
    }
});

socket.on('server:usuarioUsado', ()=>{
    invalid.innerHTML = "Este Usuario ya EXISTE, usa otro.";
    input.className = 'form-control is-invalid';
    btn.disabled = true;
});

socket.on('server:usuarioLibre', ()=>{
    input.className = 'form-control is-valid';
    btn.disabled = false;
});