const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');

const Blog = mongoose.model('Blog');

const userId = '61368ab0ae5572272ea98602'

module.exports = app => {
  app.get('/api/blogs/:id', async (req, res) => {
    const blog = await Blog.findOne({
      _user: userId,
      _id: req.params.id
    });

    res.send(blog);
  });

  app.get('/api/blogs', async (req, res) => {
    const blogs = await Blog.find({ _user: userId }).cache({ key: userId });

    res.send(blogs);
  });

  app.post('/api/blogs', async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: userId
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });
};
