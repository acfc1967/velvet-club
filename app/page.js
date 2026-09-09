export default function Home() {
  return (
    <main className="hero">
      <style dangerouslySetInnerHTML={{ __html: `
        .hero { isolation:isolate; }
        .hero::after { content:""; position:absolute; inset:-25%; z-index:-2; pointer-events:none; background:radial-gradient(circle at 18% 20%,rgba(235,82,164,.16),transparent 24%),radial-gradient(circle at 82% 28%,rgba(116,64,185,.13),transparent 25%),radial-gradient(circle at 52% 82%,rgba(202,49,133,.09),transparent 22%); filter:blur(20px); animation:velvetAurora 18s ease-in-out infinite alternate; }
        .hero::before { z-index:-1; animation:velvetStars 18s linear infinite; }
        .glow { animation:velvetFloat 11s ease-in-out infinite alternate; }
        .glowTwo { animation-delay:-4s; }
        .velvetOrb { position:absolute; border-radius:50%; pointer-events:none; z-index:-1; mix-blend-mode:screen; }
        .velvetOrb.one { width:7px;height:7px;top:28%;left:13%;background:#f5a9d0;box-shadow:0 0 16px 4px rgba(239,143,189,.45);animation:velvetDrift 8s ease-in-out infinite; }
        .velvetOrb.two { width:4px;height:4px;top:46%;right:17%;background:#cda9ff;box-shadow:0 0 14px 3px rgba(164,111,255,.4);animation:velvetDrift 10s ease-in-out -3s infinite; }
        .velvetOrb.three { width:5px;height:5px;top:72%;left:24%;background:#fff0fa;box-shadow:0 0 14px 3px rgba(255,220,242,.35);animation:velvetDrift 12s ease-in-out -6s infinite; }
        .nav { animation:velvetFadeDown .8s cubic-bezier(.22,1,.36,1) both; }
        .heroContent { animation:velvetHeroIn 1.05s cubic-bezier(.22,1,.36,1) .05s both; }
        .featureStrip,.about { animation:velvetRise .9s cubic-bezier(.22,1,.36,1) both; }
        .featureStrip div { position:relative; overflow:hidden; transition:transform .35s ease,background .35s ease,border-color .35s ease; }
        .featureStrip div::after { content:""; position:absolute; left:-120%; top:0; width:80%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent); transform:skewX(-18deg); transition:left .6s ease; }
        .featureStrip div:hover { transform:translateY(-4px); background:rgba(255,255,255,.018); }
        .featureStrip div:hover::after { left:140%; }
        .primary,.secondary,.navButton { position:relative; overflow:hidden; transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease,background .3s ease; }
        .primary::after,.secondary::after,.navButton::after { content:""; position:absolute; top:-80%; left:-120%; width:55%; height:260%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent); transform:rotate(18deg); transition:left .65s ease; }
        .primary:hover,.secondary:hover,.navButton:hover { transform:translateY(-2px); }
        .primary:hover { box-shadow:0 16px 55px rgba(203,64,143,.42),0 0 0 1px rgba(255,180,220,.12) inset; }
        .secondary:hover,.navButton:hover { border-color:#9b5d82; background:rgba(255,255,255,.06); }
        .primary:hover::after,.secondary:hover::after,.navButton:hover::after { left:140%; }
        .brand { cursor:pointer; transition:color .25s,text-shadow .25s,transform .25s; }
        .brand:hover { color:#fff; text-shadow:0 0 18px rgba(239,143,189,.28); transform:translateY(-1px); }
        @keyframes velvetAurora{0%{transform:translate3d(-2%,-1%,0) scale(1)}50%{transform:translate3d(3%,2%,0) scale(1.05)}100%{transform:translate3d(-1%,4%,0) scale(1.02)}}
        @keyframes velvetStars{from{transform:translateY(0)}to{transform:translateY(42px)}}
        @keyframes velvetFloat{0%{transform:translate3d(0,0,0) scale(1)}100%{transform:translate3d(35px,18px,0) scale(1.08)}}
        @keyframes velvetDrift{0%,100%{transform:translate3d(0,0,0);opacity:.35}50%{transform:translate3d(18px,-24px,0);opacity:1}}
        @keyframes velvetFadeDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes velvetHeroIn{from{opacity:0;transform:translateY(28px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes velvetRise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.001ms!important}}
      `}} />

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
