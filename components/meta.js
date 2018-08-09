import Head from 'next/head'

export default () => (
  <React.Fragment>
    <Head>
      <title>nrako</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <style jsx global>{`
      body {
        color: #101;
        font: 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        line-height: 1.58;
        margin: 0;
        font-weight: 400;
      }

      h1, h2, h3, h4 {
        font-weight: 500;
        margin-top: 2em;
      }

      p, ul, ol {
        font-family: -apple-system-body, georgia, serif;
      }

      a {
        color: #f00;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      }
      a:hover,
      a:active,
      a:focus {
        color: #fff;
        background: #f00;
        text-decoration: none;
        outline: 0;
      }

      blockquote {
        margin: 0 -1em;
        padding: 0 1em;
        border-left: 0.25em solid #2b303b57;
        background-color: #f8f8f8;
        border-radius: 0.1rem;
        color: #2b303b;
        overflow: hidden;
      }
      @media (max-width: 500px) {
        blockquote {
          margin: 0;
        }
      }

      blockquote p {
        font-family: inherit;
      }

      blockquote blockquote {
        margin: 0 -0.5em;
      }

      pre {
        margin: 2em -1em;
      }
      @media (max-width: 500px) {
        pre {
          margin: 2em 0em;
        }
      }

      code {
        border-radius: 0.2rem;
        border-bottom: 1px solid #2b303b57;
        background-color: #f8f8f8;
        padding: 0 0.25em;
        color: #2b303b;
        letter-spacing: -0.006em;
        font-size: 0.84em;
        line-height: 1.4;
      }

      th {
        font-weight: 500;
      }

      /* Ocean Dark Theme for highlight.js */
      /* https://github.com/gavsiu */
      /* Original theme - https://github.com/chriskempson/base16 */

      /* Ocean Comment */
      .hljs-comment,
      .hljs-quote {
        color: #65737e;
      }

      /* Ocean Red */
      .hljs-variable,
      .hljs-template-variable,
      .hljs-tag,
      .hljs-name,
      .hljs-selector-id,
      .hljs-selector-class,
      .hljs-regexp,
      .hljs-deletion {
        color: #bf616a;
      }

      /* Ocean Orange */
      .hljs-number,
      .hljs-built_in,
      .hljs-builtin-name,
      .hljs-literal,
      .hljs-type,
      .hljs-params,
      .hljs-meta,
      .hljs-link {
        color: #d08770;
      }

      /* Ocean Yellow */
      .hljs-attribute {
        color: #ebcb8b;
      }

      /* Ocean Green */
      .hljs-string,
      .hljs-symbol,
      .hljs-bullet,
      .hljs-addition {
        color: #a3be8c;
      }

      /* Ocean Blue */
      .hljs-title,
      .hljs-section {
        color: #8fa1b3;
      }

      /* Ocean Purple */
      .hljs-keyword,
      .hljs-selector-tag {
        color: #b48ead;
      }

      .hljs {
        display: block;
        overflow-x: auto;
        background: #2b303b;
        color: #c0c5ce;
        padding: 0.5em 1em;
      }

      .hljs-emphasis {
        font-style: italic;
      }

      .hljs-strong {
        font-weight: bold;
      }
    `}</style>
  </React.Fragment>
)
