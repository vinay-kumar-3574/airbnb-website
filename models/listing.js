const mongoose = require("mongoose"); 
const Schema=mongoose.Schema
const Review=require("./review.js")
const listingSchema = new Schema({ // Directly using mongoose.Schema
    title: {
        type: String,
        required: true,
    },
    description: String,
    price: Number,
    image: {  // Change from String to an object
        filename: String,
        url: String
    },
    location: String,
    country: String,
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref: "Review" // Ensure the reference matches the model name exactly

        },
    ],
    owner:[
        {
            type:Schema.Types.ObjectId,
            ref: "User" // Ensure the reference matches the model name exactly

        }
    ]

});
listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id:{$in:listing.reviews}});
    }
});

const Listing = mongoose.model("Listing", listingSchema); // Capitalized name
module.exports = Listing;
