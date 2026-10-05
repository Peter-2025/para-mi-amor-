/**
 * ============================================================
 * FLORES AMARILLAS - ANIMACIÓN DEL ÁRBOL EN FORMA DE CORAZÓN
 * Reproduce fielmente el video viral de @alexx.dev
 * ============================================================
 */

(function () {
    'use strict';

    // --- DOM Elements ---
    const introOverlay = document.getElementById('introOverlay');
    const openGiftBtn = document.getElementById('openGiftBtn');
    const whatsappCard = document.getElementById('whatsappCard');
    const bgMusic = document.getElementById('bgMusic');
    const musicBtn = document.getElementById('musicBtn');
    const configBtn = document.getElementById('configBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const saveCfgBtn = document.getElementById('saveCfgBtn');
    const closeCfgBtn = document.getElementById('closeCfgBtn');

    const treeCanvas = document.getElementById('treeCanvas');
    const treeCtx = treeCanvas.getContext('2d');
    const ambientCanvas = document.getElementById('ambientCanvas');
    const ambientCtx = ambientCanvas.getContext('2d');

    const letterWrapper = document.getElementById('letterWrapper');
    const letterTitle = document.getElementById('letterTitle');
    const letterBody = document.getElementById('letterBody');
    const letterSignature = document.getElementById('letterSignature');
    const counterCard = document.getElementById('counterCard');
    const daysNum = document.getElementById('daysNum');
    const hoursNum = document.getElementById('hoursNum');
    const minutesNum = document.getElementById('minutesNum');
    const secondsNum = document.getElementById('secondsNum');

    // Modal Inputs
    const cfgTitle = document.getElementById('cfgTitle');
    const cfgBody = document.getElementById('cfgBody');
    const cfgSign = document.getElementById('cfgSign');
    const cfgDate = document.getElementById('cfgDate');

    // --- Configuration State ---
    const DEFAULT_CONFIG = {
        title: "Flores Amarillas para el\namor de mi vida:",
        body: "Si pudiera elegir un lugar\nseguro, sería a tu lado.\n\nCuanto más tiempo estoy\ncontigo más te amo.",
        signature: "— I Love You ❤️",
        // Default to exactly 364 days, 23 hours, 59 mins ago like in the video
        startDate: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000) + 12000).toISOString().split('T')[0]
    };

    let userConfig = { ...DEFAULT_CONFIG };
    try {
        const saved = localStorage.getItem('flores_amarillas_cfg');
        if (saved) {
            userConfig = Object.assign(userConfig, JSON.parse(saved));
        }
    } catch (e) {
        console.warn('LocalStorage error:', e);
    }

    // --- Canvas Dimensions & Retina Support ---
    let width = 0;
    let height = 0;
    let dpr = 1;
    let groundY = 0;

    function resizeCanvases() {
        const container = treeCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        dpr = window.devicePixelRatio || 1;

        width = rect.width;
        height = rect.height;

        treeCanvas.width = width * dpr;
        treeCanvas.height = height * dpr;
        treeCtx.resetTransform();
        treeCtx.scale(dpr, dpr);

        ambientCanvas.width = window.innerWidth * dpr;
        ambientCanvas.height = window.innerHeight * dpr;
        ambientCtx.resetTransform();
        ambientCtx.scale(dpr, dpr);

        groundY = height - Math.max(38, height * 0.08);
    }

    window.addEventListener('resize', () => {
        resizeCanvases();
    });

    // --- Pre-render Sunflower Sprites for 60fps Performance ---
    const flowerSprites = [];
    const SPRITE_SIZES = [12, 16, 20, 24, 28, 32];

    function createSunflowerSprites() {
        flowerSprites.length = 0;
        SPRITE_SIZES.forEach(sz => {
            const pad = sz * 0.4;
            const fullSz = (sz + pad) * 2;
            const off = document.createElement('canvas');
            off.width = fullSz * 2; // high res
            off.height = fullSz * 2;
            const octx = off.getContext('2d');
            octx.scale(2, 2);
            octx.translate(fullSz / 2, fullSz / 2);

            const petalCount = 14;
            const petalLen = sz * 0.58;
            const petalWid = sz * 0.22;
            const centerR = sz * 0.28;

            // Outer petal layer (golden orange)
            octx.fillStyle = '#e69500';
            for (let i = 0; i < petalCount; i++) {
                const angle = (i * 2 * Math.PI) / petalCount + (Math.PI / petalCount);
                octx.save();
                octx.rotate(angle);
                octx.beginPath();
                octx.ellipse(petalLen * 0.65, 0, petalLen * 0.45, petalWid * 0.45, 0, 0, Math.PI * 2);
                octx.fill();
                octx.restore();
            }

            // Inner petal layer (vibrant yellow)
            octx.fillStyle = '#ffc300';
            for (let i = 0; i < petalCount; i++) {
                const angle = (i * 2 * Math.PI) / petalCount;
                octx.save();
                octx.rotate(angle);
                octx.beginPath();
                octx.moveTo(centerR * 0.5, 0);
                octx.quadraticCurveTo(petalLen * 0.6, petalWid * 0.5, petalLen, 0);
                octx.quadraticCurveTo(petalLen * 0.6, -petalWid * 0.5, centerR * 0.5, 0);
                octx.fill();
                octx.restore();
            }

            // Center disc (dark cocoa with rim)
            octx.fillStyle = '#5c310c';
            octx.beginPath();
            octx.arc(0, 0, centerR, 0, Math.PI * 2);
            octx.fill();

            const grad = octx.createRadialGradient(0, 0, 0, 0, 0, centerR * 0.85);
            grad.addColorStop(0, '#301804');
            grad.addColorStop(0.7, '#482508');
            grad.addColorStop(1, '#61340e');
            octx.fillStyle = grad;
            octx.beginPath();
            octx.arc(0, 0, centerR * 0.85, 0, Math.PI * 2);
            octx.fill();

            // Seed stipples
            octx.fillStyle = '#a66a25';
            for (let s = 0; s < 7; s++) {
                const sr = centerR * 0.5;
                const sa = (s * Math.PI * 2) / 7;
                octx.beginPath();
                octx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, sz * 0.035, 0, Math.PI * 2);
                octx.fill();
            }

            flowerSprites.push({ canvas: off, size: sz, fullSz });
        });
    }

    createSunflowerSprites();

    // Single petal sprite for falling petals
    const petalCanvas = document.createElement('canvas');
    petalCanvas.width = 40;
    petalCanvas.height = 40;
    const pctx = petalCanvas.getContext('2d');
    pctx.translate(20, 20);
    pctx.fillStyle = '#ffbe0b';
    pctx.beginPath();
    pctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = '#fb5607';
    pctx.globalAlpha = 0.4;
    pctx.beginPath();
    pctx.ellipse(-3, 0, 5, 2.5, 0, 0, Math.PI * 2);
    pctx.fill();

    // --- Heart Silhouette Flower Distribution ---
    // Parametric heart formula:
    // x(t) = 16 * sin^3(t)
    // y(t) = -(13*cos(t) - 5*cos(2t) - 2*cos(3t) - cos(4t))
    function getHeartPos(t) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return { x, y };
    }

    let flowers = [];
    let treeBranches = [];
    let treeShiftX = 0; // Shifts from 0 (center) to targetX (right side)
    let targetShiftX = 0;

    function buildHeartFlowers(heartCenterX, heartCenterY, heartScale) {
        flowers = [];
        const count = 340;

        // 1. Boundary flowers (define the sharp heart shape)
        const boundaryCount = 80;
        for (let i = 0; i < boundaryCount; i++) {
            const t = (i / boundaryCount) * Math.PI * 2;
            const p = getHeartPos(t);
            const r = 0.98 + (Math.random() - 0.5) * 0.06;
            const sz = 16 + Math.random() * 10;
            flowers.push({
                relX: p.x * heartScale * r,
                relY: p.y * heartScale * r,
                size: sz,
                spriteIdx: Math.floor(Math.random() * flowerSprites.length),
                rotation: Math.random() * Math.PI * 2,
                bloomDelay: 0.15 + (Math.random() * 0.7),
                scale: 0,
                bloomed: false
            });
        }

        // 2. Interior flowers (uniform fill inside heart)
        for (let i = 0; i < count; i++) {
            const t = Math.random() * Math.PI * 2;
            const p = getHeartPos(t);
            // Area distribution: r = sqrt(uniform)
            const r = Math.sqrt(Math.random()) * 0.94;
            const sz = 14 + Math.random() * 14;

            // Slight vertical & horizontal natural jitter
            const jitterX = (Math.random() - 0.5) * heartScale * 1.5;
            const jitterY = (Math.random() - 0.5) * heartScale * 1.5;

            // Bloom starts closer to trunk and spreads outward
            const distFromBottom = Math.hypot(p.x * r, (p.y * r) - 16);
            const normDist = Math.min(1, distFromBottom / 32);

            flowers.push({
                relX: (p.x * heartScale * r) + jitterX,
                relY: (p.y * heartScale * r) + jitterY,
                size: sz,
                spriteIdx: Math.floor(Math.random() * flowerSprites.length),
                rotation: Math.random() * Math.PI * 2,
                bloomDelay: (normDist * 0.6) + (Math.random() * 0.4),
                scale: 0,
                bloomed: false
            });
        }

        // Sort so background flowers render first
        flowers.sort((a, b) => a.relY - b.relY);
    }

    // --- Branch Generation ---
    function buildTreeStructure(baseX, baseY, heartCenterY, heartScale) {
        treeBranches = [];

        // Trunk coordinates
        const trunkTopY = heartCenterY + (16 * heartScale) - 8;
        const trunkHeight = baseY - trunkTopY;

        // Trunk itself: drawn as a tapered textured wood column
        treeBranches.push({
            type: 'trunk',
            x: baseX,
            baseY: baseY,
            topY: trunkTopY,
            baseWidth: 26,
            topWidth: 15,
            progress: 0
        });

        // Main secondary branches extending upwards into the heart lobes
        const mainBranchDefs = [
            // Left main branch
            {
                start: { x: baseX, y: trunkTopY + 10 },
                cp1: { x: baseX - 25, y: trunkTopY - 20 },
                cp2: { x: baseX - 55, y: trunkTopY - 45 },
                end: { x: baseX - 80, y: trunkTopY - 75 },
                width: 7
            },
            // Left upper branch
            {
                start: { x: baseX - 40, y: trunkTopY - 32 },
                cp1: { x: baseX - 30, y: trunkTopY - 60 },
                cp2: { x: baseX - 35, y: trunkTopY - 95 },
                end: { x: baseX - 45, y: trunkTopY - 120 },
                width: 5
            },
            // Left outer branch
            {
                start: { x: baseX - 55, y: trunkTopY - 45 },
                cp1: { x: baseX - 85, y: trunkTopY - 60 },
                cp2: { x: baseX - 110, y: trunkTopY - 70 },
                end: { x: baseX - 130, y: trunkTopY - 80 },
                width: 4
            },
            // Right main branch
            {
                start: { x: baseX, y: trunkTopY + 10 },
                cp1: { x: baseX + 25, y: trunkTopY - 20 },
                cp2: { x: baseX + 55, y: trunkTopY - 45 },
                end: { x: baseX + 80, y: trunkTopY - 75 },
                width: 7
            },
            // Right upper branch
            {
                start: { x: baseX + 40, y: trunkTopY - 32 },
                cp1: { x: baseX + 30, y: trunkTopY - 60 },
                cp2: { x: baseX + 35, y: trunkTopY - 95 },
                end: { x: baseX + 45, y: trunkTopY - 120 },
                width: 5
            },
            // Right outer branch
            {
                start: { x: baseX + 55, y: trunkTopY - 45 },
                cp1: { x: baseX + 85, y: trunkTopY - 60 },
                cp2: { x: baseX + 110, y: trunkTopY - 70 },
                end: { x: baseX + 130, y: trunkTopY - 80 },
                width: 4
            },
            // Center-up branch
            {
                start: { x: baseX, y: trunkTopY },
                cp1: { x: baseX - 10, y: trunkTopY - 30 },
                cp2: { x: baseX + 10, y: trunkTopY - 65 },
                end: { x: baseX, y: trunkTopY - 95 },
                width: 5.5
            }
        ];

        mainBranchDefs.forEach(b => {
            treeBranches.push({
                type: 'branch',
                start: b.start,
                cp1: b.cp1,
                cp2: b.cp2,
                end: b.end,
                width: b.width,
                progress: 0
            });
        });
    }

    // --- Falling Petals & Ambient Sparkles ---
    const fallingPetals = [];
    const MAX_FALLING = 35;

    function spawnPetal(sourceX, sourceY) {
        if (fallingPetals.length >= MAX_FALLING) return;
        fallingPetals.push({
            x: sourceX + (Math.random() - 0.5) * 140,
            y: sourceY + (Math.random() - 0.5) * 80,
            vx: -0.6 - Math.random() * 1.2,
            vy: 0.9 + Math.random() * 1.1,
            size: 5 + Math.random() * 7,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.08,
            sway: Math.random() * Math.PI * 2,
            swaySpeed: 0.03 + Math.random() * 0.03,
            alpha: 0.95,
            isMiniFlower: Math.random() < 0.25
        });
    }

    // Ambient floating hearts / golden bokeh behind card
    const ambientParticles = [];
    for (let i = 0; i < 40; i++) {
        ambientParticles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: 3 + Math.random() * 8,
            alpha: 0.2 + Math.random() * 0.4,
            speedY: -0.3 - Math.random() * 0.4,
            speedX: (Math.random() - 0.5) * 0.3,
            color: Math.random() > 0.5 ? 'rgba(255, 105, 180,' : 'rgba(245, 175, 25,'
        });
    }

    function renderAmbient() {
        ambientCtx.clearRect(0, 0, ambientCanvas.width / dpr, ambientCanvas.height / dpr);
        const w = ambientCanvas.width / dpr;
        const h = ambientCanvas.height / dpr;

        for (let p of ambientParticles) {
            p.y += p.speedY;
            p.x += p.speedX;
            if (p.y < -20) p.y = h + 20;
            if (p.x < -20) p.x = w + 20;
            if (p.x > w + 20) p.x = -20;

            ambientCtx.save();
            ambientCtx.beginPath();
            ambientCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ambientCtx.fillStyle = p.color + p.alpha + ')';
            ambientCtx.shadowColor = p.color + '0.8)';
            ambientCtx.shadowBlur = 10;
            ambientCtx.fill();
            ambientCtx.restore();
        }
    }

    // --- Animation Timeline Controller ---
    let animState = 'idle'; // 'idle', 'seed', 'growing', 'blooming', 'translating', 'letter', 'loop'
    let stateTime = 0;
    let lastTimestamp = 0;

    let treeCenterBaseX = 0;
    let heartCenterY = 0;
    let heartScale = 11;

    function initTreeCoordinates() {
        resizeCanvases();
        const isMobile = width < 768;

        treeCenterBaseX = width * 0.5;
        heartScale = isMobile ? Math.min(9.5, width * 0.024) : Math.min(11.5, height * 0.017);
        heartCenterY = height * 0.42;

        targetShiftX = isMobile ? 0 : width * 0.22; // Desktop shifts right by 22% of card width
        treeShiftX = 0;

        buildTreeStructure(treeCenterBaseX, groundY, heartCenterY, heartScale);
        buildHeartFlowers(treeCenterBaseX, heartCenterY, heartScale);
    }

    function startExperience() {
        if (animState !== 'idle') return;

        // 1. Play Background Music
        bgMusic.play().then(() => {
            musicBtn.classList.remove('hidden');
            configBtn.classList.remove('hidden');
        }).catch(err => {
            console.log('Audio autoplay prevented, user clicked music toggle to play:', err);
            musicBtn.classList.remove('hidden');
            configBtn.classList.remove('hidden');
        });

        // 2. Hide Intro with smooth zoom & fade
        introOverlay.classList.add('fade-out');

        // 3. Initialize tree and begin growth
        setTimeout(() => {
            introOverlay.classList.add('hidden');
            initTreeCoordinates();
            animState = 'seed';
            stateTime = 0;
        }, 600);
    }

    // --- Render Loop ---
    function animate(timestamp) {
        requestAnimationFrame(animate);

        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
        lastTimestamp = timestamp;

        renderAmbient();

        if (animState === 'idle') return;

        stateTime += dt;
        treeCtx.clearRect(0, 0, width, height);

        // Ground Line (Dark crisp horizontal line at bottom)
        treeCtx.save();
        treeCtx.strokeStyle = '#2b180d';
        treeCtx.lineWidth = 2.5;
        treeCtx.beginPath();
        treeCtx.moveTo(0, groundY);
        treeCtx.lineTo(width, groundY);
        treeCtx.stroke();
        treeCtx.restore();

        // Effective X offset for tree when sliding right
        const currentBaseX = treeCenterBaseX + treeShiftX;

        // --- State Machine Updates ---
        if (animState === 'seed') {
            // Draw small sprouting brown seed on ground line
            const seedR = Math.min(6, stateTime * 8);
            treeCtx.save();
            treeCtx.fillStyle = '#653a1a';
            treeCtx.beginPath();
            treeCtx.ellipse(currentBaseX, groundY - seedR * 0.8, seedR, seedR * 0.8, 0, 0, Math.PI * 2);
            treeCtx.fill();
            treeCtx.restore();

            if (stateTime > 0.8) {
                animState = 'trunk';
                stateTime = 0;
            }
        } else if (animState === 'trunk') {
            const trunk = treeBranches.find(b => b.type === 'trunk');
            if (trunk) {
                trunk.progress = Math.min(1, stateTime / 1.1);
            }
            if (stateTime > 1.1) {
                animState = 'branches';
                stateTime = 0;
            }
        } else if (animState === 'branches') {
            const trunk = treeBranches.find(b => b.type === 'trunk');
            if (trunk) trunk.progress = 1;

            const branchDuration = 1.2;
            const progress = Math.min(1, stateTime / branchDuration);
            treeBranches.forEach(b => {
                if (b.type === 'branch') {
                    b.progress = progress;
                }
            });

            if (stateTime > branchDuration + 0.1) {
                animState = 'blooming';
                stateTime = 0;
            }
        } else if (animState === 'blooming') {
            // Flowers bloom in rapid elastic waves
            const bloomDuration = 2.0;
            let bloomedCount = 0;

            flowers.forEach(f => {
                if (stateTime > f.bloomDelay) {
                    const elapsed = stateTime - f.bloomDelay;
                    const p = Math.min(1, elapsed / 0.55);
                    // Elastic pop ease
                    f.scale = p < 1 ? Math.sin(p * Math.PI * 0.5) * 1.15 : 1;
                    if (p >= 1) bloomedCount++;
                }
            });

            // When flowers are mostly bloomed, start the shift to the right
            if (stateTime > 1.8) {
                animState = 'translating';
                stateTime = 0;
            }
        } else if (animState === 'translating') {
            // Shift tree coordinates from center to right
            const transDuration = 1.4;
            const p = Math.min(1, stateTime / transDuration);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - p, 3);
            treeShiftX = targetShiftX * ease;

            // Make sure all flowers are scaled to 1
            flowers.forEach(f => f.scale = 1);

            if (stateTime > transDuration * 0.6 && !letterWrapper.classList.contains('visible')) {
                // Reveal letter & begin typing
                showLetterAndCounter();
            }

            if (stateTime > transDuration) {
                animState = 'active';
            }
        } else if (animState === 'active') {
            treeShiftX = targetShiftX;
            flowers.forEach(f => f.scale = 1);

            // Continuously spawn falling petals from the tree
            if (Math.random() < 0.28) {
                const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
                if (randomFlower) {
                    spawnPetal(currentBaseX + randomFlower.relX, heartCenterY + randomFlower.relY);
                }
            }
        }

        // --- Draw Trunk ---
        const trunk = treeBranches.find(b => b.type === 'trunk');
        if (trunk && trunk.progress > 0) {
            drawTrunk(treeCtx, currentBaseX, trunk.baseY, trunk.topY, trunk.baseWidth, trunk.topWidth, trunk.progress);
        }

        // --- Draw Branches ---
        treeBranches.forEach(b => {
            if (b.type === 'branch' && b.progress > 0) {
                drawBranch(treeCtx, b, currentBaseX - treeCenterBaseX);
            }
        });

        // --- Draw Flowers ---
        flowers.forEach(f => {
            if (f.scale > 0.01) {
                drawFlowerSprite(
                    treeCtx,
                    currentBaseX + f.relX,
                    heartCenterY + f.relY,
                    f.size * f.scale,
                    f.rotation,
                    f.spriteIdx
                );
            }
        });

        // --- Update and Draw Falling Petals ---
        updateAndDrawPetals(treeCtx);
    }

    // --- Helper: Draw Textured Trunk ---
    function drawTrunk(ctx, x, baseY, topY, baseW, topW, progress) {
        ctx.save();
        const currentTopY = baseY - (baseY - topY) * progress;
        const currentTopW = baseW - (baseW - topW) * progress;

        // Base gradient for bark
        const trunkGrad = ctx.createLinearGradient(x - baseW, 0, x + baseW, 0);
        trunkGrad.addColorStop(0, '#4a250a');
        trunkGrad.addColorStop(0.3, '#743d18');
        trunkGrad.addColorStop(0.7, '#8a4b1f');
        trunkGrad.addColorStop(1, '#3b1c06');

        ctx.fillStyle = trunkGrad;
        ctx.beginPath();
        ctx.moveTo(x - baseW / 2, baseY);
        ctx.lineTo(x + baseW / 2, baseY);
        ctx.lineTo(x + currentTopW / 2, currentTopY);
        ctx.lineTo(x - currentTopW / 2, currentTopY);
        ctx.closePath();
        ctx.fill();

        // Concentric curved bark rings (the signature look from the video)
        const totalHeight = baseY - currentTopY;
        const ringStep = 7;
        const ringsCount = Math.floor(totalHeight / ringStep);

        ctx.strokeStyle = 'rgba(40, 18, 5, 0.45)';
        ctx.lineWidth = 1.4;

        for (let i = 1; i < ringsCount; i++) {
            const ry = baseY - i * ringStep;
            const frac = (baseY - ry) / (baseY - topY);
            const rw = (baseW - (baseW - topW) * frac) * 0.9;

            ctx.beginPath();
            // Subtle downward curve for concentric slice rings
            ctx.ellipse(x, ry, rw / 2, rw * 0.12, 0, 0, Math.PI);
            ctx.stroke();
        }

        ctx.restore();
    }

    // --- Helper: Draw Animated Branch ---
    function drawBranch(ctx, b, offsetX) {
        ctx.save();
        ctx.strokeStyle = '#613313';
        ctx.lineWidth = b.width;
        ctx.lineCap = 'round';

        const sx = b.start.x + offsetX;
        const sy = b.start.y;
        const cx1 = b.cp1.x + offsetX;
        const cy1 = b.cp1.y;
        const cx2 = b.cp2.x + offsetX;
        const cy2 = b.cp2.y;
        const ex = b.end.x + offsetX;
        const ey = b.end.y;

        // De Casteljau interpolation for bezier curve growth
        const t = b.progress;
        const q0x = sx + (cx1 - sx) * t;
        const q0y = sy + (cy1 - sy) * t;
        const q1x = cx1 + (cx2 - cx1) * t;
        const q1y = cy1 + (cy2 - cy1) * t;
        const q2x = cx2 + (ex - cx2) * t;
        const q2y = cy2 + (ey - cy2) * t;

        const r0x = q0x + (q1x - q0x) * t;
        const r0y = q0y + (q1y - q0y) * t;
        const r1x = q1x + (q2x - q1x) * t;
        const r1y = q1y + (q2y - q1y) * t;

        const bx = r0x + (r1x - r0x) * t;
        const by = r0y + (r1y - r0y) * t;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(q0x, q0y, r0x, r0y, bx, by);
        ctx.stroke();
        ctx.restore();
    }

    // --- Helper: Draw Pre-rendered Flower Sprite ---
    function drawFlowerSprite(ctx, x, y, size, rotation, spriteIdx) {
        const sprite = flowerSprites[spriteIdx % flowerSprites.length];
        if (!sprite) return;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        const scale = size / sprite.size;
        const half = sprite.fullSz / 2;
        ctx.drawImage(sprite.canvas, -half * scale, -half * scale, sprite.fullSz * scale, sprite.fullSz * scale);
        ctx.restore();
    }

    // --- Helper: Falling Petals Update & Draw ---
    function updateAndDrawPetals(ctx) {
        for (let i = fallingPetals.length - 1; i >= 0; i--) {
            const p = fallingPetals[i];
            p.sway += p.swaySpeed;
            p.x += p.vx + Math.sin(p.sway) * 0.9;
            p.y += p.vy;
            p.rotation += p.vRot;

            if (p.y >= groundY - 4) {
                p.alpha -= 0.02;
            }

            if (p.alpha <= 0 || p.x < -30 || p.y > height + 30) {
                fallingPetals.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.alpha;

            if (p.isMiniFlower) {
                // Miniature yellow blossom
                const miniSprite = flowerSprites[0];
                const s = p.size / miniSprite.size;
                const half = miniSprite.fullSz / 2;
                ctx.drawImage(miniSprite.canvas, -half * s, -half * s, miniSprite.fullSz * s, miniSprite.fullSz * s);
            } else {
                // Single yellow petal
                ctx.drawImage(petalCanvas, -10, -5, p.size * 1.6, p.size * 0.8);
            }

            ctx.restore();
        }
    }

    // --- Typewriter Effect for Romantic Letter ---
    function typeText(element, text, speed, onComplete) {
        let i = 0;
        element.innerHTML = '<span class="typewriter-cursor"></span>';

        function tick() {
            if (i < text.length) {
                const char = text.charAt(i);
                if (char === '\n') {
                    element.innerHTML = text.substring(0, i + 1).replace(/\n/g, '<br>') + '<span class="typewriter-cursor"></span>';
                } else {
                    element.innerHTML = text.substring(0, i + 1).replace(/\n/g, '<br>') + '<span class="typewriter-cursor"></span>';
                }
                i++;
                const delay = (char === '\n' || char === ':' || char === '.') ? speed * 3.5 : speed;
                setTimeout(tick, delay);
            } else {
                element.innerHTML = text.replace(/\n/g, '<br>');
                if (onComplete) onComplete();
            }
        }

        tick();
    }

    function showLetterAndCounter() {
        letterWrapper.classList.add('visible');

        // Type Title
        typeText(letterTitle, userConfig.title, 45, () => {
            // Type Body
            typeText(letterBody, userConfig.body, 35, () => {
                // Type Signature
                letterSignature.innerHTML = '<span class="typewriter-cursor"></span>';
                typeText(letterSignature, userConfig.signature, 50, () => {
                    // Reveal Counter
                    counterCard.classList.remove('hidden');
                    startLiveCounter();
                });
            });
        });
    }

    // --- Live Relationship Timer Counter ---
    let counterInterval = null;

    function startLiveCounter() {
        if (counterInterval) clearInterval(counterInterval);

        function updateTimer() {
            const start = new Date(userConfig.startDate).getTime();
            const now = Date.now();
            let diff = Math.max(0, now - start);

            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / (3600 * 24));
            const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);

            daysNum.textContent = days;
            hoursNum.textContent = String(hours).padStart(2, '0');
            minutesNum.textContent = String(minutes).padStart(2, '0');
            secondsNum.textContent = String(seconds).padStart(2, '0');
        }

        updateTimer();
        counterInterval = setInterval(updateTimer, 1000);
    }

    // --- Audio Control & Mute Toggle ---
    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (bgMusic.paused) {
            bgMusic.play();
            musicBtn.classList.remove('muted');
        } else {
            bgMusic.pause();
            musicBtn.classList.add('muted');
        }
    });

    // --- Event Listeners for Opening Gift ---
    openGiftBtn.addEventListener('click', startExperience);
    whatsappCard.addEventListener('click', startExperience);

    // --- Customization Modal Controls ---
    configBtn.addEventListener('click', () => {
        cfgTitle.value = userConfig.title;
        cfgBody.value = userConfig.body;
        cfgSign.value = userConfig.signature;
        cfgDate.value = userConfig.startDate;
        modalOverlay.classList.remove('hidden');
    });

    closeCfgBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
    });

    saveCfgBtn.addEventListener('click', () => {
        userConfig.title = cfgTitle.value.trim() || DEFAULT_CONFIG.title;
        userConfig.body = cfgBody.value.trim() || DEFAULT_CONFIG.body;
        userConfig.signature = cfgSign.value.trim() || DEFAULT_CONFIG.signature;
        userConfig.startDate = cfgDate.value || DEFAULT_CONFIG.startDate;

        try {
            localStorage.setItem('flores_amarillas_cfg', JSON.stringify(userConfig));
        } catch (e) {
            console.warn(e);
        }

        modalOverlay.classList.add('hidden');
        // Restart animation
        location.reload();
    });

    // Close modal on background click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    });

    // Keyboard accessibility (Enter or Space to open gift)
    openGiftBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            startExperience();
        }
    });

    // Initial canvas setup & launch render loop
    resizeCanvases();
    requestAnimationFrame(animate);

})();
