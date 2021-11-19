//Módulos
let express = require('express');
let app = express();

let rest = require('request');
app.set('rest', rest);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    // Debemos especificar todas las headers que se aceptan. Content-Type , token
    next();
});

let jwt = require('jsonwebtoken');
app.set('jwt', jwt);

let fs = require('fs');
let https = require('https');

let crypto = require('crypto'); //contraseña

let expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

let mongo = require('mongodb');
let swig = require('swig');
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app, mongo);

// routerUsuarioSession
var routerUsuarioSession = express.Router();

routerUsuarioSession.use(function (req, res, next) {

    if (req.session.usuario) {
        let criterio = {
            _id: gestorBD.mongo.ObjectId(req.session.usuario._id)
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                console.log("fatal error")
            } else {
                req.session.usuario = usuarios[0]
                req.session.usuario._id = req.session.usuario._id.toString()
                next();
            }

        })

    } else {
        res.redirect("/identificarse");
    }
});

//routerUsuarioAdmin
let routerUsuarioAdmin = express.Router();

routerUsuarioAdmin.use(function (req, res, next) {
    if (req.session.usuario !== undefined && req.session.usuario.rol === 'admin') {
        // dejamos correr la petición
        next();
    } else {
        res.redirect("/index");
    }
});

//Aplicar routerUsuarioSession

app.use("/apuesta/*", routerUsuarioSession);
app.use("/evento/*", routerUsuarioSession);


//Aplicar routerUsuarioAdmin
app.use("/usuario/*", routerUsuarioAdmin);
app.use("/admin", routerUsuarioAdmin);
app.use("/apuesta/cerrar/*", routerUsuarioAdmin)
app.use("/apuesta/agregar/*", routerUsuarioAdmin)


app.use(express.static('public'));

// Variables
app.set('port', 8081);
app.set('db', 'mongodb://admin1:rasbet@cluster0-shard-00-00.l1v00.mongodb.net:27017,cluster0-shard-00-01.l1v00.mongodb.net:27017,cluster0-shard-00-02.l1v00.mongodb.net:27017/Cluster0?ssl=true&replicaSet=atlas-pv45qq-shard-0&authSource=admin&retryWrites=true&w=majority');
app.set('clave', 'abcdefg');
app.set('crypto', crypto);

//Rutas/controladores por lógica
require("./routes/rusuarios.js")(app, swig, gestorBD);
require("./routes/radmin.js")(app, swig, gestorBD);
require("./routes/rapuestas.js")(app, swig, gestorBD, mongo);

app.get('/', function (req, res) {
    res.redirect('/identificarse');
})

app.listen(8081, function () {
    console.log("Servidor activo")
})

