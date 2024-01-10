import { type PageProps } from "$fresh/server.ts";
import BlogLinks from '../../fresh-blog-plugin/components/Links.tsx'

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>nrako.com</title>
        <link rel="stylesheet" href="/styles.css" />
        <BlogLinks title="nrako's thoughts" feedPathPrefix='/blog'  />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
