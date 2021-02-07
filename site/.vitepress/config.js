module.exports = {
  lang: 'zh',
  title: '橡树屋',
  description: '欢迎来到孙子平的博客',
  theme: '@oak-tree-house/vitepress-theme-vue',
  themeConfig: {
    nav: [
      { text: '标签', link: '/tag/' },
      {
        text: '其他',
        items: [
          { text: '关于', link: '/about' },
          { text: 'VitePress', link: 'https://vitepress.vuejs.org/' }
        ]
      }
    ],
    // sidebar: {
    //   '/': [
    //     {
    //       text: '编程',
    //       children: [
    //         { text: 'GraphQL学习笔记', link: '/_posts/2020-06-28-graphql-learning-notes' },
    //         { text: 'C++模板（未完待续）', link: '/_posts/2020-07-03-cpp-templates' },
    //         { text: 'TypeScipt学习笔记（未完待续）', link: '/_posts/2019-09-12-typescript-learning-notes' }
    //       ]
    //     },
    //     {
    //       text: '数学',
    //       children: [
    //         { text: '微积分复习笔记（上）', link: '/_posts/2018-11-01-calculus-notes1' },
    //         { text: '线性代数复习笔记（上）', link: '/_posts/2018-10-23-linear-algebra-notes1' }
    //       ]
    //     }
    //   ]
    // },
    sidebar: 'auto',
    algolia: {
      apiKey: '5eac05703da4f5923e426c2e44baa411',
      indexName: 'szp'
    },
    repo: 'sunziping2016/oak-tree-house-next',
    docsDir: 'site',
    editLinks: true,
    editLinkText: '在 GitHub 上编辑此页',
    lastUpdated: '上次更新'
  },
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
