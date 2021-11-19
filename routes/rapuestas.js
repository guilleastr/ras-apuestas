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
        } else if (req.body.local < 2 || req.body.visit < 2) {
            res.redirect("/apuesta/agregar?mensaje=El nombre del equipo debe tener mas de 2 caracteres");
            return;
        }
        if (req.body.cuotalocal === "" || req.body.cuotalocal === null || req.body.cuotaempate === "" || req.body.cuotaempate === null || req.body.cuotavisitante === "" || req.body.cuotavisitante === null) {
            res.redirect("/apuesta/agregar?mensaje=Las cuotas no pueden ser vacías");
            return;
        }
        if (req.body.cuotalocal === "" || req.body.cuotalocal <= 0 || req.body.cuotaempate === "" || req.body.cuotaempate <= 0 || req.body.cuotavisitante === "" || req.body.cuotavisitante <= 0) {
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
                gestorBD.modificarApuesta(criterio, apuesta, function (result) {
                    if (result == null) {
                        res.send("Error al modificar la apuesta");
                    } else {
                        res.redirect("/apuesta/list");
                    }
                })

            }
        });
    });

    app.get("/apuesta/misapuestas", function (req, res) {
        let criterio = {usuario: gestorBD.mongo.ObjectId(req.session.usuario._id)}

        gestorBD.obtenerApuestasUsuario(criterio, function (apuestas_usuario) {
            if (apuestas_usuario == null) {

            } else {
                let list = []
                for (let i = 0; i < apuestas_usuario.length; i++) {
                    list.push(apuestas_usuario[i].id)
                }
                criterio = {"_id": {"$in": list}}
                gestorBD.obtenerApuestas(criterio, function (apuestas) {
                    if (apuestas == null) {

                    } else {
                        for (let i = 0; i < apuestas.length; i++) {
                            for (let j = 0; j < apuestas_usuario.length; j++) {
                                if (apuestas[i]._id.toString() == apuestas_usuario[i].id.toString()) {
                                    apuestas[i].apuesta_usuario = apuestas_usuario[i];

                                }
                            }
                        }


                        let respuesta = swig.renderFile('views/bapuestas_propias.html', {
                            usuarioSesion: req.session.usuario,
                            apuestas: apuestas
                        });
                        res.send(respuesta);
                    }
                })
            }

        })
    })
    app.get('/apuesta/apostar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        //FALTA POR HACER
        gestorBD.obtenerApuestas(criterio, function (apuestas) {
            if (apuestas == null || apuestas.length == 0 || apuestas[0].estado == "no disponible") {
                res.redirect("/apuesta/list?mensaje=La apuesta no existe o no está disponible")
            } else {
                let respuesta = swig.renderFile('views/bapuesta.html', {
                    usuarioSesion: req.session.usuario,
                    apuesta: apuestas[0]
                });
                res.send(respuesta);
            }
        })
    });

    app.post("/apuesta/apostar/:id", function (req, res) {
        var apuesta = {
            id: gestorBD.mongo.ObjectID(req.params.id),
            equipo: req.query.equipo,
            money: req.body.money,
            usuario: gestorBD.mongo.ObjectID(req.session.usuario._id),
            ganada: false,
            cobrada: false
        }

        var criterio = {_id: gestorBD.mongo.ObjectID(req.session.usuario._id)}

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {

            } else {

                let criterio_apuesta = {
                    _id: gestorBD.mongo.ObjectID(req.params.id)
                }
                gestorBD.obtenerApuestas(criterio_apuesta, function (apuestas) {
                    if (apuestas == null) {
                        res.redirect("/apuesta/apostar/" + req.params.id + "?mensaje=Error al realizar la apuesta")
                    } else {
                        if (apuestas.length == 0) {
                            res.redirect("/apuesta/apostar/" + req.params.id + "?mensaje=Error al realizar la apuesta")
                        } else {
                            let usuario = usuarios[0]
                            let user_money = Number(usuario.money)
                            let apuesta_money = Number(apuesta.money)
                            usuario.money = String(user_money - apuesta_money)


                            if (user_money > apuesta_money) {
                                if (apuesta.equipo == "visitante") {
                                    apuesta.cuota = apuestas[0].cuotavisitante
                                } else if (apuesta.equipo == "visitante") {
                                    apuesta.cuota = apuestas[0].cuotalocal
                                } else {
                                    apuesta.cuota = apuestas[0].cuotaempate
                                }
                                gestorBD.insertarApuestaUsuario(apuesta, function (apuesta) {
                                    if (apuesta == null) {
                                        res.redirect("/apuesta/apostar/" + req.params.id + "?mensaje=Error al realizar la apuesta")
                                    } else {


                                        gestorBD.actualizarUsuario(criterio, usuario, function (usuario) {

                                            res.redirect("/apuesta/misapuestas");

                                        })


                                    }
                                })
                            }

                        }
                    }
                })


            }
        })
    })

    app.get("/apuesta/cobrar/:id", function (req, res) {
        let criterio = {
            _id: gestorBD.mongo.ObjectID(req.params.id)
        }
        gestorBD.obtenerApuestasUsuario(criterio, function (apuestas_usuario) {
            if (apuestas_usuario == null) {

            } else if (apuestas_usuario.length > 1 || apuestas_usuario.length == 0) {
                res.redirect("/apuestas/misapuestas?mensaje=Error al cobrar la apuesta")
            } else {
                let usuario_id = gestorBD.mongo.ObjectId(req.session.usuario._id)
                if (apuestas_usuario[0].usuario.toString() === usuario_id.toString() && !apuestas_usuario[0].cobrada) {
                    criterio = {
                        _id:gestorBD.mongo.ObjectId(req.session.usuario._id)
                    }
                    let usuario = req.session.usuario
                    usuario.money = String(Number(usuario.money) + Number(apuestas_usuario[0].money)*Number(apuestas_usuario[0].cuota))
                    usuario._id=usuario_id
                    req.session.usuario = usuario

                    gestorBD.actualizarUsuario(criterio, usuario, function (usuario) {
                        let criterio = {
                            _id: apuestas_usuario[0]._id
                        }

                        let apuesta = apuestas_usuario[0]
                        apuesta.cobrada = true
                        gestorBD.actualizarApuestaUsuario(criterio, apuesta, function (apuesta) {

                            res.redirect("/apuesta/misapuestas?mensaje=Apuesta cobrada");
                        })

                    })
                } else {
                    res.redirect("/apuesta/misapuestas?mensaje=Esa apuesta ya ha sido cobrada");
                }
            }
        })
    })

    app.get("/apuestas/notificaciones", function (req, res) {

    })
}