let scene,
camera,
renderer,
orbitControls,
sphereMesh,
simplexNoiseArr;

const simplexNoise = new SimplexNoise();

const render = () => {
  let timeStamp = Date.now() * 0.01;

  sphereMesh.material.uniforms.textureAmplitude.value = Math.sin(timeStamp * 0.01) + Math.sin(timeStamp * 0.01);
  sphereMesh.material.uniforms.color.value.offsetHSL(0.001, 0, 0);

  const position = sphereMesh.geometry.attributes.position.array;
  const displacement = sphereMesh.geometry.attributes.displacement.array;

  for (let i = 0; i < position.length; i += 3) {
    simplexNoiseArr[i] = Math.sin(timeStamp * 0.05) * 16 * simplexNoise.noise3D(position[i] + timeStamp * 0.08, position[i + 1] + timeStamp * 0.09, position[i + 2] + timeStamp * 0.084);
  }

  for (let i = 0; i < displacement.length; i++) {
    displacement[i] = Math.sin(timeStamp + i * 0.1) * Math.sin(timeStamp * 0.01) * 5;
    displacement[i] += simplexNoiseArr[i];
  }

  sphereMesh.geometry.attributes.displacement.needsUpdate = true;

  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

const onResize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

const getTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const imgDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgDataObj.data;
  let yOffset = 0;
  for (let y = 0; y < canvas.height; y++) {
    let xOffset = 0;
    for (let x = 0; x < canvas.width; x++) {
      const index = (x + y * canvas.width) * 4;
      const c = 255 * simplexNoise.noise2D(xOffset, yOffset) + 255;
      data[index] = c;
      data[index + 1] = c;
      data[index + 2] = c;
      data[index + 3] = 255;
      xOffset += 0.04;
    }
    yOffset += 0.04;
  }
  ctx.putImageData(imgDataObj, 0, 0);
  document.body.appendChild(canvas);
  texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
};

function init() {

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 340;
  camera.lookAt(scene.position);

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(new THREE.Color(0x000000));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('WebGL-output').appendChild(renderer.domElement);

  /* OrbitControls
  --------------------------------------*/
  orbitControls = new THREE.OrbitControls(camera);
  orbitControls.autoRotate = false;

  /* Mesh
  --------------------------------------*/
  const sphereBufferGeometry = new THREE.SphereBufferGeometry(100, 128, 64);
  const positionNum = sphereBufferGeometry.attributes.position.count;
  simplexNoiseArr = new Float32Array(sphereBufferGeometry.attributes.position.count);
  sphereBufferGeometry.addAttribute('displacement', new THREE.BufferAttribute(new Float32Array(positionNum), 1));

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: {
        type: 'c',
        value: new THREE.Color(0x0aa0f0) },

      texture: {
        type: 't',
        value: getTexture() },

      textureAmplitude: {
        type: 'f',
        value: 1.0 } },


    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: document.getElementById('vs').textContent,
    fragmentShader: document.getElementById('fs').textContent });

  shaderMaterial.uniforms.texture.value.wrapS = THREE.RepeatWrapping;
  shaderMaterial.uniforms.texture.value.wrapT = THREE.RepeatWrapping;
  sphereMesh = new THREE.Mesh(sphereBufferGeometry, shaderMaterial);
  scene.add(sphereMesh);

  /* OrbitControls
  -------------------------------------------------------------*/
  orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
  orbitControls.autoRotate = false;
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.15;

  /* resize
  -------------------------------------------------------------*/
  window.addEventListener('resize', onResize);

  /* rendering start
  -------------------------------------------------------------*/
  document.getElementById('WebGL-output').appendChild(renderer.domElement);
  render();

}

window.onload = init;