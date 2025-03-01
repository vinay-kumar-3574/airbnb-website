if(process.env.NODE_ENV!="production"){
    require('dotenv').config()
}



const express = require("express");
const app = express();
const mongoose = require("mongoose");
 const Listing = require("./models/listing.js"); // Correct path
 const methodOverride=require("method-override")
 const ejsMate=require("ejs-mate")
const wrapAsync=require("./utils/wrapasync.js")
const ExpressError=require("./utils/expressError.js")
const {listingSchema,reviewSchema}=require("./schema.js")
const Review = require("./models/review.js"); 
const cookieParser=require("cookie-parser");
const path=require("path");
const session=require("express-session");
const flash=require("connect-flash")
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
const {isLoggedIn, saveRedirectUrl, isOwner,isReviewAuthor}=require("./models/middleware.js");
const multer  = require('multer')
const { storage} = require("./cloudConfig.js")
const upload = multer({ storage})
const MongoStore = require("connect-mongo");

const listingController = require("./controllers/listings.js");  // ✅ Correct path
const reviewController = require("./controllers/reviews.js");
const userController = require("./controllers/users.js");








// const mongo_url = "mongodb://127.0.0.1:27017/wanderlust";
  const db_url = process.env.ATLAS_DB ;
  const store=MongoStore.create({
    mongoUrl:db_url,
    crypto:{
        secret: "mysupersecretstring",
    },
    touchAfter:24*3600

})

const sessionOptions = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store:store,
    
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
    }
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));



async function main() {
    await mongoose.connect(db_url);
}
main().catch(err => console.log("❌ MongoDB Connection Error:", err));


main()
    .then(() => console.log("Connected to DB"))
    .catch(err => console.log(err));
 
const port = 8000;
app.use(express.json());

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
app.set(" view engine","ejs");
app.set( "views", path.join(__dirname,"views"));
app.use(express.urlencoded ({ extended: true }));
app.use(methodOverride("_method"))
app.engine("ejs",ejsMate);
app.use(express.static(path.join( __dirname,"public")));
app.use(cookieParser());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    console.log("🔹 Session Data:", req.session);
    console.log("🔹 Authenticated User:", req.user ? req.user.username : "Not logged in");
    console.log("🔹 Session User ID:", req.session.passport ? req.session.passport.user : "No session user");
    next();
});



// app.get("/", (req, res) => {
//     res.send("Hello world");
//     req.time=new Date(Date.now()).toString();

//     console.log(req.time)
// }); 


app.use( (req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})


const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    
    if(error){
        let errmsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errmsg)
    }else{
        next();
    }
}
const validateReview=(req,res,next)=>{
    let {error}=reviewSchema.validate(req.body);
    
    if(error){
        let errmsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errmsg)
    }else{
        next();
    }
}

app.get("/signup",userController.RenderSignup)  
app.post("/signup",wrapAsync(userController.signUp))
app.get("/login", userController.RenderLogin);
app.post("/login", passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), saveRedirectUrl, userController.login);
app.get("/logout",userController.logOut)


// index route
app.get("/listings",wrapAsync(listingController.index))
//new route
app.get("/listings/new",isLoggedIn ,wrapAsync(listingController.newForm))
//show route
app.get("/listings/:id",wrapAsync(listingController.showRoute))
//create a post
app.post("/listings",isLoggedIn,upload.single('listing[image]'),validateListing,wrapAsync(listingController.createPost)) ;


app.get("/listings/:id/edit",isLoggedIn ,isOwner,wrapAsync(listingController.editForm))

app.put("/listings/:id",isLoggedIn,isOwner,upload.single('listing[image]'),validateListing,wrapAsync(listingController.updatePost))
//delete route
app.delete("/listings/:id",isLoggedIn,isOwner,wrapAsync(listingController.deleteRoute))
//reviews
app.post("/listings/:id/reviews",isLoggedIn,validateReview,wrapAsync(reviewController.createReview))
//delete review
 app.delete("/listings/:id/reviews/:review_id",isLoggedIn,isReviewAuthor,wrapAsync(reviewController.deleteReview))
app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"something went wrong "))
})
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "somthing went wrong" } = err;
    res.status(statusCode).render("error.ejs", { statusCode, message });
});
 