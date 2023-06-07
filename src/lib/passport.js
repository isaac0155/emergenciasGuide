const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('../lib/helpers');
const { route } = require('../routes');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
},async(req, username, password, done)=>{
    
    const rows = await pool.query('SELECT * FROM persona WHERE usuario = ?', [username]);
    if(rows.length>0){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.contrasena);
        if(validPassword){            
            done(null, user, req.flash('success', "Bienvenido" + user.usuario)) ;            
        }else{
            done(null, false, req.flash('danger','Datos Incorrectos'));
        }
    }else{
        return done(null, false, req.flash('danger','Datos Incorrectos'))
    }
}));

passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async(req, username, password, done)=>{
    const {nombres, apellidos, carnet, fechaNa, sangre, alergias, preferencias} = req.body;
    const newUser = {
        nombres, 
        apellidos, 
        carnet, 
        fechaNacimiento:fechaNa,
        usuario: username,
        contrasena: password,
    };
    const newPaciente = {
        tipoSangre:sangre, 
        alergias, 
        preferencias
    }
    newUser.contrasena = await helpers.encryptPassword(password);
    
    const resul = await pool.query('INSERT INTO persona SET ?', [newUser]);
    newUser.id = resul.insertId;
    newPaciente.idPersona = newUser.id;
    await pool.query('INSERT INTO paciente SET ?', [newPaciente]);
    //console.log(newUser.id)
    return done(null, newUser);
}));

passport.serializeUser((user, done)=>{
    done(null, user.idPersona);
});

passport.deserializeUser(async(id, done)=>{
    //const row = await pool.query('select a.*, COUNT(b.publico) as links from users a, links b where a.id = ? and a.id = b.user_id', [id]);
    const row = await pool.query('select a.*, b.* from persona a, paciente b where a.idPersona = ? and a.idPersona = b.idPersona', [id]);
    done(null, row[0]);
});