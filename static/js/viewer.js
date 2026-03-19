/* viewer.js — Three.js 3D Shoe Renderer */

class ShoeViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.mode = 'exterior'; // 'exterior' | 'interior'
    this.shoeData = null;
    this.objects = [];
    this.animId = null;

    this._initScene();
    this._initLights();
    this._initControls();
    this._startLoop();

    window.addEventListener('resize', () => this._onResize());
    this._onResize();
  }

  _initScene() {
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0xf5f4f2, 1);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xf5f4f2, 60, 120);

    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);
    this.camera.position.set(0, 14, 36);
    this.camera.lookAt(0, 4, 0);

    // Ground grid
    const gridHelper = new THREE.GridHelper(60, 30, 0xdedad5, 0xe8e4de);
    gridHelper.position.y = -0.05;
    this.scene.add(gridHelper);
  }

  _initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff8f0, 1.1);
    key.position.set(12, 20, 15);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 100;
    key.shadow.camera.left = -25;
    key.shadow.camera.right = 25;
    key.shadow.camera.top = 25;
    key.shadow.camera.bottom = -25;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.4);
    fill.position.set(-10, 8, -8);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(0, 15, -20);
    this.scene.add(rim);
  }

  _initControls() {
    // Manual orbit via mouse drag
    this._isDragging = false;
    this._prevMouse = { x: 0, y: 0 };
    this._spherical = { theta: 0.3, phi: 1.1, radius: 38 };

    this.canvas.addEventListener('mousedown', e => {
      this._isDragging = true;
      this._prevMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => { this._isDragging = false; });
    window.addEventListener('mousemove', e => {
      if (!this._isDragging) return;
      const dx = (e.clientX - this._prevMouse.x) * 0.008;
      const dy = (e.clientY - this._prevMouse.y) * 0.006;
      this._spherical.theta -= dx;
      this._spherical.phi = Math.max(0.25, Math.min(1.5, this._spherical.phi + dy));
      this._prevMouse = { x: e.clientX, y: e.clientY };
      this._updateCamera();
    });
    this.canvas.addEventListener('wheel', e => {
      this._spherical.radius = Math.max(15, Math.min(70, this._spherical.radius + e.deltaY * 0.04));
      this._updateCamera();
    });

    // Touch support
    this._lastTouch = null;
    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this._isDragging = true;
        this._lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });
    this.canvas.addEventListener('touchend', () => { this._isDragging = false; });
    this.canvas.addEventListener('touchmove', e => {
      if (!this._isDragging || e.touches.length !== 1) return;
      const dx = (e.touches[0].clientX - this._lastTouch.x) * 0.01;
      const dy = (e.touches[0].clientY - this._lastTouch.y) * 0.008;
      this._spherical.theta -= dx;
      this._spherical.phi = Math.max(0.25, Math.min(1.5, this._spherical.phi + dy));
      this._lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this._updateCamera();
    });
  }

  _updateCamera() {
    const { theta, phi, radius } = this._spherical;
    this.camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
    this.camera.position.y = radius * Math.cos(phi) + 4;
    this.camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
    this.camera.lookAt(0, 4, 0);
  }

  _onResize() {
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _startLoop() {
    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  _clearShoe() {
    this.objects.forEach(o => {
      this.scene.remove(o);
      o.geometry && o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
    this.objects = [];
  }

  // ─── MATERIAL PALETTE ───────────────────────────────────────────────────────
  _mats(interior) {
    if (interior) {
      return {
        upper:  new THREE.MeshStandardMaterial({ color: 0xd4c9bc, roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide }),
        sole:   new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 0.9, metalness: 0.0 }),
        lining: new THREE.MeshStandardMaterial({ color: 0xe8ddd3, roughness: 0.8, side: THREE.DoubleSide }),
        insole: new THREE.MeshStandardMaterial({ color: 0xc8b8a8, roughness: 0.85 }),
        welt:   new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.8 }),
        section:new THREE.MeshStandardMaterial({ color: 0xe0d4c8, roughness: 0.6, side: THREE.DoubleSide }),
        foot:   new THREE.MeshStandardMaterial({ color: 0xd4a882, roughness: 0.9, metalness: 0 }),
        wire:   new THREE.MeshStandardMaterial({ color: 0x2b2925, wireframe: true, opacity: 0.12, transparent: true }),
      };
    }
    return {
      upper:  new THREE.MeshStandardMaterial({ color: 0x2b2925, roughness: 0.55, metalness: 0.08 }),
      sole:   new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.95, metalness: 0.0 }),
      lining: new THREE.MeshStandardMaterial({ color: 0xc8b8a8, roughness: 0.8, side: THREE.DoubleSide }),
      insole: new THREE.MeshStandardMaterial({ color: 0xb5a898, roughness: 0.85 }),
      welt:   new THREE.MeshStandardMaterial({ color: 0x5a4f48, roughness: 0.75 }),
      section:null,
      foot:   null,
      wire:   null,
    };
  }

  // ─── BUILD SHOE ─────────────────────────────────────────────────────────────
  buildShoe(data, mode) {
    this._clearShoe();
    this.shoeData = data;
    this.mode = mode;

    const d = data.dimensions;
    const interior = (mode === 'interior');
    const mat = this._mats(interior);

    // Normalize scale: map shoe length to ~20 units
    const scale = 20 / d.length;
    const L  = d.length  * scale;
    const W  = d.width   * scale;
    const BW = d.ball_width  * scale;
    const HW = d.heel_width  * scale;
    const IH = d.instep_height * scale;
    const AR = d.ankle_radius  * scale;
    const CR = d.calf_radius   * scale;
    const SH = d.shaft_height  * scale;
    const ST = d.sole_thickness * scale;
    const HH = d.heel_height   * scale;
    const TT = d.toe_taper;

    const group = new THREE.Group();

    // ── SOLE ──
    const solePts = [];
    const segs = 32;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = -L/2 + t * L;
      // Width profile: narrow at toe, wide at ball, narrower at waist, wide at heel
      let w;
      if (t < 0.35) {
        // toe to ball
        const s = t / 0.35;
        w = (W * 0.4 * TT + s * (BW - W * 0.4 * TT));
      } else if (t < 0.6) {
        // ball to waist
        const s = (t - 0.35) / 0.25;
        w = BW - s * (BW - W * 0.75);
      } else if (t < 0.8) {
        // waist to heel
        const s = (t - 0.6) / 0.2;
        w = W * 0.75 + s * (HW - W * 0.75);
      } else {
        // heel round
        const s = (t - 0.8) / 0.2;
        const angle = s * Math.PI / 2;
        w = HW * Math.cos(angle * 0.5);
      }
      solePts.push(new THREE.Vector2(x, w / 2));
    }
    // reverse for bottom
    for (let i = segs; i >= 0; i--) {
      solePts.push(new THREE.Vector2(solePts[i].x, -solePts[i].y));
    }

    const soleShape = new THREE.Shape(solePts);
    const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
      depth: ST,
      bevelEnabled: false,
    });
    soleGeo.rotateX(Math.PI / 2);
    soleGeo.translate(0, 0, 0);
    const soleMesh = new THREE.Mesh(soleGeo, mat.sole);
    soleMesh.castShadow = true;
    soleMesh.receiveShadow = true;
    group.add(soleMesh);
    this.objects.push(soleMesh);

    // ── WELT (thin strip between sole & upper) ──
    const weltGeo = new THREE.ExtrudeGeometry(soleShape, { depth: 0.35 * scale, bevelEnabled: false });
    weltGeo.rotateX(Math.PI / 2);
    weltGeo.translate(0, ST, 0);
    const weltMesh = new THREE.Mesh(weltGeo, mat.welt);
    group.add(weltMesh);
    this.objects.push(weltMesh);

    // ── HEEL BLOCK ──
    const heelGeo = new THREE.BoxGeometry(HW * 0.7, HH, HW * 0.55);
    const heelMesh = new THREE.Mesh(heelGeo, mat.sole);
    heelMesh.position.set(L / 2 - HW * 0.35, -(HH / 2), 0);
    heelMesh.castShadow = true;
    group.add(heelMesh);
    this.objects.push(heelMesh);

    // ── UPPER (vamp + quarters as curved tube-like mesh) ──
    this._buildUpper(group, L, W, BW, HW, IH, AR, SH, ST, TT, mat, interior, scale);

    // ── INTERIOR DETAILS ──
    if (interior) {
      this._buildInterior(group, L, W, BW, IH, AR, SH, ST, TT, mat, scale);
      this._buildCutPlane(group, L, W, BW, HW, IH, AR, SH, ST, TT, mat, scale);
    }

    // Position group on ground
    group.position.y = HH + 0.05;
    group.rotation.y = -0.25;

    this.scene.add(group);
    this.objects.push(group);

    // Animate in
    group.scale.set(0.01, 0.01, 0.01);
    const t0 = performance.now();
    const animateIn = () => {
      const s = Math.min(1, (performance.now() - t0) / 380);
      const ease = 1 - Math.pow(1 - s, 3);
      group.scale.setScalar(ease);
      if (s < 1) requestAnimationFrame(animateIn);
    };
    animateIn();
  }

  _buildUpper(group, L, W, BW, HW, IH, AR, SH, ST, TT, mat, interior, scale) {
    const baseY = ST + 0.35 * scale;

    // Profile curve points for the upper outline (side view)
    // We build a lathe-like mesh using custom geometry

    // Number of cross sections along length
    const nLen = 28;
    const nCirc = 20;

    const vertices = [];
    const indices = [];
    const uvs = [];

    // For each cross section along the shoe length (front to back)
    for (let i = 0; i <= nLen; i++) {
      const t = i / nLen; // 0 = toe, 1 = heel

      // x position along shoe length
      const x = -L / 2 + t * L;

      // Width at this position (same as sole profile)
      let w;
      if (t < 0.35) {
        const s = t / 0.35;
        w = (W * 0.4 * TT + s * (BW - W * 0.4 * TT));
      } else if (t < 0.6) {
        const s = (t - 0.35) / 0.25;
        w = BW - s * (BW - W * 0.75);
      } else if (t < 0.8) {
        const s = (t - 0.6) / 0.2;
        w = W * 0.75 + s * (HW - W * 0.75);
      } else {
        const s = (t - 0.8) / 0.2;
        w = HW * Math.cos((s * Math.PI) / 4);
      }
      w = Math.max(w, 0.5);

      // Height profile of the upper at this position
      let topH;
      if (t < 0.12) {
        // toe: low profile curving up
        topH = IH * 0.18 + (t / 0.12) * IH * 0.1;
      } else if (t < 0.45) {
        // vamp: rises to instep peak
        const s = (t - 0.12) / 0.33;
        topH = IH * 0.28 + s * IH * 0.72;
      } else if (t < 0.7) {
        // throat: slight dip
        const s = (t - 0.45) / 0.25;
        topH = IH - s * IH * 0.15;
      } else {
        // quarter and heel: height depends on shaft
        const s = (t - 0.7) / 0.3;
        const shaftAdd = SH > 0 ? Math.min(SH, SH * s * 2) : 0;
        topH = IH * 0.85 + shaftAdd;
      }

      // Build elliptical cross section at this slice
      for (let j = 0; j <= nCirc; j++) {
        const angle = (j / nCirc) * Math.PI * 2;
        const hw = w / 2;
        const vx = x;
        const vy = baseY + topH * 0.5 + Math.sin(angle) * topH * 0.5;
        const vz = Math.cos(angle) * hw;

        // clip below baseline
        const finalY = Math.max(baseY, vy);
        vertices.push(vx, finalY, vz);
        uvs.push(i / nLen, j / nCirc);
      }
    }

    // Build indices
    for (let i = 0; i < nLen; i++) {
      for (let j = 0; j < nCirc; j++) {
        const a = i * (nCirc + 1) + j;
        const b = a + (nCirc + 1);
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // For interior mode, clip the top half
    const upperMat = interior
      ? new THREE.MeshStandardMaterial({ color: 0xd4c9bc, roughness: 0.7, side: THREE.DoubleSide })
      : mat.upper;

    const upperMesh = new THREE.Mesh(geo, upperMat);
    upperMesh.castShadow = true;
    group.add(upperMesh);
    this.objects.push(upperMesh);
  }

  _buildInterior(group, L, W, BW, IH, AR, SH, ST, TT, mat, scale) {
    const baseY = ST + 0.4 * scale;
    const wallThick = 0.4 * scale;

    // Insole
    const solePts = [];
    const segs = 24;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = -L/2 * 0.9 + t * L * 0.9;
      let w;
      if (t < 0.35) { w = (W * 0.38 * TT + (t / 0.35) * (BW * 0.88 - W * 0.38 * TT)); }
      else if (t < 0.6) { const s=(t-0.35)/0.25; w = BW*0.88 - s*(BW*0.88 - W*0.7); }
      else { const s=(t-0.6)/0.4; w = W*0.7 - s*W*0.2; }
      solePts.push(new THREE.Vector2(x, w * 0.44));
    }
    for (let i = segs; i >= 0; i--) solePts.push(new THREE.Vector2(solePts[i].x, -solePts[i].y));

    const insoleShape = new THREE.Shape(solePts);
    const insoleGeo = new THREE.ExtrudeGeometry(insoleShape, { depth: wallThick * 0.6, bevelEnabled: false });
    insoleGeo.rotateX(Math.PI / 2);
    insoleGeo.translate(0, baseY, 0);
    const insoleMesh = new THREE.Mesh(insoleGeo, mat.insole);
    group.add(insoleMesh);
    this.objects.push(insoleMesh);

    // Foot ghost (semi-transparent foot shape inside shoe)
    const footGeo = new THREE.CapsuleGeometry
      ? new THREE.CapsuleGeometry(W * 0.3, L * 0.55, 6, 12)
      : new THREE.CylinderGeometry(W * 0.3, W * 0.32, L * 0.55, 12);
    footGeo.rotateZ(Math.PI / 2);
    const footMat = new THREE.MeshStandardMaterial({
      color: 0xd4a882, roughness: 0.85, transparent: true, opacity: 0.38
    });
    const footMesh = new THREE.Mesh(footGeo, footMat);
    footMesh.position.set(-L * 0.05, baseY + IH * 0.38, 0);
    group.add(footMesh);
    this.objects.push(footMesh);
  }

  _buildCutPlane(group, L, W, BW, HW, IH, AR, SH, ST, TT, mat, scale) {
    // A vertical cut-plane showing the section
    const planeW = L * 1.05;
    const planeH = (IH + SH + ST + 4) * 1.1;
    const planeGeo = new THREE.PlaneGeometry(planeW, planeH, 1, 1);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xe8ddd3,
      roughness: 0.6,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.y = Math.PI / 2;
    planeMesh.position.set(0, ST + planeH / 2, 0);
    group.add(planeMesh);
    this.objects.push(planeMesh);

    // Cross-section edge line
    const linePts = [];
    const nPts = 60;
    for (let i = 0; i <= nPts; i++) {
      const t = i / nPts;
      const x = -L / 2 + t * L;
      let topH;
      if (t < 0.12) { topH = IH * 0.18 + (t / 0.12) * IH * 0.1; }
      else if (t < 0.45) { const s = (t - 0.12) / 0.33; topH = IH * 0.28 + s * IH * 0.72; }
      else if (t < 0.7) { const s = (t - 0.45) / 0.25; topH = IH - s * IH * 0.15; }
      else { const s = (t - 0.7) / 0.3; topH = IH * 0.85 + (SH > 0 ? Math.min(SH, SH * s * 2) : 0); }
      linePts.push(new THREE.Vector3(x, ST + topH, 0.01));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4a4540, linewidth: 2 });
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);
    this.objects.push(line);
  }

  setMode(mode) {
    if (this.shoeData) this.buildShoe(this.shoeData, mode);
  }
}

window.ShoeViewer = ShoeViewer;
