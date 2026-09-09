export default function Home() {
  return (
    <main className="hero">
      <div className="glow glowOne" />
      <div className="glow glowTwo" />
      <div className="velvetOrb one" />
      <div className="velvetOrb two" />
      <div className="velvetOrb three" />

      <nav className="nav">
        <a className="brand" href="/" aria-label="Velvet Club home"><span>✦</span> VELVET</a>
        <a href="#about">About</a>
        <a href="#features">Features</a>
        <a className="navButton" href="/dashboard">Member Area</a>
      </nav>

      <section className="heroContent">
        <p className="eyebrow">WELCOME TO THE VELVET CLUB</p>
        <h1>More than a server.<br /><em>A place to belong.</em></h1>
        <p className="intro">
          A social & gaming community built around good people, late nights,
          shared interests and a little bit of Velvet magic.
        </p>
        <div className="actions">
          <a className="primary" href="/api/auth/discord">Continue with Discord <span>→</span></a>
          <a className="secondary" href="/dashboard">Preview the Club</a>
        </div>
        <div className="signature">Same Souls <span>•</span> Brighter Nights ♡</div>
      </section>

      <section className="featureStrip" id="features">
        <div><strong>🎮</strong><span>Gaming</span><small>Play together</small></div>
        <div><strong>💬</strong><span>Community</span><small>Find your people</small></div>
        <div><strong>🏆</strong><span>Progression</span><small>XP, levels & achievements</small></div>
        <div><strong>✨</strong><span>Your identity</span><small>Titles, cosmetics & more</small></div>
      </section>

      <section className="about" id="about">
        <p className="eyebrow">THE VELVET PHILOSOPHY</p>
        <h2>Come for the games.<br /><em>Stay for the people.</em></h2>
        <p>
          Velvet Club is becoming the home outside the server — a place to see
          your progress, show off your profile, collect achievements and keep
          building your place in the community.
        </p>
      </section>
    </main>
  );
}
