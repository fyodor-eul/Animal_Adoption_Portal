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
  destination: (req, file, cb) => cb(null, "public/images/profiles/pets"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage: mul_storage });


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
    cookie: { maxAge: 60000 }  // Cookie age : 30s
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

        /* Getting user type */
        db.query("SELECT * FROM animaladoption.userTypes WHERE id = ?", [user.type], function(error, rows){
            if (error) return res.status(500).send("Internal Server Error");
            const typeName = rows[0].name;

            /* Setting Session Values */
            req.session.authenticated = true;
            req.session.user = {
                id: user.id,
                username: user.name,
                typeId: user.type,
                type: typeName
            };

            /* Return Successful */
            return res.status(200).send("Successful Login");
        });
    });
});

/* Register */
app.post('/register', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const type = req.body.type; // number (1 = admin, 2 = user)

    if (!username || !password || !type) {
        return res.status(400).send("Missing required fields");
    }

    // 1. Check duplicate username
    var checkSql = "SELECT * FROM users WHERE name = ?";
    db.query(checkSql, [username], function(err, rows) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        if (rows.length > 0) {
            return res.status(409).send("Username already exists");
        }

        // 2. Insert user
        var insertSql = "INSERT INTO users (name, password, type, createdAt) VALUES (?, ?, ?, NOW())";
        db.query(insertSql, [username, password, type], function(err2, result) {
            if (err2) {
                console.error(err2);
                return res.status(500).send("Failed to create account");
            }

            res.send("Registration successful");
        });
    });
});

app.post('/gallery', upload.single("profileImg"), function(req, res){

    // Must be logged in
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    // Must have uploaded image
    if (!req.file) {
        return res.status(400).send("Profile image is required");
    }

    // Check if the image file is submitted
    if (!req.file) {
        return res.status(400).send("Profile image upload failed or missing.");
    }

    const imgUrl = `images/profiles/pets/${req.file.filename}`;

    const sql = `
        INSERT INTO animaladoption.animals
        (name, profileImg, dateOfBirth, breed_id, gender, temperament, adoptionStatus_id, addedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    var parameter = [
        req.body.name,
        imgUrl,
        req.body.dateOfBirth,
        req.body.breed,
        req.body.gender,
        req.body.temperament,
        req.body.adoptionStatus,
        req.session.user.id
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
    /* Selecting from animals table joining with breeds, species and adoptionStatus to map the IDs with name. (excluding IDs themselves to be shown)*/
    var sql = `
        SELECT 
            a.id,
            a.name,
            a.profileImg,
            a.dateOfBirth,
            a.gender,
            a.temperament,
            a.addedBy,
    
            b.name AS breedName,
            s.name AS speciesName,
            st.name AS adoptionStatusName
        FROM animaladoption.animals a
        JOIN animaladoption.breeds b ON a.breed_id = b.id
        JOIN animaladoption.species s ON b.species_id = s.id
        JOIN animaladoption.adoptionStatus st ON a.adoptionStatus_id = st.id
    `;


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
            //console.log(result);
        }
    })
});

app.get("/me", function(req, res) {
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).json({ authenticated: false });
    }

    return res.json({
        authenticated: true,
        user: {
            username: req.session.user.username,
            type: req.session.user.type
        }
    });
});

app.delete("/gallery/:id", function(req, res) {
    // Must be logged in
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    // Must be admin
    const type = String(req.session.user.type || "").toLowerCase();
    if (type !== "admin") {
        return res.status(403).send("Forbidden: admin only");
    }

    const animalId = req.params.id;
    if (!animalId) {
        return res.status(400).send("Missing animal id");
    }

    const sql = "DELETE FROM animaladoption.animals WHERE id = ?";
    db.query(sql, [animalId], function(err, result) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        if (!result || result.affectedRows === 0) {
            return res.status(404).send("Animal not found");
        }

        return res.status(200).send("Deleted");
    });
});

app.listen(1338, "127.0.0.1");
console.log("[+] Web server is running @ http://127.0.0.1:1338");
