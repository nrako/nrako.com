const remarkHighlight = require('remark-highlight.js')

const withMDX = require('@zeit/next-mdx')({
  options: {
    mdPlugins: [remarkHighlight],
  },
})

module.exports = withMDX({
  exportPathMap: function() {
    return {
      '/': { page: '/' },
      '/posts/post_style_guide': { page: '/posts/_post_style_guide' },
    }
  },
})
