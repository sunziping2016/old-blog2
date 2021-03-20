const path = require('path')

module.exports = {
  lang: 'zh',
  title: '橡树屋',
  description: '欢迎来到孙子平的博客',
  theme: '@tillycode/vitepress-theme-vue',
  // themeConfig: {
  //   nav: [
  //     { text: '标签', link: '/tag/' },
  //     {
  //       text: '其他',
  //       items: [
  //         { text: '关于', link: '/about' },
  //         { text: 'VitePress', link: 'https://vitepress.vuejs.org/' }
  //       ]
  //     }
  //   ],
  //   sidebar: 'auto',
  //   algolia: {
  //     apiKey: '5eac05703da4f5923e426c2e44baa411',
  //     indexName: 'szp'
  //   },
  //   repo: 'sunziping2016/blog',
  //   docsDir: 'site',
  //   editLinks: true,
  //   editLinkText: '在 GitHub 上编辑此页',
  //   lastUpdated: '上次更新'
  // },
  // plugins: [
  //   ['@tillycode/vitepress-plugin-blog', {
  //     classifiers: [
  //       {
  //         id: 'post',
  //         dirname: '_posts',
  //         title: '文章',
  //         path: '/',
  //         lengthPerPage: 10
  //       },
  //       {
  //         id: 'tag',
  //         dirname: '_posts',
  //         title: '标签',
  //         keys: ['tag', 'tags'],
  //         path: '/tag/',
  //         lengthPerPage: 10
  //       }
  //     ],
  //   }],
  //   ['@tillycode/vitepress-plugin-mathjax']
  // ],
  enhanceAppFile: path.resolve(__dirname, 'enhanceApp.js'),
  additionalPages: [{
    path: '/readme/',
    filePath: path.resolve(__dirname, '../../README.md')
  }, {
    path: '/license/',
    filePath: path.resolve(__dirname, '../../LICENSE.md')
  }, {
    path: '/changelog/',
    filePath: path.resolve(__dirname, '../../CHANGELOG.md')
  }, {
    path: '/test/',
    content: '# Test Success'
  }]
}
