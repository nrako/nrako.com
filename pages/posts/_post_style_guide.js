import Markdown, { meta } from './_post_style_guide.mdx'
import Post, { components } from '../../components/post'

export default () => (
  <Post meta={meta}>
    <Markdown components={components} />
  </Post>
)
