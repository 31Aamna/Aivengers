const express = require('express')
const { authenticate, optionalAuth } = require('../middleware/auth')
const { publicLimiter, userLimiter } = require('../middleware/rateLimiter')
const { validate, uuidParam } = require('../middleware/validate')
const { createPostSchema, updatePostSchema, resolvePostSchema, listPostsQuerySchema } = require('../schemas/postSchemas')
const posts = require('../services/postService')

const router = express.Router()

router.get('/', optionalAuth, publicLimiter, validate(listPostsQuerySchema, 'query'), async (req, res, next) => {
  try {
    res.json({ data: await posts.listPosts(req) })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', optionalAuth, publicLimiter, validate(uuidParam, 'params'), async (req, res, next) => {
  try {
    res.json({ data: await posts.getPost(req, req.params.id) })
  } catch (error) {
    next(error)
  }
})

router.post('/', authenticate, userLimiter, validate(createPostSchema), async (req, res, next) => {
  try {
    res.status(201).json({ data: await posts.createPost(req, req.body) })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', authenticate, userLimiter, validate(uuidParam, 'params'), validate(updatePostSchema), async (req, res, next) => {
  try {
    res.json({ data: await posts.updatePost(req, req.params.id, req.body) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', authenticate, userLimiter, validate(uuidParam, 'params'), async (req, res, next) => {
  try {
    res.json({ data: await posts.deletePost(req, req.params.id) })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/resolve', authenticate, userLimiter, validate(uuidParam, 'params'), validate(resolvePostSchema), async (req, res, next) => {
  try {
    res.json({ data: await posts.resolvePost(req, req.params.id, req.body.resolution_note) })
  } catch (error) {
    next(error)
  }
})

module.exports = router
