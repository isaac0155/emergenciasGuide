module.exports ={

    isLoggedIn(req, res, next){
        if (req.isAuthenticated()){
            return next();
        }
        req.flash('warning', 'Inicia Sesión para ver la página');
        return res.redirect('/signin');
    },
    isNotLoggedIn(req, res, next){
        if (!req.isAuthenticated()){
            return next();
        }
        return res.redirect('/profile');
    },
    isAdminGen(req, res, next){
        if (req.isAuthenticated() && req.user.tipoUser == 'Administrador General'){
            return next();
        }
        req.flash('danger', 'No tienes permiso para ver la página. Inicia Sesión como Administrador General');
        return res.redirect('/profile');
    },
    isAdminSucur(req, res, next){
        if (req.isAuthenticated()){
            if (req.user.tipoUser == 'Administrador de Sucursal' || req.user.tipoUser == 'Administrador General'){
                return next();
            }
        }
        req.flash('danger', 'No tienes permiso para ver la página. Inicia Sesión como Administrador');
        return res.redirect('/profile');
    },
    isRespAmbulancia(req, res, next){
        if (req.isAuthenticated()){
            if (req.user.tipoUser == 'Administrador de Sucursal' || req.user.tipoUser == 'Administrador General' || req.user.tipoUser == 'Responsable de Ambulancia'){
                return next();
            }
        }
        req.flash('danger', 'No tienes permiso para ver la página.');
        return res.redirect('/profile');
    }

}