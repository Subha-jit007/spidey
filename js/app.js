/* ============================================================
   SUBHAJIT MAHATA — portfolio engine
   GSAP + ScrollTrigger + Lenis + hand-rolled verlet physics
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const isTouch = window.matchMedia("(hover: none)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------
   DEVICE DETECTION — auto-optimize the UI for mobile vs desktop.
   Combines UA sniffing with capability + viewport checks, then
   tags <body> so CSS + JS can light up the right experience and
   skip the heavy stuff (physics density, parallax) on phones.
------------------------------------------------------------ */
const uaIsMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent || "");
function detectDevice() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 860px)").matches;
  const mobile = uaIsMobile || (coarse && narrow);
  document.body.classList.toggle("is-mobile", mobile);
  document.body.classList.toggle("is-desktop", !mobile);
  return mobile;
}
const isMobile = detectDevice();

// re-evaluate on rotate / resize so a flipped tablet adapts its layout too
let deviceRAF;
window.addEventListener("resize", () => {
  cancelAnimationFrame(deviceRAF);
  deviceRAF = requestAnimationFrame(detectDevice);
});

/* ------------------------------------------------------------
   SMOOTH SCROLL (Lenis driven by GSAP ticker)
------------------------------------------------------------ */
const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1.05 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop(); // locked until preloader finishes

// anchor links through Lenis
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  });
});

/* ------------------------------------------------------------
   PRELOADER — spider drops in, counter, THWIP, rip open
------------------------------------------------------------ */
(function preloader() {
  const count = { v: 0 };
  const countEl = document.getElementById("preCount");
  const tl = gsap.timeline({
    onComplete() {
      document.getElementById("preloader").remove();
      lenis.start();
      heroIntro();
    },
  });

  tl.to(".preloader__thread line", { strokeDashoffset: 0, duration: 0.9, ease: "power2.in" })
    .to("#preSpider", { scale: 1, duration: 0.45, ease: "back.out(2.5)" }, "-=0.25")
    .to(count, {
      v: 100,
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate: () => (countEl.textContent = Math.round(count.v)),
    }, "-=0.3")
    .to("#preSpider", { y: -80, scale: 0.6, duration: 0.3, ease: "power2.in" })
    .set(["#preCount", ".preloader__thread"], { opacity: 0 })
    .to("#preThwip", { scale: 1, opacity: 1, rotation: -6, duration: 0.32, ease: "back.out(3)" })
    .to("#preThwip", { scale: 1.12, duration: 0.18 })
    .to("#preloader", {
      clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
      duration: 0.7,
      ease: "power4.inOut",
    }, "+=0.15");

  gsap.set("#preloader", { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" });
})();

/* ------------------------------------------------------------
   HERO ENTRANCE
------------------------------------------------------------ */
function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from(".hero__word", { yPercent: 110, duration: 1.1, stagger: 0.12 })
    .from(".hero__kicker", { opacity: 0, y: 18, duration: 0.6 }, "-=0.6")
    .from(".hero__sub", { opacity: 0, y: 22, duration: 0.6 }, "-=0.45")
    .from(".hero__sticker", {
      scale: 0,
      rotation: () => gsap.utils.random(-50, 50),
      duration: 0.7,
      ease: "elastic.out(1, 0.45)",
      stagger: 0.1,
    }, "-=0.5")
    .from(".hero__scrollhint", { opacity: 0, duration: 0.5 }, "-=0.3")
    .from(".header", { y: -70, opacity: 0, duration: 0.7 }, "-=0.8");
}

/* ------------------------------------------------------------
   CUSTOM CURSOR + WEB SPLAT ON CLICK
------------------------------------------------------------ */
if (!isTouch) {
  const cursor = document.getElementById("cursor");
  const label = document.getElementById("cursorLabel");
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const mouse = { x: pos.x, y: pos.y };

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  gsap.ticker.add(() => {
    pos.x += (mouse.x - pos.x) * 0.18;
    pos.y += (mouse.y - pos.y) * 0.18;
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  });

  document.querySelectorAll("[data-cursor], a, button, .skill-card, .scrap").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("is-hover");
      label.textContent = el.dataset.cursor || "";
    });
    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-hover");
      label.textContent = "";
    });
  });

  // web splat sticks where you click
  window.addEventListener("click", (e) => {
    const splat = document.createElement("div");
    splat.className = "websplat";
    splat.style.left = e.clientX + "px";
    splat.style.top = e.clientY + "px";
    splat.innerHTML = document.body.classList.contains("iron")
      ? `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
          <circle cx="50" cy="50" r="44" opacity="0.5"/>
          <circle cx="50" cy="50" r="30" opacity="0.75"/>
          <circle cx="50" cy="50" r="16"/>
          <circle cx="50" cy="50" r="5" fill="currentColor"/>
        </svg>`
      : `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
          ${Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return `<line x1="50" y1="50" x2="${50 + Math.cos(a) * 46}" y2="${50 + Math.sin(a) * 46}"/>`;
          }).join("")}
          <polygon points="50,18 73,27 82,50 73,73 50,82 27,73 18,50 27,27" />
          <polygon points="50,33 62,38 67,50 62,62 50,67 38,62 33,50 38,38" />
        </svg>`;
    document.body.appendChild(splat);
    gsap.fromTo(splat,
      { scale: 0, rotation: gsap.utils.random(-40, 40) },
      { scale: 1, rotation: 0, duration: 0.35, ease: "back.out(2.5)" });
    gsap.to(splat, { opacity: 0, duration: 0.5, delay: 0.8, onComplete: () => splat.remove() });
  });
}

/* ------------------------------------------------------------
   SCROLL PROGRESS SPIDER (rides a thread down the right edge)
------------------------------------------------------------ */
(function scrollSpider() {
  const thread = document.getElementById("spiderThread");
  const bug = document.getElementById("spiderBug");
  ScrollTrigger.create({
    start: 0,
    end: () => document.documentElement.scrollHeight - innerHeight,
    onUpdate(self) {
      const h = self.progress * (innerHeight - 90) + 50;
      thread.style.height = h + "px";
      bug.style.top = h + "px";
      gsap.to(bug, {
        rotation: gsap.utils.clamp(-26, 26, self.getVelocity() / 90),
        duration: 0.3,
        overwrite: "auto",
      });
    },
  });
})();

/* ------------------------------------------------------------
   HERO CANVAS — verlet rope + swinging spider (the hard part)
------------------------------------------------------------ */
(function physicsSpider() {
  if (reduceMotion) return;
  const canvas = document.getElementById("heroCanvas");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2);
  let W, H;

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const SEGMENTS = isMobile ? 14 : 22;
  const ropeLen = () => H * 0.42;
  const anchor = { x: W * 0.78, tx: W * 0.78 };
  const pts = Array.from({ length: SEGMENTS }, (_, i) => ({
    x: W * 0.78,
    y: (ropeLen() / (SEGMENTS - 1)) * i,
    px: W * 0.78 + (i ? Math.random() * 8 - 4 : 0),
    py: (ropeLen() / (SEGMENTS - 1)) * i,
  }));

  const mouse = { x: W / 2, y: H / 2, inHero: false };
  window.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.inHero = e.clientY < r.bottom && e.clientY > r.top;
  });
  // a click in the hero kicks the spider — THWIP (or bursts the orb — PEW)
  window.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientY > r.bottom || e.clientY < r.top) return;
    if (document.body.classList.contains("iron")) {
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = gsap.utils.random(2, 7);
        orb.parts.push({ x: orb.x, y: orb.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 });
      }
    } else {
      const tip = pts[SEGMENTS - 1];
      tip.px = tip.x + gsap.utils.random(-70, 70);
      tip.py = tip.y + gsap.utils.random(20, 60);
    }
  });

  let legPhase = 0;

  /* pause the whole simulation while the hero is off-screen (battery + perf) */
  let heroInView = true;
  let rafRunning = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      heroInView = entries[0].isIntersecting;
      if (heroInView && !rafRunning) { rafRunning = true; step(); }
    }, { threshold: 0 }).observe(canvas);
  }

  /* ---- IRON MODE: repulsor orb that flies after the cursor ---- */
  const orb = { x: 0, y: 0, vx: 0, vy: 0, parts: [] };
  let orbInit = false;

  function stepOrb() {
    if (!orbInit) { orb.x = W * 0.78; orb.y = H * 0.3; orbInit = true; }
    const tx = mouse.inHero ? mouse.x : W * 0.78;
    const ty = mouse.inHero ? mouse.y : H * 0.3 + Math.sin(performance.now() / 600) * 16;
    orb.vx = (orb.vx + (tx - orb.x) * 0.012) * 0.92;
    orb.vy = (orb.vy + (ty - orb.y) * 0.012) * 0.92;
    orb.x += orb.vx;
    orb.y += orb.vy;

    // thruster exhaust (thinner trail on mobile)
    const speed = Math.hypot(orb.vx, orb.vy);
    const n = isMobile ? 1 : (speed > 1.5 ? 3 : 1);
    for (let i = 0; i < n; i++) {
      orb.parts.push({
        x: orb.x, y: orb.y,
        vx: -orb.vx * 0.35 + gsap.utils.random(-0.7, 0.7),
        vy: -orb.vy * 0.35 + gsap.utils.random(0.2, 1.2),
        life: 1,
      });
    }
    for (let i = orb.parts.length - 1; i >= 0; i--) {
      const pt = orb.parts[i];
      pt.x += pt.vx; pt.y += pt.vy;
      pt.life -= 0.025;
      if (pt.life <= 0) orb.parts.splice(i, 1);
    }
  }

  function drawOrb() {
    ctx.clearRect(0, 0, W, H);
    // exhaust trail — gold fading to red
    for (const pt of orb.parts) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.5 + 3.5 * pt.life, 0, Math.PI * 2);
      ctx.fillStyle = pt.life > 0.5
        ? `rgba(242, 193, 78, ${pt.life * 0.8})`
        : `rgba(177, 18, 27, ${pt.life * 0.9})`;
      ctx.fill();
    }
    // arc reactor core
    const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 38);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.25, "rgba(126,216,255,0.8)");
    g.addColorStop(1, "rgba(126,216,255,0)");
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 38, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 11, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(242, 193, 78, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // triangle core (Mark VI vibes)
    ctx.beginPath();
    ctx.moveTo(orb.x, orb.y - 6);
    ctx.lineTo(orb.x + 5.5, orb.y + 4);
    ctx.lineTo(orb.x - 5.5, orb.y + 4);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill();
  }

  function step() {
    if (!heroInView) { rafRunning = false; return; } // sleep until hero scrolls back
    if (document.body.classList.contains("iron")) {
      stepOrb();
      drawOrb();
      requestAnimationFrame(step);
      return;
    }
    // anchor eases toward mouse x (the spider "follows" you)
    anchor.tx = mouse.inHero ? gsap.utils.clamp(W * 0.12, W * 0.88, mouse.x) : W * 0.78;
    anchor.x += (anchor.tx - anchor.x) * 0.035;

    const seg = ropeLen() / (SEGMENTS - 1);

    // verlet integration
    for (let i = 1; i < SEGMENTS; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.985;
      const vy = (p.y - p.py) * 0.985;
      p.px = p.x; p.py = p.y;
      p.x += vx;
      p.y += vy + 0.55; // gravity
    }
    pts[0].x = anchor.x;
    pts[0].y = 0;

    // distance constraints (fewer relaxation passes on mobile)
    for (let k = 0; k < (isMobile ? 4 : 6); k++) {
      for (let i = 0; i < SEGMENTS - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        const diff = ((d - seg) / d) * 0.5;
        const ox = dx * diff, oy = dy * diff;
        if (i === 0) { b.x -= ox * 2; b.y -= oy * 2; }
        else { a.x += ox; a.y += oy; b.x -= ox; b.y -= oy; }
      }
    }

    draw();
    requestAnimationFrame(step);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const ink = getComputedStyle(document.body).getPropertyValue("--ink").trim();
    const red = getComputedStyle(document.body).getPropertyValue("--red").trim();

    // thread
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < SEGMENTS; i++) {
      const prev = pts[i - 1], p = pts[i];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + p.x) / 2, (prev.y + p.y) / 2);
    }
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // spider at the tip, rotated along the last segment
    const tip = pts[SEGMENTS - 1];
    const prev = pts[SEGMENTS - 2];
    const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x) - Math.PI / 2;
    const speed = Math.hypot(tip.x - tip.px, tip.y - tip.py);
    legPhase += 0.08 + speed * 0.03;

    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(ang + Math.PI);
    const s = Math.min(W, H) / 18;

    // legs — 4 per side, animated wiggle
    ctx.strokeStyle = ink;
    ctx.lineWidth = s * 0.14;
    ctx.lineCap = "round";
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const wob = Math.sin(legPhase + i * 1.3 + (side > 0 ? 0.7 : 0)) * s * 0.09;
        const hipX = side * s * 0.2;
        const hipY = -s * 0.06 + i * s * 0.16;
        const kneeX = side * s * 0.62;
        const kneeY = hipY - s * 0.32 + i * s * 0.1 + wob;
        const footX = side * s * 0.95;
        const footY = hipY + s * 0.22 + i * s * 0.14 + wob * 1.6;
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
        ctx.stroke();
      }
    }

    // body
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.32, s * 0.34, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.28, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
    // red hourglass mark
    ctx.fillStyle = red;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.04);
    ctx.lineTo(s * 0.12, s * 0.34);
    ctx.lineTo(0, s * 0.64);
    ctx.lineTo(-s * 0.12, s * 0.34);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  step();
})();

/* ------------------------------------------------------------
   HERO SCROLL — parallax stickers, text fill pan, fade out
------------------------------------------------------------ */
gsap.utils.toArray(".hero__sticker").forEach((el) => {
  gsap.to(el, {
    y: () => -120 * (parseFloat(el.dataset.speed) || 1),
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  });
});
gsap.to(".hero__word--fill", {
  backgroundPosition: "50% 80%",
  ease: "none",
  scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
});
gsap.to(".hero__content", {
  yPercent: -18,
  opacity: 0.25,
  ease: "none",
  scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom 30%", scrub: true },
});

/* ------------------------------------------------------------
   MARQUEES — infinite loop, speed & direction react to scroll
------------------------------------------------------------ */
function marquee(sel, dir) {
  const track = document.querySelector(sel + " .marquee__track");
  const tween = gsap.to(track, { xPercent: -50 * dir, duration: 18, ease: "none", repeat: -1 });
  if (dir < 0) gsap.set(track, { xPercent: -50 });

  ScrollTrigger.create({
    trigger: sel,
    start: "top bottom",
    end: "bottom top",
    onUpdate(self) {
      const v = self.getVelocity() / 1000;
      tween.timeScale(gsap.utils.clamp(-4, 4, dir * (dir + v)) || dir * 0.2);
    },
  });
}
marquee("#marquee1", 1);
marquee("#marquee2", -1);

/* ------------------------------------------------------------
   ORIGIN — pinned comic pages with iris wipes + camera zoom
------------------------------------------------------------ */
(function origin() {
  const scenes = gsap.utils.toArray(".origin__scene");
  const num = document.getElementById("originNum");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#origin",
      start: "top top",
      end: "+=" + scenes.length * 90 + "%",
      pin: "#originPin",
      scrub: 0.6,
      onUpdate(self) {
        const i = Math.min(scenes.length - 1, Math.floor(self.progress * scenes.length));
        num.textContent = String(i + 1).padStart(2, "0");
      },
    },
  });

  scenes.forEach((scene, i) => {
    const img = scene.querySelector("img");
    const cap = scene.querySelector(".origin__caption");

    // slow camera zoom inside every visible scene
    tl.to(img, { scale: 1, duration: 1, ease: "none" }, i);
    if (i === 0) {
      tl.from(cap, { y: 40, opacity: 0, duration: 0.3 }, 0.05);
    }
    if (i < scenes.length - 1) {
      const next = scenes[i + 1];
      tl.set(next, { visibility: "visible" }, i + 0.55)
        .fromTo(next,
          { clipPath: "circle(0% at 50% 50%)" },
          { clipPath: "circle(150% at 50% 50%)", duration: 0.45, ease: "power2.inOut" },
          i + 0.55)
        .from(next.querySelector(".origin__caption"),
          { y: 40, opacity: 0, duration: 0.25 }, i + 0.85);
    }
  });
})();

/* ------------------------------------------------------------
   MANIFESTO — char-by-char scrub reveal (rebuildable per theme)
------------------------------------------------------------ */
let manifestoTweens = [];
function buildManifesto(text, highlightWords) {
  manifestoTweens.forEach((t) => {
    if (t.scrollTrigger) t.scrollTrigger.kill();
    t.kill();
  });
  manifestoTweens = [];

  const el = document.getElementById("manifestoText");
  el.innerHTML = text.trim().split(" ").map((w) =>
    `<span class="word">${[...w].map((c) => `<span class="char">${c}</span>`).join("")}</span>`
  ).join(" ");

  manifestoTweens.push(gsap.fromTo(el.querySelectorAll(".char"),
    { opacity: 0.12, y: 36, rotateX: -75 },
    {
      opacity: 1, y: 0, rotateX: 0,
      stagger: 0.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#manifesto",
        start: "top 75%",
        end: "center 45%",
        scrub: 0.5,
      },
    }));

  // chosen words pop red as they finish
  const sel = highlightWords.map((n) => `.word:nth-child(${n}) .char`).join(", ");
  manifestoTweens.push(gsap.to(el.querySelectorAll(sel), {
    color: "var(--red)",
    stagger: 0.4,
    scrollTrigger: { trigger: "#manifesto", start: "top 45%", end: "center 40%", scrub: true },
  }));
}
buildManifesto("WITH GREAT PROMPTS COMES GREAT OUTPUTS", [2, 5]);

/* ------------------------------------------------------------
   SKILLS — pinned horizontal scroll + velocity skew + parallax
------------------------------------------------------------ */
(function skills() {
  const track = document.getElementById("skillsTrack");
  const getDist = () => track.scrollWidth - innerWidth;

  const scrollTween = gsap.to(track, {
    x: () => -getDist(),
    ease: "none",
    scrollTrigger: {
      trigger: "#skills",
      start: "top top",
      end: () => "+=" + getDist(),
      pin: true,
      scrub: 0.7,
      invalidateOnRefresh: true,
      onUpdate(self) {
        // comic-panel skew driven by scroll velocity
        const skew = gsap.utils.clamp(-8, 8, self.getVelocity() / -300);
        gsap.to(".skill-card", { skewX: skew, duration: 0.4, overwrite: "auto", ease: "power2.out" });
      },
    },
  });

  // parallax inside each card image (uses containerAnimation)
  gsap.utils.toArray(".skill-card__img img").forEach((img) => {
    gsap.fromTo(img, { yPercent: -12 }, {
      yPercent: 0,
      ease: "none",
      scrollTrigger: {
        trigger: img,
        containerAnimation: scrollTween,
        start: "left right",
        end: "right left",
        scrub: true,
      },
    });
  });

  // card tilt toward the mouse
  if (!isTouch) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
        gsap.to(card, { rotateX: rx, rotateY: ry, transformPerspective: 700, duration: 0.4 });
      });
      card.addEventListener("mouseleave", () =>
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" }));
    });
  }
})();

/* ------------------------------------------------------------
   MISSIONS — comic cards slam in on scroll
------------------------------------------------------------ */
(function missions() {
  gsap.from(".missions__head", {
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: "#missions", start: "top 75%" },
  });
  gsap.utils.toArray(".mission").forEach((card, i) => {
    gsap.from(card, {
      y: 110,
      opacity: 0,
      scale: 0.92,
      duration: 0.85,
      delay: (i % 2) * 0.12,
      ease: "back.out(1.6)",
      scrollTrigger: { trigger: card, start: "top 88%" },
    });
  });
})();

/* ------------------------------------------------------------
   SCRAPBOOK — depth parallax on scroll + mouse drift
------------------------------------------------------------ */
(function scrapbook() {
  const items = gsap.utils.toArray("#scrapbook [data-depth]");

  items.forEach((el) => {
    const depth = parseFloat(el.dataset.depth);
    // depth parallax drifts items over each other — skip it on the stacked mobile layout
    if (!isMobile) {
      gsap.fromTo(el, { y: 90 * depth }, {
        y: -130 * depth,
        ease: "none",
        scrollTrigger: { trigger: "#scrapbook", start: "top bottom", end: "bottom top", scrub: true },
      });
    }
    gsap.from(el, {
      opacity: 0,
      scale: 0.85,
      rotation: () => gsap.utils.random(-14, 14),
      duration: 0.8,
      ease: "back.out(1.8)",
      scrollTrigger: { trigger: el, start: "top 92%" },
    });
  });

  if (!isTouch) {
    window.addEventListener("mousemove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      items.forEach((el) => {
        const depth = parseFloat(el.dataset.depth);
        gsap.to(el, { x: nx * 34 * depth, duration: 1.2, ease: "power2.out", overwrite: "auto" });
      });
    });
  }

  // title letters jolt in
  gsap.from(".scrapbook__title", {
    scale: 0.7,
    rotation: -4,
    opacity: 0,
    duration: 0.7,
    ease: "back.out(2)",
    scrollTrigger: { trigger: ".scrapbook__title", start: "top 85%" },
  });
})();

/* ------------------------------------------------------------
   CONTACT — title reveal + magnetic THWIP button
------------------------------------------------------------ */
(function contact() {
  gsap.from(".contact__title-line", {
    yPercent: 110,
    duration: 1,
    stagger: 0.12,
    ease: "power4.out",
    scrollTrigger: { trigger: "#contact", start: "top 60%" },
  });
  gsap.from([".contact__kicker", ".contact__btn", ".contact__links", ".footer"], {
    opacity: 0,
    y: 26,
    duration: 0.7,
    stagger: 0.1,
    scrollTrigger: { trigger: "#contact", start: "top 50%" },
  });

  const btn = document.getElementById("magnetBtn");
  if (!isTouch) {
    window.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 200) {
        const pull = 1 - dist / 200;
        gsap.to(btn, { x: dx * pull * 0.45, y: dy * pull * 0.45, duration: 0.4 });
        gsap.to(".contact__btn-text", { x: dx * pull * 0.15, y: dy * pull * 0.15, duration: 0.4 });
      } else {
        gsap.to([btn, ".contact__btn-text"], { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      }
    });
  }
})();

/* ------------------------------------------------------------
   STARK UPGRADE FINALE — make the end-of-page CTA impossible to
   ignore. It flies in, then does a one-time attention "nudge"
   when the visitor reaches the bottom so they actually tap it
   (the / shortcut is desktop-only — phones need the button).
------------------------------------------------------------ */
(function finale() {
  const wrap = document.getElementById("finale");
  const btn = document.getElementById("themeToggle");
  if (!wrap || !btn) return;

  gsap.from(wrap.children, {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.12,
    ease: "power3.out",
    scrollTrigger: { trigger: wrap, start: "top 88%" },
  });

  // shake + pop once the button is properly in view — the "force a click" beat
  ScrollTrigger.create({
    trigger: wrap,
    start: "top 68%",
    once: true,
    onEnter: () => {
      gsap.timeline()
        .to(btn, { scale: 1.12, duration: 0.22, ease: "back.out(3)" })
        .to(btn, { rotation: -3.5, duration: 0.07, repeat: 5, yoyo: true, ease: "none" })
        .to(btn, { rotation: 0, scale: 1, duration: 0.35, ease: "elastic.out(1, 0.4)" });
    },
  });
})();

/* ------------------------------------------------------------
   ADAPTIVE HEADER — branding turns white over dark sections
------------------------------------------------------------ */
(function adaptiveHeader() {
  const header = document.querySelector(".header");
  let overDark = 0;
  const sync = () => header.classList.toggle("is-over-dark", overDark > 0);

  ["#origin", "#marquee2", "#contact"].forEach((sel) => {
    ScrollTrigger.create({
      trigger: sel,
      start: "top 52px",   // when the section reaches the header line
      end: "bottom 20px",
      onEnter: () => { overDark++; sync(); },
      onEnterBack: () => { overDark++; sync(); },
      onLeave: () => { overDark--; sync(); },
      onLeaveBack: () => { overDark--; sync(); },
    });
  });
})();

/* ------------------------------------------------------------
   STARK UPGRADE — full Iron Man theme (press / or tap the egg)
   Swaps every image, every line of copy, the physics toy,
   the cursor splat, and the whole palette. Two sites in one.
------------------------------------------------------------ */
const IMG_SWAPS = [
  ['.origin__scene[data-scene="0"] img', "assets/iron-retro.jpg"],
  ['.origin__scene[data-scene="1"] img', "assets/iron-blueprint.jpg"],
  ['.origin__scene[data-scene="2"] img', "assets/iron-armors.jpg"],
  ['.origin__scene[data-scene="3"] img', "assets/iron-fly.jpg"],
  [".skill-card:nth-of-type(1) .skill-card__img img", "assets/iron-battle.jpg"],
  [".skill-card:nth-of-type(2) .skill-card__img img", "assets/iron-text.jpg"],
  [".skill-card:nth-of-type(3) .skill-card__img img", "assets/iron-poster.jpg"],
  [".skill-card:nth-of-type(4) .skill-card__img img", "assets/jarvis-hud.jpg"],
  [".skill-card:nth-of-type(5) .skill-card__img img", "assets/iron-comic.jpg"],
  ['.scrap[data-depth="0.4"] img', "assets/iron-legacy.jpg"],
  ['.scrap[data-depth="0.9"] img', "assets/iron-mark1.jpg"],
  ['.scrap[data-depth="0.6"] img', "assets/iron-graffiti.jpg"],
  ['.scrap[data-depth="1.2"] img', "assets/iron-eyes.jpg"],
  ['.scrap[data-depth="0.75"] img', "assets/tony-blue.jpg"],
];

const TEXT_SWAPS = [
  [".header__logo-mark", "⚡"],
  [".hero__kicker", "<span>MARK #85</span> · THE INVINCIBLE DEVELOPER · EST. CLASS 12"],
  [".hero__sub", "Genius. Student. <em>AI developer</em>.<br/>Building suits out of pure code."],
  [".hero__sticker--1 span", "I AM<br/>IRON DEV"],
  [".hero__sticker--2 span", "PEW!"],
  [".hero__scrollhint span", "SCROLL OR FLY"],
  ["#marquee1 .marquee__track span:nth-child(1)", "GENIUS ✦ STUDENT ✦ AI DEVELOPER ✦ SUIT BUILDER ✦ N8N AUTOMATION ✦ BUILDING NON-STOP ✦&nbsp;"],
  ["#marquee1 .marquee__track span:nth-child(2)", "GENIUS ✦ STUDENT ✦ AI DEVELOPER ✦ SUIT BUILDER ✦ N8N AUTOMATION ✦ BUILDING NON-STOP ✦&nbsp;"],
  ['.origin__scene[data-scene="0"] .origin__caption p', "An ordinary kid with a garage full of scraps (browser tabs)…"],
  ['.origin__scene[data-scene="1"] .origin__caption p', "…started drawing his own <b>blueprints</b>."],
  ['.origin__scene[data-scene="2"] .origin__caption p', "Built suit after suit. Mark after Mark."],
  ['.origin__scene[data-scene="3"] .origin__caption p', "Now he flies. JARVIS handles the boring parts."],
  [".manifesto__small", "— stark protocol —"],
  [".manifesto__sign", "— Tony Stark, mentor in my head"],
  [".skills__intro p", "← JARVIS,<br/>scroll right"],
  ['.scrap[data-depth="0.4"] figcaption', "i am iron dev."],
  ['.scrap[data-depth="0.9"] figcaption', "mark I energy"],
  ['.scrap[data-depth="0.6"] figcaption', "hustle protocol"],
  ['.scrap[data-depth="1.2"] figcaption', "eyes on the build"],
  ['.scrap[data-depth="0.75"] figcaption', "genius, allegedly"],
  ['.scrap-sticker:not(.scrap-sticker--burst)', "built his first suit ✓<br/>in a bedroom-cave"],
  [".scrap-sticker--burst", "PEW!"],
  ["#marquee2 .marquee__track span:nth-child(1)", "PEW ✦ PEW ✦ I AM IRON DEV ✦ SOMETIMES YOU GOTTA RUN BEFORE YOU CAN WALK ✦&nbsp;"],
  ["#marquee2 .marquee__track span:nth-child(2)", "PEW ✦ PEW ✦ I AM IRON DEV ✦ SOMETIMES YOU GOTTA RUN BEFORE YOU CAN WALK ✦&nbsp;"],
  [".contact__kicker", "JARVIS, DRAFT AN EMAIL."],
  [".contact__title-line:nth-child(1)", "SUIT UP"],
  [".contact__title-line:nth-child(2)", "WITH ME"],
  [".contact__btn-text", "PING J.A.R.V.I.S."],
  [".finale__label", "RETURN TO THE <strong>SPIDER-VERSE</strong> 🕷"],
  [".finale__hint", "— had enough of the suit? —"],
];

const spideyCache = new Map();

function applyTheme(iron) {
  document.body.classList.toggle("iron", iron);

  IMG_SWAPS.forEach(([sel, ironSrc]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (!spideyCache.has(sel)) spideyCache.set(sel, el.getAttribute("src"));
    el.setAttribute("src", iron ? ironSrc : spideyCache.get(sel));
  });

  TEXT_SWAPS.forEach(([sel, ironHTML]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (!spideyCache.has(sel)) spideyCache.set(sel, el.innerHTML);
    el.innerHTML = iron ? ironHTML : spideyCache.get(sel);
  });

  buildManifesto(
    iron ? "SOMETIMES YOU GOTTA RUN BEFORE YOU CAN WALK" : "WITH GREAT PROMPTS COMES GREAT OUTPUTS",
    iron ? [4, 8] : [2, 5]
  );

  try { localStorage.setItem("theme", iron ? "iron" : "spidey"); } catch (e) {}

  /* clearProps is load-bearing: any leftover transform on <main> turns it into
     the containing block for position:fixed, which breaks ScrollTrigger pins */
  gsap.fromTo("main", { scale: 0.985 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)", clearProps: "transform" });
}

function toggleTheme() {
  applyTheme(!document.body.classList.contains("iron"));
}

document.getElementById("themeToggle").addEventListener("click", toggleTheme);

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if ((k !== "/" && k !== "i") || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/input|textarea/i.test(document.activeElement.tagName)) return;
  e.preventDefault();
  toggleTheme();
});

// remember the suit you left in
try {
  if (localStorage.getItem("theme") === "iron") applyTheme(true);
} catch (e) {}

/* refresh triggers once everything (fonts/images) settles */
window.addEventListener("load", () => ScrollTrigger.refresh());
