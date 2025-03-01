const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
module.exports.createReview=async(req,res)=>{
    let listing=await Listing.findById( req.params.id);
  
    let newReview=new Review(req.body.review);
    newReview.author=req.user._id;
    console.log(newReview)
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();
    console.log("new review saved ")
    req.flash("success","new review is Created!")
    res.redirect(`/listings/${listing._id}`) 

}

 module.exports.deleteReview=async(req,res)=>{
    let {id,review_id}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews: review_id}})
     await Review.findByIdAndDelete(review_id);
     req.flash("success","Your review is Deleted!")
     res.redirect(`/listings/${id}`)

 }