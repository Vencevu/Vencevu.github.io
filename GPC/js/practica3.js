var renderer, scene, camera;

var material

let alzado, planta, perfil;
const L = 50;

function setCameras(ar) {
    let camaraOrtografica;

    if(ar > 1){
        camaraOrtografica = new THREE.OrthographicCamera(-L*ar, L*ar, L, -L, -1000, 100);
    }else{
        camaraOrtografica = new THREE.OrthographicCamera(-L, L, L/ar, -L/ar, -1000, 100);
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
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( new THREE.Color(0xFFFFFF) );
    document.getElementById('container').appendChild( renderer.domElement );
    renderer.autoClear = false;
    // Escena
    scene = new THREE.Scene();

    // Camara
    const ar = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera( 75, ar, 0.1,1000);
    setCameras(ar);
    camera.position.set(200, 300, 150);
    camera.lookAt( new THREE.Vector3(0,0,0) );

    // Movimiento con raton
    controlesCam = new THREE.OrbitControls( camera, renderer.domElement );
    controlesCam.screenSpacePanning = true;
	controlesCam.target.set( 0, 0, 0 );
    
    window.addEventListener('resize', updateAspectRatio);
}

function loadScene()
{   
    material = cargarMaterial();

    // cargar Robot
    cargarRobot();

    // Un suelo (1000 x 1000) plano XZ
    var suelo = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000, 30,30), material );
    suelo.rotation.x = -Math.PI / 2;
    scene.add(suelo);

}

function cargarMaterial() {
    return new THREE.MeshNormalMaterial( { color: 'red', wireframe: false } );
}

function cargarRobot() {
    //Piezas del robot
    robot = new THREE.Object3D();
    // 1. Base de robot, cilindro
    var geoBase = new THREE.CylinderGeometry( 50, 50, 15, 25); //50 radio alto y bajo, 15 de altura, 30 ejes alámbricos
    const baseRobot = new THREE.Mesh( geoBase, material );
    baseRobot.position.set(0, 0, 0);

    // 2. Brazo del robot, cilindro gira y -90 grados
    const brazoRobot = new THREE.Object3D();
    var geoEje = new THREE.CylinderGeometry( 20, 20, 18, 15); //20 radio, 18 altura, alambrico 15
    var geoEsparrago = new THREE.BoxGeometry(18, 120, 12);
    var geoRotula = new THREE.SphereGeometry( 20, 15);

    const ejeBrazo = new THREE.Mesh( geoEje, material );    
    ejeBrazo.rotation.z = Math.PI / 2; //Se gira 90 grados eje z
    brazoRobot.add(ejeBrazo);

    const esparragoBrazo = new THREE.Mesh( geoEsparrago, material );    
    esparragoBrazo.position.set(0, 50, 0);
    brazoRobot.add(esparragoBrazo);

    const rotulaBrazo = new THREE.Mesh( geoRotula, material );
    rotulaBrazo.position.set(0, 120, 0);
    brazoRobot.add(rotulaBrazo);

    // 3. Antebrazo del robot
    const anteBrazoRobot = new THREE.Object3D();
    var geoDisco = new THREE.CylinderGeometry( 22, 22, 6, 15); //22 radio, 6 altura, alambrico 15
    var geoNervios = new THREE.BoxGeometry(4, 80, 4);
    var geoManos = new THREE.CylinderGeometry(15, 15, 40, 15);

    const discoAnteBrazo = new THREE.Mesh( geoDisco, material );

    const nerviosAnteBrazo1 = new THREE.Mesh( geoNervios, material );
    nerviosAnteBrazo1.position.set(-9, 34, 9);

    const nerviosAnteBrazo2 = new THREE.Mesh( geoNervios, material );
    nerviosAnteBrazo2.position.set(9, 34, 9);

    const nerviosAnteBrazo3 = new THREE.Mesh( geoNervios, material );
    nerviosAnteBrazo3.position.set(9, 34, -9);

    const nerviosAnteBrazo4 = new THREE.Mesh( geoNervios, material );
    nerviosAnteBrazo4.position.set(-9, 34, -9);  

    // 4. Mano del robot
    const manosAnteBrazo = new THREE.Mesh( geoManos, material );    
    manosAnteBrazo.position.set(0, 70, 5);
    manosAnteBrazo.rotation.z = Math.PI / 2; //Se gira 90 grados eje z    
    
    anteBrazoRobot.position.set(0, 120, 0);

    var geoPalmaMano = new THREE.BoxGeometry(20, 19, 4);

    var palmaManoIz = new THREE.Mesh(geoPalmaMano, material);
    palmaManoIz.rotation.x = Math.PI / 2;
    palmaManoIz.position.set(0,-10,-9.5);

    var palmaManoDe = new THREE.Mesh(geoPalmaMano, material);
    palmaManoDe.rotation.x = Math.PI / 2;
    palmaManoDe.position.set(0,12,-9.5);
   
    var geoPinza = new THREE.BufferGeometry();

    points = [
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
    normals = new Float32Array(
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

    geoPinza.setFromPoints(points)
    geoPinza.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    geoPinza.computeVertexNormals();

    var pinzaIz = new THREE.Mesh(geoPinza, material);
    pinzaIz.rotation.x = Math.PI;
    pinzaIz.position.set(0, -18, 0);
    pinzaIz.rotation.y = -Math.PI / 2;

    var pinzaDe = new THREE.Mesh(geoPinza, material);
    pinzaDe.rotation.y = Math.PI / 2;
    pinzaDe.position.set(0, 20, 0);
   
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
}

function updateAspectRatio() {
    
}

function update()
{
    
}

function render()
{
    requestAnimationFrame( render );
    update();

    renderer.clear()

    renderer.setViewport(0,window.innerHeight - window.innerHeight/4, window.innerWidth /4, window.innerHeight/4);
    renderer.render(scene, planta);

    renderer.setViewport(0,0, window.innerWidth, window.innerHeight);
    renderer.render( scene, camera );
}


init();
loadScene();
render();