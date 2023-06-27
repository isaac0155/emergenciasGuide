create database emergenciasguide;
use emergenciasguide;
create table cuidadoaire
(
    idCuidadoaire int auto_increment
        primary key,
    temperatura   text null,
    humedad       text null,
    calidadAire   text null,
    presion       text null,
    co2           text null,
    pm            text null,
    ventilador    text null,
    iluminacion   text null
);

create table energia
(
    idEnergia int auto_increment
        primary key,
    fecha     timestamp default current_timestamp() not null on update current_timestamp(),
    detalle   text                                  null
);

create table especialidad
(
    idEspecialidad int auto_increment
        primary key,
    nombre         text null,
    detalle        text null
);

create table horario
(
    idHorario int auto_increment
        primary key,
    lunes     text null,
    martes    text null,
    miercoles text null,
    jueves    text null,
    viernes   text null,
    sabado    text null,
    domingo   text null,
    feriados  text null
);

create table nitcentro
(
    idNit int auto_increment
        primary key,
    nit   text null
);

create table centrosalud
(
    idCentroSalud int auto_increment
        primary key,
    nombreCentro  text null,
    idNit         int  null,
    propietario   text null,
    telefono      text null,
    constraint nit1
        foreign key (idNit) references nitcentro (idNit)
);

create table persona
(
    idPersona       int auto_increment
        primary key,
    nombres         text                                  null,
    apellidos       text                                  null,
    carnet          int                                   null,
    fechaNacimiento timestamp default current_timestamp() not null,
    usuario         text                                  null,
    contrasena      text                                  null,
    tipoSangre      text                                  null,
    alergias        text                                  null,
    preferencias    text                                  null
);

create table administradorgeneral
(
    idAdministradorGeneral int auto_increment
        primary key,
    idPersona              int null,
    constraint adminGeneral
        foreign key (idPersona) references persona (idPersona)
);

create table paciente
(
    idPaciente int auto_increment
        primary key,
    idPersona  int null,
    constraint adminGeneral3
        foreign key (idPersona) references persona (idPersona)
);

create table servicio
(
    idServicio int auto_increment
        primary key,
    nombre     text null,
    detalle    text null
);

create table sessions
(
    session_id varchar(128) collate utf8mb4_bin not null
        primary key,
    expires    int(11) unsigned                 not null,
    data       mediumtext collate utf8mb4_bin   null
);

create table sucursal
(
    idSucursal       int auto_increment
        primary key,
    nombre           text       null,
    latitud          text       null,
    longitud         text       null,
    idHorario        int        null,
    idCentroSalud    int        null,
    detalleUbicacion text       null,
    telefono1        text       null,
    telefono2        text       null,
    image            text       null,
    activo           tinyint(1) null,
    constraint centro1
        foreign key (idCentroSalud) references centrosalud (idCentroSalud),
    constraint horario1
        foreign key (idHorario) references horario (idHorario)
);

create table administradorcentro
(
    idAdministradorCentro int auto_increment
        primary key,
    idPersona             int null,
    idSucursal            int null,
    constraint adminGeneral2
        foreign key (idPersona) references persona (idPersona),
    constraint suc2
        foreign key (idSucursal) references sucursal (idSucursal)
);

create table ambulancia
(
    idAmbulancia int auto_increment
        primary key,
    tipoVeiculo  text null,
    telefono     text null,
    idPersona    int  null,
    placa        text null,
    idSucursal   int  null,
    idHorario    int  null,
    disponible   int  null,
    constraint horario3
        foreign key (idHorario) references horario (idHorario),
    constraint persona4
        foreign key (idPersona) references persona (idPersona),
    constraint sucursal4
        foreign key (idSucursal) references sucursal (idSucursal)
);

create table emergencia
(
    idEmergencia int auto_increment
        primary key,
    latitud      text null,
    longitud     text null,
    idPaciente   int  null,
    idAmbulancia int  null,
    fechaHora    text null,
    constraint ambulancia1
        foreign key (idAmbulancia) references ambulancia (idAmbulancia),
    constraint paciente5
        foreign key (idPaciente) references paciente (idPaciente)
);

create table especialidadsucursal
(
    idEspecialidadSucursal int auto_increment
        primary key,
    idEspecialidad         int null,
    idSucursal             int null,
    constraint esp1
        foreign key (idEspecialidad) references especialidad (idEspecialidad),
    constraint suc1
        foreign key (idSucursal) references sucursal (idSucursal)
);

create table estadoemergencia
(
    idEstadoEmergencia int auto_increment
        primary key,
    estado             text null,
    fechaHora          text null,
    idEmergencia       int  null,
    latitud            text null,
    longitud           text null,
    constraint emergencia23
        foreign key (idEmergencia) references emergencia (idEmergencia)
);

create table serviciosucursal
(
    idServicioSucursal int auto_increment
        primary key,
    idServicio         int null,
    idSucursal         int null,
    constraint serv1
        foreign key (idServicio) references servicio (idServicio),
    constraint suc333
        foreign key (idSucursal) references sucursal (idSucursal)
);

create procedure verNit(IN nit text)
begin
    declare idnit1 text default (select nitCentro.idNit from nitCentro where nitCentro.nit = nit);
    declare centro int;
    declare idcen int;
    if(idnit1)then
        set centro = (select count(centroSalud.idCentroSalud) from centroSalud where idnit1 = centroSalud.idNit);
        if(centro = 0)then
            select * from nitCentro where nitCentro.nit = nit;
        else
            set idcen = (select a.idCentroSalud from centroSalud a where a.idNit = idnit1);
            select a.*, b.nit, (select count(a.idSucursal) from sucursal a, centroSalud b where b.idCentroSalud = idcen and a.idCentroSalud = b.idCentroSalud) as sucursales from centroSalud a, nitCentro b where b.nit = nit and a.idNit = b.idNit;
        end if;
    else
        select null as vacio;
    end if;
end;

create function verTipoUser(id int) returns text
begin
        declare tipoUser text;
        declare administrador int;
        declare pacient int;
        declare adminSucursal int;
        declare ambulance int;

        set administrador = (select count(administradorGeneral.idPersona) from administradorGeneral, persona where administradorGeneral.idPersona = persona.idPersona and persona.idPersona = id);
        set pacient = (select count(paciente.idPersona) from paciente, persona where paciente.idPersona = persona.idPersona and persona.idPersona = id);
        set adminSucursal = (select count(administradorCentro.idPersona) from administradorCentro, persona where administradorCentro.idPersona = persona.idPersona and persona.idPersona = id);
        set ambulance = (select count(*) from ambulancia where idPersona = 15);

        if(administrador > 0)then
            set tipoUser = 'Administrador General';
        end if;
        if(pacient > 0)then
            set tipoUser = 'Paciente';
        end if;
        if(adminSucursal > 0)then
            set tipoUser = 'Administrador de Sucursal';
        end if;
        if(ambulance > 0)then
            set tipoUser = 'Responsable de Ambulancia';
        end if;
        return tipoUser;
    end;

create procedure verUsuario(IN id int)
begin
        declare tipo text;
        declare usuario int;
        set usuario = (select count(persona.idPersona) from persona where persona.idPersona = id);
        if(usuario > 0)then
            set tipo = (select verTipoUser(id));
            if(tipo = 'Paciente')then
                select persona.alergias, persona.tipoSangre, persona.preferencias, persona.idPersona, persona.nombres, persona.apellidos, persona.carnet, persona.fechaNacimiento, persona.usuario, tipo as tipoUser, true as paciente from persona where persona.idPersona = id;
            end if;
            if(tipo = 'Administrador General')then
                select persona.alergias, persona.tipoSangre, persona.preferencias, persona.idPersona, persona.nombres, persona.apellidos, persona.carnet, persona.fechaNacimiento, persona.usuario, tipo as tipoUser, true as adminGeneral from persona where persona.idPersona = id;
            end if;
            if(tipo = 'Administrador de Sucursal')then
                select persona.alergias, persona.tipoSangre, persona.preferencias, persona.idPersona, persona.nombres, persona.apellidos, persona.carnet, persona.fechaNacimiento, persona.usuario, tipo as tipoUser, true as adminSucursal from persona where persona.idPersona = id;
            end if;
            if(tipo = 'Responsable de Ambulancia')then
                select persona.alergias, persona.tipoSangre, persona.preferencias, persona.idPersona, persona.nombres, persona.apellidos, persona.carnet, persona.fechaNacimiento, persona.usuario, tipo as tipoUser, true as respAmbulancia from persona where persona.idPersona = id;
            end if;
        end if;

        #return usuario;
    end;

