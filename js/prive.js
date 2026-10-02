document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. INTERACTIVE 3D BOTTLE (Pseudo-3D / Parallax) ---
    const bottleContainer = document.querySelector('.bottle-container');
    const bottleWrapper = document.querySelector('.bottle-wrapper');
    const bottleHighlight = document.querySelector('.bottle-highlight');
    const heroText = document.querySelector('.hero-text');
    
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
        // Desktop Mouse Interaction
        window.addEventListener('mousemove', (e) => {
            // Normalize mouse position from -1 to 1 based on window center
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        });

        // Mobile Device Orientation (Gyroscope) fallback
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                // Limit gamma and beta for gentle movement
                let gamma = Math.max(-30, Math.min(30, e.gamma || 0)); // left/right
                let beta = Math.max(-30, Math.min(30, (e.beta || 0) - 45)); // up/down, offset by 45deg holding angle
                
                mouseX = gamma / 30;
                mouseY = beta / 30;
            });
        }

        // Animation Loop for Lerp (Linear Interpolation)
        function animateBottle() {
            // Lerp target towards mouse position for that smooth, heavy cinematic delay
            targetX += (mouseX - targetX) * 0.04;
            targetY += (mouseY - targetY) * 0.04;

            // Calculate rotations (max ±12 degrees)
            const rotateY = targetX * 12;
            const rotateX = -targetY * 12; // Invert Y for natural tilt

            // Apply 3D Transform to the wrapper
            // Note: GSAP will also control this wrapper during scroll, so we apply the mouse effect
            // via a CSS variable or carefully combine them. For simplicity, we apply it directly here.
            // When scrolling starts, GSAP's inline styles will take over the main transforms.
            
            // To ensure mouse movement works ALONG with scroll, we update CSS variables
            // that the element uses, OR we just let GSAP handle the scroll pinning and apply 
            // mouse transforms to the inner wrapper.
            bottleWrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            // Subtle parallax for the background text
            if (heroText) {
                heroText.style.transform = `translate(${-targetX * 20}px, ${-targetY * 20}px)`;
            }

            // Dynamic Lighting / Highlight
            // Move a radial gradient across the glass based on angle
            const highlightX = 50 + (targetX * 50); // 0% to 100%
            const highlightY = 50 + (targetY * 50);
            bottleHighlight.style.background = `radial-gradient(ellipse at ${highlightX}% ${highlightY}%, rgba(255,255,255,0.4) 0%, rgba(212,175,55,0.1) 40%, rgba(0,0,0,0) 70%)`;

            requestAnimationFrame(animateBottle);
        }
        
        // Start interaction loop
        animateBottle();
    }


    // --- 2. GSAP SCROLL ANIMATIONS ---
    gsap.registerPlugin(ScrollTrigger);

    // Timeline for the seamless cinematic transition from Hero to Collection
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".hero-section",
            start: "top top",
            end: "+=150vw", // Scroll duration based on viewport width for consistency
            scrub: 1.2, // Smooth scrubbing with slight delay
            pin: true,  // Pin the hero section while animating
            anticipatePin: 1
        }
    });

    // Animate the text fading out and moving up
    tl.to('.hero-text', {
        opacity: 0,
        y: -100,
        duration: 1,
        ease: "power2.inOut"
    }, 0);

    // Get coordinates of the target slot in the next section
    // We use viewport units relative to the pinned container to move it to the right half
    
    // Animate the bottle: scale down, move right, rotate 180deg
    tl.to(bottleContainer, {
        x: () => window.innerWidth * 0.25, // Move 25% of screen width to the right
        y: () => window.innerHeight * 0.2, // Move slightly down
        scale: 0.85,
        rotationY: 180, // Spin around to reveal the "back" or transform into product
        duration: 3,
        ease: "power1.inOut"
    }, 0);
    
    // Dim the ambient lighting during transition
    tl.to('.hero-section .mix-blend-screen', {
        opacity: 0,
        duration: 2
    }, 0);


    // Fade in the collection text as the bottle arrives
    gsap.to('.content-reveal', {
        scrollTrigger: {
            trigger: ".collection-section",
            start: "top 60%", // When collection section comes into view
            end: "top 30%",
            scrub: false,
            toggleActions: "play none none reverse"
        },
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power3.out"
    });

});
