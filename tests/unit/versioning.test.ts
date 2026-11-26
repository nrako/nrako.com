import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { after, test } from 'node:test'

import { type BlogOptions, defaultOptions } from '../../src/lib/blogData.ts'
import {
  getCommitHistory,
  getPostAtVersion,
  isDraftVersion,
  type VersioningOptions,
} from '../../src/lib/gitVersioning.ts'

// The repositories of the tests read no configuration of the machine's
const emptyConfig = join(mkdtempSync(join(tmpdir(), 'git-config-')), 'config')
writeFileSync(emptyConfig, '')
process.env.GIT_CONFIG_GLOBAL = emptyConfig
process.env.GIT_CONFIG_NOSYSTEM = '1'

const directories: string[] = [emptyConfig.replace(/\/config$/, '')]
after(() => {
  for (const directory of directories) {
    rmSync(directory, { recursive: true, force: true })
  }
})

const fence = '```'
function post(text: string) {
  return `---
title: A post
bibliography:
  - a-post.bib
---

${text} [@a-work]

:::{snippet} A caption
:label: ex-a

${fence}html
<p>${text}</p>
${fence}
:::
`
}
function bibliography(title: string) {
  return `@book{a-work, author = {Someone}, title = {${title}}, year = {2020}}\n`
}

/** A repository whose `main` is also its `origin/main` */
function repository() {
  const cwd = mkdtempSync(join(tmpdir(), 'versioning-'))
  directories.push(cwd)
  mkdirSync(join(cwd, 'posts'))

  const git = (...args: string[]) =>
    execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim()
  git('init', '--quiet', '--initial-branch=main')
  git('config', 'user.name', 'Someone')
  git('config', 'user.email', 'someone@example.com')
  git('config', 'commit.gpgsign', 'false')

  const commit = (message: string, files: Record<string, string | null>) => {
    for (const [path, content] of Object.entries(files)) {
      const file = join(cwd, 'posts', path)
      if (content === null) rmSync(file)
      else writeFileSync(file, content)
    }
    git('add', '--all', 'posts')
    git('commit', '--quiet', '--allow-empty', '--message', message)
    return git('rev-parse', 'HEAD')
  }
  const push = () =>
    git('update-ref', 'refs/remotes/origin/main', 'refs/heads/main')

  const options: VersioningOptions = {
    ...(defaultOptions.versioning as VersioningOptions),
    cwd,
  }
  const blogOptions: BlogOptions = { ...defaultOptions, versioning: options }
  return { cwd, git, commit, push, options, blogOptions }
}

test('the history of a post is the commits of origin/main that change it', async () => {
  const repo = repository()
  const first = repo.commit('feat: a post\n\nWith a body.', {
    'a-post.md': post('First'),
    'a-post.bib': bibliography('A first title'),
  })
  repo.commit('chore: another post', { 'another.md': post('Another') })
  // Only the bibliography: no version of the post
  repo.commit('fix: the title of a work', {
    'a-post.bib': bibliography('A second title'),
  })
  const second = repo.commit('fix: a word', { 'a-post.md': post('Second') })
  repo.push()
  // Not pushed: not a version, whose permalink would name a commit that
  // may not stay
  repo.commit('fix: not pushed', { 'a-post.md': post('Third') })

  const history = await getCommitHistory('a-post', repo.options)

  assert.deepEqual(
    history.map(({ sha, shortSha, message, author, verified }) => ({
      sha,
      shortSha,
      message,
      author,
      verified,
    })),
    [
      {
        sha: second,
        shortSha: second.slice(0, 7),
        message: 'fix: a word',
        author: 'Someone',
        verified: false,
      },
      {
        sha: first,
        shortSha: first.slice(0, 7),
        message: 'feat: a post\n\nWith a body.',
        author: 'Someone',
        verified: false,
      },
    ],
  )
  assert.ok(history.every(({ date }) => !Number.isNaN(Date.parse(date))))
})

test("an author is named as the repository's .mailmap names them", async () => {
  const repo = repository()
  writeFileSync(join(repo.cwd, '.mailmap'), 'nrako <someone@example.com>\n')
  repo.commit('feat: a post', { 'a-post.md': post('First') })
  repo.push()

  const history = await getCommitHistory('a-post', repo.options)

  assert.deepEqual(
    history.map(({ author }) => author),
    ['nrako'],
  )
})

test('a post deleted and added again keeps its versions, not its deletion', async () => {
  const repo = repository()
  const first = repo.commit('feat: a post', { 'a-post.md': post('First') })
  repo.commit('chore: unpublish a post', { 'a-post.md': null })
  const again = repo.commit('feat: publish a post again', {
    'a-post.md': post('Again'),
  })
  repo.push()

  const history = await getCommitHistory('a-post', repo.options)

  assert.deepEqual(
    history.map(({ sha }) => sha),
    [again, first],
  )
})

test('a post never committed on origin/main has no history', async () => {
  const repo = repository()
  repo.commit('feat: another post', { 'another.md': post('Another') })
  repo.push()

  assert.deepEqual(await getCommitHistory('a-post', repo.options), [])
})

test('a signature that git checks as good marks the commit verified', async () => {
  const repo = repository()
  const key = join(repo.cwd, 'key')
  execFileSync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-f', key])
  const signers = join(repo.cwd, 'allowed-signers')
  writeFileSync(
    signers,
    `someone@example.com ${readFileSync(`${key}.pub`, 'utf8')}`,
  )
  repo.git('config', 'gpg.format', 'ssh')
  repo.git('config', 'user.signingkey', key)
  repo.git('config', 'gpg.ssh.allowedSignersFile', signers)

  repo.commit('feat: unsigned', { 'a-post.md': post('First') })
  repo.git('config', 'commit.gpgsign', 'true')
  repo.commit('fix: signed', { 'a-post.md': post('Second') })
  repo.push()

  const history = await getCommitHistory('a-post', repo.options)

  assert.deepEqual(
    history.map(({ message, verified }) => ({ message, verified })),
    [
      { message: 'fix: signed', verified: true },
      { message: 'feat: unsigned', verified: false },
    ],
  )
})

test('a shallow clone fails rather than listing fewer versions', async () => {
  const repo = repository()
  repo.commit('feat: a post', { 'a-post.md': post('First') })
  repo.commit('fix: a word', { 'a-post.md': post('Second') })
  repo.push()

  const cwd = mkdtempSync(join(tmpdir(), 'versioning-shallow-'))
  directories.push(cwd)
  execFileSync('git', [
    'clone',
    '--quiet',
    '--depth=1',
    `file://${repo.cwd}`,
    cwd,
  ])

  await assert.rejects(
    getCommitHistory('a-post', { ...repo.options, cwd }),
    /shallow clone/,
  )
})

test('a shallow clone fails as such, whatever its refs', async () => {
  const repo = repository()
  repo.commit('feat: a post', { 'a-post.md': post('First') })
  repo.git('branch', 'other')

  const cwd = mkdtempSync(join(tmpdir(), 'versioning-shallow-'))
  directories.push(cwd)
  execFileSync('git', [
    'clone',
    '--quiet',
    '--depth=1',
    '--branch=other',
    `file://${repo.cwd}`,
    cwd,
  ])
  // A clone of a single branch has no origin/main
  assert.throws(() =>
    execFileSync('git', ['-C', cwd, 'rev-parse', '--verify', 'origin/main'], {
      stdio: 'ignore',
    }),
  )

  await assert.rejects(
    getCommitHistory('a-post', { ...repo.options, cwd }),
    /shallow clone/,
  )
})

test('a ref that does not exist fails', async () => {
  const repo = repository()
  repo.commit('feat: a post', { 'a-post.md': post('First') })

  await assert.rejects(
    getCommitHistory('a-post', repo.options),
    /refs\/remotes\/origin\/main/,
  )
})

test('the history is read from a worktree', async () => {
  const repo = repository()
  const first = repo.commit('feat: a post', { 'a-post.md': post('First') })
  repo.push()

  const cwd = join(mkdtempSync(join(tmpdir(), 'versioning-worktree-')), 'wt')
  directories.push(cwd.replace(/\/wt$/, ''))
  repo.git('worktree', 'add', '--quiet', '-b', 'a-branch', cwd)

  const history = await getCommitHistory('a-post', { ...repo.options, cwd })

  assert.deepEqual(
    history.map(({ sha }) => sha),
    [first],
  )
})

test('a post differs from its latest version when its file was changed', async () => {
  const repo = repository()
  repo.commit('feat: a post', { 'a-post.md': post('First') })
  repo.push()
  const [latest] = await getCommitHistory('a-post', repo.options)
  assert.ok(latest)

  assert.equal(
    await isDraftVersion('a-post', post('First'), latest, repo.options),
    false,
  )
  assert.equal(
    await isDraftVersion('a-post', post('Edited'), latest, repo.options),
    true,
  )
})

test('a version is the post and its bibliography at its commit', async () => {
  const repo = repository()
  const first = repo.commit('feat: a post', {
    'a-post.md': post('First'),
    'a-post.bib': bibliography('A first title'),
  })
  repo.commit('fix: a word and a title', {
    'a-post.md': post('Second'),
    'a-post.bib': bibliography('A second title'),
  })
  repo.push()

  const version = await getPostAtVersion(
    'a-post',
    first.slice(0, 7),
    repo.blogOptions,
  )

  assert.ok(version)
  assert.ok(version.content.includes('<p>First</p>'))
  assert.ok(version.content.includes('A first title'))
  assert.ok(!version.content.includes('A second title'))
})

test("a version's snippets have their pages under the version's", async () => {
  const repo = repository()
  const sha = repo.commit('feat: a post', {
    'a-post.md': post('First'),
    'a-post.bib': bibliography('A title'),
  })
  const shortSha = sha.slice(0, 7)

  const version = await getPostAtVersion('a-post', shortSha, repo.blogOptions)

  assert.ok(version)
  assert.deepEqual(
    version.snippets.map((snippet) => snippet.label),
    ['ex-a'],
  )
  assert.ok(
    version.content.includes(`href="/posts/a-post/${shortSha}/snippets/ex-a"`),
  )
  assert.ok(
    version.content.includes(
      `href="/posts/a-post/${shortSha}/snippets/ex-a?source"`,
    ),
  )
  assert.ok(!version.content.includes('href="/posts/a-post/snippets/'))
})

test('a version is read once for its page and its snippets', async () => {
  const repo = repository()
  const sha = repo.commit('feat: a post', {
    'a-post.md': post('First'),
    'a-post.bib': bibliography('A title'),
  })
  const shortSha = sha.slice(0, 7)

  const [page, snippets] = await Promise.all([
    getPostAtVersion('a-post', shortSha, repo.blogOptions),
    getPostAtVersion('a-post', shortSha, repo.blogOptions),
  ])
  // Nothing left to read: the version comes from what was read before
  rmSync(repo.cwd, { recursive: true, force: true })
  const again = await getPostAtVersion('a-post', shortSha, repo.blogOptions)

  assert.ok(page)
  assert.equal(page, snippets)
  assert.equal(page, again)
})

test('a version whose commit has no such post is none', async () => {
  const repo = repository()
  const sha = repo.commit('feat: another post', {
    'another.md': post('Another'),
  })

  assert.equal(
    await getPostAtVersion('a-post', sha.slice(0, 7), repo.blogOptions),
    null,
  )
})
