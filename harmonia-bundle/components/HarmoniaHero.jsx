import { DottedSurface } from "../ui/dotted-surface.jsx";
import { Button } from "../ui/moving-border.jsx";

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
)

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
  </svg>
)

const ClientLogos = () => (
  <section className="relative z-10 sm:py-24 fade-in fade-in-delay-4" style={{opacity: 1, transform: 'translateY(0px)'}}>
    <div className="pr-6 pl-6">
      {/* <div className="text-center mb-8">
        <p className="text-sm text-neutral-400">
          Trusted by mom and Damilola (we're just getting started, but they love us!)
        </p>
      </div> */}

      {/* Horizontal scrolling animation */}
      {/* <div className="overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          <div className="flex items-center space-x-8 text-neutral-500 text-sm font-medium">
            <span>❤️ Mom (our biggest fan)</span>
            <span>🎧 Damilola Ayeni (DJ extraordinaire)</span>
            <span>🚀 Early believers</span>
            <span>✨ Quality over quantity</span>
            <span>🔥 Building something great</span>
            <span>📈 Growing strong</span>
            <span>❤️ Mom (our biggest fan)</span>
            <span>🎧 Damilola Ayeni (DJ extraordinaire)</span>
            <span>🚀 Early believers</span>
            <span>✨ Quality over quantity</span>
            <span>🔥 Building something great</span>
            <span>📈 Growing strong</span>
          </div>
        </div>
      </div> */}

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  </section>
)

const HarmoniaHero = () => {
  return (
    <section className="relative pt-24">
<DottedSurface />
      <div className="max-w-7xl md:px-8 md:pt-16 md:pb-28 mr-auto ml-auto pt-10 pr-6 pb-10 pl-6 relative z-10">
        {/* Pill */}
        {/* <div className="mx-auto mb-6 flex w-full items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 backdrop-blur">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-sm font-normal text-neutral-200 font-sans">Crafting Distinctive Digital Identities</span>
          </div>
        </div> */}

        {/* Headline */}
        <div className="max-w-4xl lg:max-w-6xl text-center mt-12 mr-auto ml-auto space-y-8">
          <h1 className="md:text-7xl lg:text-8xl leading-[0.95] text-3xl font-light text-white tracking-tight font-manrope">
          🚀 The Trustless Marketplace for Creators & Brands
          </h1>
          <p className="md:text-lg text-base text-neutral-400 mt-5">
          Get paid instantly. No invoices. No chasing. Just guaranteed influencer campaigns powered by smart contracts.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-16">
            <Button
              as="a"
              href="#"
              className="text-sm font-medium"
              containerClassName="inline-block"
            >
              <div className="flex items-center space-x-2">
                <span>Launch App</span>
                <ArrowRightIcon />
              </div>
            </Button>

            <button className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/10 transition">
              Join Waitlist
            </button>
          </div>
        </div>

        {/* Client Row */}
        <ClientLogos />
      </div>
    </section>
  )
}

export default HarmoniaHero