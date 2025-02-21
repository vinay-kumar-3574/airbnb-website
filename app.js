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
const {isLoggedIn, saveRedirectUrl}=require("./models/middleware.js");




const mongo_url = "mongodb://127.0.0.1:27017/wanderlust";
const sessionOptions={
    secret:"mysupersecretstring",
     resave:false,
     saveUninitialized:true,
     cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
         httpOnly:true,

     }

}



async function main() {
    await mongoose.connect(mongo_url);
}

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
 
app.get("/", (req, res) => {
    res.send("Hello world");
    req.time=new Date(Date.now()).toString();

    console.log(req.time)
}); 

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs")
})
app.post("/signup",wrapAsync(async(req,res)=>{
    try{
        let { email,password,username}= req.body;
        const newUser=new User({email,username})
        const registeredUser=await User.register(newUser,password);
        console.log(registeredUser)
        req.login( registeredUser,(err)=>{
            if(err){
                return next(err)
            }
        req.flash("success","Welcome to Wanderlust!");
        res.redirect("/listings");
        })
       
    }catch(e){
        req.flash("error",e.message);
        res.redirect("/signup")
    }
   
}))
app.get("/login",(req,res)=>{
    res.render("users/login.ejs")
})
app.post("/login",saveRedirectUrl ,passport.authenticate("local",{ failureRedirect: '/login',failureFlash:true }),async(req,res)=>{
    req.flash("success","Welcome to Wanderlust!");
  res.redirect(res.locals.redirectUrl || "/listings")
   
})
app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Logged out successfully");
        res.redirect("/listings");
    });
    
})

// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"student @gmail.com ",
//         username:"delta-student",
//     })
//     let registeredUser=await User.register(fakeUser,"helloWorld");
//     res.send(registeredUser);

// })
// index route
app.get("/listings",wrapAsync(async(req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
    
    
}))
//new route
app.get("/listings/new",isLoggedIn ,wrapAsync(async(req,res)=>{
    
    res.render("listings/new.ejs");
    
}))
//show route
app.get("/listings/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id).populate('reviews');
     if(!listing){
        req.flash("error"," Listing does not exist!")
        res.redirect("/listings")
     }
    res.render("listings/show.ejs",{listing});

}))
//create a post
app.post("/listings",isLoggedIn,validateListing,wrapAsync(async(req,res, next)=>{
   
    if(!req.body.listing){
        throw new ExpressError(400,"send valid data  for listing")
    }
        let Newlisting=new Listing(req.body.listing);
        await Newlisting.save();

        req.flash("success","New Listing is Created!")

        res.redirect("/listings");
   
  
}))
app.get("/listings/:id/edit",isLoggedIn ,wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id)
    if(!listing){
        req.flash("error"," Listing does not exist!")
        res.redirect("/listings")
     }
    res.render("listings/edit.ejs",{listing});
}))
app.put("/listings/:id",isLoggedIn,validateListing,wrapAsync(async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    req.flash("success"," Listing is Updated!")
    res.redirect(`/listings/${id}`)
}))
//delete route
app.delete("/listings/:id",isLoggedIn,wrapAsync(async(req,res)=>{
    let {id}=req.params;
    let deleted=await Listing.findByIdAndDelete(id);
    console.log(deleted);
    req.flash("success","New Listing is Deleted")
    res.redirect("/listings");
}))
//reviews
app.post("/listings/:id/reviews",validateReview,wrapAsync(async(req,res)=>{
    let listing=await Listing.findById( req.params.id);
    let newReview=new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    console.log("new review saved ")
    req.flash("success","new review is Created!")
    res.redirect(`/listings/${listing._id}`)

}))
//delete review
 app.delete("/listings/:id/reviews/:review_id",wrapAsync(async(req,res)=>{
    let {id,review_id}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews: review_id}})
     await Review.findByIdAndDelete(review_id);
     req.flash("success","Your review is Deleted!")
     res.redirect(`/listings/${id}`)

 }))
app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"something went wrong "))
})
app.use((err, req, res, next) => {
    const { statusCode = 500, message = errmsg } = err;
    res.status(statusCode).render("error.ejs", { statusCode, message });
});




