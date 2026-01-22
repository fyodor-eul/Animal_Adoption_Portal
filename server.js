const express = require("express");
const db = require("./db-connections");

/* For session management */
const session = require("express-session");
const MySQLStore = require('express-mysql-session')(session);

/* For File Uploading */
var multer = require("multer");
var path = require("path");
const { flushCompileCache } = require("module");

var app = express();

/* DB Connection for MySQL with sessions (already created and imported as db)
var db_con_opts = {
    host: process.env.DB_HOST, //IP of the database server
    port: process.env.DB_PORT, //port of the database server
    user: process.env.DB_USER, //user of the database server
    password: process.env.DB_PASSWORD, //password of the database server
    database: process.env.DB_NAME //database name
};
const connection = mysql.createConnection(options); // or mysql.createPool(options);
*/

const sessionStore = new MySQLStore({}/* session store options */, db);


/* File Storage */
const mul_storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/images/profiles"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ mul_storage });

/* Middleware Stacks in Order */
/* - Applicatoin middlewares */
app.use(express.json());                        // For parsing JSON
app.use(express.urlencoded({extended: false})); // For parseing HTML FORM data: from "username=fyodor&password=1234" to {"username": "fyodor", "password": 1234 }
app.use(express.static("./public"));            // For hosting static files

/* Logging */
app.use((req, res, next) => {
    //console.log(`[${req.method}] : ${req.url}`);
    next();
});
app.use((req, res, next) => {
    //process.stdout.write(`\t`);
    next();
});






/* User Authentication and Sessions */

app.use(session({
    store: sessionStore,
    resave: false,             // disable saving to the database everytime (update only when the data has been modified)
    secret: 'secretkey',
    saveUninitialized: false,  // disable saving the cookies in the client's browser before we set any cookie values
    cookie: { maxAge: 30000 }  // Cookie age : 30s
}));

app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if(!username || !password){
        return res.status(403).send("Unauthorized: username or password required");
    }
    var sql = "SELECT * FROM animaladoption.users WHERE name = ? LIMIT 1";
    db.query(sql, [username], function(error, rows){

        if(error){
            console.error(error);
            return res.status(500).send("Internal Server Error");
        }

        if(!rows || rows.length == 0){
            return res.status(401).send("Unauthorized: user does not exist");
        }

        /* User Exists. Now is for checking password */
        const user = rows[0];
        if(user.password != password){
            return res.status(401).send("Unauthorized: wrong password");
        }

        var sql = "SELECT * FROM animaladoption.userTypes WHERE id = ?";
        db.query(sql, [user.type], function(error, rows){
            user.type = rows[0].name;
            console.log(user.type);

            /* Setting user session */
            req.session.authenticated = true;
            req.session.user = {
                username: user.name,
                password: user.password,
                type: user.type
            };
            return res.status(200).send(`Successful Login`);
        });
    });
});

//app.route('/gallery').post(function(req, res){
app.post('/gallery', upload.single("profileImg"), function(req, res){

    const imgUrl = `images/profiles/${req.file.filename}`;

    const sql = "INSERT INTO animaladoption.animals (name, profileImg, dateOfBirth, species_id, breed_id, adoptionStatus_id, gender, temperament) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    var parameter = [
        req.body.name,
        imgUrl,
        req.body.dateOfBirth,
        req.body.species,
        req.body.breed,
        req.body.gender,
        req.body.adoptionStatus,
        req.body.temperament
    ];

    db.query(sql, parameter, function(error, result){
        if(error) throw error;

        db.query(
            "SELECT * FROM animaladoption.animals WHERE id = ?",
            [result.insertId],
            function(err2, rows){
                if(err2) throw err2;
                res.json(rows[0]);
            }
        );
    });
});

app.route('/gallery').get(function(req, res){
    var sql = "SELECT * FROM animaladoption.animals";
    db.query(sql, function(error, result){
        if(error){
            throw error;
        }else{
            /* Check if a session has been set */
            if (!req.session.authenticated || !req.session.user) {
                return res.status(401).send("Unauthorized");
            }
            //console.log("Session user:", JSON.stringify(req.session.user));
            console.log(`Username: ${req.session.user.username} Type: ${req.session.user.type} has browse ${req.path} Method : ${req.method}`);
            res.json(result);
        }
    })
});

app.listen(1338, "127.0.0.1");
console.log("[+] Web server is running @ http://127.0.0.1:1338");
