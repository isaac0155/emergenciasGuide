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
    
    const rows = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if(rows.length>0){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if(validPassword){            
            done(null, user, req.flash('success', "bienvenido" + user.username)) ;            
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
    const {fullname} = req.body;
    const newUser = {
        username,
        password,
        fullname
    };
    newUser.password = await helpers.encryptPassword(password);

    const resul = await pool.query('INSERT INTO users SET ?', [newUser]);
    newUser.id = resul.insertId;
    return done(null, newUser);
}));

passport.serializeUser((user, done)=>{
    done(null, user.id);
});

passport.deserializeUser(async(id, done)=>{
    const row = await pool.query('select a.*, COUNT(b.publico) as links from users a, links b where a.id = ? and a.id = b.user_id', [id]);
    done(null, row[0]);
});