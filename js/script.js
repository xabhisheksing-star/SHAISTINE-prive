/**
 * SHAÏSTINE PRIVÉ — Fine Perfumery & Bespoke Sillage
 * 213-Frame Scroll Animation Engine, Web Audio Mist Synthesizer, & Luxury Cart
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================================
    // 1. 213-FRAME LUXURY HERO SCROLL ENGINE & PRELOADER (1X AUTOPLAY & LOOP SCROLL)
    // =========================================================================
    const TOTAL_FRAMES = 213;
    const FRAME_DIR = 'assets/hero-frames/';
    const FRAME_PREFIX = 'ezgif-frame-';
    const FRAME_EXT = '.jpg';
    const FALLBACK_DIR = 'new hero section/';

    const canvas = document.getElementById('heroCanvas');
    const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
    const heroSection = document.getElementById('experience');
    const heroIntro = document.getElementById('heroIntro');
    const scrollHint = document.getElementById('scrollHint');
    const frameIndicator = document.getElementById('frameIndicator');
    const counterLabel = document.getElementById('counterLabel');
    const scrollCounterBtn = document.getElementById('scrollCounterBtn');
    const storyOverlay = document.getElementById('heroStoryOverlay');
    const storyChapter = document.getElementById('storyChapter');
    const storyTitle = document.getElementById('storyTitle');
    const storyDesc = document.getElementById('storyDesc');

    const preloader = document.getElementById('preloader');
    const preloaderBar = document.getElementById('preloaderBar');
    const preloaderPercent = document.getElementById('preloaderPercent');
    const preloaderText = document.getElementById('preloaderText');

    const frames = new Array(TOTAL_FRAMES);
    let loadedCount = 0;
    let canvasW = 0;
    let canvasH = 0;
    let dpr = 1;

    let targetFrame = 0;
    let currentFrame = 0;
    let lastDrawnFrame = -1;
    let isTicking = false;

    // 1-Time AutoPlay on Landing / Refresh state
    let isIntroAutoPlaying = true;
    let introStartTime = null;
    const INTRO_AUTOPLAY_DURATION = 6800; // ~6.8 seconds for 213 frames (~32 fps cinematic reveal)
    let hasUserInteracted = false;

    // Ensure page refresh lands at top so user experiences the 1-time auto-play
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    function getFrameUrl(index) {
        const num = String(index + 1).padStart(3, '0');
        return FRAME_DIR + FRAME_PREFIX + num + FRAME_EXT;
    }

    function getFallbackUrl(index) {
        const num = String(index + 1).padStart(3, '0');
        return encodeURIComponent(FALLBACK_DIR).replace(/%2F/g, '/') + FRAME_PREFIX + num + FRAME_EXT;
    }

    function updatePreloader() {
        const pct = Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (preloaderBar) preloaderBar.style.width = pct + '%';
        if (preloaderPercent) preloaderPercent.textContent = pct + '%';
        // Once initial 30 frames are ready or total frames reach 100%, dismiss preloader
        if (loadedCount >= 30 || pct >= 100) {
            if (preloaderText) preloaderText.textContent = "AWAKENING BESPOKE SILLAGE...";
            setTimeout(() => {
                if (preloader && !preloader.classList.contains('loaded')) {
                    preloader.classList.add('loaded');
                }
            }, 100);
        }
    }

    function getBestAvailableFrame(index) {
        const safeIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(index) % TOTAL_FRAMES));
        if (frames[safeIdx] && frames[safeIdx].complete && frames[safeIdx].naturalWidth > 0) {
            return frames[safeIdx];
        }
        for (let i = safeIdx - 1; i >= 0; i--) {
            if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
                return frames[i];
            }
        }
        for (let i = safeIdx + 1; i < TOTAL_FRAMES; i++) {
            if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
                return frames[i];
            }
        }
        return frames[0] || null;
    }

    function drawFrame(index) {
        if (!ctx || !canvas) return;
        const normIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(index) % TOTAL_FRAMES));
        const img = getBestAvailableFrame(normIdx);
        if (!img || !img.naturalWidth) return;

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const imgRatio = imgW / imgH;
        const canvasRatio = canvasW / canvasH;

        let drawW, drawH, drawX, drawY;
        if (canvasRatio > imgRatio) {
            drawW = canvasW;
            drawH = canvasW / imgRatio;
            drawX = 0;
            drawY = (canvasH - drawH) / 2;
        } else {
            drawH = canvasH;
            drawW = canvasH * imgRatio;
            drawX = (canvasW - drawW) / 2;
            drawY = 0;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasW, canvasH);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        lastDrawnFrame = normIdx;

        if (frameIndicator) {
            frameIndicator.textContent = String(normIdx + 1).padStart(3, '0') + ' / ' + TOTAL_FRAMES;
        }
    }

    const STORY_PHASES = [
        {
            from: 0,
            to: 70,
            chapter: 'ACT I',
            title: "OBSIDIAN & CELESTIAL MIST",
            desc: 'Obsidian glass emerging through celestial gold mist.'
        },
        {
            from: 71,
            to: 145,
            chapter: 'ACT II',
            title: "THE 24-KARAT GOLD COLLAR",
            desc: 'Architectural bottle crowned in hand-sculpted French gold.'
        },
        {
            from: 146,
            to: 212,
            chapter: 'ACT III',
            title: "THE BLACK EXTRACT · BESPOKE SILLAGE",
            desc: 'Astronomical sillage captured for eternity in Paris.'
        }
    ];

    let currentStoryIndex = -1;
    function updateStoryOverlay(frameIdx) {
        if (!storyOverlay || !storyChapter || !storyTitle || !storyDesc) return;
        
        const safeIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIdx) % TOTAL_FRAMES));
        if (safeIdx < 20) {
            storyOverlay.classList.remove('visible');
            currentStoryIndex = -1;
            return;
        }

        const phaseIdx = STORY_PHASES.findIndex(p => safeIdx >= p.from && safeIdx <= p.to);
        if (phaseIdx !== -1 && phaseIdx !== currentStoryIndex) {
            currentStoryIndex = phaseIdx;
            const phase = STORY_PHASES[phaseIdx];
            storyChapter.textContent = phase.chapter;
            storyTitle.textContent = phase.title;
            storyDesc.textContent = phase.desc;
            storyOverlay.classList.add('visible');
        }
    }

    function resizeCanvas() {
        if (!canvas || !ctx) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasW = window.innerWidth;
        canvasH = window.innerHeight;
        
        canvas.width = Math.round(canvasW * dpr);
        canvas.height = Math.round(canvasH * dpr);
        canvas.style.width = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lastDrawnFrame = -1;
        drawFrame(Math.round(currentFrame));
    }

    // =========================================================================
    // 1-TIME AUTOMATIC PLAYBACK (On Landing & Whenever Refreshed)
    // =========================================================================
    function startIntroAutoPlay() {
        isIntroAutoPlaying = true;
        introStartTime = null;
        if (counterLabel) {
            counterLabel.textContent = "AUTOPLAYING REVEAL · 1X";
        }
        requestAnimationFrame(introAutoPlayStep);
    }

    function introAutoPlayStep(timestamp) {
        // If user scrolled down or interacted, cancel auto-play and let scroll take over
        if (!isIntroAutoPlaying || hasUserInteracted || window.scrollY > 15) {
            isIntroAutoPlaying = false;
            if (counterLabel) {
                counterLabel.textContent = "SCROLL TO LOOP SILLAGE";
            }
            return;
        }

        if (!introStartTime) introStartTime = timestamp;
        const elapsed = timestamp - introStartTime;
        const progress = Math.min(1, elapsed / INTRO_AUTOPLAY_DURATION);

        // Step smoothly from frame 0 to frame 299
        const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));
        currentFrame = frameIdx;
        targetFrame = frameIdx;
        drawFrame(frameIdx);
        updateStoryOverlay(frameIdx);

        if (typeof updateAudioSwell === 'function') {
            updateAudioSwell(progress * 0.65);
        }

        if (progress < 1) {
            requestAnimationFrame(introAutoPlayStep);
        } else {
            // 1-time auto-play completed!
            isIntroAutoPlaying = false;
            if (counterLabel) {
                counterLabel.textContent = "SCROLL TO LOOP SILLAGE";
            }
        }
    }

    // =========================================================================
    // SCROLL ANIMATION KEEP IT ON LOOP
    // =========================================================================
    function animationLoop() {
        if (isIntroAutoPlaying) {
            isTicking = false;
            return;
        }

        let diff = targetFrame - currentFrame;

        // Modular shortest-distance wrap-around for seamless infinite looping
        if (diff > TOTAL_FRAMES / 2) {
            diff -= TOTAL_FRAMES;
        } else if (diff < -TOTAL_FRAMES / 2) {
            diff += TOTAL_FRAMES;
        }

        currentFrame += diff * 0.18;
        if (currentFrame >= TOTAL_FRAMES) currentFrame -= TOTAL_FRAMES;
        if (currentFrame < 0) currentFrame += TOTAL_FRAMES;

        const frameToDraw = Math.round(currentFrame) % TOTAL_FRAMES;
        if (frameToDraw !== lastDrawnFrame) {
            drawFrame(frameToDraw);
            updateStoryOverlay(frameToDraw);
        }

        if (Math.abs(diff) > 0.04) {
            requestAnimationFrame(animationLoop);
        } else {
            currentFrame = targetFrame;
            const finalFrame = Math.round(currentFrame) % TOTAL_FRAMES;
            if (finalFrame !== lastDrawnFrame) {
                drawFrame(finalFrame);
                updateStoryOverlay(finalFrame);
            }
            isTicking = false;
        }
    }

    function onHeroScroll() {
        // If user scrolls, smoothly cancel intro autoplay and let scroll handle looping
        if (window.scrollY > 15 && isIntroAutoPlaying) {
            isIntroAutoPlaying = false;
            hasUserInteracted = true;
            if (counterLabel) {
                counterLabel.textContent = "360° SILLAGE LOOP";
            }
        }

        if (!heroSection) return;
        const rect = heroSection.getBoundingClientRect();
        const scrollDist = heroSection.offsetHeight - window.innerHeight;
        if (scrollDist <= 0) return;

        const scrolled = -rect.top;
        const normalizedProgress = Math.max(0, Math.min(1, scrolled / scrollDist));

        // When inside the hero section runway, animate on loop:
        if (scrolled >= 0 && scrolled <= scrollDist) {
            // Every 700px of scroll performs 1 complete 360-degree loop (213 frames)!
            const PIXELS_PER_LOOP = 700;
            const rawFrame = (scrolled / PIXELS_PER_LOOP) * TOTAL_FRAMES;
            targetFrame = Math.floor(rawFrame) % TOTAL_FRAMES;
            if (targetFrame < 0) targetFrame += TOTAL_FRAMES;
        } else if (scrolled < 0) {
            targetFrame = 0;
        } else {
            targetFrame = TOTAL_FRAMES - 1;
        }

        if (heroIntro) {
            if (scrolled <= 30) {
                heroIntro.style.opacity = '1';
                heroIntro.style.transform = 'translateY(0px)';
                heroIntro.style.pointerEvents = 'auto';
            } else {
                const fadePct = Math.min(1, (scrolled - 30) / (window.innerHeight * 0.45));
                heroIntro.style.opacity = String(Math.max(0, 1 - fadePct * 1.15));
                heroIntro.style.transform = 'translateY(' + (scrolled * 0.35) + 'px)';
                heroIntro.style.pointerEvents = fadePct > 0.8 ? 'none' : 'auto';
            }
        }

        if (scrollHint) {
            const hintFade = Math.max(0, 1 - normalizedProgress * 6);
            scrollHint.style.opacity = String(hintFade);
        }

        if (typeof updateAudioSwell === 'function') {
            updateAudioSwell(normalizedProgress);
        }

        const siteHeader = document.getElementById('siteHeader');
        if (siteHeader) {
            if (window.scrollY > 80) {
                siteHeader.classList.add('header-scrolled');
            } else {
                siteHeader.classList.remove('header-scrolled');
            }
        }

        if (!isTicking && !isIntroAutoPlaying) {
            isTicking = true;
            requestAnimationFrame(animationLoop);
        }
    }

    // Audio swell modulation linked to scroll progress
    function updateAudioSwell(progress) {
        if (!audioCtx || !isSoundOn || !mistGain || !mistFilter) return;
        try {
            const now = audioCtx.currentTime;
            const swell = 0.04 + Math.sin(progress * Math.PI) * 0.12;
            mistGain.gain.setTargetAtTime(swell, now, 0.1);
            mistFilter.frequency.setTargetAtTime(1600 + progress * 1400, now, 0.1);
        } catch (e) {}
    }

    // Replay on button click
    if (scrollCounterBtn) {
        scrollCounterBtn.addEventListener('click', () => {
            isIntroAutoPlaying = true;
            hasUserInteracted = false;
            currentFrame = 0;
            targetFrame = 0;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            startIntroAutoPlay();
        });
    }

    // Preload Frame 0 immediately for instant display
    const frame0 = new Image();
    frame0.src = getFrameUrl(0);
    frame0.onload = () => {
        frames[0] = frame0;
        loadedCount++;
        resizeCanvas();
        drawFrame(0);
        preloadRemainingFrames();

        // Start 1-time auto-play automatically when landed or refreshed
        setTimeout(() => {
            startIntroAutoPlay();
        }, 280);
    };
    frame0.onerror = () => {
        frame0.src = getFallbackUrl(0);
        preloadRemainingFrames();
    };

    function preloadRemainingFrames() {
        const PRIORITY_BATCH = 45;
        // Priority batch: load first 45 frames so playback starts immediately without waiting
        for (let i = 1; i < Math.min(PRIORITY_BATCH, TOTAL_FRAMES); i++) {
            const img = new Image();
            img.src = getFrameUrl(i);
            img.onload = () => {
                frames[i] = img;
                loadedCount++;
                updatePreloader();
            };
            img.onerror = () => {
                img.src = getFallbackUrl(i);
            };
        }

        // Background stream remaining frames
        setTimeout(() => {
            for (let i = PRIORITY_BATCH; i < TOTAL_FRAMES; i++) {
                const img = new Image();
                img.src = getFrameUrl(i);
                img.onload = () => {
                    frames[i] = img;
                    loadedCount++;
                    updatePreloader();
                };
                img.onerror = () => {
                    img.src = getFallbackUrl(i);
                };
            }
        }, 120);
    }

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    resizeCanvas();

    // ===================================================================================
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
            cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 48px 0; color: #888; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;">Your bag is currently empty.</p>';
            if (cartSubtotal) cartSubtotal.textContent = '₱0';
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = window.cart.map((item, idx) => {
            const itemPrice = typeof item.price === 'number' && item.price > 0 ? item.price : 0;
            total += itemPrice * item.quantity;
            const priceDisplay = `₱${itemPrice.toLocaleString()} &times; ${item.quantity}`;
            const collectionLabel = item.collection === 'premium' ? 'PREMIUM COLLECTION' : 'STANDARD COLLECTION';

            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
                        <div>
                            <span style="font-size: 8.5px; color: var(--gold-light); letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 2px;">${collectionLabel}</span>
                            <h4 class="cart-item-title font-editorial">${item.name}</h4>
                            <p class="cart-item-price">${priceDisplay}</p>
                            <span style="font-size: 9px; color: var(--text-muted); letter-spacing: 0.12em; display:block; margin-top:2px;">BOTTLE SIZE: ${item.size || '10 ml'}</span>
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
            cartSubtotal.textContent = `₱${total.toLocaleString()}`;
        }
    }

    window.addToBag = function(name, price, image, size = '10 ml', collection = 'standard') {
        const itemKey = `${name}_${size}`;
        const existing = window.cart.find(item => `${item.name}_${item.size}` === itemKey);
        if (existing) {
            existing.quantity++;
        } else {
            const numericPrice = (typeof price === 'number' && price > 0) ? price : 0;
            window.cart.push({ name, price: numericPrice, image, size, collection, quantity: 1 });
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
                const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                alert(`Thank you for choosing SHAÏSTINE PRIVÉ. Your bespoke order totaling ₱${total.toLocaleString()} has been placed in our private workshop ledger.`);
                window.cart = [];
                updateCartUI();
                closeCart();
            }
        });
    }

    updateCartUI();

    // =========================================================================
    // 13. FINE PERFUMERY COLLECTION DATABASE (21 LUXURY FRAGRANCES)
    // Standard Collection: 50 ml — ₱2,000 | 10 ml — ₱700
    // Premium Collection: 50 ml — ₱2,200 | 10 ml — ₱800
    // =========================================================================
    const SIGNATURE_PRODUCTS = [
        // ==================== PREMIUM COLLECTION (8) ====================
        {
            id: 'veranche',
            name: 'Véranché',
            collection: 'premium',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 800, formatPrice: '₱800', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2200, formatPrice: '₱2,200', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Chanel Chance',
            tagline: 'Inspired by Chanel Chance',
            desc: 'A sparkling, unpredictable floral-fresh sillage that harmonizes spontaneous radiance with refined depth.',
            image: 'assets/veranche.jpg',
            preference: 'floral'
        },
        {
            id: 'shaistine-prive',
            name: 'Shaïstine Privé',
            collection: 'premium',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 800, formatPrice: '₱800', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2200, formatPrice: '₱2,200', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: true,
            inspiredBy: null,
            tagline: 'House Signature Scent',
            desc: 'The pinnacle eponymous creation of the House of Shaïstine Privé. A radiant, bespoke oil formulated with rare botanical extracts.',
            image: 'assets/shaistine.jpg',
            preference: 'signature'
        },
        {
            id: 'blaire',
            name: 'Blaïre',
            collection: 'premium',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 800, formatPrice: '₱800', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2200, formatPrice: '₱2,200', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: true,
            inspiredBy: null,
            tagline: 'House Signature Scent',
            desc: 'An enchanting, velvety signature formulation crafted for intimate presence and lingering elegance.',
            image: 'assets/blaire.jpg',
            preference: 'signature'
        },
        {
            id: 'shaelle',
            name: 'Shaëlle',
            collection: 'premium',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 800, formatPrice: '₱800', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2200, formatPrice: '₱2,200', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: true,
            inspiredBy: null,
            tagline: 'House Signature Scent',
            desc: 'An opulent, transcendent elixir uniting rare golden ambers, velvety nocturnal petals, and exquisite botanical resins.',
            image: 'assets/featured.jpg',
            preference: 'signature'
        },
        {
            id: 'tinaelle',
            name: 'Tinaëlle',
            collection: 'premium',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 800, formatPrice: '₱800', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2200, formatPrice: '₱2,200', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: true,
            inspiredBy: null,
            tagline: 'House Signature Scent',
            desc: 'A pure, crystalline essence of grace and delicate warmth, hand-bottled in small seasonal batches.',
            image: 'assets/tinaelle.jpg',
            preference: 'signature'
        },
        {
            id: 'armanthere',
            name: 'Armanthéré',
            collection: 'premium',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 800, formatPrice: '₱800', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2200, formatPrice: '₱2,200', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Stronger With You Intensely by Armani',
            tagline: 'Inspired by Stronger With You Intensely by Armani',
            desc: 'A vibrant spicy warmth fusing aged pink pepper, candied chestnut, and rich ambery bourbon.',
            image: 'assets/armanthere.jpg',
            preference: 'amber'
        },
        {
            id: 'dejour',
            name: 'Dejour',
            collection: 'premium',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 800, formatPrice: '₱800', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2200, formatPrice: '₱2,200', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Sauvage by Dior',
            tagline: 'Inspired by Sauvage by Dior',
            desc: 'Raw, noble freshness marked by peppery Calabrian bergamot and radiant ambroxan over mineral earth.',
            image: 'assets/dejour.jpg',
            preference: 'fresh'
        },
        {
            id: 'orvel',
            name: 'Orvél',
            collection: 'premium',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 800, formatPrice: '₱800', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2200, formatPrice: '₱2,200', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Orphéon by Diptyque',
            tagline: 'Inspired by Orphéon by Diptyque',
            desc: 'An atmospheric, bohemian harmony of warm tonka bean, cedarwood, and delicate juniper berries in tobacco haze.',
            image: 'assets/orvel.jpg',
            preference: 'woody'
        },

        // ==================== STANDARD COLLECTION (13) ====================
        {
            id: 'valleshay',
            name: 'ValléShay',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Valaya',
            tagline: 'Inspired by Valaya',
            desc: 'A clean, radiant cocoon of pure white cotton, crystalline musk, and sheer luminous freshness.',
            image: 'assets/valleshay.jpg',
            preference: 'fresh'
        },
        {
            id: 'duaprinve',
            name: 'Duaprinve',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Prada Candy',
            tagline: 'Inspired by Prada Candy',
            desc: 'An addictive explosion of pure caramel indulgence enveloped in powdery silken musks.',
            image: 'assets/duaprinve.jpg',
            preference: 'gourmand'
        },
        {
            id: 'yaraistine',
            name: 'Yaraistine',
            collection: 'standard',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Lattafa Yara Pink',
            tagline: 'Inspired by Lattafa Yara Pink',
            desc: 'A velvety, sweet gourmand aura featuring creamy tropical softness and delicate powdery elegance.',
            image: 'assets/yaraistine.jpg',
            preference: 'gourmand'
        },
        {
            id: 'evasion',
            name: 'Évasion',
            collection: 'standard',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Libre by Yves Saint Laurent',
            tagline: 'Inspired by Libre by Yves Saint Laurent',
            desc: 'A daring, sensual tension between burning French lavender and provocative Moroccan orange blossom warmth.',
            image: 'assets/evasion.jpg',
            preference: 'floral'
        },
        {
            id: 'desire',
            name: 'Désire',
            collection: 'standard',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Libre Intense by Yves Saint Laurent',
            tagline: 'Inspired by Libre Intense by Yves Saint Laurent',
            desc: 'An incandescent, smoldering amber-floral depth enhanced with rich glowing vanilla orchid nuances.',
            image: 'assets/desire.jpg',
            preference: 'amber'
        },
        {
            id: 'guimauvette',
            name: 'Guimauvette',
            collection: 'standard',
            category: 'Women',
            gender: 'women',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Kayali Boujee Marshmallow',
            tagline: 'Inspired by Kayali Boujee Marshmallow',
            desc: 'An opulent, fluffy confection of spun sugar, whipped marshmallow velvet, and delicate pink blossoms.',
            image: 'assets/guimauvette.jpg',
            preference: 'gourmand'
        },
        {
            id: 'lumieretine-luxe',
            name: 'LumièreTine Luxe',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Gentle Fluidity Silver',
            tagline: 'Inspired by Gentle Fluidity Silver',
            desc: 'A vibrant, metallic freshness powered by crisp juniper berry, spicy coriander, and clean woody ambers.',
            image: 'assets/lumieretine.jpg',
            preference: 'fresh'
        },
        {
            id: 'aurestine-noir',
            name: 'Aürestine Noir',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Lacoste White',
            tagline: 'Inspired by Lacoste White',
            desc: 'Clean, crisp, and effortlessly masculine with luminous grapefruit, cardamom, and soft cedarwood.',
            image: 'assets/aurestine-noir.jpg',
            preference: 'fresh'
        },
        {
            id: 'bleush',
            name: 'Bleush',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Bleu de Chanel',
            tagline: 'Inspired by Bleu de Chanel',
            desc: 'A timeless aromatic-woody statement blending brisk Mediterranean citrus, crisp mint, and dry New Caledonian sandalwood.',
            image: 'assets/bleush.jpg',
            preference: 'woody'
        },
        {
            id: 'sharaia',
            name: 'ShaRaïa',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Invictus by Rabanne',
            tagline: 'Inspired by Invictus by Rabanne',
            desc: 'A heroic clash of marine vitality and triumphant bay leaf over magnetic ambergris warmth.',
            image: 'assets/sharaia.jpg',
            preference: 'fresh'
        },
        {
            id: 'reverie',
            name: 'Rêverie',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Imagination by Louis Vuitton',
            tagline: 'Inspired by Imagination by Louis Vuitton',
            desc: 'An elevated, citrusy and sparkling black tea infusion elevated with smoky guaiac and refined ginger.',
            image: 'assets/imagination-lv.jpg',
            preference: 'fresh'
        },
        {
            id: 'stroem',
            name: 'Stroem',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Acqua di Giò',
            tagline: 'Inspired by Acqua di Giò',
            desc: 'The pure, invigorating spirit of sea spray and Mediterranean sun, anchored with cedar and mineral moss.',
            image: 'assets/stroem.jpg',
            preference: 'fresh'
        },
        {
            id: 'cristevyus',
            name: 'Cristévyus',
            collection: 'standard',
            category: 'Men',
            gender: 'men',
            sizes: {
                '10ml': { volume: '10 ml', price: 700, formatPrice: '₱700', concentration: '100% Concentrated Oil' },
                '50ml': { volume: '50 ml', price: 2000, formatPrice: '₱2,000', concentration: 'Perfume Extract' }
            },
            defaultSize: '10ml',
            isSignatureOriginal: false,
            inspiredBy: 'Aventus Absolu',
            tagline: 'Inspired by Aventus Absolu',
            desc: 'An intense, dark chypre masterpiece combining smoky birch, juicy bergamot, and rich spiced patchouli.',
            image: 'assets/cristevus.jpg',
            preference: 'woody'
        }
    ];

    // Card-level selected size state (product id -> '10ml' | '50ml')
    window.cardSelectedSizes = {};

    window.selectCardSize = function(productId, size, event) {
        if (event) event.stopPropagation();
        cardSelectedSizes[productId] = size;

        const product = SIGNATURE_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const sizeObj = product.sizes[size] || product.sizes['10ml'];

        // Update pills
        const groupEl = document.getElementById(`sizeGroup-${productId}`);
        if (groupEl) {
            groupEl.querySelectorAll('.size-pill-btn').forEach(btn => {
                if (btn.getAttribute('data-size') === size) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        // Update live price display
        const priceEl = document.getElementById(`price-${productId}`);
        if (priceEl) {
            priceEl.textContent = sizeObj.formatPrice;
        }

        const captionEl = document.getElementById(`sizeCaption-${productId}`);
        if (captionEl) {
            captionEl.textContent = `for ${sizeObj.volume}`;
        }
    };

    window.addCardProductToBag = function(productId, event) {
        if (event) event.stopPropagation();
        const product = SIGNATURE_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const selectedSize = cardSelectedSizes[productId] || product.defaultSize || '10ml';
        const sizeObj = product.sizes[selectedSize] || product.sizes['10ml'];

        addToBag(product.name, sizeObj.price, product.image, sizeObj.volume, product.collection);
    };

    // Helper to generate luxury product card HTML
    function createProductCardHTML(item) {
        const selectedSize = cardSelectedSizes[item.id] || item.defaultSize || '10ml';
        const sizeObj = item.sizes[selectedSize] || item.sizes['10ml'];
        const isPremium = item.collection === 'premium';
        const collectionBadgeText = isPremium ? 'PREMIUM COLLECTION' : 'STANDARD COLLECTION';
        const badgeClass = isPremium ? 'badge-premium' : 'badge-standard';

        const inspirationHTML = item.inspiredBy 
            ? `<p class="product-tagline">Inspired by ${item.inspiredBy}</p>`
            : `<p class="product-tagline">House Signature Scent</p>`;

        return `
            <div class="product-card glass-panel reveal-up product-card-clickable" onclick="openProductDetail('${item.id}', event)">
                <div class="product-badge ${badgeClass}">${collectionBadgeText}</div>
                <div class="product-image-container">
                    <img src="${item.image}" alt="${item.name}" class="product-img" loading="lazy">
                </div>
                <div class="product-details">
                    <span class="product-volume">${item.category.toUpperCase()}'S · ${collectionBadgeText}</span>
                    <h3 class="product-name font-editorial">${item.name}</h3>
                    ${inspirationHTML}
                    <p class="product-notes">${item.desc}</p>

                    <!-- Interactive Size Selector -->
                    <div class="product-size-selector" onclick="event.stopPropagation()">
                        <span class="size-selector-label">BOTTLE SIZE</span>
                        <div class="size-pills-group" id="sizeGroup-${item.id}">
                            <button type="button" class="size-pill-btn ${selectedSize === '10ml' ? 'active' : ''}" data-size="10ml" onclick="selectCardSize('${item.id}', '10ml', event)">
                                10 ml
                            </button>
                            <button type="button" class="size-pill-btn ${selectedSize === '50ml' ? 'active' : ''}" data-size="50ml" onclick="selectCardSize('${item.id}', '50ml', event)">
                                50 ml
                            </button>
                        </div>
                    </div>

                    <div class="product-price-row">
                        <div class="price-display-wrap">
                            <span class="product-price" id="price-${item.id}">${sizeObj.formatPrice}</span>
                            <span class="price-size-caption" id="sizeCaption-${item.id}">for ${sizeObj.volume}</span>
                        </div>
                        <div class="card-actions-row" onclick="event.stopPropagation()">
                            <button class="btn-detail-link" onclick="openProductDetail('${item.id}', event)">
                                DETAILS
                            </button>
                            <button class="btn-buy" onclick="addCardProductToBag('${item.id}', event)">
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
        collection: 'all',
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
            if (scentFilters.collection !== 'all' && item.collection !== scentFilters.collection) {
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
                const colMatch = (item.collection + ' collection').toLowerCase().includes(q);
                if (!nameMatch && !inspMatch && !catMatch && !colMatch) return false;
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
            collection: 'all',
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
    // 16. LUXURY PRODUCT DETAIL MODAL WITH ACCURATE PRICING & SIZE SWITCHER
    // =========================================================================
    const productDetailModal = document.getElementById('productDetailModal');
    let currentDetailProduct = null;
    let modalSelectedSize = '10ml';

    window.openProductDetail = function(id, event) {
        if (event) event.stopPropagation();

        const product = SIGNATURE_PRODUCTS.find(p => p.id === id);
        if (!product || !productDetailModal) return;

        currentDetailProduct = product;
        modalSelectedSize = cardSelectedSizes[id] || product.defaultSize || '10ml';

        const imgEl = document.getElementById('modalProductImg');
        const badgeEl = document.getElementById('modalProductBadge');
        const catEl = document.getElementById('modalProductCategory');
        const titleEl = document.getElementById('modalProductName');
        const tagEl = document.getElementById('modalProductTagline');
        const descEl = document.getElementById('modalProductDesc');
        const inspBox = document.getElementById('modalInspirationBox');
        const inspText = document.getElementById('modalInspirationText');
        const specColl = document.getElementById('modalSpecCollection');
        const specForm = document.getElementById('modalSpecFormulation');

        if (imgEl) {
            imgEl.src = product.image;
            imgEl.alt = `${product.name}`;
        }
        if (catEl) catEl.textContent = `${product.category.toUpperCase()}'S · ${product.collection.toUpperCase()} COLLECTION`;
        if (titleEl) titleEl.textContent = product.name;
        if (tagEl) {
            tagEl.textContent = product.inspiredBy ? `Inspired by ${product.inspiredBy}` : 'House Signature Scent';
        }
        if (descEl) descEl.textContent = product.desc;

        if (specColl) {
            specColl.textContent = product.collection === 'premium' ? 'PREMIUM COLLECTION' : 'STANDARD COLLECTION';
        }

        if (inspBox && inspText) {
            if (product.inspiredBy) {
                inspBox.style.display = 'block';
                inspText.textContent = `Inspired by ${product.inspiredBy}`;
            } else {
                inspBox.style.display = 'block';
                inspText.textContent = 'Exclusive Signature Scent — Original Workshop Formulation';
            }
        }

        updateModalSizeDisplay();
        productDetailModal.classList.remove('hidden');
    };

    window.setModalSize = function(size) {
        modalSelectedSize = size;
        if (currentDetailProduct) {
            cardSelectedSizes[currentDetailProduct.id] = size;
            // Also synchronize background card price
            const cardPrice = document.getElementById(`price-${currentDetailProduct.id}`);
            const cardCaption = document.getElementById(`sizeCaption-${currentDetailProduct.id}`);
            const sizeObj = currentDetailProduct.sizes[size];
            if (cardPrice && sizeObj) cardPrice.textContent = sizeObj.formatPrice;
            if (cardCaption && sizeObj) cardCaption.textContent = `for ${sizeObj.volume}`;

            const groupEl = document.getElementById(`sizeGroup-${currentDetailProduct.id}`);
            if (groupEl) {
                groupEl.querySelectorAll('.size-pill-btn').forEach(btn => {
                    if (btn.getAttribute('data-size') === size) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        }
        updateModalSizeDisplay();
    };

    function updateModalSizeDisplay() {
        if (!currentDetailProduct) return;
        const sizeObj = currentDetailProduct.sizes[modalSelectedSize] || currentDetailProduct.sizes['10ml'];

        const priceEl = document.getElementById('modalProductPrice');
        const badgeEl = document.getElementById('modalProductBadge');
        const specForm = document.getElementById('modalSpecFormulation');
        const btn10 = document.getElementById('modalSizeBtn10');
        const btn50 = document.getElementById('modalSizeBtn50');
        const addBtn = document.getElementById('modalAddBtn');

        if (priceEl) priceEl.textContent = sizeObj.formatPrice;
        if (badgeEl) badgeEl.textContent = `${sizeObj.volume} · ${sizeObj.concentration.toUpperCase()}`;
        if (specForm) specForm.textContent = `FORMULATION: ${sizeObj.concentration.toUpperCase()}`;

        if (btn10) {
            if (modalSelectedSize === '10ml') btn10.classList.add('active');
            else btn10.classList.remove('active');
        }
        if (btn50) {
            if (modalSelectedSize === '50ml') btn50.classList.add('active');
            else btn50.classList.remove('active');
        }

        if (addBtn) {
            addBtn.onclick = function() {
                addToBag(currentDetailProduct.name, sizeObj.price, currentDetailProduct.image, sizeObj.volume, currentDetailProduct.collection);
                closeProductDetail();
            };
        }
    }

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
    // 17. SCENT CONSULTATION QUIZ MODAL WITH ACCURATE PHILIPPINE PESO PRICING
    // =========================================================================
    const quizModal = document.getElementById('quizModal');
    const scentQuizBtn = document.getElementById('scentQuizBtn');
    const closeQuizBtn = document.getElementById('closeQuizBtn');
    const quizOptions = document.querySelectorAll('.quiz-option');
    const quizResult = document.getElementById('quizResult');
    const quizResultName = document.getElementById('quizResultName');
    const quizAddBtn = document.getElementById('quizAddBtn');
    let matchedFragrance = 'Shaïstine Privé';

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
            matchedFragrance = opt.getAttribute('data-match') || 'Shaïstine Privé';
            if (quizResultName) quizResultName.textContent = matchedFragrance;
            if (quizResult) quizResult.classList.remove('hidden');
        });
    });

    if (quizAddBtn) {
        quizAddBtn.addEventListener('click', () => {
            let targetProduct = SIGNATURE_PRODUCTS.find(p => p.name === matchedFragrance) || SIGNATURE_PRODUCTS[1]; // default Shaïstine Privé
            const sizeObj = targetProduct.sizes['50ml'];
            addToBag(targetProduct.name, sizeObj.price, targetProduct.image, sizeObj.volume, targetProduct.collection);
            if (quizModal) quizModal.classList.add('hidden');
        });
    }

    // =========================================================================
    // 18. MOBILE NAVIGATION DRAWER
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
    // 19. INTERSECTION OBSERVER FOR REVEAL-UP ELEMENTS
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
    // 20. PREMIUM GOLDEN CURSOR EFFECT & ROYAL GOLD MIST
    // =========================================================================
    const cursorDot = document.getElementById('cursorDot');
    const cursorHalo = document.getElementById('cursorHalo');
    const cursorFogGlow = document.getElementById('cursorFogGlow');
    const mistCanvas = document.getElementById('cursorMistCanvas');
    const bottleHoverZone = document.getElementById('bottleHoverZone');
    const bottleHighlightLayer = document.getElementById('bottleHighlight');

    let mistCtx = null;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let haloX = mouseX;
    let haloY = mouseY;
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

    // Golden Sparkle & Aerosol Perfume Mist Particles
    const mistParticles = [];
    const MAX_PARTICLES = 90;

    function spawnMistPuff(x, y, dx, dy, speed) {
        if (!mistCtx || isReducedMotion) return;
        const count = Math.min(Math.floor(speed / 6) + 1, 2);
        
        for (let i = 0; i < count; i++) {
            if (mistParticles.length >= MAX_PARTICLES) {
                mistParticles.shift();
            }
            mistParticles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y + (Math.random() - 0.5) * 8,
                vx: dx * 0.05 + (Math.random() - 0.5) * 0.6,
                vy: dy * 0.05 - (Math.random() * 0.6 + 0.2), // gentle upward vapor drift
                radius: Math.random() * 5 + 3,
                maxRadius: Math.random() * 24 + 14,
                alpha: Math.random() * 0.28 + 0.22,
                decay: Math.random() * 0.012 + 0.008,
                isSparkle: Math.random() > 0.65
            });
        }
    }

    if (isDesktopPointer) {
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Direct tracking for the gold dot with zero delay
            if (cursorDot) {
                cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
            }

            const dx = mouseX - lastMouseX;
            const dy = mouseY - lastMouseY;
            const speed = Math.hypot(dx, dy);

            if (!isMouseActive) {
                isMouseActive = true;
                haloX = mouseX;
                haloY = mouseY;
                if (cursorDot) cursorDot.classList.add('active');
                if (cursorHalo) cursorHalo.classList.add('active');
                if (cursorFogGlow) cursorFogGlow.classList.add('active');
            }

            if (speed > 1.4) {
                spawnMistPuff(mouseX, mouseY, dx, dy, speed);
            }

            lastMouseX = mouseX;
            lastMouseY = mouseY;
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            if (cursorDot) cursorDot.classList.remove('active');
            if (cursorHalo) cursorHalo.classList.remove('active');
            if (cursorFogGlow) cursorFogGlow.classList.remove('active');
        });

        document.addEventListener('mouseenter', () => {
            if (isMouseActive) {
                if (cursorDot) cursorDot.classList.add('active');
                if (cursorHalo) cursorHalo.classList.add('active');
                if (cursorFogGlow) cursorFogGlow.classList.add('active');
            }
        });

        // Click feedback on cursor
        window.addEventListener('mousedown', () => {
            if (cursorHalo) cursorHalo.classList.add('is-clicking');
            if (cursorDot) cursorDot.classList.add('is-clicking');
        });
        window.addEventListener('mouseup', () => {
            if (cursorHalo) cursorHalo.classList.remove('is-clicking');
            if (cursorDot) cursorDot.classList.remove('is-clicking');
        });

        // 60FPS Render Loop: Golden Halo Lerp & Metallic Mist/Sparkles
        function goldenCursorRenderLoop() {
            // 1. Draw royal gold mist & sparkle particles
            if (mistCtx && mistCanvas) {
                mistCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

                for (let i = mistParticles.length - 1; i >= 0; i--) {
                    const p = mistParticles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.96;
                    p.vy *= 0.96;
                    p.radius += (p.maxRadius - p.radius) * 0.04;
                    p.alpha -= p.decay;

                    if (p.alpha <= 0) {
                        mistParticles.splice(i, 1);
                        continue;
                    }

                    const grad = mistCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                    // Metallic royal gold gradient
                    grad.addColorStop(0, `rgba(245, 215, 122, ${p.alpha * 0.95})`);
                    grad.addColorStop(0.35, `rgba(212, 175, 55, ${p.alpha * 0.65})`);
                    grad.addColorStop(0.7, `rgba(140, 106, 32, ${p.alpha * 0.2})`);
                    grad.addColorStop(1, 'rgba(140, 106, 32, 0)');

                    mistCtx.fillStyle = grad;
                    mistCtx.beginPath();
                    mistCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    mistCtx.fill();
                }
            }

            // 2. Liquid interpolation for the golden halo with smooth delay
            if (isMouseActive) {
                const lerpFactor = isReducedMotion ? 1.0 : 0.14;
                haloX += (mouseX - haloX) * lerpFactor;
                haloY += (mouseY - haloY) * lerpFactor;

                if (cursorHalo) {
                    cursorHalo.style.transform = `translate3d(${haloX.toFixed(2)}px, ${haloY.toFixed(2)}px, 0) translate(-50%, -50%)`;
                }
                if (cursorFogGlow) {
                    cursorFogGlow.style.transform = `translate3d(${haloX.toFixed(2)}px, ${haloY.toFixed(2)}px, 0) translate(-50%, -50%)`;
                }
            }

            requestAnimationFrame(goldenCursorRenderLoop);
        }

        requestAnimationFrame(goldenCursorRenderLoop);

        // Hover expansions for golden halo
        const interactiveSelectors = 'a, button, [role="button"], input, .size-pill-btn, .modal-size-btn, .scrub-container, .pyramid-tab, .quiz-option, .btn-buy, .btn-gold-action, .btn-checkout, .nav-link, .cart-btn, .product-card';

        document.querySelectorAll(interactiveSelectors).forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (cursorHalo) cursorHalo.classList.add('glow-hover');
                if (cursorDot) cursorDot.classList.add('glow-hover');
            });
            el.addEventListener('mouseleave', () => {
                if (cursorHalo) cursorHalo.classList.remove('glow-hover');
                if (cursorDot) cursorDot.classList.remove('glow-hover');
            });
        });

        // Perfume Bottle Central Hover Zone
        if (bottleHoverZone) {
            bottleHoverZone.addEventListener('mouseenter', () => {
                if (cursorHalo) cursorHalo.classList.add('glow-bottle');
                if (cursorDot) cursorDot.classList.add('glow-bottle');
                if (bottleHighlightLayer) bottleHighlightLayer.classList.add('active');
            });
            bottleHoverZone.addEventListener('mouseleave', () => {
                if (cursorHalo) cursorHalo.classList.remove('glow-bottle');
                if (cursorDot) cursorDot.classList.remove('glow-bottle');
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
