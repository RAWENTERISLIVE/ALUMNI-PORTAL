/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-8d0d8005'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "placeholder.svg",
    "revision": "35707bd9960ba5281c72af927b79291f"
  }, {
    "url": "logo.png",
    "revision": "340c702e315e273199f3904ba607b6fc"
  }, {
    "url": "index.html",
    "revision": "53f717c48cf588ea9f40ce2f1bf8aace"
  }, {
    "url": "hero-mpsajmer.png",
    "revision": "1d1fb2cac04975daa5893d562d7e3e5e"
  }, {
    "url": "favicon.png",
    "revision": "340c702e315e273199f3904ba607b6fc"
  }, {
    "url": "favicon.ico",
    "revision": "ad1a6f4c5183484aea75bd061d11fc25"
  }, {
    "url": "splash/splash-828x1792.png",
    "revision": "d6eab23e1eeeda671321d4bae90406a1"
  }, {
    "url": "splash/splash-750x1334.png",
    "revision": "bbbba5c95fb28a58ba9612f7812eaf5d"
  }, {
    "url": "splash/splash-2048x2732.png",
    "revision": "181bddd19ee90decd118df3a55886a39"
  }, {
    "url": "splash/splash-1668x2388.png",
    "revision": "7d6acf1029ec27327838b22304642269"
  }, {
    "url": "splash/splash-1242x2688.png",
    "revision": "22b5d6665a6b6ac82d5f81e30b0ba429"
  }, {
    "url": "splash/splash-1170x2532.png",
    "revision": "9a0a5665691ff08fc7ea11ab1c4a29c7"
  }, {
    "url": "splash/splash-1125x2436.png",
    "revision": "2c7a13cb02f5ddfc5620725448ba56da"
  }, {
    "url": "icons/icon-96.png",
    "revision": "a45abe399505750f671b2e5b9c770291"
  }, {
    "url": "icons/icon-72.png",
    "revision": "05b05f44d5873ddcf810b3249a3bb229"
  }, {
    "url": "icons/icon-512.png",
    "revision": "b80bb5324d9c1295df27523a785a1c4a"
  }, {
    "url": "icons/icon-512-maskable.png",
    "revision": "46ee449550c1ce0cd9f0788a7406627c"
  }, {
    "url": "icons/icon-48.png",
    "revision": "58a260f48189b28d0cb14e88f5bc4d67"
  }, {
    "url": "icons/icon-256.png",
    "revision": "b37b291856d09d9c7ccc15667e0ea802"
  }, {
    "url": "icons/icon-192.png",
    "revision": "c3444dadca84bfb121e063c66271c371"
  }, {
    "url": "icons/icon-152.png",
    "revision": "a22789d7b6d4dc256bda85f9f04410d2"
  }, {
    "url": "icons/icon-144.png",
    "revision": "91162e9f77c7dcf0c77c09451579b8a0"
  }, {
    "url": "icons/icon-128.png",
    "revision": "55e8ea99ebeb74e97fcfe5dd9021ab45"
  }, {
    "url": "assets/index-CpuuxQkw.js",
    "revision": null
  }, {
    "url": "assets/index-CERPxJZ4.css",
    "revision": null
  }, {
    "url": "favicon.ico",
    "revision": "ad1a6f4c5183484aea75bd061d11fc25"
  }, {
    "url": "favicon.png",
    "revision": "340c702e315e273199f3904ba607b6fc"
  }, {
    "url": "hero-mpsajmer.png",
    "revision": "1d1fb2cac04975daa5893d562d7e3e5e"
  }, {
    "url": "logo.png",
    "revision": "340c702e315e273199f3904ba607b6fc"
  }, {
    "url": "robots.txt",
    "revision": "ab9f727d49b049cfaeb7d66a918b384e"
  }, {
    "url": "icons/icon-128.png",
    "revision": "55e8ea99ebeb74e97fcfe5dd9021ab45"
  }, {
    "url": "icons/icon-144.png",
    "revision": "91162e9f77c7dcf0c77c09451579b8a0"
  }, {
    "url": "icons/icon-152.png",
    "revision": "a22789d7b6d4dc256bda85f9f04410d2"
  }, {
    "url": "icons/icon-192.png",
    "revision": "c3444dadca84bfb121e063c66271c371"
  }, {
    "url": "icons/icon-256.png",
    "revision": "b37b291856d09d9c7ccc15667e0ea802"
  }, {
    "url": "icons/icon-48.png",
    "revision": "58a260f48189b28d0cb14e88f5bc4d67"
  }, {
    "url": "icons/icon-512-maskable.png",
    "revision": "46ee449550c1ce0cd9f0788a7406627c"
  }, {
    "url": "icons/icon-512.png",
    "revision": "b80bb5324d9c1295df27523a785a1c4a"
  }, {
    "url": "icons/icon-72.png",
    "revision": "05b05f44d5873ddcf810b3249a3bb229"
  }, {
    "url": "icons/icon-96.png",
    "revision": "a45abe399505750f671b2e5b9c770291"
  }, {
    "url": "manifest.webmanifest",
    "revision": "03852f1a41754ff5130a7c05020aabd5"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/mpsajmer-connect-api\.futurist-raghav\.workers\.dev\/api\/.*/i, new workbox.NetworkFirst({
    "cacheName": "api-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 86400
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
