const input = document.getElementById('user');
const input2 = document.getElementById('pass');
const input3 = document.getElementById('pass2');
const btn = document.querySelector('#btn');
const invalid = document.querySelector('#invalid');
const invalidPass = document.querySelector('#invalidPass');

function verifPass() {
    let x = document.getElementsByName("password")[0].value;
    let y = document.getElementsByName("passwordConfirm")[0].value;

    if (x.length > 7) {
        if (x == y) {
            invalidPass.innerHTML = "Las contraseñas coinciden.";
            input2.className = 'form-control is-valid';
            input3.className = 'form-control is-valid';
            btn.disabled = false;
        } else {
            invalidPass.innerHTML = "Las contraseñas NO coinciden.";
            input2.className = 'form-control is-invalid';
            input3.className = 'form-control is-invalid';
            btn.disabled = true;
        }
    } else {
        invalidPass.innerHTML = "La contraseña debe ser de 8 caracteres o más.";
        input2.className = 'form-control is-invalid';
        btn.disabled = true;
    }
};

input.addEventListener('input', () => {
    const value = input.value;
    if (value.length > 4) {
        socket.emit('cliente:verifUser', value);
    } else {
        invalid.innerHTML = "Escoge un usuario de 5 o más caracteres.";
        input.className = 'form-control is-invalid';
        btn.disabled = true;
    }
});

socket.on('server:usuarioUsado', () => {
    invalid.innerHTML = "Este Usuario ya EXISTE, usa otro.";
    input.className = 'form-control is-invalid';
    btn.disabled = true;
});

socket.on('server:usuarioLibre', () => {
    input.className = 'form-control is-valid';
    //btn.disabled = false;
});