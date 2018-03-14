import Layout from '../components/layout'

export default () => (
  <Layout>
    <div className="home">
      <div className="bullsEye">
        <h1>Nicholas Rakotomihamina</h1>
        <nav>
          <a href="https://twitter.com/nrako">Twitter</a>
          <a href="https://github.com/nrako">Github</a>
        </nav>
      </div>
    </div>
    <style jsx>{`
      .home {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: -1;
      }

      .bullsEye {
        flex: none;
        text-align: center;
        max-width: 100%;
      }

      h1 {
        font-size: 1.2em;
        font-weight: normal;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      nav,
      h1 {
        margin: 0.5em;
      }

      a {
        display: inline-block;
        text-decoration: none;
        margin: 0 1em;
        padding: 0.2em;
      }
    `}</style>
  </Layout>
)
