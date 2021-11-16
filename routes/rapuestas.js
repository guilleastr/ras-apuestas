module.exports = function (app, swig, gestorDB) {
    /*
        Un usuario identificado con perfil de Usuario Estándar debe poder acceder a una lista en la que figuren
        todas sus ofertas. Para cada oferta se mostrará: texto descriptivo de la oferta, detalle de la oferta y
        cantidad solicitada en euros.
         */
    app.get("/apuestas/lista", function (req, res) {
        let usuarioSesion = req.session.usuario;
        if (usuarioSesion == null) {
            res.redirect("/identificarse");
            return;
        } else {
            let criterio = {autor: req.session.usuario.email};
            gestorDB.obtenerApuestas(criterio, function (apuestas) {
                if (apuestas == null) {
                    res.send("Error al listar");
                } else {
                    let respuesta = swig.renderFile('views/bapuestas.html',
                        {
                            apuestas: apuestas,
                            usuarioSesion: usuarioSesion
                        });
                    res.send(respuesta);
                }
            });
        }
    });
}