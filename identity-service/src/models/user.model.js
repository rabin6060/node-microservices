const mongoose = require('mongoose')
const argon = require('argon2')

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:()=>Date.now(),
        immutable:true
    }
},{timestamps:true})

userSchema.pre("save",async function (next) {
    try {
        this.password = await argon.hash(this.password)
        
    } catch (error) {
        return next(error)
    }
})

userSchema.methods.comparePassword = async function (password){
    try {
       return await argon.verify(this.password,password)
    } catch (error) {
        throw error
    }
}
//for search operation, make the username index
userSchema.index({username:'text'})

const userModel = mongoose.model('User',userSchema)
module.exports = userModel