const passport = require('passport');
const { PORT } = require('../config');

var ret = (io) => {
    const express = require('express');
    const router = express.Router();
    const pool = require('../database');
    const { isLoggedIn } = require('../lib/auth')
    const { isAdminGen } = require('../lib/auth')
    const { isAdminSucur } = require('../lib/auth')
    const { isRespAmbulancia } = require('../lib/auth')
    const upload = require('../lib/storage')
//centrosalud
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
            var personas = await pool.query('select a.nombres, a.apellidos, a.carnet, a.usuario, a.idPersona, (select count(*) from administradorcentro f where f.idPersona = a.idPersona) as sucursales from persona a where a.usuario = ? and (select count(*) from administradorgeneral b where b.idPersona = a.idPersona) = 0 and (select count(*) from administradorcentro c where c.idPersona = a.idPersona and c.idSucursal = ?) = 0;', [usuario, sucursal]);
            socket.emit('server:buscarPersona', personas);
        });
        socket.on('cliente:buscarUser', async (usuario) => {
            var nombre = "%" + usuario + "%"
            // console.log(usuario);
            var per = await pool.query('select a.nombres, a.apellidos, a.carnet, a.usuario, a.idPersona from persona a where a.usuario LIKE ? and (select count(*) from paciente b where b.idPersona = a.idPersona) != 0;', [nombre]);
            // console.log(per);
            socket.emit('server:buscarUser', per);
        });
        socket.on('cliente:buscarCentro', async (centro) => {
            //console.log(centro);
            var nombre = "%"+centro+"%"
            var sucursales = await pool.query('SELECT a.idSucursal, a.nombre, a.detalleUbicacion, a.telefono1, b.nombreCentro FROM sucursal a, centrosalud b WHERE nombre LIKE ? and a.idCentroSalud = b.idCentroSalud;', [nombre]);
            //console.log(sucursales);
            socket.emit('server:buscarCentro', sucursales);
        });
        socket.on('cliente:newAdminSucursal', async (idPersona, idSucursal) => {
            await pool.query('insert into administradorcentro set idPersona = ?, idSucursal = ?;', [idPersona, idSucursal]);
            await pool.query('delete from paciente where idPersona = ?', idPersona);
            socket.emit('server:newAdminSucursal');
        });
        socket.on('cliente:eliminarAdminSucursal', async (idPersona, idSucursal) => {
            await pool.query('delete from administradorcentro where idSucursal = ? and idPersona = ?;', [idSucursal, idPersona]);
            var adminC = await pool.query('select count(*) as adminC from administradorcentro where idPersona = ?;', idPersona);
            if (adminC[0].adminC == 0) {
                await pool.query('insert into paciente set idPersona = ?;', idPersona)
            }
            socket.emit('server:eliminarAdminSucursal');
        });
        socket.on('cliente:eliminarHorario', async (idHorario, idSucursal) => {
            await pool.query('update sucursal set idHorario = null where idSucursal = ?;', idSucursal)
            await pool.query('delete from horario where idHorario = ? ;', idHorario);
            socket.emit('server:eliminarHorario');
        });
        socket.on('cliente:nuevaEspecialidad', async (idEspecialidad, idSucursal) => {
            await pool.query('insert into especialidadsucursal set ?;', { idEspecialidad, idSucursal });
            socket.emit('server:reload');
        });
        socket.on('cliente:eliminarEspecialidad', async (idEspecialidadSucursal) => {
            await pool.query('delete from especialidadsucursal where idEspecialidadSucursal = ?;', idEspecialidadSucursal);
            socket.emit('server:reload');
        });
        socket.on('cliente:nuevoServicio', async (idServicio, idSucursal) => {
            await pool.query('insert into serviciosucursal set ?;', { idServicio, idSucursal });
            socket.emit('server:reload');
        });
        socket.on('cliente:eliminarServicio', async (idServicioSucursal) => {
            await pool.query('delete from serviciosucursal where idServicioSucursal = ?;', idServicioSucursal);
            socket.emit('server:reload');
        });
        socket.on('cliente:buscarPersonaGen', async (user) => {
            var persona = await pool.query('select a.idPersona, a.nombres, a.apellidos, a.carnet, a.usuario from persona a where a.usuario = ? and (select count(*) from administradorGeneral b where a.idPersona = b.idPersona) = 0;', user);
            socket.emit('server:buscarPersonaGen', persona[0]);
        });
        socket.on('cliente:newAdminGeneral', async (idPersona) => {
            await pool.query('delete from paciente where idPersona = ?;', idPersona);
            await pool.query('delete from administradorcentro where idPersona = ?;', idPersona);
            await pool.query('INSERT INTO administradorgeneral (idPersona) VALUES (?)', idPersona);

            socket.emit('server:reload');
        });
        socket.on('cliente:eliminarAdminGeneral', async (idPersona) => {
            await pool.query('delete from administradorgeneral where idPersona = ?;', idPersona);
            await pool.query('insert into paciente set idPersona = ?', idPersona);
            var ci = await pool.query('select carnet from persona where idPersona = ?;', idPersona);
            socket.emit('server:reload');
        });
        socket.on('client:modif', async (item, value) => {
            if (item == 'ilum') {
                if (value) {
                    await pool.query('UPDATE cuidadoaire t SET t.iluminacion = "10" WHERE t.idCuidadoaire = 1');
                } else {
                    await pool.query('UPDATE cuidadoaire t SET t.iluminacion = "0" WHERE t.idCuidadoaire = 1');
                }
            }
            if (item == 'vent') {
                if (value) {
                    await pool.query('UPDATE cuidadoaire t SET t.ventilador = "10" WHERE t.idCuidadoaire = 1');
                } else {
                    await pool.query('UPDATE cuidadoaire t SET t.ventilador = "0" WHERE t.idCuidadoaire = 1');
                }
            }
        });
        socket.on('cliente:activarAmbulancia', async (idAmbulancia) => {
            await pool.query('update ambulancia set disponible = 1 where idAmbulancia = ?;', idAmbulancia);
            socket.emit('server:reload');
        });
        socket.on('cliente:desactivarAmbulancia', async (idAmbulancia) => {
            await pool.query('update ambulancia set disponible = null where idAmbulancia = ?;', idAmbulancia);
            socket.emit('server:reload');
        });


        //servidor de instrumentación electronica
        socket.on('client:calidadAire', async () => {
            var calidadAire = await pool.query('select * from cuidadoaire where idCuidadoaire = 1');
            socket.emit('server:calidadAire', calidadAire[0]);
        });
        //servidor de instrumentación electronica
    });

    /* Rutas del servidor */

    //Paginas Publicas
    //Paginas Publicas

    router.get('/directorio', async (req, res) => {
        var sucursales = await pool.query('select a.*, b.nombreCentro from sucursal a, centrosalud b where a.idCentroSalud = b.idCentroSalud and a.activo = 1;');
        res.render('links/index', { sucursales });
    });
    router.get('/directorio/sucursal/:id', async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.*, b.nombreCentro from sucursal a, centrosalud b where a.idCentroSalud = b.idCentroSalud and a.idSucursal = ?', Number(id))
        var horario = []
        if (sucursal[0].idHorario) {
            var idHorario = sucursal[0].idHorario;
            horario = await pool.query('select * from horario where idHorario = ?', idHorario)
        }
        var especialidades = await pool.query('select a.* from especialidad a, especialidadsucursal b  where a.idEspecialidad = b.idEspecialidad and b.idSucursal = ?;', Number(id))
        var servicios = await pool.query('select a.* from servicio a, serviciosucursal b  where a.idServicio = b.idServicio and b.idSucursal = ?;', Number(id))
        res.render('links/detalleSucursal', { sucursal: sucursal[0], horario: horario[0], especialidades, servicios })
    });
    
    //cualquier usuario que haya iniciado sesión
    router.get('/directorio/sucursal/3/emergencias', isLoggedIn, async (req, res) => {
        res.send(req.user)
    });
    

    //Paginas que sólo puede ver el Administrador General buscarPersona
    //Paginas que sólo puede ver el Administrador General

    router.get('/panel', isAdminGen, async (req, res) => {
        res.render('panel/index')
    });
    router.get('/panel/nit', isAdminGen, async (req, res) => {
        const nits = await pool.query('SELECT * FROM nitcentro ORDER BY idNit DESC');
        res.render('panel/nit', { nits })
    });
    router.get('/panel/centrosSalud', isAdminGen, async (req, res) => {
        const nits = await pool.query('SELECT a.nit, a.idNit FROM nitcentro a WHERE a.idNit NOT IN (SELECT b.idNit FROM centrosalud b) ORDER BY idNit DESC;');
        const registrado = await pool.query('select a.nit, b.*, (select count(*) from sucursal where sucursal.idCentroSalud = b.idCentroSalud) as sucursal from nitcentro a, centrosalud b where a.idNit = b.idNit ;');
        res.render('panel/gestionarCentros', { nits, registrado })
    });
    router.get('/panel/centrosSalud/nuevo/:id', isAdminGen, async (req, res) => {
        const { id } = req.params;
        const nit = await pool.query('select * from nitcentro where idNit = ?;', Number(id));
        res.render('panel/nuevoCentro', { nit: nit[0] })
    });
    router.post('/panel/centrosSalud/nuevo/:id', isAdminGen, async (req, res) => {
        const { id } = req.params;
        const { nombre, propietario, contacto } = req.body;
        var newCentro = {
            nombreCentro: nombre,
            idNit: id,
            propietario,
            telefono: contacto
        }
        const nuevoCentro = await pool.query('insert into centrosalud set ?', [newCentro]);
        req.flash('success', 'Registro exitoso de Centro de Salud: ' + nombre);
        res.redirect('/links/panel/centrosSalud/detalle/' + nuevoCentro.insertId);
    });
    router.get('/panel/centrosSalud/detalle/:id', isAdminGen, async (req, res) => {
        const { id } = req.params;
        var centro = await pool.query('select a.*, b.nit from centrosalud a, nitcentro b where a.idCentroSalud = ? and a.idNit = b.idNit', id)
        var sucursales = await pool.query('SELECT b.*, NULLIF((SELECT COUNT(c.idAdministradorCentro) FROM administradorcentro c WHERE c.idSucursal = b.idSucursal), 0) AS adminSucursal FROM centrosalud a, sucursal b WHERE a.idCentroSalud = b.idCentroSalud AND a.idCentroSalud = ?;', id);
        res.render('panel/detalleCentro', { id, centro: centro[0], sucursales: sucursales })
    });
    router.get('/panel/centrosSalud/sucursal/nuevo/:id', isAdminGen, async (req, res) => {
        const { id } = req.params;
        var centro = await pool.query('select * from centrosalud where idCentroSalud = ?', id);
        res.render('panel/nuevaSucursal', { id, centro: centro[0] })
    });
    router.post('/panel/centrosSalud/sucursal/nuevo/:id', upload.single('image'), isAdminGen, async (req, res) => {
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
        const sucursal = await pool.query('insert into sucursal set ?', [newSucursal]);
        req.flash('success', 'Registro exitoso de la Sucursal: ' + nombre);
        res.redirect('/links/panel/centrosSalud/detalle/sucursal/' + sucursal.insertId);
    });
    router.get('/panel/centrosSalud/detalle/sucursal/:id', isAdminGen, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.*, b.nombreCentro from sucursal a, centrosalud b where a.idCentroSalud = b.idCentroSalud and a.idSucursal = ?', Number(id))
        var admin = await pool.query('select a.idAdministradorCentro, b.* from administradorcentro a, persona b, sucursal c where c.idSucursal = ? and c.idSucursal = a.idSucursal and a.idPersona = b.idPersona;', Number(id));
        var horario = []
        if (sucursal[0].idHorario) {
            var idHorario = sucursal[0].idHorario;
            horario = await pool.query('select * from horario where idHorario = ?', idHorario)
        }
        var especialidades = await pool.query('select a.* from especialidad a, especialidadsucursal b  where a.idEspecialidad = b.idEspecialidad and b.idSucursal = ?;', Number(id))
        var servicios = await pool.query('select a.* from servicio a, serviciosucursal b  where a.idServicio = b.idServicio and b.idSucursal = ?;', Number(id))
        var ambulancias = await pool.query('select a.*, b.idPersona, b.nombres, b.apellidos, b.carnet, b.usuario, c.nombre from ambulancia a, persona b, sucursal c where a.idPersona = b.idPersona and a.idSucursal = c.idSucursal and a.idSucursal = ?;', id)
        res.render('panel/detalleSucursal', { sucursal: sucursal[0], admin, horario: horario[0], especialidades, servicios, ambulancias })
    });
    router.post('/panel/administradorEspecialidad', isAdminGen, async (req, res) => {
        const { nombre, detalle } = req.body
        var newEsp = {
            nombre,
            detalle
        }
        await pool.query('insert into especialidad set ?;', [newEsp]);
        req.flash('success', 'Especialidad ' + newEsp.nombre + ' Agregada correctamente.');
        res.redirect('/links/panel/administradorEspecialidad')
    });
    router.get('/panel/administradorEspecialidad', isAdminGen, async (req, res) => {
        var especialidades = await pool.query('select a.* from especialidad a ORDER BY a.nombre;')
        res.render('panel/administradorEspecialidad', { especialidades });
    });
    router.post('/panel/administradorServicio', isAdminGen, async (req, res) => {
        const { nombre, detalle } = req.body
        var newServ = {
            nombre,
            detalle
        }
        await pool.query('insert into servicio set ?;', [newServ]);
        req.flash('success', 'Servicio ' + newServ.nombre + ' Agregado correctamente.');
        res.redirect('/links/panel/administradorServicio')
    });
    router.get('/panel/administradorServicio', isAdminGen, async (req, res) => {
        var servicios = await pool.query('select a.* from servicio a ORDER BY a.nombre;')
        res.render('panel/administradorServicio', { servicios });
    });
    router.post('/panel/administradorGeneral/:id', isAdminGen, async (req, res) => {
        const { id } = req.params;
        const { nombre, detalle } = req.body
        var newEsp = {
            nombre,
            detalle
        }
        await pool.query('insert into especialidad set ?;', [newEsp]);
        req.flash('success', 'Servicio ' + newServ.nombre + ' Agregado correctamente.');
        res.redirect('panel/administradorGeneral/' + id)
    });
    router.get('/panel/administradorGeneral/:id', isAdminGen, async (req, res) => {
        const { id } = req.params;
        var administradores = await pool.query('select a.idPersona, a.nombres, a.apellidos, a.carnet, a.usuario from persona a, administradorGeneral b where a.idPersona = b.idPersona and a.idPersona != ?;', id);
        res.render('panel/administradorGeneral', { administradores });
    });
    router.get('/panel/ambulancias', isAdminGen, async (req, res) => {
        const nits = await pool.query('SELECT a.nit, a.idNit FROM nitcentro a WHERE a.idNit NOT IN (SELECT b.idNit FROM centrosalud b) ORDER BY idNit DESC;');
        const registrado = await pool.query('select a.*, b.nombres, b.apellidos, b.carnet, b.usuario, c.nombre from ambulancia a, persona b, sucursal c where a.idPersona = b.idPersona and a.idSucursal = c.idSucursal;');
        res.render('panel/gestionarAmbulancias', { nits, registrado })
    });
    router.get('/panel/ambulancias/detalle/:id', isAdminGen, async (req, res) => {
        const {id} = req.params;
        var ambulancia = await pool.query('select a.*, b.nombres, b.apellidos, b.carnet, b.usuario, c.nombre from ambulancia a, persona b, sucursal c where a.idPersona = b.idPersona and a.idSucursal = c.idSucursal and a.idAmbulancia = ?;', id)
        res.render('panel/verAmbulancias', { ambulancia:ambulancia[0] })
    });
    router.get('/panel/ambulancias/modificar/:id', isAdminGen, async (req, res) => {
        const {id} = req.params;
        var ambulancia = await pool.query('select a.*, b.nombres, b.apellidos, b.carnet, b.usuario, c.nombre from ambulancia a, persona b, sucursal c where a.idPersona = b.idPersona and a.idSucursal = c.idSucursal and a.idAmbulancia = ?;', id)
        res.render('panel/modificarAmbulancia', { ambulancia:ambulancia[0] })
    });
    router.post('/panel/ambulancias/modificar/:id', isAdminGen, async (req, res) => {
        const {id} =req.params;
        const { tipoVeiculo, telefono, placa, idPersona, idSucursal } = req.body
        var cambios = {
            tipoVeiculo,
            telefono,
            placa,
            idPersona,
            idSucursal
        }
        req.flash('success', 'Datos modificados correctamente')
        var camb = await pool.query('update ambulancia set ? where idAmbulancia = ?', [cambios, id])
        res.redirect('/links/panel/ambulancias/detalle/' + id)
    });
    router.get('/panel/ambulancias/nuevo', isAdminGen, async (req, res) => {
        res.render('panel/nuevaAmbulancia')
    });
    router.post('/panel/ambulancias/nuevo', isAdminGen, async (req, res) => {
        const { tipoVeiculo, telefono, placa, idPersona, idSucursal } = req.body
        var cambios = {
            tipoVeiculo,
            telefono,
            placa,
            idPersona,
            idSucursal
        }
        req.flash('success', 'Ambulancia Registrada correctamente')
        var camb = await pool.query('insert into ambulancia set ? ', [cambios])
        res.redirect('/links/panel/ambulancias/detalle/')
    });
    
    
    //paginas que puede ver el administrador de susursal y general (comparten ambos)
    //paginas que puede ver el administrador de susursal y general (comparten ambos)

    router.get('/panel/centrosSalud/sucursal/modificar/:id', isAdminSucur, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.*, b.nombreCentro from sucursal a, centrosalud b where a.idSucursal = ? and a.idCentroSalud = b.idCentroSalud', Number(id));
        res.render('panel/modificarSucursal', { sucursal: sucursal[0] })
    });
    router.post('/panel/centrosSalud/sucursal/modificar/:id', upload.single('image'), isAdminSucur, async (req, res) => {
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
        if (req.file) {
            newSucursal.image = req.file.filename;
        }
        await pool.query('update sucursal set ? where idSucursal = ?', [newSucursal, id]);;
        req.flash('success', 'Datos Modificados de la sucursal: ' + nombre);
        if (req.user.tipoUser == 'Administrador General') {
            res.redirect('/links/panel/centrosSalud/detalle/sucursal/' + id);
        } else {
            res.redirect('/links/panelAdminSuc/centrosSalud/detalle/sucursal/' + id);
        }
    });
    router.get('/panel/centrosSalud/sucursal/horario/nuevo/:id', isAdminSucur, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.*, b.nombreCentro from sucursal a, centrosalud b where a.idSucursal = ? and a.idCentroSalud = b.idCentroSalud', Number(id));
        res.render('panel/nuevoHorario', { sucursal: sucursal[0] })
    });
    router.post('/panel/centrosSalud/sucursal/horario/nuevo/:id', isAdminSucur, async (req, res) => {
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
        req.flash('success', 'Horario Agregado correctamente.');
        if (req.user.tipoUser == 'Administrador General') {
            res.redirect('/links/panel/centrosSalud/detalle/sucursal/' + id)
        } else {
            res.redirect('/links/panelAdminSuc/centrosSalud/detalle/sucursal/' + id)
        }
    });
    router.get('/panel/centrosSalud/sucursal/horario/modificar/:id', isAdminSucur, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.nombre, a.idSucursal, a.idHorario, b.nombreCentro from sucursal a, centrosalud b where a.idSucursal = ? and a.idCentroSalud = b.idCentroSalud', Number(id));
        var horario = await pool.query('select * from horario where idHorario = ?;', sucursal[0].idHorario)
        res.render('panel/modificarHorario', { sucursal: sucursal[0], horario: horario[0] })
    });
    router.post('/panel/centrosSalud/sucursal/horario/modificar/:id', isAdminSucur, async (req, res) => {
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
        await pool.query('update horario set ? where idHorario = ?', [horario, Number(req.body.idHorario)]);
        req.flash('success', 'Horario Modificado correctamente.');
        if (req.user.tipoUser == 'Administrador General') {
            res.redirect('/links/panel/centrosSalud/detalle/sucursal/' + id)
        } else {
            res.redirect('/links/panelAdminSuc/centrosSalud/detalle/sucursal/' + id)
        }
    });
    router.get('/panel/centrosSalud/sucursal/especialidad/gestionar/:id', isAdminSucur, async (req, res) => {
        const { id } = req.params;
        var idSucursal = Number(id)
        var sucursal = await pool.query('select a.nombre, a.idSucursal, b.nombreCentro from sucursal a, centrosalud b where a.idSucursal = ? and a.idCentroSalud = b.idCentroSalud', idSucursal);
        var especialidadesSucursal = await pool.query('select a.*, b.idEspecialidadSucursal from especialidad a, especialidadsucursal b  where a.idEspecialidad = b.idEspecialidad and b.idSucursal = ? ORDER BY b.idEspecialidadSucursal DESC;', idSucursal)
        var especialidades = await pool.query('select a.* from especialidad a where (select count(*) from especialidadsucursal b where b.idEspecialidad = a.idEspecialidad and b.idSucursal = ?) = 0 ORDER BY a.nombre;', idSucursal)
        res.render('panel/gestionarEspecilidadSucursal', { sucursal: sucursal[0], especialidadesSucursal, especialidades })
    });
    router.get('/panel/centrosSalud/sucursal/servicio/gestionar/:id', isAdminSucur, async (req, res) => {
        const { id } = req.params;
        var idSucursal = Number(id)
        var sucursal = await pool.query('select a.nombre, a.idSucursal, b.nombreCentro from sucursal a, centrosalud b where a.idSucursal = ? and a.idCentroSalud = b.idCentroSalud', idSucursal);
        var serviciosSucursal = await pool.query('select a.*, b.idServicioSucursal from servicio a, serviciosucursal b  where a.idServicio = b.idServicio and b.idSucursal = ? ORDER BY b.idServicioSucursal DESC;', idSucursal)
        var servicios = await pool.query('select a.* from servicio a where (select count(*) from serviciosucursal b where b.idServicio = a.idServicio and b.idSucursal = ?) = 0 ORDER BY a.nombre;', idSucursal)
        res.render('panel/gestionarServicioSucursal', { sucursal: sucursal[0], serviciosSucursal, servicios })
    });
    router.get('/panelAdminSuc', isAdminSucur, async (req, res) => {
        var sucursales = await pool.query('select * from sucursal a, administradorcentro b where a.idSucursal = b.idSucursal and b.idPersona = ?;', req.user.idPersona);
        //console.log(sucursales)
        res.render('panelAdminSucur/index', { sucursales })
    });
    router.get('/panelAdminSuc/centrosSalud/detalle/sucursal/:id', isAdminSucur, async (req, res) => {
        const { id } = req.params;
        var sucursal = await pool.query('select a.*, b.nombreCentro from sucursal a, centrosalud b where a.idCentroSalud = b.idCentroSalud and a.idSucursal = ?', Number(id))
        var horario = []
        if (sucursal[0].idHorario) {
            var idHorario = sucursal[0].idHorario;
            horario = await pool.query('select * from horario where idHorario = ?', idHorario)
        }
        var especialidades = await pool.query('select a.* from especialidad a, especialidadsucursal b  where a.idEspecialidad = b.idEspecialidad and b.idSucursal = ?;', Number(id))
        var servicios = await pool.query('select a.* from servicio a, serviciosucursal b  where a.idServicio = b.idServicio and b.idSucursal = ?;', Number(id))
        var ambulancias = await pool.query('select a.*, b.idPersona, b.nombres, b.apellidos, b.carnet, b.usuario, c.nombre from ambulancia a, persona b, sucursal c where a.idPersona = b.idPersona and a.idSucursal = c.idSucursal and a.idSucursal = ?;', id)
        res.render('panelAdminSucur/detalleSucursal', { sucursal: sucursal[0], horario: horario[0], especialidades, servicios, ambulancias })
    });
    router.get('/panelAdminSuc/ambulancias/detalle/:id', isAdminSucur, async (req, res) => {
        const { id } = req.params;
        var ambulancia = await pool.query('select a.*, b.nombres, b.apellidos, b.carnet, b.usuario, c.nombre from ambulancia a, persona b, sucursal c where a.idPersona = b.idPersona and a.idSucursal = c.idSucursal and a.idAmbulancia = ?;', id)
        res.render('panelAdminSucur/verAmbulancias', { ambulancia: ambulancia[0] })
    });
    
    //paginas que puede ver el responsable de ambulancia, administrador de susursal y general (comparten todos)
    //paginas que puede ver el responsable de ambulancia, administrador de susursal y general (comparten todos)
    router.get('/ambulancia/emergencias', isRespAmbulancia, async (req, res) => {
        var ambulancia = await pool.query('select a.*, c.nombre from ambulancia a, persona b, sucursal c where a.idPersona = b.idPersona and a.idSucursal = c.idSucursal and b.idPersona= ?;', [req.user.idPersona])
        res.render('ambulancia/index', { ambulancia: ambulancia[0] })
    });
    
    


    //servidor de instrumentación electronica
    //servidor de instrumentación electronica
    //servidor de instrumentación electronica
    //servidor de instrumentación electronica
    router.post('/calidadaire', async (req, res) => {
        const { temperatura, humedad, calidadAire, presion, co2, pm, ventilador, iluminacion } = req.body;
        var proy = {
            temperatura,
            humedad,
            calidadAire,
            presion,
            co2,
            pm
        }
        await pool.query('update cuidadoaire set ? where idCuidadoaire = 1;', [proy]);
        var estados = await pool.query('select ventilador, iluminacion from cuidadoaire where idCuidadoaire = 1;');
        var iluminacion1 = estados[0].iluminacion == "10" ? "Prendido" : "Apagado";
        var ventilador1 = estados[0].ventilador == "10" ? "Prendido" : "Apagado";;
        var respuesta = ventilador1 + ',' + iluminacion1;
        res.send(respuesta);
    });
    router.get('/calidadaire', async (req, res) => {
        res.render('universidad/iel/calidadaire');
    });

    //servidor de eficiencia energética
    //servidor de eficiencia energética
    //servidor de eficiencia energética
    //servidor de eficiencia energética
    router.get('/calcEficienciaEnergetica', async (req, res) => {
        res.render('universidad/een/index');
    });
    router.get('/calcEficienciaEnergetica/calculadora', async (req, res) => {
        res.render('universidad/een/calculadora');
    });
    router.get('/calcEficienciaEnergetica/eficienciailuminacion', async (req, res) => {
        res.render('universidad/een/eficienciailuminacion');
    });
    router.get('/calcEficienciaEnergetica/vertodo/', async (req, res) => {
        var todos = await pool.query('select * from energia')
        res.render('universidad/een/vertodos', { todos });
    });
    router.get('/calcEficienciaEnergetica/ver/:id', async (req, res) => {
        var eficiencia = await pool.query('select * from energia where idEnergia = ?;', req.params.id)

        const fecha = new Date(eficiencia[0].fecha);
        const dia = fecha.getDate();
        const mes = fecha.getMonth() + 1;
        const anio = fecha.getFullYear();
        const hora = fecha.getHours();
        const minutos = fecha.getMinutes();
        const diaFormateado = dia < 10 ? `0${dia}` : dia;
        const mesFormateado = mes < 10 ? `0${mes}` : mes;
        const horaFormateada = hora < 10 ? `0${hora}` : hora;
        const minutosFormateados = minutos < 10 ? `0${minutos}` : minutos;
        const fechaFormateada = `${diaFormateado}/${mesFormateado}/${anio} - ${horaFormateada}:${minutosFormateados}`;

        eficiencia[0].fecha = fechaFormateada;
        var resultado = JSON.parse(eficiencia[0].detalle);

        resultado.forEach((element, index) => {
            var datos = [element];
            datos.forEach((tipe, ind) => {
                tipe.detalle.forEach((data, indx) => {
                    //console.log(resultado[index].detalle[indx]);
                    var tipo_foco = resultado[index].detalle[indx].tipo_foco
                    var lumenes = resultado[index].detalle[indx].lumenes
                    var cantidad = resultado[index].detalle[indx].cantidad
                    var potencia = resultado[index].detalle[indx].potencia
                    var consumo_diario = resultado[index].detalle[indx].consumo_diario
                    var area_iluminada = resultado[index].detalle[indx].area_iluminada

                    if (tipo_foco != 'led') {
                        tipo_foco = 'Es recomendable usar iluminación LED'
                    } else {
                        tipo_foco = 'Ninguna Observación'
                    }
                    var lumenes1 = calcularLumenes(area_iluminada);
                    var lumenes2 = 'Para iluminar adecuadamente su ambiente de ' + area_iluminada + ' m2. se necesita un foco led de: ' + lumenes1[0].lumenes + ' Lm. y el foco de usted es de: ' + (lumenes * area_iluminada * cantidad);
                    var consumoActual = ((potencia / 1000) * (consumo_diario * 30)).toFixed(2);
                    var consumoEficiente = ((calcularPotenciaFoco(lumenes1[0].lumenes / area_iluminada) / 1000) * (consumo_diario * 30)).toFixed(2);

                    var observacion = {
                        tipo_foco,
                        lumenes2,
                        potenciaSugerida: 'La potencia Sugeriada es de ' + calcularPotenciaFoco(lumenes1[0].lumenes) / 15 + ' Watts.',
                        consumoActual,
                        consumoEficiente,
                        pagoAcutal: 'Usted paga ahora ' + consumoActual * 1.21 + ' Bs. Y con los cambios usted paga: ' + consumoEficiente * 1.21 + ' Bs.',
                        diferencia: 'Ahorro mensualmente ' + ((consumoActual * 1.21) - (consumoEficiente * 1.21)) + ' Bs. solo en iluminacion de este ambiente'
                    }
                    resultado[index].detalle[indx].observacion = observacion;
                });
            });
        });

        //res.send(resultado)
        res.render('universidad/een/ver', { eficiencia: eficiencia[0], resultado });
    });
    function calcularPotenciaFoco(lumenes) {
        // Eficiencia lumínica promedio de los focos LED
        const eficienciaLuminica = 100; // lm/W (valor promedio)

        // Cálculo de la potencia en vatios
        const potencia = lumenes / eficienciaLuminica;

        // Redondeo de la potencia a dos decimales
        const potenciaRedondeada = potencia.toFixed(2);

        return potenciaRedondeada
    }
    function calcularLumenes(metrosCuadrados) {
        const areas = [
            { iluminancia: 750 }
        ];

        const resultados = [];

        areas.forEach(area => {
            const lumenesNecesarios = area.iluminancia * metrosCuadrados;
            resultados.push({ lumenes: lumenesNecesarios });
        });

        return resultados;
    }
    router.post('/calcEficienciaEnergetica/eficienciailuminacion', async (req, res) => {

        //ordena los datos recibidos de body
        console.log(req.body);
        var newres = req.body;
        if (Array.isArray(newres['nombre_ambiente[]'])) {
            //console.log(true)
        } else {
            //console.log(false)
            newres['nombre_ambiente[]'] = [newres['nombre_ambiente[]']]
        }

        const datosRecibidos = newres;
        const resultadoFinal = {};

        for (const campo in datosRecibidos) {
            if (campo.includes('[]')) {
                const matches = campo.match(/(\w+)_(\d+)\[\]/);
                if (matches) {
                    const [, nombreCampo, indice] = matches;
                    const valores = Array.isArray(datosRecibidos[campo]) ? datosRecibidos[campo] : [datosRecibidos[campo]];
                    for (let i = 0; i < valores.length; i++) {
                        const valor = valores[i];
                        if (!resultadoFinal[indice]) {
                            resultadoFinal[indice] = {};
                        }
                        if (!resultadoFinal[indice][i]) {
                            resultadoFinal[indice][i] = {};
                        }
                        resultadoFinal[indice][i][nombreCampo] = valor;
                    }
                }
            }
        }

        const ambientes = datosRecibidos['nombre_ambiente[]'];
        //console.log(ambientes);
        const resultadoFinalOrdenado = {};

        for (let i = 0; i < ambientes.length; i++) {
            const ambiente = ambientes[i];
            resultadoFinalOrdenado[ambiente] = resultadoFinal[i];
        }
        //var resultado = JSON.stringify(resultadoFinalOrdenado, null, 2);

        //los datos recibidos se tratan para osarlos con hbs y guardar a la db
        var resultados = Object.entries(resultadoFinalOrdenado).map(([nombre, detalle]) => ({
            nombre,
            detalle: Object.values(detalle)
        }));
        resultados = JSON.stringify(resultados, null, 2);
        //console.log(resultados)
        var instr = await pool.query('INSERT INTO emergenciasguide.energia (fecha, detalle) VALUES (DEFAULT, ?)', resultados);
        res.redirect('/links/calcEficienciaEnergetica/ver/' + instr.insertId)
    });

    return router
}

module.exports = ret