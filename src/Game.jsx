import React, { useRef, useEffect, useState } from 'react';
import './index.css';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const MAX_WEAPONS = 6;
const MAX_PASSIVES = 6;
const STAGE_DURATION = 60;
const VERSION = 'v1.0.0';
const MAX_GEMS = 50; // 経験値アイテムの上限
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
            <div className={res.won ? 'result-title result-win' : 'result-title result-lose'}>
                {res.won ? '✨ STAGE CLEAR' : '💀 DEFEATED'}
            </div>
            <div className="loot-card">
                <div className="loot-label">LOOT COLLECTED</div>
                <div className="loot-amount">💰 {res.coins} G</div>
            </div>
            <button onClick={onHome} className="home-button">◀ HOME</button>
        </div>
    );
}

function GameScreen({ stage, baseStats, onEnd, onAbort }) {
    const canvasRef = useRef(null);
    const requestRef = useRef();
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
        player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, speed: 4.5, facing: 1, facingVector: { x: 0, y: -1 } },
        joy: { active: false, x: 0, y: 0, dx: 0, dy: 0 },
        stats: { atk: 1 + baseStats.atk * 0.25, spd: 1, cd: 1, area: 1, magnet: 60 },
        weapons: { kunai: 1 }, passives: {},
        enemies: [], bullets: [], gems: [], particles: [], texts: [],
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
            let ex, ey;
            if (edge === 0) { ex = Math.random() * GAME_WIDTH; ey = -20; }
            else if (edge === 1) { ex = GAME_WIDTH + 20; ey = Math.random() * GAME_HEIGHT; }
            else if (edge === 2) { ex = Math.random() * GAME_WIDTH; ey = GAME_HEIGHT + 20; }
            else { ex = -20; ey = Math.random() * GAME_HEIGHT; }
            const enemyType = Math.random() < 0.3 ? 'fast' : (Math.random() < 0.5 ? 'tank' : 'normal');
            const size = enemyType === 'tank' ? 15 : (enemyType === 'fast' ? 9 : 12);
            const hp = enemyType === 'tank' ? (12 + difficulty * 8) * 1.5 : (12 + difficulty * 8);
            const speed = enemyType === 'fast' ? (1.6 + difficulty * 0.05) * 1.3 : (1.6 + difficulty * 0.05);
            const color = enemyType === 'tank' ? '#ff4400' : (enemyType === 'fast' ? '#ff00ff' : COLORS.enemy);
            s.enemies.push({ x: ex, y: ey, hp, maxHp: hp, speed, color, size, type: enemyType });
        }

        if (s.joy.active) {
            const moveSpd = s.player.speed * (1 + (s.passives.speed || 0) * 0.1);
            s.player.x += s.joy.dx * moveSpd; s.player.y += s.joy.dy * moveSpd;
            s.player.x = Math.max(10, Math.min(GAME_WIDTH - 10, s.player.x));
            s.player.y = Math.max(10, Math.min(GAME_HEIGHT - 10, s.player.y));
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
            if (b.bounce) { if (b.x <= 0 || b.x >= GAME_WIDTH) b.vx *= -1; if (b.y <= 0 || b.y >= GAME_HEIGHT) b.vy *= -1; }
            let hit = false;
            for (let e of s.enemies) {
                if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.size + 6) ** 2) {
                    e.hp -= b.dmg; spawnTxt(s, e.x, e.y, Math.floor(b.dmg), '#fff');
                    if (b.splash) s.enemies.forEach(e2 => { if ((e2.x - b.x) ** 2 + (e2.y - b.y) ** 2 < b.splash ** 2) e2.hp -= b.dmg * 0.5; });
                    if (!b.pierce) { hit = true; break; }
                }
            }
            return b.life > 0 && !hit && (b.bounce || (b.x > -50 && b.x < GAME_WIDTH + 50 && b.y > -50 && b.y < GAME_HEIGHT + 50));
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
            target.hp -= dmg; spawnTxt(s, target.x, target.y, dmg, COLORS.bullet); spawnPart(s, target.x, target.y, COLORS.bullet, 6);
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
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const gridPulse = 0.3 + Math.sin(Date.now() / 1000) * 0.2;
        ctx.strokeStyle = `rgba(0, 243, 255, ${gridPulse * 0.15})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < GAME_WIDTH; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, GAME_HEIGHT);
            ctx.stroke();
        }
        for (let i = 0; i < GAME_HEIGHT; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(GAME_WIDTH, i);
            ctx.stroke();
        }

        s.gems.forEach(g => {
            const pulseSize = 5 + Math.sin(Date.now() / 200 + g.x) * 0.6;
            const color = g.type === 'coin' ? COLORS.gold : COLORS.exp;

            ctx.shadowBlur = 15;
            ctx.shadowColor = color;

            const gradient = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, pulseSize * 2);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, color + '80');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(g.x, g.y, pulseSize * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(g.x, g.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        s.bullets.forEach(b => {
            const size = 4;
            ctx.save();
            ctx.translate(b.x, b.y);

            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = b.color;

            // Bullet Sprite (Simple Pulse Ball)
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            ctx.shadowBlur = 0;
        });

        s.enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);

            // Enemy Sprite Logic
            const pixelSize = e.size / 5;
            const color = e.color;

            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fillStyle = color;

            if (e.type === 'tank') {
                // Tank Enemy (Square-ish, sturdy)
                // [ x x x ]
                // [ x x x ]
                // [ x x x ]
                ctx.fillRect(-e.size, -e.size, e.size * 2, e.size * 2);

                // Eye
                ctx.fillStyle = '#fff';
                ctx.fillRect(-pixelSize, -pixelSize, pixelSize * 2, pixelSize * 2);
            } else if (e.type === 'fast') {
                // Fast Enemy (Arrow/Triangle)
                ctx.beginPath();
                ctx.moveTo(0, -e.size);
                ctx.lineTo(e.size, e.size);
                ctx.lineTo(-e.size, e.size);
                ctx.closePath();
                ctx.fill();

                // Eye
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 0, pixelSize * 1.5, 0, Math.PI * 2);
                ctx.fill();

            } else {
                // Normal Enemy (Invader style)
                //  x   x
                //   xxx 
                //  x x x
                ctx.fillRect(-e.size, -e.size / 2, e.size * 2, e.size); // Body
                ctx.fillRect(-e.size, -e.size, pixelSize * 2, pixelSize * 2); // Ear L
                ctx.fillRect(e.size - pixelSize * 2, -e.size, pixelSize * 2, pixelSize * 2); // Ear R
                ctx.fillRect(-e.size + pixelSize, e.size / 2, pixelSize * 2, pixelSize * 3); // Leg L
                ctx.fillRect(e.size - pixelSize * 3, e.size / 2, pixelSize * 2, pixelSize * 3); // Leg R

                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(-e.size / 2, -pixelSize, pixelSize, pixelSize);
                ctx.fillRect(e.size / 2 - pixelSize, -pixelSize, pixelSize, pixelSize);
            }

            ctx.restore();
            ctx.shadowBlur = 0;
        });

        const pulse = 1 + Math.sin(Date.now() / 300) * 0.05;
        ctx.save();
        ctx.translate(s.player.x, s.player.y);
        ctx.scale(pulse, pulse);
        if (s.player.facing < 0) ctx.scale(-1, 1); // Flip if moving left

        // Player Ship Pixel Art (Retro Fighter)
        // 16x16 grid approximation
        const pSize = 3;

        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.player;
        ctx.fillStyle = COLORS.player;

        // Main Body
        //    x
        //   xxx
        //  xxxxx
        // xx x xx
        ctx.beginPath();
        // Nose
        ctx.rect(-pSize, -5 * pSize, 2 * pSize, 2 * pSize);
        // Fuselage
        ctx.rect(-2 * pSize, -3 * pSize, 4 * pSize, 6 * pSize);
        // Wings
        ctx.rect(-5 * pSize, 0, 3 * pSize, 4 * pSize);
        ctx.rect(2 * pSize, 0, 3 * pSize, 4 * pSize);
        // Wing Tips
        ctx.rect(-6 * pSize, 2 * pSize, pSize, 4 * pSize);
        ctx.rect(5 * pSize, 2 * pSize, pSize, 4 * pSize);
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.rect(-pSize, -onePixel(pSize), 2 * pSize, 2 * pSize);
        ctx.fill();

        // Engine Fire
        const engineFlicker = Math.random() > 0.5 ? 1 : 0.8;
        ctx.fillStyle = `rgba(255, 200, 0, ${engineFlicker})`;
        ctx.shadowColor = '#ffaa00';
        ctx.beginPath();
        ctx.rect(-2 * pSize, 4 * pSize, pSize, 3 * pSize * engineFlicker);
        ctx.rect(pSize, 4 * pSize, pSize, 3 * pSize * engineFlicker);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;

        if (s.weapons.orbit) {
            const cnt = 2, r = 65 * s.stats.area, t = Date.now() / 500;

            ctx.globalAlpha = 0.15;
            ctx.strokeStyle = COLORS.player;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(s.player.x, s.player.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            for (let i = 0; i < cnt; i++) {
                const a = t + i * (Math.PI * 2 / cnt);
                const ox = s.player.x + Math.cos(a) * r;
                const oy = s.player.y + Math.sin(a) * r;

                ctx.save();
                ctx.translate(ox, oy);
                ctx.rotate(t * 2);

                const bitGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
                bitGlow.addColorStop(0, '#ffffff');
                bitGlow.addColorStop(0.3, COLORS.player);
                bitGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = bitGlow;
                ctx.shadowBlur = 18;
                ctx.shadowColor = COLORS.player;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = COLORS.player;
                ctx.beginPath();
                ctx.moveTo(0, -5);
                ctx.lineTo(3, 0);
                ctx.lineTo(0, 5);
                ctx.lineTo(-3, 0);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
                ctx.shadowBlur = 0;
            }
        }

        s.particles.forEach(p => {
            ctx.globalAlpha = p.life / 10;

            const partGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4);
            partGlow.addColorStop(0, p.color);
            partGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = partGlow;
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;

        s.texts.forEach(t => {
            ctx.font = 'bold 11px Arial';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = t.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = t.color;
            ctx.fillText(t.text, t.x, t.y);
            ctx.shadowBlur = 0;
        });

        if (s.joy.active) {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,243,255,0.4)';
            ctx.beginPath();
            ctx.arc(s.joy.sx, s.joy.sy, 40, 0, Math.PI * 2);
            ctx.stroke();

            const stickGrad = ctx.createRadialGradient(s.joy.x, s.joy.y, 0, s.joy.x, s.joy.y, 16);
            stickGrad.addColorStop(0, '#ffffff');
            stickGrad.addColorStop(0.5, 'rgba(0,255,255,0.8)');
            stickGrad.addColorStop(1, 'rgba(0,255,255,0.2)');
            ctx.fillStyle = stickGrad;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f3ff';
            ctx.beginPath();
            ctx.arc(s.joy.x, s.joy.y, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(s.joy.x, s.joy.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
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
