const express  = require('express')
const { searchPosts } = require('../controller/search.controller')
const { AuthenticateMiddleware } = require('../middlewares/authUser')

const router = express.Router()

router.use(AuthenticateMiddleware)
router.get('/',searchPosts)

module.exports = router