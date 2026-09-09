import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';


/*
  ==========================================
  VELVET CLUB — DASHBOARD
  ==========================================
*/


async function getSession() {

  const secret =
    process.env.SESSION_SECRET;

  if (!secret) {
    return null;
  }


  try {

    const token =
      (await cookies())
        .get('velvet_session')
        ?.value;


    if (!token) {
      return null;
    }


    const {
      payload
    } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );


    return payload;

  } catch {

    return null;

  }

}


/*
  ==========================================
  SUPABASE
  ==========================================
*/


function supabaseClient() {

  return createClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL,

    process.env.SUPABASE_SERVICE_ROLE_KEY

  );

}


/*
  ==========================================
  DASHBOARD DATA
  ==========================================
*/


async function getDashboardData(
  discordId
) {

  if (!discordId) {

    console.error(
      'VELVET DEBUG: No Discord ID supplied'
    );


    return {

      profile: null,

      achievements: [],

      titles: [],

      leaderboard: []

    };

  }


  const supabase =
    supabaseClient();


  /*
    ========================================
    PROFILE
    ========================================
  */


  const {

    data: profile,

    error: profileError

  } = await supabase

    .from('profiles')

    .select('*')

    .eq(
      'discord_id',
      discordId
    )

    .single();


  if (profileError) {

    console.error(

      'VELVET PROFILE ERROR:',

      profileError

    );

  }


  /*
    ========================================
    ACHIEVEMENT LINKS
    ========================================
  */


  const {

    data: achievementLinks,

    error: achievementLinksError

  } = await supabase

    .from('member_achievements')

    .select(
      'achievement_id, unlocked_at'
    )

    .eq(
      'discord_id',
      discordId
    )

    .order(
      'unlocked_at',
      {
        ascending: false
      }
    );


  if (achievementLinksError) {

    console.error(

      'VELVET ACHIEVEMENT LINK ERROR:',

      achievementLinksError

    );

  }


  let achievements = [];


  /*
    ========================================
    ACHIEVEMENT DEFINITIONS
    ========================================
  */


  if (

    !achievementLinksError &&

    achievementLinks?.length

  ) {

    const ids =
      achievementLinks.map(
        item =>
          item.achievement_id
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

      .in(
        'id',
        ids
      );


    if (definitionsError) {

      console.error(

        'VELVET ACHIEVEMENT DEFINITIONS ERROR:',

        definitionsError

      );

    }


    const byId =
      new Map(

        (definitions || [])
          .map(
            item => [

              item.id,

              item

            ]
          )

      );


    achievements =

      achievementLinks

        .map(
          item => ({

            unlocked_at:
              item.unlocked_at,

            achievements:
              byId.get(
                item.achievement_id
              ) || null

          })
        )

        .filter(
          item =>
            item.achievements
        );

  }


  /*
    ========================================
    TITLES
    ========================================
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


  /*
    ========================================
    TITLE DEFINITIONS
    ========================================
  */


  if (

    !titleLinksError &&

    titleLinks?.length

  ) {

    const ids =
      titleLinks.map(
        item =>
          item.title_id
      );


    const {

      data: definitions,

      error: definitionsError

    } = await supabase

      .from('titles')

      .select(
        'id, title_name'
      )

      .in(
        'id',
        ids
      );


    if (definitionsError) {

      console.error(

        'VELVET TITLE DEFINITIONS ERROR:',

        definitionsError

      );

    }


    const byId =
      new Map(

        (definitions || [])
          .map(
            item => [

              item.id,

              item

            ]
          )

      );


    titles =

      titleLinks

        .map(
          item => ({

            unlocked_at:
              item.unlocked_at,

            equipped:
              item.equipped === true,

            titles:
              byId.get(
                item.title_id
              ) || null

          })
        )

        .filter(
          item =>
            item.titles
        );

  }


  /*
    ========================================
    LEADERBOARD
    ========================================
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

      coins,

      title,

      avatar_url

    `)

    .order(

      'xp',

      {
        ascending: false
      }

    )

    .limit(10);


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

  /*
    ==========================================
    SESSION
    ==========================================
  */

  const session =
    await getSession();


  /*
    ==========================================
    LOAD DASHBOARD DATA
    ==========================================
  */

  const {

    profile,

    achievements,

    titles,

    leaderboard

  } = await getDashboardData(
    session?.id
  );


  /*
    ==========================================
    BASIC PROFILE DATA
    ==========================================
  */

  const displayName =
    profile?.display_name ||
    session?.username ||
    'Velvet Member';


  const username =
    profile?.username ||
    session?.username ||
    'member';


  const avatarUrl =
    profile?.avatar_url ||
    session?.avatar ||
    null;


  const initial =
    displayName
      .charAt(0)
      .toUpperCase();


  /*
    ==========================================
    PROGRESSION
    ==========================================
  */

  const level =
    Number(
      profile?.level
    ) || 1;


  const xp =
    Number(
      profile?.xp
    ) || 0;


  const coins =
    Number(
      profile?.coins
    ) || 0;


  /*
    ==========================================
    NEXT LEVEL
    ==========================================
  */

  const currentLevelXp =
    level * 1000;


  const nextLevelXp =
    (level + 1) * 1000;


  const xpIntoLevel =
    Math.max(
      xp - currentLevelXp,
      0
    );


  const xpRequired =
    Math.max(
      nextLevelXp -
      currentLevelXp,
      1
    );


  const xpPercent =
    Math.min(
      Math.max(
        (
          xpIntoLevel /
          xpRequired
        ) * 100,
        0
      ),
      100
    );


  /*
    ==========================================
    EQUIPPED TITLE
    ==========================================
  */

  const equippedTitle =
    titles.find(
      item =>
        item.equipped === true
    );


  const title =
    profile?.title ||
    equippedTitle
      ?.titles
      ?.title_name ||
    'New Member';


  /*
    ==========================================
    ACHIEVEMENT DATA
    ==========================================
  */

  const achievementItems =
    achievements.map(
      item => ({

        name:
          item.achievements
            ?.achievement_name ||
          'Unknown Achievement',


        description:
          item.achievements
            ?.description ||
          'A Velvet achievement.',


        rarity:
          item.achievements
            ?.rarity ||
          'Common',


        icon:
          item.achievements
            ?.icon ||
          '🏆',


        xpReward:
          Number(
            item.achievements
              ?.xp_reward
          ) || 0,


        coinReward:
          Number(
            item.achievements
              ?.coin_reward
          ) || 0,


        unlockedAt:
          item.unlocked_at

      })
    );


  /*
    ==========================================
    TITLE DATA
    ==========================================
  */

  const titleItems =
    titles.map(
      item => ({

        name:
          item.titles
            ?.title_name ||
          'Unknown Title',


        equipped:
          item.equipped === true,


        unlockedAt:
          item.unlocked_at

      })
    );


  /*
    ==========================================
    RARITY CONFIG
    ==========================================
  */

  const rarityConfig = {

    Common: {

      className:
        'rarityCommon',

      label:
        'COMMON'

    },


    Rare: {

      className:
        'rarityRare',

      label:
        'RARE'

    },


    Epic: {

      className:
        'rarityEpic',

      label:
        'EPIC'

    },


    Legendary: {

      className:
        'rarityLegendary',

      label:
        'LEGENDARY'

    }

  };


  /*
    ==========================================
    MEMBER RANK
    ==========================================
  */

  const memberRank =
    leaderboard.findIndex(
      member =>
        member.display_name ===
        profile?.display_name
    ) + 1;


  /*
    ==========================================
    SAFE RANK
    ==========================================
  */

  const rank =
    memberRank > 0
      ? memberRank
      : '—';


  /*
    ==========================================
    PAGE
    ==========================================
  */

  return (

    <main className="dashboardShell">

      <div className="dashboardGlow" />

      <div className="dashboardLayout">

        <aside className="sidebar">

          <div className="sideBrand">

            <span>
              ✦
            </span>

            VELVET

          </div>


          <div className="sideLabel">
            CLUB
          </div>


          <nav className="sideNav">

            <a
              className="active"
              href="#top"
            >
              <span>
                ⌂
              </span>

              Overview

            </a>


            <a href="#profile">

              <span>
                ◉
              </span>

              Profile

            </a>


            <a href="#progress">

              <span>
                ✦
              </span>

              Progress

            </a>


            <a href="#achievements">

              <span>
                🏆
              </span>

              Achievements

            </a>


            <a href="#titles">

              <span>
                ♛
              </span>

              Titles

            </a>


            <a href="#leaderboard">

              <span>
                ◈
              </span>

              Leaderboard

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


        <section
          className="mainPanel"
          id="top"
        >

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

                {!avatarUrl &&
                  initial}

              </div>


              <div className="profileChipText">

                <span>
                  {displayName}
                </span>

                <small>
                  @{username}
                </small>

              </div>

            </div>


            <div className="topbarStatus">

              <span className="statusDot" />

              ONLINE

            </div>

          </header>


          <div
            className="welcome"
            id="profile"
          >

            <p className="eyebrow">
              MEMBER DASHBOARD
            </p>


            <h1>

              Welcome back,

              <em>
                {displayName}.
              </em>

            </h1>


            <p>
              Your Velvet journey,
              all in one place.
            </p>

          </div>


          <section className="gridStats">

            <div className="statCard">

              <div className="statIcon">
                ✦
              </div>

              <small>
                LEVEL
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
                VELVET XP
              </small>

              <strong>
                {xp.toLocaleString()}
              </strong>

              <em>
                XP
              </em>

            </div>


            <div className="statCard">

              <div className="statIcon">
                ◆
              </div>

              <small>
                COINS
              </small>

              <strong>
                {coins.toLocaleString()}
              </strong>

              <em>
                VELVET COINS
              </em>

            </div>


            <div className="statCard">

              <div className="statIcon">
                🏆
              </div>

              <small>
                ACHIEVEMENTS
              </small>

              <strong>
                {achievementItems.length}
              </strong>

              <em>
                UNLOCKED
              </em>

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


              <div className="progressStats">


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
                    RANK
                  </small>

                  <strong>
                    #{rank}
                  </strong>

                </div>


              </div>



              <div className="xpHeader">

                <span>
                  {xp.toLocaleString()} XP
                </span>


                <span>
                  {nextLevelXp.toLocaleString()} XP
                </span>

              </div>



              <div className="xpBar">

                <div

                  className="xpFill"

                  style={{
                    width:
                      `${xpPercent}%`
                  }}

                />

              </div>



              <p className="xpDescription">

                {
                  Math.max(
                    nextLevelXp - xp,
                    0
                  )
                }

                XP until the next level.

              </p>


            </div>






            <div
              className="panel"
              id="achievements"
            >


              <div className="panelHeader">

                <h2>
                  TROPHY CABINET
                </h2>


                <span>

                  {
                    achievementItems.length
                  }

                  {' '}
                  earned

                </span>


              </div>





              {
                achievementItems.length > 0

                ?


                achievementItems
                  .slice(0, 6)
                  .map(

                    (
                      achievement,
                      index
                    ) => {


                      const rarity =
                        rarityConfig[
                          achievement.rarity
                        ]
                        ||
                        rarityConfig.Common;



                      return (

                        <div

                          className="achievementCard"

                          key={
                            `${achievement.name}-${index}`
                          }


                          style={{

                            borderColor:
                              rarity.className,

                          }}

                        >



                          <div className="achievementIcon">

                            {
                              achievement.icon
                            }

                          </div>





                          <div className="achievementContent">


                            <div className="achievementTitle">


                              <strong>

                                {
                                  achievement.name
                                }

                              </strong>



                              <span
                                className={
                                  rarity.className
                                }
                              >

                                {
                                  rarity.label
                                }

                              </span>


                            </div>





                            <p>

                              {
                                achievement.description
                              }

                            </p>





                            <div className="achievementRewards">


                              <span>

                                ⭐

                                +

                                {
                                  achievement.xpReward
                                }

                                XP

                              </span>




                              <span>

                                💰

                                +

                                {
                                  achievement.coinReward
                                }

                                Coins

                              </span>



                            </div>





                            <small>

                              Unlocked:

                              {' '}

                              {
                                new Date(
                                  achievement.unlockedAt
                                )
                                .toLocaleDateString(
                                  'en-GB',
                                  {

                                    day:
                                      'numeric',

                                    month:
                                      'short',

                                    year:
                                      'numeric'

                                  }
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


                    <span>
                      🏆
                    </span>


                    <strong>
                      No achievements yet
                    </strong>


                    <p>

                      Complete challenges
                      to grow your Velvet legacy.

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

                  {
                    titleItems.length
                  }

                  {' '}
                  unlocked

                </span>

              </div>





              {
                titleItems.length > 0

                ?

                titleItems.map(

                  (
                    item,
                    index
                  ) => (

                    <div

                      className={
                        item.equipped
                        ? "titleCard equipped"
                        : "titleCard"
                      }

                      key={
                        `${item.name}-${index}`
                      }

                    >



                      <div className="titleIcon">

                        {
                          item.equipped
                          ? "👑"
                          : "♛"
                        }

                      </div>




                      <div className="titleContent">


                        <strong>

                          {
                            item.name
                          }

                        </strong>



                        <small>

                          {
                            item.equipped

                            ?

                            "Currently equipped"

                            :

                            "Unlocked title"

                          }

                        </small>


                      </div>




                    </div>

                  )

                )


                :


                (

                  <div className="emptyState">


                    <span>
                      ♛
                    </span>


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

                      className="leaderboardRow"

                      key={
                        `${member.display_name}-${index}`
                      }

                    >



                      <div className="rankNumber">

                        {
                          index + 1
                        }

                      </div>





                      <div className="leaderMember">


                        <div

                          className="leaderAvatar"

                          style={
                            member.avatar_url

                            ?

                            {
                              backgroundImage:
                              `url(${member.avatar_url})`
                            }

                            :

                            undefined
                          }

                        >

                          {
                            !member.avatar_url &&
                            (
                              member.display_name ||
                              "?"
                            )
                            .charAt(0)
                            .toUpperCase()
                          }


                        </div>





                        <div>


                          <strong>

                            {
                              member.display_name ||
                              "Velvet Member"
                            }

                          </strong>



                          <small>

                            Level

                            {' '}

                            {
                              member.level || 1
                            }


                          </small>


                        </div>


                      </div>





                      <div className="leaderXP">


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


                    <span>
                      ◈
                    </span>


                    <strong>
                      No rankings yet
                    </strong>


                    <p>
                      Earn XP to appear on the leaderboard.
                    </p>


                  </div>

                )

              }


            </div>


          </section>
        </section>


      </div>


    </main>

  );

}
