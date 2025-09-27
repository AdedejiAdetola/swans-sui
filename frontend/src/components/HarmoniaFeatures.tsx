const HarmoniaFeatures = () => {
  const features = [
    {
      icon: "💸",
      title: "Guaranteed Payments",
      description: "Campaign funds are locked in smart contracts. Once you deliver, payment releases instantly."
    },
    {
      icon: "🔥",
      title: "Time Slot Auctions",
      description: "Turn your Friday 7PM post into a bidding war. Sell prime posting times to the highest bidder."
    },
    {
      icon: "⚡",
      title: "No Middlemen, No Delays",
      description: "Automatic payouts, dispute-free campaigns, and performance bonuses built right into the contract."
    }
  ]

  return (
    <section className="relative py-16">
      <div className="max-w-7xl md:px-8 mr-auto ml-auto pr-6 pl-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            What SWANS Does
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="relative group">
              <div className="h-full rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:bg-white/10 hover:ring-white/20">
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-medium text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <button className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/10 transition">
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}

export default HarmoniaFeatures