const { PORT } = require('../config');

var ret = (io) => {
    const express = require('express');
    const router = express.Router();
    const pool = require('../database');
    const { isLoggedIn } = require('../lib/auth')
    const upload = require('../lib/storage')
    io.on("connection", (socket) => {
        socket.on('cliente:verifUser', async (user) => {
            let existe = await pool.query('select COUNT(a.usuario) as user from persona a where a.usuario = ?', user)
            existe[0].user == 0 ? socket.emit('server:usuarioLibre') : socket.emit('server:usuarioUsado');
        });

        socket.on('cliente:verifNit', async (nit) => {
            var existe = await pool.query('select COUNT(a.nit) as nit from nitcentro a where a.nit = ?', nit);
            if (existe[0].nit == 0) {
                socket.emit('server:nitLibre');
            } else {
                socket.emit('server:nitUsado')
            }
        });

        socket.on('cliente:registrarNit', async (nit) => {
            await pool.query('insert into nitcentro set ?', { nit: Number(nit) });
            var resul = await pool.query('select nitcentro.nit from nitcentro where nitcentro.nit = ?', nit);
            const nits = await pool.query('SELECT * FROM nitcentro ORDER BY idNit DESC');
            socket.emit('server:nitRegistrado', resul[0].nit, nits);
        });

        socket.on('cliente:eliminarNit', async (nit) => {
            await pool.query('DELETE FROM nitcentro WHERE idNit = ?', nit)
            const nits = await pool.query('SELECT * FROM nitcentro ORDER BY idNit DESC');
            socket.emit('server:nitRegistrado', null, nits);
        });

        socket.on('cliente:buscarNit', async (nit) => {
            const nit1 = await pool.query('call verNit(?)', nit);
            socket.emit('server:nitEncontrado', nit1);
        });
        
        socket.on('cliente:activarSucursal', async (id) => {
            await pool.query('update sucursal set activo = 1 where idSucursal = ?;', id);
            socket.emit('server:sucursalActivado', id);
        });

        socket.on('cliente:desactivarSucursal', async (id) => {
            await pool.query('update sucursal set activo = null where idSucursal = ?;', id);
            socket.emit('server:sucursalDesactivado', id);
        });
        
        socket.on('cliente:buscarPersona', async (usuario, sucursal) => {
            // console.log(sucursal, 'server');
            var personas = await pool.query('select a.nombres, a.apellidos, a.carnet, a.usuario, a.idPersona, (select count(*) from administradorcentro f where f.idPersona = a.idPersona) as sucursales from persona a where a.usuario = ? and (select count(*) from administradorgeneral b where b.idPersona = a.idPersona) = 0 and (select count(*) from administradorcentro c where c.idPersona = a.idPersona and c.idSucursal = ?) = 0;', [usuario, sucursal]);
            // console.log(personas, 'perosnas');
            socket.emit('server:buscarPersona', personas);
        });

        socket.on('cliente:newAdminSucursal', async (idPersona, idSucursal) => {
            //console.log(idPersona, idSucursal);
            await pool.query('insert into administradorcentro set idPersona = ?, idSucursal = ?;', [idPersona, idSucursal]);
            await pool.query('delete from paciente where idPersona = ?', idPersona);
            // console.log(personas, 'perosnas');
            socket.emit('server:newAdminSucursal');
        });

        socket.on('cliente:eliminarAdminSucursal', async (idPersona, idSucursal) => {
            //console.log(idPersona, idSucursal);
            await pool.query('delete from administradorcentro where idSucursal = ? and idPersona = ?;', [idSucursal, idPersona]);
            await pool.query('insert into paciente set idPersona = ?;', idPersona)
            // console.log(personas, 'perosnas');
            socket.emit('server:eliminarAdminSucursal');
        });

        socket.on('cliente:eliminarHorario', async (idHorario, idSucursal) => {
            //console.log(idPersona, idSucursal);
            await pool.query('update sucursal set idHorario = null where idSucursal = ?;', idSucursal)
            await pool.query('delete from horario where idHorario = ? ;', idHorario);
            // console.log(personas, 'perosnas');
            socket.emit('server:eliminarHorario');
        });
    });

    //doce
   
    /* Sockets */

    /*const actualizarComunidad = async (id) => {
        let links = await pool.query('SELECT a.*, b.fullname  FROM links a, users b WHERE a.publico = 1 and a.user_id = b.id and a.id = ?', id);
        io.sockets.emit("nuevoComunidad", links[0]);
    }*/

    /* Rutas del servidor */
    router.get('/add', isLoggedIn, (req, res) => {
        res.render('links/add');
    });

    /*router.post('/add', isLoggedIn, async (req, res, next) => {
        const { title, url, description } = req.body;
        const user_id = req.user.id;
        let publico = () => {
            return req.body.publico == "on" ? true : false;
        }
        let idNewLink = await pool.query('select newLink(?,?,?,?,?);', [title, description, url, user_id, publico()]);
        idNewLink = obtenerValor(idNewLink);
        req.flash('success', title + ' guardado correctamente.');
        res.redirect('/links/add');
        idNewLink != 'False' ? actualizarComunidad(idNewLink) : next;
    });
    function obtenerValor(objeto) {
        objeto = JSON.parse(JSON.stringify(objeto[0]))
        return objeto[Object.getOwnPropertyNames(objeto)[0]]
    };*/

    router.get('/', async (req, res) => {
        res.send('No hay pagina de Directorio');
    });
    router.get('/panel', isLoggedIn, async (req, res) => {
        res.render('panel/index')
    });
    router.get('/panel/nit', isLoggedIn, async (req, res) => {
        const nits = await pool.query('SELECT * FROM nitcentro ORDER BY idNit DESC');
        res.render('panel/nit', { nits })
    });
    router.get('/panel/centrosSalud', isLoggedIn, async (req, res) => {
        const nits = await pool.query('SELECT a.nit, a.idNit FROM nitCentro a WHERE a.idNit NOT IN (SELECT b.idNit FROM centroSalud b) ORDER BY idNit DESC;');
        const registrado = await pool.query('select a.nit, b.*, (select count(*) from sucursal where sucursal.idCentroSalud = b.idCentroSalud) as sucursal from nitCentro a, centroSalud b where a.idNit = b.idNit ;');
        res.render('panel/gestionarCentros', { nits, registrado })
    });
    router.get('/panel/centrosSalud/nuevo/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const nit = await pool.query('select * from nitCentro where idNit = ?;', Number(id));
        res.render('panel/nuevoCentro', { nit: nit[0] })
    });
    router.post('/panel/centrosSalud/nuevo/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const { nombre, propietario, contacto } = req.body;
        var newCentro = {
            nombreCentro: nombre,
            idNit: id,
            propietario,
            telefono: contacto
        }
        const nuevoCentro = await pool.query('insert into centrosalud set ?', [newCentro]);
        //nuevoCentro.id = nuevoCentro.insertId;
        //console.log(nuevoCentro.insertId);
        req.flash('success', 'Registro exitoso de Centro de Salud: ' + nombre);
        res.redirect('/links/panel/centrosSalud/detalle/' + nuevoCentro.insertId);
    });
    router.get('/panel/centrosSalud/detalle/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        //const nit = await pool.query('select * from nitCentro where idNit = ?;', Number(id));
        var centro = await pool.query('select a.*, b.nit from centrosalud a, nitcentro b where a.idCentroSalud = ? and a.idNit = b.idNit', id)
        var sucursales = await pool.query('SELECT b.*, NULLIF((SELECT COUNT(c.idAdministradorCentro) FROM administradorcentro c WHERE c.idSucursal = b.idSucursal), 0) AS adminSucursal FROM centroSalud a, sucursal b WHERE a.idCentroSalud = b.idCentroSalud AND a.idCentroSalud = ?;', id);
        //console.log(sucursales[0])
        res.render('panel/detalleCentro', { id, centro: centro[0], sucursales: sucursales })
    });
    router.get('/panel/centrosSalud/sucursal/nuevo/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        var centro = await pool.query('select * from centroSalud where idCentroSalud = ?', id);
        res.render('panel/nuevaSucursal', { id, centro: centro[0] })
    });
    router.post('/panel/centrosSalud/sucursal/nuevo/:id', upload.single('image'), isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const { nombre, latitud, longitud, detalle, telefono1, telefono2 } = req.body;
        var newSucursal = {
            nombre,
            latitud,
            longitud,
            idCentroSalud: id,
            detalleUbicacion: detalle,
            telefono1,
            telefono2,
            image: req.file.filename
        }
        //console.log('asdasdsad', req.file.filename)
        const sucursal = await pool.query('insert into sucursal set ?', [newSucursal]);
        req.flash('success', 'Registro exitoso de la Sucursal: ' + nombre);
        res.redirect('/links/panel/centrosSalud/detalle/sucursal/' + sucursal.insertId);
    });
    router.get('/panel/centrosSalud/detalle/sucursal/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.*, b.nombreCentro from sucursal a, centroSalud b where a.idCentroSalud = b.idCentroSalud and a.idSucursal = ?', Number(id))
        var admin = await pool.query('select a.idAdministradorCentro, b.* from administradorcentro a, persona b, sucursal c where c.idSucursal = ? and c.idSucursal = a.idSucursal and a.idPersona = b.idPersona;', Number(id));
        var horario = []
        if(sucursal[0].idHorario){
            var idHorario = sucursal[0].idHorario;
            horario = await pool.query('select * from horario where idHorario = ?', idHorario)
        }
        //console.log(horario[0])
        res.render('panel/detalleSucursal', {sucursal:sucursal[0], admin, horario:horario[0]})
    });
    
    router.get('/panel/centrosSalud/sucursal/modificar/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.*, b.nombreCentro from sucursal a, centroSalud b where a.idSucursal = ? and a.idCentroSalud = b.idCentroSalud', Number(id));
        //console.log(sucursal[0])
        res.render('panel/modificarSucursal', { sucursal: sucursal[0] })
    });
    
    router.post('/panel/centrosSalud/sucursal/modificar/:id', upload.single('image'), isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const { nombre, latitud, longitud, detalle, telefono1, telefono2, idCentroSalud } = req.body;
        var newSucursal = {
            nombre,
            latitud,
            longitud,
            idCentroSalud,
            detalleUbicacion: detalle,
            telefono1,
            telefono2
        }
        if(req.file){
            newSucursal.image = req.file.filename;
        }
        //console.log(newSucursal)
        await pool.query('update sucursal set ? where idSucursal = ?', [newSucursal, id]);;
        req.flash('success', 'Datos Modificados de la sucursal: ' + nombre);
        res.redirect('/links/panel/centrosSalud/detalle/sucursal/' + id);
    });

    router.get('/panel/centrosSalud/sucursal/horario/nuevo/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.*, b.nombreCentro from sucursal a, centroSalud b where a.idSucursal = ? and a.idCentroSalud = b.idCentroSalud', Number(id));
        //res.send(sucursal[0])
        res.render('panel/nuevoHorario', { sucursal: sucursal[0] })
    });
    router.post('/panel/centrosSalud/sucursal/horario/nuevo/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        var horario = {};

        for (var key in req.body) {
            var dia = key.split('-')[0];
            var action = key.split('-')[1];

            if (action == 'Abierto') {
                var abre = dia + '-Abre';
                var cierra = dia + '-Cierra';
                horario[dia] = req.body[abre] + ' - ' + req.body[cierra];
            } else if (action == 'Cerrado') {
                horario[dia] = action;
            } else if (action == '24') {
                horario[dia] = action + 'h';
            }
        }
        var programa = await pool.query('insert into horario set ?;', [horario]);
        var idHorario = { idHorario: programa.insertId }
        await pool.query('update sucursal set ? where idSucursal = ?', [idHorario, id])
        //console.log(horario)
        //res.send(horario)
        req.flash('success', 'Horario Agregado correctamente.');
        res.redirect('/links/panel/centrosSalud/detalle/sucursal/'+id)
    });

    router.get('/panel/centrosSalud/sucursal/horario/modificar/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.nombre, a.idSucursal, a.idHorario, b.nombreCentro from sucursal a, centroSalud b where a.idSucursal = ? and a.idCentroSalud = b.idCentroSalud', Number(id));
        var horario = await pool.query('select * from horario where idHorario = ?;', sucursal[0].idHorario)
        
        //res.send({ sucursal: sucursal[0], horario: horario[0] })
        res.render('panel/modificarHorario', {sucursal: sucursal[0], horario: horario[0]})
    });

    router.post('/panel/centrosSalud/sucursal/horario/modificar/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        var horario = {};

        for (var key in req.body) {
            var dia = key.split('-')[0];
            var action = key.split('-')[1];

            if (action == 'Abierto') {
                var abre = dia + '-Abre';
                var cierra = dia + '-Cierra';
                horario[dia] = req.body[abre] + ' - ' + req.body[cierra];
            } else if (action == 'Cerrado') {
                horario[dia] = action;
            } else if (action == '24') {
                horario[dia] = action + 'h';
            }
        }
        //console.log(horario, req.body.idHorario);
        await pool.query('update horario set ? where idHorario = ?', [horario, Number(req.body.idHorario)]);
        req.flash('success', 'Horario Modificado correctamente.');
        res.redirect('/links/panel/centrosSalud/detalle/sucursal/' + id)
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