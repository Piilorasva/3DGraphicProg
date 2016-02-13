var width = 800,
    height = 600,
    viewAngle = 45,
    aspect = width/height,
    near = 0.1,
    far = 1000.0;

//Variables for the hand geometries
var shoulderSphere,
    upperArmCube,
    elbowSphere,
    lowerArmCube,
    handCube;

var fingers = []; 

//variable to change the rotations
var rotationValue = 3.14;
var wavingSpeed = 0.05; //
    


var renderer = null;
var scene = null;
var camera = null;

var mouse = {
    down: false,
    prevY: 0,
    prevX: 0
}

var camObject = null;
var keysPressed = [];
var ruins = []

$(function(){

    // get div element 
    var ctx = $("#main");
    // create WebGL-based renderer for our content.
    renderer = new THREE.WebGLRenderer();

    // create camera
    camera = new THREE.PerspectiveCamera( viewAngle, aspect, near, far);
    camObject = new THREE.Object3D();
    // create scene
    scene = new THREE.Scene();
    // camera will be the the child of camObject
    camObject.add(camera);

    // add camera to scene and set its position.
    scene.add(camObject);
    camObject.position.z = 5;
    camObject.position.y = 1.0;

    // define renderer viewport size
    renderer.setSize(width,height);

    // add generated canvas element to HTML page
    ctx.append(renderer.domElement);

    
    // Create ground from cube and some rock
    var rockTexture = THREE.ImageUtils.loadTexture("rock.jpg");

    // texture wrapping mode set as repeating
    rockTexture.wrapS = THREE.RepeatWrapping;
    rockTexture.wrapT = THREE.RepeatWrapping;

    // Construct a mesh object
    var ground = new THREE.Mesh( new THREE.BoxGeometry(100,0.2,100,1,1,1),
				 new THREE.MeshBasicMaterial({
				     map: rockTexture,
				     transparent: true
				 }));
    // do a little magic with vertex coordinates so ground looks more intersesting.
    $.each( ground.geometry.faceVertexUvs[0], function(i,d){
	d[0] = new THREE.Vector2(0,25);
	d[2] = new THREE.Vector2(25,0);
	d[3] = new THREE.Vector2(25,25);
    });

    // add ground to scene
    scene.add(ground);

    InstantiateArm();

    //Method that creates an arm
    function InstantiateArm(){
        //First lets do an red shoulder with sphere
        var shoulderMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000
        });
        shoulderSphere = new THREE.Mesh(new THREE.SphereGeometry(0.2,32,32),shoulderMaterial);
        shoulderSphere.position.y += 0.4;
        scene.add(shoulderSphere);

        //Next upper arm that we are going to make child of shoulder
        var upperArmMaterial = new THREE.MeshBasicMaterial({
            color: 0x66ff66
        });
        upperArmCube = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.8,0.15),upperArmMaterial);
        upperArmCube.position.y += 0.3;
        shoulderSphere.add(upperArmCube);

        //Then elbow as the child of upper arm
        var elbowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff
        });
        elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.1,12,12),elbowMaterial);
        elbowSphere.position.y += 0.45;
        upperArmCube.add(elbowSphere);

        //then lower arm as the child of elbow
        var lowerArmMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00
        });
        lowerArmCube = new THREE.Mesh(new THREE.BoxGeometry(0.13,0.6,0.13), lowerArmMaterial);         
        lowerArmCube.position.y += 0.35;
        elbowSphere.add(lowerArmCube);

        //then the hand as child of lower arm
        var handMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff
        });
        handCube = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.4,0.15), handMaterial);
        handCube.position.y += 0.4;
        lowerArmCube.add(handCube);

        //and finally 4 identical fingers
        var fingerMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd9b3
        });
        console.log("finger" + 1);
        for(var i=0;i<4;i++){
        fingers[i] = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.3,0.05),fingerMaterial); 
        handCube.add(fingers[i]);
        }
        //top3 fingers
        fingers[0].position.x -= 0.1;
        fingers[0].position.y += 0.2;
        fingers[1].position.y += 0.2;
        fingers[2].position.x += 0.1;
        fingers[2].position.y += 0.2;
        //thumb
        fingers[3].position.x += 0.2;
        fingers[3].rotation.z -= THREE.Math.degToRad(45);



        
        //shoulderSphere.position.z += 1;
        shoulderSphere.rotation.z += THREE.Math.degToRad(25);
        //elbowSphere.rotation.z -= 45;
        //handCube.rotation.x += THREE.Math.degToRad(25);
    }



    // request frame update and call update-function once it comes
    requestAnimationFrame(update);

    ////////////////////
    // Setup simple input handling with mouse
    document.onmousedown = function(ev){
	mouse.down = true;
	mouse.prevY = ev.pageY;
	mouse.prevX = ev.pageX;
    }

    
    document.onmouseup = function(ev){
	mouse.down = false;
    }

    document.onmousemove = function(ev){
	if ( mouse.down ) {

	    var rot = (ev.pageY - mouse.prevY) * 0.01;
	    var rotY = (ev.pageX - mouse.prevX) * 0.01;
	    camObject.rotation.y -= rotY;
	    camera.rotation.x -= rot;
	    mouse.prevY = ev.pageY;
	    mouse.prevX = ev.pageX;
	}
    }
    ////////////////////
    // setup input handling with keypresses
    document.onkeydown = function(event) {
	keysPressed[event.keyCode] = true;
    }
    
    document.onkeyup = function(event) {
	keysPressed[event.keyCode] = false;
    }
    
    
    // querying supported extensions
    var gl = renderer.context;
    var supported = gl.getSupportedExtensions();

    console.log("**** Supported extensions ***'");
    $.each(supported, function(i,d){
	console.log(d);
    });
    

});

var angle = 0.0;

function update(){

    // render everything 
    renderer.setClearColor(0x000000, 1.0);
    renderer.clear(true);
    renderer.render(scene, camera); 
    
    if ( keysPressed["W".charCodeAt(0)] == true ){
	var dir = new THREE.Vector3(0,0,-1);
	var m = new THREE.Matrix4();
	camObject.matrixWorld.extractRotation(m);
	var dirW = dir.applyMatrix4(m);
	camObject.translateOnAxis(dirW, 0.1 );
    }
    
    if ( keysPressed["S".charCodeAt(0)] == true ){
	var dir = new THREE.Vector3(0,0,-1);

	var m = new THREE.Matrix4();
	camObject.matrixWorld.extractRotation(m);
	var dirW = dir.applyMatrix4(m);

	camObject.translateOnAxis(dirW, -0.1 );
    }
    if ( keysPressed["A".charCodeAt(0)] == true ){
	var dir = new THREE.Vector3(1,0,0);
	var dirW = dir.applyEuler( camObject.rotation);

	var m = new THREE.Matrix4();
	camObject.matrixWorld.extractRotation(m);
	var dirW = dir.applyMatrix4(m);

	camObject.translateOnAxis(dirW, -0.1 );
    
    }

    if ( keysPressed["D".charCodeAt(0)] == true ){
	var dir = new THREE.Vector3(1,0,0);
	var dirW = dir.applyEuler( camObject.rotation);

	var m = new THREE.Matrix4();
	camObject.matrixWorld.extractRotation(m);
	var dirW = dir.applyMatrix4(m);

	camObject.translateOnAxis(dirW, 0.1);
    }

    //Do the hand rotations
    shoulderSphere.rotation.z += Math.sin(rotationValue) * wavingSpeed;
    elbowSphere.rotation.x += Math.cos(rotationValue) * wavingSpeed; 
    handCube.rotation.y += Math.cos(rotationValue) * wavingSpeed * 2;


    rotationValue += 0.08;

    // request another frame update
    requestAnimationFrame(update);
}