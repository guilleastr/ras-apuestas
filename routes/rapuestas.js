module.exports = function (app, swig, gestorBD) {
    app.get('/apuesta/agregar', function (req, res) {
        let respuesta = swig.renderFile('views/bagregarapuesta.html', {
            usuarioSesion: req.session.usuario
        });
        res.send(respuesta);
    });


    // Agregar una nueva apuesta
    app.post("/apuesta/agregar", function (req, res) {
        //Comprobamos todos los posibles errores al agregar una apuesta
        if (req.session.usuario == null) {
            res.redirect("/identificarse");
            return;
        } else if (req.body.local < 2||req.body.visit < 2) {
            res.redirect("/apuesta/agregar?mensaje=El nombre del equipo debe tener mas de 2 caracteres");
            return;
        }
        if (req.body.cuotalocal === "" || req.body.cuotalocal === null||req.body.cuotaempate === "" || req.body.cuotaempate === null||req.body.cuotavisitante === "" || req.body.cuotavisitante === null) {
            res.redirect("/apuesta/agregar?mensaje=Las cuotas no pueden ser vacías");
            return;
        }
        if (req.body.cuotalocal === "" || req.body.cuotalocal <= 0||req.body.cuotaempate === "" || req.body.cuotaempate <= 0||req.body.cuotavisitante === "" || req.body.cuotavisitante <= 0) {
            res.redirect("/apuesta/agregar?mensaje=Compruebe el valor de las cuotas");
            return;
        }
        // En caso de que no haya errores procedemos a añadirla, guardando todos lo necesario
        let now = new Date();
        var apuesta = {
            local: req.body.local,
            visitante: req.body.visit,
            cuotalocal: req.body.cuotalocal,
            cuotavisitante: req.body.cuotavisit,
            cuotaempate: req.body.cuotaemp,
            tipodep: req.body.tipo,
            fecha: now.toDateString(),
            estado: 'disponible'
        }

        // Conectarse a la base de datos e insertarla
        gestorBD.insertarApuesta(apuesta, function (id) {
            if (id == null) {
                res.send("Error al insertar apuesta");
            } else {
                res.redirect("/apuesta/list");
            }
        });

    });


    /*
        Un usuario identificado con perfil de Usuario Estándar debe poder acceder a una lista en la que figuren
        todas sus ofertas. Para cada oferta se mostrará: texto descriptivo de la oferta, detalle de la oferta y
        cantidad solicitada en euros.
         */
    app.get("/apuesta/list", function (req, res) {
        let usuarioSesion = req.session.usuario;
        if (usuarioSesion == null) {
            res.redirect("/identificarse");
            return;
        } else {
            let criterio = null;
            gestorBD.obtenerApuestas(criterio, function (apuestas) {
                if (apuestas == null) {
                    res.send("Error al listar");
                } else {

                    let respuesta = swig.renderFile('views/blistarapuestas.html',
                        {
                            apuestas: apuestas,
                            usuarioSesion: usuarioSesion
                        });
                    res.send(respuesta);
                }
            });
        }
    });

    app.get('/apuesta/cerrar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerApuestas(criterio, function (apuestas) {
            if (apuestas == null) {
                res.send(respuesta);
            } else {
                var apuesta = {
                    local: apuestas[0].local,
                    visitante: apuestas[0].visitante,
                    cuotalocal: apuestas[0].cuotalocal,
                    cuotavisitante: apuestas[0].cuotavisitante,
                    cuotaempate: apuestas[0].cuotaempate,
                    tipodep: apuestas[0].tipodep,
                    fecha: apuestas[0].fecha,
                    estado: 'no disponible'
                }
                gestorBD.modificarApuesta(criterio, apuesta, function(result){
                    if (result == null){
                        res.send("Error al modificar la apuesta");
                    } else {
                        res.redirect("/apuesta/list");
                    }
                })

            }
        });
    });

    app.get('/apuesta/apostar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        //FALTA POR HACER
    });
}