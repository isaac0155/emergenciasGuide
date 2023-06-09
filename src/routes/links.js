var ret = (io)=>
{
    io.on("connection", (socket) => {
        socket.on('cliente:verifUser', async(user)=>{
            let existe = await pool.query('select COUNT(a.usuario) as user from persona a where a.usuario = ?', user)
            existe[0].user == 0 ? socket.emit('server:usuarioLibre') : socket.emit('server:usuarioUsado');
        });

        socket.on('cliente:verifNit', async(nit)=>{
            var existe = await pool.query('select COUNT(a.nit) as nit from nitcentro a where a.nit = ?', nit);
            //console.log(existe[0].nit, nit)
            if (existe[0].nit == 0){
                socket.emit('server:nitLibre');
            }else{
                socket.emit('server:nitUsado')
            }
        });
        socket.on('cliente:registrarNit', async(nit)=>{
            await pool.query('insert into nitcentro set ?', {nit:Number(nit)});
            var resul = await pool.query('select nitcentro.nit from nitcentro where nitcentro.nit = ?', nit);
            const nits = await pool.query('SELECT * FROM nitcentro ORDER BY idNit DESC'); 
            //console.log(resul[0].nit)
            socket.emit('server:nitRegistrado', resul[0].nit, nits);
        });
        socket.on('cliente:eliminarNit', async(nit)=>{
            await pool.query('DELETE FROM nitcentro WHERE idNit = ?', nit)
            const nits = await pool.query('SELECT * FROM nitcentro ORDER BY idNit DESC'); 
            socket.emit('server:nitRegistrado', null, nits);
        });
        socket.on('cliente:buscarNit', async(nit)=>{
            const nit1 = await pool.query('call verNit(?)', nit); 
            //console.log(nit1)
            socket.emit('server:nitEncontrado', nit1);
        });
    });

    //doce
    const express = require('express');
    const router = express.Router();
    
    const pool = require('../database');
    const { isLoggedIn } = require('../lib/auth')
    /* Sockets */

    const actualizarComunidad = async(id) =>{
        let links = await pool.query('SELECT a.*, b.fullname  FROM links a, users b WHERE a.publico = 1 and a.user_id = b.id and a.id = ?', id);
        io.sockets.emit("nuevoComunidad", links[0]);
    }

    /* Rutas del servidor */
    router.get('/add', isLoggedIn,(req, res)=>{
        res.render('links/add');
    });
    
    router.post('/add', isLoggedIn,async (req, res, next)=>{
        const { title, url, description } = req.body;
        const user_id = req.user.id;
        let publico = () =>{
            return req.body.publico == "on" ? true :  false;
        } 
        let idNewLink = await pool.query('select newLink(?,?,?,?,?);', [title, description, url, user_id, publico()]);
        idNewLink = obtenerValor(idNewLink);
        req.flash('success', title+' guardado correctamente.');
        res.redirect('/links/add');
        idNewLink != 'False' ? actualizarComunidad(idNewLink) : next;
    });
    function obtenerValor(objeto) 
    {
        objeto = JSON.parse(JSON.stringify(objeto[0]))
        return objeto[Object.getOwnPropertyNames(objeto)[0]]
    };

    router.get('/', async(req,res)=>{
        //const id = req.user.idPersona;
        //console.log(req.user)
        //const links = await pool.query('SELECT * FROM links WHERE user_id = ? ORDER BY created_at DESC', [id] ); 
        //res.render('links/list', { links })
    });
    router.get('/panel', isLoggedIn,async(req,res)=>{
        res.render('panel/index')
    });
    router.get('/panel/nit', isLoggedIn, async(req,res)=>{
        const nits = await pool.query('SELECT * FROM nitcentro ORDER BY idNit DESC'); 
        res.render('panel/nit', {nits})
    });
    router.get('/panel/centrosSalud', isLoggedIn, async(req,res)=>{
        const nits = await pool.query('SELECT a.nit, a.idNit FROM nitCentro a WHERE a.idNit NOT IN (SELECT b.idNit FROM centroSalud b) ORDER BY idNit DESC;'); 
        const registrado = await pool.query('select a.nit, b.* from nitCentro a, centroSalud b where a.idNit = b.idNit ;');
        res.render('panel/gestionarCentros', {nits, registrado})
    });
    router.get('/panel/centrosSalud/nuevo/:id', isLoggedIn, async(req,res)=>{
        const { id } = req.params;
        const nit = await pool.query('select * from nitCentro where idNit = ?;', Number(id));
        res.render('panel/nuevoCentro', {nit:nit[0]})
    });
    router.post('/panel/centrosSalud/nuevo/:id', isLoggedIn, async(req,res)=>{
        const { id } = req.params;
        const { nombre, propietario, contacto } = req.body;
        var newCentro = {
            nombreCentro:nombre,
            idNit:id,
            propietario,
            telefono:contacto
        }
        const nuevoCentro = await pool.query('insert into centrosalud set ?', [newCentro]);
        //nuevoCentro.id = nuevoCentro.insertId;
        //console.log(nuevoCentro.insertId);
        res.redirect('/links/panel/centrosSalud/detalle/' + nuevoCentro.insertId);
    });
    router.get('/panel/centrosSalud/detalle/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        //const nit = await pool.query('select * from nitCentro where idNit = ?;', Number(id));
        var centro = await pool.query('select a.*, b.nit from centrosalud a, nitcentro b where a.idCentroSalud = ? and a.idNit = b.idNit', id)
        var sucursales = await pool.query('select b.* from centroSalud a, sucursal b where a.idCentroSalud = b.idCentroSalud and a.idCentroSalud = ?;', id);
        //console.log(id, centro[0])
        res.render('panel/detalleCentro', { id, centro: centro[0], sucursales: sucursales[0]})
    });
    router.get('/panel/centrosSalud/sucursal/nuevo/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        res.render('panel/nuevaSucursal', {id})
    });
    
    /*router.get('/delete/:id', isLoggedIn,async(req, res)=>{
        const {id} = req.params;
        await pool.query('DELETE FROM links WHERE id = ?', [id]);
        req.flash('danger', 'Eliminado correctamente.');
        res.redirect('/links');
    });
    
    router.get('/edit/:id', isLoggedIn,async (req, res) => {
        const { id } = req.params;
        const links = await pool.query('SELECT * FROM links WHERE id = ?', [id])
        res.render('links/edit', {links: links[0]});
    });
    
    router.post('/edit/:id', isLoggedIn, async (req, res) => {
        const {id} = req.params;
        const { title, url, description} = req.body;
        let publico = false;
        if (req.body.publico == "on") {
            publico = true;
        }
        const newLink = {
            title,
            url,
            description,
            publico
        };
        await pool.query('UPDATE links set ? WHERE id = ?', [newLink, id]);
        req.flash('success', 'Modificado correctamente.');
        res.redirect('/links')
    });
    
    router.get('/community', isLoggedIn, async (req, res) => {
        const links = await pool.query('SELECT a.*, b.fullname FROM links a, users b WHERE a.publico = 1 and a.user_id = b.id ORDER BY a.created_at DESC');
        res.render('links/community/publico', { links })
    });*/
    
    return router
}    

module.exports = ret