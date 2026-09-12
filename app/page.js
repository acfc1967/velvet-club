export default function Home() {
  const warpRays = Array.from({ length: 96 }, (_, index) => (
    <span
      key={index}
      className="warpRay"
      style={{
        "--angle": `${(index / 96) * 360}deg`,
        "--delay": `${-((index * 0.071) % 2.7).toFixed(2)}s`,
        "--length": `${150 + (index % 7) * 24}px`,
        "--width": `${1 + (index % 4) * 0.7}px`,
        "--hue": index % 5 === 0 ? "#ffb9ec" : index % 3 === 0 ? "#b983ff" : "#f36bd0",
      }}
    />
  ));

  const warpDust = Array.from({ length: 34 }, (_, index) => (
    <span
      key={index}
      className="warpDust"
      style={{
        "--dust-x": `${((index * 37) % 100)}%`,
        "--dust-y": `${((index * 61) % 100)}%`,
        "--dust-delay": `${-((index * 0.43) % 8).toFixed(2)}s`,
        "--dust-size": `${1 + (index % 3)}px`,
      }}
    />
  ));

  return (
    <main className="hero">
      <div className="velvetScene" aria-hidden="true">
        <div className="hyperspaceField">
          {warpRays}
          {warpDust}
        </div>
        <div className="warpNebula" />
        <div className="warpPlanet" />
      </div>

      <nav className="nav">
        <a className="brand" href="/" aria-label="Velvet Club home"><span>✦</span> VELVET</a>
        <a href="#about">About</a>
        <a href="#features">Features</a>
        <a href="#community">Community</a>
        <a className="navButton" href="/dashboard">Member Area</a>
        <a className="navJoin" href="https://discord.gg/MwG6r5cNKt" target="_blank" rel="noopener noreferrer">Join</a>
      </nav>

      <section className="heroContent">
        <p className="eyebrow">WELCOME TO THE VELVET CLUB</p>
        <h1 className="heroTitle">
          <span className="heroTitleMain">More than a&nbsp;server.</span>
          <span className="heroTitleAccent"><em>A place to belong.</em></span>
        </h1>
        <p className="intro">
          A social &amp; gaming community built around good people, late nights,
          shared interests and a little bit of Velvet magic.
        </p>
        <div className="actions">
          <a className="joinClub" href="https://discord.gg/MwG6r5cNKt" target="_blank" rel="noopener noreferrer">✦ Join The Club ✦</a>
          <a className="secondary" href="/api/auth/discord">◇ Explore Velvet ◇</a>
        </div>
        <div className="signature">Same Souls <span>•</span> Brighter Nights ♡</div>
      </section>

      <section className="featureStrip" id="features">
        <div>
          <span className="featureIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><rect x="2" y="6" width="20" height="12" rx="5"/></svg>
          </span>
          <span className="featureTitle">Gaming</span>
          <small>Play together</small>
        </div>
        <div>
          <span className="featureIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          <span className="featureTitle">Community</span>
          <small>Find your people</small>
        </div>
        <div>
          <span className="featureIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </span>
          <span className="featureTitle">Progression</span>
          <small>XP, levels &amp; achievements</small>
        </div>
        <div>
          <span className="featureIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z"/><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15z"/></svg>
          </span>
          <span className="featureTitle">Your identity</span>
          <small>Titles, cosmetics &amp; more</small>
        </div>
      </section>

      <section className="about" id="about">
        <p className="eyebrow">THE VELVET PHILOSOPHY</p>
        <h2>Come for the games.<br /><em>Stay for the people.</em></h2>
        <p>
          Velvet Club is the home outside the server — a place to see your
          progress, show off your profile, collect achievements and keep
          building your place in the community.
        </p>
      </section>

      <section className="velvetManifesto" id="community" aria-label="What makes Velvet different">
        <div className="velvetStory">
          <p className="eyebrow">A COMMUNITY THAT FEELS DIFFERENT</p>
          <h3>Good people.<br /><em>Great vibes.</em><br />Always.</h3>
          <p>
            Come for the games, stay for the conversations, the inside jokes,
            the late-night sessions and the little moments that turn a server
            into somewhere that feels like yours.
          </p>
        </div>
        <div className="velvetPillars">
          <article className="velvetPillar">
            <b>♢</b>
            <h4>Real connections</h4>
            <p>Meet people who share your interests without the noise.</p>
          </article>
          <article className="velvetPillar">
            <b>✦</b>
            <h4>Your journey</h4>
            <p>Earn XP, unlock trophies and build a profile that feels yours.</p>
          </article>
          <article className="velvetPillar">
            <b>♡</b>
            <h4>Good energy</h4>
            <p>A relaxed place for gaming, hanging out and being yourself.</p>
          </article>
          <article className="velvetPillar">
            <b>♛</b>
            <h4>Leave a mark</h4>
            <p>Collect titles, achievements and moments worth showing off.</p>
          </article>
        </div>
      </section>

      <section className="velvetFinal">
        <p className="eyebrow">YOUR PLACE IS WAITING</p>
        <h2>Find your place<br /><em>in the Velvet Club.</em></h2>
        <p>Same Souls • Brighter Nights ♡</p>
        <a className="joinClub" href="https://discord.gg/MwG6r5cNKt" target="_blank" rel="noopener noreferrer">✦ Join Velvet ✦</a>
      </section>
    </main>
  );
}
