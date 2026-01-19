var express = require("express");
var db = require("./db-connections");

var app = express();

app.use(express.json());
app.use(express.static("./public"));

app.route('/gallery').get(function(req,res){
    var sql = "SELECT * FROM animaladoption.animals";
    db.query(sql, function(error, result){
        if(error){
            throw error;
        }else{
            res.json(result);
        }
    })
});


app.listen(1338, "127.0.0.1");
console.log("[+] Web server is running @ http://127.0.0.1:1338");
