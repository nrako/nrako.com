import Head from "next/head";

export default () => (
  <div>
    <Head>
      <title>nrako</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <style jsx global>{`
      * {
        margin: 0;
        box-sizing: border-box;
      }

      body {
        color: #101;
        font: 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
          Arial, sans-serif;
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
    `}</style>
  </div>
);
