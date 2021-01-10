module.exports = {
  title: '橡树屋',
  description: '欢迎来到孙子平的博客',
  plugins: [
    ['@oak-tree-house/vitepress-plugin-blog', {
      classifiers: [
        {
          id: 'post',
          dirname: '_posts',
          path: '/',
          lengthPerPage: 10
        }
      ],
    }]
  ]
}
