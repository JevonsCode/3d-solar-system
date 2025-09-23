/**
 * app.js
 * Entry point for the 3D Solar System Explorer.
 * This script initializes Three.js scene, camera, renderer, lights, celestial bodies,
 * and sets up a virtual joystick using nipplejs to allow users to orbit the camera
 * around the solar system.
 */

(function() {
  // Create a new Three.js scene
  const scene = new THREE.Scene();

  // Perspective camera: fov, aspect ratio, near and far clipping planes
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Renderer with antialiasing for smoother edges
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add ambient and directional lighting to the scene
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Create the sun at the center of the scene
  const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Definitions of orbital parameters for each planet
  const orbitData = [
    { radius: 5, size: 0.4, speed: 0.02, color: 0xa8a9ad }, // Mercury
    { radius: 7, size: 0.6, speed: 0.015, color: 0xe0c16f }, // Venus
    { radius: 9, size: 0.6, speed: 0.013, color: 0x2d7dd2 }, // Earth
    { radius: 11, size: 0.4, speed: 0.011, color: 0xff8040 }, // Mars
    { radius: 15, size: 1.0, speed: 0.008, color: 0xe5c07b }, // Jupiter
    { radius: 19, size: 0.9, speed: 0.006, color: 0xd7af70 }, // Saturn
    { radius: 23, size: 0.8, speed: 0.004, color: 0x7fb4ff }, // Uranus
    { radius: 27, size: 0.7, speed: 0.003, color: 0x5875e1 }  // Neptune
  ];

  // Array to store generated planet meshes
  const planets = [];

  /**
   * Create a planet mesh and store orbital data in userData.
   * @param {Object} data Planet parameters including orbit radius, size, color and speed.
   * @returns {THREE.Mesh} The created planet mesh.
   */
  function createPlanet(data) {
    const geometry = new THREE.SphereGeometry(data.size, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: data.color });
    const mesh = new THREE.Mesh(geometry, material);

    // Attach orbit parameters for use in animation
    mesh.userData = {
      orbitRadius: data.radius,
      angle: Math.random() * Math.PI * 2,
      speed: data.speed
    };

    scene.add(mesh);
    return mesh;
  }

  // Create each planet defined in orbitData
  orbitData.forEach(data => {
    planets.push(createPlanet(data));
  });

  // Initialize a static virtual joystick in the specified container
  const joystickManager = nipplejs.create({
    zone: document.getElementById('joystick-container'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'white'
  });

  // Joystick vector that captures the x (horizontal) and y (vertical) movement
  let joystickVector = { x: 0, y: 0 };

  joystickManager.on('move', (_, data) => {
    joystickVector.x = data.vector.x;
    joystickVector.y = data.vector.y;
  });

  joystickManager.on('end', () => {
    joystickVector.x = 0;
    joystickVector.y = 0;
  });

  // Distance from the scene origin to the camera
  const cameraDistance = 40;
  // Spherical coordinate angles for camera position
  let phi = 0;   // rotation around the vertical (Y) axis
  let theta = 0; // rotation around the horizontal (X) axis

  /**
   * Update each planet's position around the sun based on its orbital speed.
   */
  function updatePlanets() {
    planets.forEach(planet => {
      const ud = planet.userData;
      ud.angle += ud.speed;
      planet.position.set(
        ud.orbitRadius * Math.cos(ud.angle),
        0,
        ud.orbitRadius * Math.sin(ud.angle)
      );
    });
  }

  /**
   * Update the camera's spherical coordinates based on joystick input and
   * convert them into Cartesian coordinates.
   */
  function updateCamera() {
    // Adjust the angles using joystick input for smooth camera orbit
    phi   -= joystickVector.x * 0.05;
    theta -= joystickVector.y * 0.05;

    // Limit vertical angle to avoid unnatural flips
    const maxTheta = Math.PI / 2 - 0.1;
    const minTheta = -maxTheta;
    theta = Math.max(minTheta, Math.min(maxTheta, theta));

    // Convert spherical coordinates to Cartesian coordinates
    const x = cameraDistance * Math.cos(theta) * Math.sin(phi);
    const y = cameraDistance * Math.sin(theta);
    const z = cameraDistance * Math.cos(theta) * Math.cos(phi);

    camera.position.set(x, y, z);
    camera.lookAt(scene.position);
  }

  /**
   * The animation loop called on every frame.
   */
  function animate() {
    requestAnimationFrame(animate);

    updatePlanets();
    updateCamera();

    renderer.render(scene, camera);
  }

  // Start animation
  animate();

  // Update renderer and camera aspect on resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
