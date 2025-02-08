const cloudinary = require('cloudinary').v2
const logger = require('./logger')

cloudinary.config({
    secure:true
})

const uploadImageToCloudinary = (file) => {
    return new Promise((resolve,reject)=>{
        const upload = cloudinary.uploader.upload_stream((err,uploadResult)=>{
            if (err) {
                logger.error("image upload failed")
                reject(err)
            }
            resolve(uploadResult)
            logger.info("image successfully uploaded to cloudinary")
            
        })
        upload.end(file.buffer)
    })
}

const deleteMediaFromCloudinary =async (publicId)=>{
 
        try {
            const result = await cloudinary.uploader.destroy(publicId)
            logger.info("media deleted")
            return result
        } catch (error) {
            logger.error("media deletion failed")
        }
}



module.exports = {uploadImageToCloudinary,deleteMediaFromCloudinary}
