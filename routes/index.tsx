import { define } from '../utils.ts'

export default define.page(function Home() {
  return (
    <div class='flex flex-col items-center justify-center px-4 py-32 gap-4'>
      <h1 class='text-4xl md:text-6xl font-bold'>
        Hello, I'm Nicholas.
      </h1>
      <p class='text-lg md:text-xl text-center max-w-2xl'>
        Frontend and fullstack Web developer based in Switzerland, coding since
        before IE6. I’m a strong advocate for the ShapeUp methodology, driving
        iterative development, design and guiding teams toward impactful
        results.
      </p>
    </div>
  )
})
