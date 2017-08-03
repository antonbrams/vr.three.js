/* globals THREE */
/**
* DeviceOrientationControls - applies device orientation on object rotation
*
* @param {Object} object - instance of Object3D
* @constructor
*
* @author richt / http://richt.me
* @author WestLangley / http://github.com/WestLangley
* @author jonobr1 / http://jonobr1.com
* @author arodic / http://aleksandarrodic.com
* @author doug / http://github.com/doug
*
* W3C Device Orientation control
* (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
*/

import {Quaternion, Vector3, Matrix4, Euler, Math as math} from 'three'

var deviceOrientation = {};
var screenOrientation = window.orientation || 0;
function onDeviceOrientationChangeEvent(evt) {
	deviceOrientation = evt;
}
window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
function getOrientation() {
	switch (window.screen.orientation || window.screen.mozOrientation) {
		case 'landscape-primary':
		return 90;
		case 'landscape-secondary':
		return -90;
		case 'portrait-secondary':
		return 180;
		case 'portrait-primary':
		return 0;
	}
	return window.orientation || 0;
}
function onScreenOrientationChangeEvent() {
	screenOrientation = getOrientation();
}
window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
export default function(object) {
	this.object = object;
	this.object.rotation.reorder('YXZ');
	this.freeze = true;
	this.movementSpeed = 1.0;
	this.rollSpeed = 0.005;
	this.autoAlign = true;
	this.autoForward = false;
	this.alpha = 0;
	this.beta = 0;
	this.gamma = 0;
	this.orient = 0;
	this.alignQuaternion = new Quaternion();
	this.orientationQuaternion = new Quaternion();
	var quaternion = new Quaternion();
	var quaternionLerp = new Quaternion();
	var tempVector3 = new Vector3();
	var tempMatrix4 = new Matrix4();
	var tempEuler = new Euler(0, 0, 0, 'YXZ');
	var tempQuaternion = new Quaternion();
	var zee = new Vector3(0, 0, 1);
	var up = new Vector3(0, 1, 0);
	var v0 = new Vector3(0, 0, 0);
	var euler = new Euler();
	var q0 = new Quaternion(); // - PI/2 around the x-axis
	var q1 = new Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
	this.update = (function(delta) {
		return function(delta) {
			if (this.freeze) return;
			this.alpha = deviceOrientation.gamma ?
			math.degToRad(deviceOrientation.alpha) : 0; // Z
			this.beta = deviceOrientation.beta ?
			math.degToRad(deviceOrientation.beta) : 0; // X'
			this.gamma = deviceOrientation.gamma ?
			math.degToRad(deviceOrientation.gamma) : 0; // Y''
			this.orient = screenOrientation ?
			math.degToRad(screenOrientation) : 0; // O
			euler.set(this.beta, this.alpha, - this.gamma, 'YXZ');
			quaternion.setFromEuler(euler);
			quaternionLerp.slerp(quaternion, 0.5); // interpolate
			// orient the device
			if (this.autoAlign) this.orientationQuaternion.copy(quaternion); // interpolation breaks the auto alignment
			else this.orientationQuaternion.copy(quaternionLerp);
			// camera looks out the back of the device, not the top
			this.orientationQuaternion.multiply(q1);
			// adjust for screen orientation
			this.orientationQuaternion.multiply(q0.setFromAxisAngle(zee, - this.orient));
			this.object.quaternion.copy(this.alignQuaternion);
			this.object.quaternion.multiply(this.orientationQuaternion);
			if (this.autoForward) {
				tempVector3
					.set(0, 0, -1)
					.applyQuaternion(this.object.quaternion, 'ZXY')
					.setLength(this.movementSpeed / 50); // TODO: why 50 :S
				this.object.position.add(tempVector3);
			}
			if (this.autoAlign && this.alpha !== 0) {
				this.autoAlign = false;
				this.align();
			}
		};
	})();
	this.align = function() {
		tempVector3
			.set(0, 0, -1)
			.applyQuaternion( tempQuaternion.copy(this.orientationQuaternion).inverse(), 'ZXY' );
		tempEuler.setFromQuaternion(
			tempQuaternion.setFromRotationMatrix(
				tempMatrix4.lookAt(tempVector3, v0, up)
			)
		);
		tempEuler.set(0, tempEuler.y, 0);
		this.alignQuaternion.setFromEuler(tempEuler);
	};
	this.connect = function() {
		this.freeze = false;
	};
	this.disconnect = function() {
		this.freze = true;
	};
};

