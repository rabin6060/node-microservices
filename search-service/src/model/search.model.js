const mongoose = require('mongoose')

const searchSchema = new mongoose.Schema({
    postId : {
        type:String,
        unique:true,
        required:true
    },
    userId : {
        type:String,
        index:true,
        required:true,
    },
    content : {
        type:String,
        required:true
    },
},{timestamps:true})

//make content as index for making search ease
searchSchema.index({content:"text"})
searchSchema.index({createdAt:-1,userId:1})

const searchModel = mongoose.model('Search',searchSchema)

module.exports = searchModel