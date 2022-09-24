var renderer, scene, camera;

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x0000FF), 1.0);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    var aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.set(50,200,50);
    camera.lookAt(0,130,0);

    loadScene();

}

function loadScene(){
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000, 20,20 ),  new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe: true} ));
    suelo.rotation.x = -Math.PI / 2;
    scene.add( suelo );

    const base = new THREE.Mesh( new THREE.CylinderGeometry( 50, 50, 15, 16 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    scene.add( base );

    const brazo1 = new THREE.Mesh( new THREE.CylinderGeometry( 20, 20, 18, 16 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    brazo1.rotation.x = -Math.PI / 2
    scene.add( brazo1 );

    const brazo2 = new THREE.Mesh( new THREE.BoxGeometry( 18, 120, 12 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    brazo2.position.y = 70;
    scene.add( brazo2 );

    const brazo3 = new THREE.Mesh( new THREE.SphereGeometry( 20, 8, 8 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    brazo3.position.y = 130;
    scene.add( brazo3 );

    const antebrazo1 = new THREE.Mesh( new THREE.CylinderGeometry( 22, 22, 6, 16 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    antebrazo1.position.y = 130
    scene.add( antebrazo1 );

    const nervio1 = new THREE.Mesh( new THREE.BoxGeometry( 4, 80, 4 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    nervio1.position.y = 170;
    nervio1.position.x = 7;
    nervio1.position.z = 4;
    scene.add( nervio1 );

    const nervio2 = new THREE.Mesh( new THREE.BoxGeometry( 4, 80, 4 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    nervio2.position.y = 170;
    nervio2.position.x = 7;
    nervio2.position.z = -4;
    scene.add( nervio2 );

    const nervio3 = new THREE.Mesh( new THREE.BoxGeometry( 4, 80, 4 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    nervio3.position.y = 170;
    nervio3.position.x = -7;
    nervio3.position.z = -4;
    scene.add( nervio3 );

    const nervio4 = new THREE.Mesh( new THREE.BoxGeometry( 4, 80, 4 ), new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} ));
    nervio4.position.y = 170;
    nervio4.position.x = -7;
    nervio4.position.z = 4;
    scene.add( nervio4 );
}

function update(){
    
}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}

init();
render();