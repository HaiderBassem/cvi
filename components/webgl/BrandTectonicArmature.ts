import * as THREE from 'three';

export type ShadingMode = 'pbr' | 'wireframe' | 'clay';

export interface SpatialProjectPanel {
  title: string;
  location: string;
  scale: string;
  year: string;
  imageUrl: string;
  mesh: THREE.Mesh;
}

export class BrandTectonicArmature {
  public group: THREE.Group;
  public currentMode: ShadingMode = 'pbr';
  public interiorLight: THREE.PointLight;
  private meshes: THREE.Mesh[] = [];
  private edgeLines: THREE.LineSegments[] = [];
  private brandGlyphsGroup: THREE.Group;
  private projectPlanesGroup: THREE.Group;
  private materials: {
    travertine: THREE.MeshStandardMaterial;
    skyblue: THREE.MeshStandardMaterial;
    concrete: THREE.MeshStandardMaterial;
    edgeLine: THREE.LineBasicMaterial;
    wireframe: THREE.MeshBasicMaterial;
    clay: THREE.MeshStandardMaterial;
  };

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'CVI_Brand_Tectonic_Armature';

    this.materials = {
      travertine: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e4decb'),
        roughness: 0.55,
        metalness: 0.12,
      }),
      skyblue: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#4cb8f5'),
        roughness: 0.22,
        metalness: 0.88,
      }),
      concrete: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1c1d22'),
        roughness: 0.85,
        metalness: 0.08,
      }),
      edgeLine: new THREE.LineBasicMaterial({
        color: new THREE.Color('#7cc8f8'),
        transparent: true,
        opacity: 0.5,
      }),
      wireframe: new THREE.MeshBasicMaterial({
        color: new THREE.Color('#4cb8f5'),
        wireframe: true,
      }),
      clay: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f2eee5'),
        roughness: 0.9,
        metalness: 0.0,
      }),
    };

    this.interiorLight = new THREE.PointLight(new THREE.Color('#8fd3ff'), 2.0, 10);
    this.interiorLight.position.set(0, 1.0, 0);
    this.group.add(this.interiorLight);

    this.brandGlyphsGroup = new THREE.Group();
    this.projectPlanesGroup = new THREE.Group();

    this.group.add(this.brandGlyphsGroup);
    this.group.add(this.projectPlanesGroup);

    this.buildBrandSculpture();
    this.buildProjectSpatialPanels();
    this.buildDatumRings();
  }

  /**
   * Builds an abstract architectural brand sculpture derived from the C-V-I tectonic identity:
   * Non-project brand artifact combining curved cantilevered shells (C), converging angular blades (V),
   * and a central vertical structural pier (I).
   */
  private buildBrandSculpture() {
    // 1. Central Vertical Obelisk / Pier ("I" - Monumental Axis)
    const pierGeo = new THREE.BoxGeometry(0.5, 5.0, 0.5);
    const pierMesh = new THREE.Mesh(pierGeo, this.materials.travertine);
    pierMesh.position.set(0, 1.2, 0);
    this.brandGlyphsGroup.add(pierMesh);
    this.meshes.push(pierMesh);
    this.addEdge(pierMesh, pierGeo);

    // 2. Converging Angular Fins ("V" - Tectonic Cantilever)
    const finLeftGeo = new THREE.BoxGeometry(0.12, 4.2, 1.4);
    const finLeft = new THREE.Mesh(finLeftGeo, this.materials.skyblue);
    finLeft.position.set(-0.8, 1.4, 0);
    finLeft.rotation.z = Math.PI * 0.12;
    finLeft.rotation.y = Math.PI * 0.08;
    this.brandGlyphsGroup.add(finLeft);
    this.meshes.push(finLeft);
    this.addEdge(finLeft, finLeftGeo);

    const finRightGeo = new THREE.BoxGeometry(0.12, 4.2, 1.4);
    const finRight = new THREE.Mesh(finRightGeo, this.materials.skyblue);
    finRight.position.set(0.8, 1.4, 0);
    finRight.rotation.z = -Math.PI * 0.12;
    finRight.rotation.y = -Math.PI * 0.08;
    this.brandGlyphsGroup.add(finRight);
    this.meshes.push(finRight);
    this.addEdge(finRight, finRightGeo);

    // 3. Semicircular Curved Cantilever Shell ("C" - Spatial Enclosure)
    const curveGeo = new THREE.CylinderGeometry(1.9, 2.1, 0.45, 32, 1, true, 0, Math.PI * 1.3);
    const curveMesh = new THREE.Mesh(curveGeo, this.materials.travertine);
    curveMesh.position.set(0, 1.8, 0);
    curveMesh.rotation.y = Math.PI * 0.35;
    this.brandGlyphsGroup.add(curveMesh);
    this.meshes.push(curveMesh);

    const curveEdges = new THREE.EdgesGeometry(curveGeo);
    const curveLine = new THREE.LineSegments(curveEdges, this.materials.edgeLine);
    curveMesh.add(curveLine);
    this.edgeLines.push(curveLine);

    // 4. Stepped Foundation Plinth (3 tiers)
    for (let i = 0; i < 3; i++) {
      const plinthGeo = new THREE.BoxGeometry(3.6 + i * 0.8, 0.15, 3.2 + i * 0.8);
      const plinth = new THREE.Mesh(plinthGeo, this.materials.concrete);
      plinth.position.y = -1.2 - i * 0.18;
      this.brandGlyphsGroup.add(plinth);
      this.meshes.push(plinth);
      this.addEdge(plinth, plinthGeo);
    }
  }

  /**
   * Projects authentic CVI project imagery on floating 3D spatial planes
   * arranged radially around the studio armature.
   */
  private buildProjectSpatialPanels() {
    const loader = new THREE.TextureLoader();

    const authenticProjects = [
      {
        title: 'Budoor Al-Najaf',
        location: 'Najaf, Iraq',
        scale: '500,000 m²',
        year: '2025',
        image: '/uploads/1770556108595-hzmq4d083wd.jpg', // Real Masterplan
        angle: 0,
      },
      {
        title: 'Al-Fayha Towers',
        location: 'Babylon, Iraq',
        scale: '14,224 m²',
        year: '2025',
        image: '/uploads/1769245974236-vnyiqvcpdh.png', // Real Evening Tower
        angle: Math.PI * 0.5,
      },
      {
        title: 'Mall Al-Ghadeer',
        location: 'Karbala, Iraq',
        scale: '3,900 m²',
        year: '2024',
        image: '/uploads/1754381434772-q0vd8p1h27a.jpg', // Real Technical Elevation
        angle: Math.PI,
      },
      {
        title: 'Albina Workshop',
        location: 'Najaf, Iraq',
        scale: '128,325 m²',
        year: '2024',
        image: '/uploads/1760268511393-veyyqdsecp.png', // Real Axonometric
        angle: Math.PI * 1.5,
      },
    ];

    const radius = 4.8;
    const panelWidth = 2.4;
    const panelHeight = 1.5;

    authenticProjects.forEach((proj) => {
      const texture = loader.load(proj.image);
      const panelMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const panelGeo = new THREE.PlaneGeometry(panelWidth, panelHeight);
      const panelMesh = new THREE.Mesh(panelGeo, panelMat);

      const x = Math.sin(proj.angle) * radius;
      const z = Math.cos(proj.angle) * radius;
      panelMesh.position.set(x, 1.2, z);
      panelMesh.lookAt(0, 1.2, 0);
      panelMesh.rotateY(Math.PI); // Face outward

      // Frame around the project panel
      const frameGeo = new THREE.BoxGeometry(panelWidth + 0.08, panelHeight + 0.08, 0.03);
      const frameMesh = new THREE.Mesh(frameGeo, this.materials.skyblue);
      panelMesh.add(frameMesh);
      this.meshes.push(frameMesh);
      this.addEdge(frameMesh, frameGeo);

      this.projectPlanesGroup.add(panelMesh);
    });
  }

  private buildDatumRings() {
    // 3D CAD Datum Ring (Baghdad studio ground level)
    const ringGeo = new THREE.RingGeometry(5.2, 5.23, 64);
    ringGeo.rotateX(Math.PI * 0.5);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4cb8f5'),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -1.1;
    this.group.add(ring);
  }

  private addEdge(mesh: THREE.Mesh, geo: THREE.BufferGeometry) {
    const edges = new THREE.EdgesGeometry(geo, 25);
    const line = new THREE.LineSegments(edges, this.materials.edgeLine);
    mesh.add(line);
    this.edgeLines.push(line);
  }

  public setShadingMode(mode: ShadingMode) {
    this.currentMode = mode;

    this.meshes.forEach((mesh) => {
      if (mode === 'wireframe') {
        mesh.material = this.materials.wireframe;
      } else if (mode === 'clay') {
        mesh.material = this.materials.clay;
      } else {
        if (mesh.parent === this.brandGlyphsGroup && mesh.geometry.type.includes('Box') && mesh.scale.x < 0.2) {
          mesh.material = this.materials.skyblue;
        } else if (mesh.position.y < 0) {
          mesh.material = this.materials.concrete;
        } else {
          mesh.material = this.materials.travertine;
        }
      }
    });

    this.edgeLines.forEach((l) => {
      l.visible = mode !== 'wireframe';
    });
  }

  public setNightMode(isNight: boolean) {
    if (isNight) {
      this.interiorLight.intensity = 4.5;
      this.interiorLight.color.set('#5ec6ff');
      this.materials.edgeLine.opacity = 0.75;
    } else {
      this.interiorLight.intensity = 2.0;
      this.interiorLight.color.set('#8fd3ff');
      this.materials.edgeLine.opacity = 0.5;
    }
  }

  public update(time: number) {
    // Subtle rotation of authentic project panels orbiting the studio armature
    this.projectPlanesGroup.rotation.y = time * 0.04;
    // Gentle breathing louver rotation
    this.brandGlyphsGroup.rotation.y = Math.sin(time * 0.3) * 0.06;
  }

  public dispose() {
    Object.values(this.materials).forEach((m) => m.dispose());
    this.meshes.forEach((m) => m.geometry.dispose());
  }
}
