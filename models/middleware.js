const Listing=require("./listing")
const Review = require("./review.js"); 
module.exports.isLoggedIn=(req,res,next)=>{
    req.session.redirectUrl=req.originalUrl;
    if(!req.isAuthenticated()){
        req.flash("error","you must be logged in to create a listing ")
        return res.redirect("/login")
    }
    next();
}
module.exports.saveRedirectUrl = (req, res, next) => {

    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
         
    } 

    next();
};
module.exports.isOwner=async(req,res,next)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id);
    console.log(res.locals.currUser)
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","You do not have permission to edit this")  
        return res.redirect(`/listings/${id}`)
    }
    next()
}
module.exports.isReviewAuthor=async(req,res,next)=>{
    let {id,review_id}=req.params;
    let review=await Review.findById(review_id);
    console.log(res.locals.currUser)
    if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error","You do not have permission to edit this")  
        return res.redirect(`/listings/${id}`)
    }
    next()
}