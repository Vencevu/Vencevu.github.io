import { GUI } from '../lib/lil-gui.module.min.js';
import * as THREE from '../lib/three.module.js';
import {OrbitControls} from "../lib/OrbitControls.module.js"
import { GLTFLoader } from '../lib/GLTFLoader.module.js';
import { FBXLoader } from '../lib/FBXLoader.js';
import * as CANNON from "../lib/cannon-es.js";
import CannonDebugger from "../lib/cannon-es-debugger.js";
import { TWEEN } from '../lib/tween.module.min.js';

let elThreejs = document.getElementById("threejs");
let camera,scene,renderer, obstacles, field, actor;

let jumpEnabled = true;
let controls;
let gui;

let cubeThree;
let keyboard = {};
let game_over = false;
let puntos = 0;
let enabledPoints = []
// camera follow player
let enableFollow = true;

// cannon variables
let world;
let cannonDebugger;
let timeStep = 1 / 60;
let cubeBody, planeBody, carMaterial;
let mountainMesh, domeMesh;
let obstaclesBodies = [];
let obstaclesMeshes = [];
let obstaclesBodies2 = [];
let obstaclesMeshes2 = [];
let numOfObstacles = 0;
let maxObstacles = 5;
let turbo = 100
let roadMesh = []
let roadBody = []
let obstacleType2 = false;
let reset = false;
let light;
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
	renderer.antialias = true;
	renderer.outputEncoding = THREE.sRGBEncoding;

    const ambient = new THREE.AmbientLight(0x222222);
    scene.add(ambient);

    light = new THREE.PointLight(0xFFFFFF, 0.5);
    light.position.set( 0, 20, 0);
	light.castShadow = true;
	light.shadow.camera.far = 50;
    scene.add(light);
	//scene.add(new THREE.CameraHelper(light.shadow.camera));

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
	obstacles = new THREE.Object3D();
	field = new THREE.Object3D();
	actor = new THREE.Object3D();
    await addBackground();

    var gM = addPlane();
    carMaterial = addCubeBody();
	await addCube();//El modelo tiene millones de poligonos
	addContactMaterials(gM, carMaterial);

    addKeysListener();
    addGUI();
	scene.add(obstacles);
	scene.add(field);
	scene.add(actor);

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

function resetWorld(){
	obstaclesBodies.forEach((item) => {
		world.removeBody(item);
	});
	obstaclesBodies = []

	obstaclesBodies2.forEach((item) => {
		world.removeBody(item);
	});
	obstaclesBodies2 = []

	obstaclesMeshes.forEach((item) => {
		obstacles.remove(item);
	});
	obstaclesMeshes = []

	obstaclesMeshes2.forEach((item) => {
		obstacles.remove(item);
	});
	obstaclesMeshes2 = []

	roadMesh.forEach((item) => {
		field.remove(item);
	});
	roadMesh = []

	roadBody.forEach((item) => {
		world.removeBody(item);
	});
	roadBody = []

	world.removeBody(cubeBody);
	carMaterial = addCubeBody();
	var gM = addPlane();
	addContactMaterials(gM, carMaterial);
}

function animate(){
	if(game_over) {
		document.getElementById("gameover").style.visibility = 'visible';
		//Restart
		if(keyboard[82] && !reset){
			puntos = 0
			document.querySelector('#puntuacion label').innerText = 'Puntos: ' + puntos;
			reset = true
			game_over = false;
			turbo = 100;
			document.querySelector('#turbo label').innerText = 'Turbo: ' + turbo;
			obstacleType2 = false;
			numOfObstacles = 0;
			document.getElementById("gameover").style.visibility = 'hidden';
			
			resetWorld();
		}
		requestAnimationFrame(animate);
		return;
	}
	renderer.render(scene, camera);

    movePlayer();
	light.position.set(cubeBody.position.x, 20+cubeBody.position.y, cubeBody.position.z);

    if (enableFollow) followPlayer();

    world.step(timeStep);
    cannonDebugger.update();

    cubeThree.position.copy(cubeBody.position);

    var my_axis = getAxisAndAngelFromQuaternion(cubeBody.quaternion).axis;
    var my_angle = getAxisAndAngelFromQuaternion(cubeBody.quaternion).angle;
    cubeThree.quaternion.setFromAxisAngle(my_axis, my_angle);
	
	while(numOfObstacles < maxObstacles && !obstacleType2) {
		const x = THREE.MathUtils.randFloatSpread(20);
		const y = THREE.MathUtils.randFloatSpread(10);
		const z = THREE.MathUtils.randFloat(40, 60);
		addObstacle(x, y, z, 100);
		numOfObstacles++;
	}

	if(cubeBody.position.y < -10) game_over = true;

	if(puntos % 15 == 0 && !obstacleType2) {
		addObstacle2(70, 200);
		obstacleType2 = true;
		
	}

	for (let i = 0; i < obstaclesBodies2.length; i++) {
        obstaclesMeshes2[i].position.copy(obstaclesBodies2[i].position);
		obstaclesMeshes2[i].quaternion.copy(obstaclesBodies2[i].quaternion);
		if(obstaclesBodies2[i].position.z > cubeBody.position.z){
			if(!containsObject(obstaclesBodies2[i], enabledPoints)){
				puntos+=3;
				if(turbo < 100) turbo+=20;
				document.querySelector('#turbo label').innerText = 'Turbo: ' + turbo;
				enabledPoints.push(obstaclesBodies2[i])
				document.querySelector('#puntuacion label').innerText = 'Puntos: ' + puntos;
			}
		}
		if(obstaclesBodies2[i].position.z -20 > cubeBody.position.z || obstaclesBodies2[i].position.y < -5){
			world.removeBody(obstaclesBodies2[i]);
			obstacles.remove(obstaclesMeshes2[i]);
			obstaclesBodies2.splice(i, 1);
			obstaclesMeshes2.splice(i, 1);
			obstacleType2 = false;
		}
	}
	
    for (let i = 0; i < obstaclesBodies.length; i++) {
        obstaclesMeshes[i].position.copy(obstaclesBodies[i].position);
		obstaclesMeshes[i].quaternion.copy(obstaclesBodies[i].quaternion);
		if(obstaclesBodies[i].position.z > cubeBody.position.z){
			if(!containsObject(obstaclesBodies[i], enabledPoints)){
				puntos++;
				if(turbo < 100) turbo+=10;
				document.querySelector('#turbo label').innerText = 'Turbo: ' + turbo;
				enabledPoints.push(obstaclesBodies[i])
				document.querySelector('#puntuacion label').innerText = 'Puntos: ' + puntos;
			}
		}
		if(obstaclesBodies[i].position.z -10 > cubeBody.position.z || obstaclesBodies[i].position.y < -5){
			world.removeBody(obstaclesBodies[i]);
			obstacles.remove(obstaclesMeshes[i]);
			obstaclesBodies.splice(i, 1);
			obstaclesMeshes.splice(i, 1);
			numOfObstacles--;
		}
	}
	mountainMesh.position.z = cubeBody.position.z;
	domeMesh.position.z = cubeBody.position.z;

	if(Math.round(cubeBody.position.z) % 120 == 0 && roadMesh.length < 3){
		var gM = addPlane(cubeBody.position.z - 120);
		addContactMaterials(gM, carMaterial);
	}
	
	for (let i = 0; i < roadMesh.length; i++) {
        if(roadMesh[i].position.z - cubeBody.position.z > 80){
			scene.remove(roadMesh[i]);
			roadMesh.splice(i, 1);
			world.removeBody(roadBody[i]);
			roadBody.splice(i, 1);
		}
	}

	if(cubeBody.position.y < 1) {
		jumpEnabled = true;
		reset = false;
	}
	if(cubeBody.position.y > 5) jumpEnabled = false;

	requestAnimationFrame(animate);
    TWEEN.update()}

function containsObject(obj, list) {
	var i;
	for (i = 0; i < list.length; i++) {
		if (list[i] === obj) {
			return true;
		}
	}

	return false;
}

function addCubeBody(){
	let cubeShape = new CANNON.Box(new CANNON.Vec3(1.3,2.8,0.6));
	var slipperyMaterial = new CANNON.Material('slippery');
	cubeBody = new CANNON.Body({ mass: 100, material: slipperyMaterial});
	cubeBody.addShape(cubeShape, new CANNON.Vec3(0,0,0));

	// change rotation
	var q1 = new THREE.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 180 * -90);
	var q2 = new THREE.Quaternion().setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 180 * 180);
	var q = new THREE.Quaternion().multiplyQuaternions(q1, q2);
	cubeBody.quaternion.copy(q);
	cubeBody.position.set(0, 4, 0);
	cubeBody.linearDamping = 0.5;

	cubeBody.addEventListener("collide",function(e){
		if(!containsObject(e.body, roadBody)){
			game_over = true;
		}
	});
	
	world.addBody(cubeBody);

	return slipperyMaterial;
}
async function addCube(){
    const fbxloader = new FBXLoader().setPath('assets/');
    const carLoaddedd = await fbxloader.loadAsync( 'Maserati.fbx' );
    cubeThree = carLoaddedd.children[0];
	cubeThree.castShadow = true;
	cubeThree.receiveShadow = true;
    actor.add(cubeThree);
    cubeThree.scale.x = 0.05
    cubeThree.scale.y = 0.05
    cubeThree.scale.z = 0.05
}

function addPlane(z){
	var posZ = z || 0;
	var groundMaterial = new CANNON.Material('ground')
	const planeShape = new CANNON.Box(new CANNON.Vec3(10, 0.1, 60));
	planeBody = new CANNON.Body({ mass: 0, material: groundMaterial });
	planeBody.addShape(planeShape);
	planeBody.position.set(0, 0, posZ);
	world.addBody(planeBody);
	roadBody.push(planeBody);

	const texture = new THREE.TextureLoader().load( "assets/plane.png" );
	let geometry =  new THREE.BoxGeometry(20, 0.1, 120);
	let material = new THREE.MeshPhongMaterial({color: 'white', map: texture});
	var planeThree = new THREE.Mesh(geometry, material);
	planeThree.position.set(0, 0, posZ);
	planeThree.receiveShadow = true;
	planeThree.castShadow = true;
	field.add(planeThree);
	roadMesh.push(planeThree);

	return groundMaterial;
}

function addObstacle(x, y, z, m, tipo){
	let obstacleShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
	var obstacleBody = new CANNON.Body({ mass: m });
	obstacleBody.addShape(obstacleShape);
	obstacleBody.position.set(x, y,cubeBody.position.z-z);
	obstacleBody.velocity.set(0,0,10);
	world.addBody(obstacleBody);
	obstaclesBodies.push(obstacleBody);
		let geometry = new THREE.BoxGeometry(2,2,2);
	const texture = new THREE.TextureLoader().load( "assets/obstacle.png" );

	let material = new THREE.MeshLambertMaterial({color:'white', map: texture});
	let obstacleMesh = new THREE.Mesh(geometry, material);
	obstacleMesh.castShadow = true;
	obstacleMesh.receiveShadow = true;

	obstacles.add(obstacleMesh);
	obstaclesMeshes.push(obstacleMesh);
}

function addObstacle2(z, m){
	let obstacleShape = new CANNON.Box(new CANNON.Vec3(2, 20, 10));
	var obstacleBody = new CANNON.Body({ mass: m });
	obstacleBody.addShape(obstacleShape);
	obstacleBody.position.set(4, 30,cubeBody.position.z-z);
	world.addBody(obstacleBody);
	obstaclesBodies2.push(obstacleBody);

	let obstacleShape2 = new CANNON.Box(new CANNON.Vec3(2, 20, 10));
	var obstacleBody2 = new CANNON.Body({ mass: m });
	obstacleBody2.addShape(obstacleShape2);
	obstacleBody2.position.set(-4, 30,cubeBody.position.z-z);
	world.addBody(obstacleBody2);
	obstaclesBodies2.push(obstacleBody2);
	
	let geometry = new THREE.BoxGeometry(4,40,20);
	let geometry2 = new THREE.BoxGeometry(4,40,20);
	const texture = new THREE.TextureLoader().load( "assets/obstacle.png" );
	let material = new THREE.MeshLambertMaterial({color:'white', map: texture});

	let obstacleMesh = new THREE.Mesh(geometry, material);
	let obstacleMesh2 = new THREE.Mesh(geometry2, material);

	obstacleMesh.castShadow = true;
	obstacleMesh.receiveShadow = true;

	obstacleMesh2.castShadow = true;
	obstacleMesh2.receiveShadow = true;

	obstacles.add(obstacleMesh);
	obstacles.add(obstacleMesh2);
	obstaclesMeshes2.push(obstacleMesh);
	obstaclesMeshes2.push(obstacleMesh2);
	
}


function addContactMaterials(groundMaterial, slipperyMaterial){
  const slippery_ground = new CANNON.ContactMaterial(groundMaterial, slipperyMaterial, {
    friction: 0.00,
    restitution: 0.0, //bounciness
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

	//Avance/Retroceso
	const strengthWS = 800;
	
	if(keyboard[87]) {
		if(cubeBody.position.y > 2){
			cubeThree.rotateX(THREE.Math.degToRad(3));
			cubeBody.quaternion.copy(cubeThree.quaternion)
		}else{
			const forceForward = new CANNON.Vec3(0, -strengthWS, 0);
			cubeBody.applyLocalForce(forceForward);
		}
	}
	
	if(keyboard[83]) {
		if(cubeBody.position.y > 2){
			cubeThree.rotateX(THREE.Math.degToRad(-3));
			cubeBody.quaternion.copy(cubeThree.quaternion)
		}else{
			const forceBack = new CANNON.Vec3(0, strengthWS, 0)
			cubeBody.applyLocalForce(forceBack);
		}
	}

	//Giro
	if(keyboard[65]) {
		if(cubeBody.position.y < 2){
			cubeThree.rotation.z += THREE.Math.degToRad(3);
			cubeBody.quaternion.copy(cubeThree.quaternion)
		}else{
			if(THREE.Math.radToDeg(cubeThree.rotation.y) > -84){
				cubeThree.rotateY(THREE.Math.degToRad(3));
				cubeBody.quaternion.copy(cubeThree.quaternion);
			}
		}
	}

	if(keyboard[68]) {
		if(cubeBody.position.y < 2){
			cubeThree.rotation.z -= THREE.Math.degToRad(3);
			cubeBody.quaternion.copy(cubeThree.quaternion);
		}else{
			if(THREE.Math.radToDeg(cubeThree.rotation.y) < 84){
				cubeThree.rotateY(THREE.Math.degToRad(-3));
				cubeBody.quaternion.copy(cubeThree.quaternion);
			}
		}
	}

	//Salto
	const forceUp= new CANNON.Vec3(0, 0, 5000)
	if(keyboard[32] && jumpEnabled) {
		cubeBody.applyLocalForce(forceUp);
	}

	//Turbo
	const forceTurbo= new CANNON.Vec3(0, -5000, 0)
	if(keyboard[16] && turbo > 0) {
		cubeBody.applyLocalForce(forceTurbo);
		turbo -= 1;
		document.querySelector('#turbo label').innerText = 'Turbo: ' + turbo;
	}

	//Restart
	if(keyboard[82] && !reset){
		turbo = 100;
		puntos = 0;
		reset = true
		roadMesh.forEach((item) => {
			scene.remove(item);
		});
		roadMesh = []

		roadBody.forEach((item) => {
			world.removeBody(item);
		});
		roadBody = []
		
		world.removeBody(cubeBody);
		carMaterial = addCubeBody();
		var gM = addPlane();
		addContactMaterials(gM, carMaterial);
	}
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
	field.add(mountainMesh);

	const domeLoaded = await gltfLoader.loadAsync( 'skydome.glb' );
	domeMesh = domeLoaded.scene.children[0];
	domeMesh.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 180 *90);
	domeMesh.position.set(0, -40, 0);
	domeMesh.scale.set(0.1, 0.1, 0.1);
	field.add(domeMesh);
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
