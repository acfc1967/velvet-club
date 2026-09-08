export default function Home() {
  return (
    <main className="hero">
      <div className="glow glowOne" />
      <div className="glow glowTwo" />
      <nav className="nav">
        <div className="brand"><span>✦</span> VELVET</div>
        <a href="#about">About</a>
        <a href="#features">Features</a>
        <a className="navButton" href="#join">Join Velvet</a>
      </nav>

      <section className="heroContent">
        <p className="eyebrow">WELCOME TO THE VELVET CLUB</p>
        <h1>More than a server.<br /><em>A place to belong.</em></h1>
        <p className="intro">
          A social & gaming community built around good people, late nights,
          shared interests and a little bit of Velvet magic.
        </p>
        <div className="actions" id="join">
          <a className="primary" href="https://discord.com">Enter the Velvet Club <span>→</span></a>
          <a className="secondary" href="#features">Explore Velvet</a>
        </div>
        <div className="signature">Same Souls <span>•</span> Brighter Nights ♡</div>
      </section>

      <section className="featureStrip" id="features">
        <div><strong>🎮</strong><span>Gaming</span><small>Play together</small></div>
        <div><strong>💬</strong><span>Community</span><small>Find your people</small></div>
        <div><strong>🎨</strong><span>Make it yours</span><small>Be unmistakably you</small></div>
        <div><strong>✨</strong><span>Always evolving</span><small>More to discover</small></div>
      </section>

      <section className="about" id="about">
        <p className="eyebrow">THE VELVET PHILOSOPHY</p>
        <h2>Come for the games.<br /><em>Stay for the people.</em></h2>
        <p>Velvet is built to feel less like another Discord server and more like somewhere you actually want to return to.</p>
      </section>
    </main>
  );
}
