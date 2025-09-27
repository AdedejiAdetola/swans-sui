import { Button } from "../components/ui/moving-border";
import Link from 'next/link';
import { useSuiWallet } from '../hooks/useSuiWallet';

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
)

const HarmoniaCTA = () => {
  const { connected } = useSuiWallet()

  return (
    <section className="relative py-24">
      <div className="max-w-7xl md:px-8 mr-auto ml-auto pr-6 pl-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-16 ring-1 ring-white/10 backdrop-blur text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            ✨ Ready to transform creator economy?
          </h2>
          <p className="text-neutral-300 mb-8 max-w-2xl mx-auto">
            Join SWANS and experience the future of trustless creator-brand collaborations on Sui blockchain.
          </p>

          {connected ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                href="/brand"
                className="text-sm font-medium"
                containerClassName="inline-block"
              >
                <div className="flex items-center space-x-2">
                  <span>Start as Brand</span>
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
                  <span>Start as Creator</span>
                  <ArrowRightIcon />
                </div>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-neutral-400">Connect your wallet to get started</p>
              <button className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/10 transition">
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default HarmoniaCTA