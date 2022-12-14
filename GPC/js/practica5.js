import { GUI } from '../lib/lil-gui.module.min.js';
import * as THREE from '../lib/three.module.js';
import {OrbitControls} from "../lib/OrbitControls.module.js"
import { TWEEN } from '../lib/tween.module.min.js'


var renderer, scene, camera;

let alambres = false;

let alzado, planta, perfil;
const L = 60;

let anteBrazoRobot, robot, brazoRobot, baseRobot, manosAnteBrazo, palmaManoDe, palmaManoIz, pinzaDe, pinzaIz

function setCameras(ar) {
    let camaraOrtografica;

    if(ar > 1){
        camaraOrtografica = new THREE.OrthographicCamera(-L, L, L, -L, -500, 100);
    }else{
        camaraOrtografica = new THREE.OrthographicCamera(-L, L, L, -L, -500, 100);
    }

    alzado = camaraOrtografica.clone();
    alzado.position.set(0,0,L);
    alzado.lookAt(0,0,0);

    planta = camaraOrtografica.clone();
    planta.position.set(0,L,0);
    planta.lookAt(0,0,0,);
    planta.up = new THREE.Vector3(0,0,-1);

    perfil = camaraOrtografica.clone();
    perfil.position.set(L,0,0);
    perfil.lookAt(0,0,0);
}

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( new THREE.Color(0xFFFFFF) );
    document.getElementById('container').appendChild( renderer.domElement );
    renderer.autoClear = false;

    // Camara
    const ar = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera( 75, ar, 0.1,10000);
    setCameras(ar);
    camera.position.set(200, 300, 150);
    camera.lookAt( new THREE.Vector3(0,0,0) );

    // Movimiento con raton
    var controlesCam = new OrbitControls( camera, renderer.domElement );
    controlesCam.screenSpacePanning = true;
	controlesCam.target.set( 0, 0, 0 );
    
    window.addEventListener('resize', updateAspectRatio);
    window.addEventListener('keydown', moveRobot, false);
}

function loadScene()
{
    // Escena
    scene = new THREE.Scene();
    // Luces
    const ambiental = new THREE.AmbientLight(0x222222);
    scene.add(ambiental);

    const direccional = new THREE.DirectionalLight(0xFFFFFF,0.3);
    direccional.position.set(-500,500,-500);
    direccional.castShadow = true;
    direccional.shadow.camera.far = 1500;
    direccional.shadow.camera.scale.x = 100
    direccional.shadow.camera.scale.y = 100
    scene.add(direccional);

    const puntual = new THREE.PointLight(0xFFFFFF,0.3);
    puntual.position.set(220,500,-150);
    puntual.castShadow = true;
    puntual.shadow.camera.far = 800;
    scene.add(puntual);

    const focal = new THREE.SpotLight(0xFFFFFF,0.3);
    focal.position.set(0,400,240);
    focal.target.position.set(0,0,0);
    focal.angle= Math.PI/7;
    focal.penumbra = 0.3;
    focal.castShadow= true;
    focal.shadow.camera.far = 800;
    focal.shadow.camera.fov = 80;
    scene.add(focal);
    
    //scene.add(new THREE.CameraHelper(focal.shadow.camera));

    // cargar Robot
    cargarRobot(alambres);

    // Habitacion
    var path = "images/";
    const paredes = [];
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"posx.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"negx.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"posy.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"negy.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"posz.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(path+"negz.jpg")}) );
    const habitacion = new THREE.Mesh( new THREE.BoxGeometry(4000,4000,4000),paredes);
    scene.add(habitacion);

}

function showAlambres(alam){
    alambres = alam;
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    loadScene();
}

function setupGUI() {
    // Objeto controlador de la interfaz
    var effectController = {
        giroBase: 0.0,
        giroBrazo: 0.0,
        giroAnteBrazoY: 0.0,
        giroAnteBrazoZ: 0.0,
        giroPinza: 0,
        separaPinza: 7,
        'Alambres': false,
        Animar: function(){
            console.log('A')
            new TWEEN.Tween(robot.rotation).to({y: 180 * Math.PI / 180}, 1000).start();
            new TWEEN.Tween(brazoRobot.rotation).to({x: -(-20 * Math.PI / 180)}, 1000).start();
            new TWEEN.Tween(anteBrazoRobot.rotation).to({y: 30 * Math.PI / 180}, 1000).start();
            new TWEEN.Tween(anteBrazoRobot.rotation).to({x: 30 * Math.PI / 180}, 1000).start();
            new TWEEN.Tween(manosAnteBrazo.rotation).to({x: 30 * Math.PI / 180}, 1000).start();
            new TWEEN.Tween(pinzaDe.position).to({y: 0 + 10}, 800).start();
            new TWEEN.Tween(pinzaIz.position).to({y: -0 - 10}, 800).start();
            new TWEEN.Tween(palmaManoDe.position).to({y: 0+2}, 800).start();
            new TWEEN.Tween(palmaManoIz.position).to({y: -0-2}, 800).start();
            requestAnimationFrame(animate);
        }
    }

    var gui = new GUI();
    var carpeta = gui.addFolder("Control Robot");

    carpeta.add(effectController, "giroBase", -180.0, 180.0, 0.2).name("Giro Base").onChange(giroBase)
    carpeta.add(effectController, "giroBrazo", -45.0, 45.0, 0.2).name("Giro Brazo").onChange(giroBrazo);
    carpeta.add(effectController, "giroAnteBrazoY", -180.0, 180.0, 0.2).name("Giro Antebrazo Y").onChange(giroAnteBrazoY);
    carpeta.add(effectController, "giroAnteBrazoZ", -90.0, 90.0, 0.2).name("Giro Antebrazo Z").onChange(giroAnteBrazoZ);
    carpeta.add(effectController, "giroPinza", -40.0, 220.0, 0.2).name("Giro Pinza").onChange(giroPinza);
    carpeta.add(effectController, "separaPinza", 0, 15, 0.2).name("Separaci??n Pinza").onChange(separaPinza);
    carpeta.add( effectController, 'Alambres' ).onChange( showAlambres );
    carpeta.add( effectController, 'Animar' );
}

function giroBase(grados) {
    new TWEEN.Tween(robot.rotation).to({y: grados * Math.PI / 180}, 500).start();
    requestAnimationFrame(animate)
}

function giroBrazo(grados) {
    new TWEEN.Tween(brazoRobot.rotation).to({x: -(grados * Math.PI / 180)}, 500).start();
    requestAnimationFrame(animate)
}

function giroAnteBrazoY(grados) {
    new TWEEN.Tween(anteBrazoRobot.rotation).to({y: grados * Math.PI / 180}, 500).start();
    requestAnimationFrame(animate)
}

function giroAnteBrazoZ(grados) {
    new TWEEN.Tween(anteBrazoRobot.rotation).to({x: grados * Math.PI / 180}, 500).start();
    requestAnimationFrame(animate)
}

function giroPinza(grados) {
    new TWEEN.Tween(manosAnteBrazo.rotation).to({x: grados * Math.PI / 180}, 500).start();
    requestAnimationFrame(animate)
}

function separaPinza(grados) {
    new TWEEN.Tween(pinzaDe.position).to({y: grados + 10}, 500).start();
    new TWEEN.Tween(pinzaIz.position).to({y: -grados - 10}, 500).start();
    new TWEEN.Tween(palmaManoDe.position).to({y: grados+2}, 500).start();
    new TWEEN.Tween(palmaManoIz.position).to({y: -grados-2}, 500).start();
    requestAnimationFrame(animate)
}

function moveRobot(event) {

    const keyName = event.key;

    switch (keyName) {
        case 'ArrowUp':
            robot.position.z -= 10.0;
            break;
        case 'ArrowDown':
            robot.position.z += 10.0;
            break;
        case 'ArrowLeft':
            robot.position.x -= 10.0;
            break;
        case 'ArrowRight':
            robot.position.x += 10.0;
            break;
    }

}

function animate() {
    requestAnimationFrame(animate)
    TWEEN.update()
}

function cargarRobot(wf) {
    var path = "images/";
    var txSuelo = new THREE.TextureLoader().load(path + "wood512.jpg");
    var matSuelo = new THREE.MeshPhongMaterial({ color: 'white', map: txSuelo });
    //material para la rotula
    var paredes = [path + "posx.jpg", path + "negx.jpg", path + "posy.jpg", path + "negy.jpg", path + "posz.jpg", path + "negz.jpg"];

    var mapaEntorno = new THREE.CubeTextureLoader().load(paredes);
    var matRotula = new THREE.MeshPhongMaterial({ color: 'white', specular: 0x99BBFF, shininess: 50, envMap: mapaEntorno, wireframe: wf });


    //material para el robot
    var texturaRobot = new THREE.TextureLoader().load(path + "metal_128.jpg");
    var matRobot = new THREE.MeshPhongMaterial({ color: 'white', map: texturaRobot, wireframe: wf });

    var texturaRobot2 = new THREE.TextureLoader().load(path + "burberry_256.jpg");
    var matRobot2 = new THREE.MeshLambertMaterial({ color: 'white', map: texturaRobot2, wireframe: wf });

    //Piezas del robot
    robot = new THREE.Object3D();
    // 1. Base de robot, cilindro
    var geoBase = new THREE.CylinderGeometry( 50, 50, 15, 25); //50 radio alto y bajo, 15 de altura, 30 ejes al??mbricos
    baseRobot = new THREE.Mesh( geoBase, matRobot );
    baseRobot.castShadow = true;
    baseRobot.receiveShadow = true;
    baseRobot.position.set(0, 0, 0);

    // 2. Brazo del robot, cilindro gira y -90 grados
    brazoRobot = new THREE.Object3D();
    var geoEje = new THREE.CylinderGeometry( 20, 20, 18, 15); //20 radio, 18 altura, alambrico 15
    var geoEsparrago = new THREE.BoxGeometry(18, 120, 12);
    var geoRotula = new THREE.SphereGeometry( 20, 15);

    const ejeBrazo = new THREE.Mesh( geoEje, matRobot );    
    ejeBrazo.rotation.z = Math.PI / 2; //Se gira 90 grados eje z
    ejeBrazo.castShadow = true;
    ejeBrazo.receiveShadow = true;
    brazoRobot.add(ejeBrazo);

    const esparragoBrazo = new THREE.Mesh( geoEsparrago, matRobot );    
    esparragoBrazo.position.set(0, 50, 0);
    esparragoBrazo.castShadow = true;
    esparragoBrazo.receiveShadow = true;
    brazoRobot.add(esparragoBrazo);

    const rotulaBrazo = new THREE.Mesh( geoRotula, matRotula );
    rotulaBrazo.position.set(0, 120, 0);
    rotulaBrazo.castShadow = true;
    rotulaBrazo.receiveShadow = true;
    brazoRobot.add(rotulaBrazo);

    // 3. Antebrazo del robot
    anteBrazoRobot = new THREE.Object3D();
    var geoDisco = new THREE.CylinderGeometry( 22, 22, 6, 15); //22 radio, 6 altura, alambrico 15
    var geoNervios = new THREE.BoxGeometry(4, 80, 4);
    var geoManos = new THREE.CylinderGeometry(15, 15, 40, 15);

    const discoAnteBrazo = new THREE.Mesh( geoDisco, matRobot );
    discoAnteBrazo.castShadow = true;
    discoAnteBrazo.receiveShadow = true;

    const nerviosAnteBrazo1 = new THREE.Mesh( geoNervios, matRobot2 );
    nerviosAnteBrazo1.castShadow = true;
    nerviosAnteBrazo1.receiveShadow = true;
    nerviosAnteBrazo1.position.set(-9, 34, 9);

    const nerviosAnteBrazo2 = new THREE.Mesh( geoNervios, matRobot2 );
    nerviosAnteBrazo2.castShadow = true;
    nerviosAnteBrazo2.receiveShadow = true;
    nerviosAnteBrazo2.position.set(9, 34, 9);

    const nerviosAnteBrazo3 = new THREE.Mesh( geoNervios, matRobot2 );
    nerviosAnteBrazo3.castShadow = true;
    nerviosAnteBrazo3.receiveShadow = true;
    nerviosAnteBrazo3.position.set(9, 34, -9);

    const nerviosAnteBrazo4 = new THREE.Mesh( geoNervios, matRobot2 );
    nerviosAnteBrazo4.castShadow = true;
    nerviosAnteBrazo4.receiveShadow = true;
    nerviosAnteBrazo4.position.set(-9, 34, -9);  

    // 4. Mano del robot
    manosAnteBrazo = new THREE.Mesh( geoManos, matRobot2 );
    manosAnteBrazo.castShadow = true;
    manosAnteBrazo.receiveShadow = true;
    manosAnteBrazo.position.set(0, 70, 0);
    manosAnteBrazo.rotation.z = Math.PI / 2; //Se gira 90 grados eje z    
    
    anteBrazoRobot.position.set(0, 120, 0);

    var geoPalmaMano = new THREE.BoxGeometry(20, 19, 4);

    palmaManoIz = new THREE.Mesh(geoPalmaMano, matRobot2);
    palmaManoIz.castShadow = true;
    palmaManoIz.receiveShadow = true;
    palmaManoIz.rotation.x = Math.PI / 2;
    palmaManoIz.position.set(0,-10,-9.5);

    palmaManoDe = new THREE.Mesh(geoPalmaMano, matRobot2);
    palmaManoDe.castShadow = true;
    palmaManoDe.receiveShadow = true;
    palmaManoDe.rotation.x = Math.PI / 2;
    palmaManoDe.position.set(0,12,-9.5);
   
    var geoPinza = new THREE.BufferGeometry();

    var points = [
        new THREE.Vector3(38, -10, -5),
        new THREE.Vector3(38, -8, 5),
        new THREE.Vector3(38, -10, 5),

        new THREE.Vector3(38, -10, 5),
        new THREE.Vector3(19, -6, 10),
        new THREE.Vector3(19, -10, 10),

        new THREE.Vector3(38, -8, 5),
        new THREE.Vector3(19, -6, 10),
        new THREE.Vector3(38, -10, 5),

        new THREE.Vector3(38, -10, -5),
        new THREE.Vector3(19, -10, -10),
        new THREE.Vector3(19, -6, -10),

        new THREE.Vector3(38, -8, -5),
        new THREE.Vector3(38, -10, -5),
        new THREE.Vector3(19, -6, -10),

        new THREE.Vector3(38, -8, -5),
        new THREE.Vector3(38, -8, 5),
        new THREE.Vector3(38, -10, -5),

        new THREE.Vector3(38, -8, 5),
        new THREE.Vector3(19, -6, -10),
        new THREE.Vector3(19, -6, 10),

        new THREE.Vector3(38, -8, -5),
        new THREE.Vector3(19, -6, -10),
        new THREE.Vector3(38, -8, 5),

        new THREE.Vector3(38, -10, 5),
        new THREE.Vector3(19, -10, 10),
        new THREE.Vector3(19, -10, -10),

        new THREE.Vector3(38, -10, -5),
        new THREE.Vector3(38, -10, 5),
        new THREE.Vector3(19, -10, -10),
    ];
    var normals = new Float32Array(
        [
            20,0,0,
            20,0,0,
            20,0,0,

            20,5,0,
            20,5,0,
            20,5,0,

            20,5,0,
            20,5,0,
            20,5,0,

            20,-5,0,
            20,-5,0,
            20,-5,0,

            20,-5,0,
            20,-5,0,
            20,-5,0,

            20,0,0,
            20,0,0,
            20,0,0,

            40, 380, 0,
            40, 380, 0,
            40, 380, 0,

            40, 380, 0,
            40, 380, 0,
            40, 380, 0,

            0,380,0,
            0,380,0,
            0,380,0,
            
            0,380,0,
            0,380,0,
            0,380,0,
        ]
    );

    var uvs = new Float32Array(
        [
            1,0,
            1,1,
            0,0,
            0,1,
            1,0,
            1,1,
            0,0,
            0,1,
            1,0,
            1,1,
            0,0,
            0,1,
            1,0,
            1,1,
            0,0,
            0,1,
            1,0,
            1,1,
            0,0,
            0,1,
            1,0,
            1,1,
            0,0,
            0,1,
            1,0,
            1,1,
            0,0,
            0,1
        ]
    );

    geoPinza.setFromPoints(points)
    geoPinza.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    geoPinza.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
    geoPinza.computeVertexNormals();

    pinzaIz = new THREE.Mesh(geoPinza, matRobot2);
    pinzaIz.receiveShadow = true;
    pinzaIz.castShadow = true;
    pinzaIz.rotation.x = Math.PI;
    pinzaIz.position.set(0, -18, 0);
    pinzaIz.rotation.y = -Math.PI / 2;

    pinzaDe = new THREE.Mesh(geoPinza, matRobot2);
    pinzaDe.rotation.y = Math.PI / 2;
    pinzaDe.position.set(0, 20, 0);
    pinzaDe.receiveShadow = true;
    pinzaDe.castShadow = true;
   
    // Grafo de elementos
    anteBrazoRobot.add(discoAnteBrazo);
    anteBrazoRobot.add(nerviosAnteBrazo1);
    anteBrazoRobot.add(nerviosAnteBrazo2);
    anteBrazoRobot.add(nerviosAnteBrazo3);
    anteBrazoRobot.add(nerviosAnteBrazo4);
    brazoRobot.add(anteBrazoRobot);  
    anteBrazoRobot.add(manosAnteBrazo);            
    manosAnteBrazo.add(pinzaIz);
    manosAnteBrazo.add(pinzaDe);
    manosAnteBrazo.add(palmaManoIz);
    manosAnteBrazo.add(palmaManoDe);
    
    robot.add(baseRobot);     
    baseRobot.add(brazoRobot);
    scene.add(robot);

    // Un suelo (1000 x 1000) plano XZ
    var suelo = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000, 30,30), matSuelo );
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    scene.add(suelo);

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

    // ortografica
    if (ar > 1) {
        planta.left = -L;
        planta.right = L;
        planta.top = L;
        planta.bottom = -L;
    } else {
        planta.left = -L;
        planta.right = L;
        planta.top = L;
        planta.bottom = -L;
    }

    planta.updateProjectionMatrix();
}

function update() {

}

function render()
{
    requestAnimationFrame( render );
    update();

    renderer.clear()

    renderer.setViewport(0,0, window.innerWidth, window.innerHeight);
    renderer.render( scene, camera );

    renderer.setViewport(0, window.innerHeight - Math.min(window.innerWidth, window.innerHeight) / 4, Math.min(window.innerWidth, window.innerHeight) / 4, Math.min(window.innerWidth, window.innerHeight) / 4)
    renderer.render(scene, planta);
}


init();
loadScene();
setupGUI()
render();