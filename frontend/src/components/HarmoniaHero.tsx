import { DottedSurface } from "../components/ui/dotted-surface";
import { Button } from "../components/ui/moving-border";
import Link from 'next/link';
import { useSuiWallet } from '../hooks/useSuiWallet';

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
)

const HarmoniaHero = () => {
  const { connected } = useSuiWallet()

  return (
    <section className="relative pt-24">
      <DottedSurface />
      <div className="max-w-7xl md:px-8 md:pt-16 md:pb-28 mr-auto ml-auto pt-10 pr-6 pb-10 pl-6 relative z-10">
        {/* Headline */}
        <div className="max-w-4xl lg:max-w-6xl text-center mt-12 mr-auto ml-auto space-y-8">
          <h1 className="md:text-7xl lg:text-8xl leading-[0.95] text-3xl font-light text-white tracking-tight">
          🚀  The Trustless Marketplace for Creators & Brands
          </h1>
          <p className="md:text-lg text-base text-neutral-400 mt-5">
            Get paid instantly. No invoices. No chasing. Just guaranteed influencer campaigns powered by smart contracts on Sui blockchain.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-16">
            {connected ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  as={Link}
                  href="/brand"
                  className="text-sm font-medium"
                  containerClassName="inline-block"
                >
                  <div className="flex items-center space-x-2">
                    <span>For Brands</span>
                    <ArrowRightIcon />
                  </div>
                </Button>

                <Button
                  as={Link}
                  href="/creator"
                  className="text-sm font-medium"
                  containerClassName="inline-block"
                >
                  <div className="flex items-center space-x-2">
                    <span>For Creators</span>
                    <ArrowRightIcon />
                  </div>
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-neutral-400">Connect your Sui wallet to get started</p>
                <button className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/10 transition">
                  Connect Wallet to Launch
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HarmoniaHero