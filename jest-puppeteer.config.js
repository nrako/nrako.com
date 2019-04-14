module.exports = {
  server: {
    command: 'next start -p 3001',
  },
  launch: {
    // headless: false,
    // devtools: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  },
}
