/* script.js for 3D Solar System Explorer */

// Set up scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lights
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Create the sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planet data: orbit radius, size, color, rotation speed
const planetsData = [
  { radius: 4, size: 0.3, color: 0x888888, speed: 0.02 }, // Mercury
  { radius: 6, size: 0.5, color: 0xffa500, speed: 0.015 }, // Venus
  { radius: 8, size: 0.5, color: 0x0000ff, speed: 0.01 }, // Earth
  { radius: 10, size: 0.4, color: 0xff0000, speed: 0.008 }, // Mars
  { radius: 13, size: 1.2, color: 0xffe4b5, speed: 0.006 }, // Jupiter
  { radius: 16, size: 1.0, color: 0xf5deb3, speed: 0.005 }, // Saturn
  { radius: 18, size: 0.7, color: 0xadd8e6, speed: 0.004 }, // Uranus
  { radius: 20, size: 0.6, color: 0x4169e1, speed: 0.003 }  // Neptune
];

const planetPivots = [];

planetsData.forEach(data => {
  const pivot = new THREE.Object3D();
  scene.add(pivot);
  const geometry = new THREE.SphereGeometry(data.size, 32, 32);
  const material = new THREE.MeshPhongMaterial({ color: data.color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = data.radius;
  pivot.add(mesh);
  planetPivots.push({ pivot: pivot, speed: data.speed });
});

// Set initial camera position
let yaw = 0;
let pitch = 0;
const camRadius = 30;
camera.position.set(0, 5, camRadius);
camera.lookAt(sun.position);

// Handle resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Set up joystick using nipplejs
const joystickContainer = document.getElementById('joystick-container');
const joystick = nipplejs.create({
  zone: joystickContainer,
  mode: 'static',
  position: { left: '50%', top: '50%' },
  color: 'white'
});

let moveX = 0;
let moveY = 0;
joystick.on('move', (evt, data) => {
  const rad = data.angle.radian;
  const distance = Math.min(data.distance / 50, 1);
  moveX = Math.cos(rad) * distance;
  moveY = Math.sin(rad) * distance;
});

joystick.on('end', () => {
  moveX = 0;
  moveY = 0;
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update planet orbits
  planetPivots.forEach(obj => {
    obj.pivot.rotation.y += obj.speed;
  });

  // Update camera rotation based on joystick input
  yaw -= moveX * 0.05;
  pitch += moveY * 0.05;
  const maxPitch = Math.PI / 2 - 0.1;
  pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

  camera.position.x = camRadius * Math.cos(pitch) * Math.sin(yaw);
  camera.position.y = camRadius * Math.sin(pitch);
  camera.position.z = camRadius * Math.cos(pitch) * Math.cos(yaw);
  camera.lookAt(sun.position);

  renderer.render(scene, camera);
}

animate();
