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

async function getProfile(discordId) {
  if (!discordId) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('discord_id', discordId)
    .single();

  if (error) {
    console.error('Profile fetch failed:', error);
    return null;
  }

  return data;
}

const achievements = [
  ['🌹', 'Welcome to Velvet', 'Joined the community'],
  ['🎮', 'Player One', 'Reached level 10'],
  ['✨', 'First Impression', 'Completed your profile'],
];

const rankings = [
  ['01', 'Moonlight', 'Level 42', '12,840'],
  ['02', 'VelvetRose', 'Level 38', '11,220'],
  ['03', 'Nightfall', 'Level 35', '10,510'],
];

export default async function Dashboard() {
  const session = await getSession();
  const profile = await getProfile(session?.id);

  const displayName = profile?.display_name || session?.username || 'Velvet Member';
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url || null;

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const coins = profile?.coins ?? 0;
  const title = profile?.title || 'New Member';

  return (
    <main className="dashboardShell">
      <div className="dashboardGlow" />
      <div className="dashboardLayout">
        <aside className="sidebar">
          <div className="sideBrand"><span>✦</span> VELVET</div>
          <div className="sideLabel">CLUB</div>
          <nav className="sideNav">
            <a className="active" href="/dashboard">⌂ <span>Overview</span></a>
            <a href="#profile">◉ <span>Profile</span></a>
            <a href="#progress">✦ <span>Progress</span></a>
            <a href="#achievements">♜ <span>Achievements</span></a>
            <a href="#leaderboard">♛ <span>Leaderboard</span></a>
          </nav>
          <div className="sideBottom">
            <small>VELVET CLUB</small>
            <strong>Same Souls • Brighter Nights ♡</strong>
          </div>
        </aside>

        <section className="mainPanel">
          <header className="topbar">
            <div className="profileChip">
              <div className="avatar" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}>
                {!avatarUrl && initial}
              </div>
              <span>{displayName}</span>
            </div>
          </header>

          <div className="welcome">
            <p className="eyebrow">MEMBER DASHBOARD</p>
            <h1>Welcome back, <em>{displayName}.</em></h1>
            <p>Your Velvet journey, all in one place.</p>
          </div>

          <section className="gridStats">
            <div className="statCard"><div className="statIcon">✦</div><small>Level</small><strong>{level}</strong><em>{title}</em></div>
            <div className="statCard"><div className="statIcon">◇</div><small>Velvet XP</small><strong>{xp}</strong><em>/ {(level + 1) * 1000}</em></div>
            <div className="statCard"><div className="statIcon">◆</div><small>Coins</small><strong>{coins}</strong></div>
            <div className="statCard"><div className="statIcon">🏆</div><small>Achievements</small><strong>0</strong><em>/ 42</em></div>
          </section>

          <section className="contentGrid">
            <div className="panel" id="progress">
              <div className="panelHeader"><h2>YOUR PROGRESS</h2></div>
              <p style={{color:'#b9acb7',fontSize:13}}>Level {level} <span style={{color:'#716471'}}>•</span> {title}</p>
              <div className="xpBar"><div className="xpFill" /></div>
              <div className="xpMeta"><span>{xp} XP</span><span>{(level + 1) * 1000} XP</span></div>
            </div>

            <div className="panel" id="achievements">
              <div className="panelHeader"><h2>RECENT ACHIEVEMENTS</h2></div>
              {achievements.map(([icon, name, desc]) => (
                <div className="achievement" key={name}>
                  <div className="achievementBadge">{icon}</div>
                  <div className="achievementText"><strong>{name}</strong><small>{desc}</small></div>
                </div>
              ))}
            </div>

            <div className="panel" id="leaderboard">
              <div className="panelHeader"><h2>LEADERBOARD</h2></div>
              <div className="rankList">
                {rankings.map(([rank, name, rankLevel, rankXp]) => (
                  <div className="rank" key={rank}><div className="rankNum">{rank}</div><div><strong>{name}</strong><small>{rankLevel}</small></div><b>{rankXp}</b></div>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
