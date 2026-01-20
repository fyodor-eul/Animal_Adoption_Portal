var express = require("express");
var db = require("./db-connections");

var multer = require("multer");
var path = require("path");

var app = express();

app.use(express.json());
app.use(express.static("./public"));

/* File Storage */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/images/profiles"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

app.route('/gallery').get(function(req, res){
    var sql = "SELECT * FROM animaladoption.animals";
    db.query(sql, function(error, result){
        if(error){
            throw error;
        }else{
            res.json(result);
        }
    })
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
        req.body.adoptionStatus,
        req.body.gender,
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

app.listen(1338, "127.0.0.1");
console.log("[+] Web server is running @ http://127.0.0.1:1338");
