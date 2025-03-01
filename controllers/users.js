const User = require("../models/user.js");
module.exports.RenderSignup=(req,res)=>{
    res.render("users/signup.ejs")
}   
module.exports.signUp = async (req, res, next) => {
    try {
        let { email, password, username } = req.body;
        const newUser = new User({ email, username });

        const registeredUser = await User.register(newUser, password);
        console.log("✅ Registered User:", registeredUser);

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err); // ✅ This line was missing
            }
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.RenderLogin=(req,res)=>{
    res.render("users/login.ejs")
}
module.exports.login = async (req, res, next) => {
    console.log("🔹 Login Route Hit");
    
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.log("❌ Authentication Error:", err);
            return next(err);
        }
       

        req.login(user, (err) => {
            if (err) {
                console.log("❌ Login Error:", err);
                return next(err);
            }
            console.log("✅ User Logged In:", user);

            // Ensure session is saved before redirecting
            req.session.passport = { user: user._id };  
            req.session.save(() => {
                req.flash("success", "Welcome to Wanderlust!");
                res.redirect(res.locals.redirectUrl || "/listings");
            });
        });
    })(req, res, next);
};


 module.exports.logOut=(req,res,next)=>{
     req.logout((err)=>{
         if(err){
             return next(err);
         }
         req.flash("success","Logged out successfully");
         res.redirect("/listings");
     });
     
 }