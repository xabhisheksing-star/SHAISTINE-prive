/**
 * Dot_Grid_BG — Interactive 3D Orbiting Dot Grid Background
 * Faithfully ported from Framer:
 * https://framer.com/m/Dot-Grid-BG-GVxaLr.js@mfNBQfaPK0E7CX1epbhh
 * https://framerusercontent.com/modules/r4mTORdv0lkCmIrcYgue/mfNBQfaPK0E7CX1epbhh/Dot_Grid_BG.js
 */

(function () {
    'use strict';

    function smoothstep(t) {
        const c = Math.max(0, Math.min(1, t));
        return c * c * (3 - 2 * c);
    }

    function resolveVar(raw, el) {
        const s = raw.trim();
        if (!s.startsWith("var(")) return s;
        const inner = s.slice(4, -1).trim();
        const commaIdx = inner.indexOf(",");
        const varName = (commaIdx !== -1 ? inner.slice(0, commaIdx) : inner).trim();
        const fallback = commaIdx !== -1 ? inner.slice(commaIdx + 1).trim() : "";
        try {
            const resolved = getComputedStyle(el).getPropertyValue(varName).trim();
            if (resolved) return resolved;
        } catch (_) {}
        if (fallback) return resolveVar(fallback, el);
        return "#888888";
    }

    function parseColor(raw, el) {
        const color = resolveVar(raw, el);
        if (color.startsWith("rgb")) {
            const m = color.match(/[\d.]+/g) || [];
            return {
                r: Number(m[0]) || 0,
                g: Number(m[1]) || 0,
                b: Number(m[2]) || 0
            };
        }
        let h = color.replace("#", "");
        if (h.length === 3) h = h.split("").map(c => c + c).join("");
        const n = parseInt(h.slice(0, 6), 16);
        if (isNaN(n)) return { r: 99, g: 102, b: 241 };
        return {
            r: (n >> 16) & 255,
            g: (n >> 8) & 255,
            b: n & 255
        };
    }

    function createDotGrid(canvas, userConfig = {}) {
        if (!canvas) return null;

        const cfg = {
            dotColor: userConfig.dotColor || "var(--dot-color, #6366f1)",
            dotSize: userConfig.dotSize ?? 3.5,
            dotSpacing: userConfig.dotSpacing ?? 28,
            orbitSpeed: userConfig.orbitSpeed ?? 1.5,
            impactRadius: userConfig.impactRadius ?? 110,
            scaleOnHover: userConfig.scaleOnHover ?? 2.0,
            enableRevolve: userConfig.enableRevolve ?? true
        };

        const ctx = canvas.getContext("2d");
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let W = 0, H = 0;
        let mouse = { x: -9999, y: -9999 };
        let hovering = false;
        let leaveTs = 0;
        let prevTs = 0;
        let raf = 0;
        let globalAngle = 0;
        let dots = [];
        let spacingSnap = cfg.dotSpacing;

        function buildDots() {
            const sp = cfg.dotSpacing;
            spacingSnap = sp;
            dots = [];
            const cols = Math.ceil(W / sp) + 2;
            const rows = Math.ceil(H / sp) + 2;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    dots.push({
                        bx: c * sp,
                        by: r * sp,
                        inclination: Math.random() * Math.PI,
                        ascension: Math.random() * Math.PI * 2,
                        phase: Math.random() * Math.PI * 2,
                        speedMult: 0.7 + Math.random() * 0.6
                    });
                }
            }
        }

        function resize() {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            buildDots();
        }

        const ro = new ResizeObserver(() => resize());
        ro.observe(document.documentElement);
        window.addEventListener("resize", resize, { passive: true });
        resize();

        // Global mouse listeners across the window so cursor interaction works across the entire website
        window.addEventListener("mousemove", (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            hovering = true;
        }, { passive: true });

        document.addEventListener("mouseenter", (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            hovering = true;
        });

        document.addEventListener("mouseleave", () => {
            mouse.x = -9999;
            mouse.y = -9999;
            hovering = false;
            leaveTs = performance.now();
        });

        // Touch support for mobile devices
        window.addEventListener("touchmove", (e) => {
            if (e.touches && e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
                hovering = true;
            }
        }, { passive: true });

        window.addEventListener("touchend", () => {
            mouse.x = -9999;
            mouse.y = -9999;
            hovering = false;
            leaveTs = performance.now();
        }, { passive: true });

        function loop(ts) {
            raf = requestAnimationFrame(loop);
            const dt = Math.min((ts - (prevTs || ts)) / 1000, 0.05);
            prevTs = ts;

            if (spacingSnap !== cfg.dotSpacing) buildDots();
            globalAngle += cfg.orbitSpeed * dt;

            ctx.clearRect(0, 0, W, H);
            const rgb = parseColor(cfg.dotColor, canvas);
            const mx = mouse.x;
            const my = mouse.y;
            const timeSinceLeave = hovering ? 0 : Math.max(0, ts - leaveTs) / 1000;
            const decay = hovering ? 1 : smoothstep(Math.max(0, 1 - timeSinceLeave * 1.5));

            for (let i = 0; i < dots.length; i++) {
                const d = dots[i];
                const dx = d.bx - mx;
                const dy = d.by - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const inRange = dist < cfg.impactRadius && dist > 0;
                let x = d.bx, y = d.by, scale = 1, alpha = 0.35;

                if (inRange) {
                    const t = dist / cfg.impactRadius;
                    const inf = smoothstep(1 - t) * decay;
                    if (cfg.enableRevolve) {
                        // Orbital radius scales with distance from cursor edge
                        const orbitR = (1 - t) * cfg.dotSpacing * 0.75 * inf;
                        // Current angle along this dot's orbit
                        const theta = globalAngle * d.speedMult + d.phase;
                        // 3-D orbit: parametric ellipse in a tilted plane
                        const cosA = Math.cos(d.ascension);
                        const sinA = Math.sin(d.ascension);
                        const cosI = Math.cos(d.inclination);
                        const sinI = Math.sin(d.inclination);
                        const lx = Math.cos(theta);
                        const ly = Math.sin(theta) * cosI;
                        const lz = Math.sin(theta) * sinI; // +1 = toward viewer, -1 = away

                        // Final 2-D screen offset from the dot's rest position
                        const ox = (lx * cosA - ly * sinA) * orbitR;
                        const oy = (lx * sinA + ly * cosA) * orbitR;
                        x = d.bx + ox;
                        y = d.by + oy;

                        // Depth cue: dots "behind" the plane are slightly smaller and dimmer
                        const depthScale = 0.75 + 0.25 * ((lz + 1) * 0.5); // 0.75 - 1.0
                        scale = (1 + (cfg.scaleOnHover - 1) * inf) * depthScale;
                        alpha = (0.35 + 0.65 * inf) * depthScale;
                    } else {
                        scale = 1 + (cfg.scaleOnHover - 1) * inf;
                        alpha = 0.35 + 0.65 * inf;
                    }

                    // Subtle neon glow for active dots in the cursor orbit
                    ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.6 * inf})`;
                    ctx.shadowBlur = 8 * inf;
                } else {
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }

                const r = (cfg.dotSize / 2) * scale;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
                ctx.fill();
            }
        }

        raf = requestAnimationFrame(loop);

        return {
            destroy() {
                cancelAnimationFrame(raf);
                ro.disconnect();
                window.removeEventListener("resize", resize);
            },
            config: cfg
        };
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            const canvas = document.getElementById("dotGridCanvas");
            if (canvas) {
                window.dotGridInstance = createDotGrid(canvas);
            }
        });
    } else {
        const canvas = document.getElementById("dotGridCanvas");
        if (canvas) {
            window.dotGridInstance = createDotGrid(canvas);
        }
    }

    window.DotGridBackground = {
        create: createDotGrid
    };
})();
