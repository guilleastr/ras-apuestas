module.exports = function (app, swig, gestorBD) {
    app.get('/evento/agregar', function (req, res) {
        let respuesta = swig.renderFile('views/bagregarevento.html', {
            usuarioSesion: req.session.usuario
        });
        res.send(respuesta);
    });


    // Agregar una nueva apuesta
    app.post("/evento/agregar", function (req, res) {
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
        var evento = {
            local: req.body.local,
            visitante: req.body.visit,
            cuotalocal: req.body.cuotalocal,
            cuotavisitante: req.body.cuotavisit,
            cuotaempate: req.body.cuotaemp,
            tipodep: req.body.tipo,
            fecha: now.toDateString(),
            estado: 'abierta'
        }

        // Conectarse a la base de datos e insertarla
        gestorBD.insertarEvento(evento, function (id) {
            if (id == null) {
                res.send("Error al insertar evento");
            } else {
                res.redirect("/evento/list");
            }
        });

    });


    app.get("/evento/list", function (req, res) {
        let usuarioSesion = req.session.usuario;
        if (usuarioSesion == null) {
            res.redirect("/identificarse");
            return;
        } else {
            let criterio = null;
            gestorBD.obtenerEventos(criterio, function (apuestas) {
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

    app.get('/evento/cerrar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        //FALTA POR HACER
        gestorBD.obtenerEventos(criterio, function (apuestas) {
            if (apuestas == null || apuestas.length == 0 || apuestas[0].estado == "cerrada") {
                res.redirect("/evento/list?mensaje=La apuesta no existe o no está disponible")
            } else {
                let respuesta = swig.renderFile('views/bapuesta-admin.html', {
                    usuarioSesion: req.session.usuario,
                    apuesta: apuestas[0]
                });
                res.send(respuesta);
            }
        })
    });

    app.post("/evento/cerrar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        let ganador = req.query.equipo;
        gestorBD.obtenerEventos(criterio, function (apuestas) {
            if (apuestas == null) {
                res.send(respuesta);
            } else {
                var evento = {
                    local: apuestas[0].local,
                    visitante: apuestas[0].visitante,
                    cuotalocal: apuestas[0].cuotalocal,
                    cuotavisitante: apuestas[0].cuotavisitante,
                    cuotaempate: apuestas[0].cuotaempate,
                    tipodep: apuestas[0].tipodep,
                    fecha: apuestas[0].fecha,
                    estado: 'cerrada'
                }
                gestorBD.modificarEvento(criterio, evento, function (result) {
                    if (result == null) {
                        res.send("Error al modificar la apuesta");
                    } else {

                        let criterio_apuesta_update = {
                            evento: gestorBD.mongo.ObjectId(req.params.id),
                            equipo: ganador
                        }

                        let apuesta = {
                            "$set": {
                                ganada: true
                            }
                        }

                        gestorBD.actualizarApuestas(criterio_apuesta_update, apuesta, function (result) {
                            let criterio_apuesta = {
                                evento: gestorBD.mongo.ObjectId(req.params.id)
                            }

                            gestorBD.obtenerApuestas(criterio_apuesta, function (apuestas) {
                                if (apuestas == null) {
                                    res.redirect("/evento/list?mensaje=Error cerrando la apuesta")
                                } else {
                                    let list = []
                                    for (let i = 0; i < apuestas.length; i++) {
                                        let notificacion = {
                                            usuario: apuestas[i].usuario,
                                            evento: gestorBD.mongo.ObjectId(req.params.id)
                                        }

                                        list.push(notificacion)

                                    }

                                    gestorBD.insertarNotificacion(list, function (id) {
                                        if (id === null) {
                                            console.log("Error enviando notificación)")
                                        } else {
                                            res.redirect("/evento/list?mensaje=Apuesta cerrada");
                                        }
                                    })


                                }
                            })
                        })

                    }
                })

            }
        });
    })

    app.get("/apuesta/misapuestas", function (req, res) {
        let criterio = {usuario: gestorBD.mongo.ObjectId(req.session.usuario._id)}

        gestorBD.obtenerApuestas(criterio, function (apuestasVAR) {
            if (apuestasVAR == null) {

            } else {
                let apuestas = apuestasVAR
                let list = []
                for (let i = 0; i < apuestas.length; i++) {
                    list.push(apuestas[i].evento)
                }
                criterio = {"_id": {"$in": list}}
                gestorBD.obtenerEventos(criterio, function (eventos) {
                    if (eventos == null) {

                    } else {
                        let eventos_send=[];
                        let pointer=0;
                        let saved=  new Array(list.length).fill(false);
                        for (let i = 0; i < eventos.length; i++) {
                            for (let j = 0; j < list.length; j++) {
                                if (eventos[i]._id.toString() == apuestas[j].evento.toString()&&!saved[j]) {
                                    let clone=JSON.parse(JSON.stringify(eventos[i]))
                                    eventos_send.push(clone);
                                    eventos_send[pointer].apuesta=Object.assign({},apuestas[j]);
                                    pointer++;
                                    saved[j]=true;
                                    //eventos[i].apuesta = apuestas[i];

                                }
                            }
                        }


                        let respuesta = swig.renderFile('views/bapuestas_propias.html', {
                            usuarioSesion: req.session.usuario,
                            eventos: eventos_send
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
        let criterio_apuesta = {
            evento: gestorBD.mongo.ObjectId(req.params.id),
            usuario: gestorBD.mongo.ObjectId(req.session.usuario._id)
        }

        gestorBD.obtenerApuestas(criterio_apuesta, function (apuestas) {
            if (apuestas == null) {
                res.redirect("/evento/list?mensaje=La apuesta no existe o no está disponible")
            } else {
                /*if(apuestas.length>0){
                    res.redirect("/evento/list?mensaje=No se pueden realizar dos apuestas en el mismo evento")
                }else{*/
                gestorBD.obtenerEventos(criterio, function (apuestas) {
                    if (apuestas == null || apuestas.length == 0 || apuestas[0].estado == "cerrada") {
                        res.redirect("/evento/list?mensaje=La apuesta no existe o no está disponible")
                    } else {
                        let respuesta = swig.renderFile('views/bapuesta.html', {
                            usuarioSesion: req.session.usuario,
                            apuesta: apuestas[0]
                        });
                        res.send(respuesta);
                    }
                })
            }

        })

    });

    app.post("/apuesta/apostar/:id", function (req, res) {
        var apuesta = {
            evento: gestorBD.mongo.ObjectID(req.params.id),
            equipo: req.query.equipo,
            money: req.body.money,
            currency_value: req.body.currency_value,
            usuario: gestorBD.mongo.ObjectID(req.session.usuario._id),
            ganada: false,
            cobrada: false
        }

        var criterio = {_id: gestorBD.mongo.ObjectID(req.session.usuario._id)}

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {

            } else {
                let criterio_apuesta_verify = {
                    evento: gestorBD.mongo.ObjectId(req.params.id),
                    usuario: gestorBD.mongo.ObjectId(req.session.usuario._id)
                }


                gestorBD.obtenerApuestas(criterio_apuesta_verify, function (apuestas) {
                    if (apuestas == null) {
                        res.redirect("/evento/list?mensaje=La apuesta no existe o no está disponible")
                    } else {
                        let repeated = false;

                        for (let i = 0; i < apuestas.length; i++) {
                            if (apuestas[i].currency_value == apuesta.currency_value) {
                                repeated = true;
                            }
                        }

                        if (!repeated) {

                            let criterio_apuesta = {
                                _id: gestorBD.mongo.ObjectID(req.params.id)
                            }
                            gestorBD.obtenerEventos(criterio_apuesta, function (apuestas) {
                                if (apuestas == null) {
                                    res.redirect("/apuesta/apostar/" + req.params.id + "?mensaje=Error al realizar la apuesta")
                                } else {
                                    if (apuestas.length == 0) {
                                        res.redirect("/apuesta/apostar/" + req.params.id + "?mensaje=Error al realizar la apuesta")
                                    } else {
                                        let usuario = usuarios[0]
                                        let apuesta_currency = apuesta.currency_value

                                        let apuesta_money = Number(apuesta.money)

                                        let user_money = Number(usuario.money_dolar)
                                        if (apuesta_currency == "Dollars") {
                                            user_money = Number(usuario.money_dolar)

                                            usuario.money_dolar = String(user_money - apuesta_money)
                                            console.log("dollar")
                                        }
                                        if (apuesta_currency == "Euros") {
                                            user_money = Number(usuario.money)

                                            usuario.money = String(user_money - apuesta_money)
                                            console.log("euro")
                                        }
                                        if (apuesta_currency == "Pounds") {
                                            user_money = Number(usuario.money_libra)

                                            usuario.money_libra = String(user_money - apuesta_money)
                                            console.log("libra")
                                        }
                                        if (apuesta_currency == "Cardano") {
                                            user_money = Number(usuario.money_cripto)

                                            usuario.money_cripto = String(user_money - apuesta_money)
                                            console.log("cardano")
                                        }


                                        if (user_money >= apuesta_money) {
                                            if (apuesta.equipo == "visitante") {
                                                apuesta.cuota = apuestas[0].cuotavisitante
                                            } else if (apuesta.equipo == "visitante") {
                                                apuesta.cuota = apuestas[0].cuotalocal
                                            } else {
                                                apuesta.cuota = apuestas[0].cuotaempate
                                            }
                                            gestorBD.insertarApuesta(apuesta, function (apuesta) {
                                                if (apuesta == null) {
                                                    res.redirect("/apuesta/apostar/" + req.params.id + "?mensaje=Error al realizar la apuesta")
                                                } else {


                                                    gestorBD.actualizarUsuario(criterio, usuario, function (usuario) {

                                                        res.redirect("/apuesta/misapuestas?mensaje=Apuesta realizada");

                                                    })


                                                }
                                            })
                                        } else {
                                            res.redirect("/apuesta/apostar/" + req.params.id + "?mensaje=No tiene suficientes monedas de ese tipo")
                                        }

                                    }
                                }

                            })
                        }
                        else{
                            res.redirect("/evento/list?mensaje=No se pueden realizar dos apuestas en el mismo evento con la misma moneda")
                        }

                    }
                })
            }
        })

    });

    app.get("/apuesta/cobrar/:id", function (req, res) {
        let criterio = {
            _id: gestorBD.mongo.ObjectID(req.params.id)
        }
        gestorBD.obtenerApuestas(criterio, function (apuestas_usuario) {
            if (apuestas_usuario == null) {

            } else if (apuestas_usuario.length > 1 || apuestas_usuario.length == 0) {
                res.redirect("/apuesta/misapuestas?mensaje=Error al cobrar la apuesta")
            } else {
                let usuario_id = gestorBD.mongo.ObjectId(req.session.usuario._id)
                if (apuestas_usuario[0].usuario.toString() === usuario_id.toString() && !apuestas_usuario[0].cobrada) {
                    criterio = {
                        _id: gestorBD.mongo.ObjectId(req.session.usuario._id)
                    }
                    let usuario = req.session.usuario
                    let tipoMoneda = apuestas_usuario[0].currency_value
                    if (tipoMoneda == "Dollars") {
                        user_money = Number(usuario.money_cripto)

                        usuario.money_cripto = String(user_money - apuesta_money)
                        console.log("Dollars")
                    }
                    if (tipoMoneda == "Euros") {
                        usuario.money = String(Number(usuario.money) + Number(apuestas_usuario[0].money) * Number(apuestas_usuario[0].cuota))
                        console.log("Euros")
                    }
                    if (tipoMoneda == "Pounds") {
                        usuario.money_libra = String(Number(usuario.money_libra) + Number(apuestas_usuario[0].money) * Number(apuestas_usuario[0].cuota))
                    }
                    if (tipoMoneda == "Cardano") {
                        usuario.money_cripto = String(Number(usuario.money) + Number(apuestas_usuario[0].money) * Number(apuestas_usuario[0].cuota))
                        console.log("cardano")
                    }

                    usuario._id = usuario_id
                    req.session.usuario = usuario

                    gestorBD.actualizarUsuario(criterio, usuario, function (usuario) {
                        let criterio = {
                            _id: apuestas_usuario[0]._id
                        }

                        let apuesta = apuestas_usuario[0]
                        apuesta.cobrada = true
                        gestorBD.actualizarApuesta(criterio, apuesta, function (apuesta) {

                            res.redirect("/apuesta/misapuestas?mensaje=Apuesta cobrada");
                        })

                    })
                } else {
                    res.redirect("/apuesta/misapuestas?mensaje=Esa apuesta ya ha sido cobrada");
                }
            }
        })
    })

    app.get("/apuesta/ver/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerEventos(criterio, function (apuestas) {
            if (apuestas == null) {
                res.redirect("/evento/list?mensaje=La apuesta no existe o no está disponible")
            } else {
                let respuesta = swig.renderFile('views/bapuesta-view.html', {
                    usuarioSesion: req.session.usuario,
                    apuesta: apuestas[0]
                });
                res.send(respuesta);
            }
        })
    })

    app.get("/apuesta/notificaciones", function (req, res) {
        let criterio = {
            usuario: gestorBD.mongo.ObjectId(req.session.usuario._id)
        }

        gestorBD.obtenerNotificaciones(criterio, function (notificaciones) {
            if (notificaciones == null) {
                res.redirect("/evento/list?mensaje=error al leer las notificaciones")
            }
            let list = []
            for (let i = 0; i < notificaciones.length; i++) {
                list.push(notificaciones[i].evento)
            }

            criterio = {"_id": {"$in": list}}
            gestorBD.obtenerEventos(criterio, function (eventos) {
                if (eventos == null) {
                    res.redirect("/evento/list?mensaje=error al leer las notificaciones")
                } else {
                    let respuesta = swig.renderFile('views/bnotificaciones.html', {
                        usuarioSesion: req.session.usuario,
                        eventos: eventos
                    });
                    res.send(respuesta);
                }
            })


        })


    });

    app.get("/apuesta/buscar", function (req, res) {
        var criterio = {};
        if (req.query.busqueda != null) {
            criterio = {
                $or: [
                    {
                        tipodep: {
                            $regex: ".*" + req.query.busqueda + ".*", $options: 'i'
                        }
                    }
                ]
            };
        }
        gestorBD.obtenerEventos(criterio, function (apuestas) {
            if (apuestas == null) {
                res.send("Error al listar");
            } else {

                let respuesta = swig.renderFile('views/blistarapuestas.html',
                    {
                        apuestas: apuestas,
                        usuarioSesion: req.session.usuario,
                        busqueda: req.query.busqueda
                    });
                res.send(respuesta);
            }
        });
    })
}