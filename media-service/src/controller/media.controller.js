const { uploadImageToCloudinary } = require('../utils/cloudinary')
const logger = require('../utils/logger')
const Media = require('../model/media.model')

const uploadMedia = async(req,res)=>{
    logger.info("media uploading started...")
    try {
        console.log(req.file)
        if (!req.file) {
            logger.error("please upload a file")
            return res.status(400).json({
                success:false,
                message:'please upload a file'
            })
        }
        const {originalname,mimetype} = req.file
        const userId = req.user.userId
        const result = await uploadImageToCloudinary(req.file)
        const media = new Media({publicId:result.public_id,originalName:originalname,mimeType:mimetype,userId,url:result.secure_url})
        await media.save()
        res.status(201).json({
            success:true,
            mediaId:media._id,
            url:media.url,
            mesage:"media uploaded successfully"
        })

    } catch (error) {
        logger.error("Media Upload Failed")
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

const deleteMedia = async(req,res)=>{
    logger.info("deleting media started...")
    try {
        
    } catch (error) {
        logger.error("Media Deletion Failed")
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

module.exports = {uploadMedia,deleteMedia}