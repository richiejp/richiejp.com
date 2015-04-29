var cubeGrid = ( function(
    xcount, 
    ycount, 
    initialSquareSize,
    maxChildProportion,
    minChildProportion){
  "use strict";
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
      coveringSquare: null,
      trodden: 0
    };
  };

  var createAutomaton = function(x, y, colour){
    var a = {
      colour: colour,
      x: x,
      y: y,
      lastAction: "move",
      orientation: [0, 1],
      lastSquare: null,
      sceneId: null
    };
    me.automatonCreatedCB( a );
    return a;
  };

  var createSquare = function( a, topLeft, size ) {
    var s = {
      automaton: a,
      topLeft: topLeft,
      size: size
    };
    a.lastSquare = s;
    return s;
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
    if( autos.length < 1 && node.coveringSquare !== null) {
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
    if( ax < xcount && ay < ycount && 
	ax > -1 && ay > -1 ) {
      return getNode( ax, ay );
    } else {
      return null;
    }
  };

  var getAdjacentNodes = function( a ) {
    var o = a.orientation;
    var n = null;
    var nodes = [
      getAdjacentNode( a, o )
    ];

    for( var i = 0; i < 3; i++ ){
      o = turnLeft( o );
      n = getAdjacentNode( a, o );
      if( n !== null ) {
	nodes.push( n );
      }
    }

    return nodes;
  };

  var isEdge = function( node ) {
    return node.edgeSquares.length > 0;
  };

  var isSingleEdge = function( node ) {
    return node.edgeSquares.length === 1;
  };

  var isDoubleEdge = function( node ) {
    return node.edgeSquares.length > 1;
  };

  var canTrace = function( toNode, fromNode ) {
    if( toNode === null || 
	toNode.coveringSquare !== null || 
	( isDoubleEdge( toNode ) && isDoubleEdge( fromNode ) ) ) {
      return false;
    } 
    return true;
  };

  var getLargestNieghbor = function(a) {
    var nodes = getAdjacentNodes( a );
    var sizes = nodes.map( 
      function( n ){ 
	var s = [ 0 ];
	if( n.coveringSquare ) {
	  s.push( n.coveringSquare.size ); 
	} else {
	  n.edgeSquares.forEach( function( cs ) {
	    s.push( cs.size );
	  } );
	}
	return Math.max.apply( null, s );
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

  var traceSquare = function( automaton ) { 
    var size;
    var topLeft = [ ];
    var traceNodes = [ ];

    var doTrace  = function( s ) {
      var current = null;
      var next = null;
      var side = 0;
      var a = { 
	x: automaton.x,
	y: automaton.y,
	orientation: automaton.orientation
      };
      traceNodes = [ ];
      topLeft = [ a.x, a.y ];

      for( var c = 1; side < 4; c++ ) {
	if(c >= s ) {
	  side++;
	  a.orientation = turnRight( a.orientation );
	  c = 1;
	}
	current = getCurrentNode( a );
	traceNodes.push( current );
	topLeft[ 0 ] = Math.min( a.x, topLeft[ 0 ] );
	topLeft[ 1 ] = Math.min( a.y, topLeft[ 1 ] );
	next = getAdjacentNode( a, a.orientation );
	if( canTrace( next, current ) ) {
	  move( a );
	} else {
	  //console.log("failed on side " + side);
	  return false;
	}
      }
      return true;
    };

    if( !doTrace( 2 ) ) {
      //console.warn("Could not even do a little one!");
      return false;
    } 

    size = Math.floor( getLargestNieghbor( automaton ) * 
	getRandom( minChildProportion, maxChildProportion ) );
    if( size < 10 ) {
      size = initialSquareSize;
    }

    while( !doTrace( size ) ) {
      if( --size < 3 ) {
	return false;
      }
    }

    var square = createSquare( automaton, topLeft, size );

    for( var x = topLeft[ 0 ] + 1; x < topLeft[ 0 ] + size - 1; x++ ) {
      for( var y = topLeft[ 1 ] + 1; y < topLeft[ 1 ] + size - 1; y++ ) {
       	getNode( x, y ).coveringSquare = square;
      }
    }

    traceNodes.forEach( function( n ) {
      n.edgeSquares.push( square );
    } );

    me.createdSquareCB( square );
    return true;
  };

  var isPassable = function( a, n ) {
    return isEdge( n ) && getAutomatons( n ).some( 
	function( na ) { return na === a; }
    );
  };

  var niceAdvance = function( a, n ) {
    return isSingleEdge( n ) && 
      getAutomatons( n )[ 0 ] === a;
  };

  var getNodeCost = function( a, n ) {
    var c = 0;
    if( isDoubleEdge( n ) ) {
      c += 3;
    }
    if( n.edgeSquares.every( function( s ) {
      return s === a.lastSquare;
    } ) ) {
      c += 6;
    }
    c += n.trodden * 6;
    return c;
  };

  var turnAutomaton = function(a) {
    var o = a.orientation;
    var directions = [
      turnLeft( o ),
      o,
      turnRight( o )
    ];
    var possibilities = [ ];
    directions.forEach( function( d, i ) {
      var an = getAdjacentNode( a, d );
      if( an !== null && isPassable( a, an ) ) {
	  possibilities.push( {
	  n: an,
	  o: d,
	  c: i + getNodeCost( a, an )
	} );
      }
    } );

    possibilities.sort( function( ap, bp ) {
      return ap.c - bp.c;
    } );

    a.orientation = possibilities[ 0 ].o;
  };

  var advanceAutomaton = function( a ) {
    if( a.lastAction === "move" ) {
      turnAutomaton( a );
      a.lastAction = "turn";
    } else {
      move( a );
      getCurrentNode( a ).trodden++;
      me.automatonMovedCB( a );
      a.lastAction = "move";
    }
  };

  me.doSim = function() {
    automatons.forEach( function( a ) {
      if( !traceSquare( a ) ) {
	advanceAutomaton( a );
      }
    } );
  };

  me.automatonCreatedCB = function ( automaton ) { };

  me.automatonMovedCB = function( automaton ) { };

  me.createdSquareCB = function( square ) { };

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

    automatons.forEach( traceSquare );
    automatons.forEach( function( a ) {
      a.orientation = [ 0, -1 ];
    } );
  };

  me.toString = function( ) {
    var str = "";
    var x, y, n;
    for(y = 0; y < xcount; y++ ) {
      for(x = 0; x < ycount; x++ ) {
	n = getNode( x, y );
	if( n.coveringSquare !== null ) {
	  if( n.edgeSquares.length > 0 ) {
	    str += '! ';
	  } else {
	    str += 'X ';
	  }
	} else if ( n.edgeSquares.length > 0 ) {
	  str += '+ ';
	} else {
	  str += '  ';
	}
      }
      str += '\n';
    }
    return str;
  };

  return me;
} )( 1000, 500, 80, 4 / 5, 3 / 4 );

( function( ) {
  "use strict";
  var maxSimTimeDelta = 1;
  var lastSimTime = performance.now( );
  var lastTime = lastSimTime;
  var delta = 0;

  cubeGrid.automatonCreatedCB = function( automaton ) {
    var cube = new THREE.Mesh( 
	new THREE.BoxGeometry( 20, 20, 20 ),
	new THREE.MeshPhongMaterial( { color: 0x110000 } )
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

    var pointLight = new THREE.PointLight( 0xffffff, 1, 400 );
    pointLight.position.set( automaton.x, automaton.y, 200 );
    scene.add( pointLight );
  };

  cubeGrid.automatonMovedCB = function( automaton ) {
    var cube = scene.getObjectById( automaton.sceneId );
    cube.position.x = automaton.x;
    cube.position.y = automaton.y;
    cube.updateMatrix();
  };

  cubeGrid.createdSquareCB = function( square ) {
    var s = square.size;
    var h = 10 * Math.log( 22 - s/4 );
    var cube = new THREE.Mesh(
	new THREE.BoxGeometry( s, s, h ),
	new THREE.MeshPhongMaterial( { 
	  color: square.automaton.colour
	} )
    );
    var m = new THREE.Matrix4();
    m.makeTranslation(
	square.topLeft[ 0 ] + s/2,
	square.topLeft[ 1 ] + s/2,
	h / 2
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
  var controls = new THREE.OrbitControls( camera );
  var worldlight = new THREE.DirectionalLight( 0xffffff, 0.8 );
  //light.position.set( 0, 0, 1 );
  scene.add( worldlight );

  var renderer = new THREE.WebGLRenderer( { 
    antialias: true
  } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0xffffff, 1 );
  document.body.appendChild( renderer.domElement );

  camera.position.x = 500;
  camera.position.y = 250;
  camera.position.z = 350;

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

} )( );
