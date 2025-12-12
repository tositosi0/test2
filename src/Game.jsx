import React, { useRef, useEffect, useState } from 'react';
import './index.css';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const MAX_WEAPONS = 6;
const MAX_PASSIVES = 6;
const STAGE_DURATION = 60;
const VERSION = 'v1.0.41';
const MAX_GEMS = 40; // 経験値アイテムの上限
const MAX_PARTICLES = 30; // パーティクルの上限

const COLORS = {
    bg: '#050510', player: '#00f3ff', exp: '#2ecc71', enemy: '#ff0055',
    boss: '#ff4400', text: '#ffffff', bullet: '#ffff00', ui: '#151520',
    gold: '#ffd700', rare: '#bd00ff', btn: '#00f3ff'
};

const WEAPONS = {
    kunai: { name: 'ホーミングレイ', desc: '誘導光線', type: 'projectile', dmg: 15, speed: 18, cd: 12, count: 1 },
    shotgun: { name: 'プラズマバースト', desc: '拡散エネルギー弾', type: 'projectile', dmg: 10, speed: 12, cd: 45, count: 3, spread: 0.4 },
    rocket: { name: 'インパクトボム', desc: '爆轟弾', type: 'projectile', dmg: 30, speed: 10, cd: 50, count: 1, splash: 70 },
    lightning: { name: 'サンダークラッシュ', desc: '雷撃落下', type: 'random', dmg: 50, cd: 40 },
    orbit: { name: 'ビットシールド', desc: '回転バリア', type: 'orbit', dmg: 10, range: 65, count: 2, cd: 1 },
    aura: { name: 'ポイズンフィールド', desc: '毒霧領域', type: 'aura', dmg: 5, range: 90, cd: 8 },
    drill: { name: 'バウンスカッター', desc: '跳躍刃', type: 'projectile', dmg: 8, speed: 5, cd: 70, duration: 150, bounce: true },
    brick: { name: 'メテオハンマー', desc: '重力落下', type: 'projectile', dmg: 60, cd: 35, gravity: 0.9, vy: -13, pierce: true },
};

const PASSIVES = {
    power: { name: 'パワーチップ', desc: '攻撃力UP' },
    haste: { name: 'スピードブースト', desc: '攻撃速度UP' },
    speed: { name: 'モビリティコア', desc: '移動速度UP' },
    armor: { name: 'シールドプレート', desc: '被ダメ軽減' },
    maxhp: { name: 'バイタルドリンク', desc: '最大HPUP' },
    magnet: { name: 'マグネットフィールド', desc: '回収範囲UP' },
    area: { name: 'アンプリファイア', desc: '攻撃範囲UP' },
    cd: { name: 'クールダウンチップ', desc: 'CD短縮' }
};

function App() {
    const [scene, setScene] = useState('home');
    const [playerData, setPlayerData] = useState(() => {
        try {
            const saved = localStorage.getItem('neon_survivor_data');
            return saved ? JSON.parse(saved) : { coins: 500, stage: 1, stats: { atk: 1, hp: 1 } };
        } catch (e) { return { coins: 500, stage: 1, stats: { atk: 1, hp: 1 } }; }
    });
    const [gameResult, setGameResult] = useState(null);

    useEffect(() => {
        localStorage.setItem('neon_survivor_data', JSON.stringify(playerData));
    }, [playerData]);

    const upgradeCost = (lv) => (lv + 1) * 200;
    const buyUpgrade = (type) => {
        const cost = upgradeCost(playerData.stats[type]);
        if (playerData.coins >= cost) {
            setPlayerData(p => ({ ...p, coins: p.coins - cost, stats: { ...p.stats, [type]: p.stats[type] + 1 } }));
        }
    };

    const resetData = () => {
        if (window.confirm('本当にデータを削除しますか？')) {
            const init = { coins: 500, stage: 1, stats: { atk: 0, hp: 0 } };
            setPlayerData(init);
            localStorage.setItem('neon_survivor_data', JSON.stringify(init));
        }
    };

    return (
        <div className="app-container">
            {scene === 'home' && <HomeScreen data={playerData} onStart={() => setScene('game')} onUpgrade={buyUpgrade} costFn={upgradeCost} onReset={resetData} />}
            {scene === 'game' && <GameScreen stage={playerData.stage} baseStats={playerData.stats} onEnd={(res) => {
                setGameResult(res);
                const reward = res.coins + (res.won ? playerData.stage * 100 : 0);
                const nextStage = res.won ? playerData.stage + 1 : playerData.stage;
                setPlayerData(p => ({ ...p, coins: p.coins + reward, stage: Math.max(p.stage, nextStage) }));
                setScene('result');
            }} onAbort={() => setScene('home')} />}
            {scene === 'result' && <ResultScreen res={gameResult} onHome={() => setScene('home')} />}
        </div>
    );
}

function HomeScreen({ data, onStart, onUpgrade, costFn, onReset }) {
    return (
        <div className="home-screen">
            <div className="home-header">
                <div className="title-glow">NEON SURVIVOR</div>
                <div className="coin-display">
                    <span className="coin-amount">💰 {data.coins}</span>
                </div>
            </div>
            <button onClick={onReset} className="reset-button">🗑️ RESET</button>

            <div className="mission-card pulse-glow">
                <div className="mission-label">━━━ CURRENT MISSION ━━━</div>
                <div className="stage-number gradient-text">STAGE {data.stage}</div>
                <div className="mission-objective">⚠️ SURVIVE {STAGE_DURATION} SECONDS</div>
            </div>

            <div className="shop-section">
                <div className="shop-title">━ PERMANENT UPGRADES ━</div>
                {['atk', 'hp'].map(stat => (
                    <div key={stat} className="shop-card slide-in">
                        <div>
                            <div className="upgrade-name">
                                {stat === 'atk' ? '⚔️ POWER' : '❤️ HEALTH'}
                                <span className="upgrade-level">Lv.{data.stats[stat]}</span>
                            </div>
                            <div className="upgrade-effect">Effect: <span className="effect-value">+{data.stats[stat] * 25}%</span></div>
                        </div>
                        <button onClick={() => onUpgrade(stat)} disabled={data.coins < costFn(data.stats[stat])} className={`buy-button ${data.coins >= costFn(data.stats[stat]) ? 'buy-button-active' : 'buy-button-disabled'}`}>
                            💰 {costFn(data.stats[stat])}
                        </button>
                    </div>
                ))}
            </div>

            <button onClick={onStart} className="deploy-button glow-pulse">
                ▶ DEPLOY
            </button>
            <div className="version-text">{VERSION}</div>
        </div>
    );
}

function ResultScreen({ res, onHome }) {
    return (
        <div className="result-screen">
            <div className="result-screen">
                <div className={res.won ? 'result-title result-win' : 'result-title result-lose'}>
                    {res.won ? '✨ STAGE CLEAR' : '💀 DEFEATED'}
                </div>
                <div className="loot-card">
                    <div className="loot-label">LOOT COLLECTED</div>
                    <div className="loot-amount">💰 {res.coins} G</div>
                </div>
                <button onClick={onHome} className="home-button">◀ HOME</button>
            </div>
        </div>
    );
}

const IMAGES = {
    player: '/assets/player.png',
    enemy_normal: '/assets/enemy_normal.png',
    enemy_fast: '/assets/enemy_fast.png',
    enemy_tank: '/assets/enemy_tank.png',
    bullet: '/assets/bullet.png',
    gem_exp: '/assets/gem_exp.png?v=3',
    gem_coin: '/assets/gem_coin.png?v=3',
    bg: '/assets/bg.png',
};

function GameScreen({ stage, baseStats, onEnd, onAbort }) {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const imgs = useRef({});

    useEffect(() => {
        Object.keys(IMAGES).forEach(k => {
            const img = new Image();
            img.src = IMAGES[k];
            img.onload = () => {
                if (k === 'gem_exp' || k === 'gem_coin') {
                    // Create transparent version programmatically
                    const c = document.createElement('canvas');
                    c.width = img.width;
                    c.height = img.height;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const id = ctx.getImageData(0, 0, c.width, c.height);
                    const d = id.data;
                    for (let i = 0; i < d.length; i += 4) {
                        // If pixel is darker than threshold, make it transparent
                        if (d[i] < 40 && d[i + 1] < 40 && d[i + 2] < 40) {
                            d[i + 3] = 0;
                        }
                    }
                    ctx.putImageData(id, 0, 0);
                    imgs.current[k] = c;
                } else {
                    imgs.current[k] = img;
                }
            };
        });
    }, []);
    const startMaxHp = 100 * (1 + baseStats.hp * 0.25);
    const [hp, setHp] = useState(startMaxHp);
    const [maxHp, setMaxHp] = useState(startMaxHp);
    const [exp, setExp] = useState(0);
    const [lv, setLv] = useState(1);
    const [time, setTime] = useState(0);
    const [paused, setPaused] = useState(false);
    const [pauseMenu, setPauseMenu] = useState(false);
    const [options, setOptions] = useState([]);
    const [coins, setCoins] = useState(0);
    const [weaponList, setWeaponList] = useState(['kunai']);

    const g = useRef({
        frames: 0,
        player: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, speed: 4.5, facing: 1, facingVector: { x: 0, y: -1 } },
        joy: { active: false, x: 0, y: 0, dx: 0, dy: 0 },
        stats: { atk: 1 + baseStats.atk * 0.25, spd: 1, cd: 1, area: 1, magnet: 60 },
        weapons: { kunai: 1 }, passives: {},
        enemies: [], bullets: [], gems: [], particles: [], texts: [], effects: [],
        cds: {}, nextExp: 10
    });

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = GAME_WIDTH; canvasRef.current.height = GAME_HEIGHT;
        const loop = () => {
            if (hp <= 0 && !paused) { onEnd({ won: false, coins: coins + g.current.gems.filter(gm => gm.type === 'coin').reduce((sum, gm) => sum + gm.val, 0) }); return; }
            if (time >= STAGE_DURATION && !paused) { onEnd({ won: true, coins: coins + g.current.gems.filter(gm => gm.type === 'coin').reduce((sum, gm) => sum + gm.val, 0) }); return; }
            if (!paused) update(g.current);
            draw(ctx, g.current);
            if (hp > 0 && time < STAGE_DURATION) requestRef.current = requestAnimationFrame(loop);
        };
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [paused, hp, time]);

    const update = (s) => {
        s.frames++;
        if (s.frames % 60 === 0) setTime(t => t + 1);
        s.stats.atk = (1 + baseStats.atk * 0.25) * (1 + (s.passives.power || 0) * 0.1);
        s.stats.cd = Math.max(0.4, 1 - (s.passives.cd || 0) * 0.1);
        s.stats.area = 1 + (s.passives.area || 0) * 0.1;
        s.stats.magnet = 60 * (1 + (s.passives.magnet || 0) * 0.2);

        const difficulty = stage + time / 30;
        if (s.frames % Math.max(12, 45 - Math.floor(difficulty * 2)) === 0) {
            const edge = Math.floor(Math.random() * 4);
            const angle = Math.random() * Math.PI * 2;
            const dist = 400;
            const ex = s.player.x + Math.cos(angle) * dist;
            const ey = s.player.y + Math.sin(angle) * dist;

            const enemyType = Math.random() < 0.3 ? 'fast' : (Math.random() < 0.5 ? 'tank' : 'normal');
            const size = enemyType === 'tank' ? 15 : (enemyType === 'fast' ? 9 : 12);
            const hp = enemyType === 'tank' ? (12 + difficulty * 8) * 1.5 : (12 + difficulty * 8);
            const speed = enemyType === 'fast' ? (1.6 + difficulty * 0.05) * 1.3 : (1.6 + difficulty * 0.05);
            const color = enemyType === 'tank' ? '#ff4400' : (enemyType === 'fast' ? '#ff00ff' : COLORS.enemy);

            if (ex > 0 && ex < WORLD_WIDTH && ey > 0 && ey < WORLD_HEIGHT) {
                s.enemies.push({ x: ex, y: ey, hp, maxHp: hp, speed, color, size, type: enemyType });
            }
        }

        if (s.joy.active) {
            const moveSpd = s.player.speed * (1 + (s.passives.speed || 0) * 0.1);
            s.player.x += s.joy.dx * moveSpd; s.player.y += s.joy.dy * moveSpd;
            s.player.x = Math.max(10, Math.min(WORLD_WIDTH - 10, s.player.x));
            s.player.y = Math.max(10, Math.min(WORLD_HEIGHT - 10, s.player.y));
            if (s.joy.dx !== 0) s.player.facing = Math.sign(s.joy.dx);
            const len = Math.sqrt(s.joy.dx ** 2 + s.joy.dy ** 2);
            if (len > 0.1) s.player.facingVector = { x: s.joy.dx / len, y: s.joy.dy / len };
        }

        s.enemies.forEach(e => {
            const dx = s.player.x - e.x, dy = s.player.y - e.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d > 0) { e.x += dx / d * e.speed; e.y += dy / d * e.speed; }
            if (d < 15 && s.frames % 30 === 0) {
                setHp(h => h - Math.max(1, (10 + stage * 2) * (1 - (s.passives.armor || 0) * 0.1)));
                spawnTxt(s, s.player.x, s.player.y, `-DMG`, 'red');
            }
        });

        Object.keys(s.weapons).forEach(k => {
            const lv = s.weapons[k], conf = WEAPONS[k];
            if (!s.cds[k]) s.cds[k] = 0;
            if (s.cds[k] <= 0) { fireWeapon(s, k, conf, lv); s.cds[k] = Math.max(5, conf.cd * s.stats.cd); }
            else s.cds[k]--;
        });

        s.bullets = s.bullets.filter(b => {
            b.x += b.vx; b.y += b.vy; b.life--;
            if (b.gravity) b.vy += b.gravity;
            if (b.bounce) { if (b.x <= 0 || b.x >= WORLD_WIDTH) b.vx *= -1; if (b.y <= 0 || b.y >= WORLD_HEIGHT) b.vy *= -1; }
            let hit = false;
            for (let e of s.enemies) {
                if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.size + 6) ** 2) {
                    e.hp -= b.dmg; spawnTxt(s, e.x, e.y, Math.floor(b.dmg), '#fff');
                    if (b.splash) s.enemies.forEach(e2 => { if ((e2.x - b.x) ** 2 + (e2.y - b.y) ** 2 < b.splash ** 2) e2.hp -= b.dmg * 0.5; });
                    if (!b.pierce) { hit = true; break; }
                }
            }
            return b.life > 0 && !hit && (b.bounce || (b.x > -50 && b.x < WORLD_WIDTH + 50 && b.y > -50 && b.y < WORLD_HEIGHT + 50));
        });

        if (s.weapons.orbit) {
            const cnt = 2, r = 65 * s.stats.area, t = Date.now() / 500;
            const lv = s.weapons.orbit, dmg = 10 * lv * s.stats.atk;
            for (let i = 0; i < cnt; i++) {
                const a = t + i * (Math.PI * 2 / cnt);
                const ox = s.player.x + Math.cos(a) * r, oy = s.player.y + Math.sin(a) * r;
                s.enemies.forEach(e => {
                    if ((e.x - ox) ** 2 + (e.y - oy) ** 2 < 25 ** 2 && s.frames % 10 === 0) {
                        e.hp -= dmg;
                    }
                });
            }
        }

        s.enemies = s.enemies.filter(e => {
            if (e.hp <= 0) {
                if (s.gems.length < MAX_GEMS) {
                    s.gems.push({ x: e.x, y: e.y, val: 1, type: 'exp' });
                }
                if (Math.random() < 0.2 && s.gems.length < MAX_GEMS) {
                    s.gems.push({ x: e.x, y: e.y, val: 10, type: 'coin' });
                }
                spawnPart(s, e.x, e.y, e.color, 4);
                return false;
            }
            return true;
        });

        // Gem Merging Optimization
        if (s.frames % 30 === 0) {
            for (let i = 0; i < s.gems.length; i++) {
                for (let j = i + 1; j < s.gems.length; j++) {
                    const g1 = s.gems[i], g2 = s.gems[j];
                    if (!g1 || !g2) continue;
                    if (g1.type === g2.type) {
                        const dist = (g1.x - g2.x) ** 2 + (g1.y - g2.y) ** 2;
                        if (dist < 30 ** 2) {
                            g1.val += g2.val;
                            g1.x = (g1.x + g2.x) / 2;
                            g1.y = (g1.y + g2.y) / 2;
                            s.gems.splice(j, 1);
                            j--;
                        }
                    }
                }
            }
        }

        s.gems = s.gems.filter(gm => {
            const d = Math.sqrt((gm.x - s.player.x) ** 2 + (gm.y - s.player.y) ** 2);
            if (d < s.stats.magnet) { gm.x += (s.player.x - gm.x) * 0.2; gm.y += (s.player.y - gm.y) * 0.2; }
            if (d < 20) {
                if (gm.type === 'coin') { setCoins(c => c + gm.val); spawnTxt(s, s.player.x, s.player.y - 20, `+${gm.val}G`, COLORS.gold); }
                else { setExp(prev => { const next = prev + gm.val; if (next >= g.current.nextExp) { setTimeout(triggerLevelUp, 0); return 0; } return next; }); }
                return false;
            }
            return true;
        });

        s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0 });
        s.texts = s.texts.filter(t => { t.y -= 0.5; t.life--; return t.life > 0 });
        s.effects = s.effects.filter(e => { e.life--; return e.life > 0; });
    };

    const fireWeapon = (s, k, conf, lv) => {
        const dmg = conf.dmg * lv * s.stats.atk;
        const t = getNearest(s);
        if (conf.type === 'projectile') {
            let aimAng = (t && Math.sqrt((t.x - s.player.x) ** 2 + (t.y - s.player.y) ** 2) < 250) ? Math.atan2(t.y - s.player.y, t.x - s.player.x) : Math.atan2(s.player.facingVector.y, s.player.facingVector.x);
            const count = conf.count || 1;
            for (let i = 0; i < count; i++) {
                let fd = count > 1 ? (i - (count - 1) / 2) * (conf.spread || 0.2) : 0;
                let vx = Math.cos(aimAng + fd) * (conf.speed || 10), vy = Math.sin(aimAng + fd) * (conf.speed || 10);
                if (conf.vy !== undefined) vy = conf.vy;
                if (conf.gravity) vx = s.player.facing * 2;
                s.bullets.push({ x: s.player.x, y: s.player.y, vx, vy, dmg, life: conf.duration || 60, splash: conf.splash, pierce: conf.pierce, bounce: conf.bounce, gravity: conf.gravity, color: COLORS.bullet, weaponId: k });
            }
        } else if (conf.type === 'random' && s.enemies.length > 0) {
            const target = s.enemies[Math.floor(Math.random() * s.enemies.length)];
            target.hp -= dmg;
            spawnTxt(s, target.x, target.y, dmg, COLORS.bullet);
            s.effects.push({ type: 'lightning', x: target.x, y: target.y, life: 10 });
        } else if (conf.type === 'aura') {
            s.enemies.forEach(e => { if ((e.x - s.player.x) ** 2 + (e.y - s.player.y) ** 2 < (conf.range * s.stats.area) ** 2) { e.hp -= dmg; if (s.frames % 20 === 0) spawnTxt(s, e.x, e.y, Math.floor(dmg), '#0f0'); } });
        }
    };

    const triggerLevelUp = () => {
        setPaused(true);
        g.current.nextExp = Math.floor(g.current.nextExp * 1.5);
        setLv(prev => prev + 1);
        const pool = [];
        Object.keys(g.current.weapons).forEach(k => pool.push({ id: k, itemType: 'weapon', ...WEAPONS[k], lv: g.current.weapons[k] + 1 }));
        Object.keys(g.current.passives).forEach(k => pool.push({ id: k, itemType: 'passive', ...PASSIVES[k], lv: g.current.passives[k] + 1 }));
        if (Object.keys(g.current.weapons).length < MAX_WEAPONS) Object.keys(WEAPONS).forEach(k => { if (!g.current.weapons[k]) pool.push({ id: k, itemType: 'weapon', ...WEAPONS[k], lv: 1 }); });
        if (Object.keys(g.current.passives).length < MAX_PASSIVES) Object.keys(PASSIVES).forEach(k => { if (!g.current.passives[k]) pool.push({ id: k, itemType: 'passive', ...PASSIVES[k], lv: 1 }); });
        pool.sort(() => 0.5 - Math.random());
        const choices = [], seen = new Set();
        for (let p of pool) { if (!seen.has(p.id)) { choices.push(p); seen.add(p.id); } if (choices.length >= 3) break; }
        setOptions(choices);
    };

    const selectOption = (opt) => {
        if (opt.itemType === 'weapon') {
            g.current.weapons[opt.id] = opt.lv;
            setWeaponList(Object.keys(g.current.weapons));
        } else {
            g.current.passives[opt.id] = opt.lv;
            if (opt.id === 'maxhp') { setMaxHp(h => h * 1.2); setHp(h => h * 1.2); }
        }
        setOptions([]);
        setPaused(false);
    };

    const getNearest = (s) => { let t = null, min = Infinity; s.enemies.forEach(e => { const d = (e.x - s.player.x) ** 2 + (e.y - s.player.y) ** 2; if (d < min) { min = d; t = e; } }); return t; };
    const spawnTxt = (s, x, y, t, c) => s.texts.push({ x, y, text: t, color: c, life: 30 });
    const spawnPart = (s, x, y, c, n) => {
        const maxAdd = Math.min(n, MAX_PARTICLES - s.particles.length);
        for (let i = 0; i < maxAdd; i++) s.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 10, color: c });
    };

    const draw = (ctx, s) => {
        // Camera Calculation: keep player centered in viewport
        const camX = Math.max(0, Math.min(WORLD_WIDTH - GAME_WIDTH, s.player.x - GAME_WIDTH / 2));
        const camY = Math.max(0, Math.min(WORLD_HEIGHT - GAME_HEIGHT, s.player.y - GAME_HEIGHT / 2));

        // Clear Screen
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.save();
        ctx.translate(-camX, -camY);

        // Draw Background (Tiled)
        if (imgs.current.bg && imgs.current.bg.complete) {
            const ptrn = ctx.createPattern(imgs.current.bg, 'repeat');
            ctx.fillStyle = ptrn;
            ctx.fillRect(camX, camY, GAME_WIDTH, GAME_HEIGHT);
        } else {
            // Draw Grid if no BG
            const gridPulse = 0.3 + Math.sin(Date.now() / 1000) * 0.2;
            ctx.strokeStyle = `rgba(0, 243, 255, ${gridPulse * 0.1})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < WORLD_WIDTH; i += 40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_HEIGHT); ctx.stroke();
            }
            for (let i = 0; i < WORLD_HEIGHT; i += 40) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WORLD_WIDTH, i); ctx.stroke();
            }
        }

        // Dark Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(camX, camY, GAME_WIDTH, GAME_HEIGHT);

        // Add glow for sprites
        ctx.globalCompositeOperation = 'lighter';

        // Aura Visual
        if (s.weapons.aura) {
            const range = WEAPONS.aura.range * s.stats.area;
            const alpha = 0.1 + Math.sin(Date.now() / 200) * 0.05;
            const grad = ctx.createRadialGradient(s.player.x, s.player.y, 0, s.player.x, s.player.y, range);
            grad.addColorStop(0, 'rgba(0, 255, 100, 0)');
            grad.addColorStop(0.8, `rgba(0, 255, 100, ${alpha})`);
            grad.addColorStop(1, 'rgba(0, 255, 100, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(s.player.x, s.player.y, range, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = `rgba(0, 255, 100, ${alpha * 2})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(s.player.x, s.player.y, range, 0, Math.PI * 2); ctx.stroke();
        }

        s.gems.forEach(g => {
            const size = 10;
            const img = g.type === 'coin' ? imgs.current.gem_coin : imgs.current.gem_exp;
            // Fix: Check for image OR canvas validity. Correct logic to fix fallback to circles.
            if (img && (img.complete || img instanceof HTMLCanvasElement)) {
                ctx.save();
                ctx.translate(g.x, g.y);
                const p = Math.sin(Date.now() / 200 + g.x) * 0.2 + 1;
                ctx.scale(p, p);
                ctx.drawImage(img, -size, -size, size * 2, size * 2);
                ctx.restore();
            } else {
                ctx.fillStyle = g.type === 'coin' ? COLORS.gold : COLORS.exp;
                ctx.beginPath(); ctx.arc(g.x, g.y, 5, 0, Math.PI * 2); ctx.fill();
            }
        });

        s.bullets.forEach(b => {
            const img = imgs.current.bullet;
            if (img && img.complete) {
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.drawImage(img, -8, -8, 16, 16);
                ctx.restore();
            } else {
                ctx.fillStyle = b.color;
                ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
            }
        });

        s.enemies.forEach(e => {
            let img = imgs.current.enemy_normal;
            if (e.type === 'fast') img = imgs.current.enemy_fast;
            if (e.type === 'tank') img = imgs.current.enemy_tank;

            if (img && img.complete) {
                ctx.save();
                ctx.translate(e.x, e.y);
                const rot = e.type === 'fast' ? (e.x > s.player.x ? Math.PI : 0) : 0;
                if (e.type === 'fast') ctx.rotate(rot);

                // Pulsating hit effect
                if (e.maxHp > e.hp) ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 50) * 0.2;

                ctx.drawImage(img, -e.size, -e.size, e.size * 2, e.size * 2);
                ctx.globalAlpha = 1;
                ctx.restore();
            } else {
                ctx.fillStyle = e.color;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
            }
        });

        // Lightning Effects
        s.effects.forEach(e => {
            if (e.type === 'lightning') {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(e.x, e.y - 300); // Sky
                ctx.lineTo(e.x, e.y);
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(e.x, e.y, 15 * (e.life / 10), 0, Math.PI * 2);
                ctx.fill();
            }
        });

        const pulse = 1 + Math.sin(Date.now() / 300) * 0.05;
        ctx.save();
        ctx.translate(s.player.x, s.player.y);
        ctx.scale(pulse, pulse);

        // Player
        if (imgs.current.player && imgs.current.player.complete) {
            const pSize = 25;
            ctx.drawImage(imgs.current.player, -pSize, -pSize, pSize * 2, pSize * 2);
        } else {
            ctx.fillStyle = COLORS.player;
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        ctx.globalCompositeOperation = 'source-over';

        if (s.weapons.orbit) {
            const cnt = 2, r = 65 * s.stats.area, t = Date.now() / 500;
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = COLORS.player;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(s.player.x, s.player.y, r, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;

            for (let i = 0; i < cnt; i++) {
                const a = t + i * (Math.PI * 2 / cnt);
                const ox = s.player.x + Math.cos(a) * r;
                const oy = s.player.y + Math.sin(a) * r;

                ctx.save();
                ctx.translate(ox, oy);
                ctx.rotate(t * 3);

                const img = imgs.current.bullet;
                if (img && img.complete) {
                    ctx.drawImage(img, -8, -8, 16, 16);
                } else {
                    ctx.fillStyle = COLORS.player;
                    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            }
        }

        s.particles.forEach(p => {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = p.life / 10;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        s.texts.forEach(t => {
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = t.color;
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#000';
            ctx.fillText(t.text, t.x, t.y);
            ctx.shadowBlur = 0;
        });

        // Restore camera
        ctx.restore();

        if (s.joy.active) {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(s.joy.sx, s.joy.sy, 40, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(s.joy.x, s.joy.y, 16, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    // Helper for pixel centering
    const onePixel = (s) => s * 2; // Simple offset helper

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTouchStart = (e) => {
            e.preventDefault();
            const t = e.changedTouches[0];
            const r = canvas.getBoundingClientRect();
            g.current.joy = { active: true, sx: t.clientX - r.left, sy: t.clientY - r.top, x: t.clientX - r.left, y: t.clientY - r.top, dx: 0, dy: 0 };
        };

        const handleTouchMove = (e) => {
            e.preventDefault();
            if (!g.current.joy.active) return;
            const t = e.changedTouches[0];
            const r = canvas.getBoundingClientRect();
            const cx = t.clientX - r.left, cy = t.clientY - r.top;
            let dx = cx - g.current.joy.sx, dy = cy - g.current.joy.sy;
            const d = Math.sqrt(dx * dx + dy * dy), max = 40;
            if (d > max) { dx = dx / d * max; dy = dy / d * max; }
            g.current.joy.dx = dx / max;
            g.current.joy.dy = dy / max;
            g.current.joy.x = g.current.joy.sx + dx;
            g.current.joy.y = g.current.joy.sy + dy;
        };

        const handleTouchEnd = (e) => {
            e.preventDefault();
            g.current.joy.active = false;
            g.current.joy.dx = 0;
            g.current.joy.dy = 0;
        };

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    const handleMouseDown = (e) => { const t = e; const r = canvasRef.current.getBoundingClientRect(); g.current.joy = { active: true, sx: t.clientX - r.left, sy: t.clientY - r.top, x: t.clientX - r.left, y: t.clientY - r.top, dx: 0, dy: 0 }; };
    const handleMouseMove = (e) => { if (!e.buttons) return; if (!g.current.joy.active) return; const t = e; const r = canvasRef.current.getBoundingClientRect(), cx = t.clientX - r.left, cy = t.clientY - r.top; let dx = cx - g.current.joy.sx, dy = cy - g.current.joy.sy; const d = Math.sqrt(dx * dx + dy * dy), max = 40; if (d > max) { dx = dx / d * max; dy = dy / d * max; } g.current.joy.dx = dx / max; g.current.joy.dy = dy / max; g.current.joy.x = g.current.joy.sx + dx; g.current.joy.y = g.current.joy.sy + dy; };
    const handleMouseUp = () => { g.current.joy.active = false; g.current.joy.dx = 0; g.current.joy.dy = 0; };

    return (
        <div className="game-screen">
            <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
            <div className="hud">
                <div className="hud-stats">
                    <div className="hud-stat">⏱️ {STAGE_DURATION - time}s</div>
                    <div className="hud-stat">💰 {coins}</div>
                    <div className="hud-stat">LV.{lv}</div>
                </div>
                <div className="weapon-list">⚡ {weaponList.map(k => WEAPONS[k].name).join(' • ')}</div>
                <div className="hud-bars">
                    <div className="hud-bar"><div className="hud-bar-fill exp-bar" style={{ width: `${Math.min(100, exp / g.current.nextExp * 100)}%` }}></div></div>
                    <div className="hud-bar"><div className="hud-bar-fill hp-bar" style={{ width: `${Math.min(100, hp / maxHp * 100)}%` }}></div></div>
                </div>
                {!paused && (
                    <button
                        className="pause-button"
                        onClick={() => { setPaused(true); setPauseMenu(true); }}
                    >
                        ⏸️
                    </button>
                )}
            </div>
            {
                pauseMenu && (
                    <div className="pause-overlay">
                        <div className="pause-title">PAUSED</div>
                        <div className="pause-options">
                            <button className="pause-btn resume" onClick={() => { setPauseMenu(false); setPaused(false); }}>▶ RESUME</button>
                            <button className="pause-btn home" onClick={onAbort}>🏠 HOME</button>
                        </div>
                    </div>
                )
            }
            {
                paused && options.length > 0 && (
                    <div className="levelup-overlay">
                        <div className="levelup-title">⚡ LEVEL UP!</div>
                        <div className="levelup-options">
                            {options.map((opt, i) => (
                                <button key={i} onClick={() => selectOption(opt)} className={`levelup-card ${opt.lv === 1 ? 'levelup-card-new' : 'levelup-card-upgrade'} ${opt.itemType === 'weapon' ? 'card-weapon' : 'card-passive'}`}>
                                    <div className="levelup-card-header">
                                        <div className="levelup-card-name">{opt.name}</div>
                                        <span className={`levelup-badge ${opt.lv === 1 ? 'badge-new' : 'badge-upgrade'}`}>
                                            {opt.lv === 1 ? '✨ NEW' : 'Lv.' + opt.lv}
                                        </span>
                                    </div>
                                    <div className="levelup-card-desc">{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default App;
