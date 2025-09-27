import { Button } from "../ui/moving-border.jsx";

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
)

const HarmoniaCTA = () => {
  return (
    <section className="relative py-24">
      <div className="max-w-7xl md:px-8 mr-auto ml-auto pr-6 pl-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-16 ring-1 ring-white/10 backdrop-blur text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6 font-manrope">
            ✨ Want to get paid fast as a creator?
          </h2>

          <Button
            as="a"
            href="#"
            className="text-sm font-medium"
            containerClassName="inline-block"
          >
            <div className="flex items-center space-x-2">
              <span>Start Now</span>
              <ArrowRightIcon />
            </div>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default HarmoniaCTA