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
app.set('jwt',jwt);

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
app.use(bodyParser.urlencoded({ extended: true }));

let gestorBD = require("./modules/gestorBD");
gestorBD.init(app, mongo);



app.use(express.static('public'));

// Variables
app.set('port', 8081);
app.set('db', 'mongodb://admin:admin@rasbet-shard-00-00.j0kad.mongodb.net:27017,rasbet-shard-00-01.j0kad.mongodb.net:27017,rasbet-shard-00-02.j0kad.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-tc9dn2-shard-0&authSource=admin&retryWrites=true&w=majority');
app.set('clave','abcdefg');
app.set('crypto',crypto);




//Rutas/controladores por lógica
require("./routes/rusuarios.js")(app, swig, gestorBD);  // (app, param1, param2, etc.)

app.get('/', function (req, res) {
    res.redirect('/identificarse');
})

app.listen(8081,function (){
    console.log("Servidor activo")
})

