create database emergenciasguide;
use emergenciasguide;

create table nitCentro(
    idNit int auto_increment primary key,
    nit text
);
create table persona(
    idPersona int auto_increment primary key,
    nombres text,
    apellidos text,
    carnet int,
    fechaNacimiento timestamp default current_timestamp() not null,
    usuario text,
    contrasena text
);
create table administradorGeneral(
    idAdministradorGeneral int auto_increment primary key,
    idPersona int,
    constraint adminGeneral foreign key (idPersona) references  persona (idPersona)
);

create table especialidad(
    idEspecialidad int primary key auto_increment,
    nombre text,
    detalle text
);


create table horario(
    idHorario int auto_increment primary key ,
    lunes text,
    martes text,
    miercoles text,
    jueves text,
    viernes text,
    sabado text,
    domingo text,
    feriados text
);

create table centroSalud(
    idCentroSalud int auto_increment primary key ,
    nombreCentro text,
    idNit int,
    propietario text,
    constraint nit1 foreign key (idNit) references nitCentro(idNit)
);

create table sucursal(
    idSucursal int auto_increment primary key ,
    nombre text,
    latitud text,
    longitud text,
    idHorario int,
    constraint horario1 foreign key (idHorario) references horario(idHorario),
    idCentroSalud int,
    constraint centro1 foreign key (idCentroSalud) references centroSalud(idCentroSalud),
    detalleUbicacion text,
    telefono1 text,
    telefono2 text
);

create table especialidadSucursal(
    idEspecialidadSucursal int auto_increment primary key ,
    idEspecialidad int,
    constraint esp1 foreign key (idEspecialidad) references especialidad(idEspecialidad),
    idSucursal int,
    constraint suc1 foreign key (idSucursal)references sucursal(idSucursal)
);

create table administradorCentro(
    idAdministradorCentro int auto_increment primary key,
    idPersona int,
    idSucursal int,
    constraint adminGeneral2 foreign key (idPersona) references  persona (idPersona),
    constraint suc2 foreign key (idSucursal) references sucursal(idSucursal)
);
create table paciente(
    idPaciente int auto_increment primary key,
    tipoSangre text,
    alergias text,
    preferencias text,
    idPersona int,
    constraint adminGeneral3 foreign key (idPersona) references  persona (idPersona)
);
create table servicio(
    idServicio int auto_increment primary key ,
    nombre text,
    detalle text
);
create table servicioSucursal(
    idServicioSucursal int auto_increment primary key ,
    idServicio int,
    constraint serv1 foreign key (idServicio) references servicio(idServicio),
    idSucursal int,
    constraint suc333 foreign key (idSucursal) references sucursal(idSucursal)
);
create table ambulancia(
    idAmbulancia int primary key auto_increment,
    tipoVeiculo text,
    telefono text,
    idPersona int,
    constraint persona4 foreign key (idPersona) references persona(idPersona),
    placa text,
    idSucursal int,
    constraint sucursal4 foreign key (idSucursal)references sucursal(idSucursal),
    idHorario int,
    constraint horario3 foreign key (idHorario)references horario(idHorario)
);

create table emergencia(
    idEmergencia int auto_increment primary key ,
    latitud text,
    longitud text,
    idPaciente int,
    constraint paciente5 foreign key (idPaciente)references paciente(idPaciente),
    idAmbulancia int,
    constraint ambulancia1 foreign key (idAmbulancia)references ambulancia(idAmbulancia),
    fechaHora text
);

create table estadoEmergencia(
    idEstadoEmergencia int primary key auto_increment,
    estado text,
    fechaHora text,
    idEmergencia int,
    constraint emergencia23 foreign key (idEmergencia)references emergencia(idEmergencia),
    latitud text,
    longitud text
);

create function verTipoUser(id int) returns text
    begin
        declare tipoUser text;
        declare administrador int;
        declare pacient int;
        declare adminSucursal int;
        set administrador = (select count(administradorGeneral.idPersona) from administradorGeneral, persona where administradorGeneral.idPersona = persona.idPersona and persona.idPersona = id);
        set pacient = (select count(paciente.idPersona) from paciente, persona where paciente.idPersona = persona.idPersona and persona.idPersona = id);
        set adminSucursal = (select count(administradorCentro.idPersona) from administradorCentro, persona where administradorCentro.idPersona = persona.idPersona and persona.idPersona = id);

        if(administrador > 0)then
            set tipoUser = 'adminGeneral';
        end if;
        if(pacient > 0)then
            set tipoUser = 'paciente';
        end if;
        if(adminSucursal > 0)then
            set tipoUser = 'adminSucursal';
        end if;
        return tipoUser;
    end;

create procedure verUsuario(id int)
    begin
        declare tipo text;
        declare usuario int;
        set usuario = (select count(persona.idPersona) from persona where persona.idPersona = id);
        if(usuario > 0)then
            set tipo = (select verTipoUser(id));
            select persona.idPersona, persona.nombres, persona.apellidos, persona.carnet, persona.fechaNacimiento, persona.usuario, tipo as tipoUser from persona where persona.idPersona = id;
        end if;

        #return usuario;
    end;