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

/* File storage for pet images */
const mul_storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/images/profiles/pets"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage: mul_storage });

/* File storage for user images */
const user_storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/images/profiles/users"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const userUpload = multer({ storage: user_storage });


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
    resave: false,              // disable saving to the database everytime (update only when the data has been modified)
    secret: 'secretkey',
    saveUninitialized: false,   // disable saving the cookies in the client's browser before we set any cookie values
    cookie: { maxAge: 600000 }  // Cookie age : 10mins
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
app.post("/register", userUpload.single("profileImage"), (req, res) => {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";
    const type = Number(req.body.type);
    
    const firstName = (req.body.firstName || "").trim();
    const lastName = (req.body.lastName || "").trim();
    const contactNo = (req.body.contactNo || "").trim();

    if (!req.file) {
      return res.status(400).send("Profile image is required.");
    }

    if (!username || !password || !type || !firstName || !lastName || !contactNo) {
      return res.status(400).send("Missing required fields");
    }

    const profileImageUrl = `images/profiles/users/${req.file.filename}`;

    // Duplicate username check
    db.query("SELECT 1 FROM users WHERE name = ? LIMIT 1", [username], (err, rows) => {
        if (err) return res.status(500).send("Database error");
        if (rows.length) return res.status(409).send("Username already exists");

        const insertSql = `INSERT INTO users (name, password, createdAt, type, firstName, lastName, profileImage, contactNo) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?)`;

        db.query(
            insertSql,
            [username, password, type, firstName, lastName, profileImageUrl, contactNo],
            (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).send("Failed to create account");
                }
                return res.status(201).send("Registration successful");
            }
        );
    });
});


/* Create Pet */
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
            //res.json(result);

            const userType = String(req.session.user.type || "").toLowerCase();

            // If NOT admin → filter out adopted animals
            let finalResult = result;
            if (userType !== "admin") {
                finalResult = result.filter(a => 
                    String(a.adoptionStatusName).toLowerCase() !== "adopted"
                );
            }

            res.json(finalResult);

            //console.log(result);
        }
    })
});

app.get("/me", function(req, res) {
    /*
    * end point for checking if a user is logged in or not
    */
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

/* Update Pet */
app.put("/gallery/:id", requireAdmin, function(req, res) {
    const id = req.params.id;
    const { name, dateOfBirth, breedId, gender, adoptionStatusId, temperament } = req.body;

    if (!name || !dateOfBirth || !breedId || !gender || !adoptionStatusId) {
        return res.status(400).send("Missing required fields");
    }

    const sql = `
        UPDATE animaladoption.animals
        SET name = ?, dateOfBirth = ?, breed_id = ?, gender = ?, adoptionStatus_id = ?, temperament = ?
        WHERE id = ?
    `;

    db.query(sql, [name, dateOfBirth, breedId, gender, adoptionStatusId, temperament, id], function(err, result) {
        if (err) {
            console.error(err);
            return res.status(500).send("Update failed");
        }
        res.send("Updated");
    });
});

/* APT end points for dropdown */
// Species list
app.get("/api/species", function(req, res) {
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    db.query("SELECT id, name FROM animaladoption.species ORDER BY name", function(err, rows) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        //console.log(rows);
        res.json(rows);
    });
});

// Adoption status list
app.get("/api/adoption-status", function(req, res) {
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    db.query("SELECT id, name FROM animaladoption.adoptionStatus ORDER BY id", function(err, rows) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        res.json(rows);
    });
});

// Breed list
app.get("/api/breeds", function(req, res) {
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    const speciesId = req.query.speciesId;

    var sql = `
        SELECT b.id, b.name
        FROM animaladoption.breeds b
    `;
    const params = [];

    if (speciesId) {
        sql += " WHERE b.species_id = ? ";
        params.push(speciesId);
    }

    sql += " ORDER BY b.name";

    db.query(sql, params, function(err, rows) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        res.json(rows);
    });
});

/* Create breed */
app.post("/api/breeds", requireAdmin, function(req, res) {
    const name = (req.body.name || "").trim();
    const speciesId = req.body.speciesId;

    if (!name) return res.status(400).send("Breed name required");
    if (!speciesId) return res.status(400).send("speciesId required");

    db.query(
        "INSERT INTO animaladoption.breeds (name, species_id) VALUES (?, ?)",
        [name, speciesId],
        function(err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }

            // return the newly created row info
            res.json({ id: result.insertId, name: name, speciesId: Number(speciesId) });
        }
    );
});

/* Delete breed */
app.delete("/api/breeds/:id", requireAdmin, function(req, res) {
    const id = req.params.id;

    db.query(
        "DELETE FROM animaladoption.breeds WHERE id = ?",
        [id],
        function(err, result) {
            if (err) {
                console.error(err);
                // likely FK constraint if animals reference this breed
                return res.status(400).send("Cannot delete breed (it may be used by animals)");
            }

            if (!result || result.affectedRows === 0) {
                return res.status(404).send("Breed not found");
            }

            res.send("Deleted");
        }
    );
});

/* Log out */
app.post("/logout", function(req, res) {
    req.session.destroy(err => {
        if (err) return res.status(500).send("Logout failed");
        res.clearCookie("connect.sid");
        res.send("Logged out");
    });
});


function requireAdmin(req, res, next) {
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Unauthorized");
    }
    const type = String(req.session.user.type || "").toLowerCase();
    if (type !== "admin") {
        return res.status(403).send("Forbidden: admin only");
    }
    next();
}

/* Create species */
app.post("/api/species", requireAdmin, function(req, res) {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).send("Species name required");

    db.query(
        "INSERT INTO animaladoption.species (name) VALUES (?)",
        [name],
        function(err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }
            res.json({ id: result.insertId, name: name });
        }
    );
});

/* Delete species */
app.delete("/api/species/:id", requireAdmin, function(req, res) {
    const id = req.params.id;

    db.query(
        "DELETE FROM animaladoption.species WHERE id = ?",
        [id],
        function(err, result) {
            if (err) {
                // If this species is referenced by breeds, MySQL may block delete (FK constraint)
                console.error(err);
                return res.status(400).send("Cannot delete species (it may be used by breeds)");
            }
            if (!result || result.affectedRows === 0) {
                return res.status(404).send("Species not found");
            }
            res.send("Deleted");
        }
    );
});

/* Create status */
app.post("/api/adoption-status", requireAdmin, function(req, res) {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).send("Status name required");

    db.query(
        "INSERT INTO animaladoption.adoptionStatus (name) VALUES (?)",
        [name],
        function(err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }
            res.json({ id: result.insertId, name: name });
        }
    );
});

/* Delete status */
app.delete("/api/adoption-status/:id", requireAdmin, function(req, res) {
    const id = req.params.id;

    db.query(
        "DELETE FROM animaladoption.adoptionStatus WHERE id = ?",
        [id],
        function(err, result) {
            if (err) {
                console.error(err);
                return res.status(400).send("Cannot delete status (it may be in used)");
            }
            if (!result || result.affectedRows === 0) {
                return res.status(404).send("Status not found");
            }
            res.send("Deleted");
        }
    );
});

/* Getting the user's details */
app.get("/api/users/me", (req, res) => {
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Not logged in");
    }

    const userId = req.session.user.id;

    const sql = `
        SELECT 
            u.id,
            u.name AS username,
            u.firstName,
            u.lastName,
            u.profileImage,
            u.contactNo,
            u.createdAt,
            ut.name AS userType
        FROM users u
        JOIN userTypes ut ON u.type = ut.id
        WHERE u.id = ?
        LIMIT 1
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).send("Database error");
        if (!rows || rows.length === 0) return res.status(404).send("User not found");
        return res.json(rows[0]);
    });
});

// PUT update current user's details
app.put("/api/users/me", userUpload.single("profileImage"), (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).send("Not logged in");
    }

    const userId = req.session.user.id;
    const firstName = (req.body.firstName || "").trim();
    const lastName = (req.body.lastName || "").trim();
    const username = (req.body.username || "").trim();
    const contactNo = (req.body.contactNo || "").trim();
    const userType = req.body.userType; // This will be the type ID

    // Simple validation
    if (!firstName || !lastName || !username) {
        return res.status(400).send("First name, last name, and username are required");
    }

    var sql = "UPDATE users SET firstName = ?, lastName = ?, name = ?, contactNo = ?, type = ? WHERE id = ?";
    var params = [firstName, lastName, username, contactNo, Number(userType), userId];

    // If profile image is uploaded, update that too
    if (req.file) {
        const profileImageUrl = "images/profiles/users/" + req.file.filename;
        sql = "UPDATE users SET firstName = ?, lastName = ?, name = ?, contactNo = ?, type = ?, profileImage = ? WHERE id = ?";
        params = [firstName, lastName, username, contactNo, Number(userType), profileImageUrl, userId];
    }

    db.query(sql, params, function(err, result) {
        if (err) {
            console.error(err);
            return res.status(500).send("Update failed");
        }

        // Fetch updated user data to return
        const selectSql = `
            SELECT 
                u.id,
                u.name AS username,
                u.firstName,
                u.lastName,
                u.profileImage,
                u.contactNo,
                u.createdAt,
                ut.id AS typeId,
                ut.name AS typeName
            FROM users u 
            JOIN userTypes ut ON u.type = ut.id 
            WHERE u.id = ? LIMIT 1
        `;

        db.query(selectSql, [userId], function(err2, rows) {
            if (err2) return res.status(500).send(err2.message);
            if (!rows || rows.length === 0) return res.status(404).send("User not found");
            
            // Update session data
            req.session.user.username = rows[0].username;
            req.session.user.type = rows[0].typeName;
            req.session.user.typeId = rows[0].typeId;

            res.json(rows[0]);
        });
    });
});

// PUT update current user's details
app.put("/api/users/me", userUpload.single("profileImage"), function(req, res) {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).send("Not logged in");
    }

    var userId = req.session.user.id;
    var firstName = (req.body.firstName || "").trim();
    var lastName = (req.body.lastName || "").trim();
    var username = (req.body.username || "").trim();
    var contactNo = (req.body.contactNo || "").trim();
    var userType = req.body.userType; // This is the type ID from the dropdown

    // Simple validation
    if (!firstName || !lastName || !username) {
        return res.status(400).send("First name, last name, and username are required");
    }

    if (!userType) {
        return res.status(400).send("User type is required");
    }

    var sql = "UPDATE users SET firstName = ?, lastName = ?, name = ?, contactNo = ?, type = ? WHERE id = ?";
    var params = [firstName, lastName, username, contactNo, Number(userType), userId];

    // If profile image is uploaded, update that too
    if (req.file) {
        var profileImageUrl = "images/profiles/users/" + req.file.filename;
        sql = "UPDATE users SET firstName = ?, lastName = ?, name = ?, contactNo = ?, type = ?, profileImage = ? WHERE id = ?";
        params = [firstName, lastName, username, contactNo, Number(userType), profileImageUrl, userId];
    }

    db.query(sql, params, function(err, result) {
        if (err) {
            console.error(err);
            return res.status(500).send("Update failed");
        }

        // Fetch updated user data to return
        var selectSql = `
            SELECT 
                u.id,
                u.name AS username,
                u.firstName,
                u.lastName,
                u.profileImage,
                u.contactNo,
                u.createdAt,
                ut.id AS typeId,
                ut.name AS typeName
            FROM users u 
            JOIN userTypes ut ON u.type = ut.id 
            WHERE u.id = ? LIMIT 1
        `;

        db.query(selectSql, [userId], function(err2, rows) {
            if (err2) return res.status(500).send(err2.message);
            if (!rows || rows.length === 0) return res.status(404).send("User not found");
            
            // Update session data
            req.session.user.username = rows[0].username;
            req.session.user.type = rows[0].typeName;
            req.session.user.typeId = rows[0].typeId;

            res.json(rows[0]);
        });
    });
});

// GET user types
app.get("/api/user-types", function(req, res) {
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    db.query("SELECT id, name FROM userTypes ORDER BY id", function(err, rows) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }
        res.json(rows);
    });
});

// DELETE current user's account
app.delete("/api/users/me", (req, res) => {
    if (!req.session.authenticated || !req.session.user) {
        return res.status(401).send("Not logged in");
    }

    const userId = req.session.user.id;

    // 1) Delete animals added by this user first (avoid FK constraint errors)
    db.query(
        "DELETE FROM animaladoption.animals WHERE addedBy = ?",
        [userId],
        (err1) => {
            if (err1) {
                console.error(err1);
                return res.status(500).send("Failed to delete user's pets");
            }

            // 2) Delete the user
            db.query(
                "DELETE FROM animaladoption.users WHERE id = ?",
                [userId],
                (err2, result) => {
                    if (err2) {
                        console.error(err2);

                        // Common case: FK constraints from other tables you haven't handled
                        return res
                            .status(400)
                            .send("Cannot delete account (it may be referenced by other records).");
                    }

                    if (!result || result.affectedRows === 0) {
                        return res.status(404).send("User not found");
                    }

                    // 3) Destroy session + clear cookie
                    req.session.destroy((err3) => {
                        if (err3) {
                            console.error(err3);
                            // user already deleted; still return OK
                        }
                        res.clearCookie("connect.sid");
                        return res.status(200).send("Deleted");
                    });
                }
            );
        }
    );
});


app.listen(1338, "0.0.0.0");
console.log("[+] Web server is running @ http://127.0.0.1:1338");