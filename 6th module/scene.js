// Parameters
var width = 800,
    height = 600
    viewAngle = 45,
    aspect = width/height,
    near = 0.3,
    far = 1000.0;

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
var ruins = [];

var shoulderRotationJoint;
var shoulderTiltingJoint;
var upperArm;
var elbowJoint;
var lowerArm;
var wrist;
var hand;
var thumb;
var indexfinger;
var middlefinger;
var pinky;

var fps = {
    width: 100,
    height: 50,
    svg: null,
    data: [],
    ticks: 0,
    time: null
}
var spotLight = null;
var spotLightObj = null;
var ambientLight = null;
var skymesh;

//Variables for particlesystem
var fireParticleSystem = null;
var fireParticlesAmount = 200;
var fireParticles;
var fireParticleMaterial;

var smokeParticleSystem = null;
var smokeParticlesAmount = 2000;
var smokeParticles;
var smokeParticleMaterial; 

// for easier conversion
function colorToVec4(color){
    var res = new THREE.Vector4(color.r, color.g, color.b, color.a);
    return res;
}

// convert a hexidecimal color string to 0..255 R,G,B
hexToRGB = function(hex){
    var r = hex >> 16;
    var g = hex >> 8 & 0xFF;
    var b = hex & 0xFF;
    return [r/255, g/255, b/255];
}

//Add a method to create tree
   function addTree (texture, posx,posy,posz){
        var geometry = new THREE.PlaneGeometry(3,3,32,32);
        var material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: true,
            transparent: true,
            blending: THREE.NormalBlending
            /*blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.DstAlpha*/
        });

        var tree1 = new THREE.Mesh(geometry,material);
        
        tree1.position.set(posx,posy,posz);
        scene.add(tree1); 
        

        var tree2 = new THREE.Mesh(geometry,material);
        tree2.rotation.y -= Math.PI/2;
        tree2.position.set(posx,posy,posz);
        
        scene.add(tree2);
        
         

        

    }

$(function(){

    // get div element 
    var ctx = $("#main");
    // create WebGL-based renderer for our content.
    renderer = new THREE.WebGLRenderer();

    // create camera
    camera = new THREE.PerspectiveCamera( viewAngle, aspect, near, far);

    // create scene
    scene = new THREE.Scene();
    camObject = new THREE.Object3D();
    camObject.add(camera);
    spotLightObj = new THREE.Object3D();
    spotLightObj.position.z = 0.1;
    camera.add(spotLightObj);

    // add camera to scene and set its position.
    scene.add(camObject);
    camObject.position.z = 5;
    camObject.position.y = 1.0;
    // define renderer viewport size
    renderer.setSize(width,height);

    // add generated canvas element to HTML page
    ctx.append(renderer.domElement);

    // directional light for the moon
    var directionalLight = new THREE.DirectionalLight( 0x88aaff, 1.0 ); 
    directionalLight.position.set( 1, 2, -1); 

    scene.add( directionalLight );

    console.log("Directional light hex color is " + directionalLight.color.getHex());
    console.log("Directional light color in rgb is: " + hexToRGB(directionalLight.color.getHex()));
    var lightColorArray = hexToRGB(directionalLight.color.getHex());
    console.log("First light color is: " + lightColorArray[0]);

    var pointLight = new THREE.PointLight(0xe65c00,1,100);
    pointLight.position.set(0,0.2,2);
    scene.add(pointLight);
    var pointLightColorArray = hexToRGB(pointLight.color.getHex());
    console.log("Point light intensity is : " + pointLight.intensity);


    // Add ambient light, simulating surround scattering light
    ambientLight = new THREE.AmbientLight(0x282a2f);
    scene.add( ambientLight  );
    

    scene.fog = new THREE.Fog(0x172747, 1.0, 50.0);
    // Add our flashlight
    var distance  = 6.0;
    var intensity = 2.0;
    spotLight = new THREE.SpotLight( 0xffffff, 
                     intensity,
                     distance ); 
    spotLight.castShadow = false; 
    spotLight.position = new THREE.Vector3(0,0,1);
    spotLight.target = spotLightObj;
    spotLight.exponent = 188.1;
    spotLight.angle = 0.21;
    scene.add( spotLight );

    // create cube  material
    var material =
    new THREE.MeshBasicMaterial(
        {
        color: 0xFFFFFF,
        });
    
    var loader = new THREE.JSONLoader();
    // Create ground from cube and some rock
    var rockTexture = THREE.ImageUtils.loadTexture("rock.jpg");
    var cloudTexture = THREE.ImageUtils.loadTexture("clouds.png");
    var limeTexture = THREE.ImageUtils.loadTexture("lime.png");
    var pineTexture = THREE.ImageUtils.loadTexture("pine.png");
    // texture wrapping mode set as repeating
    rockTexture.wrapS = THREE.RepeatWrapping;
    rockTexture.wrapT = THREE.RepeatWrapping;
    var customPhongShader = new THREE.ShaderMaterial({
    vertexShader: $("#light-vs").text(),
    fragmentShader: $("#light-fs").text(),
    transparent: false,
    uniforms: { 
        map: {
        type: 't', 
        value: rockTexture
        },
        // setting struct field happens by using dot notation. 
        // Each field needs to be set separately. 
        "dirlight.pos": {
        type: 'v3',
        value: directionalLight.position
        },

        "dirlight.color": {
        type: 'v3',
        value: new THREE.Vector3(lightColorArray[0],lightColorArray[1],lightColorArray[2])
        },

        "pointLight.pos": {
        type: 'v3',
        value: pointLight.position
        },

        "pointLight.color": {
        type: 'v3',
        value: new THREE.Vector3(pointLightColorArray[0],pointLightColorArray[1],pointLightColorArray[2])
        },
        "pointLight.intensity": {
        type: 'f',
        value: pointLight.intensity
        },
       
        u_ambient: { 
        type: 'v4',
        value: colorToVec4(ambientLight.color) /* global ambient */
        }
    }
    });

    function handler(geometry, materials) {
    var m = new THREE.Mesh(geometry, customPhongShader);
    m.renderDepth = 1000;
    ruins.push(m);
    checkIsAllLoaded();
    }



    
    function checkIsAllLoaded(){

    if ( ruins.length == 5 ) {
        $.each(ruins, function(i,mesh){
        scene.add(mesh);
        // mesh is rotated around 
        mesh.rotation.x = Math.PI/2.0;

        });
        // arcs
        ruins[0].position.z = 13;
        // corner
        ruins[1].position.x = 13;

        // crumbled place
        ruins[2].position.x = -13;
        

        ruins[3].position.z = -13;
    }
    }
    loader.load("meshes/ruins30.js", handler);    
    loader.load("meshes/ruins31.js", handler);
    loader.load("meshes/ruins33.js", handler);
    loader.load("meshes/ruins34.js", handler); 
    loader.load("meshes/ruins35.js", handler);



    var skyboxMaterials = [];
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./nightsky/nightsky_west.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./nightsky/nightsky_east.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./nightsky/nightsky_up.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./nightsky/nightsky_down.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./nightsky/nightsky_north.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./nightsky/nightsky_south.png")}));
    $.each(skyboxMaterials, function(i,d){
    d.side = THREE.BackSide;
    d.depthWrite = false;

    });
    var sbmfm = new THREE.MeshFaceMaterial(skyboxMaterials);
    sbmfm.depthWrite = false;
    // Create a new mesh with cube geometry 
    var skybox = new THREE.Mesh(
    new THREE.CubeGeometry( 1,1,1,1,1,1 ), 
    sbmfm
    );

    skybox.position = camObject.position;
    skybox.renderDepth = 0;
    scene.add(skybox);

    //Add skydome
    loader.load("meshes/skydome.js", function(geometry,materials){
            skymesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            map : cloudTexture,
            transparent : true,
            blending: THREE.ReverseSubtractiveBlending
        }
            ));
        skymesh.position = camObject.position;
        skymesh.renderDepth = 0;
        scene.add(skymesh);
    });


    //Add trees to the scene
    addTree(limeTexture, 3.0,1.5,-20.0);
    addTree(pineTexture, 7.0,1.5,-20.0);
    addTree(limeTexture, 3.0,1.5,-24.0);
    addTree(pineTexture, 7.0,1.5,-24.0);
    addTree(limeTexture, 3.0,1.5,-16.0);
    addTree(pineTexture, 7.0,1.5,-16.0);
    addTree(limeTexture, 10,1.5,-20.0);
    addTree(pineTexture, 14,1.5,-20.0);
    addTree(limeTexture, 10,1.5,-24.0);
    addTree(pineTexture, 14,1.5,-24.0);

    //Creation of the particlesystem
    fireTexture = THREE.ImageUtils.loadTexture("fire.png");
    smokeTexture = THREE.ImageUtils.loadTexture("smoke.png");
    smokeTexture.a = 0.3;

    //FireParticles
    fireParticlesAmount = 50;
    fireParticles = new THREE.Geometry();
    fireParticleMaterial = new THREE.ParticleBasicMaterial({
        map: fireTexture,
        size: 1,
        transparent: true,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
        depthWrite: false
    })

    for (var i =0; i < fireParticlesAmount; i++) {
        var particle = new THREE.Vector3(0.0,0.2,2.0);
        particle.velocity = new THREE.Vector3(Math.round((Math.random()) * 2 - 1)/400,0.0032,(Math.round(Math.random()) * 2 - 1)/400);
        particle.lifeAmount = Math.random();
        fireParticles.vertices.push(particle);
    };

    var particleSystem = new THREE.ParticleSystem(fireParticles,fireParticleMaterial);
    particleSystem.sortParticles = true;

    scene.add(particleSystem);

    //Smokeparticles
    smokeParticles = new THREE.Geometry();
    smokeParticleMaterial = new THREE.ParticleBasicMaterial({
        map: smokeTexture,
        opacity: 0.1,
        size: 0.8,
        transparent: true,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
        depthWrite: false
    });
    for (var i =0; i < smokeParticlesAmount; i++) {
        var particle = new THREE.Vector3(Math.round((Math.random()) * 2 - 1)/400,0.8 + Math.round((Math.random()) * 2 - 1)/200,Math.round((Math.random()) * 2 - 1)/400);
        particle.velocity = new THREE.Vector3(0.001 + Math.random()/300 ,0.003,0.001 + Math.random()/300);
        particle.lifeAmount = Math.random()*6;
        smokeParticles.vertices.push(particle);
    };

    var smokeparticleSystem = new THREE.ParticleSystem(smokeParticles,smokeParticleMaterial);
    smokeparticleSystem.sortParticles = true;

    scene.add(smokeparticleSystem);

    console.log("DEBUGGAUS: " + smokeParticles);



    // Construct a mesh object
    var ground = new THREE.Mesh( new THREE.CubeGeometry(100,0.2,100,1,1,1), customPhongShader);
    ground.renderDepth = 1000;
    
    // Do a little magic with vertex coordinates so ground looks more interesting
    $.each(ground.geometry.faceVertexUvs[0], function(i,d){

    d[0] = new THREE.Vector2(0,25);
    d[2] = new THREE.Vector2(25,0);
    d[3] = new THREE.Vector2(25,25);
    });
    
    
    scene.add(ground);

    


    shoulderRotationJoint = new THREE.Object3D();
    shoulderRotationJoint.position.y = 0.5;
    shoulderTiltingJoint = new THREE.Mesh( 
    new THREE.SphereGeometry(0.2,10,10), 
    new THREE.MeshLambertMaterial({ color: 0xFF0000, transparent: true})
    );
    upperArm  = new THREE.Mesh( new THREE.CubeGeometry(0.125,0.5,0.125),
                new THREE.MeshLambertMaterial({ color: 0x00FF00, transparent: true}));
    upperArm.position.y = 0.45;
    elbowJoint = new THREE.Mesh( 
    new THREE.SphereGeometry(0.12,10,10), 
    new THREE.MeshLambertMaterial({ color: 0xFF00FF, transparent: true})
    );
    lowerArm = new THREE.Mesh( new THREE.CubeGeometry(0.125,0.5,0.125),
                new THREE.MeshLambertMaterial({ color: 0xFFFF00, transparent: true}));
    

    wrist = new THREE.Object3D();
    hand = new THREE.Mesh( new THREE.CubeGeometry(0.25,0.25,0.25),
               new THREE.MeshLambertMaterial({ color: 0x0000FF, transparent: true}));
    shoulderRotationJoint.add(shoulderTiltingJoint);
    shoulderTiltingJoint.add(upperArm);
    
    scene.add(shoulderRotationJoint);
    shoulderRotationJoint.add(shoulderTiltingJoint);
    shoulderTiltingJoint.add(upperArm);
    upperArm.add(elbowJoint);
    elbowJoint.position.y = 0.25;
    elbowJoint.add(lowerArm);
    lowerArm.position.y = 0.25;
    lowerArm.add(wrist);
    wrist.position.y = 0.25;
    wrist.add(hand);
    hand.position.y = 0.05;
    thumb =  new THREE.Mesh( new THREE.CubeGeometry(0.05,0.25,0.05),
                 new THREE.MeshLambertMaterial({ color: 0xFFAAAA, transparent: true}));
    hand.add(thumb);
    thumb.position.x = 0.2;
    thumb.rotation.z = 2.0;


    indexfinger =  new THREE.Mesh( new THREE.CubeGeometry(0.05,0.25,0.05),
                   new THREE.MeshLambertMaterial({ color: 0xFFAAAA, transparent: true}));
    hand.add(indexfinger);
    indexfinger.position.x = 0.10;
    indexfinger.position.y = 0.2;
    
    
    middlefinger =  new THREE.Mesh( new THREE.CubeGeometry(0.05,0.25,0.05),
                    new THREE.MeshLambertMaterial({ color: 0xFFAAAA, transparent: true}));
    hand.add(middlefinger);
    middlefinger.position.x = 0.0;
    middlefinger.position.y = 0.2;
    
    pinky =  new THREE.Mesh( new THREE.CubeGeometry(0.05,0.25,0.05),
                    new THREE.MeshLambertMaterial({ color: 0xFFAAAA, transparent: true}));
    hand.add(pinky);
    pinky.position.x = -0.1;
    pinky.position.y = 0.2;
    

    
    fps.time = new Date();
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
    //Create SVG element
    fps.svg = d3.select("#fps")
    .append("svg")
    .attr("width", fps.width)
    .attr("height", fps.height);

});

var angle = 0.0;
var movement = 0.0;
var moving = false;
function update(){

    // render everything 
    renderer.setClearColorHex(0x000000, 1.0);
    renderer.clear(true);
    renderer.render(scene, camera); 
    angle += 0.001;
    moving = false;
    if ( keysPressed["W".charCodeAt(0)] == true ){
    var dir = new THREE.Vector3(0,0,-1);
    var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);
    camObject.translate(0.1, dirW);
    moving = true;
    }

    if ( keysPressed["S".charCodeAt(0)] == true ){

    var dir = new THREE.Vector3(0,0,-1);
    var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);
    camObject.translate(-0.1, dirW);
    moving = true;

    }
    if ( keysPressed["A".charCodeAt(0)] == true ){
    var dir = new THREE.Vector3(-1,0,0);
    var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);
    camObject.translate(0.1, dirW);
    moving = true;
    }

    if ( keysPressed["D".charCodeAt(0)] == true ){

    var dir = new THREE.Vector3(-1,0,0);
    var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);
    camObject.translate(-0.1, dirW);
    moving = true;
    }
    if ( keysPressed["Q".charCodeAt(0)] == true ){

    shoulderRotationJoint.rotation.y += 0.1;

    }
    if ( keysPressed["E".charCodeAt(0)] == true ){

    shoulderRotationJoint.rotation.y -= 0.1;

    }
    // so strafing and moving back-fourth does not double the bounce
    if ( moving ) {
    movement+=0.1;
    camObject.position.y = Math.sin(movement*2.30)*0.07+1.2; 
    }
    spotLight.position = camObject.position;

    var dir = new THREE.Vector3(0,0,-1);
    var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);

    spotLight.target.position = dirW;
    elbowJoint.rotation.z = Math.sin(12*angle);

    shoulderTiltingJoint.rotation.z = Math.cos(12*angle);
    wrist.rotation.x = Math.sin(25*angle);


    //Rotate the sky
    if(skymesh){
        skymesh.rotation.y += 0.001;
    }

    //Update the particlesystem
    console.log(fireParticles.vertices[0]);
    console.log("PArticle lifetime: "+ fireParticles.vertices[0].lifeAmount);
    if(fireParticles.vertices.length == fireParticlesAmount){
        for(var i=0;i<fireParticlesAmount;i++){
            fireParticles.vertices[i].add(fireParticles.vertices[i].velocity);
            fireParticles.vertices[i].lifeAmount -= 0.01;
            if(fireParticles.vertices[i].lifeAmount < 0.0){
                fireParticles.vertices[i].set(0.0,0.2,2.0);
                fireParticles.vertices[i].lifeAmount = Math.random();
            }
        }
    }
    if(smokeParticles.vertices.length == smokeParticlesAmount){
        for(var i=0;i<smokeParticlesAmount;i++){
            smokeParticles.vertices[i].add(smokeParticles.vertices[i].velocity);
            smokeParticles.vertices[i].lifeAmount -= 0.01;
            if(smokeParticles.vertices[i].lifeAmount < 0.0){
                smokeParticles.vertices[i].set(Math.round((Math.random()) * 2 - 1)/200   ,   0.8 + Math.round((Math.random()) * 2 - 1)/10  , 2.0 + Math.round((Math.random()) * 2 - 1)/200);
                smokeParticles.vertices[i].lifeAmount = Math.random() * 6;
            }
        }
    }

   

    // request another frame update
    requestAnimationFrame(update);
    
    fps.ticks++;
    var tmp = new Date();
    var diff = tmp.getTime()-fps.time.getTime();

    if ( diff > 1000.0){
    fps.data.push(fps.ticks);
    if ( fps.data.length > 15 ) {
        fps.data.splice(0, 1);
    }
    fps.time = tmp;
    fps.ticks = 0;
    displayFPS();
    }
    
}
  
// for displaying fps meter 
function displayFPS(){

    fps.svg.selectAll("rect").remove();
    
    fps.svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 100)
    .attr("height", 50)
    .attr("fill", "rgb(0,0,0)");

    fps.svg.selectAll("rect")
    .data(fps.data)
    .enter()
    .append("rect")
    .attr("x", function(d, i) {
        return (i * (2+1));  //Bar width of 20 plus 1 for padding
    })
    .attr("y", function(d,i){
        return 50-(d/2);
    })
    .attr("width", 2)
    .attr("height", function(d,i){
        return (d/2);
    })
    .attr("fill", "#FFFFFF");
    
    fps.svg.selectAll("text").remove();
    fps.svg
    .append("text")
    .text( function(){
        return fps.data[fps.data.length-1] + " FPS";
    })
    .attr("x", 50)
    .attr("y", 25)
    .attr("fill", "#FFFFFF");
}  