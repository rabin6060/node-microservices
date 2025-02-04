const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    token:{
        type:String,
        required:true,
        unique:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    expiresAt:{
        type:Date,
        required:true
    }
},{timestamps:true})

schema.index({expiresAt:1},{expireAfterSeconds:0})

const model = mongoose.model('RefreshToken',schema)
module.exports = model