/* =====================================================================
   La Ville Hotel — interactions & motion
   GSAP + ScrollTrigger + Lenis when available; graceful fallbacks.
   ===================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Header state (transparent over hero -> solid) ---------- */
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero, .page-hero");
  if (header) {
    // Solidify as soon as the user scrolls past the header itself, so the
    // nav never sits transparent over moving content (hard to read).
    var solidFrom = 48;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle("solid", y > solidFrom);
      header.classList.toggle("at-top", hero ? y <= solidFrom : false);
    };
    if (hero) header.classList.add("at-top");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Hero image parallax (optional GSAP enhancement) ---------- */
  if (hasST && !reduce) {
    var heroImg = document.querySelector(".hero-media img, .page-hero img");
    if (heroImg) {
      gsap.to(heroImg, { yPercent: 14, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    }
  }

  /* ---------- Scroll reveals (IntersectionObserver first — most robust) ---------- */
  var reveals = document.querySelectorAll(".reveal, .reveal-img");
  if (reduce) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    // failsafe: reveal anything still hidden after 4s (e.g. tab was backgrounded on load)
    window.setTimeout(function () { reveals.forEach(function (el) { el.classList.add("in"); }); }, 4000);
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Marquee (seamless; track markup is duplicated x2) ---------- */
  document.querySelectorAll("[data-marquee]").forEach(function (track) {
    if (reduce) return;
    var speed = parseFloat(track.getAttribute("data-marquee")) || 40; // px/sec
    var half = track.scrollWidth / 2;
    if (half <= 0) return;
    if (hasGSAP) {
      var pos = 0, last = null;
      gsap.ticker.add(function (time) {
        if (last === null) { last = time; return; }
        pos -= speed * (time - last);
        last = time;
        if (-pos >= half) pos += half;
        track.style.transform = "translate3d(" + pos + "px,0,0)";
      });
    } else {
      var start = null;
      var loop = function (ts) {
        if (start === null) start = ts;
        var p = -((speed * (ts - start)) / 1000) % half;
        track.style.transform = "translate3d(" + p + "px,0,0)";
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  });

  /* ---------- Stat count-up ---------- */
  var stats = document.querySelectorAll("[data-count]");
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1600, start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = prefix + val.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (stats.length) {
    if (reduce) {
      stats.forEach(function (el) { el.textContent = (el.getAttribute("data-prefix") || "") + parseFloat(el.getAttribute("data-count")).toLocaleString() + (el.getAttribute("data-suffix") || ""); });
    } else if ("IntersectionObserver" in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); sio.unobserve(en.target); } });
      }, { threshold: 0.6 });
      stats.forEach(function (el) { sio.observe(el); });
    } else {
      stats.forEach(runCount);
    }
  }

  /* ---------- Testimonial carousel ---------- */
  var testi = document.querySelector("[data-testi]");
  if (testi) {
    var trackT = testi.querySelector(".testi-track");
    var slides = Array.prototype.slice.call(testi.querySelectorAll(".testi-slide"));
    var dotsWrap = testi.querySelector(".testi-dots");
    var prev = testi.querySelector("[data-testi-prev]");
    var next = testi.querySelector("[data-testi-next]");
    var idx = 0, timer = null;
    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.className = "testi-dot";
      b.setAttribute("aria-label", "Go to review " + (i + 1));
      b.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });
    var render = function () {
      trackT.style.transform = "translateX(" + (-idx * 100) + "%)";
      slides.forEach(function (s, i) { s.setAttribute("aria-hidden", i === idx ? "false" : "true"); });
      dots.forEach(function (d, i) { d.setAttribute("aria-selected", i === idx ? "true" : "false"); });
    };
    var go = function (n) { idx = (n + slides.length) % slides.length; render(); restart(); };
    var restart = function () { if (timer) clearInterval(timer); if (!reduce) timer = setInterval(function () { go(idx + 1); }, 6500); };
    if (prev) prev.addEventListener("click", function () { go(idx - 1); });
    if (next) next.addEventListener("click", function () { go(idx + 1); });
    render(); restart();
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      // close siblings for a clean accordion
      item.parentElement.querySelectorAll(".faq-item.open").forEach(function (o) {
        if (o !== item) { o.classList.remove("open"); o.querySelector(".faq-a").style.height = "0px"; o.querySelector(".faq-q").setAttribute("aria-expanded", "false"); }
      });
      if (isOpen) { item.classList.remove("open"); a.style.height = "0px"; q.setAttribute("aria-expanded", "false"); }
      else { item.classList.add("open"); a.style.height = a.firstElementChild.offsetHeight + "px"; q.setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- Booking date prefill ---------- */
  var fromEl = document.querySelector('input[name="from"]');
  var toEl = document.querySelector('input[name="to"]');
  if (fromEl && toEl) {
    var fmt = function (d) { return d.toISOString().slice(0, 10); };
    var today = new Date(), tmrw = new Date(); tmrw.setDate(today.getDate() + 1);
    fromEl.min = fmt(today); toEl.min = fmt(tmrw);
    if (!fromEl.value) fromEl.value = fmt(today);
    if (!toEl.value) toEl.value = fmt(tmrw);
  }

  /* ---------- Enquiry form (demo handler) ---------- */
  var enquiry = document.querySelector("[data-enquiry]");
  if (enquiry) {
    enquiry.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = enquiry.querySelector("[data-enquiry-note]");
      if (note) { note.hidden = false; note.textContent = "Thank you — this is a demo form. Connect it to email/Formspree before launch and we'll be in touch within 24 hours."; }
      enquiry.querySelector('button[type="submit"]').textContent = "Enquiry noted";
    });
  }

  /* ---------- Current year ---------- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();
