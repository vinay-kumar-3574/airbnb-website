const Listing = require("../models/listing.js");  // ✅ Correct

module.exports.index= async(req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
    
    
}
module.exports.newForm=async(req,res)=>{
    
    res.render("listings/new.ejs");
    
}
module.exports.showRoute=async(req,res)=>{
    let {id}=req.params;
    const listing = await Listing.findById(id).populate("owner").populate({path:"reviews",populate:{
         path:"author",
    }});

console.log("Listing Owner:", listing.owner); // Debugging

     if(!listing){
        req.flash("error"," Listing does not exist!")
        res.redirect("/listings")
     }
     
    res.render("listings/show.ejs",{ listing});
   
    

}
module.exports.createPost=async(req,res, next)=>{
    let url=req.file.path;
    let filename=req.file.filename;
   
    if(!req.body.listing){
        throw new ExpressError(400,"send valid data  for listing")
    }
        let Newlisting=new Listing(req.body.listing);
        Newlisting.owner=req.user._id
        Newlisting.image={url,filename}
        await Newlisting.save();

        req.flash("success","New Listing is Created!")

        res.redirect("/listings"); 
   
  
}
module.exports.editForm=async(req,res)=>{
    
   
    let {id}=req.params;
    const listing=await Listing.findById(id)
    if(!listing){
        req.flash("error"," Listing does not exist!")
        res.redirect("/listings")
     }
    res.render("listings/edit.ejs",{listing});
}
module.exports.updatePost=async(req,res)=>{
    
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if(typeof req.file!= "undefined"){
    let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
    }
    req.flash("success"," Listing is Updated!")
    res.redirect(`/listings/${id}`)
}
 module.exports.deleteRoute=async(req,res)=>{
    let {id}=req.params;
    let deleted=await Listing.findByIdAndDelete(id);
    console.log(deleted);
    req.flash("success","New Listing is Deleted")
    res.redirect("/listings");
}