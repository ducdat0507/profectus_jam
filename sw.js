if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,l)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let a={};const o=e=>i(e,r),u={module:{uri:r},exports:a,require:o};s[r]=Promise.all(n.map((e=>u[e]||o(e)))).then((e=>(l(...e),a)))}}define(["./workbox-7369c0e1"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"apple-touch-icon.png",revision:"26e53bb981d06c8069ffd9d2a14fce0e"},{url:"assets/@fontsource.7386452e.css",revision:null},{url:"assets/@vue.f39bd477.js",revision:null},{url:"assets/amator.0d8662e6.js",revision:null},{url:"assets/bezier-easing.a990b400.js",revision:null},{url:"assets/gameLoop.e44a4bff.js",revision:null},{url:"assets/index.8120dc42.css",revision:null},{url:"assets/index.aab4c9ed.js",revision:null},{url:"assets/lz-string.dccec454.js",revision:null},{url:"assets/nanoevents.1080beb7.js",revision:null},{url:"assets/ngraph.events.083734c6.js",revision:null},{url:"assets/panzoom.a3919164.js",revision:null},{url:"assets/sortablejs.c81ffc7d.js",revision:null},{url:"assets/vue-next-select.90a10463.js",revision:null},{url:"assets/vue-next-select.9e6f4164.css",revision:null},{url:"assets/vue-panzoom.84096fdf.js",revision:null},{url:"assets/vue-textarea-autosize.35804eaf.js",revision:null},{url:"assets/vue-toastification.1036abd4.js",revision:null},{url:"assets/vue-toastification.4b5f8ac8.css",revision:null},{url:"assets/vue.d3924a70.js",revision:null},{url:"assets/vuedraggable.09420910.js",revision:null},{url:"assets/wheel.e9936e98.js",revision:null},{url:"assets/workbox-window.4a8794bb.js",revision:null},{url:"favicon.ico",revision:"eead31eb5b19fa3bdc34af83d898c0b7"},{url:"favicon.svg",revision:"c8dd2748f1fedd25449164d7dda6aecb"},{url:"index.html",revision:"e4781d5f7280d890fed32db02bafca7b"},{url:"pwa-192x192.png",revision:"a16785d9e890858c5b508e0ef6954aaf"},{url:"pwa-512x512.png",revision:"b84004b93fd62ef6599ff179372861a1"},{url:"favicon.ico",revision:"eead31eb5b19fa3bdc34af83d898c0b7"},{url:"robots.txt",revision:"5e0bd1c281a62a380d7a948085bfe2d1"},{url:"apple-touch-icon.png",revision:"26e53bb981d06c8069ffd9d2a14fce0e"},{url:"pwa-192x192.png",revision:"a16785d9e890858c5b508e0ef6954aaf"},{url:"pwa-512x512.png",revision:"b84004b93fd62ef6599ff179372861a1"},{url:"manifest.webmanifest",revision:"a624c732bbcf4050d28ac9402393b9e0"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
