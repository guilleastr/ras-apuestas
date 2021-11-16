module.exports = {
    mongo: null,
    app: null,
    init: function (app, mongo) {
        this.mongo = mongo;
        this.app = app;
    },
    // Añadimos un nuevo usuario a la base
    insertarUsuario: function (usuario, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('usuarios');
                collection.insert(usuario, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result.ops[0]._id);
                    }
                    db.close();
                });
            }
        });
    },
    // Obtenemos los  usuarios que se encuentren en la base de datos
    obtenerUsuarios: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('usuarios');
                collection.find(criterio).toArray(function (err, usuarios) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(usuarios);
                    }
                    db.close();
                });
            }
        });
    },
    // Recuperamos las ofertas de la base de datos
    obtenerApuestas : function(criterio,funcionCallback){
            this.mongo.MongoClient.connect(this.app.get('db'), function(err, db) {
                if (err) {
                    funcionCallback(null);
                } else {
                    let collection = db.collection('apuestas');
                    collection.find(criterio).toArray(function(err, apuestas) {
                        if (err) {
                            funcionCallback(null);
                        } else {
                            funcionCallback(apuestas);
                        }
                        db.close();
                    });
                }
            });
        }
}