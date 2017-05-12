//----------------CONFIGURATION---------------------------
var express             = require("express"),
        app             = express(),
        bodyParser      = require("body-parser"),
        LocalStrategy   = require("passport-local"),
        passport        = require("passport"),
        User            = require("./model/user"),
        mongoose        = require("mongoose");
         
//connect to db
mongoose.connect("mongodb://localhost/hero_database");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(require("express-session")({
    secret:"Wait For It",
    resave:false,
    saveUninitialized: false
}));

app.use(express.static(__dirname + '/public'));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentuser = req.user;
    next();
})

//db SCHEMA SETUP
var heroDatabaseSchema = new mongoose.Schema({
   name: String,
   heroTitle: String,
   city:String,
   power:String,
   description: String,
   image:String
});

//collection name
var HeroDatabase = mongoose.model("Herodatabase", heroDatabaseSchema);


//------------ROUTES------------------
app.get("/", function(req, res){
    res.render("landing");
});

//Index route
app.get("/heroLists", isLoggedIn, function(req, res){
    //get all data (row) from db
    console.log(req.user)
    HeroDatabase.find({},function(err, herodatabases){
        if(err){
            console.log(err);
        }else{
            res.render("heroLists", {herodatabases:herodatabases, currentuser: req.user});
        }
    })
});

//New route
app.get("/heroLists/new", isLoggedIn, function(req, res){
   res.render("new.ejs");
});

//Create route
app.post("/heroLists", isLoggedIn, function(req,res){
    //gather date from /new
    var name = req.body.name;
    var heroTitle = req.body.heroTitle;
    var city = req.body.city;
    var power = req.body.power;
    var description = req.body.description;
    var image = req.body.image;
    //create a new campground object
    var newHero = {
        name: name,
        heroTitle:heroTitle,
        city: city,
        power: power,
        description: description,
        image: image
    }
    //create a new herodata and save to DB
    HeroDatabase.create(newHero, function(err, newlyCreated){
        if(err){
            console.log(err);
        }else{
            res.redirect("/heroLists")
        }
    })
    
});

//Show route
app.get("/heroLists/:id", isLoggedIn, function(req, res){
    //find the data by id which come from the index route
    HeroDatabase.findById(req.params.id, function(err, foundHero){
        if(err){
            console.log(err);
        }else{
            res.render("show", {hero:foundHero});
        }
    });
});

//Auth routes
app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/heroLists");
            })
        }
    });
});

app.get("/login", function(req, res){
    res.render("login");
});
//log in with middleware
app.post("/login",passport.authenticate("local",
    {
        successRedirect:"/heroLists",
        failureRedirect:"/login"
        }), function(req, res){
    res.send("Work?");
})

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

//------------listen------------------
app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The Hero Database Has Started!"); 
});