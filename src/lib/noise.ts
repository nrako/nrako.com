/**
 * The site's noise: what a text is made of while it turns into another one,
 * or into nothing. The header's "About" link and the sentence the homepage's
 * introduction starts from both go through it. Its colour fringes are
 * `--noise-fringe` in `global.css`.
 */
const NOISE = '░▒▓█▚▞<>/#_'

/** Milliseconds a frame of noise stays on screen */
export const NOISE_FRAME = 45

/** One character of noise */
export const noise = () => NOISE[Math.floor(Math.random() * NOISE.length)]
