var cubeGrid = ( function(
    xcount, 
    ycount, 
    clusterCount,
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
    if( size === 0 ) {
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

  var okAdvance = function( a, n ) {
    return isDoubleEdge( n ) && getAutomatons( n ).some( 
	function( na ) { return na === a; }
    );
  };

  var niceAdvance = function( a, n ) {
    return isSingleEdge( n ) && 
      getAutomatons( n )[ 0 ] === a;
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
      if( an !== null ) {
	  possibilities.push( {
	  n: an,
	  o: d,
	  i: i
	} );
      }
    } );

    possibilities.sort( function( ap, bp ) {
      return (ap.i + ap.n.trodden * 3 ) - 
	( bp.i + bp.n.trodden * 3 );
    } );

    var success = possibilities.some( function( t, i ) {
      if( niceAdvance( a, t.n ) ) {
	a.orientation = t.o;
	t.n.trodden += 1;
	if( i === 2 ) {
	  //console.warn("Had to turn right");
	}
	return true;
      }
      return false;
    } );

    if( !success ) {
      console.warn("Could not use nice route");
      success = possibilities.some( function( t ) {
	if( okAdvance( a, t.n ) ) {
	  a.orientation = t.o;
	  t.n.trodden += 1;
	  return true;
	}
	return false;
      } );
    }

    if( !success ) {
      console.error("Automaton could not find path!");
    }
  };

  var advanceAutomaton = function( a ) {
    if( a.lastAction === "move" ) {
      turnAutomaton( a );
      a.lastAction = "turn";
    } else {
      move( a );
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
} )( 500, 500, 1, 50, 4 / 5, 3 / 4 );

( function( ) {
  "use strict";
  var maxSimTimeDelta = 50;
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

    var pointLight = new THREE.PointLight( 0xffffff, 1, 250 );
    pointLight.position.set( automaton.x, automaton.y, 100 );
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
    var cube = new THREE.Mesh(
	new THREE.BoxGeometry( s, s, 300 / s ),
	new THREE.MeshPhongMaterial( { 
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
    console.log( '\n' + cubeGrid.toString() );
  };

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight,
      0.1,
      1000
  );

  var worldlight = new THREE.DirectionalLight( 0xffffff, 0.8 );
  //light.position.set( 0, 0, 1 );
  scene.add( worldlight );

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0xffffff, 1 );
  document.body.appendChild( renderer.domElement );

  camera.position.x = 250;
  camera.position.y = 250;
  camera.position.z = 200;

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
