/*
 * main.js
 *
 * This module bootstraps a very simple 3D solar system using Three.js.  It
 * creates a sun and eight planets (plus the moon orbiting the earth) and
 * animates them about their orbits.  All distances and sizes are scaled
 * down dramatically to fit nicely in the browser viewport.  The user can
 * interact with the scene using OrbitControls: drag to rotate, scroll to
 * zoom and right‑click to pan.  Resize events are handled to keep the
 * renderer dimensions in sync with the window.
 */

// Import Three.js and OrbitControls from local copies in this project.  The
// local versions avoid cross-origin restrictions when serving this site
// from a file system or GitHub Pages.  The files `three.module.js` and
// `OrbitControls.js` were downloaded from the Three.js project via unpkg.
import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

// Planet configuration data.  The radius and distance values are in
// arbitrary units and scaled relative to the Earth.  Speeds are radians
// per frame and tuned for a pleasing animation rather than physical
// accuracy.
const PLANETS = [
  {
    name: 'Mercury',
    radius: 0.383,
    distance: 6,
    color: 0xb2b2b2,
    orbitSpeed: 0.02,
    rotationSpeed: 0.004,
  },
  {
    name: 'Venus',
    radius: 0.95,
    distance: 9,
    color: 0xeed4a0,
    orbitSpeed: 0.015,
    rotationSpeed: 0.0025,
  },
  {
    name: 'Earth',
    radius: 1,
    distance: 12,
    color: 0x2f78ff,
    orbitSpeed: 0.012,
    rotationSpeed: 0.02,
    // Each planet can optionally have satellites; Earth has the Moon.
    satellites: [
      {
        name: 'Moon',
        radius: 0.27,
        distance: 2.2,
        color: 0xdddddd,
        orbitSpeed: 0.04,
        rotationSpeed: 0.01,
      },
    ],
  },
  {
    name: 'Mars',
    radius: 0.53,
    distance: 16,
    color: 0xff5c33,
    orbitSpeed: 0.01,
    rotationSpeed: 0.018,
  },
  {
    name: 'Jupiter',
    radius: 11.2 * 0.3, // scaled down for visual coherence
    distance: 24,
    color: 0xf5d6a3,
    orbitSpeed: 0.005,
    rotationSpeed: 0.025,
  },
  {
    name: 'Saturn',
    radius: 9.45 * 0.3,
    distance: 32,
    color: 0xf8d8a0,
    orbitSpeed: 0.004,
    rotationSpeed: 0.022,
  },
  {
    name: 'Uranus',
    radius: 4.0 * 0.3,
    distance: 38,
    color: 0x66ccff,
    orbitSpeed: 0.0035,
    rotationSpeed: 0.018,
  },
  {
    name: 'Neptune',
    radius: 3.9 * 0.3,
    distance: 45,
    color: 0x3366ff,
    orbitSpeed: 0.003,
    rotationSpeed: 0.016,
  },
];

/**
 * Create a sphere mesh with a given radius and color.  A simple standard
 * material with flat shading is used to avoid the overhead of multiple
 * texture downloads.  The geometry subdivision values provide smooth
 * surfaces without being overly heavy.
 *
 * @param {number} radius The radius of the sphere.
 * @param {number} color  A hex color value.
 */
function createSphere(radius, color) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

/**
 * Build the solar system scene, including the sun, planets, satellites and
 * starfield.  Returns an object containing the scene, camera, renderer,
 * controls and a list of objects whose rotations should be updated each
 * frame.
 */
function buildSolarSystem() {
  // Create scene and camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 20, 80);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add ambient light and a point light at the sun's position to simulate
  // solar illumination.
  const ambientLight = new THREE.AmbientLight(0x404040, 1.2); // Soft global light
  scene.add(ambientLight);
  const sunLight = new THREE.PointLight(0xffffff, 2.5, 500);
  scene.add(sunLight);

  // Create the sun.  Use an emissive material to make it glow.  We still
  // apply a basic color so that it appears slightly orange.  Note that the
  // sun itself does not rotate or orbit within this simple simulation.
  const sunGeometry = new THREE.SphereGeometry(4, 48, 48);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffee88 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 0, 0);
  scene.add(sun);
  // Position the point light at the sun's location
  sunLight.position.copy(sun.position);

  // Create starfield: a large number of small points randomly distributed
  // in a sphere surrounding the solar system.  We generate them once
  // rather than in the animation loop to avoid performance penalties.
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    // Randomly position stars on a sphere of radius between 150 and 300
    const r = 150 + Math.random() * 150;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;
  }
  starGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(starPositions, 3)
  );
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);

  // Build planets and satellites.  Each planet is attached to a pivot
  // object positioned at the sun.  Rotating the pivot produces the orbit.
  // The actual planet mesh is offset along the x axis from the pivot.
  const orbitObjects = [];
  PLANETS.forEach((planetConfig) => {
    const planetPivot = new THREE.Object3D();
    scene.add(planetPivot);

    const planetMesh = createSphere(planetConfig.radius, planetConfig.color);
    // Move the planet out along the x axis to represent its orbital distance
    planetMesh.position.x = planetConfig.distance;
    planetPivot.add(planetMesh);

    orbitObjects.push({
      pivot: planetPivot,
      mesh: planetMesh,
      orbitSpeed: planetConfig.orbitSpeed,
      rotationSpeed: planetConfig.rotationSpeed,
    });

    // Satellites (e.g. the Moon).  Use a nested pivot so the moon orbits
    // around the planet while the planet orbits around the sun.  Keep track
    // of satellites separately so we can update their rotation speeds too.
    if (planetConfig.satellites) {
      planetConfig.satellites.forEach((satConfig) => {
        const satPivot = new THREE.Object3D();
        planetMesh.add(satPivot);
        const satMesh = createSphere(satConfig.radius, satConfig.color);
        satMesh.position.x = satConfig.distance;
        satPivot.add(satMesh);
        orbitObjects.push({
          pivot: satPivot,
          mesh: satMesh,
          orbitSpeed: satConfig.orbitSpeed,
          rotationSpeed: satConfig.rotationSpeed,
        });
      });
    }
  });

  // Set up orbit controls so the user can explore the scene.  Constrain
  // panning and zooming to sensible limits to keep the solar system in view.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 10;
  controls.maxDistance = 300;
  controls.maxPolarAngle = Math.PI / 2.1; // Prevent camera from going below the plane

  return { scene, camera, renderer, controls, orbitObjects };
}

function animateSystem(context) {
  const { renderer, scene, camera, controls, orbitObjects } = context;
  let previousTime = 0;

  function render(time) {
    const delta = time - previousTime;
    previousTime = time;

    // Update orbital rotations.  We multiply by delta to
    // maintain consistent speeds across machines; delta is in
    // milliseconds so convert to seconds.
    const deltaSeconds = delta * 0.001;
    orbitObjects.forEach((obj) => {
      obj.pivot.rotation.y += obj.orbitSpeed * deltaSeconds * 60;
      obj.mesh.rotation.y += obj.rotationSpeed * deltaSeconds * 60;
    });

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// Initialize everything once the page has loaded
function init() {
  const context = buildSolarSystem();
  animateSystem(context);
  // Adjust on resize to keep aspect ratio correct
  window.addEventListener('resize', () => {
    context.camera.aspect = window.innerWidth / window.innerHeight;
    context.camera.updateProjectionMatrix();
    context.renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Kick things off
init();