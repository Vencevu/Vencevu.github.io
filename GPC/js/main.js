import { GUI } from '../lib/lil-gui.module.min.js';
import * as THREE from '../lib/three.module.js';
import {OrbitControls} from "../lib/OrbitControls.module.js"
import { GLTFLoader } from '../lib/GLTFLoader.module.js';
import { FBXLoader } from '../lib/FBXLoader.js';
import * as CANNON from "../lib/cannon-es.js";
import CannonDebugger from "../lib/cannon-es-debugger.js";
import { TWEEN } from '../lib/tween.module.min.js';

let elThreejs = document.getElementById("threejs");
let camera,scene,renderer;

let axesHelper;
let controls;
let gui;

let cubeThree;
let keyboard = {};

// camera follow player
let enableFollow = true;

// cannon variables
let world;
let cannonDebugger;
let timeStep = 1 / 60;
let cubeBody, planeBody, planeThree;
let slipperyMaterial, groundMaterial;
let obstacleBody;
let mountainMesh, domeMesh;
let obstaclesBodies = [];
let obstaclesMeshes = [];
let roadMesh = [];
init();

async function init() {

  // Scene
	scene = new THREE.Scene();

  // Camera
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
    camera.position.z = 10;
    camera.position.y = 5;


  // render
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.outputEncoding = THREE.sRGBEncoding;

    const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set( 1, 10, 6);
    scene.add(light);

    // orbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0
    controls.zoomSpeed = 1.2
    controls.enablePan = false
    controls.dampingFactor = 0.2
    controls.minDistance = 10
    controls.maxDistance = 500
    controls.enabled = false

	elThreejs.appendChild(renderer.domElement);

    initCannon();

    await addBackground();

    addPlaneBody();
    addPlane();

    addCubeBody();
    await addCube();

    addObstacleBody();
    addObstacle();

    addContactMaterials();

    addKeysListener();
    addGUI();

    animate();
    window.addEventListener('resize', updateAspectRatio);
}

function getAxisAndAngelFromQuaternion(q) {
	var angle = 2 * Math.acos(q.w);
	var s;
	if (1 - q.w * q.w < 0.000001) {
	  // test to avoid divide by zero, s is always positive due to sqrt
	  // if s close to zero then direction of axis not important
	  // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/
	  s = 1;
	} else { 
	  s = Math.sqrt(1 - q.w * q.w);
	}
	return { axis: new THREE.Vector3(q.x/s, q.y/s, q.z/s), angle };
  }

function animate(){
	renderer.render(scene, camera);

    movePlayer();

    if (enableFollow) followPlayer();

    world.step(timeStep);
    cannonDebugger.update();

    cubeThree.position.copy(cubeBody.position);

    var my_axis = getAxisAndAngelFromQuaternion(cubeBody.quaternion).axis;
    var my_angle = getAxisAndAngelFromQuaternion(cubeBody.quaternion).angle;
    cubeThree.quaternion.setFromAxisAngle(my_axis, my_angle);
	

    for (let i = 0; i < obstaclesBodies.length; i++) {
        obstaclesMeshes[i].position.copy(obstaclesBodies[i].position);
		obstaclesMeshes[i].quaternion.copy(obstaclesBodies[i].quaternion);
	}

    planeBody.position.z -= 0.1
	mountainMesh.position.z -= 0.1
	domeMesh.position.z -= 0.1
    planeThree.position.copy(planeBody.position)
	requestAnimationFrame(animate);
    TWEEN.update()}

function addCubeBody(){
  let cubeShape = new CANNON.Box(new CANNON.Vec3(1.5,3,0.6));
  slipperyMaterial = new CANNON.Material('slippery');
  cubeBody = new CANNON.Body({ mass: 100,material: slipperyMaterial });
  cubeBody.addShape(cubeShape, new CANNON.Vec3(0,0,0));

  // change rotation
  var q1 = new THREE.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 180 * -90);
  var q2 = new THREE.Quaternion().setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 180 * 180);
  var q = new THREE.Quaternion().multiplyQuaternions(q1, q2);
  cubeBody.quaternion.copy(q);
  cubeBody.position.set(0, 8, 0);

  cubeBody.linearDamping = 0.5;

  world.addBody(cubeBody);
}

async function addCube(){

    const fbxloader = new FBXLoader().setPath('assets/');
    const carLoaddedd = await fbxloader.loadAsync( 'Maserati.fbx' );
    cubeThree = carLoaddedd.children[0];
    scene.add(cubeThree);
    cubeThree.scale.x = 0.05
    cubeThree.scale.y = 0.05
    cubeThree.scale.z = 0.05
}


function addPlaneBody(){
    groundMaterial = new CANNON.Material('ground')
    const planeShape = new CANNON.Box(new CANNON.Vec3(10, 0.01, 150));
    planeBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    planeBody.addShape(planeShape);
    planeBody.position.set(0, 0, -90);
    planeBody.velocity.set(0,0,5);
	world.addBody(planeBody);

}



function addPlane(){
  const texture = new THREE.TextureLoader().load( "assets/plane.png" );

  let geometry =  new THREE.BoxGeometry(20, 0, 300);
  let material = new THREE.MeshBasicMaterial({map: texture});
  planeThree = new THREE.Mesh(geometry, material);
  planeThree.position.set(0, 0, -90);
  scene.add(planeThree);
}

function addObstacleBody(){

  for (let i = 0; i < 5; i++) {
    let obstacleShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    obstacleBody = new CANNON.Body({ mass: 1 });
    obstacleBody.addShape(obstacleShape);
    obstacleBody.position.set(0, 5,-(i+1) * 15);

    world.addBody(obstacleBody);
    obstaclesBodies.push(obstacleBody);

  }
}

function addObstacle(){
 
  let geometry = new THREE.BoxGeometry(2,2,2);
  const texture = new THREE.TextureLoader().load( "assets/obstacle.png" );

  let material = new THREE.MeshBasicMaterial({ map: texture});

  let obstacle = new THREE.Mesh(geometry, material);

  for (let i = 0; i < 5; i++) {
		let obstacleMesh = obstacle.clone();
		scene.add(obstacleMesh);
		obstaclesMeshes.push(obstacleMesh);
	}
}


function addContactMaterials(){
  const slippery_ground = new CANNON.ContactMaterial(groundMaterial, slipperyMaterial, {
    friction: 0.00,
    restitution: 0.1, //bounciness
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
  })

  // We must add the contact materials to the world
  world.addContactMaterial(slippery_ground)

}


function addKeysListener(){
  window.addEventListener('keydown', function(event){
    keyboard[event.keyCode] = true;
  } , false);
  window.addEventListener('keyup', function(event){
    keyboard[event.keyCode] = false;
  } , false);
}

function movePlayer(){

  // up letter W
  // if(keyboard[87]) cubeThree.position.z -= 0.1
  // if(keyboard[87]) cubeThree.translateZ(-0.1);

  const strengthWS = 500;
  const forceForward = new CANNON.Vec3(0, -strengthWS, 0)
  if(keyboard[87]) cubeBody.applyLocalForce(forceForward);

  // down letter S
  const forceBack = new CANNON.Vec3(0, strengthWS, 0)
  if(keyboard[83]) cubeBody.applyLocalForce(forceBack);

  // left letter A
  // if(keyboard[65]) cube.rotation.y += 0.01;
  // if(keyboard[65]) cube.rotateY(0.01);

  const strengthAD = 600;
  const forceLeft= new CANNON.Vec3(0, strengthAD, 0)
  if(keyboard[65]) cubeBody.applyTorque(forceLeft);

  // right letter D
  const forceRigth= new CANNON.Vec3(0, -strengthAD, 0)
  if(keyboard[68]) cubeBody.applyTorque(forceRigth);

}


function followPlayer(){
  camera.position.x = cubeThree.position.x;
  camera.position.y = cubeThree.position.y + 5;
  camera.position.z = cubeThree.position.z + 10;
}


function addGUI(){
  gui = new GUI();
  const options = {
		orbitsControls: false
	}

  gui.add(options, 'orbitsControls').onChange( value => {
		if (value){
			controls.enabled = true;
			enableFollow = false;
		}else{
			controls.enabled = false;
			enableFollow = true;
		}
	});
  gui.hide();


  // show and hide GUI if user press g
  window.addEventListener('keydown', function(event){
    if(event.keyCode == 71){
      if(gui._hidden){
        gui.show();
      }else{
        gui.hide();
      }
    }
  })


}

function initCannon() {
	// Setup world
	world = new CANNON.World();
	world.gravity.set(0, -9.8, 0);

	initCannonDebugger();
}

function initCannonDebugger(){
  cannonDebugger = new CannonDebugger(scene, world, {
		onInit(body, mesh) {
      mesh.visible = false;
			// Toggle visibiliy on "d" press
			document.addEventListener("keydown", (event) => {
				if (event.key === "f") {
					mesh.visible = !mesh.visible;
				}
			});
		},
	});
}

function createCustomShape(){
  const vertices = [
		new CANNON.Vec3(2, 0, 0),
		new CANNON.Vec3(2, 0, 2),
		new CANNON.Vec3(2, 2, 0),
		new CANNON.Vec3(0, 0, 0),
		new CANNON.Vec3(0, 0, 2),
		new CANNON.Vec3(0, 2, 0),
	]

	return new CANNON.ConvexPolyhedron({
		vertices,
		faces: [
      [3, 4, 5],
			[2, 1, 0],
			[1,2,5,4],
			[0,3,4,1],
			[0,2,5,3],
		]
	})
}

async function addBackground(){
	const gltfLoader = new GLTFLoader().setPath( 'assets/' );

	const mountainLoaded = await gltfLoader.loadAsync( 'mountain.glb' );
	mountainMesh = mountainLoaded.scene.children[0];
	mountainMesh.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 180 *90);
	mountainMesh.position.set(0, 60, -90);
	mountainMesh.scale.set(0.008,0.008,0.008);
	scene.add(mountainMesh);

	const domeLoaded = await gltfLoader.loadAsync( 'skydome.glb' );
	domeMesh = domeLoaded.scene.children[0];
	domeMesh.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 180 *90);
	domeMesh.position.set(0, -40, 0);
	domeMesh.scale.set(0.1, 0.1, 0.1);
	scene.add(domeMesh);
}

function updateAspectRatio()
{
    // Cambia las dimensiones del canvas
    renderer.setSize(window.innerWidth,window.innerHeight);

    // Nuevo relacion aspecto de la camara
    const ar = window.innerWidth/window.innerHeight;

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}