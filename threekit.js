/**
 * This is a set of globally available functions that can be used to interact with the Three.js from within hydra.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

window.initThreekit = function () {
    if (window.threekit) return window.threekit;

    const _hash = (str) => {
        // https://stackoverflow.
        // com/questions/7616461/generate-a-hash-from-string-in-javascript

        let hash = 0, i, chr;
        if (str.length === 0) return hash;
        else {
            for (i = 0; i < str.length; i++) {
                chr = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0;
            }
        }
    }

    console.time("Initializing Threekit");
    console.log("Initializing Threekit");

    // Add hidden canvas to the body
    // const ID = 'threekit-canvas';
    // const canvas = document.createElement('canvas');
    // canvas.id = ID;
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    // canvas.style.display = 'none';
    // document.body.appendChild(canvas);

    // const ctx = canvas.getContext('2d');
    const once = (fn, cacheKey = _hash(fn.toString())) => {
        // call once, but allow again if cacheKey changes

        let lastKey = null;
        let called = false;
        return (...args) => {
            setTimeout(() => {
                if (lastKey !== cacheKey) {
                    called = false;
                    lastKey = cacheKey;
                }
                if (!called) {
                    called = true;
                    return fn(...args);
                }
            },100);
        }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    const controls = new OrbitControls(camera, renderer.domElement);

    const ctx = renderer.domElement.getContext('2d');
    renderer.domElement.id='threekit-canvas';

    window.threekit = {
        scene,
        camera,
        renderer,
        controls,
        objects: [],
        canvas: renderer.domElement,
        ctx,
        once,
        THREE,
        add: function (object, id) {
            this.objects.push(object);
            this.scene.add(object);
        },
        remove: function (objectOrId) {
            const object = this.objects.find(o => o.id === objectOrId) || objectOrId;
            this.scene.remove(object);
            this.objects = this.objects.filter(o => o !== object);
        },
        render: function () {
            this.renderer.render(this.scene, this.camera);
        },
        init: function () {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(this.renderer.domElement);
            this.camera.position.z = 5;
            this.controls.update();
            this.animate();
        },
        animate: function () {
            requestAnimationFrame(this.animate.bind(this));
            this.controls.update();
            this.objects.forEach(o => o.update?.());
            this.renderer.render(this.scene, this.camera);
        },
        _visible: false,
        togglePreview: function (forceTrue) {
            this._visible = !this._visible || forceTrue;
            this.canvas.style.display = this._visible ? 'block' : 'none';
            this.canvas.style.position = 'absolute';
            if ( document.getElementById('threekit-canvas')) {

            } else {
                document.body.appendChild(this.renderer.domElement)
            }
        }
    }
    window.THREE = THREE;
    console.timeEnd("Initializing Threekit");
    window.threekit.init();
    console.log("Threekit initialized 💠");

    return window.threekit;
}