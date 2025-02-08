const express = require('express')
const { AuthenticateMiddleware } = require('../middlewares/authUser')
const { createPost, getPosts, getPost, deletePost } = require('../controller/post.controller')

const router = express.Router()

router.use(AuthenticateMiddleware)
router.get('/:id',getPost)
router.get('/',getPosts)

router.post('/',createPost)
router.delete('/:id',deletePost)


module.exports = router