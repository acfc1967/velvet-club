import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

async function getSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const token = (await cookies()).get('velvet_session')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
}

function supabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getDashboardData(discordId) {
  if (!discordId) return { profile: null, achievements: [], titles: [], leaderboard: [] };
  const supabase = supabaseClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('discord_id', discordId).single();
  if (profileError) console.error('VELVET PROFILE ERROR:', profileError);

  const { data: achievementLinks, error: achievementLinksError } = await supabase
    .from('member_achievements').select('achievement_id, unlocked_at')
    .eq('discord_id', discordId).order('unlocked_at', { ascending: false });
  if (achievementLinksError) console.error('VELVET ACHIEVEMENT LINK ERROR:', achievementLinksError);

  let achievements = [];
  if (!achievementLinksError && achievementLinks?.length) {
    const ids = achievementLinks.map(item => item.achievement_id);
    const { data: definitions, error: definitionsError } = await supabase
      .from('achievements')
      .select('id, achievement_name, description, rarity, icon, xp_reward, coin_reward')
      .in('id', ids);
    if (definitionsError) console.error('VELVET ACHIEVEMENT DEFINITIONS ERROR:', definitionsError);
    const byId = new Map((definitions || []).map(item => [item.id, item]));
    achievements = achievementLinks
      .map(item => ({ unlocked_at: item.unlocked_at, achievements: byId.get(item.achievement_id) || null }))
      .filter(item => item.achievements);
  }

  const { data: titleLinks, error: titleLinksError } = await supabase
    .from('member_titles').select('title_id, unlocked_at, equipped').eq('discord_id', discordId);
  if (titleLinksError) console.error('VELVET TITLE LINK ERROR:', titleLinksError);

  let titles = [];
  if (!titleLinksError && titleLinks?.length) {
    const ids = titleLinks.map(item => item.title_id);
    const { data: definitions, error: definitionsError } = await supabase
      .from('titles').select('id, title_name').in('id', ids);
    if (definitionsError) console.error('VELVET TITLE DEFINITIONS ERROR:', definitionsError);
    const byId = new Map((definitions || []).map(item => [item.id, item]));
    titles = titleLinks
      .map(item => ({ unlocked_at: item.unlocked_at, equipped: item.equipped === true, titles: byId.get(item.title_id) || null }))
      .filter(item => item.titles);
  }

  const { data: leaderboard, error: leaderboardError } = await supabase
    .from('profiles').select('display_name, level, xp, title, avatar_url')
    .order('xp', { ascending: false }).limit(5);
  if (leaderboardError) console.error('VELVET LEADERBOARD ERROR:', leaderboardError);

  return { profile, achievements, titles, leaderboard: leaderboard || [] };
}

export default async function Dashboard() {
  const session = await getSession();
  const discordId = session?.id || session?.discord_id || null;
  const { profile, achievements, titles, leaderboard } = await getDashboardData(discordId);

  const displayName = profile?.display_name || session?.username || 'Velvet Member';
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url || null;
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const coins = profile?.coins || 0;
  const currentTitle = titles.find(item => item.equipped)?.titles?.title_name || profile?.title || 'New Member';
  const nextLevelXP = 5000;
  const progress = Math.min((xp / nextLevelXP) * 100, 100);
  const xpRemaining = Math.max(nextLevelXP - xp, 0);

  const rarityClass = rarity => `rarity rarity-${String(rarity || 'Common').toLowerCase()}`;
  const formatDate = date => date ? new Date(date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '';

  return (
    <main className="dashboardShell velvetPortal">
      <style dangerouslySetInnerHTML={{ __html: `
        .velvetPortal{min-height:100vh;position:relative;overflow:hidden;background:#08060b;color:#f8f2f7;isolation:isolate}
        .velvetPortal:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-5;background:radial-gradient(circle at 12% 12%,rgba(231,75,164,.18),transparent 28%),radial-gradient(circle at 88% 22%,rgba(118,67,210,.16),transparent 30%),radial-gradient(circle at 52% 90%,rgba(218,54,151,.11),transparent 28%);animation:velvetNebula 18s ease-in-out infinite alternate}
        .velvetPortal:after{content:"";position:fixed;inset:0;pointer-events:none;z-index:-4;opacity:.3;background-image:radial-gradient(circle at 20% 30%,#fff 0 1px,transparent 1.5px),radial-gradient(circle at 75% 70%,#fff 0 1px,transparent 1.5px),radial-gradient(circle at 55% 15%,#fff 0 1px,transparent 1.5px);background-size:170px 170px,230px 230px,310px 310px;animation:starDrift 30s linear infinite}
        .velvetAmbient{position:fixed;border-radius:50%;filter:blur(70px);pointer-events:none;z-index:-3;opacity:.22}
        .velvetAmbient.a{width:360px;height:360px;left:-160px;top:30%;background:#d948a0;animation:ambientA 12s ease-in-out infinite alternate}
        .velvetAmbient.b{width:420px;height:420px;right:-190px;bottom:8%;background:#7650c8;animation:ambientB 15s ease-in-out infinite alternate}
        .velvetLayout{position:relative;z-index:1}
        .velvetTopline{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
        .velvetBack{display:inline-flex;align-items:center;gap:9px;color:#9d8b9b;font:500 11px/1 Inter,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;transition:.3s}
        .velvetBack:hover{color:#f4a5ca;transform:translateX(-3px)}
        .velvetHero{position:relative;margin-bottom:34px;padding:34px 38px;border:1px solid rgba(255,255,255,.09);border-radius:30px;background:linear-gradient(135deg,rgba(255,255,255,.055),rgba(255,255,255,.018));backdrop-filter:blur(18px);box-shadow:0 25px 80px rgba(0,0,0,.25),inset 0 1px rgba(255,255,255,.05);overflow:hidden}
        .velvetHero:after{content:"";position:absolute;width:300px;height:300px;right:-120px;top:-160px;border-radius:50%;background:rgba(232,91,164,.13);filter:blur(20px);animation:heroOrb 10s ease-in-out infinite alternate}
        .velvetHeroInner{display:flex;align-items:center;gap:24px;position:relative;z-index:1}
        .velvetAvatarWrap{width:88px;height:88px;padding:3px;border-radius:28px;background:linear-gradient(135deg,#ef8fbd,#7040a4);box-shadow:0 0 35px rgba(224,77,158,.24);animation:avatarGlow 4s ease-in-out infinite}
        .velvetAvatar{width:100%;height:100%;border-radius:25px;background:#211524 center/cover no-repeat;display:grid;place-items:center;font:500 32px 'Playfair Display',Georgia,serif;color:#f6b4d2}
        .velvetHero .eyebrow{margin:0 0 10px}
        .velvetHero h1{margin:0;font:400 clamp(38px,5vw,64px)/.98 'Playfair Display',Georgia,serif;letter-spacing:-.045em}
        .velvetHero h1 em{font-style:italic;color:#ef8fbd;text-shadow:0 0 28px rgba(239,143,189,.16)}
        .velvetHeroSub{margin:12px 0 0;color:#a999a7;font:14px/1.6 Inter,Arial,sans-serif}
        .velvetBadge{margin-left:auto;align-self:flex-start;padding:10px 14px;border:1px solid rgba(239,143,189,.25);border-radius:999px;color:#e8a4c6;background:rgba(217,78,150,.07);font:600 10px Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
        .gridStats .statCard{position:relative;overflow:hidden;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));border:1px solid rgba(255,255,255,.09);border-radius:24px;box-shadow:0 18px 50px rgba(0,0,0,.18);backdrop-filter:blur(16px)}
        .gridStats .statCard:before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 35%,rgba(255,255,255,.07),transparent 65%);transform:translateX(-130%);animation:cardSheen 6s ease-in-out infinite}
        .gridStats .statCard:nth-child(2):before{animation-delay:1s}.gridStats .statCard:nth-child(3):before{animation-delay:2s}.gridStats .statCard:nth-child(4):before{animation-delay:3s}
        .statCard .statIcon{border-radius:15px;background:rgba(231,89,164,.09);border:1px solid rgba(231,89,164,.12)}
        .statCard small{font:600 10px Inter,Arial,sans-serif;letter-spacing:.16em;color:#8f7d8c}
        .statCard strong{font-family:'Playfair Display',Georgia,serif}
        .statCard em{font-family:Inter,Arial,sans-serif;font-style:normal;color:#8f7d8c;font-size:11px}
        .contentGrid .panel{position:relative;background:linear-gradient(145deg,rgba(255,255,255,.048),rgba(255,255,255,.014));border:1px solid rgba(255,255,255,.085);border-radius:26px;box-shadow:0 20px 65px rgba(0,0,0,.2);backdrop-filter:blur(16px);overflow:hidden}
        .contentGrid .panel:before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(239,143,189,.32),transparent)}
        .panelHeader h2{font-family:Inter,Arial,sans-serif;font-size:10px;letter-spacing:.18em;font-weight:700}
        .panelHeader>span{font:500 10px Inter,Arial,sans-serif;color:#756977}
        .achievement{display:flex;gap:16px;padding:17px 10px;border-bottom:1px solid rgba(255,255,255,.055);border-radius:16px;transition:.3s}
        .achievement:last-child{border-bottom:0}.achievement:hover{background:rgba(224,75,157,.045);transform:translateX(4px)}
        .achievementBadge{flex:0 0 52px;width:52px;height:52px;display:grid;place-items:center;border-radius:17px;background:linear-gradient(145deg,rgba(235,82,164,.12),rgba(111,66,174,.08));border:1px solid rgba(235,132,190,.15);font-size:23px}
        .achievementText{min-width:0}.achievementText strong{display:block;font:500 17px 'Playfair Display',Georgia,serif;color:#f6eef4}.achievementText>small{display:block;margin-top:3px;color:#9d8f9d;font:12px/1.5 Inter,Arial,sans-serif}
        .achievementMeta{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.achievementMeta span{padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.065);color:#c9bdc7;font:500 10px Inter,Arial,sans-serif}.achievementMeta .rarity{font-weight:700;letter-spacing:.08em}.rarity-common{color:#c7c2ca!important}.rarity-rare{color:#ef8fbd!important;border-color:rgba(239,143,189,.22)!important}.rarity-epic{color:#bb9aff!important;border-color:rgba(187,154,255,.22)!important}.rarity-legendary{color:#f3cf7b!important;border-color:rgba(243,207,123,.24)!important}
        .achievementDate{margin-top:8px!important;color:#6f6270!important;font-size:10px!important}
        .xpBar{height:12px;border-radius:999px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.06);padding:2px;overflow:hidden}.xpFill{height:100%;border-radius:999px;background:linear-gradient(90deg,#d94e96,#9b55b5,#ef8fbd);box-shadow:0 0 22px rgba(217,78,150,.35);position:relative}.xpFill:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);animation:xpSweep 2.8s ease-in-out infinite}
        .rank{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:14px;padding:13px 10px;border-radius:15px;transition:.3s}.rank:hover{background:rgba(217,78,150,.045);transform:translateX(4px)}.rankNum{font:500 13px 'Playfair Display',Georgia,serif;color:#8f7d8c}.rank strong{font:500 15px 'Playfair Display',Georgia,serif}.rank small{display:block;color:#756977;font:10px Inter,Arial,sans-serif;margin-top:2px}.rank b{font:600 12px Inter,Arial,sans-serif;color:#d8cbd6;text-align:right}
        .emptyState{padding:25px 10px;color:#8f7d8c}.emptyState strong{font:500 17px 'Playfair Display',Georgia,serif;color:#e5dbe3}.emptyState p{font:12px Inter,Arial,sans-serif}
        @keyframes velvetNebula{0%{transform:scale(1) translate3d(0,0,0)}100%{transform:scale(1.1) translate3d(2%,-1%,0)}}@keyframes starDrift{from{transform:translate3d(0,0,0)}to{transform:translate3d(35px,45px,0)}}@keyframes ambientA{from{transform:translate(0,0)}to{transform:translate(90px,-70px)}}@keyframes ambientB{from{transform:translate(0,0)}to{transform:translate(-80px,-50px)}}@keyframes heroOrb{from{transform:translate(0,0) scale(1)}to{transform:translate(-50px,35px) scale(1.25)}}@keyframes avatarGlow{0%,100%{box-shadow:0 0 25px rgba(224,77,158,.2)}50%{box-shadow:0 0 42px rgba(224,77,158,.38)}}@keyframes cardSheen{0%,55%{transform:translateX(-130%)}75%,100%{transform:translateX(130%)}}@keyframes xpSweep{0%,45%{transform:translateX(-120%)}75%,100%{transform:translateX(120%)}}
        @media(max-width:760px){.velvetHero{padding:26px 22px}.velvetHeroInner{align-items:flex-start}.velvetAvatarWrap{width:68px;height:68px;border-radius:22px}.velvetAvatar{border-radius:19px;font-size:25px}.velvetHero h1{font-size:36px}.velvetBadge{display:none}.velvetTopline{margin-bottom:18px}.gridStats .statCard{border-radius:20px}.contentGrid .panel{border-radius:22px}.achievementText strong{font-size:16px}.achievementBadge{flex-basis:46px;width:46px;height:46px}}
        @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
      `}} />

      <div className="velvetAmbient a" /><div className="velvetAmbient b" />
      <div className="dashboardGlow" />

      <div className="dashboardLayout velvetLayout">
        <aside className="sidebar">
          <a className="sideBrand" href="/" aria-label="Return to Velvet Club home"><span>✦</span> VELVET</a>
          <div className="sideLabel">MEMBER AREA</div>
          <nav className="sideNav">
            <a className="active" href="#top"><span>✦</span>Overview</a>
            <a href="#progress"><span>◇</span>Progress</a>
            <a href="#achievements"><span>🏆</span>Achievements</a>
            <a href="#titles"><span>👑</span>Titles</a>
            <a href="#leaderboard"><span>♢</span>Leaderboard</a>
          </nav>
          <div className="sideBottom"><small>VELVET MEMBER</small><strong>{displayName}</strong></div>
        </aside>

        <section className="mainPanel" id="top">
          <header className="topbar velvetTopline">
            <a className="mobileBrand" href="/" aria-label="Return to Velvet Club home"><span>✦</span> VELVET</a>
            <a className="velvetBack" href="/"><span>←</span> Return to the Club</a>
            <div className="profileChip">
              <div className="avatar" style={avatarUrl ? {backgroundImage:`url(${avatarUrl})`} : undefined}>{!avatarUrl && initial}</div>
              <span>{displayName}</span>
            </div>
          </header>

          <section className="velvetHero">
            <div className="velvetHeroInner">
              <div className="velvetAvatarWrap"><div className="velvetAvatar" style={avatarUrl ? {backgroundImage:`url(${avatarUrl})`} : undefined}>{!avatarUrl && initial}</div></div>
              <div><p className="eyebrow">YOUR VELVET PROFILE</p><h1>Welcome back, <em>{displayName}.</em></h1><p className="velvetHeroSub">Your journey, your achievements, your place in the Club.</p></div>
              <div className="velvetBadge">✦ {currentTitle}</div>
            </div>
          </section>

          <section className="gridStats">
            <div className="statCard"><div className="statIcon">✦</div><small>LEVEL</small><strong>{level}</strong><em>{currentTitle}</em></div>
            <div className="statCard"><div className="statIcon">◇</div><small>VELVET XP</small><strong>{xp.toLocaleString()}</strong><em>/ {nextLevelXP.toLocaleString()}</em></div>
            <div className="statCard"><div className="statIcon">◆</div><small>COINS</small><strong>{coins.toLocaleString()}</strong><em>Velvet Coins</em></div>
            <div className="statCard"><div className="statIcon">🏆</div><small>ACHIEVEMENTS</small><strong>{achievements.length}</strong><em>earned</em></div>
          </section>

          <section className="contentGrid">
            <div className="panel" id="progress">
              <div className="panelHeader"><h2>YOUR PROGRESS</h2><span>LEVEL {level}</span></div>
              <p style={{color:'#b5a7b3',fontSize:13,marginBottom:14}}>Level {level} <span style={{color:'#716471'}}>•</span> {currentTitle}</p>
              <div className="xpBar"><div className="xpFill" style={{width:`${progress}%`}} /></div>
              <div className="xpMeta"><span>{xp.toLocaleString()} XP</span><span>{nextLevelXP.toLocaleString()} XP</span></div>
              <div style={{color:'#786b77',fontSize:10,marginTop:14}}>{xpRemaining.toLocaleString()} XP until level {level + 1}</div>
            </div>

            <div className="panel" id="achievements">
              <div className="panelHeader"><h2>RECENT ACHIEVEMENTS</h2><span>{achievements.length} earned</span></div>
              {achievements.length ? achievements.map((item,index) => { const a=item.achievements; return (
                <div className="achievement" key={`${a.id}-${index}`}>
                  <div className="achievementBadge">{a.icon || '🏆'}</div>
                  <div className="achievementText"><strong>{a.achievement_name}</strong><small>{a.description}</small><div className="achievementMeta"><span className={rarityClass(a.rarity)}>{String(a.rarity || 'Common').toUpperCase()}</span><span>⭐ +{a.xp_reward || 0} XP</span><span>🪙 +{a.coin_reward || 0} Coins</span></div><small className="achievementDate">Unlocked {formatDate(item.unlocked_at)}</small></div>
                </div>
              ); }) : <div className="emptyState"><strong>No achievements yet</strong><p>Unlock achievements as your Velvet journey continues.</p></div>}
            </div>

            <div className="panel" id="titles">
              <div className="panelHeader"><h2>YOUR TITLES</h2><span>{titles.length} unlocked</span></div>
              {titles.length ? titles.map((item,index) => <div className="achievement" key={`${item.titles?.title_name}-${index}`}><div className="achievementBadge">{item.equipped ? '👑' : '✦'}</div><div className="achievementText"><strong>{item.titles?.title_name || 'Unknown Title'}</strong><small>{item.equipped ? 'Currently equipped' : 'Unlocked title'}</small>{item.unlocked_at && <small className="achievementDate">Unlocked {formatDate(item.unlocked_at)}</small>}</div></div>) : <div className="emptyState"><strong>No titles yet</strong><p>Unlock titles as your Velvet journey continues.</p></div>}
            </div>

            <div className="panel" id="leaderboard">
              <div className="panelHeader"><h2>LEADERBOARD</h2><span>TOP 5</span></div>
              {leaderboard.length ? <div className="rankList">{leaderboard.map((member,index) => <div className="rank" key={`${member.display_name}-${index}`}><div className="rankNum">{String(index+1).padStart(2,'0')}</div><div><strong>{member.display_name || 'Velvet Member'}</strong><small>Level {member.level || 1}</small></div><div><b>{Number(member.xp || 0).toLocaleString()}</b><small>XP</small></div></div>)}</div> : <div className="emptyState"><strong>No leaderboard data</strong><p>Earn XP to appear here.</p></div>}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
