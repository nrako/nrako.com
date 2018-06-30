import Meta from './meta'

export default ({ children }) => (
  <React.Fragment>
    <Meta />
    <main>{children}</main>
    <style jsx>{`
      main {
        max-width: 720px;
        margin: 0 auto;
        padding: 2rem 2rem;
      }

      @media (max-width: 500px) {
        main {
          padding: 2rem 1rem;
        }
      }
    `}</style>
  </React.Fragment>
)
