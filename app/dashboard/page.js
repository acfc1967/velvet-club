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
  } catch { return null; }
}

function supabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getDashboardData(discordId) {
  if (!discordId) return { profile: null, achievements: [], titles: [], leaderboard: [], allAchievementDefinitions: [], allTitleDefinitions: [] };
  const supabase = supabaseClient();
  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('discord_id', discordId).single();
  if (profileError) console.error('VELVET PROFILE ERROR:', profileError);
  const { data: achievementLinks, error: achievementLinksError } = await supabase.from('member_achievements').select('achievement_id, unlocked_at').eq('discord_id', discordId).order('unlocked_at', { ascending: false });
  if (achievementLinksError) console.error('VELVET ACHIEVEMENT LINK ERROR:', achievementLinksError);
  const { data: allAchievementDefinitions, error: allAchievementsError } = await supabase.from('achievements').select('id, achievement_name, description, rarity, icon, xp_reward, coin_reward').order('rarity', { ascending: false });
  if (allAchievementsError) console.error('VELVET ALL ACHIEVEMENTS ERROR:', allAchievementsError);
  let achievements = [];
  if (!achievementLinksError && achievementLinks?.length) {
    const ids = achievementLinks.map(item => item.achievement_id);
    const { data: definitions, error: definitionsError } = await supabase.from('achievements').select('id, achievement_name, description, rarity, icon, xp_reward, coin_reward').in('id', ids);
    if (definitionsError) console.error('VELVET ACHIEVEMENT DEFINITIONS ERROR:', definitionsError);
    const byId = new Map((definitions || []).map(item => [item.id, item]));
    achievements = achievementLinks.map(item => ({ unlocked_at: item.unlocked_at, achievements: byId.get(item.achievement_id) || null })).filter(item => item.achievements);
  }
  const { data: titleLinks, error: titleLinksError } = await supabase.from('member_titles').select('title_id, unlocked_at, equipped').eq('discord_id', discordId);
  if (titleLinksError) console.error('VELVET TITLE LINK ERROR:', titleLinksError);
  const { data: allTitleDefinitions, error: allTitlesError } = await supabase.from('titles').select('id, title_name').order('title_name');
  if (allTitlesError) console.error('VELVET ALL TITLES ERROR:', allTitlesError);
  let titles = [];
  if (!titleLinksError && titleLinks?.length) {
    const ids = titleLinks.map(item => item.title_id);
    const { data: definitions, error: definitionsError } = await supabase.from('titles').select('id, title_name').in('id', ids);
    if (definitionsError) console.error('VELVET TITLE DEFINITIONS ERROR:', definitionsError);
    const byId = new Map((definitions || []).map(item => [item.id, item]));
    titles = titleLinks.map(item => ({ unlocked_at: item.unlocked_at, equipped: item.equipped === true, titles: byId.get(item.title_id) || null })).filter(item => item.titles);
  }
  const { data: leaderboard, error: leaderboardError } = await supabase.from('profiles').select('display_name, level, xp, title, avatar_url').order('xp', { ascending: false }).limit(5);
  if (leaderboardError) console.error('VELVET LEADERBOARD ERROR:', leaderboardError);
  return { profile, achievements, titles, leaderboard: leaderboard || [], allAchievementDefinitions: allAchievementDefinitions || [], allTitleDefinitions: allTitleDefinitions || [] };
}

export default async function Dashboard() {
  const session = await getSession();
  const discordId = session?.id || session?.discord_id || null;
  const { profile, achievements, titles, leaderboard, allAchievementDefinitions, allTitleDefinitions } = await getDashboardData(discordId);
  const displayName = profile?.display_name || session?.username || 'Velvet Member';
  const username = profile?.username || session?.username || '';
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url || null;
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const coins = profile?.coins || 0;
  const currentTitle = titles.find(item => item.equipped)?.titles?.title_name || profile?.title || 'New Member';
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { month:'short', year:'numeric' }) : 'Recently';
  const nextLevelXP = 5000;
  const progress = Math.min((xp / nextLevelXP) * 100, 100);
  const xpRemaining = Math.max(nextLevelXP - xp, 0);
  const rarityClass = rarity => `rarity rarity-${String(rarity || 'Common').toLowerCase()}`;
  const formatDate = date => date ? new Date(date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '';
  const achievementCount = achievements.length;
  const titleCount = titles.length;
  const unlockedAchievementIds = new Set(achievements.map(item => item.achievements?.id));
  const lockedAchievements = allAchievementDefinitions.filter(item => !unlockedAchievementIds.has(item.id));
  const unlockedTitleIds = new Set(titles.map(item => item.titles?.id));
  const lockedTitleCount = Math.max(allTitleDefinitions.length - unlockedTitleIds.size, 0);
  const rarityOrder = ['Legendary','Epic','Rare','Common'];
  const trophiesByRarity = rarityOrder.map(rarity => ({ rarity, items: achievements.filter(item => String(item.achievements?.rarity || 'Common').toLowerCase() === rarity.toLowerCase()) })).filter(group => group.items.length);
  const nextLocked = lockedAchievements.slice(0, 3);

  return (
    <main className="dashboardShell velvetPortal">
      <style dangerouslySetInnerHTML={{ __html: `
        .velvetPortal{min-height:100vh;position:relative;overflow:hidden;background:#08060b;color:#f8f2f7;isolation:isolate}
        .velvetPortal:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-5;background:radial-gradient(circle at 12% 12%,rgba(231,75,164,.18),transparent 28%),radial-gradient(circle at 88% 22%,rgba(118,67,210,.16),transparent 30%),radial-gradient(circle at 52% 90%,rgba(218,54,151,.11),transparent 28%);animation:velvetNebula 18s ease-in-out infinite alternate}
        .velvetPortal:after{content:"";position:fixed;inset:0;pointer-events:none;z-index:-4;opacity:.3;background-image:radial-gradient(circle at 20% 30%,#fff 0 1px,transparent 1.5px),radial-gradient(circle at 75% 70%,#fff 0 1px,transparent 1.5px),radial-gradient(circle at 55% 15%,#fff 0 1px,transparent 1.5px);background-size:170px 170px,230px 230px,310px 310px;animation:starDrift 30s linear infinite}
        .velvetAmbient{position:fixed;border-radius:50%;filter:blur(70px);pointer-events:none;z-index:-3;opacity:.22}.velvetAmbient.a{width:360px;height:360px;left:-160px;top:30%;background:#d948a0;animation:ambientA 12s ease-in-out infinite alternate}.velvetAmbient.b{width:420px;height:420px;right:-190px;bottom:8%;background:#7650c8;animation:ambientB 15s ease-in-out infinite alternate}.velvetLayout{position:relative;z-index:1}
        .velvetTopline{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}.velvetBack{display:inline-flex;align-items:center;gap:9px;color:#9d8b9b;font:500 11px/1 Inter,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;transition:.3s}.velvetBack:hover{color:#f4a5ca;transform:translateX(-3px)}
        .velvetHero{position:relative;margin-bottom:34px;padding:34px 38px;border:1px solid rgba(255,255,255,.09);border-radius:30px;background:linear-gradient(135deg,rgba(255,255,255,.055),rgba(255,255,255,.018));backdrop-filter:blur(18px);box-shadow:0 25px 80px rgba(0,0,0,.25),inset 0 1px rgba(255,255,255,.05);overflow:hidden}.velvetHero:after{content:"";position:absolute;width:300px;height:300px;right:-120px;top:-160px;border-radius:50%;background:rgba(232,91,164,.13);filter:blur(20px);animation:heroOrb 10s ease-in-out infinite alternate}.velvetHeroInner{display:flex;align-items:center;gap:24px;position:relative;z-index:1}.velvetAvatarWrap{width:98px;height:98px;padding:3px;border-radius:31px;background:linear-gradient(135deg,#ef8fbd,#7040a4,#d94e96);box-shadow:0 0 35px rgba(224,77,158,.24);animation:avatarGlow 4s ease-in-out infinite}.velvetAvatar{width:100%;height:100%;border-radius:28px;background:#211524 center/cover no-repeat;display:grid;place-items:center;font:500 34px 'Playfair Display',Georgia,serif;color:#f6b4d2}.velvetHero .eyebrow{margin:0 0 10px}.velvetHero h1{margin:0;font:400 clamp(38px,5vw,64px)/.98 'Playfair Display',Georgia,serif;letter-spacing:-.045em}.velvetHero h1 em{font-style:italic;color:#ef8fbd;text-shadow:0 0 28px rgba(239,143,189,.16)}.velvetHeroSub{margin:12px 0 0;color:#a999a7;font:14px/1.6 Inter,Arial,sans-serif}.velvetBadge{margin-left:auto;align-self:flex-start;padding:10px 14px;border:1px solid rgba(239,143,189,.25);border-radius:999px;color:#e8a4c6;background:rgba(217,78,150,.07);font:600 10px Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}.profileIdentity{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:15px}.identityPill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#a99ba8;font:500 10px Inter,Arial,sans-serif}.identityPill strong{color:#ded3dc;font-weight:600}.identityPill.title{border-color:rgba(239,143,189,.22);background:rgba(239,143,189,.055);color:#ef9fc5}.identityPill.member{border-color:rgba(189,156,255,.18);background:rgba(189,156,255,.045);color:#bd9cff}.identityLine{width:1px;height:14px;background:rgba(255,255,255,.09)}
        .profilePresence{display:flex;align-items:center;gap:8px;margin-top:16px;color:#756977;font:500 9px Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}.presenceDot{width:7px;height:7px;border-radius:50%;background:#7ee2ad;box-shadow:0 0 12px rgba(126,226,173,.65);animation:presencePulse 2.5s ease-in-out infinite}
        .gridStats .statCard{position:relative;overflow:hidden;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));border:1px solid rgba(255,255,255,.09);border-radius:24px;box-shadow:0 18px 50px rgba(0,0,0,.18);backdrop-filter:blur(16px)}.gridStats .statCard:before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 35%,rgba(255,255,255,.07),transparent 65%);transform:translateX(-130%);animation:cardSheen 6s ease-in-out infinite}.gridStats .statCard:nth-child(2):before{animation-delay:1s}.gridStats .statCard:nth-child(3):before{animation-delay:2s}.gridStats .statCard:nth-child(4):before{animation-delay:3s}.statCard .statIcon{border-radius:15px;background:rgba(231,89,164,.09);border:1px solid rgba(231,89,164,.12)}.statCard small{font:600 10px Inter,Arial,sans-serif;letter-spacing:.16em;color:#8f7d8c}.statCard strong{font-family:'Playfair Display',Georgia,serif}.statCard em{font-family:Inter,Arial,sans-serif;font-style:normal;color:#8f7d8c;font-size:11px}
        .contentGrid .panel{position:relative;background:linear-gradient(145deg,rgba(255,255,255,.048),rgba(255,255,255,.014));border:1px solid rgba(255,255,255,.085);border-radius:26px;box-shadow:0 20px 65px rgba(0,0,0,.2);backdrop-filter:blur(16px);overflow:hidden}.contentGrid .panel:before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(239,143,189,.32),transparent)}.panelHeader h2{font-family:Inter,Arial,sans-serif;font-size:10px;letter-spacing:.18em;font-weight:700}.panelHeader>span{font:500 10px Inter,Arial,sans-serif;color:#756977}
        .achievement{display:flex;gap:16px;padding:17px 10px;border-bottom:1px solid rgba(255,255,255,.055);border-radius:16px;transition:transform .3s ease,background .3s ease,box-shadow .3s ease}.achievement:last-child{border-bottom:0}.achievement:hover{background:rgba(224,75,157,.045);transform:translateX(4px);box-shadow:inset 2px 0 rgba(239,143,189,.25)}
        .achievementBadge{flex:0 0 52px;width:52px;height:52px;display:grid;place-items:center;border-radius:17px;background:linear-gradient(145deg,rgba(235,82,164,.12),rgba(111,66,174,.08));border:1px solid rgba(235,132,190,.15);font-size:23px;box-shadow:0 0 20px rgba(224,77,158,.08);animation:trophyFloat 4s ease-in-out infinite}.achievement:nth-child(3) .achievementBadge{animation-delay:.4s}.achievement:nth-child(4) .achievementBadge{animation-delay:.8s}.achievement:nth-child(5) .achievementBadge{animation-delay:1.2s}
        .achievementText{min-width:0}.achievementText strong{display:block;font:500 17px 'Playfair Display',Georgia,serif;color:#f6eef4}.achievementText>small{display:block;margin-top:3px;color:#9d8f9d;font:12px/1.5 Inter,Arial,sans-serif}.achievementMeta{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.achievementMeta span{padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.065);color:#c9bdc7;font:500 10px Inter,Arial,sans-serif}.achievementMeta .rarity{font-weight:700;letter-spacing:.08em}.rarity-common{color:#d2ccd5!important;border-color:rgba(210,204,213,.2)!important;background:rgba(210,204,213,.045)!important}.rarity-rare{color:#ef8fbd!important;border-color:rgba(239,143,189,.28)!important;background:rgba(239,143,189,.065)!important;box-shadow:0 0 15px rgba(239,143,189,.07)}.rarity-epic{color:#bd9cff!important;border-color:rgba(189,156,255,.3)!important;background:rgba(189,156,255,.065)!important;box-shadow:0 0 16px rgba(189,156,255,.08)}.rarity-legendary{color:#f3d37e!important;border-color:rgba(243,211,126,.34)!important;background:rgba(243,211,126,.07)!important;box-shadow:0 0 18px rgba(243,211,126,.09);animation:legendaryPulse 3s ease-in-out infinite}.achievementMeta span:not(.rarity){color:#d5c9d2}.achievementDate{margin-top:8px!important;color:#6f6270!important;font-size:10px!important}
        .titleCard{position:relative;display:flex;align-items:center;gap:16px;margin:14px 0 0;padding:18px;border-radius:20px;border:1px solid rgba(239,143,189,.14);background:linear-gradient(135deg,rgba(239,143,189,.07),rgba(112,64,164,.045));overflow:hidden;transition:.35s;box-shadow:inset 0 1px rgba(255,255,255,.04)}.titleCard:before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 25%,rgba(255,255,255,.07),transparent 70%);transform:translateX(-120%);animation:titleSheen 5s ease-in-out infinite}.titleCard.equipped{border-color:rgba(239,143,189,.34);box-shadow:0 0 28px rgba(224,77,158,.1),inset 0 1px rgba(255,255,255,.07)}.titleCard:hover{transform:translateY(-2px);border-color:rgba(239,143,189,.35)}.titleCrest{position:relative;z-index:1;flex:0 0 54px;width:54px;height:54px;display:grid;place-items:center;border-radius:17px;background:linear-gradient(145deg,rgba(239,143,189,.13),rgba(112,64,164,.1));border:1px solid rgba(239,143,189,.2);font-size:24px}.titleCard.equipped .titleCrest{animation:crownPulse 3s ease-in-out infinite}.titleCopy{position:relative;z-index:1;min-width:0}.titleCopy strong{display:block;font:500 18px 'Playfair Display',Georgia,serif;color:#f8eef5}.titleCopy small{display:block;margin-top:4px;color:#988997;font:11px/1.5 Inter,Arial,sans-serif}.titleEquipped{display:inline-flex;margin-top:8px;padding:4px 8px;border-radius:999px;border:1px solid rgba(239,143,189,.28);background:rgba(239,143,189,.07);color:#ef9fc5;font:700 9px Inter,Arial,sans-serif;letter-spacing:.12em}.titleDate{margin-top:7px!important;color:#6f6270!important;font-size:10px!important}
        .xpBar{height:12px;border-radius:999px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.06);padding:2px;overflow:hidden}.xpFill{height:100%;border-radius:999px;background:linear-gradient(90deg,#d94e96,#9b55b5,#ef8fbd);box-shadow:0 0 22px rgba(217,78,150,.35);position:relative}.xpFill:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);animation:xpSweep 2.8s ease-in-out infinite}.rank{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:14px;padding:13px 10px;border-radius:15px;transition:.3s}.rank:hover{background:rgba(217,78,150,.045);transform:translateX(4px)}.rankNum{font:500 13px 'Playfair Display',Georgia,serif;color:#8f7d8c}.rank strong{font:500 15px 'Playfair Display',Georgia,serif}.rank small{display:block;color:#756977;font:10px Inter,Arial,sans-serif;margin-top:2px}.rank b{font:600 12px Inter,Arial,sans-serif;color:#d8cbd6;text-align:right}.emptyState{padding:25px 10px;color:#8f7d8c}.emptyState strong{font:500 17px 'Playfair Display',Georgia,serif;color:#e5dbe3}.emptyState p{font:12px Inter,Arial,sans-serif}
        @keyframes velvetNebula{0%{transform:scale(1) translate3d(0,0,0)}100%{transform:scale(1.1) translate3d(2%,-1%,0)}}@keyframes starDrift{from{transform:translate3d(0,0,0)}to{transform:translate3d(35px,45px,0)}}@keyframes ambientA{from{transform:translate(0,0)}to{transform:translate(90px,-70px)}}@keyframes ambientB{from{transform:translate(0,0)}to{transform:translate(-80px,-50px)}}@keyframes heroOrb{from{transform:translate(0,0) scale(1)}to{transform:translate(-50px,35px) scale(1.25)}}@keyframes avatarGlow{0%,100%{box-shadow:0 0 25px rgba(224,77,158,.2)}50%{box-shadow:0 0 42px rgba(224,77,158,.38)}}@keyframes presencePulse{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}@keyframes cardSheen{0%,55%{transform:translateX(-130%)}75%,100%{transform:translateX(130%)}}@keyframes xpSweep{0%,45%{transform:translateX(-120%)}75%,100%{transform:translateX(120%)}}@keyframes trophyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes legendaryPulse{0%,100%{box-shadow:0 0 10px rgba(243,211,126,.05)}50%{box-shadow:0 0 22px rgba(243,211,126,.18)}}@keyframes crownPulse{0%,100%{transform:scale(1);box-shadow:0 0 12px rgba(239,143,189,.08)}50%{transform:scale(1.05);box-shadow:0 0 25px rgba(239,143,189,.22)}}@keyframes legendaryCardPulse{0%,100%{box-shadow:0 0 0 rgba(243,211,126,0)}50%{box-shadow:0 0 34px rgba(243,211,126,.08)}}@keyframes titleSheen{0%,55%{transform:translateX(-120%)}78%,100%{transform:translateX(130%)}}

        .cabinetIntro{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:12px 0 18px;padding:14px;border-radius:18px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06)}
        .cabinetCount{font:700 10px Inter,Arial,sans-serif;letter-spacing:.15em;color:#ef9fc5}
        .raritySection{margin-top:18px}
        .rarityHeading{font:700 10px Inter,Arial,sans-serif;letter-spacing:.18em;color:#9d8f9d;margin-bottom:10px}
        .trophyGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
        .trophyCard{padding:18px;border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.015));border:1px solid rgba(255,255,255,.08)}
        .trophyTop{display:flex;justify-content:space-between;align-items:center}
        .trophyRewards{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
        .trophyRewards span{padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.045);font:600 10px Inter,Arial,sans-serif}
        .lockedCabinet{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px}
        .lockedTrophy{padding:16px;border-radius:20px;background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.1)}
        .lockedTitle{display:flex;gap:14px;align-items:center;margin-top:14px;padding:14px;border-radius:18px;background:rgba(255,255,255,.025)}


        .trophyCard{position:relative;overflow:hidden;transition:transform .35s ease,border-color .35s ease,box-shadow .35s ease}
        .trophyCard:before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 25%,rgba(255,255,255,.08),transparent 70%);transform:translateX(-130%);animation:trophySheen 7s ease-in-out infinite}
        .trophyCard:hover{transform:translateY(-6px)}
        .trophy-legendary{border-color:rgba(243,211,126,.35);box-shadow:0 0 30px rgba(243,211,126,.12)}
        .trophy-epic{border-color:rgba(189,156,255,.32);box-shadow:0 0 28px rgba(189,156,255,.1)}
        .trophy-rare{border-color:rgba(239,143,189,.32);box-shadow:0 0 25px rgba(239,143,189,.1)}
        .trophy-common{border-color:rgba(210,204,213,.2)}
        .trophyIcon{position:relative;z-index:1;width:58px;height:58px;display:grid;place-items:center;border-radius:18px;background:rgba(255,255,255,.04);font-size:28px}
        .trophyCard h3{position:relative;z-index:1;margin:14px 0 7px;font:500 20px 'Playfair Display',Georgia,serif}
        .trophyCard p{position:relative;z-index:1}
        .lockedTrophy{transition:.35s;backdrop-filter:blur(12px)}
        .lockedTrophy:hover{transform:translateY(-4px);border-color:rgba(239,143,189,.25)}
        .mysteryMark{font-size:34px;display:block;color:#ef9fc5;text-shadow:0 0 18px rgba(239,143,189,.3)}
        .titleShowcase{position:relative;overflow:hidden;padding:24px;border-radius:24px;background:linear-gradient(135deg,rgba(239,143,189,.1),rgba(112,64,164,.08));border:1px solid rgba(239,143,189,.25);text-align:center;box-shadow:0 0 35px rgba(239,143,189,.1)}
        .titleShowcase .titleCrown{font-size:38px;animation:crownPulse 3s infinite}
        .titleShowcase h3{margin:12px 0 6px;font:500 24px 'Playfair Display',Georgia,serif}
        @keyframes trophySheen{0%,55%{transform:translateX(-130%)}75%,100%{transform:translateX(130%)}}


        /* UPDATE 5.1 - Desktop layout polish */
        .dashboardLayout{
          display:grid;
          grid-template-columns:260px minmax(0,1fr);
          gap:28px;
          width:min(1500px, calc(100% - 48px));
          margin:0 auto;
          padding:28px 0;
        }
        .mainPanel{
          min-width:0;
          width:100%;
        }
        .mainPanel > *{
          min-height:0;
        }
        .contentGrid{
          display:grid;
          grid-template-columns:minmax(0,1fr) 380px;
          grid-template-rows:auto auto auto;
          gap:24px;
          align-items:start;
        }
        .contentGrid .panel{
          min-width:0;
          height:max-content;
          align-self:start;
        }
        #progress{
          grid-column:1;
          grid-row:1;
        }
        #achievements{
          grid-column:2;
          grid-row:1 / span 3;
        }
        #titles{
          grid-column:1;
          grid-row:2;
        }
        #leaderboard{
          grid-column:1;
          grid-row:3;
        }
        .trophyGrid{
          grid-template-columns:1fr;
        }
        @media(max-width:1100px){
          .dashboardLayout{
            grid-template-columns:1fr;
            width:min(100% - 32px, 1000px);
          }
          .contentGrid{
            grid-template-columns:1fr;
          }
          #achievements,#titles,#leaderboard,#progress{
            grid-column:auto;
            grid-row:auto;
          }
        }

        @media(max-width:760px){.velvetHero{padding:26px 20px}.velvetHeroInner{align-items:flex-start;gap:16px}.velvetAvatarWrap{width:70px;height:70px;border-radius:22px}.velvetAvatar{border-radius:19px;font-size:25px}.velvetHero h1{font-size:34px;line-height:1.02;overflow-wrap:anywhere}.velvetHeroSub{font-size:12px;line-height:1.55}.velvetBadge{display:none}.profileIdentity{margin-top:12px;gap:6px}.identityPill{font-size:9px;padding:5px 8px}.profilePresence{margin-top:12px}.velvetTopline{margin-bottom:18px}.gridStats .statCard{border-radius:20px}.contentGrid .panel{border-radius:22px}.achievementText strong{font-size:16px}.achievementBadge{flex-basis:46px;width:46px;height:46px}.titleCard{padding:15px}.titleCrest{flex-basis:48px;width:48px;height:48px}.titleCopy strong{font-size:17px}}
        @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
      `}} />
      <div className="velvetAmbient a" /><div className="velvetAmbient b" /><div className="dashboardGlow" />
      <div className="dashboardLayout velvetLayout">
        <aside className="sidebar"><a className="sideBrand" href="/" aria-label="Return to Velvet Club home"><span>✦</span> VELVET</a><div className="sideLabel">MEMBER AREA</div><nav className="sideNav"><a className="active" href="#top"><span>✦</span>Overview</a><a href="#progress"><span>◇</span>Progress</a><a href="#achievements"><span>🏆</span>Achievements</a><a href="#titles"><span>👑</span>Titles</a><a href="#leaderboard"><span>♢</span>Leaderboard</a></nav><div className="sideBottom"><small>VELVET MEMBER</small><strong>{displayName}</strong></div></aside>
        <section className="mainPanel" id="top">
          <header className="topbar velvetTopline"><a className="mobileBrand" href="/" aria-label="Return to Velvet Club home"><span>✦</span> VELVET</a><a className="velvetBack" href="/"><span>←</span> Return to the Club</a><div className="profileChip"><div className="avatar" style={avatarUrl ? {backgroundImage:`url(${avatarUrl})`} : undefined}>{!avatarUrl && initial}</div><span>{displayName}</span></div></header>
          <section className="velvetHero"><div className="velvetHeroInner"><div className="velvetAvatarWrap"><div className="velvetAvatar" style={avatarUrl ? {backgroundImage:`url(${avatarUrl})`} : undefined}>{!avatarUrl && initial}</div></div><div className="identityContent"><p className="eyebrow">YOUR VELVET PROFILE</p><h1>Welcome back, <em>{displayName}.</em></h1><p className="velvetHeroSub">Your journey, your achievements, your place in the Club.</p><div className="profileIdentity">{username && <span className="identityPill">@<strong>{username}</strong></span>}<span className="identityPill title">👑 <strong>{currentTitle}</strong></span><span className="identityPill member">✦ Member since <strong>{memberSince}</strong></span></div><div className="profilePresence"><span className="presenceDot" /> Velvet member profile</div></div><div className="velvetBadge">✦ {currentTitle}</div></div></section>
          <section className="gridStats"><div className="statCard"><div className="statIcon">✦</div><small>LEVEL</small><strong>{level}</strong><em>{currentTitle}</em></div><div className="statCard"><div className="statIcon">◇</div><small>VELVET XP</small><strong>{xp.toLocaleString()}</strong><em>/ {nextLevelXP.toLocaleString()}</em></div><div className="statCard"><div className="statIcon">◆</div><small>COINS</small><strong>{coins.toLocaleString()}</strong><em>Velvet Coins</em></div><div className="statCard"><div className="statIcon">🏆</div><small>ACHIEVEMENTS</small><strong>{achievements.length}</strong><em>earned</em></div></section>
          <section className="contentGrid">
            <div className="panel" id="progress"><div className="panelHeader"><h2>YOUR PROGRESS</h2><span>LEVEL {level}</span></div><p style={{color:'#b5a7b3',fontSize:13,marginBottom:14}}>Level {level} <span style={{color:'#716471'}}>•</span> {currentTitle}</p><div className="xpBar"><div className="xpFill" style={{width:`${progress}%`}} /></div><div className="xpMeta"><span>{xp.toLocaleString()} XP</span><span>{nextLevelXP.toLocaleString()} XP</span></div><div style={{color:'#786b77',fontSize:10,marginTop:14}}>{xpRemaining.toLocaleString()} XP until level {level + 1}</div></div>
            <div className="panel" id="achievements"><div className="panelHeader"><h2>VELVET TROPHY CABINET</h2><span>{achievementCount} / {allAchievementDefinitions.length || achievementCount} UNLOCKED</span></div><div className="cabinetIntro"><div><strong>Your collection</strong><p>Every trophy marks a moment in your Velvet journey.</p></div><div className="cabinetCount">{achievementCount} EARNED</div></div>{trophiesByRarity.length ? trophiesByRarity.map(group => <div className="raritySection" key={group.rarity}><div className="rarityHeading">{group.rarity.toUpperCase()}</div><div className="trophyGrid">{group.items.map((item,index) => { const a=item.achievements; const rarity=String(a.rarity || 'Common').toLowerCase(); return (<article className={`trophyCard trophy-${rarity}`} key={`${a.id}-${index}`}><div className="trophyTop"><div className="trophyIcon">{a.icon || '🏆'}</div><span className="trophyRarity">{String(a.rarity || 'Common').toUpperCase()}</span></div><h3>{a.achievement_name}</h3><p>{a.description}</p><div className="trophyRewards"><span>⭐ +{a.xp_reward || 0} XP</span><span>🪙 +{a.coin_reward || 0}</span></div><small className="trophyDate">Unlocked {formatDate(item.unlocked_at)}</small></article>); })}</div></div>) : <div className="emptyState"><strong>Your first trophy is waiting.</strong><p>Begin your Velvet journey to unlock the cabinet.</p></div>}{lockedAchievements.length ? <div className="lockedCabinet">{nextLocked.map((a,index) => <article className="lockedTrophy" key={`locked-${a.id}`}><span className="mysteryMark">?</span><div className="trophyIcon">{a.icon || '🏆'}</div><h3>Locked Trophy</h3><p>Keep exploring the Club. A new reward is waiting to be discovered.</p></article>)}</div> : null}</div>
            <div className="panel" id="titles"><div className="panelHeader"><h2>TITLE COLLECTION</h2><span>{titleCount} / {allTitleDefinitions.length || titleCount} UNLOCKED</span></div><div className="titleShowcase"><div className="titleCrown">👑</div><h3>{currentTitle}</h3><p>Your equipped Velvet identity</p><span>✦ EQUIPPED TITLE ✦</span></div>{titles.filter(item => !item.equipped).length ? titles.filter(item => !item.equipped).map((item,index) => <div className="titleCard" key={`${item.titles?.title_name}-${index}`}><div className="titleCrest">✦</div><div className="titleCopy"><strong>{item.titles?.title_name || 'Unknown Title'}</strong><small>Unlocked title</small>{item.unlocked_at && <small className="titleDate">Unlocked {formatDate(item.unlocked_at)}</small>}</div></div>) : <div className="emptyState"><strong>No additional titles yet</strong><p>Your first title is waiting to be earned ✦</p></div>}{lockedTitleCount ? <div className="lockedTitle"><div className="crest">✦</div><div><strong>{lockedTitleCount} title slot{lockedTitleCount === 1 ? '' : 's'} locked</strong><small>More Velvet identities will appear as you unlock them.</small></div></div> : null}</div>
            <div className="panel" id="leaderboard"><div className="panelHeader"><h2>LEADERBOARD</h2><span>TOP 5</span></div>{leaderboard.length ? <div className="rankList">{leaderboard.map((member,index) => <div className="rank" key={`${member.display_name}-${index}`}><div className="rankNum">{String(index+1).padStart(2,'0')}</div><div><strong>{member.display_name || 'Velvet Member'}</strong><small>Level {member.level || 1}</small></div><div><b>{Number(member.xp || 0).toLocaleString()}</b><small>XP</small></div></div>)}</div> : <div className="emptyState"><strong>No leaderboard data</strong><p>Earn XP to appear here.</p></div>}</div>
          </section>
        </section>
      </div>
    </main>
  );
}
