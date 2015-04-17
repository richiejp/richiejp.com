var cubeGrid = function(
    xcount, 
    ycount, 
    clusterCount,
    initialSquareSize,
    maxChildProportion,
    minChildProportion){
  var me = {};
  var grid = [];

  var allocGrid = function(x, y){
    var g = [];
    for(var i = 0; i < x * y; i++){
      g[i] = createNode(); 
    }
  }

  var createNode = function(){
    return { 
      edgeSquares: [ ],
      coveringSquare: null
    };
  }

  var createAutomaton = function(x, y){ }

  var createSquare = function() { }

  var traceSquare = function(a) { }

  var advanceAutomaton = function(a) { }

  me.doStep = function() { }

  me.automatonMovedCB = function(automaton) { }

  me.createdSquareCB = function(automaton, square) { }

}
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight,
    0.1,
    1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

var plane = new THREE.Mesh( 
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial( { color: 0xffffff } ));
scene.add( plane );

camera.position.z = 5;

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();
