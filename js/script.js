/**
 * SHAÏSTINE PRIVÉ — Haute Parfumerie & Bespoke Sillage
 * 240-Frame Interactive Canvas Engine with Infinite Loop,
 * Auto-Play Scrubbing, Web Audio Mist Synthesizer, & Luxury Cart
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================================
    // 1. CONFIGURATION & STATE
    // =========================================================================
    const TOTAL_FRAMES = 240;
    const FRAME_DIR = 'Black hero';
    const FRAME_PREFIX = 'ezgif-frame-';
    const FRAME_START_INDEX = 1;
    const FRAME_EXT = '.jpg';

    // DOM Canvas & Preloader
    const canvas = document.getElementById('frameCanvas');
    const ctx = canvas ? canvas.getContext('2d', { alpha: true }) : null;
    const scrollTrack = document.getElementById('experience');
    const preloader = document.getElementById('preloader');
    const preloaderBar = document.getElementById('preloaderBar');
    const preloaderPercent = document.getElementById('preloaderPercent');
    const preloaderText = document.getElementById('preloaderText');
    const heroIntro = document.getElementById('heroIntro');
    const scrollHint = document.getElementById('scrollHint');

    // HUD Elements
    const hudPhaseName = document.getElementById('hudPhaseName');
    const hudFrameCounter = document.getElementById('hudFrameCounter');
    const hudPercent = document.getElementById('hudPercent');
    const scrubContainer = document.getElementById('scrubContainer');
    const scrubFillBar = document.getElementById('scrubFillBar');
    const scrubThumb = document.getElementById('scrubThumb');
    
    // Control Buttons
    const autoPlayToggleBtn = document.getElementById('autoPlayToggleBtn');
    const playIconSvg = document.getElementById('playIconSvg');
    const playBtnText = document.getElementById('playBtnText');
    const loopModeBtn = document.getElementById('loopModeBtn');
    const loopModeText = document.getElementById('loopModeText');
    const speedToggleBtn = document.getElementById('speedToggleBtn');
    const speedText = document.getElementById('speedText');
    const restartBtn = document.getElementById('restartBtn');

    // Story Steps
    const storySteps = [
        document.getElementById('storyStep1'),
        document.getElementById('storyStep2'),
        document.getElementById('storyStep3'),
        document.getElementById('storyStep4')
    ];

    // Engine State
    const frames = new Array(TOTAL_FRAMES);
    let loadedCount = 0;
    let isInitialRenderDone = false;
    let targetFrame = 0;
    let currentFrameFloat = 0;
    let rawProgress = 0; // 0.0 to 1.0 within cycle
    let isAutoPlaying = false;
    let playbackSpeed = 1.0;
    let autoPlayAnimId = null;
    let autoPlayFloat = 0;

    // Loop Mode: 'bound' (stop at bottom & allow page scroll), 'infinite', 'ping-pong'
    let loopMode = 'bound'; 

    // =========================================================================
    // 2. FRAME PRELOADING & RETRIEVAL
    // =========================================================================
    function getFrameUrl(index) {
        const frameNum = String(index + FRAME_START_INDEX).padStart(3, '0');
        return `${encodeURIComponent(FRAME_DIR)}/${FRAME_PREFIX}${frameNum}${FRAME_EXT}`;
    }

    function preloadFrames() {
        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFrameUrl(i);
            
            img.onload = () => {
                frames[i] = img;
                loadedCount++;
                
                const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
                if (preloaderBar) preloaderBar.style.width = `${percent}%`;
                if (preloaderPercent) preloaderPercent.textContent = `${percent}%`;

                // Render initial frame as soon as frame 0 is ready
                if (i === 0 && !isInitialRenderDone) {
                    resizeCanvas();
                    drawFrame(0);
                    isInitialRenderDone = true;
                }

                // Dismiss preloader when initial batch of frames is ready
                if (loadedCount >= 16 && preloader && !preloader.classList.contains('loaded')) {
                    if (preloaderText) preloaderText.textContent = "AWAKENING ROSE GOLD SENSES...";
                    setTimeout(() => {
                        preloader.classList.add('loaded');
                        startFirstArrivalAutoplay();
                    }, 250);
                }
            };

            img.onerror = () => {
                // If Black%20hero fails, fallback to normalized directory black_hero
                if (!img.src.includes('black_hero')) {
                    const frameNum = String(i + FRAME_START_INDEX).padStart(3, '0');
                    img.src = `black_hero/${FRAME_PREFIX}${frameNum}${FRAME_EXT}`;
                    return;
                }
                loadedCount++;
                if (loadedCount >= TOTAL_FRAMES && preloader) {
                    preloader.classList.add('loaded');
                    startFirstArrivalAutoplay();
                }
            };
        }

        // Safety fallback: ensure preloader dismisses and autoplay starts reliably
        setTimeout(() => {
            if (preloader && !preloader.classList.contains('loaded')) {
                preloader.classList.add('loaded');
            }
            startFirstArrivalAutoplay();
        }, 1200);
    }

    // =========================================================================
    // 3. CANVAS HIGH-DPI SCALING & COVER DRAWING
    // =========================================================================
    let lastRenderedFrame = -1;

    function resizeCanvas() {
        if (!canvas || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const parent = canvas.parentElement || canvas;
        const w = parent.clientWidth || window.innerWidth;
        const h = parent.clientHeight || window.innerHeight;

        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        lastRenderedFrame = -1;
        drawFrame(Math.round(currentFrameFloat));
    }

    window.addEventListener('resize', resizeCanvas, { passive: true });

    function drawFrame(frameIndex) {
        if (!ctx || !canvas) return;
        
        let idx = Math.min(Math.max(frameIndex, 0), TOTAL_FRAMES - 1);
        let img = frames[idx];

        // Graceful fallback to nearest loaded frame if scrubbing ahead of network
        if (!img || !img.complete) {
            for (let offset = 1; offset < 30; offset++) {
                if (idx - offset >= 0 && frames[idx - offset] && frames[idx - offset].complete) {
                    img = frames[idx - offset];
                    break;
                }
                if (idx + offset < TOTAL_FRAMES && frames[idx + offset] && frames[idx + offset].complete) {
                    img = frames[idx + offset];
                    break;
                }
            }
        }

        if (!img || !img.complete) return;
        if (lastRenderedFrame === idx) return;
        lastRenderedFrame = idx;

        const parent = canvas.parentElement || canvas;
        const canvasW = parent.clientWidth || window.innerWidth;
        const canvasH = parent.clientHeight || window.innerHeight;
        const imgW = img.naturalWidth || 1920;
        const imgH = img.naturalHeight || 1080;

        // Aspect ratio cover calculation (fills the hero section edge-to-edge)
        const scale = Math.max(canvasW / imgW, canvasH / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = (canvasW - drawW) / 2;
        const drawY = (canvasH - drawH) / 2;

        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // =========================================================================
    // 4. SCROLL INTERPOLATION & LOOP MECHANICS
    // =========================================================================
    let autoplayFinishedAtEnd = false;

    function updateScrollProgress() {
        if (!scrollTrack) return;

        const rect = scrollTrack.getBoundingClientRect();
        const scrollDistance = scrollTrack.offsetHeight - window.innerHeight;
        const currentScrolled = -rect.top;

        if (scrollDistance <= 0) return;

        // If user interrupts autoplay by scrolling near the top, stop and start from over
        if (isAutoPlaying) {
            stopAutoPlay();
            if (currentScrolled < 150) {
                currentFrameFloat = 0;
                targetFrame = 0;
                drawFrame(0);
            }
        }

        // After the ending of autoplay video, video starts from over when scrolling
        if (autoplayFinishedAtEnd) {
            currentFrameFloat = 0;
            targetFrame = 0;
            drawFrame(0);
            autoplayFinishedAtEnd = false;
        }

        // Calculate progress along track
        let progress = currentScrolled / scrollDistance;

        if (loopMode === 'infinite') {
            // Infinite loop: cycles every 1/3 of the track (3 complete loops per full scroll)
            // or wraps smoothly modulo 1.0
            const cyclesPerTrack = 2.0;
            const virtualCycle = (progress * cyclesPerTrack);
            rawProgress = virtualCycle % 1.0;
            if (rawProgress < 0) rawProgress += 1.0;
            targetFrame = Math.floor(rawProgress * TOTAL_FRAMES);

            // Infinite scroll wrapping: when approaching track end, silently reset scroll
            if (currentScrolled >= scrollDistance * 0.95) {
                const resetScrollY = window.scrollY - (scrollDistance * 0.5);
                window.scrollTo({ top: resetScrollY, behavior: 'instant' });
            }
        } else if (loopMode === 'ping-pong') {
            // Ping-pong loop: forward then backward
            const pingPongCycle = (progress * 2) % 2.0;
            if (pingPongCycle <= 1.0) {
                rawProgress = pingPongCycle;
            } else {
                rawProgress = 2.0 - pingPongCycle;
            }
            targetFrame = Math.floor(rawProgress * (TOTAL_FRAMES - 1));
        } else {
            // Bound mode (standard 0.0 to 1.0)
            rawProgress = Math.max(0, Math.min(1, progress));
            targetFrame = Math.round(rawProgress * (TOTAL_FRAMES - 1));
        }

        // Mist sound synthesis update
        updateAudioSwell(rawProgress);

        // Text does NOT fade away when scrolling
        if (heroIntro) {
            heroIntro.style.opacity = '1';
            heroIntro.style.pointerEvents = 'auto';
            heroIntro.style.transform = `translateY(${-rawProgress * 24}px)`;
        }

        if (scrollHint) {
            scrollHint.style.opacity = '1';
        }

        // Dynamic header theme: obsidian dark over hero section, ivory light over editorial sections
        const siteHeader = document.getElementById('siteHeader');
        if (siteHeader) {
            if (rawProgress >= 0.88) {
                siteHeader.classList.add('header-light');
            } else {
                siteHeader.classList.remove('header-light');
            }
        }
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // =========================================================================
    // 5. SMOOTH PHYSICS & RENDER LOOP (LERP DAMPING)
    // =========================================================================
    function renderLoop() {
        if (isAutoPlaying) {
            currentFrameFloat = targetFrame;
        } else {
            // Smoothly interpolate current frame towards target frame
            let diff = targetFrame - currentFrameFloat;

            // Handle wrap-around interpolation for seamless loop
            if (loopMode === 'infinite') {
                if (diff > TOTAL_FRAMES / 2) {
                    diff -= TOTAL_FRAMES;
                } else if (diff < -TOTAL_FRAMES / 2) {
                    diff += TOTAL_FRAMES;
                }
            }

            // Speed up scroll up animation with an ultra-responsive lerp factor (0.75 vs 0.30)
            // diff < 0 indicates scrolling up: fast 0.75 factor; scrolling down: 0.30 factor
            const lerpFactor = diff < 0 ? 0.75 : 0.30;
            currentFrameFloat += diff * lerpFactor;

            if (loopMode === 'infinite') {
                if (currentFrameFloat >= TOTAL_FRAMES) currentFrameFloat -= TOTAL_FRAMES;
                if (currentFrameFloat < 0) currentFrameFloat += TOTAL_FRAMES;
            }
        }

        const frameToDraw = Math.round(currentFrameFloat) % TOTAL_FRAMES;
        drawFrame(frameToDraw);
        updateHUDAndOverlays(frameToDraw, rawProgress);

        requestAnimationFrame(renderLoop);
    }

    // =========================================================================
    // 6. SYNCHRONIZED HUD & STORY OVERLAYS
    // =========================================================================
    function updateHUDAndOverlays(frameIndex, progress) {
        const percentVal = Math.round(progress * 100);
        
        if (scrubFillBar) scrubFillBar.style.width = `${progress * 100}%`;
        if (scrubThumb) scrubThumb.style.left = `${progress * 100}%`;
        if (hudPercent) hudPercent.textContent = `${percentVal}%`;
        
        if (hudFrameCounter) {
            const frameNum = String(frameIndex + 1).padStart(3, '0');
            hudFrameCounter.textContent = `FRAME ${frameNum} / ${TOTAL_FRAMES}`;
        }

        // Phase segmentation across 240 frames
        let activeIndex = 0;
        let phaseTitle = 'PHASE I: THE DROPLET & RIPPLE';

        if (frameIndex < 60) {
            activeIndex = 0;
            phaseTitle = 'PHASE I: THE DROPLET & RIPPLE';
        } else if (frameIndex < 120) {
            activeIndex = 1;
            phaseTitle = 'PHASE II: MICRO-ATOMIZATION';
        } else if (frameIndex < 180) {
            activeIndex = 2;
            phaseTitle = 'PHASE III: THE ROSE GOLD FLACON';
        } else {
            activeIndex = 3;
            phaseTitle = 'PHASE IV: RESONANCE ETERNAL';
        }

        if (hudPhaseName) hudPhaseName.textContent = phaseTitle;

        storySteps.forEach((step, idx) => {
            if (!step) return;
            if (idx === activeIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // =========================================================================
    // 7. INTERACTIVE SCRUBBER (CLICK & DRAG)
    // =========================================================================
    if (scrubContainer) {
        let isScrubbing = false;

        const handleScrubMove = (e) => {
            const rect = scrubContainer.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const scrubFraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

            rawProgress = scrubFraction;
            targetFrame = Math.round(scrubFraction * (TOTAL_FRAMES - 1));
            currentFrameFloat = targetFrame;

            if (scrollTrack && !isAutoPlaying) {
                const trackTop = window.scrollY + scrollTrack.getBoundingClientRect().top;
                const scrollDistance = scrollTrack.offsetHeight - window.innerHeight;
                window.scrollTo({
                    top: trackTop + (scrubFraction * scrollDistance),
                    behavior: 'instant'
                });
            }

            updateAudioSwell(rawProgress);
        };

        scrubContainer.addEventListener('mousedown', (e) => {
            isScrubbing = true;
            if (isAutoPlaying) stopAutoPlay();
            handleScrubMove(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (isScrubbing) handleScrubMove(e);
        });

        window.addEventListener('mouseup', () => {
            isScrubbing = false;
        });

        scrubContainer.addEventListener('touchstart', (e) => {
            isScrubbing = true;
            if (isAutoPlaying) stopAutoPlay();
            handleScrubMove(e);
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (isScrubbing) handleScrubMove(e);
        }, { passive: true });

        window.addEventListener('touchend', () => {
            isScrubbing = false;
        });
    }

    // =========================================================================
    // 8. AUTO-PLAY LOOP ENGINE
    // =========================================================================
    function toggleAutoPlay() {
        if (isAutoPlaying) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    }

    function stopAutoPlay() {
        isAutoPlaying = false;
        if (playBtnText) playBtnText.textContent = "AUTO-PLAY";
        if (playIconSvg) {
            playIconSvg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
        if (autoPlayAnimId) {
            cancelAnimationFrame(autoPlayAnimId);
            autoPlayAnimId = null;
        }
    }

    function startAutoPlay() {
        if (isAutoPlaying) return;
        isAutoPlaying = true;
        if (playBtnText) playBtnText.textContent = "PAUSE";
        if (playIconSvg) {
            playIconSvg.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        }

        // If in bound mode and already at the end, restart from frame 0
        if (loopMode === 'bound' && currentFrameFloat >= TOTAL_FRAMES - 1) {
            autoPlayFloat = 0;
            currentFrameFloat = 0;
            targetFrame = 0;
        } else {
            autoPlayFloat = currentFrameFloat;
        }

        let lastTime = performance.now();
        let pingPongDir = 1;

        function autoStep(now) {
            if (!isAutoPlaying) return;

            const delta = (now - lastTime) / 1000;
            lastTime = now;

            // Advance smoothly (~36 frames per second at 1.0x speed)
            const frameIncrement = delta * 36 * playbackSpeed;

            if (loopMode === 'ping-pong') {
                autoPlayFloat += frameIncrement * pingPongDir;
                if (autoPlayFloat >= TOTAL_FRAMES - 1) {
                    autoPlayFloat = TOTAL_FRAMES - 1;
                    pingPongDir = -1;
                } else if (autoPlayFloat <= 0) {
                    autoPlayFloat = 0;
                    pingPongDir = 1;
                }
            } else if (loopMode === 'bound') {
                autoPlayFloat += frameIncrement;
                if (autoPlayFloat >= TOTAL_FRAMES - 1) {
                    autoPlayFloat = TOTAL_FRAMES - 1;
                    targetFrame = TOTAL_FRAMES - 1;
                    currentFrameFloat = TOTAL_FRAMES - 1;
                    rawProgress = 1.0;
                    drawFrame(TOTAL_FRAMES - 1);
                    updateHUDAndOverlays(TOTAL_FRAMES - 1, 1.0);
                    stopAutoPlay();
                    autoplayFinishedAtEnd = true;
                    return;
                }
            } else {
                // Infinite cycle loop
                autoPlayFloat = (autoPlayFloat + frameIncrement) % TOTAL_FRAMES;
            }

            targetFrame = Math.floor(autoPlayFloat);
            currentFrameFloat = autoPlayFloat;
            rawProgress = autoPlayFloat / (TOTAL_FRAMES - 1);

            updateAudioSwell(rawProgress);

            autoPlayAnimId = requestAnimationFrame(autoStep);
        }

        autoPlayAnimId = requestAnimationFrame(autoStep);
    }

    // First Arrival Autoplay: triggers on first visit after preloader dismisses
    let hasFirstArrivalPlayed = false;
    function startFirstArrivalAutoplay() {
        if (hasFirstArrivalPlayed) return;
        hasFirstArrivalPlayed = true;

        // If visitor hasn't scrolled down, start cinematic intro autoplay
        if (window.scrollY < 120) {
            autoPlayFloat = 0;
            currentFrameFloat = 0;
            targetFrame = 0;
            rawProgress = 0;
            drawFrame(0);
            updateHUDAndOverlays(0, 0);
            startAutoPlay();
        }
    }

    if (autoPlayToggleBtn) {
        autoPlayToggleBtn.addEventListener('click', toggleAutoPlay);
    }

    // =========================================================================
    // 9. LOOP MODE SWITCHER
    // =========================================================================
    if (loopModeBtn) {
        loopModeBtn.addEventListener('click', () => {
            if (loopMode === 'bound') {
                loopMode = 'infinite';
                if (loopModeText) loopModeText.textContent = 'LOOP: INFINITE';
            } else if (loopMode === 'infinite') {
                loopMode = 'ping-pong';
                if (loopModeText) loopModeText.textContent = 'LOOP: PING-PONG';
            } else {
                loopMode = 'bound';
                if (loopModeText) loopModeText.textContent = 'LOOP: BOUND';
            }
        });
    }

    // Playback Speed Selector (0.5x -> 1.0x -> 1.5x -> 2.0x)
    if (speedToggleBtn) {
        speedToggleBtn.addEventListener('click', () => {
            if (playbackSpeed === 1.0) {
                playbackSpeed = 1.5;
            } else if (playbackSpeed === 1.5) {
                playbackSpeed = 2.0;
            } else if (playbackSpeed === 2.0) {
                playbackSpeed = 0.5;
            } else {
                playbackSpeed = 1.0;
            }
            if (speedText) speedText.textContent = `${playbackSpeed}x`;
        });
    }

    // Restart Button
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (isAutoPlaying) stopAutoPlay();
            targetFrame = 0;
            currentFrameFloat = 0;
            rawProgress = 0;
            if (scrollTrack) {
                const trackTop = window.scrollY + scrollTrack.getBoundingClientRect().top;
                window.scrollTo({ top: trackTop, behavior: 'smooth' });
            }
        });
    }

    // User interaction immediately pauses auto-play and yields to manual scroll control
    ['wheel', 'touchmove', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, () => {
            if (isAutoPlaying) stopAutoPlay();
        }, { passive: true });
    });

    // =========================================================================
    // 10. WEB AUDIO API SYNTHESIZER (AMBIENT DRONE + MIST SPRAY NOISE)
    // =========================================================================
    let audioCtx = null;
    let isSoundOn = false;
    let masterGain = null;
    let ambientOsc1 = null;
    let ambientOsc2 = null;
    let mistNoiseNode = null;
    let mistFilter = null;
    let mistGain = null;

    function initAudio() {
        if (audioCtx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();

            masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);

            // 1. Warm ethereal luxury ambient chords (F3 & C4)
            ambientOsc1 = audioCtx.createOscillator();
            ambientOsc1.type = 'sine';
            ambientOsc1.frequency.setValueAtTime(174.61, audioCtx.currentTime);

            ambientOsc2 = audioCtx.createOscillator();
            ambientOsc2.type = 'triangle';
            ambientOsc2.frequency.setValueAtTime(261.63, audioCtx.currentTime);

            const oscFilter = audioCtx.createBiquadFilter();
            oscFilter.type = 'lowpass';
            oscFilter.frequency.setValueAtTime(420, audioCtx.currentTime);

            const oscGain = audioCtx.createGain();
            oscGain.gain.setValueAtTime(0.09, audioCtx.currentTime);

            ambientOsc1.connect(oscFilter);
            ambientOsc2.connect(oscFilter);
            oscFilter.connect(oscGain);
            oscGain.connect(masterGain);

            ambientOsc1.start();
            ambientOsc2.start();

            // 2. Aerosol Mist Sound (Bandpass Filtered White Noise)
            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            mistNoiseNode = audioCtx.createBufferSource();
            mistNoiseNode.buffer = noiseBuffer;
            mistNoiseNode.loop = true;

            mistFilter = audioCtx.createBiquadFilter();
            mistFilter.type = 'bandpass';
            mistFilter.frequency.setValueAtTime(2400, audioCtx.currentTime);
            mistFilter.Q.setValueAtTime(2.0, audioCtx.currentTime);

            mistGain = audioCtx.createGain();
            mistGain.gain.setValueAtTime(0.0, audioCtx.currentTime);

            mistNoiseNode.connect(mistFilter);
            mistFilter.connect(mistGain);
            mistGain.connect(masterGain);

            mistNoiseNode.start();
        } catch (e) {
            console.warn('Web Audio initialization:', e);
        }
    }

    function toggleSound() {
        if (!audioCtx) initAudio();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isSoundOn = !isSoundOn;
        const soundText = document.getElementById('soundText');
        const soundIcon = document.getElementById('soundIcon');

        if (isSoundOn) {
            if (masterGain && audioCtx) {
                masterGain.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 0.8);
            }
            if (soundText) soundText.textContent = "AUDIO ON";
            if (soundIcon) soundIcon.classList.add('playing');
        } else {
            if (masterGain && audioCtx) {
                masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            }
            if (soundText) soundText.textContent = "AUDIO OFF";
            if (soundIcon) soundIcon.classList.remove('playing');
        }
    }

    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) soundToggleBtn.addEventListener('click', toggleSound);

    const mobileSoundToggle = document.getElementById('mobileSoundToggle');
    if (mobileSoundToggle) mobileSoundToggle.addEventListener('click', toggleSound);

    function updateAudioSwell(progress) {
        if (!isSoundOn || !audioCtx || !mistGain) return;

        // Mist atomizes intensely between frames 50 and 115 (progress approx 0.20 to 0.50)
        let intensity = 0;
        if (progress >= 0.18 && progress <= 0.52) {
            const mid = 0.35;
            const dist = Math.abs(progress - mid);
            intensity = Math.max(0, 1 - (dist / 0.18));
        }

        mistGain.gain.linearRampToValueAtTime(intensity * 0.18, audioCtx.currentTime + 0.08);
        if (mistFilter) {
            mistFilter.frequency.linearRampToValueAtTime(2000 + (intensity * 1400), audioCtx.currentTime + 0.08);
        }
    }

    // =========================================================================
    // 11. OLFACTIVE PYRAMID TABS
    // =========================================================================
    const pyramidTabs = document.querySelectorAll('.pyramid-tab');
    const pyramidContents = document.querySelectorAll('.pyramid-content');

    pyramidTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');

            pyramidTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            pyramidContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });

    // =========================================================================
    // 12. BESPOKE SHOPPING BAG / CART
    // =========================================================================
    window.cart = JSON.parse(localStorage.getItem('shaistine_cart') || '[]');

    const cartDrawer = document.getElementById('cartDrawer');
    const cartBackdrop = document.getElementById('cartBackdrop');
    const openCartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartCountBadge = document.getElementById('cartCountBadge');
    const checkoutBtn = document.getElementById('checkoutBtn');

    function updateCartUI() {
        if (!cartItemsContainer) return;
        localStorage.setItem('shaistine_cart', JSON.stringify(window.cart));

        const totalItems = window.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountBadge) cartCountBadge.textContent = totalItems;

        if (window.cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 48px 0; color: #666; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;">Your bag is currently empty.</p>';
            if (cartSubtotal) cartSubtotal.textContent = '$0.00';
            return;
        }

        let total = 0;
        let hasInquireItems = false;
        cartItemsContainer.innerHTML = window.cart.map((item, idx) => {
            const isNumericPrice = typeof item.price === 'number' && item.price > 0;
            if (isNumericPrice) {
                total += item.price * item.quantity;
            } else {
                hasInquireItems = true;
            }

            const priceDisplay = isNumericPrice 
                ? `$${item.price.toFixed(2)} &times; ${item.quantity}` 
                : `<span style="color: var(--rosegold); font-size: 11px; letter-spacing: 0.1em;">PRICE UPON REQUEST</span> &times; ${item.quantity}`;

            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
                        <div>
                            <h4 class="cart-item-title font-editorial">${item.name}</h4>
                            <p class="cart-item-price">${priceDisplay}</p>
                            <span style="font-size: 9px; color: var(--text-dim); letter-spacing: 0.12em; display:block; margin-top:2px;">${item.size || '10 ml'}</span>
                        </div>
                    </div>
                    <div class="cart-qty-ctrl">
                        <button onclick="changeQty(${idx}, -1)" class="cart-qty-btn" aria-label="Decrease quantity">-</button>
                        <span class="cart-qty-num">${item.quantity}</span>
                        <button onclick="changeQty(${idx}, 1)" class="cart-qty-btn" aria-label="Increase quantity">+</button>
                    </div>
                </div>
            `;
        }).join('');

        if (cartSubtotal) {
            if (total > 0 && hasInquireItems) {
                cartSubtotal.textContent = `$${total.toFixed(2)} (+ Allocation Requests)`;
            } else if (total > 0) {
                cartSubtotal.textContent = `$${total.toFixed(2)}`;
            } else {
                cartSubtotal.textContent = 'Price Upon Request';
            }
        }
    }

    window.addToBag = function(name, price, image, size = '10 ml') {
        const existing = window.cart.find(item => item.name === name);
        if (existing) {
            existing.quantity++;
        } else {
            const numericPrice = (typeof price === 'number' && price > 0) ? price : null;
            window.cart.push({ name, price: numericPrice, image, size, quantity: 1 });
        }
        updateCartUI();
        openCart();
    };

    window.changeQty = function(index, change) {
        if (window.cart[index]) {
            window.cart[index].quantity += change;
            if (window.cart[index].quantity <= 0) {
                window.cart.splice(index, 1);
            }
            updateCartUI();
        }
    };

    function openCart() {
        if (cartDrawer) cartDrawer.classList.add('open');
        if (cartBackdrop) cartBackdrop.classList.add('open');
    }

    function closeCart() {
        if (cartDrawer) cartDrawer.classList.remove('open');
        if (cartBackdrop) cartBackdrop.classList.remove('open');
    }

    if (openCartBtn) openCartBtn.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (window.cart.length === 0) {
                alert('Your bag is currently empty. Please select a fragrance from the collection.');
            } else {
                alert('Thank you for choosing SHAÏSTINE PRIVÉ. Your bespoke order has been registered in our private atelier ledger.');
                window.cart = [];
                updateCartUI();
                closeCart();
            }
        });
    }

    updateCartUI();

    // =========================================================================
    // 13. SIGNATURE SCENTS (10 ML) PRODUCTS DATABASE (20 FRAGRANCES)
    // =========================================================================
    const SIGNATURE_PRODUCTS = [
        // Women (8)
        {
            id: 'shaistine',
            name: 'Shaistine',
            category: 'Women',
            gender: 'women',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: true,
            inspiredBy: null,
            tagline: 'Maison Signature Scent',
            desc: 'The pinnacle eponymous creation of Maison Shaïstine Privé. A radiant, bespoke oil formulated with rare botanical extracts.',
            image: 'assets/shaistine.jpg',
            price: null,
            preference: 'signature'
        },
        {
            id: 'blaire',
            name: 'Blaïre',
            category: 'Women',
            gender: 'women',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: true,
            inspiredBy: null,
            tagline: 'Maison Signature Scent',
            desc: 'An enchanting, velvety signature formulation crafted for intimate presence and lingering elegance.',
            image: 'assets/blaire.jpg',
            price: null,
            preference: 'signature'
        },
        {
            id: 'tinaelle',
            name: 'Tinaëlle',
            category: 'Women',
            gender: 'women',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: true,
            inspiredBy: null,
            tagline: 'Maison Signature Scent',
            desc: 'A pure, crystalline essence of grace and delicate warmth, hand-bottled in small seasonal batches.',
            image: 'assets/tinaelle.jpg',
            price: null,
            preference: 'signature'
        },
        {
            id: 'veranche',
            name: 'Véranché',
            category: 'Women',
            gender: 'women',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Chanel Chance',
            tagline: 'Inspired by Chanel Chance',
            desc: 'A sparkling, unpredictable floral-fresh sillage that harmonizes spontaneous radiance with refined depth.',
            image: 'assets/veranche.jpg',
            price: null,
            preference: 'floral'
        },
        {
            id: 'yaraistine',
            name: 'Yaraistine',
            category: 'Women',
            gender: 'women',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Lattafa Yara Pink',
            tagline: 'Inspired by Lattafa Yara Pink',
            desc: 'A velvety, sweet gourmand aura featuring creamy tropical softness and delicate powdery elegance.',
            image: 'assets/yaraistine.jpg',
            price: null,
            preference: 'gourmand'
        },
        {
            id: 'evasion',
            name: 'Évasion',
            category: 'Women',
            gender: 'women',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Libre by Yves Saint Laurent',
            tagline: 'Inspired by Libre by Yves Saint Laurent',
            desc: 'A daring, sensual tension between burning French lavender and provocative Moroccan orange blossom warmth.',
            image: 'assets/evasion.jpg',
            price: null,
            preference: 'floral'
        },
        {
            id: 'desire',
            name: 'Désire',
            category: 'Women',
            gender: 'women',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Libre Intense by Yves Saint Laurent',
            tagline: 'Inspired by Libre Intense by Yves Saint Laurent',
            desc: 'An incandescent, smoldering amber-floral depth enhanced with rich glowing vanilla orchid nuances.',
            image: 'assets/desire.jpg',
            price: null,
            preference: 'amber'
        },
        {
            id: 'guimauvette',
            name: 'Guimauvette',
            category: 'Women',
            gender: 'women',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Kayali Boujee Marshmallow',
            tagline: 'Inspired by Kayali Boujee Marshmallow',
            desc: 'An opulent, fluffy confection of spun sugar, whipped marshmallow velvet, and delicate pink blossoms.',
            image: 'assets/guimauvette.jpg',
            price: null,
            preference: 'gourmand'
        },

        // Men (12)
        {
            id: 'valleshay',
            name: 'ValléShay',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Valaya',
            tagline: 'Inspired by Valaya',
            desc: 'A clean, radiant cocoon of pure white cotton, crystalline musk, and sheer luminous freshness.',
            image: 'assets/valleshay.jpg',
            price: null,
            preference: 'fresh'
        },
        {
            id: 'duaprinve',
            name: 'Duaprinve',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Prada Candy',
            tagline: 'Inspired by Prada Candy',
            desc: 'An addictive explosion of pure caramel indulgence enveloped in powdery silken musks.',
            image: 'assets/duaprinve.jpg',
            price: null,
            preference: 'gourmand'
        },
        {
            id: 'lumieretine-luxe',
            name: 'LumièreTine Luxe',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Gentle Fluidity Silver',
            tagline: 'Inspired by Gentle Fluidity Silver',
            desc: 'A vibrant, metallic freshness powered by crisp juniper berry, spicy coriander, and clean woody ambers.',
            image: 'assets/lumieretine.jpg',
            price: null,
            preference: 'fresh'
        },
        {
            id: 'armanthere',
            name: 'Armantheré',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Stronger With You Intensely by Armani',
            tagline: 'Inspired by Stronger With You Intensely by Armani',
            desc: 'A vibrant spicy warmth fusing aged pink pepper, candied chestnut, and rich ambery bourbon.',
            image: 'assets/armanthere.jpg',
            price: null,
            preference: 'amber'
        },
        {
            id: 'aurestine-noir',
            name: 'Aürestine Noir',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Lacoste White',
            tagline: 'Inspired by Lacoste White',
            desc: 'Clean, crisp, and effortlessly masculine with luminous grapefruit, cardamom, and soft cedarwood.',
            image: 'assets/aurestine-noir.jpg',
            price: null,
            preference: 'fresh'
        },
        {
            id: 'bleush',
            name: 'Bleush',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Bleu de Chanel',
            tagline: 'Inspired by Bleu de Chanel',
            desc: 'A timeless aromatic-woody statement blending brisk Mediterranean citrus, crisp mint, and dry New Caledonian sandalwood.',
            image: 'assets/bleush.jpg',
            price: null,
            preference: 'woody'
        },
        {
            id: 'sharaia',
            name: 'ShaRaïa',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Invictus by Rabanne',
            tagline: 'Inspired by Invictus by Rabanne',
            desc: 'A heroic clash of marine vitality and triumphant bay leaf over magnetic ambergris warmth.',
            image: 'assets/sharaia.jpg',
            price: null,
            preference: 'fresh'
        },
        {
            id: 'imagination-lv',
            name: 'Imagination LV',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Rêverie',
            tagline: 'Inspired by Rêverie',
            desc: 'An elevated, citrusy and sparkling black tea infusion elevated with smoky guaiac and refined ginger.',
            image: 'assets/imagination-lv.jpg',
            price: null,
            preference: 'fresh'
        },
        {
            id: 'dejour',
            name: 'Dejour',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Sauvage by Dior',
            tagline: 'Inspired by Sauvage by Dior',
            desc: 'Raw, noble freshness marked by peppery Calabrian bergamot and radiant ambroxan over mineral earth.',
            image: 'assets/dejour.jpg',
            price: null,
            preference: 'fresh'
        },
        {
            id: 'stroem',
            name: 'Stroem',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Acqua di Giò',
            tagline: 'Inspired by Acqua di Giò',
            desc: 'The pure, invigorating spirit of sea spray and Mediterranean sun, anchored with cedar and mineral moss.',
            image: 'assets/stroem.jpg',
            price: null,
            preference: 'fresh'
        },
        {
            id: 'cristevus',
            name: 'Cristévus',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Aventus Absolu',
            tagline: 'Inspired by Aventus Absolu',
            desc: 'An intense, dark chypre masterpiece combining smoky birch, juicy bergamot, and rich spiced patchouli.',
            image: 'assets/cristevus.jpg',
            price: null,
            preference: 'woody'
        },
        {
            id: 'orvel',
            name: 'Orvél',
            category: 'Men',
            gender: 'men',
            size: '10 ml',
            concentration: '100% Concentrated Oil',
            isSignatureOriginal: false,
            inspiredBy: 'Orphéon by Diptyque',
            tagline: 'Inspired by Orphéon by Diptyque',
            desc: 'An atmospheric, bohemian harmony of warm tonka bean, cedarwood, and delicate juniper berries in tobacco haze.',
            image: 'assets/orvel.jpg',
            price: null,
            preference: 'woody'
        }
    ];

    // Helper to generate luxury product card HTML
    function createProductCardHTML(item) {
        const badgeText = item.isSignatureOriginal ? 'SIGNATURE SCENT' : `${item.category.toUpperCase()} · 10 ML`;
        const inspirationHTML = item.inspiredBy 
            ? `<p class="product-tagline" style="color: var(--rosegold); font-size: 11px;">Inspired by ${item.inspiredBy}</p>`
            : `<p class="product-tagline" style="color: var(--rosegold); font-size: 11px;">Maison Signature Scent</p>`;

        return `
            <div class="product-card glass-panel reveal-up product-card-clickable" onclick="openProductDetail('${item.id}', event)">
                <div class="product-badge">${badgeText}</div>
                <div class="product-image-container">
                    <img src="${item.image}" alt="${item.name} 10 ml Concentrated Oil" class="product-img" loading="lazy">
                </div>
                <div class="product-details">
                    <span class="product-volume">${item.size} · 100% CONCENTRATED OIL · ${item.category.toUpperCase()}</span>
                    <h3 class="product-name font-editorial">${item.name}</h3>
                    ${inspirationHTML}
                    <p class="product-notes" style="font-size: 11.5px; line-height: 1.5; color: var(--text-muted); margin-bottom: 16px;">${item.desc}</p>
                    <div class="product-price-row">
                        <span class="product-price" style="font-size: 13px; letter-spacing: 0.12em; color: var(--rosegold-light);">PRICE UPON REQUEST</span>
                        <div class="card-actions-row" onclick="event.stopPropagation()">
                            <button class="btn-detail-link" onclick="openProductDetail('${item.id}', event)">
                                DETAILS
                            </button>
                            <button class="btn-buy" onclick="addToBag('${item.name}', null, '${item.image}', '${item.size}')">
                                ADD TO BAG
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 14. COLLECTIONS SECTION FILTERING & SWITCHING
    // =========================================================================
    let currentCollectionGender = 'all';

    function renderSignatureCollection(gender = 'all') {
        const grid = document.getElementById('signatureProductsGrid');
        if (!grid) return;

        currentCollectionGender = gender;
        const filtered = SIGNATURE_PRODUCTS.filter(item => {
            if (gender === 'all') return true;
            return item.gender === gender;
        });

        grid.innerHTML = filtered.map(item => createProductCardHTML(item)).join('');
        
        grid.querySelectorAll('.reveal-up').forEach(el => {
            setTimeout(() => el.classList.add('active'), 50);
        });
    }

    window.switchCollectionTab = function(tabName) {
        const btnSignature = document.getElementById('tabSignatureScents');
        const btnPrive = document.getElementById('tabPriveHeritage');
        const gridSignature = document.getElementById('signatureProductsGrid');
        const filterBar = document.getElementById('signatureFilterBar');
        const gridPrive = document.getElementById('priveProductsGrid');

        if (tabName === 'signature') {
            if (btnSignature) btnSignature.classList.add('active');
            if (btnPrive) btnPrive.classList.remove('active');
            if (gridSignature) gridSignature.style.display = 'grid';
            if (filterBar) filterBar.style.display = 'flex';
            if (gridPrive) gridPrive.style.display = 'none';
        } else {
            if (btnSignature) btnSignature.classList.remove('active');
            if (btnPrive) btnPrive.classList.add('active');
            if (gridSignature) gridSignature.style.display = 'none';
            if (filterBar) filterBar.style.display = 'none';
            if (gridPrive) gridPrive.style.display = 'grid';
        }
    };

    window.filterCollectionGender = function(gender) {
        document.querySelectorAll('#signatureFilterBar .gender-filter-btn').forEach(btn => {
            if (btn.getAttribute('data-gender') === gender) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        renderSignatureCollection(gender);
    };

    // =========================================================================
    // 15. FIND MY SCENTS DYNAMIC DIAGNOSTIC & FILTERING
    // =========================================================================
    let scentFilters = {
        gender: 'all',
        preference: 'all',
        search: ''
    };

    function renderFindScents() {
        const grid = document.getElementById('findScentsGrid');
        const counter = document.getElementById('finderCountBadge');
        if (!grid) return;

        const filtered = SIGNATURE_PRODUCTS.filter(item => {
            if (scentFilters.gender !== 'all' && item.gender !== scentFilters.gender) {
                return false;
            }
            if (scentFilters.preference !== 'all') {
                if (scentFilters.preference === 'signature' && !item.isSignatureOriginal) return false;
                if (scentFilters.preference === 'fresh' && item.preference !== 'fresh') return false;
                if (scentFilters.preference === 'floral' && item.preference !== 'floral') return false;
                if (scentFilters.preference === 'gourmand' && item.preference !== 'gourmand') return false;
                if (scentFilters.preference === 'woody' && item.preference !== 'woody' && item.preference !== 'amber') return false;
            }
            if (scentFilters.search.trim() !== '') {
                const q = scentFilters.search.toLowerCase().trim();
                const nameMatch = item.name.toLowerCase().includes(q);
                const inspMatch = item.inspiredBy ? item.inspiredBy.toLowerCase().includes(q) : false;
                const catMatch = item.category.toLowerCase().includes(q);
                if (!nameMatch && !inspMatch && !catMatch) return false;
            }
            return true;
        });

        if (counter) {
            counter.textContent = `MATCHING FRAGRANCES: ${filtered.length}`;
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="no-match-box glass-panel reveal-up active">
                    <h4 class="font-editorial">No Olfactory Matches Found</h4>
                    <p>Adjust your preference filters or clear your search to discover our bespoke formulations.</p>
                    <button class="btn-reset-filters" onclick="resetAllScentFilters()">
                        RESET ALL FILTERS
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(item => createProductCardHTML(item)).join('');
        grid.querySelectorAll('.reveal-up').forEach(el => {
            setTimeout(() => el.classList.add('active'), 40);
        });
    }

    window.setScentFilter = function(filterType, value) {
        scentFilters[filterType] = value;
        document.querySelectorAll(`.scent-pill-btn[data-filter="${filterType}"]`).forEach(btn => {
            if (btn.getAttribute('data-value') === value) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        renderFindScents();
    };

    window.handleScentSearch = function(query) {
        scentFilters.search = query || '';
        renderFindScents();
    };

    window.resetAllScentFilters = function() {
        scentFilters = {
            gender: 'all',
            preference: 'all',
            search: ''
        };
        const searchInput = document.getElementById('scentSearchInput');
        if (searchInput) searchInput.value = '';

        document.querySelectorAll('.scent-pill-btn').forEach(btn => {
            if (btn.getAttribute('data-value') === 'all') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        renderFindScents();
    };

    // =========================================================================
    // 16. LUXURY PRODUCT DETAIL MODAL
    // =========================================================================
    const productDetailModal = document.getElementById('productDetailModal');
    let currentDetailProduct = null;

    window.openProductDetail = function(id, event) {
        if (event) event.stopPropagation();

        const product = SIGNATURE_PRODUCTS.find(p => p.id === id);
        if (!product || !productDetailModal) return;

        currentDetailProduct = product;

        const imgEl = document.getElementById('modalProductImg');
        const badgeEl = document.getElementById('modalProductBadge');
        const catEl = document.getElementById('modalProductCategory');
        const titleEl = document.getElementById('modalProductName');
        const tagEl = document.getElementById('modalProductTagline');
        const descEl = document.getElementById('modalProductDesc');
        const inspBox = document.getElementById('modalInspirationBox');
        const inspText = document.getElementById('modalInspirationText');
        const priceEl = document.getElementById('modalProductPrice');
        const addBtn = document.getElementById('modalAddBtn');

        if (imgEl) {
            imgEl.src = product.image;
            imgEl.alt = `${product.name} 10 ml Concentrated Oil`;
        }
        if (badgeEl) badgeEl.textContent = `${product.size} · 100% CONCENTRATED OIL`;
        if (catEl) catEl.textContent = `${product.category.toUpperCase()}'S COLLECTION`;
        if (titleEl) titleEl.textContent = product.name;
        if (tagEl) {
            tagEl.textContent = product.inspiredBy ? `Inspired by ${product.inspiredBy}` : 'Maison Signature Scent';
        }
        if (descEl) descEl.textContent = product.desc;

        if (inspBox && inspText) {
            if (product.inspiredBy) {
                inspBox.style.display = 'block';
                inspText.textContent = `Inspired by ${product.inspiredBy}`;
            } else {
                inspBox.style.display = 'block';
                inspText.textContent = 'Exclusive Signature Scent — Original Atelier Formulation';
            }
        }

        if (priceEl) priceEl.textContent = 'PRICE UPON REQUEST';

        if (addBtn) {
            addBtn.onclick = function() {
                addToBag(product.name, null, product.image, product.size);
                closeProductDetail();
            };
        }

        productDetailModal.classList.remove('hidden');
    };

    window.closeProductDetail = function() {
        if (productDetailModal) {
            productDetailModal.classList.add('hidden');
        }
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProductDetail();
            const quizModal = document.getElementById('quizModal');
            if (quizModal) quizModal.classList.add('hidden');
        }
    });

    // =========================================================================
    // 17. SCENT CONSULTATION QUIZ MODAL & FINDER NAVIGATION
    // =========================================================================
    const quizModal = document.getElementById('quizModal');
    const scentQuizBtn = document.getElementById('scentQuizBtn');
    const closeQuizBtn = document.getElementById('closeQuizBtn');
    const quizOptions = document.querySelectorAll('.quiz-option');
    const quizResult = document.getElementById('quizResult');
    const quizResultName = document.getElementById('quizResultName');
    const quizAddBtn = document.getElementById('quizAddBtn');
    let matchedFragrance = 'Noir & Ivoire';

    if (scentQuizBtn) {
        scentQuizBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const findSection = document.getElementById('find-scent');
            if (findSection) {
                findSection.scrollIntoView({ behavior: 'smooth' });
            } else if (quizModal) {
                quizModal.classList.remove('hidden');
            }
        });
    }

    if (closeQuizBtn && quizModal) {
        closeQuizBtn.addEventListener('click', () => {
            quizModal.classList.add('hidden');
        });
    }

    quizOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            matchedFragrance = opt.getAttribute('data-match') || 'Noir & Ivoire';
            if (quizResultName) quizResultName.textContent = matchedFragrance;
            if (quizResult) quizResult.classList.remove('hidden');
        });
    });

    if (quizAddBtn) {
        quizAddBtn.addEventListener('click', () => {
            let price = 285;
            let img = 'assets/featured.jpg';
            if (matchedFragrance === 'Nocturne') { price = 310; img = 'assets/collection3.jpg'; }
            if (matchedFragrance === 'Aurélia') { price = 260; img = 'assets/collection2.jpg'; }
            if (matchedFragrance === "L'Aura") { price = 240; img = 'assets/collection1.jpg'; }
            addToBag(matchedFragrance, price, img, '50ml');
            if (quizModal) quizModal.classList.add('hidden');
        });
    }

    // =========================================================================
    // 14. MOBILE NAVIGATION DRAWER
    // =========================================================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMobileMenuBtn = document.getElementById('closeMobileMenuBtn');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('flex');
        });
    }

    if (closeMobileMenuBtn && mobileMenu) {
        closeMobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('flex');
        });
    }

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
            }
        });
    });

    // =========================================================================
    // 15. INTERSECTION OBSERVER FOR REVEAL-UP ELEMENTS
    // =========================================================================
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = el.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    el.classList.add('active');
                }, parseInt(delay));
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

    // =========================================================================
    // 16. GOLDEN FOGGY CURSOR GLOW & PERFUME MIST TRAIL
    // =========================================================================
    const cursorFogGlow = document.getElementById('cursorFogGlow');
    const mistCanvas = document.getElementById('cursorMistCanvas');
    const bottleHoverZone = document.getElementById('bottleHoverZone');
    const bottleHighlightLayer = document.getElementById('bottleHighlight');

    let mistCtx = null;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;
    let lastMouseX = mouseX;
    let lastMouseY = mouseY;
    let isMouseActive = false;
    let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect if desktop pointer device
    const isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Setup High-DPI Mist Canvas
    if (mistCanvas) {
        mistCtx = mistCanvas.getContext('2d');
        function resizeMistCanvas() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            mistCanvas.width = window.innerWidth * dpr;
            mistCanvas.height = window.innerHeight * dpr;
            if (mistCtx) mistCtx.scale(dpr, dpr);
        }
        resizeMistCanvas();
        window.addEventListener('resize', resizeMistCanvas, { passive: true });
    }

    // Golden Mist Particles System (Aerosol Perfume Vapor)
    const mistParticles = [];
    const MAX_PARTICLES = 120;

    function spawnMistPuff(x, y, dx, dy, speed) {
        if (!mistCtx || isReducedMotion) return;
        const count = Math.min(Math.floor(speed / 5) + 1, 3);
        
        for (let i = 0; i < count; i++) {
            if (mistParticles.length >= MAX_PARTICLES) {
                mistParticles.shift();
            }
            mistParticles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: dx * 0.06 + (Math.random() - 0.5) * 0.8,
                vy: dy * 0.06 - (Math.random() * 0.7 + 0.3), // gentle upward vapor drift
                radius: Math.random() * 8 + 6,
                maxRadius: Math.random() * 32 + 20,
                alpha: Math.random() * 0.32 + 0.28,
                decay: Math.random() * 0.01 + 0.007
            });
        }
    }

    if (isDesktopPointer) {
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            const dx = mouseX - lastMouseX;
            const dy = mouseY - lastMouseY;
            const speed = Math.hypot(dx, dy);

            if (!isMouseActive) {
                isMouseActive = true;
                glowX = mouseX;
                glowY = mouseY;
                if (cursorFogGlow) cursorFogGlow.classList.add('active');
            }

            if (speed > 1.2) {
                spawnMistPuff(mouseX, mouseY, dx, dy, speed);
            }

            lastMouseX = mouseX;
            lastMouseY = mouseY;
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            if (cursorFogGlow) cursorFogGlow.classList.remove('active');
        });

        document.addEventListener('mouseenter', () => {
            if (isMouseActive && cursorFogGlow) {
                cursorFogGlow.classList.add('active');
            }
        });

        // 60FPS Render Loop: Fog Glow Lerp & Golden Mist Trail
        function mistAndGlowLoop() {
            // 1. Draw perfume mist particles
            if (mistCtx && mistCanvas) {
                mistCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

                for (let i = mistParticles.length - 1; i >= 0; i--) {
                    const p = mistParticles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.96;
                    p.vy *= 0.96;
                    p.radius += (p.maxRadius - p.radius) * 0.035;
                    p.alpha -= p.decay;

                    if (p.alpha <= 0) {
                        mistParticles.splice(i, 1);
                        continue;
                    }

                    const grad = mistCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                    // Rose gold soft blush core
                    grad.addColorStop(0, `rgba(255, 230, 235, ${p.alpha * 0.95})`);
                    // Radiant rose gold vapor
                    grad.addColorStop(0.3, `rgba(224, 140, 155, ${p.alpha * 0.7})`);
                    // Foggy rose gold mist dispersion edge
                    grad.addColorStop(0.7, `rgba(180, 95, 110, ${p.alpha * 0.25})`);
                    grad.addColorStop(1, 'rgba(180, 95, 110, 0)');

                    mistCtx.fillStyle = grad;
                    mistCtx.beginPath();
                    mistCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    mistCtx.fill();
                }
            }

            // 2. Liquid interpolation for the golden foggy glow
            if (cursorFogGlow && isMouseActive) {
                const lerpFactor = isReducedMotion ? 1.0 : 0.16;
                glowX += (mouseX - glowX) * lerpFactor;
                glowY += (mouseY - glowY) * lerpFactor;
                cursorFogGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
            }

            requestAnimationFrame(mistAndGlowLoop);
        }

        requestAnimationFrame(mistAndGlowLoop);

        // Hover expansions for golden foggy glow
        const interactiveSelectors = 'a, button, [role="button"], .scrub-container, .pyramid-tab, .quiz-option, .btn-buy, .btn-gold-action, .btn-checkout, .nav-link, .cart-btn, .product-card';

        document.querySelectorAll(interactiveSelectors).forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (cursorFogGlow) cursorFogGlow.classList.add('glow-hover');
            });
            el.addEventListener('mouseleave', () => {
                if (cursorFogGlow) cursorFogGlow.classList.remove('glow-hover');
            });
        });

        // Perfume Flacon Central Hover Zone
        if (bottleHoverZone) {
            bottleHoverZone.addEventListener('mouseenter', () => {
                if (cursorFogGlow) cursorFogGlow.classList.add('glow-bottle');
                if (bottleHighlightLayer) bottleHighlightLayer.classList.add('active');
            });
            bottleHoverZone.addEventListener('mouseleave', () => {
                if (cursorFogGlow) cursorFogGlow.classList.remove('glow-bottle');
                if (bottleHighlightLayer) bottleHighlightLayer.classList.remove('active');
            });
        }
    }

    // =========================================================================
    // 17. PERFUME BOTTLE 3D CURSOR INTERACTION, SPECULAR HIGHLIGHT & MIST DRIFT
    // =========================================================================
    const bottleCanvasWrapper = document.getElementById('bottleCanvasWrapper');
    const bottleHighlight = document.getElementById('bottleHighlight');
    const mistReaction = document.getElementById('mistReaction');

    if (!isReducedMotion && bottleCanvasWrapper) {
        let normX = 0;
        let normY = 0;
        let targetRotX = 0;
        let targetRotY = 0;
        let currentRotX = 0;
        let currentRotY = 0;
        let isOverHero = false;

        const heroExperience = document.getElementById('experience');

        window.addEventListener('mousemove', (e) => {
            // Check if mouse is within hero section
            if (heroExperience) {
                const rect = heroExperience.getBoundingClientRect();
                isOverHero = (rect.top <= window.innerHeight && rect.bottom >= 0);
            }

            if (isOverHero) {
                // Normalized coordinates from -1 to 1 based on window center
                normX = (e.clientX / window.innerWidth) * 2 - 1;
                normY = (e.clientY / window.innerHeight) * 2 - 1;

                // Restrict bottle rotation to max ±8° horizontal and ±6° vertical
                targetRotY = normX * 8.0;
                targetRotX = -normY * 6.0;

                // Specular highlight movement across bottle glass
                if (bottleHighlight) {
                    const highlightX = 50 + (normX * 32);
                    const highlightY = 44 + (normY * 26);
                    bottleHighlight.style.background = `radial-gradient(ellipse at ${highlightX}% ${highlightY}%, rgba(255,255,255,0.25) 0%, rgba(197,168,128,0.09) 35%, transparent 65%)`;
                }

                // Mist reaction drifts subtly in response to cursor direction
                if (mistReaction) {
                    const mistX = -normX * 22;
                    const mistY = -normY * 14;
                    mistReaction.style.transform = `translate3d(${mistX.toFixed(1)}px, ${mistY.toFixed(1)}px, 0)`;
                }
            } else {
                targetRotX = 0;
                targetRotY = 0;
            }
        }, { passive: true });

        // Bottle 3D Tilt Rendering Loop with smooth liquid easing
        function bottleTiltLoop() {
            // Smooth easing factor 0.05 for heavy, cinematic luxury inertia
            currentRotX += (targetRotX - currentRotX) * 0.05;
            currentRotY += (targetRotY - currentRotY) * 0.05;

            bottleCanvasWrapper.style.transform = `perspective(1200px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;

            requestAnimationFrame(bottleTiltLoop);
        }

        requestAnimationFrame(bottleTiltLoop);
    }

    // =========================================================================
    // 18. PRODUCT CARDS SUBTLE 3D PARALLAX ON HOVER
    // =========================================================================
    if (!isReducedMotion) {
        document.querySelectorAll('.product-card').forEach(card => {
            const img = card.querySelector('.product-img');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
                const relY = (e.clientY - rect.top) / rect.height - 0.5;

                // Subtle card tilt (max ±6°)
                const tiltX = -relY * 6;
                const tiltY = relX * 6;

                card.style.transform = `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-8px)`;

                if (img) {
                    // Slight parallax shift for the bottle inside
                    img.style.transform = `scale(1.08) translate3d(${(relX * 12).toFixed(1)}px, ${(relY * 12).toFixed(1)}px, 0)`;
                }
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                if (img) img.style.transform = '';
            });
        });
    }

    // =========================================================================
    // 19. INITIALIZE
    // =========================================================================
    renderFindScents();
    preloadFrames();
    resizeCanvas();
    updateScrollProgress();
    requestAnimationFrame(renderLoop);
});
