module.exports = function (app, swig, gestorBD) {

    // Vamos a la vista de administrador
    app.get("/admin", function (req, res) {
        let respuesta = swig.renderFile('views/badmin.html', {
            usuarioSesion: req.session.usuario
        });
        res.send(respuesta);
    });

    // Solamente el admin tendra acceso a resetear
    app.get("/resetdb", function (req, res) {
        let usuarioSesion = req.session.usuario;
        if ( usuarioSesion === null || usuarioSesion.rol === 'user'){
            res.redirect("/identificarse?mensaje=Solo el administrador tiene acceso a esta zona")
        } else {
            gestorBD.resetDB(function (result) {
                if (result == null) {
                    res.redirect("/identificarse?mensaje=Error al resetear las colecciones&tipoMensaje=alert-danger");
                } else {
                    addAdmin(res);
                }
            });
        }

    });

    function addAdmin(res) {
        let seguro = app.get("crypto").createHmac('sha256',
            app.get('clave')).update('admin').digest('hex');
        let cri = {email: 'admin@email.com'};
        gestorBD.obtenerUsuarios(cri, function (usuarios) {
            if (usuarios != null && usuarios.length !== 0) {
                res.redirect("/identificarse?mensaje=Admin ya existe" + "&tipoMensaje=alert-danger ");
            } else {
                let admin = {
                    nombre: 'admin',
                    apellidos: 'admin',
                    email: 'admin@email.com',
                    password: seguro,
                    rol: 'admin',
                    money: 100.0
                };
                gestorBD.insertarUsuario(admin, function (id) {
                    if (id == null) {
                        res.redirect("/identificarse?mensaje=Error al insertar admin en reset&tipoMensaje=alert-danger");
                    } else {
                        createData(res);
                    }
                })
            }
        })
    }

};