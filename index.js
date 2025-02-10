const express = require('express');
const app = express();
const cors = require("cors");
const port =5000;
const mysql = require('mysql2');
require('dotenv').config();
const jwt =require('jsonwebtoken');
app.use(cors());
app.use(express.json());

console.log(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME);
//établir la connection avec la base de données
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


//initialisation du serveur
const server = app.listen(port, '0.0.0.0' ,(error) => {
    if (!error) {
        console.log("Server is Running on Port " + port);
    }
    else {
        console.log("Erro" + error);
    }
})

const CheckAuthenticatedUser=(req,res,next)=>{
    let token= req.header("auth-token");
    if(!token){
        console.log("i'm here hhhhhhh ")
     return res.status(401).send({errors:"please authenticated using a valid token"})
    }
 
    jwt.verify(token,process.env.Secret_Key,(err,decode)=>{
     if(err){
         console.log("token invalid")
         return res.status(401).send("please authenticate using a valid token");
     }
 
     else{
         console.log("token is valid")
         console.log(decode);
         next()
     }
    })
    
    
 }

 app.get('/', (req, res) => {
    res.send('Node.js Server is Working!');
});

app.post("/save",CheckAuthenticatedUser,async(req,res)=>{
    let inputData = req.body.data
    /* console.log("save has been clicked")
    console.log(req.body.data) */
    //console.log(req.body.data[0])
    let localDateTime = req.body.data[0]["value"]+":00.000Z"
    const localDate = new Date(localDateTime);
    let timestamp = localDate.getTime();
    /* console.log("date before")
    console.log(req.body.data[0]["value"]+":00.000Z")
    console.log("date after")
    console.log(localDate)
    console.log("the timestamp is:")
    console.log(timestamp) */
    inputData.forEach(item => {
        let localDateTime = item.value+":00.000Z"
        const localDate = new Date(localDateTime);
        let timestamp = localDate.getTime();
        console.log(`Value: ${item.value}`);
        console.log("timestamp:",timestamp);
        try{
           let sql = `INSERT INTO distributions (delivery_time, delivery_status) VALUES (${timestamp}, FALSE)`;
           con.query(sql, function (err, result) {
            if (err){
                //throw err;
                res.json({success:false})
                console.log("an error happened",err)
                return res.json({success:false})
            } 
            else{
               console.log("1 record inserted");
               
            }
           
        }); }

        catch(err){
            console.log("an error happppeeend",err)
        }
        
      }
    
    );
    res.json({success:true})
})


app.post("/login",async(req,res)=>{
    let username= req.body.username;
    let password = req.body.password;
    console.log("this is the username",req.body.username)
    console.log("this is the password",req.body.password)
    console.log("this path has been clicked")

    //res.json({success:true,error:"Wrong Password"})

    const sql = `SELECT * from user WHERE username='${username}' AND password='${password}'`;
    con.query(sql, function (err, result) {
    if (err) {
        console.log("an error happened",err)
        return
    };
    
    if (result.length>0){
        console.log("matching data found")
        let token =jwt.sign({data:{id:result[0].username}},process.env.Secret_Key)
        res.json({success:true,token:token})
    }

    else{
        res.json({success:false})
        console.log("No matching data found");
    }
});
    
})

app.post("/history",CheckAuthenticatedUser,async(req,res)=>{
    console.log("this path has been clicked")
    let date1 = req.body.startdate //":00.000Z"
    let date2 = req.body.enddate //":00.000Z"
    console.log(date1);
    console.log(date2);
    const DATE1 = new Date(date1);
    const DATE2 = new Date(date2);
    console.log("this is DATE1",DATE1)
    console.log("this is DATE2",DATE2)
    let timestamp1 = DATE1.getTime();
    let timestamp2 = DATE2.getTime();
    console.log(timestamp1)
    console.log(timestamp2)
    const sql = `SELECT * from distributions WHERE delivery_time>=${timestamp1} AND delivery_time<=${timestamp2} AND delivery_status = true`;
    con.query(sql, function (err, result) {
    if (err) {
        console.log("an error happened",err)
        return
    }
    else{
        console.log(result.length)
        console.log(result)
        return res.json({data:result,success:true})
    }
})
})

app.get("/data",async(req,res)=>{
    const sql = `SELECT * from distributions WHERE delivery_status = false`;
    con.query(sql, function (err, result) {
    if (err) {
        console.log("an error happened",err)
        return
    }

    else{
        console.log(result.length)
        console.log(result)
        return res.json({data:result,success:true})
    }
})
})

app.post("/modify",async(req,res)=>{
    let timestamp = req.body.timestamp
    console.log("i have been clicked")
    console.log(timestamp)
    const sql = `UPDATE distributions SET delivery_status = true WHERE delivery_time = ${timestamp}`;
    con.query(sql, function (err, result) {
    if (err) {
        console.log("an error happened",err)
        return
    }
    else{
        console.log(result.length)
        console.log(result)
        return res.json({success:true})
    }
})
})