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
  if (!discordId) {
    console.error('VELVET DEBUG: No Discord ID supplied');
    return { profile: null, achievements: [], titles: [], leaderboard: [] };
  }

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

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const coins = profile?.coins || 0;
  const currentTitle = titles.find(item => item.equipped)?.titles?.title_name || profile?.title || 'New Member';
  const nextLevelXP = 5000;
  const progress = Math.min((xp / nextLevelXP) * 100, 100);
  const xpRemaining = Math.max(nextLevelXP - xp, 0);

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <main className="dashboardShell">
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboardShell { isolation:isolate; }
        .dashboardShell::after { content:""; position:absolute; inset:-25%; z-index:-2; pointer-events:none; background:radial-gradient(circle at 18% 20%,rgba(235,82,164,.16),transparent 24%),radial-gradient(circle at 82% 28%,rgba(116,64,185,.13),transparent 25%),radial-gradient(circle at 52% 82%,rgba(202,49,133,.09),transparent 22%); filter:blur(20px); animation:velvetAurora 18s ease-in-out infinite alternate; }
        .dashboardShell::before { z-index:-1; animation:velvetStars 18s linear infinite; }
        .dashboardGlow { animation:velvetFloat 14s ease-in-out infinite alternate; }
        .velvetOrb { position:absolute; border-radius:50%; pointer-events:none; z-index:-1; mix-blend-mode:screen; }
        .velvetOrb.one { width:7px;height:7px;top:28%;left:13%;background:#f5a9d0;box-shadow:0 0 16px 4px rgba(239,143,189,.45);animation:velvetDrift 8s ease-in-out infinite; }
        .velvetOrb.two { width:4px;height:4px;top:46%;right:17%;background:#cda9ff;box-shadow:0 0 14px 3px rgba(164,111,255,.4);animation:velvetDrift 10s ease-in-out -3s infinite; }
        .velvetOrb.three { width:5px;height:5px;top:72%;left:24%;background:#fff0fa;box-shadow:0 0 14px 3px rgba(255,220,242,.35);animation:velvetDrift 12s ease-in-out -6s infinite; }
        .topbar { animation:velvetFadeDown .8s cubic-bezier(.22,1,.36,1) both; }
        .welcome { animation:velvetHeroIn .9s cubic-bezier(.22,1,.36,1) .08s both; }
        .gridStats .statCard { animation:velvetRise .7s cubic-bezier(.22,1,.36,1) both; }
        .gridStats .statCard:nth-child(2){animation-delay:.06s}.gridStats .statCard:nth-child(3){animation-delay:.12s}.gridStats .statCard:nth-child(4){animation-delay:.18s}
        .statCard,.panel { backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); transition:transform .35s cubic-bezier(.22,1,.36,1),border-color .35s,box-shadow .35s; }
        .statCard:hover,.panel:hover { transform:translateY(-3px); border-color:#3d2939; box-shadow:0 16px 45px rgba(0,0,0,.22),0 0 35px rgba(199,65,143,.055); }
        .achievement { transition:transform .3s ease,padding-left .3s ease,background .3s ease; border-radius:12px; }
        .achievement:hover { transform:translateX(4px); padding-left:8px; background:linear-gradient(90deg,rgba(217,78,150,.055),transparent 70%); }
        .achievementBadge { transition:transform .35s ease,box-shadow .35s ease,border-color .35s ease; }
        .achievement:hover .achievementBadge { transform:scale(1.08) rotate(-2deg); border-color:#80506a; box-shadow:0 0 22px rgba(218,82,153,.16); }
        .achievementMeta { display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; margin-top:8px; margin-bottom:8px; font-family:"Inter",sans-serif; font-size:12px; line-height:1.35; color:#d7ccd5; }
        .achievementMeta span { font-family:"Inter",sans-serif; font-size:12px; color:#d7ccd5; }
        .achievementRarity { color:#ef9fc5 !important; font-weight:600; letter-spacing:.04em; }
        .xpFill { position:relative; overflow:hidden; }
        .xpFill::after { content:""; position:absolute; inset:0; width:45%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent); transform:translateX(-120%); animation:velvetXpShine 3.2s ease-in-out infinite; }
        .rank { transition:transform .25s ease,background .25s ease; }.rank:hover{transform:translateX(4px);background:rgba(217,78,150,.055)}
        .sideBrand,.mobileBrand { cursor:pointer; transition:color .25s,text-shadow .25s,transform .25s; }.sideBrand:hover,.mobileBrand:hover{color:#fff;text-shadow:0 0 18px rgba(239,143,189,.28);transform:translateY(-1px)}
        @keyframes velvetAurora{0%{transform:translate3d(-2%,-1%,0) scale(1)}50%{transform:translate3d(3%,2%,0) scale(1.05)}100%{transform:translate3d(-1%,4%,0) scale(1.02)}}
        @keyframes velvetStars{from{transform:translateY(0)}to{transform:translateY(42px)}}
        @keyframes velvetFloat{0%{transform:translate3d(0,0,0) scale(1)}100%{transform:translate3d(35px,18px,0) scale(1.08)}}
        @keyframes velvetDrift{0%,100%{transform:translate3d(0,0,0);opacity:.35}50%{transform:translate3d(18px,-24px,0);opacity:1}}
        @keyframes velvetFadeDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes velvetHeroIn{from{opacity:0;transform:translateY(28px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes velvetRise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes velvetXpShine{0%,55%{transform:translateX(-120%)}78%,100%{transform:translateX(260%)}}
        @media (max-width:700px){.statCard:hover,.panel:hover{transform:none}.achievementMeta,.achievementMeta span{font-size:12px}.achievementMeta{gap:7px 10px}}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.001ms!important}}
      `}} />

      <div className="dashboardGlow" />
      <div className="velvetOrb one" />
      <div className="velvetOrb two" />
      <div className="velvetOrb three" />

      <div className="dashboardLayout">
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
          <div className="sideBottom"><small>VELVET MEMBER</small><strong>{profile?.display_name || 'Member'}</strong></div>
        </aside>

        <section className="mainPanel" id="top">
          <div className="topbar">
            <a className="mobileBrand" href="/" aria-label="Return to Velvet Club home"><span>✦</span> VELVET</a>
            <div className="profileChip">
              <div className="avatar" style={profile?.avatar_url ? { backgroundImage:`url(${profile.avatar_url})` } : undefined}>
                {!profile?.avatar_url && (profile?.display_name || 'M').charAt(0).toUpperCase()}
              </div>
              <span>{profile?.display_name || 'Member'}</span>
            </div>
          </div>

          <section className="welcome">
            <p className="eyebrow">MEMBER DASHBOARD</p>
            <h1>Welcome back, <span>{profile?.display_name || 'Member'}.</span></h1>
            <p>Your Velvet journey, all in one place.</p>
          </section>

          <section className="gridStats">
            <div className="statCard"><div className="statIcon">✦</div><small>LEVEL</small><strong>{level}<em>{currentTitle}</em></strong></div>
            <div className="statCard"><div className="statIcon">◇</div><small>VELVET XP</small><strong>{xp.toLocaleString()}<em>/ {nextLevelXP.toLocaleString()}</em></strong></div>
            <div className="statCard"><div className="statIcon">◆</div><small>COINS</small><strong>{coins.toLocaleString()}</strong></div>
            <div className="statCard"><div className="statIcon">🏆</div><small>ACHIEVEMENTS</small><strong>{achievements.length}<em>earned</em></strong></div>
          </section>

          <section className="contentGrid">
            <div className="panel" id="progress">
              <div className="panelHeader"><h2>YOUR PROGRESS</h2></div>
              <div style={{color:'#b5a7b3',fontSize:'13px',marginBottom:'14px'}}>Level {level} • {currentTitle}</div>
              <div className="xpBar"><div className="xpFill" style={{width:`${progress}%`}} /></div>
              <div className="xpMeta"><span>{xp.toLocaleString()} XP</span><span>{nextLevelXP.toLocaleString()} XP</span></div>
              <div style={{color:'#786b77',fontSize:'10px',marginTop:'14px'}}>{xpRemaining.toLocaleString()} XP until level {level + 1}</div>
            </div>

            <div className="panel" id="achievements">
              <div className="panelHeader"><h2>RECENT ACHIEVEMENTS</h2><span>{achievements.length} earned</span></div>
              {achievements.length > 0 ? achievements.map((item,index) => {
                const achievement = item.achievements;
                return (
                  <div className="achievement" key={`${achievement.id}-${index}`}>
                    <div className="achievementBadge">{achievement.icon || '🏆'}</div>
                    <div className="achievementText">
                      <strong>{achievement.achievement_name}</strong>
                      <small>{achievement.description}</small>
                      <div className="achievementMeta">
                        <span className="achievementRarity">{(achievement.rarity || 'COMMON').toUpperCase()}</span>
                        <span>⭐ +{achievement.xp_reward || 0} XP</span>
                        <span>🪙 +{achievement.coin_reward || 0} Coins</span>
                      </div>
                      <small className="achievementDate">Unlocked: {formatDate(item.unlocked_at)}</small>
                    </div>
                  </div>
                );
              }) : <div className="emptyState"><strong>No achievements yet</strong><p>Unlock achievements as your Velvet journey continues.</p></div>}
            </div>

            <div className="panel" id="titles">
              <div className="panelHeader"><h2>YOUR TITLES</h2><span>{titles.length} unlocked</span></div>
              {titles.length > 0 ? titles.map((item,index) => {
                const titleName = item.titles?.title_name || 'Unknown Title';
                return (
                  <div className="achievement" key={`${titleName}-${index}`}>
                    <div className="achievementBadge" style={item.equipped ? {borderColor:'#e6a4c8',boxShadow:'0 0 18px rgba(230,164,200,.18)'} : undefined}>{item.equipped ? '👑' : '✦'}</div>
                    <div className="achievementText">
                      <strong>{titleName}</strong>
                      <small>{item.equipped ? 'Currently equipped' : 'Unlocked title'}</small>
                      {item.unlocked_at && <small className="achievementDate">Unlocked: {formatDate(item.unlocked_at)}</small>}
                    </div>
                  </div>
                );
              }) : <div className="emptyState"><strong>No titles yet</strong><p>Unlock titles as your Velvet journey continues.</p></div>}
            </div>

            <div className="panel" id="leaderboard">
              <div className="panelHeader"><h2>LEADERBOARD</h2></div>
              {leaderboard.length > 0 ? (
                <div className="rankList">
                  {leaderboard.map((member,index) => (
                    <div className="rank" key={`${member.display_name}-${index}`}>
                      <div className="rankNum">{String(index + 1).padStart(2,'0')}</div>
                      <div><strong>{member.display_name || 'Velvet Member'}</strong><small>Level {member.level || 1}</small></div>
                      <div><b>{Number(member.xp || 0).toLocaleString()}</b><small>XP</small></div>
                    </div>
                  ))}
                </div>
              ) : <div className="emptyState"><strong>No leaderboard data</strong><p>Earn XP to appear here.</p></div>}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
