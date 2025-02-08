const Model = require("../model/media.model")
const { deleteMediaFromCloudinary } = require("../utils/cloudinary")
const logger = require("../utils/logger")

const handlePostDeleted= async  (event)=>{
    
    const {postId,mediaIds} = event
    try {
     const deleteMedia = await Model.find({_id:{$in:mediaIds}})
 
     for (const media of deleteMedia){
         await deleteMediaFromCloudinary(media.publicId)
         
         await Model.findByIdAndDelete(media._id)
 
         logger.info("media deleted from cloudinary and media database")
     }
     logger.info(`media deleted for a post : ${postId}`)
   } catch (error) {
    logger.error("media deletion failed",error)
   }
}

module.exports = {handlePostDeleted}