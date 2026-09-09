import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';


async function getSession() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) return null;

  try {
    const token = (await cookies()).get('velvet_session')?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return payload;

  } catch {
    return null;
  }
}


function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}


async function getDashboardData(discordId) {

  if (!discordId) {
    return {
      profile: null,
      achievements: [],
      titles: [],
      leaderboard: []
    };
  }


  const supabase = supabaseClient();



  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('discord_id', discordId)
    .single();



  const { data: achievements } = await supabase
    .from('member_achievements')
    .select(`
      unlocked_at,
      achievements (
        achievement_name,
        description
      )
    `)
    .eq('discord_id', discordId);



  const { data: titles } = await supabase
    .from('member_titles')
    .select(`
      equipped,
      titles (
        title_name
      )
    `)
    .eq('discord_id', discordId);



  const { data: leaderboard } = await supabase
    .from('profiles')
    .select(
      'display_name, level, xp, title, avatar_url'
    )
    .order('xp', {
      ascending:false
    })
    .limit(5);



  return {
    profile,
    achievements: achievements || [],
    titles: titles || [],
    leaderboard: leaderboard || []
  };
}



export default async function Dashboard() {


  const session = await getSession();


  const {
    profile,
    achievements,
    titles,
    leaderboard

  } = await getDashboardData(session?.id);



  const displayName =
    profile?.display_name ||
    session?.username ||
    "Velvet Member";


  const avatarUrl =
    profile?.avatar_url ||
    null;


  const initial =
    displayName
    .charAt(0)
    .toUpperCase();


  const level =
    profile?.level ?? 1;


  const xp =
    profile?.xp ?? 0;


  const coins =
    profile?.coins ?? 0;


  const title =
    profile?.title ||
    titles?.find(t => t.equipped)?.titles?.title_name ||
    "New Member";


  const nextLevel =
    (level + 1) * 1000;


  const xpPercent =
    Math.min(
      (xp / nextLevel) * 100,
      100
    );
    const achievementItems = achievements.map((item) => ({
    name:
      item.achievements?.achievement_name ||
      'Achievement',

    description:
      item.achievements?.description ||
      'A Velvet achievement',

    unlockedAt:
      item.unlocked_at
  }));


  const titleItems = titles.map((item) => ({
    name:
      item.titles?.title_name ||
      'Velvet Title',

    equipped:
      item.equipped === true
  }));


  return (
    <main className="dashboardShell">

      <div className="dashboardGlow" />

      <div className="dashboardLayout">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="sideBrand">
            <span>✦</span> VELVET
          </div>

          <div className="sideLabel">
            CLUB
          </div>

          <nav className="sideNav">

            <a
              className="active"
              href="/dashboard"
            >
              ⌂ <span>Overview</span>
            </a>

            <a href="#profile">
              ◉ <span>Profile</span>
            </a>

            <a href="#progress">
              ✦ <span>Progress</span>
            </a>

            <a href="#achievements">
              ♜ <span>Achievements</span>
            </a>

            <a href="#titles">
              ♛ <span>Titles</span>
            </a>

            <a href="#leaderboard">
              ◈ <span>Leaderboard</span>
            </a>

          </nav>


          <div className="sideBottom">

            <small>
              VELVET CLUB
            </small>

            <strong>
              Same Souls • Brighter Nights ♡
            </strong>

          </div>

        </aside>


        {/* MAIN PANEL */}

        <section className="mainPanel">


          {/* TOP BAR */}

          <header className="topbar">

            <div className="profileChip">

              <div
                className="avatar"
                style={
                  avatarUrl
                    ? {
                        backgroundImage:
                          `url(${avatarUrl})`
                      }
                    : undefined
                }
              >

                {!avatarUrl && initial}

              </div>

              <span>
                {displayName}
              </span>

            </div>

          </header>



          {/* WELCOME */}

          <div
            className="welcome"
            id="profile"
          >

            <p className="eyebrow">
              MEMBER DASHBOARD
            </p>

            <h1>
              Welcome back, <em>{displayName}.</em>
            </h1>

            <p>
              Your Velvet journey, all in one place.
            </p>

          </div>



          {/* STATS */}

          <section className="gridStats">


            <div className="statCard">

              <div className="statIcon">
                ✦
              </div>

              <small>
                Level
              </small>

              <strong>
                {level}
              </strong>

              <em>
                {title}
              </em>

            </div>



            <div className="statCard">

              <div className="statIcon">
                ◇
              </div>

              <small>
                Velvet XP
              </small>

              <strong>
                {xp.toLocaleString()}
              </strong>

              <em>
                / {nextLevel.toLocaleString()}
              </em>

            </div>



            <div className="statCard">

              <div className="statIcon">
                ◆
              </div>

              <small>
                Coins
              </small>

              <strong>
                {coins.toLocaleString()}
              </strong>

            </div>



            <div className="statCard">

              <div className="statIcon">
                🏆
              </div>

              <small>
                Achievements
              </small>

              <strong>
                {achievementItems.length}
              </strong>

              <em>
                earned
              </em>

            </div>


          </section>



          {/* CONTENT */}

          <section className="contentGrid">


            {/* PROGRESS */}

            <div
              className="panel"
              id="progress"
            >

              <div className="panelHeader">

                <h2>
                  YOUR PROGRESS
                </h2>

              </div>


              <p
                style={{
                  color: '#b9acb7',
                  fontSize: 13
                }}
              >
                Level {level}

                <span
                  style={{
                    color: '#716471'
                  }}
                >
                  {' '}•{' '}
                </span>

                {title}
              </p>


              <div className="xpBar">

                <div
                  className="xpFill"
                  style={{
                    width: `${xpPercent}%`
                  }}
                />

              </div>


              <div className="xpMeta">

                <span>
                  {xp.toLocaleString()} XP
                </span>

                <span>
                  {nextLevel.toLocaleString()} XP
                </span>

              </div>


              <p
                style={{
                  color: '#716471',
                  fontSize: 12,
                  marginTop: 10
                }}
              >
                {Math.max(
                  nextLevel - xp,
                  0
                ).toLocaleString()} XP until level {level + 1}
              </p>

            </div>



            {/* ACHIEVEMENTS */}

            <div
              className="panel"
              id="achievements"
            >

              <div className="panelHeader">

                <h2>
                  RECENT ACHIEVEMENTS
                </h2>

              </div>


              {achievementItems.length > 0 ? (

                achievementItems
                  .slice(0, 5)
                  .map((achievement, index) => (

                    <div
                      className="achievement"
                      key={`${achievement.name}-${index}`}
                    >

                      <div className="achievementBadge">
                        {index === 0
                          ? '🌹'
                          : index === 1
                          ? '🎮'
                          : index === 2
                          ? '✨'
                          : '🏆'}
                      </div>


                      <div className="achievementText">

                        <strong>
                          {achievement.name}
                        </strong>

                        <small>
                          {achievement.description}
                        </small>

                      </div>

                    </div>

                  ))

              ) : (

                <div className="achievement">

                  <div className="achievementBadge">
                    ✦
                  </div>

                  <div className="achievementText">

                    <strong>
                      Your story starts here
                    </strong>

                    <small>
                      Keep exploring Velvet to unlock achievements.
                    </small>

                  </div>

                </div>

              )}

            </div>



            {/* TITLES */}

            <div
              className="panel"
              id="titles"
            >

              <div className="panelHeader">

                <h2>
                  YOUR TITLES
                </h2>

              </div>


              {titleItems.length > 0 ? (

                titleItems.map((item, index) => (

                  <div
                    className="achievement"
                    key={`${item.name}-${index}`}
                  >

                    <div className="achievementBadge">
                      {item.equipped ? '👑' : '✦'}
                    </div>


                    <div className="achievementText">

                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        {item.equipped
                          ? 'Currently equipped'
                          : 'Unlocked title'}
                      </small>

                    </div>

                  </div>

                ))

              ) : (

                <div className="achievement">

                  <div className="achievementBadge">
                    ♛
                  </div>

                  <div className="achievementText">

                    <strong>
                      No titles yet
                    </strong>

                    <small>
                      Unlock titles as your Velvet journey continues.
                    </small>

                  </div>

                </div>

              )}

            </div>



            {/* LEADERBOARD */}

            <div
              className="panel"
              id="leaderboard"
            >

              <div className="panelHeader">

                <h2>
                  LEADERBOARD
                </h2>

              </div>


              <div className="rankList">


                {leaderboard.length > 0 ? (

                  leaderboard.map((member, index) => (

                    <div
                      className="rank"
                      key={member.display_name || index}
                    >

                      <div className="rankNum">

                        {String(
                          index + 1
                        ).padStart(2, '0')}

                      </div>


                      <div>

                        <strong>
                          {member.display_name ||
                            'Velvet Member'}
                        </strong>

                        <small>
                          Level {member.level ?? 1}
                        </small>

                      </div>


                      <b>
                        {(member.xp ?? 0).toLocaleString()}
                      </b>

                    </div>

                  ))

                ) : (

                  <div className="rank">

                    <div className="rankNum">
                      —
                    </div>

                    <div>

                      <strong>
                        No rankings yet
                      </strong>

                      <small>
                        Start earning XP to appear here.
                      </small>

                    </div>

                  </div>

                )}

              </div>

            </div>


          </section>

        </section>

      </div>

    </main>
  );
                       }
