/* ============================================================================
   Ray's Ironworks — 2D Blueprint canvas mode (from Gemini's design)
   A front-elevation technical drawing drawn on <canvas>: frame, infill,
   center split for a double gate, dimension lines with ft/in labels, and a
   5'10" human silhouette for scale. Downloadable as a PNG.

   This is a CONCEPT drawing — not for fabrication. Final dimensions and
   quotes are confirmed directly with Ray.
   Runs entirely in the visitor's browser. No server, no API key.
   ========================================================================== */
(function(){
  "use strict";

  var $ = function(s){ return document.querySelector(s); };
  var canvas = null, ctx = null;
  var W = 900, H = 560;

  function ftIn(v){
    var ft = Math.floor(v), inch = Math.round((v - ft) * 12);
    if (inch === 12){ ft += 1; inch = 0; }
    return ft + "'-" + (inch < 10 ? "0" : "") + inch + '"';
  }
  function labelFor(state){
    var names = {
      "gate": "Gate", "railing": "Railing", "sculpture-base": "Sculpture Base",
      "sign-frame": "Sign Frame", "patio-cover": "Patio Cover Frame"
    };
    return names[state.piece] || "Custom Piece";
  }

  /* ---------- Drawing helpers ---------- */
  function arrow(x1, y1, x2, y2){
    // small filled arrowhead at (x2,y2) pointing along the line from (x1,y1)
    var ang = Math.atan2(y2 - y1, x2 - x1), s = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s * Math.cos(ang - 0.42), y2 - s * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - s * Math.cos(ang + 0.42), y2 - s * Math.sin(ang + 0.42));
    ctx.closePath(); ctx.fill();
  }
  function dimH(x1, x2, y, text){
    ctx.strokeStyle = "#E8A317"; ctx.fillStyle = "#E8A317"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    arrow(x1 + 14, y, x1, y); arrow(x2 - 14, y, x2, y);
    ctx.beginPath(); ctx.moveTo(x1, y - 5); ctx.lineTo(x1, y + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y - 5); ctx.lineTo(x2, y + 5); ctx.stroke();
    ctx.font = "600 15px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(text, (x1 + x2) / 2, y - 7);
  }
  function dimV(x, y1, y2, text){
    ctx.strokeStyle = "#E8A317"; ctx.fillStyle = "#E8A317"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    arrow(x, y1 + 14, x, y1); arrow(x, y2 - 14, x, y2);
    ctx.beginPath(); ctx.moveTo(x - 5, y1); ctx.lineTo(x + 5, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, y2); ctx.lineTo(x + 5, y2); ctx.stroke();
    ctx.save();
    ctx.translate(x + 8, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "600 15px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  function drawPerson(x, groundY, scale){
    // 5'10" human silhouette for scale
    var h = 5 + 10 / 12;
    var pxH = h * scale;
    var top = groundY - pxH;
    ctx.strokeStyle = "#F2EFE8"; ctx.fillStyle = "#F2EFE8"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, top + pxH * 0.07, pxH * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, top + pxH * 0.14); ctx.lineTo(x, top + pxH * 0.52); // torso
    ctx.moveTo(x, top + pxH * 0.24); ctx.lineTo(x - pxH * 0.16, top + pxH * 0.42); // left arm
    ctx.moveTo(x, top + pxH * 0.24); ctx.lineTo(x + pxH * 0.16, top + pxH * 0.42); // right arm
    ctx.moveTo(x, top + pxH * 0.52); ctx.lineTo(x - pxH * 0.12, groundY); // left leg
    ctx.moveTo(x, top + pxH * 0.52); ctx.lineTo(x + pxH * 0.12, groundY); // right leg
    ctx.stroke();
    ctx.font = "13px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillStyle = "#F2EFE8";
    ctx.fillText("5'-10\" person", x, groundY + 8);
    ctx.fillText("for scale", x, groundY + 24);
  }

  /* ---------- Elevation drawings (piece drawn inside area ax..bx, ground at gy) ---------- */
  function drawGate(s, ax, bx, gy, scale){
    var w = s.width * scale, h = s.height * scale;
    var x0 = (ax + bx - w) / 2, y0 = gy - h;
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
    // posts
    ctx.strokeRect(x0 - 12, y0, 12, h);
    ctx.strokeRect(x0 + w, y0, 12, h);
    // rails
    ctx.strokeRect(x0, y0, w, 12);
    ctx.strokeRect(x0, y0 + h - 12, w, 12);
    // infill
    var innerTop = y0 + 12, innerBot = y0 + h - 12, innerH = innerBot - innerTop;
    if (s.style === "vertical"){
      var n = Math.max(3, Math.round(s.width * 1.2));
      ctx.lineWidth = 1.5;
      for (var i = 0; i < n; i++){
        var x = x0 + ((i + 0.5) * w / n);
        ctx.beginPath(); ctx.moveTo(x, innerTop); ctx.lineTo(x, innerBot); ctx.stroke();
      }
    } else if (s.style === "horizontal"){
      var rows = Math.max(3, Math.round(s.height * 1.5));
      ctx.lineWidth = 1.5;
      for (var j = 0; j < rows; j++){
        var y = innerTop + ((j + 0.5) * innerH / rows);
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 6, innerTop + 6, w - 12, innerH - 12);
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
    }
    // center split for a double gate
    if (s.leaves === "double"){
      ctx.strokeStyle = "#E8A317"; ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(x0 + w / 2, y0); ctx.lineTo(x0 + w / 2, gy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
    }
    return { x0: x0, x1: x0 + w, y0: y0, y1: gy };
  }
  function drawRailing(s, ax, bx, gy, scale){
    var w = s.width * scale, h = s.height * scale;
    var x0 = (ax + bx - w) / 2, y0 = gy - h;
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
    ctx.strokeRect(x0, y0, w, 10);            // top rail
    ctx.strokeRect(x0, gy - 10, w, 10);       // bottom rail
    var nSeg = Math.max(1, Math.round(s.width / s.postSpacing));
    var step = w / nSeg;
    ctx.lineWidth = 2;
    for (var i = 0; i <= nSeg; i++){
      var x = x0 + i * step;
      ctx.strokeRect(x - 5, y0, 10, h);
    }
    var innerTop = y0 + 10, innerBot = gy - 10, innerH = innerBot - innerTop;
    if (s.style === "vertical"){
      var n = Math.max(2, Math.floor((s.width * 12) / s.picketSpacing));
      ctx.lineWidth = 1.2;
      for (var p = 0; p < n; p++){
        var px = x0 + ((p + 0.5) * w / n);
        ctx.beginPath(); ctx.moveTo(px, innerTop); ctx.lineTo(px, innerBot); ctx.stroke();
      }
    } else if (s.style === "horizontal"){
      var rows = Math.max(3, Math.round(s.height * 1.6));
      ctx.lineWidth = 1.2;
      for (var r = 0; r < rows; r++){
        var y = innerTop + ((r + 0.5) * innerH / rows);
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
      }
    } else if (s.style === "solid"){
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 5, innerTop + 5, w - 10, innerH - 10);
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
    } else {
      // scrollwork: repeated S-curves
      var nS = Math.max(1, Math.round(s.width / 2.2));
      ctx.lineWidth = 1.6;
      for (var q = 0; q < nS; q++){
        var cx = x0 + ((q + 0.5) * w / nS), cy = (innerTop + innerBot) / 2, rr = Math.min(innerH * 0.32, w / nS * 0.32);
        ctx.beginPath(); ctx.arc(cx - rr * 0.4, cy - rr * 0.35, rr * 0.55, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + rr * 0.4, cy + rr * 0.35, rr * 0.55, 0, Math.PI * 2); ctx.stroke();
      }
    }
    return { x0: x0, x1: x0 + w, y0: y0, y1: gy };
  }
  function drawSculptureBase(s, ax, bx, gy, scale){
    var w = s.width * scale, h = s.height * scale;
    var x0 = (ax + bx - w) / 2, y0 = gy - h;
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 10, gy - 12, w + 20, 12); // base slab
    if (s.style === "column"){
      ctx.beginPath(); ctx.ellipse((ax + bx) / 2, y0 + 12 + (h - 24) / 2, w * 0.42, (h - 24) / 2, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (s.style === "tapered"){
      ctx.beginPath();
      ctx.moveTo(x0 + w * 0.08, gy - 12); ctx.lineTo(x0 + w * 0.2, y0 + 12);
      ctx.lineTo(x0 + w * 0.8, y0 + 12); ctx.lineTo(x0 + w * 0.92, gy - 12);
      ctx.closePath(); ctx.stroke();
    } else {
      ctx.strokeRect(x0, y0 + 12, w, h - 24);
    }
    // cap + abstract form
    ctx.strokeRect(x0 - 6, y0, w + 12, 12);
    var cx = (ax + bx) / 2;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, y0 - h * 0.14, h * 0.16, 0, Math.PI * 1.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + h * 0.1, y0 - h * 0.3, h * 0.1, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, y0 - h * 0.42, h * 0.045, 0, Math.PI * 2); ctx.stroke();
    return { x0: x0, x1: x0 + w, y0: y0 - h * 0.4, y1: gy };
  }
  function drawSignFrame(s, ax, bx, gy, scale){
    var w = s.width * scale, h = s.height * scale;
    var x0 = (ax + bx - w) / 2, y0 = gy - h;
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 - 14, y0, 12, h);
    ctx.strokeRect(x0 + w + 2, y0, 12, h);
    var panelH = h * 0.62, panelY = y0 + h * 0.2;
    ctx.strokeRect(x0, panelY, w, panelH);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x0 + 10, panelY + 10, w - 20, panelH - 20);
    ctx.font = "600 16px Georgia, serif";
    ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("YOUR NAME HERE", x0 + w / 2, panelY + panelH / 2);
    if (s.style === "arch"){
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x0 + w / 2, panelY, w / 2, Math.PI, 0); ctx.stroke();
    }
    return { x0: x0, x1: x0 + w, y0: y0, y1: gy };
  }
  function drawPatioCover(s, ax, bx, gy, scale){
    // side elevation: span across, height up
    var w = s.width * scale, h = s.height * scale;
    var x0 = (ax + bx - w) / 2, y0 = gy - h;
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
    // roof line (slight slope)
    ctx.beginPath(); ctx.moveTo(x0 - 14, y0 + 18); ctx.lineTo(x0 + w + 14, y0 + 4); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 - 14, y0 + 30); ctx.lineTo(x0 + w + 14, y0 + 16); ctx.stroke();
    // posts
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x0 + 6, y0 + 30, 12, h - 30);
    ctx.strokeRect(x0 + w - 18, y0 + 16, 12, h - 16);
    if (s.width > 14){
      ctx.strokeRect(x0 + w / 2 - 6, y0 + 23, 12, h - 23);
    }
    // ground
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, gy); ctx.lineTo(bx, gy); ctx.stroke();
    return { x0: x0, x1: x0 + w, y0: y0, y1: gy };
  }

  /* ---------- Main draw ---------- */
  function drawBlueprint(state){
    if (!canvas || !ctx) return;
    state = state || defaultState();
    // background
    ctx.fillStyle = "#1b3a6b";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
    for (var gx = 40; gx < W; gx += 40){ ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy2 = 40; gy2 < H; gy2 += 40){ ctx.beginPath(); ctx.moveTo(0, gy2); ctx.lineTo(W, gy2); ctx.stroke(); }
    // title block
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 22px Oswald, 'Arial Narrow', sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("RAY'S IRONWORKS — CONCEPT DRAWING", 30, 38);
    ctx.font = "15px 'Source Sans 3', sans-serif";
    ctx.fillStyle = "#E8A317";
    ctx.fillText(labelFor(state) + "  ·  " + dimsLine(state), 30, 60);
    ctx.fillStyle = "#F2EFE8";
    ctx.textAlign = "right";
    ctx.fillText("NOT FOR FABRICATION", W - 30, 38);
    ctx.font = "13px 'Source Sans 3', sans-serif";
    ctx.fillStyle = "#a8c4e0";
    ctx.fillText("Concept only — final dimensions confirmed with Ray", W - 30, 60);
    ctx.textAlign = "left";
    // drawing area
    var ax = 70, bx = 760, gy = 470, top = 92;
    var fw = state.width, fh = state.height;
    if (state.piece === "patio-cover") fw = state.width;
    var scale = Math.min((bx - ax) / Math.max(fw, 1), (gy - top) / Math.max(fh * 1.25, 1));
    scale = Math.max(scale, 6);
    // ground line
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax - 20, gy); ctx.lineTo(bx + 20, gy); ctx.stroke();
    var box2;
    if (state.piece === "gate") box2 = drawGate(state, ax, bx, gy, scale);
    else if (state.piece === "railing") box2 = drawRailing(state, ax, bx, gy, scale);
    else if (state.piece === "sculpture-base") box2 = drawSculptureBase(state, ax, bx, gy, scale);
    else if (state.piece === "sign-frame") box2 = drawSignFrame(state, ax, bx, gy, scale);
    else if (state.piece === "patio-cover") box2 = drawPatioCover(state, ax, bx, gy, scale);
    else box2 = drawGate(state, ax, bx, gy, scale);
    // dimensions
    dimH(box2.x0, box2.x1, Math.max(78, box2.y0 - 26), ftIn(state.width) + (state.piece === "railing" ? " long" : " wide"));
    dimV(Math.min(830, box2.x1 + 34), box2.y0, box2.y1, ftIn(state.height) + " high");
    // person for scale
    var personX = Math.min(815, box2.x1 + 78);
    if (personX < box2.x1 + 40) personX = Math.max(60, box2.x0 - 60);
    drawPerson(personX, gy, scale);
    // footer
    ctx.fillStyle = "#a8c4e0";
    ctx.font = "13px 'Source Sans 3', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Ray's Ironworks · 424-394-9271 · raysironworks101@gmail.com", 30, H - 18);
    ctx.textAlign = "right";
    ctx.fillText("Drawn " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), W - 30, H - 18);
  }
  function dimsLine(s){
    if (s.piece === "railing") return ftIn(s.width) + " long × " + ftIn(s.height) + " high";
    if (s.piece === "patio-cover") return ftIn(s.width) + " span × " + ftIn(s.depth) + " deep × " + ftIn(s.height) + " high";
    if (s.piece === "sculpture-base") return ftIn(s.width) + " × " + ftIn(s.depth) + " × " + ftIn(s.height) + " high";
    return ftIn(s.width) + " wide × " + ftIn(s.height) + " high";
  }
  function defaultState(){
    return { piece: "gate", width: 10, height: 6, depth: 8, style: "vertical",
      leaves: "single", finial: "none" };
  }
  function currentState(){
    if (window.IronworksConfig && window.IronworksConfig.getState) return window.IronworksConfig.getState();
    return defaultState();
  }

  /* ---------- Mode toggle + download ---------- */
  function setMode(mode){
    var c3 = $("#gate3d"), bp = $("#blueprintCanvas");
    var b3 = $("#mode3DBtn"), b2 = $("#mode2DBtn");
    if (mode === "2d"){
      if (c3) c3.style.display = "none";
      if (bp){ bp.style.display = "block"; drawBlueprint(currentState()); }
      if (b3) b3.setAttribute("aria-selected", "false");
      if (b2) b2.setAttribute("aria-selected", "true");
      if (b3) b3.classList.remove("active");
      if (b2) b2.classList.add("active");
    } else {
      if (bp) bp.style.display = "none";
      if (c3) c3.style.display = "block";
      if (b3) b3.setAttribute("aria-selected", "true");
      if (b2) b2.setAttribute("aria-selected", "false");
      if (b3) b3.classList.add("active");
      if (b2) b2.classList.remove("active");
    }
  }
  function downloadBlueprint(){
    if (!canvas) return;
    drawBlueprint(currentState());
    try {
      canvas.toBlob(function(blob){
        if (!blob) return;
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "rays-ironworks-blueprint.png";
        document.body.appendChild(a); a.click();
        setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      }, "image/png");
    } catch (e){}
  }

  /* ---------------- Init ---------------- */
  function init(){
    canvas = $("#blueprintCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    var b3 = $("#mode3DBtn"), b2 = $("#mode2DBtn"), dl = $("#downloadBlueprintBtn");
    if (b3) b3.addEventListener("click", function(){ setMode("3d"); });
    if (b2) b2.addEventListener("click", function(){ setMode("2d"); });
    if (dl) dl.addEventListener("click", downloadBlueprint);
    document.addEventListener("ironworks-config", function(ev){
      if (canvas && canvas.style.display !== "none") drawBlueprint(ev.detail);
    });
    drawBlueprint(currentState());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
