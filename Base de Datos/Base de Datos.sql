create database emergenciasguide;
use emergenciasguide;
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
    nombre           text null,
    latitud          text null,
    longitud         text null,
    idHorario        int  null,
    idCentroSalud    int  null,
    detalleUbicacion text null,
    telefono1        text null,
    telefono2        text null,
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

create
    definer = root@localhost procedure verNit(IN nit text)
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

create
    definer = root@localhost function verTipoUser(id int) returns text
begin
        declare tipoUser text;
        declare administrador int;
        declare pacient int;
        declare adminSucursal int;
        set administrador = (select count(administradorGeneral.idPersona) from administradorGeneral, persona where administradorGeneral.idPersona = persona.idPersona and persona.idPersona = id);
        set pacient = (select count(paciente.idPersona) from paciente, persona where paciente.idPersona = persona.idPersona and persona.idPersona = id);
        set adminSucursal = (select count(administradorCentro.idPersona) from administradorCentro, persona where administradorCentro.idPersona = persona.idPersona and persona.idPersona = id);

        if(administrador > 0)then
            set tipoUser = 'Administrador General';
        end if;
        if(pacient > 0)then
            set tipoUser = 'Paciente';
        end if;
        if(adminSucursal > 0)then
            set tipoUser = 'Administrador de Sucursal';
        end if;
        return tipoUser;
    end;

create
    definer = root@localhost procedure verUsuario(IN id int)
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
        end if;

        #return usuario;
    end;
use emergenciasguide;
INSERT INTO nitcentro (idNit, nit) VALUES (100, '987654321');
INSERT INTO nitcentro (idNit, nit) VALUES (101, '234567890');
INSERT INTO nitcentro (idNit, nit) VALUES (102, '678901234');
INSERT INTO nitcentro (idNit, nit) VALUES (103, '456789012');
INSERT INTO nitcentro (idNit, nit) VALUES (104, '890123456');
INSERT INTO nitcentro (idNit, nit) VALUES (105, '123456789');
INSERT INTO nitcentro (idNit, nit) VALUES (106, '345678901');
INSERT INTO nitcentro (idNit, nit) VALUES (107, '789012345');
INSERT INTO nitcentro (idNit, nit) VALUES (108, '567890123');
INSERT INTO nitcentro (idNit, nit) VALUES (109, '901234567');
INSERT INTO nitcentro (idNit, nit) VALUES (110, '210987654');
INSERT INTO nitcentro (idNit, nit) VALUES (111, '543210987');
INSERT INTO nitcentro (idNit, nit) VALUES (112, '876543210');
INSERT INTO nitcentro (idNit, nit) VALUES (113, '109876543');
INSERT INTO nitcentro (idNit, nit) VALUES (114, '432109876');
INSERT INTO nitcentro (idNit, nit) VALUES (115, '765432109');
INSERT INTO nitcentro (idNit, nit) VALUES (116, '987012345');
INSERT INTO nitcentro (idNit, nit) VALUES (117, '654209876');
INSERT INTO nitcentro (idNit, nit) VALUES (118, '890457321');
INSERT INTO nitcentro (idNit, nit) VALUES (119, '123806754');


INSERT INTO persona (idPersona, nombres, apellidos, carnet, fechaNacimiento, usuario, contrasena, tipoSangre, alergias, preferencias) VALUES (8, 'Isaac Limbert', 'Herrera Mareño', 9342700, '1999-09-07 00:00:00', 'isaac', '$2a$10$VcZBNTd5ZWCiUEW5OuIR5ucHWDE5T.LAcjbEZ5.hdN87bm49frdU.', 'O+', 'Ninguno', 'Ninguno');
INSERT INTO persona (idPersona, nombres, apellidos, carnet, fechaNacimiento, usuario, contrasena, tipoSangre, alergias, preferencias) VALUES (9, 'Isaac', 'Herrera', 9342700, '1999-07-09 00:00:00', 'isaac0155', '$2a$10$wdi4SBkU/ecrM7c5V5jr6uo7sNsz14hLyyFQJGjssuw6ZMPyshPQ2', 'O+', 'Al polvo', 'Ninguno');

INSERT INTO administradorgeneral (idAdministradorGeneral, idPersona) VALUES (1, 9);
INSERT INTO centrosalud (idCentroSalud, nombreCentro, idNit, propietario, telefono) VALUES (3, 'Hospial de Vinto', 101, 'Dniel Quiroz', '4444444');
INSERT INTO paciente (idPaciente, idPersona) VALUES (2, 8);