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
      orientation: [0, 1],
      sceneId: null
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

  var getAutomatons = function( node ) {
    var autos = node.edgeSquares.map(
	function( s ) { return s.automaton; }
    );
    if( autos.length < 1 && node.coveringSquare != null) {
      autos.push( node.coveringSquare.automaton );
    }
    return autos;
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
    var ax = a.x + o[0];
    var ay = a.y + o[1];
    if( ax < xcount && ay < ycount ) {
      return getNode( ax, ay );
    } else {
      return null;
    }
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

  var isSingleEdge = function( node ) {
    return node.edgeSquares.length === 1;
  };

  var isDoubleEdge = function( node ) {
    return node.edgeSquares.length > 1;
  };

  var canTrace = function( toNode, fromNode ) {
    if( toNode === null
	|| toNode.coveringSquare !== null 
	|| ( isDoubleEdge( toNode ) 
	     && isDoubleEdge( fromNode ) ) ) {
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
    var topLeft = [ ];
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

      for( var c = 1; side < 4; c++ ) {
	if(c >= size ) {
	  side++;
	  o = turnRight( o );
	  a.orientation = o;
	  c = 1;
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

    for( var x = topLeft[ 0 ] + 1; x < topLeft[ 0 ] + size - 1; x++ ) {
      for( var y = topLeft[ 1 ] + 1; y < topLeft[ 1 ] + size - 1; y++ ) {
       	getNode( x, y ).coveringSquare = square;
      }
    }

    traceNodes.forEach( function( n ) {
      n.edgeSquares.push( square );
    } );

    me.createdSquareCB( square );
  }

  var okAdvance = function( a, n ) {
    return isDoubleEdge( n ) && getAutomatons( n ).some( 
	function( na ) { return na === a; }
    );
  }

  var niceAdvance = function( a, n ) {
    return isSingleEdge( n ) && 
      getAutomatons( n ).pop() === a;
  }

  var advanceAutomaton = function(a) {
    var o = a.orientation;
    var directions = [
      turnLeft( o ),
      o,
      turnRight( o )
    ];
    var possibilities = [ ];
    directions.forEach( function( d ) {
      var an = getAdjacentNode( a, d );
      if( an !== null ) {
	  possibilities.push( {
	  n: an,
	  o: d
	} );
      }
    } );

    var success = possibilities.some( function( t ) {
      if( niceAdvance( a, t.n ) ) {
	a.orientation = t.o;
	return true;
      }
      return false;
    } );

    if( !success ) {
      success = possibilities.some( function( t ) {
	if( okAdvance( a, t.n ) ) {
	  a.orientation = t.o;
	  return true;
	}
	return false;
      } );
    }

    if( success ) {
      move( a );
      me.automatonMovedCB( a );
    } else {
      console.error("Automaton could not find path!");
    }
  }

  me.doSim = function() {
    automatons.map( function( a ) {
      advanceAutomaton( a );
    } );
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

  me.toString = function( ) {
    var str = "";
    var x, y, n;
    for(y = 0; y < xcount; y++ ) {
      for(x = 0; x < ycount; x++ ) {
	n = getNode( x, y );
	if( n.coveringSquare !== null ) {
	  str += 'X ';
	} else if ( n.edgeSquares.length > 0 ) {
	  str += '+ ';
	} else {
	  str += '  ';
	}
      }
      str += '\n';
    }
    return str;
  }

  return me;
} )( 500, 500, 1, 100, 19 / 25, 3 / 4 );

var maxSimTimeDelta = 100;
var lastSimTime = performance.now( );
var lastTime = lastSimTime;
var delta = 0;

cubeGrid.automatonCreatedCB = function( automaton ) {
  var cube = new THREE.Mesh( 
      new THREE.BoxGeometry( 20, 20, 20 ),
      new THREE.MeshBasicMaterial( { color: 0x000000 } )
  );
  var m = new THREE.Matrix4();
  m.makeTranslation( 
      automaton.x, 
      automaton.y, 
      0 
  );
  cube.applyMatrix( m );
  cube.name = automaton.colour.toString();
  automaton.sceneId = cube.id;
  scene.add( cube );
};

cubeGrid.automatonMovedCB = function( automaton ) {
  var cube = scene.getObjectById( automaton.sceneId );
  cube.position.x = automaton.x;
  cube.position.y = automaton.y;
  cube.updateMatrix();
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
      square.topLeft[ 0 ] + s/2,
      square.topLeft[ 1 ] + s/2,
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
camera.position.z = 250;

cubeGrid.init( );
//console.log( '\n' + cubeGrid.toString() );

function render( timeStamp ) {
  delta = timeStamp - lastSimTime; 
  if( delta > maxSimTimeDelta ) {
    cubeGrid.doSim( );
    lastSimTime = timeStamp;
  }
  delta = timeStamp - lastTime;
  lastTime = timeStamp;
  //TODO: Other animations or effects
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render( performance.now( ) );

