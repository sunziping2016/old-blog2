module.exports = {
  lang: 'zh',
  title: '橡树屋',
  description: '欢迎来到孙子平的博客',
  plugins: [
    ['@oak-tree-house/vitepress-plugin-blog', {
      classifiers: [
        {
          id: 'post',
          dirname: '_posts',
          title: '文章',
          path: '/',
          lengthPerPage: 10
        },
        {
          id: 'tag',
          dirname: '_posts',
          title: '标签',
          keys: ['tag', 'tags'],
          path: '/tag/',
          lengthPerPage: 10
        }
      ],
    }],
    ['@oak-tree-house/vitepress-plugin-mathjax']
  ]
}
