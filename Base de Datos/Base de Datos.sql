create database emergenciasguide;
use emergenciasguide;
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
INSERT INTO emergenciasguide.persona (idPersona, nombres, apellidos, carnet, fechaNacimiento, usuario, contrasena, tipoSangre, alergias, preferencias) VALUES (8, 'Isaac Limbert', 'Herrera Mareño', 9342700, '1999-09-07 00:00:00', 'isaac', '$2a$10$VcZBNTd5ZWCiUEW5OuIR5ucHWDE5T.LAcjbEZ5.hdN87bm49frdU.', 'O+', 'Ninguno', 'Ninguno');
INSERT INTO emergenciasguide.persona (idPersona, nombres, apellidos, carnet, fechaNacimiento, usuario, contrasena, tipoSangre, alergias, preferencias) VALUES (9, 'Isaac', 'Herrera', 9342700, '1999-07-09 00:00:00', 'isaac0155', '$2a$10$wdi4SBkU/ecrM7c5V5jr6uo7sNsz14hLyyFQJGjssuw6ZMPyshPQ2', 'O+', 'Al polvo', 'Ninguno');

INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (100, '987654321');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (101, '234567890');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (102, '678901234');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (103, '456789012');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (104, '890123456');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (105, '123456789');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (106, '345678901');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (107, '789012345');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (108, '567890123');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (109, '901234567');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (110, '210987654');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (111, '543210987');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (112, '876543210');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (113, '109876543');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (114, '432109876');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (115, '765432109');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (116, '987012345');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (117, '654209876');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (118, '890457321');
INSERT INTO emergenciasguide.nitcentro (idNit, nit) VALUES (119, '123806754');
INSERT INTO emergenciasguide.centrosalud (idCentroSalud, nombreCentro, idNit, propietario, telefono) VALUES (3, 'Hospial de Vinto', 101, 'Dniel Quiroz', '4444444');
INSERT INTO emergenciasguide.sucursal (idSucursal, nombre, latitud, longitud, idHorario, idCentroSalud, detalleUbicacion, telefono1, telefono2, image, activo) VALUES (3, 'Sucursal Vinto Sud', '-17.39710998418343', '-66.3182907924056', 2, 3, 'JM3J+5M4, Quillacollo, Bolivia', '43234432', '4323443222', 'image-1686543361233-889988678edificio-del-hospital (1).png', 1);
INSERT INTO emergenciasguide.sucursal (idSucursal, nombre, latitud, longitud, idHorario, idCentroSalud, detalleUbicacion, telefono1, telefono2, image, activo) VALUES (7, 'ortopedia', '-17.393934556859538', '-66.30265847279966', null, 3, 'JM3W+PRV, RN 4, Quillacollo, Bolivia', '43234432', '4323443222', 'image-1686630808673-820908411background.jpg', null);


INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (1, 'Consultas médicas', 'Atención médica para diagnóstico y tratamiento.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (2, 'Servicio de urgencias', 'Atención médica inmediata para emergencias.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (3, 'Laboratorio clínico', 'Pruebas de laboratorio para diagnóstico y seguimiento.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (4, 'Servicio de radiología', 'Imágenes médicas para diagnóstico.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (5, 'Tomografía computarizada (TC)', 'Imágenes transversales detalladas del cuerpo.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (6, 'Resonancia magnética (RM)', 'Imágenes detalladas con imanes y ondas de radio.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (7, 'Mamografía', 'Radiografía de los senos para detectar cáncer de mama.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (8, 'Ecografía', 'Imágenes en tiempo real mediante ondas sonoras.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (9, 'Pruebas de embarazo', 'Detección de la hormona hCG para confirmar embarazo.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (10, 'Electrocardiograma (ECG)', 'Registro de actividad eléctrica del corazón.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (11, 'Vacunación', 'Administración de vacunas para la prevención de enfermedades infecciosas.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (12, 'Servicio de fisioterapia', 'Terapia física para rehabilitación y recuperación de lesiones y trastornos musculoesqueléticos.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (13, 'Servicio de rehabilitación', 'Programas y terapias para recuperación funcional después de lesiones o cirugías.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (14, 'Servicio de nutrición y dietética', 'Asesoramiento y planificación de dietas saludables para promover una buena nutrición y prevenir enfermedades.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (15, 'Servicio de psicología', 'Evaluación y tratamiento de problemas de salud mental y emocional.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (16, 'Servicio de farmacia', 'Dispensación de medicamentos y asesoramiento farmacéutico.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (17, 'Servicio de atención prenatal', 'Cuidado médico especializado durante el embarazo, incluyendo seguimiento prenatal y pruebas de rutina.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (18, 'Planificación familiar', 'Asesoramiento y métodos anticonceptivos para control de la fertilidad y planificación de embarazos.');
INSERT INTO emergenciasguide.servicio (idServicio, nombre, detalle) VALUES (19, 'Terapia ocupacional', 'Terapia para mejorar la independencia y la capacidad funcional en actividades diarias.');

INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (1, 'Medicina General', 'Se ocupa de la atención médica primaria, abarcando una amplia gama de condiciones médicas comunes y brindando atención integral a pacientes de todas las edades.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (2, 'Pediatría', 'Se especializa en la atención médica de los niños, desde el nacimiento hasta la adolescencia, abordando problemas de salud específicos de esta etapa de la vida.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (3, 'Ginecología', 'Se enfoca en la salud del sistema reproductivo femenino y el manejo de trastornos ginecológicos, incluyendo el cuidado del embarazo y el parto.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (4, 'Obstetricia', 'Se dedica al cuidado médico y quirúrgico de las mujeres durante el embarazo, el parto y el posparto, así como a la atención de trastornos relacionados con el sistema reproductivo femenino.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (5, 'Medicina Interna', 'Se concentra en el diagnóstico y tratamiento de enfermedades en adultos, ofreciendo una atención integral y abarcando una amplia gama de condiciones médicas.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (6, 'Cardiología', 'Se especializa en el diagnóstico y tratamiento de enfermedades relacionadas con el corazón y el sistema cardiovascular, incluyendo problemas de circulación y trastornos del ritmo cardíaco.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (7, 'Dermatología', 'Se ocupa de la salud de la piel, cabello y uñas, así como de trastornos cutáneos, diagnóstico y tratamiento de enfermedades de la piel, incluyendo afecciones inflamatorias, infecciosas y tumorales.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (8, 'Endocrinología', 'Se especializa en el diagnóstico y tratamiento de trastornos hormonales y metabólicos, incluyendo enfermedades de la glándula tiroides, diabetes, trastornos del equilibrio hormonal y enfermedades óseas.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (9, 'Gastroenterología', 'Se enfoca en el diagnóstico y tratamiento de enfermedades del sistema digestivo, incluyendo el esófago, estómago, intestino delgado, colon, hígado, vesícula biliar y páncreas.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (10, 'Neurología', 'Se dedica al diagnóstico y tratamiento de enfermedades del sistema nervioso central y periférico, incluyendo trastornos neurológicos, enfermedades cerebrovasculares y trastornos neurodegenerativos.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (11, 'Oftalmología', 'Se ocupa del diagnóstico y tratamiento de enfermedades y trastornos relacionados con los ojos y la visión.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (12, 'Otorrinolaringología', 'Se dedica al diagnóstico y tratamiento de enfermedades del oído, la nariz y la garganta, incluyendo trastornos auditivos, problemas respiratorios y trastornos del equilibrio.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (13, 'Psiquiatría', 'Se especializa en el diagnóstico y tratamiento de trastornos mentales, incluyendo trastornos del estado de ánimo, trastornos de ansiedad, esquizofrenia y trastornos de la conducta.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (14, 'Ortopedia', 'Se ocupa del diagnóstico y tratamiento de trastornos del sistema musculoesquelético, incluyendo lesiones óseas, articulares, musculares y de ligamentos.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (15, 'Urología', 'Se enfoca en el diagnóstico y tratamiento de enfermedades del sistema urinario en hombres y mujeres, así como en trastornos del sistema reproductor masculino.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (16, 'Radiología', 'Se especializa en el uso de técnicas de imagen, como radiografías, tomografías computarizadas y resonancias magnéticas, para el diagnóstico y seguimiento de enfermedades.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (17, 'Nefrología', 'Se dedica al diagnóstico y tratamiento de enfermedades del sistema renal, incluyendo enfermedad renal crónica, trastornos de los riñones y trastornos del equilibrio de líquidos y electrolitos.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (18, 'Neumología', 'Se ocupa del diagnóstico y tratamiento de enfermedades del sistema respiratorio, incluyendo trastornos pulmonares, asma, enfermedad pulmonar obstructiva crónica (EPOC) e infecciones respiratorias.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (19, 'Oncología', 'Se especializa en el diagnóstico y tratamiento de cánceres, incluyendo el uso de terapias como la quimioterapia, radioterapia y terapia dirigida.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (20, 'Hematología', 'Se dedica al diagnóstico y tratamiento de enfermedades relacionadas con la sangre y los trastornos de la coagulación, incluyendo anemia, leucemia y trastornos de las células sanguíneas.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (21, 'Infectología', 'Se dedica al diagnóstico y tratamiento de enfermedades infecciosas causadas por microorganismos como bacterias, virus, hongos y parásitos.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (22, 'Reumatología', 'Se especializa en el diagnóstico y tratamiento de enfermedades que afectan las articulaciones, los huesos, los músculos y los tejidos conectivos, como la artritis y el lupus.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (23, 'Medicina Física y Rehabilitación', 'Se ocupa de la recuperación funcional y rehabilitación de pacientes con discapacidades físicas, lesiones musculoesqueléticas y trastornos neurológicos.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (24, 'Geriatría', 'Se enfoca en el diagnóstico, tratamiento y atención de los problemas de salud y el bienestar de las personas mayores, incluyendo enfermedades crónicas y trastornos relacionados con el envejecimiento.');
INSERT INTO emergenciasguide.especialidad (idEspecialidad, nombre, detalle) VALUES (25, 'Medicina Deportiva', 'Se especializa en el diagnóstico, tratamiento y prevención de lesiones y enfermedades relacionadas con la actividad física y el deporte, así como en el manejo de la salud de los atletas.');

INSERT INTO emergenciasguide.especialidadsucursal (idEspecialidadSucursal, idEspecialidad, idSucursal) VALUES (1, 4, 3);
INSERT INTO emergenciasguide.especialidadsucursal (idEspecialidadSucursal, idEspecialidad, idSucursal) VALUES (2, 5, 3);
INSERT INTO emergenciasguide.especialidadsucursal (idEspecialidadSucursal, idEspecialidad, idSucursal) VALUES (3, 6, 3);
INSERT INTO emergenciasguide.especialidadsucursal (idEspecialidadSucursal, idEspecialidad, idSucursal) VALUES (5, 2, 3);
INSERT INTO emergenciasguide.especialidadsucursal (idEspecialidadSucursal, idEspecialidad, idSucursal) VALUES (6, 17, 3);
INSERT INTO emergenciasguide.serviciosucursal (idServicioSucursal, idServicio, idSucursal) VALUES (1, 1, 3);
INSERT INTO emergenciasguide.serviciosucursal (idServicioSucursal, idServicio, idSucursal) VALUES (2, 2, 3);
INSERT INTO emergenciasguide.serviciosucursal (idServicioSucursal, idServicio, idSucursal) VALUES (4, 18, 3);

INSERT INTO emergenciasguide.horario (idHorario, lunes, martes, miercoles, jueves, viernes, sabado, domingo, feriados) VALUES (2, '24h', '08:00 - 17:30', '24h', '24h', '24h', 'Cerrado', 'Cerrado', 'Cerrado');

INSERT INTO emergenciasguide.administradorcentro (idAdministradorCentro, idPersona, idSucursal) VALUES (17, 8, 3);
INSERT INTO emergenciasguide.administradorgeneral (idAdministradorGeneral, idPersona) VALUES (1, 9);
