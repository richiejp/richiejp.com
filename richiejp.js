var cubeGrid = ( function(
    xcount, 
    ycount, 
    clusterCount,
    initialSquareSize,
    maxChildProportion,
    minChildProportion){
  var me = {};
  var grid = [];
  var automatons = [];

  var allocGrid = function( x, y ) {
    var g = [];
    for(var i = 0; i < x * y; i++) {
      g.push( createNode() ); 
    }
    return g;
  };

  var createNode = function(){
    return { 
      edgeSquares: [ ],
      coveringSquare: null
    };
  };

  var createAutomaton = function(x, y, colour){
    var a = {
      colour: colour,
      x: x,
      y: y,
      orientation: [0, 1]
    };
    me.automatonCreatedCB( a );
    return a;
  };

  var createSquare = function( a, topLeft, size ) {
    return {
      automaton: a,
      topLeft: topLeft,
      size: size
    };
  };

  var getNode = function( x, y ) {
    return grid[ x + y * xcount ];
  };

  var getCurrentNode = function( a ) {
    return getNode( a.x, a.y );
  };

  var turnLeft = function( orientation ) {
    var o = [];
    o.push( orientation[1] );
    o.push( -orientation[0] );
    return o;
  };

  var turnRight = function( orientation ) {
    var o = [];
    o.push( -orientation[1] );
    o.push( orientation[0] );
    return o;
  };

  var getAdjacentNode = function(a, o) {
    return getNode( a.x + o[0], a.y + o[1] );
  };

  var getAdjacentNodes = function(a) {
    var o = a.orientation;
    var nodes = [
      getAdjacentNode( a, o )
    ];

    for( var i = 0; i < 3; i++ ){
      o = turnLeft( o );
      nodes.push( getAdjacentNode( a, o ) );
    }

    return nodes;
  };

  var isDoubleEdge = function( node ) {
    return node.edgeSquares.count > 1;
  };

  var canTrace = function( toNode, fromNode ) {
    if( toNode.coveringSquare !== null ){
      return false;
    } else if( isDoubleEdge( toNode ) && isDoubleEdge( fromNode ) ) { 
      return false;
    }
    return true;
  };

  var getLargestNieghbor = function(a) {
    var nodes = getAdjacentNodes(a);
    sizes = nodes.map( 
      function(n){ 
	if( n.coveringSquare ) {
	  return n.coveringSquare.size; 
	} else {
	  return 0;
	}
      } 
    );
    return Math.max.apply( null, sizes );
  };
  
  var getRandom = function( min, max ) {
    return Math.random() * (max - min) + min;
  };

  var getRandomInt = function( min, max ) {
    return Math.floor( Math.random() * (max - min) + min );
  };

  var move = function( a ) {
    a.x += a.orientation[ 0 ];
    a.y += a.orientation[ 1 ];
  };

  var traceSquare = function( a ) { 
    var startPos = [ a.x, a.y, 
      a.orientation[ 0 ], a.orientation[ 1 ] ];
    var topLeft = null;
    var traceNodes = [ ];
    var size = getLargestNieghbor( a )
      * getRandom( minChildProportion, maxChildProportion );
    if( size === 0 ) {
      size = initialSquareSize;
    }

    var doTrace  = function( ) {
      var current = null;
      var next = null;
      var side = 0;
      var o = startPos.slice(2, 4);
      a.x = startPos[ 0 ];
      a.y = startPos[ 1 ];
      a.orientation = o;
      topLeft = startPos.slice(0, 2);

      for( var c = 0; side < 4; c++ ) {
	if(c > size ) {
	  side++;
	  a.orientation = turnRight( o );
	}
	current = getCurrentNode( a );
	traceNodes.push( current );
	topLeft[ 0 ] = Math.min( a.x, topLeft[ 0 ] );
	topLeft[ 1 ] = Math.min( a.y, topLeft[ 1 ] );
	next = getAdjacentNode( a, o );
	if( canTrace( next, current ) ) {
	  move( a );
	} else {
	  return false;
	}
      }
      return true;
    };

    while( !doTrace( ) ) {
      if( --size < 1 ) {
	return;
      }
    }

    var square = createSquare( a, topLeft, size );

    for( var x = startPos[ 0 ] + 1; x < size; x++ ) {
      for( var y = startPos[ 1 ] + 1; y < size; y++ ) {
       	getNode( x, y ).coveringSquare = square;
      }
    }

    traceNodes.forEach( function( n ) {
      n.edgeSquares.push( square );
    } );

    me.createdSquareCB( square );
  }

  var advanceAutomaton = function(a) { }

  me.doStep = function() {
    
  }

  me.automatonCreatedCB = function ( automaton ) { }

  me.automatonMovedCB = function( automaton ) { }

  me.createdSquareCB = function( square ) { }

  me.init = function( ) {
    grid = allocGrid( xcount, ycount );
    automatons.push( createAutomaton( 
	Math.floor( xcount / 4 ),
	Math.floor( ycount / 4 ),
	0xff0000 
    ) ); 
    automatons.push( createAutomaton(
	Math.floor( xcount * 3 / 4 ),
	Math.floor( ycount * 3 / 4 ),
	0x00ff00
    ) );
    automatons.push( createAutomaton(
	Math.floor( xcount / 2 ),
	Math.floor( ycount / 2 ),
	0x0000ff
    ) );

    automatons.map( traceSquare );
  }

  return me;
} )( 500, 500, 1, 100, 19 / 25, 3 / 4 );

cubeGrid.automatonCreatedCB = function( automaton ) {
  var cube = new THREE.Mesh( 
      new THREE.BoxGeometry( 20, 20, 20 ),
      new THREE.MeshBasicMaterial( { color: 0x000000 } )
  );
  var m = new THREE.Matrix4();
  m.makeTranslation( 
      automaton.x - 10, 
      automaton.y - 10, 
      0 
  );
  cube.applyMatrix( m );
  scene.add( cube );
};

cubeGrid.automatonMovedCB = function( automaton ) {

};

cubeGrid.createdSquareCB = function( square ) {
  var s = square.size;
  var cube = new THREE.Mesh(
      new THREE.BoxGeometry( s, s, 200 / s ),
      new THREE.MeshBasicMaterial( { 
	color: square.automaton.colour
      } )
  );
  var m = new THREE.Matrix4();
  m.makeTranslation(
      square.topLeft[ 0 ],
      square.topLeft[ 1 ],
      0
  );
  cube.applyMatrix( m );
  scene.add( cube );
};

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xffffff, 1 );
document.body.appendChild( renderer.domElement );

camera.position.x = 250;
camera.position.y = 250;
camera.position.z = 500;

cubeGrid.init( );

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();
