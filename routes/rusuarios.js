module.exports = function (app, swig, gestorBD) {

    // Nos redirige a la vista para registrar un usuario
    app.get("/registrarse", function (req, res) {
        let respuesta = swig.renderFile('views/bregistro.html', {usuarioSesion: req.session.usuario});
        res.send(respuesta);
    });

    /*
    Los usuarios deben poder registrarse en la aplicación aportando email, nombre, apellidos y una
    contraseña (que deberá repetirse dos veces y coincidir entre sí).
    */
    app.post('/registrarse', function (req, res) {
        if (req.body.nombre.length < 2) {
            res.redirect("/registrarse?mensaje=El nombre debe tener mas de 2 caracteres");
            return;
        } else if (req.body.email === "" || req.body.email == null) {
            res.redirect("/registrarse?mensaje=El email no puede estar vacío");
            return;
        } else if (!req.body.email.includes("@")) {
            res.redirect("/registrarse?mensaje=El email debe contener @");
            return;
        } else if (req.body.password.length < 4) {
            res.redirect("/registrarse?mensaje=La contraseña debe tener 4 o más caracteres");
            return;
        } else if (req.body.password !== req.body.rpassword) {
            res.redirect("/registrarse?mensaje=Las contraseñas no coinciden.");
            return;
        } else {
            let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(req.body.password).digest('hex');
            let usuarioemail = {
                email: req.body.email
            }
            gestorBD.obtenerUsuarios(usuarioemail, function (usuarios) {
                if (usuarios != null && usuarios.length !== 0) {
                    res.redirect("/registrarse?mensaje=Este email ya está registrado. Intentelo de nuevo");
                } else {
                    let usuario = {
                        email: req.body.email,
                        nombre: req.body.nombre,
                        password: seguro,
                        rol: 'user',
                        money: req.body.money,
                        money_dolar: req.body.money_dolar,
                        money_libra: req.body.money_libra,
                        money_cripto: req.body.money_cripto
                    };
                    gestorBD.insertarUsuario(usuario, function (id) {

                        if (id == null) {
                            res.redirect("/registrarse?mensaje=Error al registrar al usuario");
                        } else {
                            req.session.usuario = usuario;
                            res.redirect("/evento/list");
                        }
                    });
                }
            })

        }
    });

    // Nos redirige a la vista para iniciar sesion un usuario
    app.get("/identificarse", function (req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html', {usuarioSesion: req.session.usuario});
        res.send(respuesta);
    });

    // Comprueba que los datos introducidos coincidan con un usario, sino lanzo error
    app.post("/identificarse", function (req, res) {
        if (req.body.email === "" || req.body.email == null) {
            res.redirect("/registrarse?mensaje=El email no puede estar vacío");
            return;
        } else if (!req.body.email.includes("@")) {
            res.redirect("/registrarse?mensaje=El email debe contener @");
            return;
        }
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email: req.body.email,
            password: seguro
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                // res.send("No identificado: ");
                res.redirect("/identificarse" +
                    "?mensaje=Email o password incorrecto" +
                    "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0];
                if (req.session.usuario.rol == "admin") {
                    res.redirect("/evento/list");
                } else {
                    res.redirect("/evento/list");

                }
            }
        });
    });

    // Nos desconecta de la sesion
    app.get('/desconectarse', function (req, res) {
        req.session.usuario = null;
        let respuesta = swig.renderFile('views/bidentificacion.html', {usuarioSesion: null});
        res.send(respuesta);
    });

    //metodo del admin que permite listar usuarios
    app.get('/usuario/list', function (req, res) {
        let usuarioSesion = req.session.usuario;
        if ( usuarioSesion === null || usuarioSesion.rol === 'user'){
            res.redirect("/identificarse?mensaje=Solo el administrador tiene acceso a esta zona")
        } else {
            let criterio = { rol: 'user' }
            gestorBD.obtenerUsuarios(criterio,function (usuarios) {
                if (usuarios==null){
                    res.redirect("/index?mensaje=Error al listar usuarios");
                } else {
                    let respuesta = swig.renderFile('views/blistadousuariosadmin.html', {
                        usuarios: usuarios,
                        usuarioSesion: usuarioSesion
                    });
                    res.send(respuesta);
                }

            })
        }

    });

    //metodo del admin que permite borrar usuarios
    app.post("/usuario/borrar", function (req,res){
        let idsUsuarios = req.body.checkbox;
        if (idsUsuarios === undefined){
            res.redirect("/usuario/list?mensaje=Los usuarios no se pudieron eliminar");
        } else {
            if (!Array.isArray(idsUsuarios)) {
                let aux = idsUsuarios;
                idsUsuarios = [];
                idsUsuarios.push(aux);
            }
            //borramos el usuario
            let criterio = {
                email: {$in: idsUsuarios}
            };
           gestorBD.borrarUsuario(criterio, function (usuarios){
                if (usuarios == null || usuarios.length === 0) {
                   res.redirect("/usuario/list" +
                       "?mensaje=Los usuarios no pudieron eliminarse");
                } else {
                    res.redirect("/usuario/list" +
                      "?mensaje=Los usuarios se eliminaron correctamente");
                 }
           })
        }
    });



    app.get("/monedero/:currency", function (req,res){
        let currency=req.params.currency;

        var criterio = {_id: gestorBD.mongo.ObjectID(req.session.usuario._id)};
        gestorBD.obtenerUsuarios(criterio,function (usuarios) {
            if (usuarios==null){
                res.redirect("/index?mensaje=Error al listar usuarios");
            } else {
                let usuario=usuarios[0]
                let current={
                };
                current.currency=currency;
                if(currency=="Euros"){
                    current.amount=usuario.money
                }
                else if(currency=="Dollars"){
                    current.amount=usuario.money_dolar
                }else if(currency=="Cardano"){
                    current.amount=usuario.money_cripto
                }else{
                    current.amount=usuario.money_libra
                }

                let respuesta = swig.renderFile('views/operate_currency.html', {
                    usuarioSesion: req.session.usuario,
                    current: current
                });
                res.send(respuesta);
            }
        })

    })
    app.post("/monedero/:currency", function (req,res){
        let currency=req.params.currency;
        let money= req.body.money;
        let currency_destin=req.body.currency_value;

        var criterio = {_id: gestorBD.mongo.ObjectID(req.session.usuario._id)};
        gestorBD.obtenerUsuarios(criterio,function (usuarios) {
            if (usuarios==null){
                res.redirect("/index?mensaje=Error al listar usuarios");
            } else {
                let usuario=usuarios[0]
                let current={
                };
                current.currency=currency;
                let factor=0;
                if(currency=="Euros"){
                   usuario.money=usuario.money-money;
                   if(currency_destin=="Dollars"){
                        factor=1.4;
                   }else if(currency_destin=="Cardano"){
                       factor=0.4;
                   }else{
                       factor=1.2;
                    }
                }
                else if(currency=="Dollars"){
                   usuario.money_dolar=usuario.money_dolar-money;
                    if(currency_destin=="Euros"){
                        factor=0.88;
                    }else if(currency_destin=="Cardano"){
                        factor=0.3;
                    }else{
                        factor=0.73;
                    }

                }else if(currency=="Cardano"){
                    usuario.money_cripto=usuario.money_cripto-money;
                    if(currency_destin=="Dollars"){
                        factor=4;

                    }else if(currency_destin=="Euros"){
                        factor=5;
                    }else{
                        factor= 4.5;
                    }

                }else{
                    usuario.money_libra=usuario.money_libra-money;
                    if(currency_destin=="Euros"){
                        factor =1,20
                    }else if(currency_destin=="Cardano"){
                        factor=0.35
                    }else if(currency_destin=="Dollars"){
                            factor=1.37
                    }
                }


                if(currency_destin=="Euros"){
                    usuario.money=usuario.money + money*factor;
                }
                else if(currency_destin=="Dollars"){
                    usuario.money_dolar=usuario.money_dolar +money*factor;

                }else if(currency_destin=="Cardano"){
                    usuario.money_cripto=usuario.money_cripto+ money*factor;
                }else{
                    usuario.money_libra=usuario.money_libra+ money*factor;
                }

                gestorBD.actualizarUsuario(criterio,usuario,function (){

                    res.redirect("/monedero")
                })


            }
        })

    })

    app.get("/monedero", function (req,res){
        var criterio = {_id: gestorBD.mongo.ObjectID(req.session.usuario._id)};
        gestorBD.obtenerUsuarios(criterio,function (usuarios) {
            if (usuarios==null){
                res.redirect("/index?mensaje=Error al listar usuarios");
            } else {
                let respuesta = swig.renderFile('views/monedero.html', {
                    usuarioSesion: req.session.usuario,
                    euro:usuarios[0]. money ,
                    dollar: usuarios[0].money_dolar,
                    cardano: usuarios[0].money_cripto,
                    pounds:usuarios[0].money_libra
                });
                res.send(respuesta);
            }
        })

    })

}