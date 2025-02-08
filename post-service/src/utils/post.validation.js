const Joi = require('joi')


const validatePost = (data)=>{
    const userSchema = Joi.object({
        content: Joi.string().min(10).max(200).required(),
        mediaIds:Joi.array()
    })

    return userSchema.validate(data)
}



module.exports = {validatePost}