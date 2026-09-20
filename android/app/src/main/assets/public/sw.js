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
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

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
    "url": "pwa-maskable-512x512.png",
    "revision": "87bcb665dfbef210c0eccf690a0285c7"
  }, {
    "url": "pwa-512x512.png",
    "revision": "87bcb665dfbef210c0eccf690a0285c7"
  }, {
    "url": "pwa-192x192.png",
    "revision": "5fc7f362c071c12c7b808347309f1254"
  }, {
    "url": "index.html",
    "revision": "9947456ebd2a2aa167b5f4faf45c9b1f"
  }, {
    "url": "icon.svg",
    "revision": "fb5b6b6353cdcef4da1efc15c444dbe4"
  }, {
    "url": "icon.png",
    "revision": "9cf07074b0db9c0a179e37efb05ed080"
  }, {
    "url": "favicon.ico",
    "revision": "7579a72b329e33ccfe92a1bdf089d58c"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "fa5404bf749f2a110e084fd1478c56d0"
  }, {
    "url": "assets/index-CNDGLLK8.js",
    "revision": null
  }, {
    "url": "assets/index-Bz1408ZI.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "fa5404bf749f2a110e084fd1478c56d0"
  }, {
    "url": "favicon.ico",
    "revision": "7579a72b329e33ccfe92a1bdf089d58c"
  }, {
    "url": "icon.svg",
    "revision": "fb5b6b6353cdcef4da1efc15c444dbe4"
  }, {
    "url": "pwa-192x192.png",
    "revision": "5fc7f362c071c12c7b808347309f1254"
  }, {
    "url": "pwa-512x512.png",
    "revision": "87bcb665dfbef210c0eccf690a0285c7"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "87bcb665dfbef210c0eccf690a0285c7"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6cfab61df2dd3c7d92e37c4fe8d49efa"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
