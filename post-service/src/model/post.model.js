const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    content:{
        type:String,
        required:true
    },
    mediaIds:[{
        type:String
    }],
},{timestamps:true})

//making the content as index for searching if diff search service is not implemented.
postSchema.index({content:'text'})

const postModel = mongoose.model('Post',postSchema)

module.exports = postModel