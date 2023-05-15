const express = require("express");
let passport = require("passport");
let jwt = require("jsonwebtoken");
let JWTStrategy = require("passport-jwt").Strategy;
let ExtractJWT = require("passport-jwt").ExtractJwt;

let {employees} = require("./data2");
let app = express();
app.use(express.json());
app.use(function(req, res, next) {
res.header("Access-Control-Allow-Origin", "*");
res.header(
"Access-Control-Allow-Headers",
"Origin, X-Requested-With, Content-Type, Accept, Authorization"
);
res.header("Access-Control-Expose-Headers","X-Auth-Token");
res.header("Access-Control-Allow-Methods",
"GET,POST,OPTIONS,PUT,PATCH,DELETE,HEAD");
next();
});
app.use(passport.initialize());

let port = 2410;
app.listen(port, () => console.log(`Server started on 2410!`));

const cookieParser = require("cookie-parser");
app.use(cookieParser("abcdef-3477819"));

const params = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey : "jwtsecret2345775"
}
const jwtExpirySeconds = 300;

let strategyAll = new JWTStrategy(params,function(token,done){
    console.log("In JWTStrategy-All", token);

    let user = employees.find((u)=>u.empCode===token.empCode);
    console.log("user", user);
    if(!user)
    return done(null, false, {message: "Incorrect empCode or name"});
    else return done(null,user);
});

let strategyAdmin = new JWTStrategy(params,function(token,done){
    console.log("In JWTStrategy-All", token);

    let user = users.find((u)=>u.id===token.id);
    console.log("user", user);
    if(!user)
    return done(null, false, {message: "Incorrect username or password"});
    else if(user.role!=="admin")
    return done(null, false, {message: "You do not have admin role"});

    else return done(null,user);
});

passport.use("roleAll",strategyAll);
passport.use("roleAdmin",strategyAdmin);

app.post("/login",function(req,res){
    let {empCode,name} = req.body;
    let code = +empCode;
    let user = employees.find((u)=>u.name===name && u.empCode===code);
    console.log(user);
    if(user){
        res.cookie(
            "employeeData",
            {empCode:empCode},
            {maxAge:30000,signed:true}
        );
        let tracker = req.signedCookies.tracker;
    if(!tracker) tracker=[{url:"/login",date:Date.now()}];
    tracker.push({url:"/login",date:Date.now()});
    res.cookie("tracker",tracker,{maxAge:30000,signed:true});
        let payload = {empCode:user.empCode};
        let token = jwt.sign(payload,params.secretOrKey,{
            algorithm: "HS256",
            expiresIn: jwtExpirySeconds,
        })
        res.send(token);       
    } else res.sendStatus(401);
});


app.get("/myDetails",passport.authenticate("roleAll",{session:false}),function(req,res){
    let tracker = req.signedCookies.tracker;
    if(!tracker) tracker=[{url:"/myDetails",date:Date.now()}];
    tracker.push({url:"/myDetails",date:Date.now()});
    res.cookie("tracker",tracker,{maxAge:30000,signed:true});
    console.log("In GET /user", req.user);
    res.send(req.user);
});

app.get("/company",function(req,res){
    let userdata = req.signedCookies.employeeData;

    let user = userdata?userdata.name:"Guest";
    let tracker = req.signedCookies.tracker;
    if(!tracker) tracker=[{url:"/company",date:Date.now()}];
    tracker.push({url:"/company",date:Date.now()});
    res.cookie("tracker",tracker,{maxAge:30000,signed:true});

    res.send(" Welcome to the Employee Portal of XYZ Company");
});


app.get("/myJuniors",passport.authenticate("roleAll",{session:false}),function(req,res){
    let userdata = req.user;
    console.log(userdata);
    let user = userdata?userdata.name:"Guest";
    let tracker = req.signedCookies.tracker;
    if(!tracker) tracker=[{url:"/myJuniors",date:Date.now()}];
    tracker.push({url:"/myJuniors",date:Date.now()});
    res.cookie("tracker",tracker,{maxAge:30000,signed:true});

    if(!userdata)
    res.status(400).send("Please login first");
    else{
        let{empCode,name} = userdata;

        let u1 = employees.find(u=>u.empCode===empCode);
        if(u1.designation==="VP"){
            let juniors = employees.filter(emp=>emp.designation==="Manager"||emp.designation==="Trainee");
            res.send(juniors);

        }
        else if(u1.designation==="Manager"){
             juniors = employees.filter(emp=>emp.designation==="Trainee");
            res.send(juniors);

        }
        else if(u1.designation==="Trainee"){
            res.send("No Juniors");

        }
              
    }
});



app.get("/tracker",function(req,res){    
    let tracker = req.signedCookies.tracker;
    if(!tracker){
        res.send([]);
    }
    else
    res.send(tracker);
});
