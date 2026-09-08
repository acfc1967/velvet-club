import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import Link from 'next/link';

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

const achievements = [
  ['🌹', 'Welcome to Velvet', 'Joined the community'],
  ['🎮', 'Player One', 'Reached level 10'],
  ['✨', 'First Impression', 'Completed your profile'],
];

const rankings = [
  ['01', 'Moonlight', 'Level 42', '12,840'],
  ['02', 'VelvetRose', 'Level 38', '11,220'],
  ['03', 'Nightfall', 'Level 35', '10,510'],
  ['04', 'You', 'Level 24', '7,420'],
];

export default async function Dashboard() {
  const session = await getSession();
  const displayName = session?.global_name || session?.username || 'Velvet Member';
  const initial = displayName.charAt(0).toUpperCase();

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
            <a href="#events">◈ <span>Events</span></a>
            <a href="#leaderboard">♛ <span>Leaderboard</span></a>
          </nav>
          <div className="sideLabel">SOON</div>
          <nav className="sideNav">
            <a href="#cosmetics">◇ <span>Cosmetics</span></a>
            <a href="#titles">✧ <span>Titles</span></a>
          </nav>
          <div className="sideBottom">
            <small>VELVET CLUB</small>
            <strong>Same Souls • Brighter Nights ♡</strong>
          </div>
        </aside>

        <section className="mainPanel">
          <header className="topbar">
            <div className="mobileBrand"><span>✦</span> VELVET</div>
            <div className="profileChip">
              <div className="avatar">{initial}</div>
              <span>{displayName}</span>
            </div>
          </header>

          <div className="welcome">
            <p className="eyebrow">MEMBER DASHBOARD</p>
            <h1>Welcome back, <em>{displayName}.</em></h1>
            <p>Your Velvet journey, all in one place.</p>
          </div>

          <section className="gridStats">
            <div className="statCard"><div className="statIcon">✦</div><small>Level</small><strong>24</strong><em>+2 this month</em></div>
            <div className="statCard"><div className="statIcon">◇</div><small>Velvet XP</small><strong>7,420</strong><em>/ 8,000</em></div>
            <div className="statCard"><div className="statIcon">◆</div><small>Coins</small><strong>12,850</strong></div>
            <div className="statCard"><div className="statIcon">🏆</div><small>Achievements</small><strong>18</strong><em>/ 42</em></div>
          </section>

          <section className="contentGrid">
            <div className="panel" id="progress">
              <div className="panelHeader"><h2>YOUR PROGRESS</h2><a href="#profile">View profile →</a></div>
              <p style={{color:'#b9acb7',fontSize:13,marginTop:0}}>Level 24 <span style={{color:'#716471'}}>•</span> Velvet Regular</p>
              <div className="xpBar"><div className="xpFill" /></div>
              <div className="xpMeta"><span>7,420 XP</span><span>8,000 XP</span></div>
              <div style={{marginTop:22}}>
                <span className="pill">🌹 Community</span><span className="pill">🎮 Gamer</span><span className="pill">🌙 Night Owl</span>
              </div>
            </div>

            <div className="panel" id="events">
              <div className="panelHeader"><h2>NEXT EVENT</h2><a href="#leaderboard">All events →</a></div>
              <div className="eventCard">
                <div className="eventDate">FRIDAY • 9:00 PM</div>
                <h3>Velvet Game Night</h3>
                <p>Jump into the community VC, pick a game and bring the chaos.</p>
              </div>
            </div>

            <div className="panel" id="achievements">
              <div className="panelHeader"><h2>RECENT ACHIEVEMENTS</h2><a href="#achievements">View all →</a></div>
              {achievements.map(([icon, title, desc]) => (
                <div className="achievement" key={title}>
                  <div className="achievementBadge">{icon}</div>
                  <div className="achievementText"><strong>{title}</strong><small>{desc}</small></div>
                </div>
              ))}
            </div>

            <div className="panel" id="leaderboard">
              <div className="panelHeader"><h2>LEADERBOARD</h2><a href="#leaderboard">Full board →</a></div>
              <div className="rankList">
                {rankings.map(([rank, name, level, xp]) => (
                  <div className="rank" key={rank}><div className="rankNum">{rank}</div><div><strong>{name}</strong><small>{level}</small></div><b>{xp}</b></div>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
