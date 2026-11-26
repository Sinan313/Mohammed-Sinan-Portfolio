/* Mohammed Sinan C - Portfolio interactions
   Everything here is progressive enhancement: the page is fully readable without it. */
(function () {
    "use strict";

    var root = document.documentElement;
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Enables the scroll-reveal styles. Added here (not in CSS) so content never stays hidden if this file fails to load. */
    root.classList.add("reveal-ready");

    function $(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function $$(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    /* ---------- Footer year ---------- */
    var year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- Theme toggle ---------- */
    var themeToggle = $(".theme-toggle");
    var themeMeta = $("#meta-theme");

    function applyTheme(theme, persist) {
        root.setAttribute("data-theme", theme);
        if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0b1312" : "#f6f3ec");
        if (themeToggle) {
            themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
        }
        if (persist) {
            try { localStorage.setItem("theme", theme); } catch (e) { /* storage unavailable */ }
        }
    }

    if (themeToggle) {
        applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);
        themeToggle.addEventListener("click", function () {
            applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
        });
    }

    /* Follow system changes only while the visitor has not chosen a theme manually. */
    if (window.matchMedia) {
        var scheme = window.matchMedia("(prefers-color-scheme: dark)");
        var onSchemeChange = function (event) {
            var saved = null;
            try { saved = localStorage.getItem("theme"); } catch (e) { /* ignore */ }
            if (saved !== "light" && saved !== "dark") applyTheme(event.matches ? "dark" : "light", false);
        };
        if (scheme.addEventListener) scheme.addEventListener("change", onSchemeChange);
    }

    /* ---------- Mobile navigation ---------- */
    var menuToggle = $(".menu-toggle");
    var navPanel = $("#nav-panel");

    function setMenu(open) {
        if (!menuToggle || !navPanel) return;
        navPanel.classList.toggle("is-open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    }

    if (menuToggle && navPanel) {
        menuToggle.addEventListener("click", function () {
            setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
        });

        $$("a", navPanel).forEach(function (link) {
            link.addEventListener("click", function () { setMenu(false); });
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
                setMenu(false);
                menuToggle.focus();
            }
        });

        document.addEventListener("click", function (event) {
            if (menuToggle.getAttribute("aria-expanded") === "true" &&
                !navPanel.contains(event.target) && !menuToggle.contains(event.target)) {
                setMenu(false);
            }
        });

        window.matchMedia("(min-width: 981px)").addEventListener("change", function (event) {
            if (event.matches) setMenu(false);
        });
    }

    /* ---------- Header state + scroll progress ---------- */
    var header = $(".site-header");
    var progress = $(".scroll-progress");
    var ticking = false;

    function onScroll() {
        var scrollTop = window.scrollY || root.scrollTop;
        var max = root.scrollHeight - window.innerHeight;
        if (header) header.classList.toggle("is-scrolled", scrollTop > 8);
        if (progress) progress.style.transform = "scaleX(" + (max > 0 ? Math.min(scrollTop / max, 1) : 0) + ")";
        ticking = false;
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    onScroll();

    /* ---------- Active section in the navigation ---------- */
    var navLinks = $$(".nav-links a");
    var sections = navLinks
        .map(function (link) { return document.getElementById(link.getAttribute("href").slice(1)); })
        .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    if (link.getAttribute("href") === "#" + entry.target.id) {
                        link.setAttribute("aria-current", "true");
                    } else {
                        link.removeAttribute("aria-current");
                    }
                });
            });
        }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
        sections.forEach(function (section) { spy.observe(section); });

        /* Clear the highlight while the hero is on screen. */
        var hero = $("#home");
        if (hero) {
            new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) navLinks.forEach(function (link) { link.removeAttribute("aria-current"); });
            }, { rootMargin: "-40% 0px -55% 0px" }).observe(hero);
        }
    }

    /* ---------- Reveal on scroll ---------- */
    var revealItems = $$("[data-reveal]");
    if ("IntersectionObserver" in window && !prefersReducedMotion) {
        var reveal = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    reveal.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
        revealItems.forEach(function (item) { reveal.observe(item); });
    } else {
        revealItems.forEach(function (item) { item.classList.add("is-visible"); });
    }

    /* ---------- Certificates: category filter + show more ---------- */
    var certGrid = $("#cert-grid");
    var certToggle = $("#cert-toggle");
    var certStatus = $("#cert-status");

    if (certGrid) {
        var LIMIT = 12;
        var certs = $$(".cert", certGrid);
        var chips = $$(".chip[data-filter]");
        var more = certToggle ? certToggle.closest(".cert-more") : null;
        var filter = "all";
        var expanded = false;

        var renderCerts = function () {
            var matches = 0;
            var shown = 0;
            certs.forEach(function (card) {
                var match = filter === "all" || card.getAttribute("data-cat") === filter;
                if (match) matches++;
                var visible = match && (filter !== "all" || expanded || matches <= LIMIT);
                card.hidden = !visible;
                if (visible) shown++;
            });

            if (more) more.hidden = !(filter === "all" && certs.length > LIMIT);
            if (certToggle) {
                certToggle.setAttribute("aria-expanded", String(expanded));
                certToggle.firstElementChild.textContent = expanded ? "Show fewer certificates" : "Show all " + certs.length + " certificates";
            }
            if (certStatus) certStatus.textContent = "Showing " + shown + " of " + certs.length + " certificates.";
        };

        chips.forEach(function (chip) {
            chip.addEventListener("click", function () {
                filter = chip.getAttribute("data-filter");
                expanded = false;
                chips.forEach(function (other) {
                    var active = other === chip;
                    other.classList.toggle("is-active", active);
                    other.setAttribute("aria-pressed", String(active));
                });
                renderCerts();
            });
        });

        if (certToggle) {
            certToggle.addEventListener("click", function () {
                expanded = !expanded;
                renderCerts();
                if (!expanded) {
                    var heading = document.getElementById("certifications");
                    if (heading) heading.scrollIntoView({ block: "start" });
                }
            });
        }

        renderCerts();
    }

    /* ---------- Soft cursor spotlight on cards (pointer devices only) ---------- */
    if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
        document.addEventListener("pointermove", function (event) {
            var card = event.target.closest ? event.target.closest(".card") : null;
            if (!card) return;
            var rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", (event.clientX - rect.left) + "px");
            card.style.setProperty("--my", (event.clientY - rect.top) + "px");
        }, { passive: true });
    }
})();
