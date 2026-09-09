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

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from('profiles')
    .select('*')
    .eq('discord_id', discordId)
    .single();

  if (profileError) {
    console.error('VELVET PROFILE ERROR:', profileError);
  }

  const {
    data: achievementLinks,
    error: achievementLinksError
  } = await supabase
    .from('member_achievements')
    .select('achievement_id, unlocked_at')
    .eq('discord_id', discordId)
    .order('unlocked_at', { ascending: false });

  if (achievementLinksError) {
    console.error(
      'VELVET ACHIEVEMENT LINK ERROR:',
      achievementLinksError
    );
  }

  let achievements = [];

  if (!achievementLinksError && achievementLinks?.length) {
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
        item => [item.id, item]
      )
    );

    achievements = achievementLinks
      .map(item => ({
        unlocked_at: item.unlocked_at,
        achievements:
          byId.get(item.achievement_id) || null
      }))
      .filter(item => item.achievements);
  }

  const {
    data: titleLinks,
    error: titleLinksError
  } = await supabase
    .from('member_titles')
    .select('title_id, unlocked_at, equipped')
    .eq('discord_id', discordId);

  if (titleLinksError) {
    console.error(
      'VELVET TITLE LINK ERROR:',
      titleLinksError
    );
  }

  let titles = [];

  if (!titleLinksError && titleLinks?.length) {
    const ids = titleLinks.map(
      item => item.title_id
    );

    const {
      data: definitions,
      error: definitionsError
    } = await supabase
      .from('titles')
      .select('id, title_name')
      .in('id', ids);

    if (definitionsError) {
      console.error(
        'VELVET TITLE DEFINITIONS ERROR:',
        definitionsError
      );
    }

    const byId = new Map(
      (definitions || []).map(
        item => [item.id, item]
      )
    );

    titles = titleLinks
      .map(item => ({
        unlocked_at: item.unlocked_at,
        equipped: item.equipped === true,
        titles:
          byId.get(item.title_id) || null
      }))
      .filter(item => item.titles);
  }

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
    .order('xp', { ascending: false })
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
    'Velvet Member';

  const avatarUrl =
    profile?.avatar_url ||
    session?.avatar ||
    null;

  const initial = displayName
    .charAt(0)
    .toUpperCase();

  const level = Number(profile?.level) || 1;
  const xp = Number(profile?.xp) || 0;
  const coins = Number(profile?.coins) || 0;

  const equippedTitle = titles.find(
    item => item.equipped
  );

  const title =
    profile?.title ||
    equippedTitle?.titles?.title_name ||
    'New Member';

  const nextLevel = (level + 1) * 1000;

  const xpPercent = Math.min(
    Math.max((xp / nextLevel) * 100, 0),
    100
  );

  const xpRemaining = Math.max(
    nextLevel - xp,
    0
  );

  const achievementItems = achievements.map(
    item => ({
      name:
        item.achievements?.achievement_name ||
        'Unknown Achievement',
      description:
        item.achievements?.description ||
        'A Velvet achievement.',
      rarity:
        item.achievements?.rarity ||
        'Common',
      icon:
        item.achievements?.icon ||
        '🏆',
      xpReward:
        Number(item.achievements?.xp_reward) || 0,
      coinReward:
        Number(item.achievements?.coin_reward) || 0,
      unlockedAt: item.unlocked_at
    })
  );

  const titleItems = titles.map(
    item => ({
      name:
        item.titles?.title_name ||
        'Unknown Title',
      equipped: item.equipped === true,
      unlockedAt: item.unlocked_at
    })
  );

  const rarityStyles = {
    Common: {
      color: '#b9acb7'
    },
    Rare: {
      color: '#78a9ff'
    },
    Epic: {
      color: '#c084fc'
    },
    Legendary: {
      color: '#f0b45d'
    }
  };

  const memberRank =
    leaderboard.findIndex(
      member =>
        member.display_name ===
        profile?.display_name
    ) + 1;

  const rank =
    memberRank > 0 ? memberRank : '—';

  return (
    <main className="dashboardShell">
      <div className="dashboardGlow" />

      <div className="dashboardLayout">
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
            <small>VELVET CLUB</small>

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
                {!avatarUrl && initial}
              </div>

              <span>{displayName}</span>
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
              Your Velvet journey, all in one place.
            </p>
          </div>

          <section className="gridStats">
            <div className="statCard">
              <div className="statIcon">✦</div>
              <small>Level</small>
              <strong>{level}</strong>
              <em>{title}</em>
            </div>

            <div className="statCard">
              <div className="statIcon">◇</div>
              <small>Velvet XP</small>
              <strong>
                {xp.toLocaleString()}
              </strong>
              <em>
                / {nextLevel.toLocaleString()}
              </em>
            </div>

            <div className="statCard">
              <div className="statIcon">◆</div>
              <small>Coins</small>
              <strong>
                {coins.toLocaleString()}
              </strong>
              <em>Velvet Coins</em>
            </div>

            <div className="statCard">
              <div className="statIcon">🏆</div>
              <small>Achievements</small>
              <strong>
                {achievementItems.length}
              </strong>
              <em>earned</em>
            </div>
          </section>

          <section className="contentGrid">
            <div
              className="panel"
              id="progress"
            >
              <div className="panelHeader">
                <h2>YOUR PROGRESS</h2>
              </div>

              <p
                style={{
                  color: '#b9acb7',
                  fontSize: 13,
                  margin: '0 0 15px'
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
                  color: '#786b77',
                  fontSize: 10,
                  margin: '13px 0 0'
                }}
              >
                {xpRemaining.toLocaleString()} XP until
                the next level.
              </p>
            </div>

            <div
              className="panel"
              id="achievements"
            >
              <div className="panelHeader">
                <h2>RECENT ACHIEVEMENTS</h2>

                <span
                  style={{
                    color: '#786b77',
                    fontSize: 10
                  }}
                >
                  {achievementItems.length} earned
                </span>
              </div>

              {achievementItems.length ? (
                achievementItems
                  .slice(0, 5)
                  .map(
                    (
                      achievement,
                      index
                    ) => {
                      const rarityStyle =
                        rarityStyles[
                          achievement.rarity
                        ] ||
                        rarityStyles.Common;

                      return (
                        <div
                          className="achievement"
                          key={`${achievement.name}-${index}`}
                        >
                          <div
                            className="achievementBadge"
                            style={{
                              borderColor:
                                rarityStyle.color,
                              boxShadow:
                                `0 0 16px ${rarityStyle.color}22`
                            }}
                          >
                            {achievement.icon}
                          </div>

                          <div className="achievementText">
                            <strong>
                              {achievement.name}
                            </strong>

                            <small>
                              {achievement.description}
                            </small>

                            <small>
                              <span
                                style={{
                                  color:
                                    rarityStyle.color,
                                  fontWeight: 700
                                }}
                              >
                                {achievement.rarity.toUpperCase()}
                              </span>
                              {' • '}
                              ⭐ +{achievement.xpReward} XP
                              {' • '}
                              💰 +{achievement.coinReward} Coins
                            </small>

                            {achievement.unlockedAt && (
                              <small>
                                Unlocked{' '}
                                {new Date(
                                  achievement.unlockedAt
                                ).toLocaleDateString(
                                  'en-GB',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }
                                )}
                              </small>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )
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

            <div
              className="panel"
              id="titles"
            >
              <div className="panelHeader">
                <h2>YOUR TITLES</h2>

                <span
                  style={{
                    color: '#786b77',
                    fontSize: 10
                  }}
                >
                  {titleItems.length} unlocked
                </span>
              </div>

              {titleItems.length ? (
                titleItems.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="achievement"
                      key={`${item.name}-${index}`}
                    >
                      <div
                        className="achievementBadge"
                        style={
                          item.equipped
                            ? {
                                borderColor: '#e6a4c8',
                                boxShadow:
                                  '0 0 18px rgba(230,164,200,.18)'
                              }
                            : undefined
                        }
                      >
                        {item.equipped
                          ? '👑'
                          : '✦'}
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

                        {item.unlockedAt && (
                          <small>
                            Unlocked{' '}
                            {new Date(
                              item.unlockedAt
                            ).toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }
                            )}
                          </small>
                        )}
                      </div>
                    </div>
                  )
                )
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

            <div
              className="panel"
              id="leaderboard"
            >
              <div className="panelHeader">
                <h2>LEADERBOARD</h2>

                <span
                  style={{
                    color: '#786b77',
                    fontSize: 10
                  }}
                >
                  Top 5
                </span>
              </div>

              <div className="rankList">
                {leaderboard.length ? (
                  leaderboard.map(
                    (
                      member,
                      index
                    ) => (
                      <div
                        className="rank"
                        key={`${member.display_name || 'member'}-${index}`}
                      >
                        <div className="rankNum">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            minWidth: 0
                          }}
                        >
                          <div
                            className="avatar"
                            style={
                              member.avatar_url
                                ? {
                                    width: 30,
                                    height: 30,
                                    flexShrink: 0,
                                    backgroundImage:
                                      `url(${member.avatar_url})`
                                  }
                                : {
                                    width: 30,
                                    height: 30,
                                    flexShrink: 0
                                  }
                            }
                          >
                            {!member.avatar_url &&
                              (
                                member.display_name ||
                                '?'
                              )
                                .charAt(0)
                                .toUpperCase()}
                          </div>

                          <div
                            style={{
                              minWidth: 0
                            }}
                          >
                            <strong>
                              {member.display_name ||
                                'Velvet Member'}
                            </strong>

                            <small>
                              Level {member.level ?? 1}
                            </small>
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: 'right'
                          }}
                        >
                          <b>
                            {Number(
                              member.xp || 0
                            ).toLocaleString()}
                          </b>

                          <small
                            style={{
                              display: 'block',
                              color: '#6e606d',
                              fontSize: 9,
                              marginTop: 2
                            }}
                          >
                            XP
                          </small>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="rank">
                    <div className="rankNum">—</div>

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

              <p
                style={{
                  color: '#786b77',
                  fontSize: 10,
                  margin: '12px 0 0'
                }}
              >
                Your current rank:{' '}
                <span
                  style={{
                    color: '#e1a1c4'
                  }}
                >
                  #{rank}
                </span>
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
