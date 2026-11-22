/* ============================================================================
   Ray's Ironworks — Forge Guide (context-aware in-app helper)
   Replaces the original helper widget. Rule-based only, from Ray's verified
   published facts — if it doesn't know, it says so and points to Ray.

   New in v2 (from Gemini's design):
   - Context-aware: an IntersectionObserver watches which section the visitor
     is reading (hero, about, services, work, gallery, quote, digital,
     contact) and changes the greeting + quick-reply chips per section.
   - Guided quote checklist: 1 choose a type, 2 set dimensions, 3 upload
     photos, 4 add notes, 5 send the email — with live status read from the
     quote form itself.
   - Guided quote-draft flow: asks type -> size -> location -> timeline ->
     description, then fills the quote form for the visitor to review.
   - This is a guided assistant, not a live AI. A live AI guide would need a
     connected AI service (API key + backend), which is not set up on this
     site. No API key is in this code, and no backend is invented.
   ========================================================================== */
(function(){
  "use strict";

  var $  = function(s){ return document.querySelector(s); };
  var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function esc(s){
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function linkify(t){
    return t.replace(/raysironworks101@gmail\.com/g,
        '<a href="mailto:raysironworks101@gmail.com">raysironworks101@gmail.com</a>')
      .replace(/424-394-9271/g, '<a href="tel:+14243949271">424-394-9271</a>');
  }

  /* ---------------- Knowledge base (Ray's verified facts only) ---------------- */
  var KB = [
    { k: ["price","cost","how much","charge","quote"], a: "Every commission is priced to the job — there are no set prices. The fastest route is the quote form in the Quote & 3D section: pick a project type, set your dimensions in the 3D studio, add photos, and Ray replies with a quote and a timeline. Or email him directly at raysironworks101@gmail.com." },
    { k: ["how long","timeline","how soon","turnaround","when"], a: "Timelines depend on the job. For scale: the Monument of Legacy took six weeks in the shop, and the Wingfield Park gates went from the shop to installed in spring 2021. Ray gives a timeline with every quote." },
    { k: ["where","area","serve","location","reno","truckee","tahoe","los angeles","topanga","seattle","venice","beverly"], a: "Ray works across Reno, Tahoe, and Truckee, and the Los Angeles area — Venice Beach, Beverly Hills, Topanga Canyon — with installed work reaching Seattle, Washington." },
    { k: ["process","how it works","how do you","steps","make","commission"], a: "Ray designs, fabricates, and installs each piece himself — from the first sketch and CAD, through the shop, to on-site installation. What he proposes is what gets built: no handoffs, no surprises." },
    { k: ["gate","gates"], a: "Custom gates are one of Ray's specialties — from garden gates to public entries. His best-known gate work is the Wingfield Park Amphitheater Gates in Reno: four gates, about 9 ft tall × 4 ft wide, a City of Reno Youth Council commission (about $15,000) installed in spring 2021. Try the gate in the 3D studio, or the Gate tab in the Quote & 3D section." },
    { k: ["railing"], a: "Ray builds architectural railings, interior and exterior — staircases, balconies, and hillside runs. See the Beverly Hills black steel railings in the gallery. The 3D studio lets you configure a railing — length, height, style, top rail, posts, finials, and finish — and send it straight into a quote." },
    { k: ["sculpture","statue","art"], a: "Ray's sculpture includes cast-aluminum work like Ghosts of Malibu, Wing, and Reach — cast from aluminum salvaged after the Malibu fires — and Found Faith, a life-size aluminum figure from 2018. His large-scale installation, The Conflux of Intent, is an 18-foot steel piece from the Black Rock Desert in 2026." },
    { k: ["wingfield"], a: "The Wingfield Park Amphitheater Gates: a City of Reno Youth Council commission (about $15,000). Ray was the lead fabricating artist. Four gates, each about 9 ft tall × 4 ft wide, installed in spring 2021." },
    { k: ["conflux"], a: "The Conflux of Intent is an 18-foot interactive modular steel installation assembled on the Black Rock Desert in 2026 — a sphere of bent steel rod and woven wire mesh above a 30-foot circular steel stage. By day a shaded gathering place; by night, lit from within." },
    { k: ["found faith","faith"], a: "Found Faith is a life-size aluminum mannequin — about 69 inches tall — holding a cross, built from upcycled materials for Project Sanctuary, a 2018 fashion show at the First Continental Church in Los Angeles." },
    { k: ["malibu","ghosts"], a: "Ghosts of Malibu, Wing, and Reach are cast from upcycled aluminum salvaged after the Malibu fires — from homes, cars, and possessions people lost. Each piece is about 12 × 12 × 12 inches." },
    { k: ["michael","archangel","santa clarita"], a: "Michael the Archangel is a Santa Clarita Trailhead sculpture: mirrored twin wings on a forged root-and-flame steel base, hammered aluminum feather panels, solar uplights. 9'-6\" × 11'-0\", about 1,350 lb." },
    { k: ["3d","configurator","studio","render","video","turntable","blueprint"], a: "The 3D studio in the Quote & 3D section lets you configure a gate, railing, sculpture base, sign frame, or patio cover frame — size, style, posts, finials, decorative scrolls, and finish — and see it rendered like a photograph, with a turntable you can spin. You can save a still image (PNG) or record a turntable video, and switch to a 2D blueprint view with a downloadable PNG. It is a visualization to help you describe your idea — the finished piece is built by Ray to your exact measurements." },
    { k: ["finish","finishes","material","materials","powder","bronze","copper","galvanized","aluminum","wrought","steel"], a: "Ray works in wrought iron, steel, and aluminum. Finishes include matte black, bronze, copper, galvanized, and powder-coat colors. The 3D studio shows each finish on your configured piece — pick one there and it flows into your quote." },
    { k: ["finial","scroll","decorat"], a: "You can add decorative ironwork to your piece in the 3D studio: finials (ball, spear, or scroll) on the posts, plus scrolls, rings, a leaf branch, or a medallion. They show on the model and are listed in your quote." },
    { k: ["photo","photos","upload","picture","image"], a: "You can upload up to 8 photos of your idea in the quote form — your site, sketches, or style inspiration. They stay on your device and are never uploaded anywhere; when you send the request, your email app opens and you attach the photos to that email before sending. You can also attach the blueprint PNG or a turntable still from the 3D studio." },
    { k: ["digital","art shop","shop","buy","print","download"], a: "Ray also makes digital art — surreal, symbolic pieces about faith, transformation, and resilience. Original digital pieces are in the Art Shop as instant downloads. There's a link in the Digital Art section of this page." },
    { k: ["contact","phone","email","call","reach"], a: "You can reach Ray at 424-394-9271 or raysironworks101@gmail.com. His Facebook page is Ray's Ironworks, his LinkedIn is Ray Mroczkowski, and the full artist portfolio (PDF) is linked in the Contact section." },
    { k: ["linkedin"], a: "Ray's LinkedIn is Ray Mroczkowski — Custom Metal Artist & Fabricator | Owner, Ray's Ironworks. It's linked in the About and Contact sections of this page." },
    { k: ["service","what do you do","offer"], a: "Ray builds custom gates, railings, sculpture and public art, monument signs, architectural ironwork, and structural steel. Everything is designed, fabricated, and installed by Ray's Ironworks. The Services section lists them all." },
    { k: ["experience","how long","years","background"], a: "Ray has more than thirty years at the forge. He has owned and operated Ray's Ironworks since 2015, and welded at Ski's Welding from 1994 to 2018. He holds a Welding Certification and a Renewable Energy A.A.S. from Truckee Meadows Community College." }
  ];

  /* ---------------- Section context (IntersectionObserver) ---------------- */
  var SECTIONS = {
    "hero": {
      label: "Overview",
      greeting: "Welcome to Ray's Ironworks — forged by hand, built to last. Are you here for a gate, a railing, a sculpture, or something else? I can walk you through the work or help you start a quote.",
      chips: ["What does Ray build?", "See the signature projects", "Help me request a quote"]
    },
    "about": {
      label: "About Ray",
      greeting: "This is Ray's story — more than thirty years at the forge, from the welding shop as a boy to owning Ray's Ironworks. Ask me about his background, or how a commission works.",
      chips: ["How long has Ray been forging?", "How does a commission work?", "What areas does he serve?"]
    },
    "services": {
      label: "Services",
      greeting: "These are the six things Ray builds — gates, railings, sculpture, monument signs, architectural ironwork, and structural steel. Not sure which fits your project? Tell me what you're dreaming up.",
      chips: ["Which service fits my project?", "Custom gates", "Railings", "Sculpture"]
    },
    "work": {
      label: "Signature Projects",
      greeting: "These are Ray's signature pieces — the Wingfield Park Gates, the Conflux of Intent, Found Faith, and the Malibu castings. Ask me about any of them.",
      chips: ["Tell me about the Wingfield Gates", "What is the Conflux?", "Found Faith", "Ghosts of Malibu"]
    },
    "gallery": {
      label: "Gallery",
      greeting: "See a piece you like here? I can tell you about it — or help you start a quote for something similar, in the 3D studio.",
      chips: ["Tell me about a piece in the gallery", "Help me request a quote", "What finishes are available?"]
    },
    "quote": {
      label: "Quote & 3D Studio",
      greeting: "You're in the Quote & 3D studio — configure your piece in 3D, see it rendered, save a still or a turntable video, check the blueprint, upload photos, and send Ray a quote request. Want the 5-step checklist?",
      chips: ["Walk me through the quote checklist", "How do I upload photos?", "What is the 3D viewer?", "What finishes can I choose?"]
    },
    "digital": {
      label: "Digital Art",
      greeting: "Alongside the ironwork, Ray makes digital art — surreal, symbolic pieces about faith, transformation, and resilience. The Art Shop has original pieces as instant downloads.",
      chips: ["Tell me about the digital art", "How do I contact Ray?"]
    },
    "contact": {
      label: "Contact",
      greeting: "Ready to talk to Ray? You can call or email him directly — or I can help you draft a quote first, so he has everything he needs to price it.",
      chips: ["How do I contact Ray?", "Help me request a quote", "What areas do you serve?"]
    }
  };
  var currentSection = "hero";
  var quoteFlow = null; // {step, data}

  var panel = null, fab = null, log = null, chipsBox = null, contextEl = null;

  function addMsg(html, who){
    var d = document.createElement("div");
    d.className = "msg " + who;
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  function renderChips(list){
    if (!chipsBox) return;
    chipsBox.innerHTML = "";
    (list || SECTIONS[currentSection].chips).forEach(function(q){
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = q;
      b.addEventListener("click", function(){ ask(q); });
      chipsBox.appendChild(b);
    });
  }
  function setContextLabel(){
    if (contextEl) contextEl.textContent = "Viewing: " + SECTIONS[currentSection].label;
  }
  function observeSections(){
    if (!("IntersectionObserver" in window)) return;
    var map = [
      [".hero", "hero"], ["#about", "about"], ["#services", "services"],
      ["#work", "work"], ["#gallery", "gallery"], ["#quote", "quote"],
      ["#digital", "digital"], ["#contact", "contact"]
    ];
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        var name = en.target.getAttribute("data-forge-section");
        if (name && name !== currentSection){
          currentSection = name;
          setContextLabel();
          if (panel && panel.classList.contains("open") && !quoteFlow){
            renderChips();
          }
        }
      });
    }, { rootMargin: "-40% 0px -40% 0px" });
    map.forEach(function(pair){
      var el = document.querySelector(pair[0]);
      if (el){ el.setAttribute("data-forge-section", pair[1]); obs.observe(el); }
    });
  }

  /* ---------------- Guided quote checklist ---------------- */
  function checklistStatus(){
    function val(id){ var el = $(id); return el ? el.value.trim() : ""; }
    function photoCount(){
      var t = $("#q-thumbs");
      return t ? t.querySelectorAll("figure").length : 0;
    }
    return [
      { n: 1, label: "Choose a project type", done: !!val("#q-type"), hint: "Pick one in the quote form — or set it from the 3D studio." },
      { n: 2, label: "Set your dimensions", done: !!val("#q-size"), hint: "Use the 3D studio sliders, then “Use this in my quote” — it fills this in for you." },
      { n: 3, label: "Upload photos of your idea (optional)", done: photoCount() > 0, optional: true, hint: "Up to 8 photos in the quote form. They stay on your device until you attach them to the email." },
      { n: 4, label: "Add your notes", done: !!val("#q-desc"), hint: "A sentence or two about what it should look like and where it will live." },
      { n: 5, label: "Send the email to Ray", done: false, hint: "Use “Prepare Email to Ray” in the quote form — your email app opens with everything filled in, and you attach your photos before sending." }
    ];
  }
  function checklistHtml(){
    var steps = checklistStatus();
    var doneCount = steps.filter(function(s){ return s.done; }).length;
    var html = "<b>Your quote checklist</b> — " + doneCount + " of 5 steps done.<br><br>";
    steps.forEach(function(s){
      var mark = s.done ? "✓" : "○";
      var opt = s.optional ? " <i>(optional)</i>" : "";
      html += mark + " <b>Step " + s.n + " — " + esc(s.label) + "</b>" + opt + "<br>";
      if (!s.done) html += "<span style=\"opacity:.85\">" + esc(s.hint) + "</span><br>";
      html += "<br>";
    });
    html += "Want me to walk you through it, one question at a time? Say “start the quote flow” — or tap below.";
    return html;
  }

  /* ---------------- Answering ---------------- */
  function answer(q){
    var s = q.toLowerCase();
    // checklist
    if (/checklist/.test(s)) return checklistHtml();
    if (/start the quote flow|walk me through|help me (request|get|draft).*quote|start a quote/.test(s) || s.indexOf("help me request a quote") > -1){
      quoteFlow = { step: 0, data: {} };
      renderChips(["Gate", "Railing", "Sculpture", "Monument sign", "Patio cover", "Something else"]);
      return "Happy to help you draft a quote request. First — what kind of project is it? Tap one below, or type your own.";
    }
    if (quoteFlow){
      var f = quoteFlow;
      if (f.step === 0){
        f.data.type = q; f.step = 1;
        renderChips();
        return "Got it — a " + esc(q) + ". About how big? (For example: 10 ft wide × 6 ft high — or just say “not sure yet”. Tip: the 3D studio can measure it for you.)";
      }
      if (f.step === 1){ f.data.size = q; f.step = 2; return "And where will it go? (City or neighborhood — for example: Truckee, CA.)"; }
      if (f.step === 2){ f.data.location = q; f.step = 3; return "When would you like it? (For example: flexible, within a month, or 1–3 months.)"; }
      if (f.step === 3){ f.data.timeline = q; f.step = 4; return "Last one — in a sentence or two, what should it look like or do? (Style, finish, or a feeling — anything helps.)"; }
      if (f.step === 4){
        f.data.desc = q; quoteFlow = null;
        var sel = $("#q-type");
        var known = ["Custom Gate","Railing","Sculpture","Monument Sign","Patio Cover"];
        var match = null;
        known.forEach(function(k){ if (f.data.type.toLowerCase().indexOf(k.toLowerCase().split(" ")[0]) > -1) match = k; });
        if (match && sel) sel.value = match;
        var sz = $("#q-size"); if (sz) sz.value = f.data.size || "";
        var lc = $("#q-location"); if (lc) lc.value = f.data.location || "";
        var tl = $("#q-timeline");
        if (tl){
          var t = (f.data.timeline || "").toLowerCase();
          if (t.indexOf("month") > -1 && t.indexOf("1") > -1) tl.value = "Within 1 month";
          else if (t.indexOf("1") > -1 && t.indexOf("3") > -1) tl.value = "1–3 months";
          else if (t.indexOf("3") > -1) tl.value = "3+ months";
        }
        var ds = $("#q-desc"); if (ds) ds.value = f.data.desc || "";
        renderChips();
        setTimeout(function(){
          var form = $("#quote-form");
          if (form) form.scrollIntoView({ behavior: "smooth" });
        }, 600);
        return "Here&rsquo;s your draft — I&rsquo;ve filled it into the quote form below so you can review it, add your name and email, and attach photos:<br><br><b>Type:</b> " + esc(f.data.type) + "<br><b>Size:</b> " + esc(f.data.size) + "<br><b>Location:</b> " + esc(f.data.location) + "<br><b>Timeline:</b> " + esc(f.data.timeline) + "<br><b>Idea:</b> " + esc(f.data.desc) + "<br><br>Scroll down to the quote form to finish and send it to Ray. Or ask me for the checklist to see what&rsquo;s left.";
      }
    }
    for (var i = 0; i < KB.length; i++){
      var hit = KB[i].k.some(function(kw){ return s.indexOf(kw) > -1; });
      if (hit) return KB[i].a;
    }
    return "I can help with Ray&rsquo;s work, services, process, the 3D studio, and preparing a quote request — but I don&rsquo;t have an answer for that one. The fastest route is Ray himself: raysironworks101@gmail.com or 424-394-9271. Or try one of the suggestions below.";
  }
  function ask(q){
    addMsg(esc(q), "user");
    setTimeout(function(){ addMsg(linkify(answer(q)), "bot"); }, 350);
  }
  function openHelper(prefill){
    panel.classList.add("open");
    if (!log.children.length){
      addMsg(SECTIONS[currentSection].greeting, "bot");
      renderChips();
    }
    if (prefill) setTimeout(function(){ ask(prefill); }, 300);
    var inp = $("#helper-input"); if (inp) inp.focus();
  }

  /* ---------------- Wiring + init ---------------- */
  function init(){
    panel = $("#helper-panel"); fab = $("#helper-fab");
    log = $("#helper-log"); chipsBox = $("#helper-chips");
    if (!panel || !fab || !log) return;
    // context label under the helper title
    var head = panel.querySelector("header div");
    if (head){
      contextEl = document.createElement("span");
      contextEl.id = "helper-context";
      contextEl.style.cssText = "display:block;font-size:.82rem;color:var(--muted);font-family:'Source Sans 3',sans-serif;text-transform:none;letter-spacing:0";
      head.appendChild(contextEl);
      setContextLabel();
    }
    observeSections();
    fab.addEventListener("click", function(){
      panel.classList.contains("open") ? panel.classList.remove("open") : openHelper();
    });
    var close = $("#helper-close");
    if (close) close.addEventListener("click", function(){ panel.classList.remove("open"); });
    $$("[data-helper-open]").forEach(function(b){
      b.addEventListener("click", function(){ openHelper(b.dataset.helperQ || null); });
    });
    var form = $("#helper-form");
    if (form) form.addEventListener("submit", function(e){
      e.preventDefault();
      var inp = $("#helper-input");
      var v = inp.value.trim();
      if (!v) return;
      inp.value = "";
      ask(v);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
