/* ============================================================================
   Ray's Ironworks — Configurator v2
   Realistic rendering + full ironworks options (gate, railing, sculpture base,
   sign frame, patio cover frame). Replaces the original 3D gate viewer.

   - Works with Three.js r128 (global build) + OrbitControls from the page.
   - Runs entirely in the visitor's browser. No API keys, no backend.
   - A visualization only: the real piece is built by Ray to exact measurements.
   - Exports: high-resolution still (PNG) and a turntable video (WebM/MP4
     where the browser supports MediaRecorder; otherwise a plain fallback
     message points the visitor to the still image).
   - Every choice flows into the quote form via "Use this in my quote".
   ========================================================================== */
(function(){
  "use strict";

  var $  = function(s){ return document.querySelector(s); };
  var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function fmtFt(v){ // 10 -> 10 ft ; 10.5 -> 10 ft 6 in
    var ft = Math.floor(v), inch = Math.round((v - ft) * 12);
    if (inch === 12){ ft += 1; inch = 0; }
    return inch ? (ft + " ft " + inch + " in") : (ft + " ft");
  }

  /* ---------------- Configuration state ---------------- */
  var PIECES = {
    "gate": {
      label: "Gate",
      widthLabel: "Width", widthMin: 4, widthMax: 16, widthStep: 0.5, widthDef: 10,
      heightLabel: "Height", heightMin: 4, heightMax: 8, heightStep: 0.5, heightDef: 6,
      depth: false,
      styles: [["vertical","Vertical slats"],["horizontal","Horizontal bars"],["solid","Solid panel"]],
      topRail: false, post: true, postSpacing: false, picketSpacing: false, leaves: true,
      qType: "Custom Gate"
    },
    "railing": {
      label: "Railing",
      widthLabel: "Run length", widthMin: 4, widthMax: 40, widthStep: 1, widthDef: 12,
      heightLabel: "Height", heightMin: 2.5, heightMax: 4.5, heightStep: 0.25, heightDef: 3.5,
      depth: false,
      styles: [["vertical","Vertical pickets"],["horizontal","Horizontal bars"],["solid","Solid panel"],["scroll","Scrollwork"]],
      topRail: true, post: true, postSpacing: true, picketSpacing: true, leaves: false,
      qType: "Railing"
    },
    "sculpture-base": {
      label: "Sculpture Base",
      widthLabel: "Base width", widthMin: 1, widthMax: 6, widthStep: 0.25, widthDef: 2,
      heightLabel: "Base height", heightMin: 1, heightMax: 6, heightStep: 0.25, heightDef: 3,
      depth: true, depthLabel: "Base depth", depthMin: 1, depthMax: 6, depthStep: 0.25, depthDef: 2,
      styles: [["plinth","Square plinth"],["tapered","Tapered plinth"],["column","Round column"]],
      topRail: false, post: false, postSpacing: false, picketSpacing: false, leaves: false,
      qType: "Sculpture"
    },
    "sign-frame": {
      label: "Sign Frame",
      widthLabel: "Panel width", widthMin: 2, widthMax: 12, widthStep: 0.5, widthDef: 6,
      heightLabel: "Height", heightMin: 3, heightMax: 10, heightStep: 0.5, heightDef: 5,
      depth: false,
      styles: [["rect","Rectangular"],["arch","Arched top"]],
      topRail: false, post: true, postSpacing: false, picketSpacing: false, leaves: false,
      qType: "Monument Sign"
    },
    "patio-cover": {
      label: "Patio Cover Frame",
      widthLabel: "Span", widthMin: 8, widthMax: 24, widthStep: 1, widthDef: 12,
      heightLabel: "Height", heightMin: 7, heightMax: 12, heightStep: 0.5, heightDef: 9,
      depth: true, depthLabel: "Depth", depthMin: 6, depthMax: 20, depthStep: 1, depthDef: 10,
      styles: [["slats","Open slats"],["solid","Solid roof"]],
      topRail: false, post: true, postSpacing: false, picketSpacing: false, leaves: false,
      qType: "Patio Cover"
    }
  };
  var MATERIALS = {
    "wrought":   { name: "wrought iron", color: 0x2b2b2e, roughness: 0.55, metalness: 0.80, texture: "hammered" },
    "steel":     { name: "steel",        color: 0x8a8f98, roughness: 0.35, metalness: 0.90, texture: "brushed"  },
    "aluminum":  { name: "aluminum",     color: 0xc8ccd2, roughness: 0.28, metalness: 0.95, texture: "brushed"  }
  };
  var FINISHES = {
    "matte-black": { name: "matte black",        color: 0x141416, roughness: 0.75, metalness: 0.55 },
    "bronze":      { name: "bronze",             color: 0x8c6a3f, roughness: 0.35, metalness: 0.95 },
    "copper":      { name: "copper",             color: 0xb87333, roughness: 0.28, metalness: 1.00 },
    "galvanized":  { name: "galvanized",         color: 0x9aa0a3, roughness: 0.55, metalness: 0.85, texture: "spangle" },
    "powder-coat": { name: "powder-coat",        color: null,     roughness: 0.50, metalness: 0.25 }
  };
  var POWDERS = {
    "charcoal":    { name: "charcoal",    color: 0x2b2b2e },
    "forest":      { name: "forest green",color: 0x2e4a32 },
    "bronze-brown":{ name: "bronze brown",color: 0x6b4a2f },
    "white":       { name: "white",       color: 0xe8e6e0 }
  };

  var state = {
    piece: "gate",
    width: 10, height: 6, depth: 8,
    style: "vertical",
    leaves: "single",
    topRail: "flat",
    postStyle: "square",
    postSpacing: 6, picketSpacing: 4,
    finial: "none",
    decor: { scrolls: false, rings: false, leaves: false, medallion: false },
    material: "wrought",
    finish: "matte-black",
    powder: "charcoal",
    turntable: true,
    simple: false
  };

  var changeListeners = [];
  function emitChange(){
    var s = getState();
    changeListeners.forEach(function(fn){ try { fn(s); } catch(e){} });
    try { document.dispatchEvent(new CustomEvent("ironworks-config", { detail: s })); } catch(e){}
    updateReadout();
  }
  function getState(){
    return JSON.parse(JSON.stringify(state));
  }

  /* ---------------- Procedural textures (canvas) ---------------- */
  function canvasTex(size, draw, srgb){
    var c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function brushedTexture(){
    return canvasTex(256, function(g, s){
      g.fillStyle = "#8a8a8a"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 900; i++){
        var y = Math.random() * s, x = Math.random() * s, len = 20 + Math.random() * 90;
        g.strokeStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (Math.random() - 0.5) * 2); g.stroke();
      }
    });
  }
  function hammeredTexture(){
    return canvasTex(256, function(g, s){
      g.fillStyle = "#808080"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 130; i++){
        var x = Math.random() * s, y = Math.random() * s, r = 4 + Math.random() * 12;
        var grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, "rgba(0,0,0,0.28)");
        grad.addColorStop(0.7, "rgba(255,255,255,0.10)");
        grad.addColorStop(1, "rgba(128,128,128,0)");
        g.fillStyle = grad;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    });
  }
  function spangleTexture(){
    return canvasTex(256, function(g, s){
      g.fillStyle = "#8c8c8c"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 90; i++){
        var x = Math.random() * s, y = Math.random() * s, r = 5 + Math.random() * 14;
        var shade = 100 + Math.floor(Math.random() * 90);
        g.fillStyle = "rgba(" + shade + "," + shade + "," + shade + ",0.55)";
        g.beginPath();
        g.moveTo(x, y - r);
        g.lineTo(x + r * 0.9, y + r * 0.4);
        g.lineTo(x - r * 0.9, y + r * 0.4);
        g.closePath(); g.fill();
      }
    });
  }
  function paverTexture(){
    return canvasTex(512, function(g, s){
      g.fillStyle = "#8f8a80"; g.fillRect(0, 0, s, s);
      var n = 4, cell = s / n;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++){
        var v = 138 + Math.floor(Math.random() * 22);
        g.fillStyle = "rgb(" + v + "," + (v - 4) + "," + (v - 12) + ")";
        g.fillRect(i * cell + 3, j * cell + 3, cell - 6, cell - 6);
        g.fillStyle = "rgba(0,0,0,0.08)";
        g.fillRect(i * cell + 3, j * cell + cell - 12, cell - 6, 6);
      }
      for (var k = 0; k < 500; k++){
        g.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
        g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
    }, true);
  }
  function grassTexture(){
    return canvasTex(256, function(g, s){
      g.fillStyle = "#40592c"; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 2600; i++){
        var v = Math.random();
        g.fillStyle = v > 0.6 ? "rgba(120,150,70,0.35)" : (v > 0.3 ? "rgba(30,50,20,0.35)" : "rgba(70,100,45,0.3)");
        g.fillRect(Math.random() * s, Math.random() * s, 2, 2 + Math.random() * 3);
      }
    }, true);
  }
  function skyTexture(){
    var c = document.createElement("canvas");
    c.width = 1024; c.height = 512;
    var g = c.getContext("2d");
    var grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, "#6f9cc0");
    grad.addColorStop(0.45, "#a9bfce");
    grad.addColorStop(0.72, "#d9cfae");
    grad.addColorStop(1.0, "#e8d9b8");
    g.fillStyle = grad; g.fillRect(0, 0, 1024, 512);
    // soft sun glow, upper right
    var sun = g.createRadialGradient(760, 110, 0, 760, 110, 190);
    sun.addColorStop(0, "rgba(255,240,200,0.85)");
    sun.addColorStop(1, "rgba(255,240,200,0)");
    g.fillStyle = sun; g.fillRect(0, 0, 1024, 512);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function signFaceTexture(){
    var c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    var g = c.getContext("2d");
    g.fillStyle = "#20242a"; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = "#C9883D"; g.lineWidth = 5;
    g.strokeRect(14, 14, 484, 228);
    g.fillStyle = "#F2EFE8";
    g.font = "600 44px Georgia, 'Times New Roman', serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("YOUR NAME HERE", 256, 128);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* ---------------- Materials ---------------- */
  var envMap = null;
  var texBrushed = null, texHammered = null, texSpangle = null, texSign = null;
  function finishMaterials(){
    var m = MATERIALS[state.material];
    var f = FINISHES[state.finish];
    var color = (state.finish === "powder-coat") ? POWDERS[state.powder].color : f.color;
    if (color === null) color = m.color;
    var texKind = f.texture || m.texture;
    var rough = texKind === "brushed" ? brushedTexture() : (texKind === "hammered" ? hammeredTexture() : spangleTexture());
    var bump = texKind === "brushed" ? texBrushed : (texKind === "hammered" ? texHammered : texSpangle);
    var main = new THREE.MeshStandardMaterial({
      color: color, metalness: f.metalness, roughness: f.roughness,
      roughnessMap: rough, bumpMap: bump, bumpScale: 0.004,
      envMap: envMap, envMapIntensity: 1.0
    });
    var darkColor = new THREE.Color(color).multiplyScalar(0.62);
    var dark = new THREE.MeshStandardMaterial({
      color: darkColor, metalness: f.metalness, roughness: Math.min(0.85, f.roughness + 0.08),
      roughnessMap: rough, bumpMap: bump, bumpScale: 0.004,
      envMap: envMap, envMapIntensity: 0.85
    });
    return { main: main, dark: dark };
  }

  /* ---------------- Three.js scene ---------------- */
  var renderer = null, scene = null, camera = null, controls = null;
  var modelGroup = null, keyLight = null, groundDisc = null, grassPlane = null, gardenWall = null;
  var canvas = null, fallbackEl = null, recording = false, inited = false;

  function makeEnvMap(){
    try {
      var pmrem = new THREE.PMREMGenerator(renderer);
      var env = new THREE.Scene();
      function panel(w, h, color, x, y, z, ry){
        var m = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide })
        );
        m.position.set(x, y, z); m.rotation.y = ry || 0; env.add(m);
      }
      panel(30, 30, 0xffffff, 0, 14, 0, 0);            // bright sky above
      panel(20, 14, 0xffd9a0, 14, 6, 0, -Math.PI / 2); // warm sun side
      panel(20, 14, 0x9db8d6, -14, 6, 0, Math.PI / 2); // cool sky side
      panel(30, 30, 0x2a2018, 0, -10, 0, 0);           // dark ground bounce
      var rt = pmrem.fromScene(env, 0.06);
      envMap = rt.texture;
      pmrem.dispose();
    } catch (e){ envMap = null; }
  }

  function buildSetting(){
    // Sky dome
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(90, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false })
    );
    scene.add(sky);
    scene.fog = new THREE.Fog(0xd8cfb4, 34, 85);
    // Grass
    grassPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1, metalness: 0 })
    );
    grassPlane.material.map.repeat.set(10, 10);
    grassPlane.rotation.x = -Math.PI / 2;
    grassPlane.position.y = -0.02;
    grassPlane.receiveShadow = true;
    scene.add(grassPlane);
    // Paver patio / driveway disc
    groundDisc = new THREE.Mesh(
      new THREE.CircleGeometry(17, 48),
      new THREE.MeshStandardMaterial({ map: paverTexture(), roughness: 0.95, metalness: 0 })
    );
    groundDisc.material.map.repeat.set(4, 4);
    groundDisc.rotation.x = -Math.PI / 2;
    groundDisc.receiveShadow = true;
    scene.add(groundDisc);
    // Low garden wall behind the piece
    gardenWall = new THREE.Mesh(
      new THREE.BoxGeometry(46, 4.2, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xb3a184, roughness: 0.92, metalness: 0 })
    );
    gardenWall.position.set(0, 2.1, -15);
    gardenWall.castShadow = true; gardenWall.receiveShadow = true;
    scene.add(gardenWall);
  }

  function init3D(){
    canvas = $("#gate3d");
    fallbackEl = $("#gate3d-fallback");
    if (typeof THREE === "undefined" || !canvas){
      if (fallbackEl) fallbackEl.style.display = "block";
      if (canvas) canvas.style.display = "none";
      var vb = $("#cfg-video"); if (vb) vb.disabled = true;
      var sb = $("#cfg-still"); if (sb) sb.disabled = true;
      return;
    }
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, 2, 0.1, 220);
      camera.position.set(10, 7, 14);
      scene.add(new THREE.HemisphereLight(0xbfd4e6, 0x3a2f26, 0.55));
      keyLight = new THREE.DirectionalLight(0xffe0b3, 1.15);
      keyLight.position.set(9, 15, 7);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(2048, 2048);
      keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 60;
      keyLight.shadow.bias = -0.0004; keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);
      var fill = new THREE.DirectionalLight(0x9db8d6, 0.35);
      fill.position.set(-9, 6, -7); scene.add(fill);
      var bounce = new THREE.PointLight(0xffc98a, 0.35, 34);
      bounce.position.set(0, 2.5, 8); scene.add(bounce);
      texBrushed = brushedTexture(); texHammered = hammeredTexture(); texSpangle = spangleTexture();
      texSign = signFaceTexture();
      makeEnvMap();
      buildSetting();
      modelGroup = new THREE.Group();
      scene.add(modelGroup);
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.maxPolarAngle = Math.PI * 0.52;
      controls.minDistance = 3; controls.maxDistance = 70;
      controls.autoRotate = !!state.turntable;
      controls.autoRotateSpeed = 2.4;
      controls.update();
      buildPiece();
      animate();
      inited = true;
    } catch (e){
      if (fallbackEl) fallbackEl.style.display = "block";
      canvas.style.display = "none";
    }
  }

  function resize(){
    if (!renderer || !canvas) return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())){
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
  }

  function frameCamera(){
    if (!modelGroup || !controls) return;
    var box3 = new THREE.Box3().setFromObject(modelGroup);
    var sphere = box3.getBoundingSphere(new THREE.Sphere());
    if (!isFinite(sphere.radius) || sphere.radius <= 0) return;
    var center = sphere.center, radius = sphere.radius;
    var fov = camera.fov * Math.PI / 180;
    var dist = (radius / Math.tan(fov / 2)) * 1.3;
    dist = Math.max(dist, (radius / (Math.tan(fov / 2) * Math.max(camera.aspect, 0.4))) * 1.3);
    var dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 0.01) dir.set(1, 0.42, 1.25);
    dir.normalize();
    camera.position.copy(center).addScaledVector(dir, dist);
    camera.position.y = Math.max(camera.position.y, center.y + radius * 0.2);
    controls.target.copy(center);
    var s = radius + 4;
    keyLight.shadow.camera.left = -s; keyLight.shadow.camera.right = s;
    keyLight.shadow.camera.top = s; keyLight.shadow.camera.bottom = -s;
    keyLight.shadow.camera.updateProjectionMatrix();
    controls.update();
  }

  function disposeGroup(group){
    group.traverse(function(o){
      if (o.geometry) o.geometry.dispose();
      if (o.material){
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(function(m){ m.dispose(); });
      }
    });
    while (group.children.length) group.remove(group.children[0]);
  }

  function animate(){
    requestAnimationFrame(animate);
    if (recording) return; // recording drives its own frames
    resize();
    if (canvas && canvas.offsetParent !== null){
      controls.update();
      renderer.render(scene, camera);
    }
  }

  /* ---------------- Small mesh helpers ---------------- */
  function box(parent, mat, w, h, d, x, y, z){
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  }
  function cyl(parent, mat, rt, rb, h, x, y, z, seg){
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  }
  function sph(parent, mat, r, x, y, z){
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
    m.position.set(x, y, z); m.castShadow = true;
    parent.add(m); return m;
  }
  function torus(parent, mat, R, t, x, y, z, arc){
    var m = new THREE.Mesh(new THREE.TorusGeometry(R, t, 12, 32, arc || Math.PI * 2), mat);
    m.position.set(x, y, z); m.castShadow = true;
    parent.add(m); return m;
  }

  /* ---------------- Decorative pieces ---------------- */
  function makeFinial(parent, mat, type, x, y, z){
    if (type === "none") return;
    if (type === "ball"){
      cyl(parent, mat, 0.09, 0.12, 0.22, x, y + 0.11, z, 12);
      sph(parent, mat, 0.2, x, y + 0.38, z);
    } else if (type === "spear"){
      cyl(parent, mat, 0.08, 0.12, 0.2, x, y + 0.1, z, 12);
      var cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 16), mat);
      cone.position.set(x, y + 0.46, z); cone.castShadow = true; parent.add(cone);
    } else if (type === "scroll"){
      var t = torus(parent, mat, 0.16, 0.05, x, y + 0.22, z, Math.PI * 1.5);
      t.rotation.z = Math.PI * 0.75;
    }
  }
  function makeScroll(parent, mat, size, x, y, z){
    // S-scroll: two half-tori, mirrored
    var g = new THREE.Group();
    var a = torus(g, mat, size * 0.5, size * 0.11, -size * 0.28, size * 0.28, 0, Math.PI);
    a.rotation.z = 0;
    var b = torus(g, mat, size * 0.5, size * 0.11, size * 0.28, -size * 0.28, 0, Math.PI);
    b.rotation.z = Math.PI;
    g.position.set(x, y, z);
    parent.add(g); return g;
  }
  function makeRing(parent, mat, R, x, y, z){
    return torus(parent, mat, R, 0.06, x, y, z);
  }
  function makeLeaf(parent, mat, size, x, y, z, rotZ){
    var shape = new THREE.Shape();
    shape.moveTo(0, -size);
    shape.quadraticCurveTo(size * 0.55, -size * 0.2, 0, size);
    shape.quadraticCurveTo(-size * 0.55, -size * 0.2, 0, -size);
    var geo = new THREE.ExtrudeGeometry(shape, { depth: size * 0.08, bevelEnabled: false });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.z = rotZ || 0; m.castShadow = true;
    parent.add(m); return m;
  }
  function makeBranch(parent, mat, x, y, z, len){
    var g = new THREE.Group();
    var curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(len * 0.3, len * 0.25, 0),
      new THREE.Vector3(len * 0.7, len * 0.2, 0), new THREE.Vector3(len, len * 0.45, 0)
    ]);
    var tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.05, 8), mat);
    tube.castShadow = true; g.add(tube);
    makeLeaf(g, mat, len * 0.22, len * 0.35, len * 0.3, 0.06, 0.7);
    makeLeaf(g, mat, len * 0.22, len * 0.65, len * 0.28, 0.06, -0.5);
    makeLeaf(g, mat, len * 0.2, len * 0.95, len * 0.5, 0.06, 0.3);
    g.position.set(x, y, z);
    parent.add(g); return g;
  }
  function makeMedallion(parent, mat, R, x, y, z){
    var g = new THREE.Group();
    var disc = cyl(g, mat, R, R, 0.07, 0, 0, 0, 28);
    disc.rotation.x = Math.PI / 2;
    var ring = torus(g, mat, R * 0.78, 0.045, 0, 0, 0.05);
    var hub = sph(g, mat, R * 0.22, 0, 0, 0.06);
    hub.scale.z = 0.5;
    g.position.set(x, y, z);
    parent.add(g); return g;
  }
  function makePost(parent, mats, style, x, h, z){
    if (style === "round"){
      cyl(parent, mats.dark, 0.26, 0.3, h, x, h / 2, z, 16);
    } else if (style === "ornate"){
      box(parent, mats.dark, 0.5, h, 0.5, x, h / 2, z);
      box(parent, mats.main, 0.62, 0.18, 0.62, x, h * 0.72, z);
      box(parent, mats.main, 0.62, 0.14, 0.62, x, h * 0.3, z);
    } else {
      box(parent, mats.dark, 0.5, h, 0.5, x, h / 2, z);
    }
    makeFinial(parent, mats.main, state.finial, x, h, z);
  }

  /* ---------------- Piece builders ---------------- */
  function applyDecorGate(parent, mats, w, h){
    var z = 0.16;
    if (state.decor.scrolls){
      makeScroll(parent, mats.main, 1.1, -w * 0.22, h * 0.5, z);
      makeScroll(parent, mats.main, 1.1, w * 0.22, h * 0.5, z);
    }
    if (state.decor.rings){
      makeRing(parent, mats.main, 0.5, -w * 0.25, h * 0.55, z);
      makeRing(parent, mats.main, 0.5, w * 0.25, h * 0.55, z);
    }
    if (state.decor.leaves) makeBranch(parent, mats.main, -w * 0.3, h * 0.3, z, 1.6);
    if (state.decor.medallion) makeMedallion(parent, mats.main, 0.55, 0, h * 0.55, z);
  }

  function buildGate(mats){
    var w = state.width, h = state.height, g = modelGroup;
    var leaves = (state.leaves === "double") ? 2 : 1;
    var leafW = (leaves === 2) ? (w / 2 - 0.15) : w;
    var centers = (leaves === 2) ? [-w / 4, w / 4] : [0];
    makePost(g, mats, state.postStyle, -w / 2 - 0.25, h, 0);
    makePost(g, mats, state.postStyle, w / 2 + 0.25, h, 0);
    if (leaves === 2) box(g, mats.dark, 0.3, h, 0.34, 0, h / 2, 0); // center stile
    centers.forEach(function(cx){
      box(g, mats.dark, leafW, 0.5, 0.28, cx, h - 0.25, 0);
      box(g, mats.dark, leafW, 0.5, 0.28, cx, 0.25, 0);
      if (state.style === "vertical"){
        var n = Math.max(3, Math.round(leafW * 1.2));
        for (var i = 0; i < n; i++){
          var x = cx - leafW / 2 + (leafW * (i + 0.5) / n);
          box(g, mats.main, 0.22, h - 0.5, 0.16, x, h / 2, 0);
        }
      } else if (state.style === "horizontal"){
        var rows = Math.max(3, Math.round(h * 1.5));
        for (var j = 0; j < rows; j++){
          var y = 0.5 + ((h - 1) * (j + 0.5) / rows);
          box(g, mats.main, leafW, 0.22, 0.16, cx, y, 0);
        }
      } else {
        box(g, mats.main, leafW, h - 0.5, 0.12, cx, h / 2, 0);
      }
    });
    applyDecorGate(g, mats, w, h);
  }

  function buildRailing(mats){
    var L = state.width, H = state.height, g = modelGroup;
    // top rail by profile
    if (state.topRail === "round"){
      var rail = cyl(g, mats.dark, 0.13, 0.13, L, 0, H, 0, 16);
      rail.rotation.z = Math.PI / 2;
    } else if (state.topRail === "cap"){
      box(g, mats.dark, L, 0.14, 0.55, 0, H - 0.07, 0);
      box(g, mats.main, L, 0.1, 0.4, 0, H - 0.19, 0);
    } else {
      box(g, mats.dark, L, 0.18, 0.35, 0, H - 0.09, 0);
    }
    box(g, mats.dark, L, 0.16, 0.2, 0, 0.35, 0); // bottom rail
    // posts at spacing
    var spacing = state.postSpacing;
    var nSeg = Math.max(1, Math.round(L / spacing));
    var step = L / nSeg;
    var postX = [];
    for (var i = 0; i <= nSeg; i++){
      var x = -L / 2 + i * step;
      postX.push(x);
      makePost(g, mats, state.postStyle, x, H, 0);
      box(g, mats.dark, 0.6, 0.07, 0.6, x, 0.035, 0); // mounting foot
    }
    // infill
    if (state.style === "vertical"){
      var pickets = Math.max(2, Math.floor((L * 12) / state.picketSpacing));
      for (var p = 0; p < pickets; p++){
        var px = -L / 2 + ((p + 0.5) * L / pickets);
        box(g, mats.main, 0.12, H - 0.55, 0.08, px, (H + 0.35) / 2, 0);
      }
    } else if (state.style === "horizontal"){
      var rows = Math.max(3, Math.round(H * 1.6));
      for (var r = 0; r < rows; r++){
        var ry = 0.45 + ((H - 0.55) * (r + 0.5) / rows);
        box(g, mats.main, L, 0.13, 0.09, 0, ry, 0);
      }
    } else if (state.style === "solid"){
      box(g, mats.main, L, H - 0.55, 0.08, 0, (H + 0.35) / 2, 0);
    } else { // scrollwork
      var nScroll = Math.max(1, Math.round(L / 2.2));
      for (var s2 = 0; s2 < nScroll; s2++){
        var sx = -L / 2 + ((s2 + 0.5) * L / nScroll);
        makeScroll(g, mats.main, Math.min(1.3, H * 0.55), sx, (H + 0.35) / 2, 0);
      }
    }
    // decor
    if (state.decor.scrolls && state.style !== "scroll"){
      makeScroll(g, mats.main, 1.0, -L * 0.25, (H + 0.35) / 2, 0.12);
      makeScroll(g, mats.main, 1.0, L * 0.25, (H + 0.35) / 2, 0.12);
    }
    if (state.decor.rings){
      makeRing(g, mats.main, 0.42, -L * 0.2, (H + 0.35) / 2, 0.12);
      makeRing(g, mats.main, 0.42, L * 0.2, (H + 0.35) / 2, 0.12);
    }
    if (state.decor.leaves) makeBranch(g, mats.main, -0.8, H * 0.35, 0.12, 1.6);
    if (state.decor.medallion) makeMedallion(g, mats.main, 0.5, 0, (H + 0.35) / 2, 0.14);
  }

  function buildSculptureBase(mats){
    var w = state.width, h = state.height, d = state.depth, g = modelGroup;
    box(g, mats.dark, w + 0.5, 0.3, d + 0.5, 0, 0.15, 0); // base slab
    if (state.style === "column"){
      cyl(g, mats.main, w * 0.42, w * 0.48, h - 0.6, 0, 0.3 + (h - 0.6) / 2, 0, 24);
      cyl(g, mats.dark, w * 0.55, w * 0.55, 0.22, 0, h - 0.11, 0, 24); // cap
    } else if (state.style === "tapered"){
      var tap = cyl(g, mats.main, w * 0.36, w * 0.5, h - 0.6, 0, 0.3 + (h - 0.6) / 2, 0, 4);
      tap.rotation.y = Math.PI / 4;
      tap.scale.z = d / w;
      box(g, mats.dark, w * 0.9, 0.22, d * 0.9, 0, h - 0.11, 0); // cap
    } else {
      box(g, mats.main, w, h - 0.6, d, 0, 0.3 + (h - 0.6) / 2, 0);
      box(g, mats.dark, w + 0.24, 0.22, d + 0.24, 0, h - 0.11, 0); // cap
    }
    // abstract forged form on top — a visualization, the real sculpture is designed with Ray
    var formY = h;
    var arc1 = torus(g, mats.main, 0.55, 0.07, 0, formY + 0.7, 0, Math.PI * 1.2);
    arc1.rotation.z = Math.PI * 0.15;
    var arc2 = torus(g, mats.main, 0.4, 0.06, 0.1, formY + 1.05, 0, Math.PI);
    arc2.rotation.z = -Math.PI * 0.4;
    sph(g, mats.main, 0.22, -0.15, formY + 1.35, 0);
    cyl(g, mats.main, 0.06, 0.09, 0.9, 0, formY + 0.45, 0, 10);
    if (state.decor.medallion) makeMedallion(g, mats.main, 0.42, 0, h * 0.45, d / 2 + 0.06);
    if (state.decor.leaves) makeBranch(g, mats.main, -w * 0.2, h * 0.5, d / 2 + 0.06, 1.2);
    if (state.decor.scrolls) makeScroll(g, mats.main, 0.8, w * 0.22, h * 0.5, d / 2 + 0.06);
  }

  function buildSignFrame(mats){
    var w = state.width, h = state.height, g = modelGroup;
    makePost(g, mats, state.postStyle, -w / 2 - 0.3, h, 0);
    makePost(g, mats, state.postStyle, w / 2 + 0.3, h, 0);
    var panelH = h * 0.62, panelY = h * 0.56;
    // panel with a "Your Name Here" face texture
    var face = new THREE.Mesh(
      new THREE.BoxGeometry(w, panelH, 0.1),
      new THREE.MeshStandardMaterial({ map: texSign, roughness: 0.6, metalness: 0.4, envMap: envMap, envMapIntensity: 0.7 })
    );
    face.position.set(0, panelY, 0); face.castShadow = true; face.receiveShadow = true;
    g.add(face);
    // frame border around the panel
    box(g, mats.dark, w + 0.24, 0.16, 0.16, 0, panelY + panelH / 2 + 0.08, 0);
    box(g, mats.dark, w + 0.24, 0.16, 0.16, 0, panelY - panelH / 2 - 0.08, 0);
    box(g, mats.dark, 0.16, panelH + 0.24, 0.16, -w / 2 - 0.12, panelY, 0);
    box(g, mats.dark, 0.16, panelH + 0.24, 0.16, w / 2 + 0.12, panelY, 0);
    if (state.style === "arch"){
      var arch = torus(g, mats.dark, w / 2 + 0.1, 0.09, 0, panelY + panelH / 2 + 0.08, 0, Math.PI);
      arch.rotation.z = 0;
    }
    if (state.decor.medallion) makeMedallion(g, mats.main, 0.4, 0, panelY, 0.14);
    if (state.decor.scrolls){
      makeScroll(g, mats.main, 0.7, -w * 0.32, panelY, 0.14);
      makeScroll(g, mats.main, 0.7, w * 0.32, panelY, 0.14);
    }
    if (state.decor.leaves) makeBranch(g, mats.main, -w * 0.25, panelY - panelH * 0.3, 0.14, 1.1);
  }

  function buildPatioCover(mats){
    var span = state.width, depth = state.depth, h = state.height, g = modelGroup;
    var nPosts = span > 14 ? 3 : 2;
    for (var i = 0; i < nPosts; i++){
      var px = -span / 2 + (i * span / (nPosts - 1));
      makePost(g, mats, state.postStyle, px, h, -depth / 2);
      makePost(g, mats, state.postStyle, px, h, depth / 2);
      box(g, mats.dark, 0.7, 0.08, 0.7, px, 0.04, -depth / 2);
      box(g, mats.dark, 0.7, 0.08, 0.7, px, 0.04, depth / 2);
    }
    // beams along the depth (on top of posts) and across the span
    [-depth / 2, depth / 2].forEach(function(z){
      box(g, mats.dark, span + 0.6, 0.5, 0.35, 0, h + 0.25, z);
    });
    box(g, mats.dark, 0.35, 0.5, depth + 0.6, -span / 2, h + 0.25, 0);
    box(g, mats.dark, 0.35, 0.5, depth + 0.6, span / 2, h + 0.25, 0);
    // roof
    if (state.style === "slats"){
      var n = Math.max(4, Math.round(span / 1.4));
      for (var s = 0; s < n; s++){
        var sx = -span / 2 + ((s + 0.5) * span / n);
        box(g, mats.main, 0.28, 0.12, depth + 0.9, sx, h + 0.62, 0);
      }
    } else {
      box(g, mats.main, span + 1.0, 0.14, depth + 1.0, 0, h + 0.6, 0);
      box(g, mats.dark, span + 1.1, 0.1, depth + 1.1, 0, h + 0.5, 0);
    }
    if (state.decor.medallion) makeMedallion(g, mats.main, 0.45, 0, h + 0.25, depth / 2 + 0.24);
    if (state.decor.rings){
      makeRing(g, mats.main, 0.4, -span * 0.25, h - 0.6, depth / 2 + 0.1);
      makeRing(g, mats.main, 0.4, span * 0.25, h - 0.6, depth / 2 + 0.1);
    }
  }

  function buildPiece(){
    if (!modelGroup) return;
    disposeGroup(modelGroup);
    var mats = finishMaterials();
    if (state.piece === "gate") buildGate(mats);
    else if (state.piece === "railing") buildRailing(mats);
    else if (state.piece === "sculpture-base") buildSculptureBase(mats);
    else if (state.piece === "sign-frame") buildSignFrame(mats);
    else if (state.piece === "patio-cover") buildPatioCover(mats);
    modelGroup.rotation.y = 0;
    frameCamera();
    emitChange();
  }

  /* ---------------- Readout + quote description ---------------- */
  function styleName(){
    var p = PIECES[state.piece];
    for (var i = 0; i < p.styles.length; i++) if (p.styles[i][0] === state.style) return p.styles[i][1];
    return state.style;
  }
  function dimsText(){
    if (state.piece === "railing") return fmtFt(state.width) + " long × " + fmtFt(state.height) + " high";
    if (state.piece === "patio-cover") return fmtFt(state.width) + " span × " + fmtFt(state.depth) + " deep × " + fmtFt(state.height) + " high";
    if (state.piece === "sculpture-base") return fmtFt(state.width) + " wide × " + fmtFt(state.depth) + " deep × " + fmtFt(state.height) + " high";
    return fmtFt(state.width) + " wide × " + fmtFt(state.height) + " high";
  }
  function describeConfig(){
    var parts = [PIECES[state.piece].label, dimsText(), styleName()];
    if (state.piece === "gate" && state.leaves === "double") parts.push("double leaves");
    if (state.piece === "railing"){
      parts.push((state.topRail === "round" ? "round tube top rail" : (state.topRail === "cap" ? "wide cap top rail" : "flat bar top rail")));
      parts.push("posts every " + state.postSpacing + " ft");
      if (state.style === "vertical") parts.push("pickets every " + state.picketSpacing + " in");
    }
    if (PIECES[state.piece].post) parts.push(state.postStyle + " posts");
    if (state.finial !== "none") parts.push(state.finial + " finials");
    var decor = [];
    if (state.decor.scrolls) decor.push("scrolls");
    if (state.decor.rings) decor.push("rings");
    if (state.decor.leaves) decor.push("leaf branch");
    if (state.decor.medallion) decor.push("medallion");
    if (decor.length) parts.push("decorative " + decor.join(", "));
    var fin = (state.finish === "powder-coat")
      ? ("powder-coat (" + POWDERS[state.powder].name + ")")
      : FINISHES[state.finish].name;
    parts.push(fin + " on " + MATERIALS[state.material].name);
    return parts.join(" — ");
  }
  function updateReadout(){
    var el = $("#cfg-readout");
    if (el) el.textContent = describeConfig();
    var wv = $("#cfg-width-val"); if (wv) wv.textContent = fmtFt(state.width);
    var hv = $("#cfg-height-val"); if (hv) hv.textContent = fmtFt(state.height);
    var dv = $("#cfg-depth-val"); if (dv) dv.textContent = fmtFt(state.depth);
    var ps = $("#cfg-postspacing-val"); if (ps) ps.textContent = state.postSpacing + " ft";
    var pk = $("#cfg-picketspacing-val"); if (pk) pk.textContent = state.picketSpacing + " in";
  }
  function setFormStatus(msg, kind){
    var el = $("#q-status");
    if (!el) return;
    el.textContent = msg;
    el.className = "form-status " + (kind || "");
  }

  /* ---------------- Export: still + turntable video ---------------- */
  function downloadBlob(blob, filename){
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function setCfgStatus(msg, kind){
    var el = $("#cfg-status");
    if (!el) return;
    el.textContent = msg;
    el.className = "form-status " + (kind || "");
  }
  function captureStill(){
    if (!renderer || !canvas){
      setCfgStatus("The 3D viewer is not available in this browser — the technical drawing above shows the same piece.", "warn");
      return;
    }
    try {
      var aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      var w = 1600, h = Math.round(w / aspect);
      var prevPR = renderer.getPixelRatio();
      var prevW = canvas.clientWidth, prevH = canvas.clientHeight;
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      canvas.toBlob(function(blob){
        renderer.setPixelRatio(prevPR);
        renderer.setSize(prevW, prevH, false);
        camera.aspect = prevW / Math.max(1, prevH); camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        if (!blob){ setCfgStatus("The still image could not be captured in this browser.", "warn"); return; }
        downloadBlob(blob, "rays-ironworks-design.png");
        setCfgStatus("Still image saved (PNG). This is a visualization of your configured piece — the finished piece is built by Ray to your exact measurements.", "ok");
      }, "image/png");
    } catch (e){
      setCfgStatus("The still image could not be captured in this browser.", "warn");
    }
  }
  function pickMime(){
    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return null;
    var cands = [
      ["video/webm;codecs=vp9", "webm"], ["video/webm;codecs=vp8", "webm"],
      ["video/webm", "webm"],
      ["video/mp4;codecs=avc1.42E01E", "mp4"], ["video/mp4", "mp4"], ["", "webm"]
    ];
    for (var i = 0; i < cands.length; i++){
      try { if (MediaRecorder.isTypeSupported(cands[i][0])) return { mime: cands[i][0], ext: cands[i][1] }; }
      catch (e){}
    }
    return null;
  }
  function recordTurntable(){
    if (!renderer || !canvas || !window.MediaRecorder || !canvas.captureStream){
      setCfgStatus("Video recording is not available in this browser — use “Save a Still Image (PNG)” instead. The still shows your configured piece from the current angle.", "warn");
      return;
    }
    var pick = pickMime();
    if (!pick){
      setCfgStatus("Video recording is not available in this browser — use “Save a Still Image (PNG)” instead. The still shows your configured piece from the current angle.", "warn");
      return;
    }
    var btn = $("#cfg-video");
    if (btn) btn.disabled = true;
    var wasAuto = controls ? controls.autoRotate : false;
    if (controls){ controls.autoRotate = false; controls.enabled = false; }
    recording = true;
    modelGroup.rotation.y = 0;
    var stream = canvas.captureStream(30);
    var chunks = [];
    var rec;
    try {
      rec = new MediaRecorder(stream, pick.mime ? { mimeType: pick.mime, videoBitsPerSecond: 8000000 } : { videoBitsPerSecond: 8000000 });
    } catch (e){
      recording = false;
      if (controls) controls.enabled = true;
      if (btn) btn.disabled = false;
      setCfgStatus("Video recording could not start in this browser — use “Save a Still Image (PNG)” instead.", "warn");
      return;
    }
    rec.ondataavailable = function(ev){ if (ev.data && ev.data.size) chunks.push(ev.data); };
    rec.onstop = function(){
      recording = false;
      modelGroup.rotation.y = 0;
      if (controls){ controls.autoRotate = wasAuto; controls.enabled = true; }
      if (btn) btn.disabled = false;
      renderer.render(scene, camera);
      var blob = new Blob(chunks, { type: pick.mime || "video/webm" });
      if (!blob.size){
        setCfgStatus("The video came out empty in this browser — use “Save a Still Image (PNG)” instead.", "warn");
        return;
      }
      downloadBlob(blob, "rays-ironworks-turntable." + pick.ext);
      setCfgStatus("Turntable video saved (" + pick.ext.toUpperCase() + ", one full rotation). This is a visualization of your configured piece — the finished piece is built by Ray to your exact measurements.", "ok");
    };
    var DUR = 8000, start = performance.now();
    rec.start(250);
    setCfgStatus("Recording your turntable video… one full rotation, about 8 seconds.", "");
    (function tick(now){
      var t = (now - start) / DUR;
      if (t >= 1){
        modelGroup.rotation.y = 0;
        renderer.render(scene, camera);
        try { rec.stop(); } catch (e){}
        return;
      }
      modelGroup.rotation.y = t * Math.PI * 2;
      renderer.render(scene, camera);
      var el = $("#cfg-status");
      if (el) el.textContent = "Recording your turntable video… " + Math.ceil(t * 8) + " of 8 seconds.";
      requestAnimationFrame(tick);
    })(start);
  }

  /* ---------------- Controls wiring ---------------- */
  function syncControlVisibility(){
    var p = PIECES[state.piece];
    function show(id, on){ var el = $(id); if (el) el.style.display = on ? "" : "none"; }
    show("#cfg-depth-row", !!p.depth);
    show("#cfg-toprail-row", !!p.topRail);
    show("#cfg-post-row", !!p.post);
    show("#cfg-postspacing-row", !!p.postSpacing);
    show("#cfg-picketspacing-row", !!p.picketSpacing);
    show("#cfg-leaves-row", !!p.leaves);
    show("#cfg-powder-row", state.finish === "powder-coat");
    // width/height labels + ranges
    var wl = $("#cfg-width-label"); if (wl) wl.textContent = p.widthLabel;
    var hl = $("#cfg-height-label"); if (hl) hl.textContent = p.heightLabel;
    var w = $("#cfg-width");
    if (w){ w.min = p.widthMin; w.max = p.widthMax; w.step = p.widthStep; w.value = state.width; }
    var h = $("#cfg-height");
    if (h){ h.min = p.heightMin; h.max = p.heightMax; h.step = p.heightStep; h.value = state.height; }
    if (p.depth){
      var dl = $("#cfg-depth-label"); if (dl) dl.textContent = p.depthLabel;
      var d = $("#cfg-depth");
      if (d){ d.min = p.depthMin; d.max = p.depthMax; d.step = p.depthStep; d.value = state.depth; }
    }
    // style options
    var sel = $("#cfg-style");
    if (sel){
      sel.innerHTML = "";
      p.styles.forEach(function(s){
        var o = document.createElement("option");
        o.value = s[0]; o.textContent = s[1];
        if (s[0] === state.style) o.selected = true;
        sel.appendChild(o);
      });
    }
    // piece pills
    $$("[data-piece]").forEach(function(b){
      b.setAttribute("aria-selected", b.dataset.piece === state.piece ? "true" : "false");
    });
  }
  function setPiece(name){
    if (!PIECES[name]) return;
    state.piece = name;
    var p = PIECES[name];
    state.width = p.widthDef; state.height = p.heightDef;
    if (p.depth) state.depth = p.depthDef;
    state.style = p.styles[0][0];
    syncControlVisibility();
    buildPiece();
  }
  function wireControls(){
    $$("[data-piece]").forEach(function(b){
      b.addEventListener("click", function(){ setPiece(b.dataset.piece); });
    });
    var w = $("#cfg-width"); if (w) w.addEventListener("input", function(){ state.width = +w.value; buildPiece(); });
    var h = $("#cfg-height"); if (h) h.addEventListener("input", function(){ state.height = +h.value; buildPiece(); });
    var d = $("#cfg-depth"); if (d) d.addEventListener("input", function(){ state.depth = +d.value; buildPiece(); });
    var st = $("#cfg-style"); if (st) st.addEventListener("change", function(){ state.style = st.value; buildPiece(); });
    var lv = $("#cfg-leaves"); if (lv) lv.addEventListener("change", function(){ state.leaves = lv.value; buildPiece(); });
    var tr = $("#cfg-toprail"); if (tr) tr.addEventListener("change", function(){ state.topRail = tr.value; buildPiece(); });
    var ps = $("#cfg-post"); if (ps) ps.addEventListener("change", function(){ state.postStyle = ps.value; buildPiece(); });
    var psp = $("#cfg-postspacing"); if (psp) psp.addEventListener("input", function(){ state.postSpacing = +psp.value; buildPiece(); });
    var pk = $("#cfg-picketspacing"); if (pk) pk.addEventListener("input", function(){ state.picketSpacing = +pk.value; buildPiece(); });
    var fn = $("#cfg-finial"); if (fn) fn.addEventListener("change", function(){ state.finial = fn.value; buildPiece(); });
    [["cfg-decor-scroll","scrolls"],["cfg-decor-ring","rings"],["cfg-decor-leaf","leaves"],["cfg-decor-medallion","medallion"]].forEach(function(pair){
      var el = $("#" + pair[0]);
      if (el) el.addEventListener("change", function(){ state.decor[pair[1]] = el.checked; buildPiece(); });
    });
    var mt = $("#cfg-material"); if (mt) mt.addEventListener("change", function(){ state.material = mt.value; buildPiece(); });
    var fi = $("#cfg-finish");
    if (fi) fi.addEventListener("change", function(){
      state.finish = fi.value;
      syncControlVisibility();
      buildPiece();
    });
    var pw = $("#cfg-powder"); if (pw) pw.addEventListener("change", function(){ state.powder = pw.value; buildPiece(); });
    var tt = $("#cfg-turntable");
    if (tt) tt.addEventListener("click", function(){
      state.turntable = !state.turntable;
      if (controls) controls.autoRotate = state.turntable;
      tt.textContent = state.turntable ? "Pause Turntable" : "Play Turntable";
      tt.setAttribute("aria-pressed", state.turntable ? "true" : "false");
    });
    var sm = $("#cfg-simple");
    if (sm) sm.addEventListener("change", function(){ applySimpleMode(sm.checked); });
    var stBtn = $("#cfg-still"); if (stBtn) stBtn.addEventListener("click", captureStill);
    var vdBtn = $("#cfg-video"); if (vdBtn) vdBtn.addEventListener("click", recordTurntable);
    var uq = $("#cfg-use-quote");
    if (uq) uq.addEventListener("click", function(){
      var typeSel = $("#q-type");
      if (typeSel) typeSel.value = PIECES[state.piece].qType;
      var sizeEl = $("#q-size");
      if (sizeEl) sizeEl.value = dimsText();
      var descEl = $("#q-desc");
      if (descEl){
        var line = "Configured in the 3D studio: " + describeConfig() + ".";
        descEl.value = descEl.value ? (descEl.value.replace(/\s+$/, "") + "\n" + line) : line;
      }
      var form = $("#quote-form");
      if (form) form.scrollIntoView({ behavior: "smooth" });
      setFormStatus("Your configured piece was added to the quote: " + describeConfig() + ". Fill in your name, email, and any photos below.", "ok");
    });
  }
  function applySimpleMode(on){
    state.simple = !!on;
    if (!renderer) return;
    renderer.setPixelRatio(on ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !on;
    if (keyLight) keyLight.castShadow = !on;
    if (gardenWall) gardenWall.visible = !on;
    if (groundDisc) groundDisc.visible = true;
    resize();
    renderer.render(scene, camera);
  }

  /* ---------------- Public API ---------------- */
  window.IronworksConfig = {
    getState: getState,
    describe: describeConfig,
    onChange: function(fn){ if (typeof fn === "function") changeListeners.push(fn); },
    rebuild: function(){ buildPiece(); }
  };

  /* ---------------- Init ---------------- */
  function init(){
    syncControlVisibility();
    wireControls();
    updateReadout();
    if (document.readyState === "complete") init3D();
    else window.addEventListener("load", init3D);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
