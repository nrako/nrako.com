/**
 * Permanently redirects www.nrako.com to nrako.com, keeping the path and the
 * query string, so the site has a single canonical host.
 *
 * This is a separate Worker because the site itself is deployed as static
 * assets only, and the `_redirects` file cannot match on the host.
 */
export default {
  fetch(request: Request): Response {
    const url = new URL(request.url)
    url.protocol = 'https:'
    url.hostname = 'nrako.com'
    url.port = ''

    return Response.redirect(url.toString(), 301)
  },
}
