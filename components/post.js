import Head from 'next/head'
import Layout from './layout'

export default ({ meta, children }) => (
  <Layout>
    <Head>
      <title>{meta.title}</title>
    </Head>
    <article className="post">
      <header className="post-header">
        <h1>
          {meta.title}
          <small>{meta.description}</small>
        </h1>
        <time className="time" dateTime={meta.date}>{meta.date}</time>
      </header>
      {children}
    </article>

    <style jsx>{`
      .post-header {
        border-bottom: 1px solid #ddd;
        text-align: center;
        padding-bottom: 1em;
        margin-bottom: 3em;
      }
      .post-header h1 {
        margin-top: 1em;
        margin-bottom: 0.25em;
        font-weight: 300;
        font: 2.2em -apple-system-body, georgia, serif;
      }
      .post-header small {
        display: block;
        font: italic 400 0.5em georgia;
      }

      .time {
        color: #999;
        font-weight: 200;
        font-size: 0.8em;
      }
    `}</style>

    <style jsx global>{`
      .post > div > p:first-child {
        font-size: 1.25em;
      }

      .post table {
        margin: 2em auto;
        border-spacing: 0.5em 0;
        font-size: 0.75em;
      }

      .post table th,
      .post table tr:not(:last-child) td {
        border-bottom: 1px solid #ddd;
      }

      .post table th {
        border-bottom: 1px solid #101;
      }

      .post th,
      .post td {
        padding: 0.5em;
      }

      .post hr {
        margin: 2em auto;
        border: 0;
        text-align: center;
      }
      .post hr::before {
        display: inline-block;
        letter-spacing: 0.2em;
        font-size: 1.8em;
      }
      .post hr:nth-of-type(3n+1)::before {
        content: '🁅🁛🀵';
      }
      .post hr:nth-of-type(3n+2)::before {
        content: '🁐🁻🁇';
        letter-spacing: 0.1em;
      }
      .post hr:nth-of-type(3n+0)::before {
        content: '🁄🁗🁈';
      }
    `}</style>
  </Layout>
)

export const components = {}
