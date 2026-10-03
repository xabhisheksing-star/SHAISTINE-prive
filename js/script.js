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
    const FRAME_DIR = 'hero section';
    const FRAME_PREFIX = 'ezgif-frame-';
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
        const paddedNum = String(index + 1).padStart(3, '0');
        return `${encodeURIComponent(FRAME_DIR)}/${FRAME_PREFIX}${paddedNum}${FRAME_EXT}`;
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

                // Dismiss preloader when initial batch of 25 frames is ready
                if (loadedCount >= 25 && preloader && !preloader.classList.contains('loaded')) {
                    if (preloaderText) preloaderText.textContent = "ACTIVATING VELVET SENSES...";
                    setTimeout(() => {
                        preloader.classList.add('loaded');
                        startFirstArrivalAutoplay();
                    }, 400);
                }
            };

            img.onerror = () => {
                // Prevent hang on error
                loadedCount++;
                if (loadedCount >= TOTAL_FRAMES && preloader) {
                    preloader.classList.add('loaded');
                }
            };
        }
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

        // Aspect ratio cover calculation
        const scale = Math.max(canvasW / imgW, canvasH / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = (canvasW - drawW) / 2;
        const drawY = (canvasH - drawH) / 2;

        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Seamlessly isolate the bottle & spray mist:
        // Mask out the surrounding props (left stone slab, right boulder, floor)
        // with a precision feathering vignette so ONLY the perfume bottle floats
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        
        const centerX = drawX + drawW * 0.52;
        const centerY = drawY + drawH * 0.50;
        const radiusX = drawW * 0.29;
        const radiusY = drawH * 0.38;

        ctx.translate(centerX, centerY);
        ctx.scale(1, radiusY / radiusX);

        const maskGrad = ctx.createRadialGradient(0, 0, radiusX * 0.50, 0, 0, radiusX);
        maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        maskGrad.addColorStop(0.70, 'rgba(0, 0, 0, 0.98)');
        maskGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0.55)');
        maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = maskGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // =========================================================================
    // 4. SCROLL INTERPOLATION & LOOP MECHANICS
    // =========================================================================
    function updateScrollProgress() {
        if (!scrollTrack || isAutoPlaying) return;

        const rect = scrollTrack.getBoundingClientRect();
        const scrollDistance = scrollTrack.offsetHeight - window.innerHeight;
        const currentScrolled = -rect.top;

        if (scrollDistance <= 0) return;

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

        // Fade out hero intro typography so ONLY the bottle animation is visible when scrolling
        if (heroIntro) {
            if (rawProgress > 0.03) {
                heroIntro.style.opacity = '0';
                heroIntro.style.pointerEvents = 'none';
            } else {
                heroIntro.style.opacity = '1';
                heroIntro.style.pointerEvents = 'auto';
            }
            heroIntro.style.transform = `translateY(${-rawProgress * 28}px)`;
        }

        if (scrollHint) {
            if (rawProgress > 0.02 || currentScrolled > 40) {
                scrollHint.style.opacity = '0';
            } else {
                scrollHint.style.opacity = '1';
            }
        }

        // Dynamic header theme: dark obsidian over hero bottle animation, ivory light over editorial sections
        const siteHeader = document.getElementById('siteHeader');
        if (siteHeader) {
            if (progress >= 0.92) {
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
        // Liquid inertia lerp damping factor
        const lerpFactor = 0.15;

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
        let phaseTitle = 'PHASE I: THE VESSEL';

        if (frameIndex < 60) {
            activeIndex = 0;
            phaseTitle = 'PHASE I: THE VESSEL';
        } else if (frameIndex < 120) {
            activeIndex = 1;
            phaseTitle = 'PHASE II: MICRO-ATOMIZATION';
        } else if (frameIndex < 180) {
            activeIndex = 2;
            phaseTitle = 'PHASE III: THE GOLDEN SEAL';
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
        cartItemsContainer.innerHTML = window.cart.map((item, idx) => {
            total += item.price * item.quantity;
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
                        <div>
                            <h4 class="cart-item-title font-editorial">${item.name}</h4>
                            <p class="cart-item-price">$${item.price} &times; ${item.quantity}</p>
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

        if (cartSubtotal) cartSubtotal.textContent = `$${total.toFixed(2)}`;
    }

    window.addToBag = function(name, price, image) {
        const existing = window.cart.find(item => item.name === name);
        if (existing) {
            existing.quantity++;
        } else {
            window.cart.push({ name, price, image, quantity: 1 });
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
    // 13. SCENT CONSULTATION QUIZ MODAL
    // =========================================================================
    const quizModal = document.getElementById('quizModal');
    const scentQuizBtn = document.getElementById('scentQuizBtn');
    const closeQuizBtn = document.getElementById('closeQuizBtn');
    const quizOptions = document.querySelectorAll('.quiz-option');
    const quizResult = document.getElementById('quizResult');
    const quizResultName = document.getElementById('quizResultName');
    const quizAddBtn = document.getElementById('quizAddBtn');
    let matchedFragrance = 'Noir & Ivoire';

    if (scentQuizBtn && quizModal) {
        scentQuizBtn.addEventListener('click', () => {
            quizModal.classList.remove('hidden');
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
            addToBag(matchedFragrance, price, img);
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
                    // Golden champagne core
                    grad.addColorStop(0, `rgba(255, 236, 179, ${p.alpha * 0.95})`);
                    // Radiant gold vapor
                    grad.addColorStop(0.3, `rgba(212, 175, 55, ${p.alpha * 0.7})`);
                    // Foggy mist dispersion edge
                    grad.addColorStop(0.7, `rgba(197, 168, 128, ${p.alpha * 0.25})`);
                    grad.addColorStop(1, 'rgba(197, 168, 128, 0)');

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
    preloadFrames();
    resizeCanvas();
    updateScrollProgress();
    requestAnimationFrame(renderLoop);
});
