import { define } from '../utils.ts'
import HeroText from '../islands/HeroText.tsx'

export default define.page(function Home() {
  return (
    <div class='flex flex-col items-center justify-center px-4 py-32 gap-4'>
      <h1 class='text-4xl md:text-6xl font-bold'>
        Hello, I'm Nicholas.
      </h1>
      <HeroText />
    </div>
  )
})
