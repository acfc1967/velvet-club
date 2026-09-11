export default function Home() {
  return (
    <main className="hero">
      <style dangerouslySetInnerHTML={{ __html: `
        .heroTitleMain,
        .heroTitleAccent {
          display: block;
        }

        .heroTitleMain {
          white-space: normal;
        }

        .heroTitleAccent {
          margin-top: .12em;
        }

        @media (max-width:700px){
          .heroContent h1.heroTitle{
            width:100%;
            max-width:390px;
            margin:20px auto 24px;
            font-size:43px;
            line-height:.98;
            letter-spacing:-.04em;
            text-wrap:balance;
          }

          .heroTitleMain,
          .heroTitleAccent {
            display:block;
            width:100%;
          }

          .heroTitleAccent {
            margin-top:.28em;
            white-space:nowrap;
          }

          .heroContent .intro{
            max-width:360px;
            font-size:15px;
            line-height:1.65;
          }
        }

        @media (max-width:380px){
          .heroContent h1.heroTitle{font-size:40px;}
          .heroTitleAccent{white-space:normal;}
        }

        .joinClub{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 28px;border-radius:999px;color:#fff;text-decoration:none;font:700 11px Inter,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;background:linear-gradient(135deg,#ef8fbd,#9b55b5);border:1px solid rgba(255,255,255,.22);box-shadow:0 0 35px rgba(239,143,189,.35);transition:.35s ease;animation:joinPulse 4s ease-in-out infinite}
        .joinClub:hover{transform:translateY(-4px) scale(1.03);box-shadow:0 0 55px rgba(239,143,189,.55)}
        .navJoin{display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:999px;color:#f8eef5;text-decoration:none;font:700 10px Inter,Arial,sans-serif;letter-spacing:.14em;background:rgba(239,143,189,.12);border:1px solid rgba(239,143,189,.3);transition:.3s}
        .navJoin:hover{background:rgba(239,143,189,.22);transform:translateY(-2px)}
        @keyframes joinPulse{0%,100%{box-shadow:0 0 30px rgba(239,143,189,.28)}50%{box-shadow:0 0 55px rgba(239,143,189,.5)}}

      `}} />

      <div className="velvetScene" aria-hidden="true">
        <div className="velvetMoon" />
        <div className="velvetHorizon" />
        <div className="velvetNebula a" />
        <div className="velvetNebula b" />
        <div className="velvetNebula c" />
        <span className="velvetPetal p1" />
        <span className="velvetPetal p2" />
        <span className="velvetPetal p3" />
        <span className="velvetPetal p4" />
        <span className="velvetPetal p5" />
        <span className="velvetPetal p6" />
        <span className="velvetPetal p7" />
        <span className="velvetDust d1" />
        <span className="velvetDust d2" />
        <span className="velvetDust d3" />
        <span className="warpStar w1" />
        <span className="warpStar w2" />
        <span className="warpStar w3" />
        <span className="warpStar w4" />
        <span className="warpStar w5" />
        <span className="warpStar w6" />
      </div>

      <nav className="nav">
        <a className="brand" href="/" aria-label="Velvet Club home"><span>✦</span> VELVET</a>
        <a href="#about">About</a>
        <a href="#features">Features</a>
        <a className="navButton" href="/dashboard">Member Area</a><a className="navJoin" href="https://discord.gg/MwG6r5cNKt" target="_blank" rel="noopener noreferrer">JOIN</a>
      </nav>

      <section className="heroContent">
        <p className="eyebrow">WELCOME TO THE VELVET CLUB</p>
        <h1 className="heroTitle">
          <span className="heroTitleMain">More than a&nbsp;server.</span>
          <span className="heroTitleAccent"><em>A place to belong.</em></span>
        </h1>
        <p className="intro">
          A social & gaming community built around good people, late nights,
          shared interests and a little bit of Velvet magic.
        </p>
        <div className="actions">
          <a className="joinClub" href="https://discord.gg/MwG6r5cNKt" target="_blank" rel="noopener noreferrer">✦ Join The Club ✦</a>
          <a className="secondary" href="/api/auth/discord">✧˖°Explore Velvet°˖✧</a>
        </div>
        <div className="signature">Same Souls <span>•</span> Brighter Nights ♡</div>
        <a className="heroScroll" href="#features" aria-label="Explore Velvet"><i />Explore</a>
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
          Velvet Club is the home outside the server — a place to see your
          progress, show off your profile, collect achievements and keep
          building your place in the community.
        </p>
      </section>

      <section className="velvetManifesto" aria-label="What makes Velvet different">
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
