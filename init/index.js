const mongoose=require("mongoose");
const initdata=require("./data.js");
const Listing = require("../models/listing.js");
const mongo_url = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(mongo_url);
}

main()
    .then(() => console.log("Connected to DB"))
    .catch(err => console.log(err));

const initDb=async()=>{
    await Listing.deleteMany({});
    initdata.data=initdata.data.map((obj)=>({...obj,owner:'67b91b906d858f06ebe5249d'}))
    await Listing.insertMany(initdata.data)
    console.log("data was initlized ")
}

initDb();