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
    actualizarUsuario: function (criterio, usuario, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('usuarios');
                collection.findOneAndUpdate(criterio,usuario, function (err, result) {
                    if (result.ok!=1) {
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
    // Intersamos una apuesta a la base de datos
    insertarApuesta: function(apuesta, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function(err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('apuestas');
                collection.insertOne(apuesta, function(err, result) {
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
    // Intersamos una apuesta de un usuario a la base de datos
    insertarApuestaUsuario: function(apuesta, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function(err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('apuestas_usuarios');
                collection.insertOne(apuesta, function(err, result) {
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
    // Recuperamos las apuestas de la base de datos
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
        },
    // Modificamos una apuesta que se encuentre en la base
    modificarApuesta: function (criterio, apuesta, funcionCallback) {
    this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
        if (err) {
            funcionCallback(null);
        } else {
            let collection = db.collection('apuestas');
            collection.update(criterio, {$set: apuesta}, function (err, result) {
                if (err) {
                    funcionCallback(null);
                } else {
                    funcionCallback(result);
                }
                db.close();
            });
        }
    });

},
    // Borrar un usuario de la base
    borrarUsuario: function(criterio,funcionCallback){
    this.mongo.MongoClient.connect(this.app.get('db'),function (err,db){
        if(err){
            funcionCallback(null);
        }else{
            let collection=db.collection('usuarios');
            collection.remove(criterio, function (err, result) {
                if (err) {
                    funcionCallback(null);
                } else {
                    funcionCallback(result);
                }

                db.close();
            });
        }
    });
}
}