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
    console.error('VELVET DEBUG: No Discord ID supplied');

    return {
      profile: null,
      achievements: [],
      titles: [],
      leaderboard: []
    };
  }

  const supabase = supabaseClient();

  /*
    ============================
    PROFILE
    ============================
  */

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from('profiles')
    .select('*')
    .eq('discord_id', discordId)
    .single();

  if (profileError) {
    console.error(
      'VELVET PROFILE ERROR:',
      profileError
    );
  }

  /*
    ============================
    ACHIEVEMENTS
    ============================
  */

  const {
    data: achievementLinks,
    error: achievementLinksError
  } = await supabase
    .from('member_achievements')
    .select('achievement_id, unlocked_at')
    .eq('discord_id', discordId)
    .order('unlocked_at', {
      ascending: false
    });

  if (achievementLinksError) {
    console.error(
      'VELVET ACHIEVEMENT LINK ERROR:',
      achievementLinksError
    );
  }

  let achievements = [];

  if (
    !achievementLinksError &&
    achievementLinks?.length
  ) {
    const ids = achievementLinks.map(
      item => item.achievement_id
    );

    const {
      data: definitions,
      error: definitionsError
    } = await supabase
      .from('achievements')
      .select(`
        id,
        achievement_name,
        description,
        rarity,
        icon,
        xp_reward,
        coin_reward
      `)
      .in('id', ids);

    if (definitionsError) {
      console.error(
        'VELVET ACHIEVEMENT DEFINITIONS ERROR:',
        definitionsError
      );
    }

    const byId = new Map(
      (definitions || []).map(
        item => [
          item.id,
          item
        ]
      )
    );

    achievements = achievementLinks
      .map(item => ({
        unlocked_at: item.unlocked_at,

        achievements:
          byId.get(
            item.achievement_id
          ) || null
      }))
      .filter(
        item => item.achievements
      );
  }

  /*
    ============================
    TITLES
    ============================
  */

  const {
    data: titleLinks,
    error: titleLinksError
  } = await supabase
    .from('member_titles')
    .select(
      'title_id, unlocked_at, equipped'
    )
    .eq(
      'discord_id',
      discordId
    );

  if (titleLinksError) {
    console.error(
      'VELVET TITLE LINK ERROR:',
      titleLinksError
    );
  }

  let titles = [];

  if (
    !titleLinksError &&
    titleLinks?.length
  ) {
    const ids = titleLinks.map(
      item => item.title_id
    );

    const {
      data: definitions,
      error: definitionsError
    } = await supabase
      .from('titles')
      .select(
        'id, title_name'
      )
      .in('id', ids);

    if (definitionsError) {
      console.error(
        'VELVET TITLE DEFINITIONS ERROR:',
        definitionsError
      );
    }

    const byId = new Map(
      (definitions || []).map(
        item => [
          item.id,
          item
        ]
      )
    );

    titles = titleLinks
      .map(item => ({
        unlocked_at:
          item.unlocked_at,

        equipped:
          item.equipped === true,

        titles:
          byId.get(
            item.title_id
          ) || null
      }))
      .filter(
        item => item.titles
      );
  }

  /*
    ============================
    LEADERBOARD
    ============================
  */

  const {
    data: leaderboard,
    error: leaderboardError
  } = await supabase
    .from('profiles')
    .select(`
      display_name,
      level,
      xp,
      title,
      avatar_url
    `)
    .order('xp', {
      ascending: false
    })
    .limit(5);

  if (leaderboardError) {
    console.error(
      'VELVET LEADERBOARD ERROR:',
      leaderboardError
    );
  }

  return {
    profile,
    achievements,
    titles,
    leaderboard:
      leaderboard || []
  };
}

export default async function Dashboard() {
    const session = await getSession();

  const discordId =
    session?.id ||
    session?.discord_id ||
    null;

  const {
    profile,
    achievements,
    titles,
    leaderboard
  } = await getDashboardData(
    discordId
  );


  const xp =
    profile?.xp || 0;

  const level =
    profile?.level || 1;

  const coins =
    profile?.coins || 0;


  const currentTitle =
    titles.find(
      item => item.equipped
    )?.titles?.title_name
    ||
    profile?.title
    ||
    'New Member';


  const nextLevelXP =
    5000;


  const progress =
    Math.min(
      (xp / nextLevelXP) * 100,
      100
    );


  const xpRemaining =
    Math.max(
      nextLevelXP - xp,
      0
    );


  function formatDate(date) {

    if (!date) return '';

    return new Date(date)
      .toLocaleDateString(
        'en-GB',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      );

  }


  return (
    <main className="dashboard">

      <section className="dashboardHero">

        <div>

          <p className="eyebrow">
            MEMBER DASHBOARD
          </p>

          <h1>
            Welcome back,
            <span>
              {' '}
              {profile?.display_name || 'Member'}.
            </span>
          </h1>

          <p className="subtitle">
            Your Velvet journey,
            all in one place.
          </p>

        </div>


        <div className="profileBadge">

          {profile?.avatar_url && (

            <img
              src={profile.avatar_url}
              alt="Avatar"
            />

          )}

          <span>
            {profile?.display_name}
          </span>

        </div>


      </section>



      <section className="statGrid">


        <div className="statCard">

          <span>
            ✦
          </span>

          <label>
            LEVEL
          </label>

          <strong>
            {level}
          </strong>

          <small>
            {currentTitle}
          </small>

        </div>



        <div className="statCard">

          <span>
            ◇
          </span>

          <label>
            VELVET XP
          </label>

          <strong>
            {xp}
          </strong>

          <small>
            XP
          </small>

        </div>



        <div className="statCard">

          <span>
            ◆
          </span>

          <label>
            COINS
          </label>

          <strong>
            {coins.toLocaleString()}
          </strong>

          <small>
            Velvet Coins
          </small>

        </div>



        <div className="statCard">

          <span>
            🏆
          </span>

          <label>
            ACHIEVEMENTS
          </label>

          <strong>
            {achievements.length}
          </strong>

          <small>
            unlocked
          </small>

        </div>


      </section>
      <section className="contentGrid">


        <div
          className="panel"
          id="progress"
        >

          <div className="panelHeader">

            <h2>
              YOUR PROGRESS
            </h2>

          </div>


          <div className="progressBox">


            <div className="progressInfo">

              <div>

                <small>
                  CURRENT LEVEL
                </small>

                <strong>
                  {level}
                </strong>

              </div>



              <div>

                <small>
                  NEXT LEVEL
                </small>

                <strong>
                  {nextLevelXP}
                  XP
                </strong>

              </div>


            </div>



            <div className="xpBar">

              <div

                className="xpFill"

                style={{
                  width:
                    `${progress}%`
                }}

              />

            </div>



            <div className="xpFooter">

              <span>
                {xp} XP
              </span>


              <span>
                {xpRemaining} XP remaining
              </span>


            </div>


          </div>


        </div>





        <div
          className="panel"
          id="achievements"
        >


          <div className="panelHeader">

            <h2>
              ACHIEVEMENTS
            </h2>


            <span>

              {achievements.length}

              {' '}
              unlocked

            </span>


          </div>





          {
            achievements.length > 0

            ?

            achievements.map(

              (
                item,
                index
              ) => {


                const achievement =
                  item.achievements;


                return (

                  <div

                    className="achievement"

                    key={
                      `${achievement.id}-${index}`
                    }

                  >



                    <div className="achievementBadge">

                      {
                        achievement.icon ||
                        "🏆"
                      }

                    </div>





                    <div className="achievementText">


                      <strong>

                        {
                          achievement.achievement_name
                        }

                      </strong>





                      <p className="achievementDescription">

                        {
                          achievement.description
                        }

                      </p>





                      <div className="achievementMeta">


                        <span className="achievementRarity">

                          {
                            (
                              achievement.rarity ||
                              "COMMON"
                            )
                            .toUpperCase()
                          }

                        </span>





                        <span>

                          ⭐

                          +

                          {
                            achievement.xp_reward ||
                            0
                          }

                          XP

                        </span>





                        <span>

                          💰

                          +

                          {
                            achievement.coin_reward ||
                            0
                          }

                          Coins

                        </span>


                      </div>





                      <small className="achievementDate">

                        Unlocked:

                        {' '}

                        {
                          formatDate(
                            item.unlocked_at
                          )
                        }

                      </small>


                    </div>


                  </div>


                );


              }

            )


            :

            (

              <div className="emptyState">

                <strong>
                  No achievements yet
                </strong>

                <p>
                  Unlock achievements as your Velvet journey continues.
                </p>

              </div>

            )

          }


        </div>
        <div
          className="panel"
          id="titles"
        >

          <div className="panelHeader">

            <h2>
              YOUR TITLES
            </h2>

            <span>
              {titles.length} unlocked
            </span>

          </div>


          {
            titles.length > 0

            ?

            titles.map(

              (
                item,
                index
              ) => {

                const titleName =
                  item.titles?.title_name ||
                  'Unknown Title';

                return (

                  <div
                    className="achievement"
                    key={
                      `${titleName}-${index}`
                    }
                  >

                    <div
                      className="achievementBadge"
                      style={
                        item.equipped
                          ? {
                              borderColor:
                                '#e6a4c8',
                              boxShadow:
                                '0 0 18px rgba(230,164,200,.18)'
                            }
                          : undefined
                      }
                    >

                      {
                        item.equipped
                          ? '👑'
                          : '✦'
                      }

                    </div>


                    <div className="achievementText">

                      <strong>
                        {titleName}
                      </strong>


                      <p className="achievementDescription">

                        {
                          item.equipped
                            ? 'Currently equipped'
                            : 'Unlocked title'
                        }

                      </p>


                      {
                        item.unlocked_at && (

                          <small className="achievementDate">

                            Unlocked:

                            {' '}

                            {
                              formatDate(
                                item.unlocked_at
                              )
                            }

                          </small>

                        )
                      }

                    </div>

                  </div>

                );

              }

            )

            :

            (

              <div className="emptyState">

                <strong>
                  No titles yet
                </strong>

                <p>
                  Unlock titles as your Velvet journey continues.
                </p>

              </div>

            )

          }

        </div>
        <div
          className="panel"
          id="leaderboard"
        >

          <div className="panelHeader">

            <h2>
              LEADERBOARD
            </h2>

          </div>



          {
            leaderboard.length > 0

            ?

            leaderboard.map(

              (
                member,
                index
              ) => (

                <div
                  className="rank"
                  key={
                    `${member.display_name}-${index}`
                  }
                >


                  <div className="rankNumber">

                    {
                      String(
                        index + 1
                      )
                      .padStart(
                        2,
                        '0'
                      )
                    }

                  </div>



                  <div className="rankMember">


                    <strong>

                      {
                        member.display_name ||
                        'Velvet Member'
                      }

                    </strong>


                    <small>

                      Level

                      {' '}

                      {
                        member.level ||
                        1
                      }

                    </small>


                  </div>



                  <div className="rankXP">

                    <strong>

                      {
                        Number(
                          member.xp || 0
                        )
                        .toLocaleString()
                      }

                    </strong>


                    <small>
                      XP
                    </small>


                  </div>


                </div>

              )

            )


            :

            (

              <div className="emptyState">

                <strong>
                  No leaderboard data
                </strong>


                <p>
                  Earn XP to appear here.
                </p>


              </div>

            )

          }


        </div>



      </section>


    </main>

  );

}
