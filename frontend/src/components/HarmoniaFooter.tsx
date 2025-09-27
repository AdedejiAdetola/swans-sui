import { Button } from '../components/ui/moving-border'
import Link from 'next/link'
import { useSuiWallet } from '../hooks/useSuiWallet'

const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neutral-200">
    <rect width="18" height="18" x="3" y="3" rx="2"></rect>
    <path d="M3 9h18"></path>
    <path d="M3 15h18"></path>
    <path d="M9 3v18"></path>
    <path d="M15 3v18"></path>
  </svg>
)

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
  </svg>
)

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
)

const HarmoniaFooter = () => {
  const { connected } = useSuiWallet()

  return (
    <footer className="relative border-white/10 border-t">
      {/* Final CTA Section */}
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-16">
        <div className="text-center space-y-8">
          <h2 className="md:text-6xl text-4xl font-light text-white tracking-tight">
            Ready to revolutionize creator payments?
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
            Join SWANS and experience the future of trustless creator-brand collaborations. No more payment delays, no more disputes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            {connected ? (
              <>
                <Button
                  as={Link}
                  href="/brand"
                  className="text-sm font-medium"
                  containerClassName="inline-block"
                >
                  <div className="flex items-center space-x-2">
                    <span>Launch as Brand</span>
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
                    <span>Launch as Creator</span>
                    <ArrowRightIcon />
                  </div>
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-neutral-400">Connect your Sui wallet to get started</p>
                <button className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/15 transition-colors">
                  Connect Wallet
                  <ArrowRightIcon />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Credits */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 ring-1 ring-white/10 shadow-inner">
                <GridIcon />
              </span>
              <span className="text-sm font-medium tracking-tight text-white">SWANS</span>
            </div>

            <p className="text-sm text-neutral-400">
              Powered by Harmonia Suite & Sui Blockchain
            </p>

            <div className="flex items-center gap-4">
              <a href="mailto:hello@swans.com" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15">
                <MailIcon />
                hello@swans.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default HarmoniaFooter