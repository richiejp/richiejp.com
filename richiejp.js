var cubeGrid = function(
    xcount, 
    ycount, 
    clusterCount,
    initialSquareSize,
    maxChildProportion,
    minChildProportion){
  var me = {};
  var grid = [];
  var automatons = [];

  var allocGrid = function(x, y){
    var g = [];
    for(var i = 0; i < x * y; i++){
      g.push( createNode() ); 
    }
  }

  var createNode = function(){
    return { 
      edgeSquares: [ ],
      coveringSquare: null
    };
  }

  var createAutomaton = function(x, y, colour){
    return {
      colour: colour,
      x: x,
      y: y,
      orientation: [0, 1]
    }
  }

  var createSquare = function() { }

  var getNode = function(x, y) {
    return g[ x + y * xcount ];
  }

  var getCurrentNode = function(a) {
    return getNode( a.x, a.y );
  }

  var turnLeft = function(orientation) {
    var o = [];
    o.push( orientation[1] );
    o.push( -orientation[0] );
    return o;
  }

  var turnRight = function(orientation) {
    var o = [];
    o.push( -orientation[1] );
    o.push( orientation[0] );
    return o;
  }

  var getAdjacentNode = function(a, o) {
    return getNode( a.x + o[0], a.y + o[1] );
  }

  var getAdjacentNodes = function(a) {
    var o = a.orientation;
    var nodes = [
      getAdjacentNode( a, o );
    ]

    for( var i = 0; i < 3; i++ ){
      o = turnLeft( o );
      nodes.push( getAdjacentNode( a, o ) );
    }

    return nodes;
  }

  var isDoubleEdge = function( node ) {
    return node.edgeSquares.count > 1;
  }

  var canTrace = function(toNode, fromNode) {
    if( toNode.coveringSquare !== null ){
      return false;
    } else if( isDoubleEdge( toNode ) && isDoubleEdge( fromNode ) ) { 
      return false;
    }
    return true;
  }

  var getLargestNieghbor = function(a) {
    var nodes = getAdjacentNodes(a);
    sizes = nodes.map( function(n){ return n.size; } );
    sizes.push( 0 );
    return Math.max.apply( null, sizes );
  }
  
  var getRandom = function( min, max ) {
    return Math.random() * (max - min) + min;
  }

  var getRandomInt = function( min, max ) {
    return Math.floor( Math.random() * (max - min) + min );
  }

  var move = function( a ) {
    a.x += a.o[ 0 ];
    a.y += a.o[ 1 ];
  }

  var traceSquare = function( a ) { 
    var o = a.orientation;
    var startPos = [ a.x, a.y, o[ 0 ], o[ 1 ] ];
    var traceNodes = [ ];
    var side = 0;
    var size = getLargestNieghbor( a );
      * getRandom( minChildProportion, maxChildProportion );
    if( size === 0 ) {
      size = initialSquareSize;
    }

    var current = null;
    var next = null;
    for( var c = 0; side < 4; c++ ) {
      if(c > size ) {
	side++;
	a.orientation = turnRight( o );
      }
      current = getCurrentNode( a );
      next = getAdjacentNode( a, o );
      if( canTrace( next, current ) ) {
	traceNodes.push( current );
	move( a );
      } else {
        if( --size < 1 ) {
	  return;
	} else {
	  a.x = startPos[ 0 ];
	  a.y = startPos[ 1 ];
	  a.orientation[ 0 ] = startPos[ 2 ];
	  a.orientation[ 1 ] = startPos[ 3 ]; 
	  c = 0;
	  side = 0;
	  traceNodes = [ ];
	}
      }
    }

    var square = createSquare( a, size );

    for( var x = startPos[ 0 ] + 1; x < size; x++ ) {
      for( var y = startPos[ 1 ] + 1; y < size; y++ ) {
       	getNode( x, y ).coveringSquare = square;
      }
    }

    traceNodes.forEach( function( n ) {
      n.edgeSquare.push( square );
    } );
  }

  var advanceAutomaton = function(a) { }

  me.doStep = function() {
    
  }

  me.automatonMovedCB = function(automaton) { }

  me.createdSquareCB = function(automaton, square) { }

  //Init grid
  allocGrid( xcount, ycount );
  automatons.push( createAutomaton( 
      Math.floor( xcount / 4 ),
      Math.floor( ycount / 4 ),
      0xff0000 )); 

  automatons.map(traceSquare);

  return me;
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
