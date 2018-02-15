const chalk = require('chalk')
const puppeteer = require('puppeteer')
const rimraf = require('rimraf')
const os = require('os')
const path = require('path')
const server = require('./server')

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

module.exports = async function() {
  console.log(chalk.green('Teardown Puppeteer'))
  await global.__BROWSER__.close()
  rimraf.sync(DIR)
  console.log(chalk.green('Teardown Test Server'))
  const instance = await server
  await instance.close()
}
