/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

// TODO: make movement interpolation (smooth)
// TODO: cleanout more junk
// TODO: fix the garbage that sets distance and rotation each tick

THREE.OrbitControls = function ( object, domElement ) {

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API
	this.enabled = true;
	this.center = new THREE.Vector3();

	this.userZoom = true;
	this.userZoomSpeed = Math.pow(0.95, 1.0);
	this.userRotate = true;
	this.userRotateSpeed = 1.0;

	this.minPolarAngle = 0; // radians // angle from top
	this.maxPolarAngle = Math.PI/2; // radians // angle from bottom
	this.minDistance = 10;
	this.maxDistance = 100;
	
	// internals
	var scope = this;

	var EPS = 0.000001;
	var PIXELS_PER_ROUND = 1800;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;

	var IsRotating = false;
	var IsInterpolating = false;
	var destination;
	const interpolation_speed = 1;
	// events
	//var changeEvent = { type: 'change' };
	var HasMoved = false;

	// ui hooks
	var movement_image = document.getElementById("move_img");
	var rotation_image = document.getElementById("rotate_img");
	var zooming_image = document.getElementById("zoom_img");
	const active_transparency = 1.0;
	const inactive_transparency = 0.5;
	const disabled_transparency = 0.25;

	this.goto_offset = function (x, y, z){
		if (scope.enabled === false) return;
		//this.object.position.sub(this.center);
		//this.center = new THREE.Vector3(x,z,y);
		//this.object.position.add(this.center);
		destination = new THREE.Vector3(x,z,y);
		
		movement_status(true);
	};
	this.update = function (){
		// why on god does this run each tick??????
		// we should do all the maths when we move the mouse should we not?
		if (IsInterpolating){
			let distance_vec = this.center.clone();
			distance_vec.sub(destination);
			let testa = distance_vec.length();
			if (testa == 0){
				movement_status(false);
			}else{
				distance_vec.normalize().multiplyScalar(interpolation_speed);
				if (testa < distance_vec.length()){ // aka, the normalization will actually increase the value, so decrease normalization or something
					distance_vec.multiplyScalar(testa);
					movement_status(false);
				}
				this.object.position.sub(distance_vec);
				this.center.sub(distance_vec);
		}}


		if (!HasMoved && !IsInterpolating) return; // skip this section
		var position = this.object.position;
		var offset = position.clone().sub( this.center );
		// angle from z-axis around y-axis
		var theta = Math.atan2( offset.x, offset.z );
		// angle from y-axis
		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );
		theta += thetaDelta;
		phi += phiDelta;
		// restrict phi to be between desired limits
		phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );
		// restrict phi to be betwee EPS and PI-EPS
		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );
		var radius = offset.length() * scale;
		// restrict radius to be between desired limits
		radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

		offset.x = radius * Math.sin( phi ) * Math.sin( theta );
		offset.y = radius * Math.cos( phi );
		offset.z = radius * Math.sin( phi ) * Math.cos( theta );

		position.copy( this.center ).add( offset );
		this.object.lookAt( this.center );

		thetaDelta = 0;
		phiDelta = 0;
		scale = 1;
		HasMoved = false;

		//if ( lastPosition.distanceTo( this.object.position ) > 0 ) {
		//	this.dispatchEvent( changeEvent );
		//	lastPosition.copy( this.object.position );
		//}
	};
	this.onMouseDown = function( event ) {
		if (scope.enabled === false || scope.userRotate === false) return;
		event.preventDefault();
		if (!IsRotating && event.button === 1){
			rotation_status(true);
			rotateStart.set( event.clientX, event.clientY );
		}
		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );
	};

	function rotation_status(state){
		IsRotating = state;
		if (IsRotating) {
			rotation_image.style.opacity = active_transparency;
			zooming_image.style.opacity = disabled_transparency;
		}
		else{
			rotation_image.style.opacity = inactive_transparency;
			zooming_image.style.opacity = inactive_transparency;
		}
	}
	function movement_status(state){
		IsInterpolating = state;
		if (IsInterpolating) movement_image.style.opacity = active_transparency;
		else movement_image.style.opacity = inactive_transparency;
	}

	function onMouseMove( event ) {
		if (scope.enabled === false) return;
		event.preventDefault();
		if (IsRotating) {
			rotateEnd.set( event.clientX, event.clientY );
			rotateDelta.subVectors( rotateEnd, rotateStart );
			thetaDelta -= ( 2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed ); // inlined version
			phiDelta -= ( 2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed ); // inlined version
			rotateStart.copy( rotateEnd );
			HasMoved = true; // allow a position update next tick
			
	}}
	function onMouseUp(event) {
		if ( scope.enabled === false || scope.userRotate === false ) return;
		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		rotation_status(false);
	}
	function onMouseWheel(event) {
		if (scope.enabled === false || scope.userZoom === false || IsRotating) return;
		var delta = 0;
		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9
			delta = event.wheelDelta;
		} else if ( event.detail ) { // Firefox
			delta = -event.detail;
		}

		if ( delta > 0 ) scale *= scope.userZoomSpeed;
		else scale /= scope.userZoomSpeed;
		HasMoved = true; // allow a position update next tick
	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	//this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
	//window.addEventListener( 'keydown', onKeyDown, false );
	//window.addEventListener( 'keyup', onKeyUp, false );
};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
