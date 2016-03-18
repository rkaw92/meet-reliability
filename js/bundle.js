/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
		'use strict';
		
		var AppClient = __webpack_require__(1).AppClient(window.WebSocket);
		
		class Auction {
			constructor() {
				this.created = false;
				this.name = 'NOT CREATED';
				this.offer = {
					amount: 0,
					buyer: ''
				};
			}
		}
		
		class PresentationController {
			constructor(config) {
				// Elements:
				this._panel = window.document.getElementById('statusPanel');
				this._revelationButton = window.document.getElementById('revelation');
				this._connectionStatusIndicator = window.document.getElementById('connectionStatusIndicator');
				this._demoForms = window.document.getElementsByClassName('demoForm');
				
				// State:
				this._config = config || {
					server: 'ws://[::1]:8865',
					auctionID: 'AUCTION-2'
				};
				this._revealed = false;
				this._connected = false;
				this._connectionEnabled = false;
				this._auctionState = new Auction();
				
				// Network:
				this._appClient = null;
				
			}
			
			_updateConnectionStateWidget() {
				var newStatusDescription = this._connected ? 'up' : 'down';
				var newEnabledDescription = this._connectionEnabled ? '(enabled)' : '(disabled)';
				this._connectionStatusIndicator.querySelector('span.status').textContent = newStatusDescription;
				this._connectionStatusIndicator.querySelector('span.setting').textContent = newEnabledDescription;
				this._connectionStatusIndicator.style.color = this._connected ? 'green' : 'red';
			}
			
			_updateAuctionPreview() {
				var auction = this._auctionState || new Auction();
				var preview = window.document.getElementById('auctionPreview');
				preview.querySelector('.name').textContent = auction.name;
				preview.querySelector('.amount').textContent = ((auction.offer || {}).amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'EUR' });
			}
			
			_loadAuctionData() {
				var self = this;
				// Query the server:
				self._appClient.call('getAuction', { ID: self._config.auctionID, live: true }).then(function(data) {
					// Set our view model's state:
					self._auctionState = data;
					self._updateAuctionPreview();
				});
			}
			
			_installEventHandlers() {
				var self = this;
				// We are going to inspect every message to see if it looks like an event.
				// If it does, we process it and update the auction's state.
				self._appClient.transport.on('message', function(message) {
					var auction = self._auctionState;
					var data = JSON.parse(message);
					if (data.eventType) {
						switch (data.eventType) {
							case 'AuctionOfferPlaced':
								auction.offer = data.eventPayload.offer;
								break;
						}
						
						self._updateAuctionPreview();
					}
				});
			}
			
			_startClient() {
				var self = this;
				// Initialize the application client:
				self._appClient = new AppClient(self._config.server);
				
				// Set a state flag, which will be automatically updated whenever anything changes:
				self._connectionEnabled = true;
				self._appClient.transport.on('connect', function() {
					self._connected = true;
					self._updateConnectionStateWidget();
					self._loadAuctionData();
				});
				self._appClient.transport.on('disconnect', function() {
					self._connected = false;
					self._updateConnectionStateWidget();
				});
				self._updateConnectionStateWidget();
				
				self._installEventHandlers();
				
				// For debugging:
				window.appClient = self._appClient;
			}
			
			_reveal() {
				var revelationButton = this._revelationButton;
				
				// Guard clause: only run the "revelation" code once.
				if (this._revealed) {
					return;
				}
				
				var elementsToReveal = window.document.querySelectorAll('.secret');
				Array.prototype.forEach.call(elementsToReveal, function(element) {
					element.classList.add('visible');
				});
				
				revelationButton.blur();
				
				this._startClient();
				this._revealed = true;
			}
			
			run() {
				var self = this;
				var revelationButton = self._revelationButton;
				var demoForms = self._demoForms;
				
				// The "revelation" button starts the entire client up and uncovers some elements:
				revelationButton.addEventListener('click', function() {
					self._reveal();
				});
				
				// The status indicator button can toggle the connection state:
				var statusButton = self._connectionStatusIndicator;
				statusButton.addEventListener('click', function() {
					if (self._connectionEnabled) {
						self._connectionEnabled = false;
						self._updateConnectionStateWidget();
						self._appClient.transport.stop();
					}
					else {
						self._connectionEnabled = true;
						self._updateConnectionStateWidget();
						self._appClient.transport.start();
					}
					statusButton.blur();
				});
				
				// The first demonstration form allows the user to place offers in the current auction:
				demoForms[0].querySelector('button').addEventListener('click', function() {
					self._appClient.call('placeOffer', {
						ID: self._config.auctionID,
						buyer: 'joe',
						amount: Number(demoForms[0].querySelector('input').value)
					});
				});
				
				// The second one is much like the first, but 
				demoForms[0].querySelector('button').addEventListener('click', function() {
					self._appClient.call('placeOffer', {
						ID: self._config.auctionID,
						buyer: 'joe',
						amount: Number(demoForms[0].querySelector('input').value)
					});
				});
			}
		}
		
		window.addEventListener('load', function() {
			window.controller = new PresentationController(window.presentationConfig);
			window.controller.run();
		});
	})();


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
		AppClient: __webpack_require__(2),
		Commander: __webpack_require__(8),
		JSONRPC: __webpack_require__(5),
		SocketTransport: __webpack_require__(3)
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var lib = {
		SocketTransport: __webpack_require__(3),
		JSONRPC: __webpack_require__(5),
		Commander: __webpack_require__(8)
	};
	var EventEmitter2 = __webpack_require__(4).EventEmitter2;

	module.exports = function(SocketConstructor) {
		var SocketTransport = lib.SocketTransport(SocketConstructor);
		var JSONRPC = lib.JSONRPC();
		var Commander = lib.Commander();
		
		/**
		 * The AppClient is a high-level JSON-RPC client with support for method retries and reconnecting.
		 * @constructor
		 * @param {string} URL - The WebSocket URL to connect to.
		 * @param {Object} options - The 
		 */
		function AppClient(URL, options) {
			if (!(this instanceof AppClient)) {
				
			}
			
			//TODO: Implement option passing.
			//TODO: Implement passing custom transport, RPC and commander instances.
			var transport = new SocketTransport(URL);
			var RPC = new JSONRPC(transport);
			var commander = new Commander(RPC);
			
			// Every time we manage to connect, all pending calls are retried:
			transport.on('connect', function() {
				setTimeout(function() {
					commander.triggerRetries();
				}, 10000 * Math.random());
			});
			
			// Make transport errors non-fatal:
			transport.on('error', function() {});
			
			//TODO: Listen for drop notifications and immediately reject all RPCs with an { isRetriable: true } error.
			
			// Initialize getters so that all underlying resources may be conveniently accessed.
			Object.defineProperties(this, {
				transport: { enumerable: true, get: function() { return transport; } },
				RPC: { enumerable: true, get: function() { return RPC; } },
				commander: { enumerable: true, get: function() { return commander; } }
			});
			
			// Start the transport right away!
			transport.start();
		}
		
		AppClient.prototype.call = function call() {
			return this.commander.call.apply(this.commander, arguments);
		};
		
		return AppClient;
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter2 = __webpack_require__(4).EventEmitter2;

	function SocketTransportStateError(state, readyState) {
		this.name = 'SocketTransportStateError';
		this.message = 'The underlying socket is not connected (current state: ' + state + '; readyState: ' + readyState + ')';
		this.data = {
			state: state,
			readyState: readyState
		};
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, SocketTransportStateError);
		}
	}
	SocketTransportStateError.prototype = Object.create(Error.prototype);

	module.exports = function(SocketConstructor) {
		var states = [
			// A "null" state is when the socket is unconnected, and no attempt to connect has been made.
			'unconnected',
			// An attempt to connect is being made:
			'connecting',
			// The socket is connected and operational:
			'connected',
			// A connection has failed and a retry delay is currently running:
			'retrying'
		];
		
		/**
		 * SocketTransport is a class which maintains an active connection to a WebSocket server
		 *  and performs reconnection whenever needed. It also notifies the user of the socket
		 *  about disconnects and allows sending and receiving messages, mimicking the native
		 *  WebSocket API.
		 * @constructor
		 * @extends EventEmitter
		 * @param {string} URL - The URL to connect to. Usually equal to something like "ws://host.tld" or "ws://host.tld/path/to/socket".
		 * @param {Object} [options] - Options for controlling the behaviour of the transport.
		 */
		function SocketTransport(URL, options) {
			if (!URL) {
				throw new Error('A WebSocket URL must be passed to the SocketTransport constructor!');
			}
			if (!(this instanceof SocketTransport)) {
				return new SocketTransport(URL, options);
			}
			/**
			 * The URL to use for connecting to the WebSocket server.
			 * Typically, it looks like "ws://host.tld/path", where path may be empty.
			 * @type {string}
			 */
			this._URL = URL;
			/**
			 * A map of options to control the transport's behaviour.
			 */
			this._options = options || {};
			/**
			 * The current socket object in use.
			 * Since WebSockets can not be re-used after they have been closed,
			 *  this reference points to the current (i.e. most recent) socket in use.
			 * @type {?external:WebSocket}
			 */
			this._socket = null;
			/**
			 * A descriptive state of the transport, for internal logic use.
			 * This controls the various state transitions.
			 * @type {string}
			 */
			this._state = 'unconnected';
			/**
			 * Whether the transport is active.
			 * True means that the user intends to be connected.
			 * False is when the user has explicitly requested a connection shutdown.
			 * Inactive transports do not attempt reconnection when closed or when an error occurs.
			 * @type {boolean}
			 */
			this._active = false;
			/**
			 * The reconnection timeout. Set when an unplanned disconnect occurs.
			 * It is cleared when _deactivate() is called.
			 */
			this._reconnectTimeout = null;
			EventEmitter2.call(this);
			
			/**
			 * We store a map of "standard listeners" - that is, functions that we are going
			 *  to be adding as event listeners on WebSocket objects.
			 * This way, we have a reference to them, so we can do .removeEventListener().
			 * @type {Object.<string,function>}
			 */
			var self = this;
			var listeners = {
				open: function() {
					self._handleOpen();
				},
				error: function(error) {
					console.log('! error');
					self._handleError(error);
				},
				close: function(closeEvent) {
					console.log('! close');
					self._handleDisconnect();
				},
				message: function(messageEvent) {
					self.emit('message', messageEvent.data);
				}
			};
			this._standardListeners = listeners;
			
		}
		SocketTransport.prototype = Object.create(EventEmitter2.prototype);
		
		// ### State transition methods ###
		
		SocketTransport.prototype._connect = function _connect() {
			this._socket = new SocketConstructor(this._URL);
			this._setup();
		};
		
		SocketTransport.prototype._setup = function _setup() {
			// We take the listeners from our internal map, so that we have a reference to them at all times.
			// This lets us remove them during teardown and avoid a listener (memory) leak.
			var listeners = this._standardListeners;
			this._socket.addEventListener('open', listeners.open);
			this._socket.addEventListener('error', listeners.error);
			this._socket.addEventListener('close', listeners.close);
			this._socket.addEventListener('message', listeners.message);
		};
		
		SocketTransport.prototype._teardown = function _teardown() {
			var listeners = this._standardListeners;
			// Guard clause: if no socket is present at all, do nothing.
			if (!this._socket) {
				return;
			}
			if (this._socket.removeEventListener) {
				this._socket.removeEventListener('open', listeners.open);
				this._socket.removeEventListener('error', listeners.error);
				this._socket.removeEventListener('close', listeners.close);
				this._socket.removeEventListener('message', listeners.message);
			}
			else if (this._socket.removeListener) {
				this._socket.removeListener('open', listeners.open);
				this._socket.removeListener('error', listeners.error);
				this._socket.removeListener('close', listeners.close);
				this._socket.removeListener('message', listeners.message);
			}
			
		};
		
		SocketTransport.prototype._disconnect = function _disconnect() {
			// Behave as if the socket has disconnected on its own. Notify listeners.
			this._handleDisconnect();
			// Clear the reconnection timeout, if any.
			if (this._reconnectTimeout) {
				clearTimeout(this._reconnectTimeout);
				this._reconnectTimeout = null;
			}
			// Remove all event listeners. If the socket emits a 'close' event, we do not want to be repeating the already-emitted event.
			this._teardown();
			// Only then do we close the socket.
			try {
				this._socket.close();
			}
			catch (error) {
				// If an error occurs, this probably means that the socket is already closed.
				// Thus, we do not have to do anything further.
			}
			// Finally, we can clear the reference to the socket.
			this._socket = null;
		};
		
		SocketTransport.prototype._handleOpen = function _connected() {
			this._state = 'connected';
			this.emit('connect');
		};
		
		SocketTransport.prototype._handleError = function _handleError(error) {
			this.emit('error', error);
			this._handleDisconnect();
		};
		
		SocketTransport.prototype._handleDisconnect = function _handleDisconnect() {
			var stateAtDisconnectTime = this._state;
			this._state = 'unconnected';
			if (this._active && stateAtDisconnectTime !== 'retrying') {
				this._retryConnection();
			}
			if (stateAtDisconnectTime === 'connected') {
				this.emit('disconnect');
			}
		};
		
		SocketTransport.prototype._retryConnection = function _retryConnection() {
			console.log('_retryConnection');
			var self = this;
			if (self._state !== 'retrying') {
				self._state = 'retrying';
				//TODO: Custom delay strategy.
				self._reconnectTimeout = setTimeout(function() {
					self._reconnectTimeout = null;
					self._connect();
				}, 2000);
			}
		};
		
		// ### Publc methods ###
		
		//TODO: doc
		SocketTransport.prototype.start = function start() {
			if (!this._active) {
				this._active = true;
				this._connect();
			}
		};
		
		SocketTransport.prototype.stop = function stop() {
			if (this._active) {
				this._active = false;
				this._disconnect();
			}
		};
		
		SocketTransport.prototype.send = function send(message) {
			// Diagnostic variable to store the readyState in case sending fails.
			var readyState;
			if (this._state !== 'connected') {
				readyState = this._socket ? this._socket.readyState : null;
				throw new SocketTransportStateError(this._state, readyState);
			}
			try {
				this.emit('send', message);
				this._socket.send(message);
			}
			catch (error) {
				readyState = this._socket.readyState;
				throw new SocketTransportStateError(this._state, readyState);
			}
		};
		
		// ### Actual "export" ###
		
		return SocketTransport;
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 * EventEmitter2
	 * https://github.com/hij1nx/EventEmitter2
	 *
	 * Copyright (c) 2013 hij1nx
	 * Licensed under the MIT license.
	 */
	;!function(undefined) {

	  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
	    return Object.prototype.toString.call(obj) === "[object Array]";
	  };
	  var defaultMaxListeners = 10;

	  function init() {
	    this._events = {};
	    if (this._conf) {
	      configure.call(this, this._conf);
	    }
	  }

	  function configure(conf) {
	    if (conf) {

	      this._conf = conf;

	      conf.delimiter && (this.delimiter = conf.delimiter);
	      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
	      conf.wildcard && (this.wildcard = conf.wildcard);
	      conf.newListener && (this.newListener = conf.newListener);

	      if (this.wildcard) {
	        this.listenerTree = {};
	      }
	    }
	  }

	  function EventEmitter(conf) {
	    this._events = {};
	    this.newListener = false;
	    configure.call(this, conf);
	  }
	  EventEmitter.EventEmitter2 = EventEmitter; // backwards compatibility for exporting EventEmitter property

	  //
	  // Attention, function return type now is array, always !
	  // It has zero elements if no any matches found and one or more
	  // elements (leafs) if there are matches
	  //
	  function searchListenerTree(handlers, type, tree, i) {
	    if (!tree) {
	      return [];
	    }
	    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
	        typeLength = type.length, currentType = type[i], nextType = type[i+1];
	    if (i === typeLength && tree._listeners) {
	      //
	      // If at the end of the event(s) list and the tree has listeners
	      // invoke those listeners.
	      //
	      if (typeof tree._listeners === 'function') {
	        handlers && handlers.push(tree._listeners);
	        return [tree];
	      } else {
	        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
	          handlers && handlers.push(tree._listeners[leaf]);
	        }
	        return [tree];
	      }
	    }

	    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
	      //
	      // If the event emitted is '*' at this part
	      // or there is a concrete match at this patch
	      //
	      if (currentType === '*') {
	        for (branch in tree) {
	          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
	            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
	          }
	        }
	        return listeners;
	      } else if(currentType === '**') {
	        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
	        if(endReached && tree._listeners) {
	          // The next element has a _listeners, add it to the handlers.
	          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
	        }

	        for (branch in tree) {
	          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
	            if(branch === '*' || branch === '**') {
	              if(tree[branch]._listeners && !endReached) {
	                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
	              }
	              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
	            } else if(branch === nextType) {
	              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
	            } else {
	              // No match on this one, shift into the tree but not in the type array.
	              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
	            }
	          }
	        }
	        return listeners;
	      }

	      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
	    }

	    xTree = tree['*'];
	    if (xTree) {
	      //
	      // If the listener tree will allow any match for this part,
	      // then recursively explore all branches of the tree
	      //
	      searchListenerTree(handlers, type, xTree, i+1);
	    }

	    xxTree = tree['**'];
	    if(xxTree) {
	      if(i < typeLength) {
	        if(xxTree._listeners) {
	          // If we have a listener on a '**', it will catch all, so add its handler.
	          searchListenerTree(handlers, type, xxTree, typeLength);
	        }

	        // Build arrays of matching next branches and others.
	        for(branch in xxTree) {
	          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
	            if(branch === nextType) {
	              // We know the next element will match, so jump twice.
	              searchListenerTree(handlers, type, xxTree[branch], i+2);
	            } else if(branch === currentType) {
	              // Current node matches, move into the tree.
	              searchListenerTree(handlers, type, xxTree[branch], i+1);
	            } else {
	              isolatedBranch = {};
	              isolatedBranch[branch] = xxTree[branch];
	              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
	            }
	          }
	        }
	      } else if(xxTree._listeners) {
	        // We have reached the end and still on a '**'
	        searchListenerTree(handlers, type, xxTree, typeLength);
	      } else if(xxTree['*'] && xxTree['*']._listeners) {
	        searchListenerTree(handlers, type, xxTree['*'], typeLength);
	      }
	    }

	    return listeners;
	  }

	  function growListenerTree(type, listener) {

	    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

	    //
	    // Looks for two consecutive '**', if so, don't add the event at all.
	    //
	    for(var i = 0, len = type.length; i+1 < len; i++) {
	      if(type[i] === '**' && type[i+1] === '**') {
	        return;
	      }
	    }

	    var tree = this.listenerTree;
	    var name = type.shift();

	    while (name) {

	      if (!tree[name]) {
	        tree[name] = {};
	      }

	      tree = tree[name];

	      if (type.length === 0) {

	        if (!tree._listeners) {
	          tree._listeners = listener;
	        }
	        else if(typeof tree._listeners === 'function') {
	          tree._listeners = [tree._listeners, listener];
	        }
	        else if (isArray(tree._listeners)) {

	          tree._listeners.push(listener);

	          if (!tree._listeners.warned) {

	            var m = defaultMaxListeners;

	            if (typeof this._events.maxListeners !== 'undefined') {
	              m = this._events.maxListeners;
	            }

	            if (m > 0 && tree._listeners.length > m) {

	              tree._listeners.warned = true;
	              console.error('(node) warning: possible EventEmitter memory ' +
	                            'leak detected. %d listeners added. ' +
	                            'Use emitter.setMaxListeners() to increase limit.',
	                            tree._listeners.length);
	              if(console.trace){
	                console.trace();
	              }
	            }
	          }
	        }
	        return true;
	      }
	      name = type.shift();
	    }
	    return true;
	  }

	  // By default EventEmitters will print a warning if more than
	  // 10 listeners are added to it. This is a useful default which
	  // helps finding memory leaks.
	  //
	  // Obviously not all Emitters should be limited to 10. This function allows
	  // that to be increased. Set to zero for unlimited.

	  EventEmitter.prototype.delimiter = '.';

	  EventEmitter.prototype.setMaxListeners = function(n) {
	    this._events || init.call(this);
	    this._events.maxListeners = n;
	    if (!this._conf) this._conf = {};
	    this._conf.maxListeners = n;
	  };

	  EventEmitter.prototype.event = '';

	  EventEmitter.prototype.once = function(event, fn) {
	    this.many(event, 1, fn);
	    return this;
	  };

	  EventEmitter.prototype.many = function(event, ttl, fn) {
	    var self = this;

	    if (typeof fn !== 'function') {
	      throw new Error('many only accepts instances of Function');
	    }

	    function listener() {
	      if (--ttl === 0) {
	        self.off(event, listener);
	      }
	      fn.apply(this, arguments);
	    }

	    listener._origin = fn;

	    this.on(event, listener);

	    return self;
	  };

	  EventEmitter.prototype.emit = function() {

	    this._events || init.call(this);

	    var type = arguments[0];

	    if (type === 'newListener' && !this.newListener) {
	      if (!this._events.newListener) { return false; }
	    }

	    // Loop through the *_all* functions and invoke them.
	    if (this._all) {
	      var l = arguments.length;
	      var args = new Array(l - 1);
	      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
	      for (i = 0, l = this._all.length; i < l; i++) {
	        this.event = type;
	        this._all[i].apply(this, [type].concat(args));
	      }
	    }

	    // If there is no 'error' event listener then throw.
	    if (type === 'error') {

	      if (!this._all &&
	        !this._events.error &&
	        !(this.wildcard && this.listenerTree.error)) {

	        if (arguments[1] instanceof Error) {
	          throw arguments[1]; // Unhandled 'error' event
	        } else {
	          throw new Error("Uncaught, unspecified 'error' event.");
	        }
	        return false;
	      }
	    }

	    var handler;

	    if(this.wildcard) {
	      handler = [];
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
	    }
	    else {
	      handler = this._events[type];
	    }

	    if (typeof handler === 'function') {
	      this.event = type;
	      if (arguments.length === 1) {
	        handler.call(this);
	      }
	      else if (arguments.length > 1)
	        switch (arguments.length) {
	          case 2:
	            handler.call(this, arguments[1]);
	            break;
	          case 3:
	            handler.call(this, arguments[1], arguments[2]);
	            break;
	          // slower
	          default:
	            var l = arguments.length;
	            var args = new Array(l - 1);
	            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
	            handler.apply(this, args);
	        }
	      return true;
	    }
	    else if (handler) {
	      var l = arguments.length;
	      var args = new Array(l - 1);
	      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

	      var listeners = handler.slice();
	      for (var i = 0, l = listeners.length; i < l; i++) {
	        this.event = type;
	        listeners[i].apply(this, args);
	      }
	      return (listeners.length > 0) || !!this._all;
	    }
	    else {
	      return !!this._all;
	    }

	  };

	  EventEmitter.prototype.emitAsync = function() {

	    this._events || init.call(this);

	    var type = arguments[0];

	    if (type === 'newListener' && !this.newListener) {
	      if (!this._events.newListener) { return Promise.resolve([false]); }
	    }

	    var promises= [];

	    // Loop through the *_all* functions and invoke them.
	    if (this._all) {
	      var l = arguments.length;
	      var args = new Array(l - 1);
	      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
	      for (i = 0, l = this._all.length; i < l; i++) {
	        this.event = type;
	        promises.push(this._all[i].apply(this, args));
	      }
	    }

	    // If there is no 'error' event listener then throw.
	    if (type === 'error') {

	      if (!this._all &&
	        !this._events.error &&
	        !(this.wildcard && this.listenerTree.error)) {

	        if (arguments[1] instanceof Error) {
	          return Promise.reject(arguments[1]); // Unhandled 'error' event
	        } else {
	          return Promise.reject("Uncaught, unspecified 'error' event.");
	        }
	      }
	    }

	    var handler;

	    if(this.wildcard) {
	      handler = [];
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
	    }
	    else {
	      handler = this._events[type];
	    }

	    if (typeof handler === 'function') {
	      this.event = type;
	      if (arguments.length === 1) {
	        promises.push(handler.call(this));
	      }
	      else if (arguments.length > 1) {
	        switch (arguments.length) {
	          case 2:
	            promises.push(handler.call(this, arguments[1]));
	            break;
	          case 3:
	            promises.push(handler.call(this, arguments[1], arguments[2]));
	            break;
	          // slower
	          default:
	            var l = arguments.length;
	            var args = new Array(l - 1);
	            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
	            promises.push(handler.apply(this, args));
	        }
	      }
	    }
	    else if (handler) {
	      var l = arguments.length;
	      var args = new Array(l - 1);
	      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

	      var listeners = handler.slice();
	      for (var i = 0, l = listeners.length; i < l; i++) {
	        this.event = type;
	        promises.push(listeners[i].apply(this, args));
	      }
	    }
	    return Promise.all(promises);
	  };

	  EventEmitter.prototype.on = function(type, listener) {

	    if (typeof type === 'function') {
	      this.onAny(type);
	      return this;
	    }

	    if (typeof listener !== 'function') {
	      throw new Error('on only accepts instances of Function');
	    }
	    this._events || init.call(this);

	    // To avoid recursion in the case that type == "newListeners"! Before
	    // adding it to the listeners, first emit "newListeners".
	    this.emit('newListener', type, listener);

	    if(this.wildcard) {
	      growListenerTree.call(this, type, listener);
	      return this;
	    }

	    if (!this._events[type]) {
	      // Optimize the case of one listener. Don't need the extra array object.
	      this._events[type] = listener;
	    }
	    else if(typeof this._events[type] === 'function') {
	      // Adding the second element, need to change to array.
	      this._events[type] = [this._events[type], listener];
	    }
	    else if (isArray(this._events[type])) {
	      // If we've already got an array, just append.
	      this._events[type].push(listener);

	      // Check for listener leak
	      if (!this._events[type].warned) {

	        var m = defaultMaxListeners;

	        if (typeof this._events.maxListeners !== 'undefined') {
	          m = this._events.maxListeners;
	        }

	        if (m > 0 && this._events[type].length > m) {

	          this._events[type].warned = true;
	          console.error('(node) warning: possible EventEmitter memory ' +
	                        'leak detected. %d listeners added. ' +
	                        'Use emitter.setMaxListeners() to increase limit.',
	                        this._events[type].length);
	          if(console.trace){
	            console.trace();
	          }
	        }
	      }
	    }
	    return this;
	  };

	  EventEmitter.prototype.onAny = function(fn) {

	    if (typeof fn !== 'function') {
	      throw new Error('onAny only accepts instances of Function');
	    }

	    if(!this._all) {
	      this._all = [];
	    }

	    // Add the function to the event listener collection.
	    this._all.push(fn);
	    return this;
	  };

	  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	  EventEmitter.prototype.off = function(type, listener) {
	    if (typeof listener !== 'function') {
	      throw new Error('removeListener only takes instances of Function');
	    }

	    var handlers,leafs=[];

	    if(this.wildcard) {
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
	    }
	    else {
	      // does not use listeners(), so no side effect of creating _events[type]
	      if (!this._events[type]) return this;
	      handlers = this._events[type];
	      leafs.push({_listeners:handlers});
	    }

	    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
	      var leaf = leafs[iLeaf];
	      handlers = leaf._listeners;
	      if (isArray(handlers)) {

	        var position = -1;

	        for (var i = 0, length = handlers.length; i < length; i++) {
	          if (handlers[i] === listener ||
	            (handlers[i].listener && handlers[i].listener === listener) ||
	            (handlers[i]._origin && handlers[i]._origin === listener)) {
	            position = i;
	            break;
	          }
	        }

	        if (position < 0) {
	          continue;
	        }

	        if(this.wildcard) {
	          leaf._listeners.splice(position, 1);
	        }
	        else {
	          this._events[type].splice(position, 1);
	        }

	        if (handlers.length === 0) {
	          if(this.wildcard) {
	            delete leaf._listeners;
	          }
	          else {
	            delete this._events[type];
	          }
	        }
	        
	        this.emit("removeListener", type, listener);
	        
	        return this;
	      }
	      else if (handlers === listener ||
	        (handlers.listener && handlers.listener === listener) ||
	        (handlers._origin && handlers._origin === listener)) {
	        if(this.wildcard) {
	          delete leaf._listeners;
	        }
	        else {
	          delete this._events[type];
	        }
	        
	        this.emit("removeListener", type, listener);
	      }
	    }

	    function recursivelyGarbageCollect(root) {
	      if (root === undefined) {
	        return;
	      }
	      var keys = Object.keys(root);
	      for (var i in keys) {
	        var key = keys[i];
	        var obj = root[key];
	        if ((obj instanceof Function) || (typeof obj !== "object"))
	          continue;
	        if (Object.keys(obj).length > 0) {
	          recursivelyGarbageCollect(root[key]);
	        }
	        if (Object.keys(obj).length === 0) {
	          delete root[key];
	        }
	      }
	    }
	    recursivelyGarbageCollect(this.listenerTree);

	    return this;
	  };

	  EventEmitter.prototype.offAny = function(fn) {
	    var i = 0, l = 0, fns;
	    if (fn && this._all && this._all.length > 0) {
	      fns = this._all;
	      for(i = 0, l = fns.length; i < l; i++) {
	        if(fn === fns[i]) {
	          fns.splice(i, 1);
	          this.emit("removeListenerAny", fn);
	          return this;
	        }
	      }
	    } else {
	      fns = this._all;
	      for(i = 0, l = fns.length; i < l; i++)
	        this.emit("removeListenerAny", fns[i]);
	      this._all = [];
	    }
	    return this;
	  };

	  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

	  EventEmitter.prototype.removeAllListeners = function(type) {
	    if (arguments.length === 0) {
	      !this._events || init.call(this);
	      return this;
	    }

	    if(this.wildcard) {
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

	      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
	        var leaf = leafs[iLeaf];
	        leaf._listeners = null;
	      }
	    }
	    else {
	      if (!this._events || !this._events[type]) return this;
	      this._events[type] = null;
	    }
	    return this;
	  };

	  EventEmitter.prototype.listeners = function(type) {
	    if(this.wildcard) {
	      var handlers = [];
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
	      return handlers;
	    }

	    this._events || init.call(this);

	    if (!this._events[type]) this._events[type] = [];
	    if (!isArray(this._events[type])) {
	      this._events[type] = [this._events[type]];
	    }
	    return this._events[type];
	  };

	  EventEmitter.prototype.listenersAny = function() {

	    if(this._all) {
	      return this._all;
	    }
	    else {
	      return [];
	    }

	  };

	  if (true) {
	     // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return EventEmitter;
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = EventEmitter;
	  }
	  else {
	    // Browser global.
	    window.EventEmitter2 = EventEmitter;
	  }
	}();


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter2 = __webpack_require__(4).EventEmitter2;
	var uuid = __webpack_require__(6);

	function DisconnectError() {
		this.name = 'DisconnectError';
		this.message = 'RPC transport has disconnected in the middle of the request';
		this.isRetriable = true;
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, DisconnectError);
		}
	}
	DisconnectError.prototype = Object.create(Error.prototype);

	function isResponse(message) {
		return typeof(message.id) === 'string' && message.id && (message.error || (typeof message.result !== 'undefined'));
	}

	function annotateError(error) {
		if (error && error.name === 'SocketTransportStateError') {
			error.isRetriable = true;
		}
	}

	module.exports = function() {
		function JSONRPC(transport) {
			EventEmitter2.call(this);
			this._transport = transport;
			
			// Create a map of requests by ID.
			this._requests = Object.create(null);
			
			this._init();
		}
		JSONRPC.prototype = Object.create(EventEmitter2.prototype);
		
		// ### Internals ###
		
		JSONRPC.prototype._init = function _init() {
			var self = this;

			// React to messages coming from the server:
			self._transport.on('message', function(data) {
				// Check whether the message looks like JSON-RPC 2.0:
				var parsedMessage;
				try {
					parsedMessage = JSON.parse(data);
				}
				catch (error) {
					// The message fails to parse as JSON. It surely is not JSON-RPC.
					return;
				}
				if (parsedMessage && parsedMessage.jsonrpc === '2.0') {
					self._processMessage(parsedMessage);
				}
			});
			
			// Upon a disconnect, reject all requests' promises:
			self._transport.on('disconnect', function() {
				var error = new DisconnectError();
				self._rejectAll(error);
			});
		};
		
		JSONRPC.prototype._processMessage = function _processMessage(message) {
			// Guard clause: only react to actual JSON-RPC 2.0 Response objects.
			if (!isResponse(message)) {
				return;
			}
			// Guard clause: if no request with this ID was issued, ignore the message.
			if (!this._requests[message.id]) {
				return;
			}
			this.emit('response', message);
			// Now that we know that the request had been made, determine what the result was:
			if (typeof message.result !== 'undefined') {
				this._requests[message.id].fulfill(message.result);
			}
			else {
				var error = new Error(message.error.message, message.error.code);
				error.data = message.error.data;
				this._requests[message.id].reject(error);
			}
			delete this._requests[message.id];
		};
		
		JSONRPC.prototype._rejectAll = function _rejectAll(error) {
			var self = this;
			Object.keys(self._requests).forEach(function(requestID) {
				self._requests[requestID].reject(error);
				delete self._requests[requestID];
			});
		};
		
		// ### Public methods ###
		
		JSONRPC.prototype.call = function call(method, params) {
			var self = this;
			var request = {
				jsonrpc: '2.0',
				method: String(method),
				params: Object(params || 0),
				id: uuid.v4()
			};
			self.emit('request', request);
			return new Promise(function callJSONRPCMethod(fulfill, reject) {
				try {
					self._transport.send(JSON.stringify(request));
				}
				catch (sendError) {
					// For known transport errors, annotate them with an "isRetriable" flag.
					// This lets the consumers of this JSONRPC API consistently perform only one check when deciding whether to retry the call in the future.
					annotateError(sendError);
					return void reject(sendError);
				}
				self._requests[request.id] = { fulfill: fulfill, reject: reject };
			});
		};
		
		JSONRPC.prototype.abortAll = function abortAll(error) {
			this._rejectAll(error || new Error('Manually aborted all pending requests'));
		};
		
		return JSONRPC;
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	//     uuid.js
	//
	//     Copyright (c) 2010-2012 Robert Kieffer
	//     MIT License - http://opensource.org/licenses/mit-license.php

	// Unique ID creation requires a high quality random # generator.  We feature
	// detect to determine the best RNG source, normalizing to a function that
	// returns 128-bits of randomness, since that's what's usually required
	var _rng = __webpack_require__(7);

	// Maps for number <-> hex string conversion
	var _byteToHex = [];
	var _hexToByte = {};
	for (var i = 0; i < 256; i++) {
	  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
	  _hexToByte[_byteToHex[i]] = i;
	}

	// **`parse()` - Parse a UUID into it's component bytes**
	function parse(s, buf, offset) {
	  var i = (buf && offset) || 0, ii = 0;

	  buf = buf || [];
	  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
	    if (ii < 16) { // Don't overflow!
	      buf[i + ii++] = _hexToByte[oct];
	    }
	  });

	  // Zero out remaining bytes if string was short
	  while (ii < 16) {
	    buf[i + ii++] = 0;
	  }

	  return buf;
	}

	// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
	function unparse(buf, offset) {
	  var i = offset || 0, bth = _byteToHex;
	  return  bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]];
	}

	// **`v1()` - Generate time-based UUID**
	//
	// Inspired by https://github.com/LiosK/UUID.js
	// and http://docs.python.org/library/uuid.html

	// random #'s we need to init node and clockseq
	var _seedBytes = _rng();

	// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
	var _nodeId = [
	  _seedBytes[0] | 0x01,
	  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
	];

	// Per 4.2.2, randomize (14 bit) clockseq
	var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

	// Previous uuid creation time
	var _lastMSecs = 0, _lastNSecs = 0;

	// See https://github.com/broofa/node-uuid for API details
	function v1(options, buf, offset) {
	  var i = buf && offset || 0;
	  var b = buf || [];

	  options = options || {};

	  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

	  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
	  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
	  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
	  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
	  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

	  // Per 4.2.1.2, use count of uuid's generated during the current clock
	  // cycle to simulate higher resolution clock
	  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

	  // Time since last uuid creation (in msecs)
	  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

	  // Per 4.2.1.2, Bump clockseq on clock regression
	  if (dt < 0 && options.clockseq === undefined) {
	    clockseq = clockseq + 1 & 0x3fff;
	  }

	  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
	  // time interval
	  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
	    nsecs = 0;
	  }

	  // Per 4.2.1.2 Throw error if too many uuids are requested
	  if (nsecs >= 10000) {
	    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
	  }

	  _lastMSecs = msecs;
	  _lastNSecs = nsecs;
	  _clockseq = clockseq;

	  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
	  msecs += 12219292800000;

	  // `time_low`
	  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
	  b[i++] = tl >>> 24 & 0xff;
	  b[i++] = tl >>> 16 & 0xff;
	  b[i++] = tl >>> 8 & 0xff;
	  b[i++] = tl & 0xff;

	  // `time_mid`
	  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
	  b[i++] = tmh >>> 8 & 0xff;
	  b[i++] = tmh & 0xff;

	  // `time_high_and_version`
	  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
	  b[i++] = tmh >>> 16 & 0xff;

	  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
	  b[i++] = clockseq >>> 8 | 0x80;

	  // `clock_seq_low`
	  b[i++] = clockseq & 0xff;

	  // `node`
	  var node = options.node || _nodeId;
	  for (var n = 0; n < 6; n++) {
	    b[i + n] = node[n];
	  }

	  return buf ? buf : unparse(b);
	}

	// **`v4()` - Generate random UUID**

	// See https://github.com/broofa/node-uuid for API details
	function v4(options, buf, offset) {
	  // Deprecated - 'format' argument, as supported in v1.2
	  var i = buf && offset || 0;

	  if (typeof(options) == 'string') {
	    buf = options == 'binary' ? new Array(16) : null;
	    options = null;
	  }
	  options = options || {};

	  var rnds = options.random || (options.rng || _rng)();

	  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	  rnds[6] = (rnds[6] & 0x0f) | 0x40;
	  rnds[8] = (rnds[8] & 0x3f) | 0x80;

	  // Copy bytes to buffer, if provided
	  if (buf) {
	    for (var ii = 0; ii < 16; ii++) {
	      buf[i + ii] = rnds[ii];
	    }
	  }

	  return buf || unparse(rnds);
	}

	// Export public API
	var uuid = v4;
	uuid.v1 = v1;
	uuid.v4 = v4;
	uuid.parse = parse;
	uuid.unparse = unparse;

	module.exports = uuid;


/***/ },
/* 7 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {
	var rng;

	if (global.crypto && crypto.getRandomValues) {
	  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
	  // Moderately fast, high quality
	  var _rnds8 = new Uint8Array(16);
	  rng = function whatwgRNG() {
	    crypto.getRandomValues(_rnds8);
	    return _rnds8;
	  };
	}

	if (!rng) {
	  // Math.random()-based (RNG)
	  //
	  // If all else fails, use Math.random().  It's fast, but is of unspecified
	  // quality.
	  var  _rnds = new Array(16);
	  rng = function() {
	    for (var i = 0, r; i < 16; i++) {
	      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
	      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
	    }

	    return _rnds;
	  };
	}

	module.exports = rng;


	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var when = __webpack_require__(9);
	var EventEmitter2 = __webpack_require__(4).EventEmitter2;
	var defaultRetry = __webpack_require__(30).defaultRetry;

	module.exports = function() {
		/**
		 * A Commander is a layer over a JSON-RPC 2.0 Client which controls automatic retries of method calls.
		 * @constructor
		 * @param {JSONRPC} client - The underlying JSON-RPC client to use. Should expose an API equivalent to the one found in the JSONRPC module in this package.
		 * @param {Object} [options] - Tunables that control the behaviour of this automatic layer.
		 * @param {function} [options.retryStrategy] - A function that should accept no arguments and return a function which, when called with arguments (next:function, error:Error), will call that "next" function some time in the future, or reject with the passed error if retry is denied.
		 */
		function Commander(client, options) {
			if (!(this instanceof Commander)) {
				return new Commander(client, options);
			}
			
			EventEmitter2.call(this);
			this.setMaxListeners(0);
			
			options = options || {};
			
			options.retryStrategy = options.retryStrategy || defaultRetry;
			
			this._client = client;
			this._options = options;
		}
		Commander.prototype = Object.create(EventEmitter2.prototype);
		
		/**
		 * Call a given remote method and retry if adverse network conditions occur.
		 * Note that this implies the target system provides idempotent methods.
		 * @param {string} method - Name of the remote method to call.
		 * @param {Object} params - The parameters to pass to the call. This could also be an Array if positional arguments are employed instead of a map of parameters.
		 * @returns {Promise} - A Promise that fulfills with the method's result when the call has succeeded and rejects if the call fails with an application error, or if network errors occur and all retries fail.
		 */
		Commander.prototype.call = function call(method, params) {
			var retry = this._options.retryStrategy({}, this);
			var client = this._client;
			
			function tryCall() {
				return client.call(method, params).then(function callSucceeded(resolution) {
					return resolution;
				}, function callFailed(error) {
					if (error && error.isRetriable) {
						return retry(tryCall, error);
					}
					else {
						throw error;
					}
				});
			}
			
			return tryCall();
		};
		
		Commander.prototype.triggerRetries = function triggerRetries() {
			this.emit('shouldRetry');
		};
		
		return Commander;
	};


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */

	/**
	 * Promises/A+ and when() implementation
	 * when is part of the cujoJS family of libraries (http://cujojs.com/)
	 * @author Brian Cavalier
	 * @author John Hann
	 */
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require) {

		var timed = __webpack_require__(10);
		var array = __webpack_require__(16);
		var flow = __webpack_require__(19);
		var fold = __webpack_require__(20);
		var inspect = __webpack_require__(21);
		var generate = __webpack_require__(22);
		var progress = __webpack_require__(23);
		var withThis = __webpack_require__(24);
		var unhandledRejection = __webpack_require__(25);
		var TimeoutError = __webpack_require__(15);

		var Promise = [array, flow, fold, generate, progress,
			inspect, withThis, timed, unhandledRejection]
			.reduce(function(Promise, feature) {
				return feature(Promise);
			}, __webpack_require__(27));

		var apply = __webpack_require__(18)(Promise);

		// Public API

		when.promise     = promise;              // Create a pending promise
		when.resolve     = Promise.resolve;      // Create a resolved promise
		when.reject      = Promise.reject;       // Create a rejected promise

		when.lift        = lift;                 // lift a function to return promises
		when['try']      = attempt;              // call a function and return a promise
		when.attempt     = attempt;              // alias for when.try

		when.iterate     = Promise.iterate;      // DEPRECATED (use cujojs/most streams) Generate a stream of promises
		when.unfold      = Promise.unfold;       // DEPRECATED (use cujojs/most streams) Generate a stream of promises

		when.join        = join;                 // Join 2 or more promises

		when.all         = all;                  // Resolve a list of promises
		when.settle      = settle;               // Settle a list of promises

		when.any         = lift(Promise.any);    // One-winner race
		when.some        = lift(Promise.some);   // Multi-winner race
		when.race        = lift(Promise.race);   // First-to-settle race

		when.map         = map;                  // Array.map() for promises
		when.filter      = filter;               // Array.filter() for promises
		when.reduce      = lift(Promise.reduce);       // Array.reduce() for promises
		when.reduceRight = lift(Promise.reduceRight);  // Array.reduceRight() for promises

		when.isPromiseLike = isPromiseLike;      // Is something promise-like, aka thenable

		when.Promise     = Promise;              // Promise constructor
		when.defer       = defer;                // Create a {promise, resolve, reject} tuple

		// Error types

		when.TimeoutError = TimeoutError;

		/**
		 * Get a trusted promise for x, or by transforming x with onFulfilled
		 *
		 * @param {*} x
		 * @param {function?} onFulfilled callback to be called when x is
		 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
		 *   will be invoked immediately.
		 * @param {function?} onRejected callback to be called when x is
		 *   rejected.
		 * @param {function?} onProgress callback to be called when progress updates
		 *   are issued for x. @deprecated
		 * @returns {Promise} a new promise that will fulfill with the return
		 *   value of callback or errback or the completion value of promiseOrValue if
		 *   callback and/or errback is not supplied.
		 */
		function when(x, onFulfilled, onRejected, onProgress) {
			var p = Promise.resolve(x);
			if (arguments.length < 2) {
				return p;
			}

			return p.then(onFulfilled, onRejected, onProgress);
		}

		/**
		 * Creates a new promise whose fate is determined by resolver.
		 * @param {function} resolver function(resolve, reject, notify)
		 * @returns {Promise} promise whose fate is determine by resolver
		 */
		function promise(resolver) {
			return new Promise(resolver);
		}

		/**
		 * Lift the supplied function, creating a version of f that returns
		 * promises, and accepts promises as arguments.
		 * @param {function} f
		 * @returns {Function} version of f that returns promises
		 */
		function lift(f) {
			return function() {
				for(var i=0, l=arguments.length, a=new Array(l); i<l; ++i) {
					a[i] = arguments[i];
				}
				return apply(f, this, a);
			};
		}

		/**
		 * Call f in a future turn, with the supplied args, and return a promise
		 * for the result.
		 * @param {function} f
		 * @returns {Promise}
		 */
		function attempt(f /*, args... */) {
			/*jshint validthis:true */
			for(var i=0, l=arguments.length-1, a=new Array(l); i<l; ++i) {
				a[i] = arguments[i+1];
			}
			return apply(f, this, a);
		}

		/**
		 * Creates a {promise, resolver} pair, either or both of which
		 * may be given out safely to consumers.
		 * @return {{promise: Promise, resolve: function, reject: function, notify: function}}
		 */
		function defer() {
			return new Deferred();
		}

		function Deferred() {
			var p = Promise._defer();

			function resolve(x) { p._handler.resolve(x); }
			function reject(x) { p._handler.reject(x); }
			function notify(x) { p._handler.notify(x); }

			this.promise = p;
			this.resolve = resolve;
			this.reject = reject;
			this.notify = notify;
			this.resolver = { resolve: resolve, reject: reject, notify: notify };
		}

		/**
		 * Determines if x is promise-like, i.e. a thenable object
		 * NOTE: Will return true for *any thenable object*, and isn't truly
		 * safe, since it may attempt to access the `then` property of x (i.e.
		 *  clever/malicious getters may do weird things)
		 * @param {*} x anything
		 * @returns {boolean} true if x is promise-like
		 */
		function isPromiseLike(x) {
			return x && typeof x.then === 'function';
		}

		/**
		 * Return a promise that will resolve only once all the supplied arguments
		 * have resolved. The resolution value of the returned promise will be an array
		 * containing the resolution values of each of the arguments.
		 * @param {...*} arguments may be a mix of promises and values
		 * @returns {Promise}
		 */
		function join(/* ...promises */) {
			return Promise.all(arguments);
		}

		/**
		 * Return a promise that will fulfill once all input promises have
		 * fulfilled, or reject when any one input promise rejects.
		 * @param {array|Promise} promises array (or promise for an array) of promises
		 * @returns {Promise}
		 */
		function all(promises) {
			return when(promises, Promise.all);
		}

		/**
		 * Return a promise that will always fulfill with an array containing
		 * the outcome states of all input promises.  The returned promise
		 * will only reject if `promises` itself is a rejected promise.
		 * @param {array|Promise} promises array (or promise for an array) of promises
		 * @returns {Promise} promise for array of settled state descriptors
		 */
		function settle(promises) {
			return when(promises, Promise.settle);
		}

		/**
		 * Promise-aware array map function, similar to `Array.prototype.map()`,
		 * but input array may contain promises or values.
		 * @param {Array|Promise} promises array of anything, may contain promises and values
		 * @param {function(x:*, index:Number):*} mapFunc map function which may
		 *  return a promise or value
		 * @returns {Promise} promise that will fulfill with an array of mapped values
		 *  or reject if any input promise rejects.
		 */
		function map(promises, mapFunc) {
			return when(promises, function(promises) {
				return Promise.map(promises, mapFunc);
			});
		}

		/**
		 * Filter the provided array of promises using the provided predicate.  Input may
		 * contain promises and values
		 * @param {Array|Promise} promises array of promises and values
		 * @param {function(x:*, index:Number):boolean} predicate filtering predicate.
		 *  Must return truthy (or promise for truthy) for items to retain.
		 * @returns {Promise} promise that will fulfill with an array containing all items
		 *  for which predicate returned truthy.
		 */
		function filter(promises, predicate) {
			return when(promises, function(promises) {
				return Promise.filter(promises, predicate);
			});
		}

		return when;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	})(__webpack_require__(14));


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {

		var env = __webpack_require__(11);
		var TimeoutError = __webpack_require__(15);

		function setTimeout(f, ms, x, y) {
			return env.setTimer(function() {
				f(x, y, ms);
			}, ms);
		}

		return function timed(Promise) {
			/**
			 * Return a new promise whose fulfillment value is revealed only
			 * after ms milliseconds
			 * @param {number} ms milliseconds
			 * @returns {Promise}
			 */
			Promise.prototype.delay = function(ms) {
				var p = this._beget();
				this._handler.fold(handleDelay, ms, void 0, p._handler);
				return p;
			};

			function handleDelay(ms, x, h) {
				setTimeout(resolveDelay, ms, x, h);
			}

			function resolveDelay(x, h) {
				h.resolve(x);
			}

			/**
			 * Return a new promise that rejects after ms milliseconds unless
			 * this promise fulfills earlier, in which case the returned promise
			 * fulfills with the same value.
			 * @param {number} ms milliseconds
			 * @param {Error|*=} reason optional rejection reason to use, defaults
			 *   to a TimeoutError if not provided
			 * @returns {Promise}
			 */
			Promise.prototype.timeout = function(ms, reason) {
				var p = this._beget();
				var h = p._handler;

				var t = setTimeout(onTimeout, ms, reason, p._handler);

				this._handler.visit(h,
					function onFulfill(x) {
						env.clearTimer(t);
						this.resolve(x); // this = h
					},
					function onReject(x) {
						env.clearTimer(t);
						this.reject(x); // this = h
					},
					h.notify);

				return p;
			};

			function onTimeout(reason, h, ms) {
				var e = typeof reason === 'undefined'
					? new TimeoutError('timed out after ' + ms + 'ms')
					: reason;
				h.reject(e);
			}

			return Promise;
		};

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;var require;/* WEBPACK VAR INJECTION */(function(process) {/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	/*global process,document,setTimeout,clearTimeout,MutationObserver,WebKitMutationObserver*/
	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
		/*jshint maxcomplexity:6*/

		// Sniff "best" async scheduling option
		// Prefer process.nextTick or MutationObserver, then check for
		// setTimeout, and finally vertx, since its the only env that doesn't
		// have setTimeout

		var MutationObs;
		var capturedSetTimeout = typeof setTimeout !== 'undefined' && setTimeout;

		// Default env
		var setTimer = function(f, ms) { return setTimeout(f, ms); };
		var clearTimer = function(t) { return clearTimeout(t); };
		var asap = function (f) { return capturedSetTimeout(f, 0); };

		// Detect specific env
		if (isNode()) { // Node
			asap = function (f) { return process.nextTick(f); };

		} else if (MutationObs = hasMutationObserver()) { // Modern browser
			asap = initMutationObserver(MutationObs);

		} else if (!capturedSetTimeout) { // vert.x
			var vertxRequire = require;
			var vertx = __webpack_require__(13);
			setTimer = function (f, ms) { return vertx.setTimer(ms, f); };
			clearTimer = vertx.cancelTimer;
			asap = vertx.runOnLoop || vertx.runOnContext;
		}

		return {
			setTimer: setTimer,
			clearTimer: clearTimer,
			asap: asap
		};

		function isNode () {
			return typeof process !== 'undefined' &&
				Object.prototype.toString.call(process) === '[object process]';
		}

		function hasMutationObserver () {
			return (typeof MutationObserver === 'function' && MutationObserver) ||
				(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver);
		}

		function initMutationObserver(MutationObserver) {
			var scheduled;
			var node = document.createTextNode('');
			var o = new MutationObserver(run);
			o.observe(node, { characterData: true });

			function run() {
				var f = scheduled;
				scheduled = void 0;
				f();
			}

			var i = 0;
			return function (f) {
				scheduled = f;
				node.data = (i ^= 1);
			};
		}
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(12)))

/***/ },
/* 12 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 13 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		/**
		 * Custom error type for promises rejected by promise.timeout
		 * @param {string} message
		 * @constructor
		 */
		function TimeoutError (message) {
			Error.call(this);
			this.message = message;
			this.name = TimeoutError.name;
			if (typeof Error.captureStackTrace === 'function') {
				Error.captureStackTrace(this, TimeoutError);
			}
		}

		TimeoutError.prototype = Object.create(Error.prototype);
		TimeoutError.prototype.constructor = TimeoutError;

		return TimeoutError;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {

		var state = __webpack_require__(17);
		var applier = __webpack_require__(18);

		return function array(Promise) {

			var applyFold = applier(Promise);
			var toPromise = Promise.resolve;
			var all = Promise.all;

			var ar = Array.prototype.reduce;
			var arr = Array.prototype.reduceRight;
			var slice = Array.prototype.slice;

			// Additional array combinators

			Promise.any = any;
			Promise.some = some;
			Promise.settle = settle;

			Promise.map = map;
			Promise.filter = filter;
			Promise.reduce = reduce;
			Promise.reduceRight = reduceRight;

			/**
			 * When this promise fulfills with an array, do
			 * onFulfilled.apply(void 0, array)
			 * @param {function} onFulfilled function to apply
			 * @returns {Promise} promise for the result of applying onFulfilled
			 */
			Promise.prototype.spread = function(onFulfilled) {
				return this.then(all).then(function(array) {
					return onFulfilled.apply(this, array);
				});
			};

			return Promise;

			/**
			 * One-winner competitive race.
			 * Return a promise that will fulfill when one of the promises
			 * in the input array fulfills, or will reject when all promises
			 * have rejected.
			 * @param {array} promises
			 * @returns {Promise} promise for the first fulfilled value
			 */
			function any(promises) {
				var p = Promise._defer();
				var resolver = p._handler;
				var l = promises.length>>>0;

				var pending = l;
				var errors = [];

				for (var h, x, i = 0; i < l; ++i) {
					x = promises[i];
					if(x === void 0 && !(i in promises)) {
						--pending;
						continue;
					}

					h = Promise._handler(x);
					if(h.state() > 0) {
						resolver.become(h);
						Promise._visitRemaining(promises, i, h);
						break;
					} else {
						h.visit(resolver, handleFulfill, handleReject);
					}
				}

				if(pending === 0) {
					resolver.reject(new RangeError('any(): array must not be empty'));
				}

				return p;

				function handleFulfill(x) {
					/*jshint validthis:true*/
					errors = null;
					this.resolve(x); // this === resolver
				}

				function handleReject(e) {
					/*jshint validthis:true*/
					if(this.resolved) { // this === resolver
						return;
					}

					errors.push(e);
					if(--pending === 0) {
						this.reject(errors);
					}
				}
			}

			/**
			 * N-winner competitive race
			 * Return a promise that will fulfill when n input promises have
			 * fulfilled, or will reject when it becomes impossible for n
			 * input promises to fulfill (ie when promises.length - n + 1
			 * have rejected)
			 * @param {array} promises
			 * @param {number} n
			 * @returns {Promise} promise for the earliest n fulfillment values
			 *
			 * @deprecated
			 */
			function some(promises, n) {
				/*jshint maxcomplexity:7*/
				var p = Promise._defer();
				var resolver = p._handler;

				var results = [];
				var errors = [];

				var l = promises.length>>>0;
				var nFulfill = 0;
				var nReject;
				var x, i; // reused in both for() loops

				// First pass: count actual array items
				for(i=0; i<l; ++i) {
					x = promises[i];
					if(x === void 0 && !(i in promises)) {
						continue;
					}
					++nFulfill;
				}

				// Compute actual goals
				n = Math.max(n, 0);
				nReject = (nFulfill - n + 1);
				nFulfill = Math.min(n, nFulfill);

				if(n > nFulfill) {
					resolver.reject(new RangeError('some(): array must contain at least '
					+ n + ' item(s), but had ' + nFulfill));
				} else if(nFulfill === 0) {
					resolver.resolve(results);
				}

				// Second pass: observe each array item, make progress toward goals
				for(i=0; i<l; ++i) {
					x = promises[i];
					if(x === void 0 && !(i in promises)) {
						continue;
					}

					Promise._handler(x).visit(resolver, fulfill, reject, resolver.notify);
				}

				return p;

				function fulfill(x) {
					/*jshint validthis:true*/
					if(this.resolved) { // this === resolver
						return;
					}

					results.push(x);
					if(--nFulfill === 0) {
						errors = null;
						this.resolve(results);
					}
				}

				function reject(e) {
					/*jshint validthis:true*/
					if(this.resolved) { // this === resolver
						return;
					}

					errors.push(e);
					if(--nReject === 0) {
						results = null;
						this.reject(errors);
					}
				}
			}

			/**
			 * Apply f to the value of each promise in a list of promises
			 * and return a new list containing the results.
			 * @param {array} promises
			 * @param {function(x:*, index:Number):*} f mapping function
			 * @returns {Promise}
			 */
			function map(promises, f) {
				return Promise._traverse(f, promises);
			}

			/**
			 * Filter the provided array of promises using the provided predicate.  Input may
			 * contain promises and values
			 * @param {Array} promises array of promises and values
			 * @param {function(x:*, index:Number):boolean} predicate filtering predicate.
			 *  Must return truthy (or promise for truthy) for items to retain.
			 * @returns {Promise} promise that will fulfill with an array containing all items
			 *  for which predicate returned truthy.
			 */
			function filter(promises, predicate) {
				var a = slice.call(promises);
				return Promise._traverse(predicate, a).then(function(keep) {
					return filterSync(a, keep);
				});
			}

			function filterSync(promises, keep) {
				// Safe because we know all promises have fulfilled if we've made it this far
				var l = keep.length;
				var filtered = new Array(l);
				for(var i=0, j=0; i<l; ++i) {
					if(keep[i]) {
						filtered[j++] = Promise._handler(promises[i]).value;
					}
				}
				filtered.length = j;
				return filtered;

			}

			/**
			 * Return a promise that will always fulfill with an array containing
			 * the outcome states of all input promises.  The returned promise
			 * will never reject.
			 * @param {Array} promises
			 * @returns {Promise} promise for array of settled state descriptors
			 */
			function settle(promises) {
				return all(promises.map(settleOne));
			}

			function settleOne(p) {
				var h = Promise._handler(p);
				if(h.state() === 0) {
					return toPromise(p).then(state.fulfilled, state.rejected);
				}

				h._unreport();
				return state.inspect(h);
			}

			/**
			 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
			 * input may contain promises and/or values, and reduceFunc
			 * may return either a value or a promise, *and* initialValue may
			 * be a promise for the starting value.
			 * @param {Array|Promise} promises array or promise for an array of anything,
			 *      may contain a mix of promises and values.
			 * @param {function(accumulated:*, x:*, index:Number):*} f reduce function
			 * @returns {Promise} that will resolve to the final reduced value
			 */
			function reduce(promises, f /*, initialValue */) {
				return arguments.length > 2 ? ar.call(promises, liftCombine(f), arguments[2])
						: ar.call(promises, liftCombine(f));
			}

			/**
			 * Traditional reduce function, similar to `Array.prototype.reduceRight()`, but
			 * input may contain promises and/or values, and reduceFunc
			 * may return either a value or a promise, *and* initialValue may
			 * be a promise for the starting value.
			 * @param {Array|Promise} promises array or promise for an array of anything,
			 *      may contain a mix of promises and values.
			 * @param {function(accumulated:*, x:*, index:Number):*} f reduce function
			 * @returns {Promise} that will resolve to the final reduced value
			 */
			function reduceRight(promises, f /*, initialValue */) {
				return arguments.length > 2 ? arr.call(promises, liftCombine(f), arguments[2])
						: arr.call(promises, liftCombine(f));
			}

			function liftCombine(f) {
				return function(z, x, i) {
					return applyFold(f, void 0, [z,x,i]);
				};
			}
		};

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return {
			pending: toPendingState,
			fulfilled: toFulfilledState,
			rejected: toRejectedState,
			inspect: inspect
		};

		function toPendingState() {
			return { state: 'pending' };
		}

		function toRejectedState(e) {
			return { state: 'rejected', reason: e };
		}

		function toFulfilledState(x) {
			return { state: 'fulfilled', value: x };
		}

		function inspect(handler) {
			var state = handler.state();
			return state === 0 ? toPendingState()
				 : state > 0   ? toFulfilledState(handler.value)
				               : toRejectedState(handler.value);
		}

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		makeApply.tryCatchResolve = tryCatchResolve;

		return makeApply;

		function makeApply(Promise, call) {
			if(arguments.length < 2) {
				call = tryCatchResolve;
			}

			return apply;

			function apply(f, thisArg, args) {
				var p = Promise._defer();
				var l = args.length;
				var params = new Array(l);
				callAndResolve({ f:f, thisArg:thisArg, args:args, params:params, i:l-1, call:call }, p._handler);

				return p;
			}

			function callAndResolve(c, h) {
				if(c.i < 0) {
					return call(c.f, c.thisArg, c.params, h);
				}

				var handler = Promise._handler(c.args[c.i]);
				handler.fold(callAndResolveNext, c, void 0, h);
			}

			function callAndResolveNext(c, x, h) {
				c.params[c.i] = x;
				c.i -= 1;
				callAndResolve(c, h);
			}
		}

		function tryCatchResolve(f, thisArg, args, resolver) {
			try {
				resolver.resolve(f.apply(thisArg, args));
			} catch(e) {
				resolver.reject(e);
			}
		}

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));




/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return function flow(Promise) {

			var resolve = Promise.resolve;
			var reject = Promise.reject;
			var origCatch = Promise.prototype['catch'];

			/**
			 * Handle the ultimate fulfillment value or rejection reason, and assume
			 * responsibility for all errors.  If an error propagates out of result
			 * or handleFatalError, it will be rethrown to the host, resulting in a
			 * loud stack track on most platforms and a crash on some.
			 * @param {function?} onResult
			 * @param {function?} onError
			 * @returns {undefined}
			 */
			Promise.prototype.done = function(onResult, onError) {
				this._handler.visit(this._handler.receiver, onResult, onError);
			};

			/**
			 * Add Error-type and predicate matching to catch.  Examples:
			 * promise.catch(TypeError, handleTypeError)
			 *   .catch(predicate, handleMatchedErrors)
			 *   .catch(handleRemainingErrors)
			 * @param onRejected
			 * @returns {*}
			 */
			Promise.prototype['catch'] = Promise.prototype.otherwise = function(onRejected) {
				if (arguments.length < 2) {
					return origCatch.call(this, onRejected);
				}

				if(typeof onRejected !== 'function') {
					return this.ensure(rejectInvalidPredicate);
				}

				return origCatch.call(this, createCatchFilter(arguments[1], onRejected));
			};

			/**
			 * Wraps the provided catch handler, so that it will only be called
			 * if the predicate evaluates truthy
			 * @param {?function} handler
			 * @param {function} predicate
			 * @returns {function} conditional catch handler
			 */
			function createCatchFilter(handler, predicate) {
				return function(e) {
					return evaluatePredicate(e, predicate)
						? handler.call(this, e)
						: reject(e);
				};
			}

			/**
			 * Ensures that onFulfilledOrRejected will be called regardless of whether
			 * this promise is fulfilled or rejected.  onFulfilledOrRejected WILL NOT
			 * receive the promises' value or reason.  Any returned value will be disregarded.
			 * onFulfilledOrRejected may throw or return a rejected promise to signal
			 * an additional error.
			 * @param {function} handler handler to be called regardless of
			 *  fulfillment or rejection
			 * @returns {Promise}
			 */
			Promise.prototype['finally'] = Promise.prototype.ensure = function(handler) {
				if(typeof handler !== 'function') {
					return this;
				}

				return this.then(function(x) {
					return runSideEffect(handler, this, identity, x);
				}, function(e) {
					return runSideEffect(handler, this, reject, e);
				});
			};

			function runSideEffect (handler, thisArg, propagate, value) {
				var result = handler.call(thisArg);
				return maybeThenable(result)
					? propagateValue(result, propagate, value)
					: propagate(value);
			}

			function propagateValue (result, propagate, x) {
				return resolve(result).then(function () {
					return propagate(x);
				});
			}

			/**
			 * Recover from a failure by returning a defaultValue.  If defaultValue
			 * is a promise, it's fulfillment value will be used.  If defaultValue is
			 * a promise that rejects, the returned promise will reject with the
			 * same reason.
			 * @param {*} defaultValue
			 * @returns {Promise} new promise
			 */
			Promise.prototype['else'] = Promise.prototype.orElse = function(defaultValue) {
				return this.then(void 0, function() {
					return defaultValue;
				});
			};

			/**
			 * Shortcut for .then(function() { return value; })
			 * @param  {*} value
			 * @return {Promise} a promise that:
			 *  - is fulfilled if value is not a promise, or
			 *  - if value is a promise, will fulfill with its value, or reject
			 *    with its reason.
			 */
			Promise.prototype['yield'] = function(value) {
				return this.then(function() {
					return value;
				});
			};

			/**
			 * Runs a side effect when this promise fulfills, without changing the
			 * fulfillment value.
			 * @param {function} onFulfilledSideEffect
			 * @returns {Promise}
			 */
			Promise.prototype.tap = function(onFulfilledSideEffect) {
				return this.then(onFulfilledSideEffect)['yield'](this);
			};

			return Promise;
		};

		function rejectInvalidPredicate() {
			throw new TypeError('catch predicate must be a function');
		}

		function evaluatePredicate(e, predicate) {
			return isError(predicate) ? e instanceof predicate : predicate(e);
		}

		function isError(predicate) {
			return predicate === Error
				|| (predicate != null && predicate.prototype instanceof Error);
		}

		function maybeThenable(x) {
			return (typeof x === 'object' || typeof x === 'function') && x !== null;
		}

		function identity(x) {
			return x;
		}

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */
	/** @author Jeff Escalante */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return function fold(Promise) {

			Promise.prototype.fold = function(f, z) {
				var promise = this._beget();

				this._handler.fold(function(z, x, to) {
					Promise._handler(z).fold(function(x, z, to) {
						to.resolve(f.call(this, z, x));
					}, x, this, to);
				}, z, promise._handler.receiver, promise._handler);

				return promise;
			};

			return Promise;
		};

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {

		var inspect = __webpack_require__(17).inspect;

		return function inspection(Promise) {

			Promise.prototype.inspect = function() {
				return inspect(Promise._handler(this));
			};

			return Promise;
		};

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return function generate(Promise) {

			var resolve = Promise.resolve;

			Promise.iterate = iterate;
			Promise.unfold = unfold;

			return Promise;

			/**
			 * @deprecated Use github.com/cujojs/most streams and most.iterate
			 * Generate a (potentially infinite) stream of promised values:
			 * x, f(x), f(f(x)), etc. until condition(x) returns true
			 * @param {function} f function to generate a new x from the previous x
			 * @param {function} condition function that, given the current x, returns
			 *  truthy when the iterate should stop
			 * @param {function} handler function to handle the value produced by f
			 * @param {*|Promise} x starting value, may be a promise
			 * @return {Promise} the result of the last call to f before
			 *  condition returns true
			 */
			function iterate(f, condition, handler, x) {
				return unfold(function(x) {
					return [x, f(x)];
				}, condition, handler, x);
			}

			/**
			 * @deprecated Use github.com/cujojs/most streams and most.unfold
			 * Generate a (potentially infinite) stream of promised values
			 * by applying handler(generator(seed)) iteratively until
			 * condition(seed) returns true.
			 * @param {function} unspool function that generates a [value, newSeed]
			 *  given a seed.
			 * @param {function} condition function that, given the current seed, returns
			 *  truthy when the unfold should stop
			 * @param {function} handler function to handle the value produced by unspool
			 * @param x {*|Promise} starting value, may be a promise
			 * @return {Promise} the result of the last value produced by unspool before
			 *  condition returns true
			 */
			function unfold(unspool, condition, handler, x) {
				return resolve(x).then(function(seed) {
					return resolve(condition(seed)).then(function(done) {
						return done ? seed : resolve(unspool(seed)).spread(next);
					});
				});

				function next(item, newSeed) {
					return resolve(handler(item)).then(function() {
						return unfold(unspool, condition, handler, newSeed);
					});
				}
			}
		};

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return function progress(Promise) {

			/**
			 * @deprecated
			 * Register a progress handler for this promise
			 * @param {function} onProgress
			 * @returns {Promise}
			 */
			Promise.prototype.progress = function(onProgress) {
				return this.then(void 0, void 0, onProgress);
			};

			return Promise;
		};

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return function addWith(Promise) {
			/**
			 * Returns a promise whose handlers will be called with `this` set to
			 * the supplied receiver.  Subsequent promises derived from the
			 * returned promise will also have their handlers called with receiver
			 * as `this`. Calling `with` with undefined or no arguments will return
			 * a promise whose handlers will again be called in the usual Promises/A+
			 * way (no `this`) thus safely undoing any previous `with` in the
			 * promise chain.
			 *
			 * WARNING: Promises returned from `with`/`withThis` are NOT Promises/A+
			 * compliant, specifically violating 2.2.5 (http://promisesaplus.com/#point-41)
			 *
			 * @param {object} receiver `this` value for all handlers attached to
			 *  the returned promise.
			 * @returns {Promise}
			 */
			Promise.prototype['with'] = Promise.prototype.withThis = function(receiver) {
				var p = this._beget();
				var child = p._handler;
				child.receiver = receiver;
				this._handler.chain(child, receiver);
				return p;
			};

			return Promise;
		};

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));



/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {

		var setTimer = __webpack_require__(11).setTimer;
		var format = __webpack_require__(26);

		return function unhandledRejection(Promise) {

			var logError = noop;
			var logInfo = noop;
			var localConsole;

			if(typeof console !== 'undefined') {
				// Alias console to prevent things like uglify's drop_console option from
				// removing console.log/error. Unhandled rejections fall into the same
				// category as uncaught exceptions, and build tools shouldn't silence them.
				localConsole = console;
				logError = typeof localConsole.error !== 'undefined'
					? function (e) { localConsole.error(e); }
					: function (e) { localConsole.log(e); };

				logInfo = typeof localConsole.info !== 'undefined'
					? function (e) { localConsole.info(e); }
					: function (e) { localConsole.log(e); };
			}

			Promise.onPotentiallyUnhandledRejection = function(rejection) {
				enqueue(report, rejection);
			};

			Promise.onPotentiallyUnhandledRejectionHandled = function(rejection) {
				enqueue(unreport, rejection);
			};

			Promise.onFatalRejection = function(rejection) {
				enqueue(throwit, rejection.value);
			};

			var tasks = [];
			var reported = [];
			var running = null;

			function report(r) {
				if(!r.handled) {
					reported.push(r);
					logError('Potentially unhandled rejection [' + r.id + '] ' + format.formatError(r.value));
				}
			}

			function unreport(r) {
				var i = reported.indexOf(r);
				if(i >= 0) {
					reported.splice(i, 1);
					logInfo('Handled previous rejection [' + r.id + '] ' + format.formatObject(r.value));
				}
			}

			function enqueue(f, x) {
				tasks.push(f, x);
				if(running === null) {
					running = setTimer(flush, 0);
				}
			}

			function flush() {
				running = null;
				while(tasks.length > 0) {
					tasks.shift()(tasks.shift());
				}
			}

			return Promise;
		};

		function throwit(e) {
			throw e;
		}

		function noop() {}

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return {
			formatError: formatError,
			formatObject: formatObject,
			tryStringify: tryStringify
		};

		/**
		 * Format an error into a string.  If e is an Error and has a stack property,
		 * it's returned.  Otherwise, e is formatted using formatObject, with a
		 * warning added about e not being a proper Error.
		 * @param {*} e
		 * @returns {String} formatted string, suitable for output to developers
		 */
		function formatError(e) {
			var s = typeof e === 'object' && e !== null && (e.stack || e.message) ? e.stack || e.message : formatObject(e);
			return e instanceof Error ? s : s + ' (WARNING: non-Error used)';
		}

		/**
		 * Format an object, detecting "plain" objects and running them through
		 * JSON.stringify if possible.
		 * @param {Object} o
		 * @returns {string}
		 */
		function formatObject(o) {
			var s = String(o);
			if(s === '[object Object]' && typeof JSON !== 'undefined') {
				s = tryStringify(o, s);
			}
			return s;
		}

		/**
		 * Try to return the result of JSON.stringify(x).  If that fails, return
		 * defaultValue
		 * @param {*} x
		 * @param {*} defaultValue
		 * @returns {String|*} JSON.stringify(x) or defaultValue
		 */
		function tryStringify(x, defaultValue) {
			try {
				return JSON.stringify(x);
			} catch(e) {
				return defaultValue;
			}
		}

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require) {

		var makePromise = __webpack_require__(28);
		var Scheduler = __webpack_require__(29);
		var async = __webpack_require__(11).asap;

		return makePromise({
			scheduler: new Scheduler(async)
		});

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	})(__webpack_require__(14));


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(process) {/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		return function makePromise(environment) {

			var tasks = environment.scheduler;
			var emitRejection = initEmitRejection();

			var objectCreate = Object.create ||
				function(proto) {
					function Child() {}
					Child.prototype = proto;
					return new Child();
				};

			/**
			 * Create a promise whose fate is determined by resolver
			 * @constructor
			 * @returns {Promise} promise
			 * @name Promise
			 */
			function Promise(resolver, handler) {
				this._handler = resolver === Handler ? handler : init(resolver);
			}

			/**
			 * Run the supplied resolver
			 * @param resolver
			 * @returns {Pending}
			 */
			function init(resolver) {
				var handler = new Pending();

				try {
					resolver(promiseResolve, promiseReject, promiseNotify);
				} catch (e) {
					promiseReject(e);
				}

				return handler;

				/**
				 * Transition from pre-resolution state to post-resolution state, notifying
				 * all listeners of the ultimate fulfillment or rejection
				 * @param {*} x resolution value
				 */
				function promiseResolve (x) {
					handler.resolve(x);
				}
				/**
				 * Reject this promise with reason, which will be used verbatim
				 * @param {Error|*} reason rejection reason, strongly suggested
				 *   to be an Error type
				 */
				function promiseReject (reason) {
					handler.reject(reason);
				}

				/**
				 * @deprecated
				 * Issue a progress event, notifying all progress listeners
				 * @param {*} x progress event payload to pass to all listeners
				 */
				function promiseNotify (x) {
					handler.notify(x);
				}
			}

			// Creation

			Promise.resolve = resolve;
			Promise.reject = reject;
			Promise.never = never;

			Promise._defer = defer;
			Promise._handler = getHandler;

			/**
			 * Returns a trusted promise. If x is already a trusted promise, it is
			 * returned, otherwise returns a new trusted Promise which follows x.
			 * @param  {*} x
			 * @return {Promise} promise
			 */
			function resolve(x) {
				return isPromise(x) ? x
					: new Promise(Handler, new Async(getHandler(x)));
			}

			/**
			 * Return a reject promise with x as its reason (x is used verbatim)
			 * @param {*} x
			 * @returns {Promise} rejected promise
			 */
			function reject(x) {
				return new Promise(Handler, new Async(new Rejected(x)));
			}

			/**
			 * Return a promise that remains pending forever
			 * @returns {Promise} forever-pending promise.
			 */
			function never() {
				return foreverPendingPromise; // Should be frozen
			}

			/**
			 * Creates an internal {promise, resolver} pair
			 * @private
			 * @returns {Promise}
			 */
			function defer() {
				return new Promise(Handler, new Pending());
			}

			// Transformation and flow control

			/**
			 * Transform this promise's fulfillment value, returning a new Promise
			 * for the transformed result.  If the promise cannot be fulfilled, onRejected
			 * is called with the reason.  onProgress *may* be called with updates toward
			 * this promise's fulfillment.
			 * @param {function=} onFulfilled fulfillment handler
			 * @param {function=} onRejected rejection handler
			 * @param {function=} onProgress @deprecated progress handler
			 * @return {Promise} new promise
			 */
			Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
				var parent = this._handler;
				var state = parent.join().state();

				if ((typeof onFulfilled !== 'function' && state > 0) ||
					(typeof onRejected !== 'function' && state < 0)) {
					// Short circuit: value will not change, simply share handler
					return new this.constructor(Handler, parent);
				}

				var p = this._beget();
				var child = p._handler;

				parent.chain(child, parent.receiver, onFulfilled, onRejected, onProgress);

				return p;
			};

			/**
			 * If this promise cannot be fulfilled due to an error, call onRejected to
			 * handle the error. Shortcut for .then(undefined, onRejected)
			 * @param {function?} onRejected
			 * @return {Promise}
			 */
			Promise.prototype['catch'] = function(onRejected) {
				return this.then(void 0, onRejected);
			};

			/**
			 * Creates a new, pending promise of the same type as this promise
			 * @private
			 * @returns {Promise}
			 */
			Promise.prototype._beget = function() {
				return begetFrom(this._handler, this.constructor);
			};

			function begetFrom(parent, Promise) {
				var child = new Pending(parent.receiver, parent.join().context);
				return new Promise(Handler, child);
			}

			// Array combinators

			Promise.all = all;
			Promise.race = race;
			Promise._traverse = traverse;

			/**
			 * Return a promise that will fulfill when all promises in the
			 * input array have fulfilled, or will reject when one of the
			 * promises rejects.
			 * @param {array} promises array of promises
			 * @returns {Promise} promise for array of fulfillment values
			 */
			function all(promises) {
				return traverseWith(snd, null, promises);
			}

			/**
			 * Array<Promise<X>> -> Promise<Array<f(X)>>
			 * @private
			 * @param {function} f function to apply to each promise's value
			 * @param {Array} promises array of promises
			 * @returns {Promise} promise for transformed values
			 */
			function traverse(f, promises) {
				return traverseWith(tryCatch2, f, promises);
			}

			function traverseWith(tryMap, f, promises) {
				var handler = typeof f === 'function' ? mapAt : settleAt;

				var resolver = new Pending();
				var pending = promises.length >>> 0;
				var results = new Array(pending);

				for (var i = 0, x; i < promises.length && !resolver.resolved; ++i) {
					x = promises[i];

					if (x === void 0 && !(i in promises)) {
						--pending;
						continue;
					}

					traverseAt(promises, handler, i, x, resolver);
				}

				if(pending === 0) {
					resolver.become(new Fulfilled(results));
				}

				return new Promise(Handler, resolver);

				function mapAt(i, x, resolver) {
					if(!resolver.resolved) {
						traverseAt(promises, settleAt, i, tryMap(f, x, i), resolver);
					}
				}

				function settleAt(i, x, resolver) {
					results[i] = x;
					if(--pending === 0) {
						resolver.become(new Fulfilled(results));
					}
				}
			}

			function traverseAt(promises, handler, i, x, resolver) {
				if (maybeThenable(x)) {
					var h = getHandlerMaybeThenable(x);
					var s = h.state();

					if (s === 0) {
						h.fold(handler, i, void 0, resolver);
					} else if (s > 0) {
						handler(i, h.value, resolver);
					} else {
						resolver.become(h);
						visitRemaining(promises, i+1, h);
					}
				} else {
					handler(i, x, resolver);
				}
			}

			Promise._visitRemaining = visitRemaining;
			function visitRemaining(promises, start, handler) {
				for(var i=start; i<promises.length; ++i) {
					markAsHandled(getHandler(promises[i]), handler);
				}
			}

			function markAsHandled(h, handler) {
				if(h === handler) {
					return;
				}

				var s = h.state();
				if(s === 0) {
					h.visit(h, void 0, h._unreport);
				} else if(s < 0) {
					h._unreport();
				}
			}

			/**
			 * Fulfill-reject competitive race. Return a promise that will settle
			 * to the same state as the earliest input promise to settle.
			 *
			 * WARNING: The ES6 Promise spec requires that race()ing an empty array
			 * must return a promise that is pending forever.  This implementation
			 * returns a singleton forever-pending promise, the same singleton that is
			 * returned by Promise.never(), thus can be checked with ===
			 *
			 * @param {array} promises array of promises to race
			 * @returns {Promise} if input is non-empty, a promise that will settle
			 * to the same outcome as the earliest input promise to settle. if empty
			 * is empty, returns a promise that will never settle.
			 */
			function race(promises) {
				if(typeof promises !== 'object' || promises === null) {
					return reject(new TypeError('non-iterable passed to race()'));
				}

				// Sigh, race([]) is untestable unless we return *something*
				// that is recognizable without calling .then() on it.
				return promises.length === 0 ? never()
					 : promises.length === 1 ? resolve(promises[0])
					 : runRace(promises);
			}

			function runRace(promises) {
				var resolver = new Pending();
				var i, x, h;
				for(i=0; i<promises.length; ++i) {
					x = promises[i];
					if (x === void 0 && !(i in promises)) {
						continue;
					}

					h = getHandler(x);
					if(h.state() !== 0) {
						resolver.become(h);
						visitRemaining(promises, i+1, h);
						break;
					} else {
						h.visit(resolver, resolver.resolve, resolver.reject);
					}
				}
				return new Promise(Handler, resolver);
			}

			// Promise internals
			// Below this, everything is @private

			/**
			 * Get an appropriate handler for x, without checking for cycles
			 * @param {*} x
			 * @returns {object} handler
			 */
			function getHandler(x) {
				if(isPromise(x)) {
					return x._handler.join();
				}
				return maybeThenable(x) ? getHandlerUntrusted(x) : new Fulfilled(x);
			}

			/**
			 * Get a handler for thenable x.
			 * NOTE: You must only call this if maybeThenable(x) == true
			 * @param {object|function|Promise} x
			 * @returns {object} handler
			 */
			function getHandlerMaybeThenable(x) {
				return isPromise(x) ? x._handler.join() : getHandlerUntrusted(x);
			}

			/**
			 * Get a handler for potentially untrusted thenable x
			 * @param {*} x
			 * @returns {object} handler
			 */
			function getHandlerUntrusted(x) {
				try {
					var untrustedThen = x.then;
					return typeof untrustedThen === 'function'
						? new Thenable(untrustedThen, x)
						: new Fulfilled(x);
				} catch(e) {
					return new Rejected(e);
				}
			}

			/**
			 * Handler for a promise that is pending forever
			 * @constructor
			 */
			function Handler() {}

			Handler.prototype.when
				= Handler.prototype.become
				= Handler.prototype.notify // deprecated
				= Handler.prototype.fail
				= Handler.prototype._unreport
				= Handler.prototype._report
				= noop;

			Handler.prototype._state = 0;

			Handler.prototype.state = function() {
				return this._state;
			};

			/**
			 * Recursively collapse handler chain to find the handler
			 * nearest to the fully resolved value.
			 * @returns {object} handler nearest the fully resolved value
			 */
			Handler.prototype.join = function() {
				var h = this;
				while(h.handler !== void 0) {
					h = h.handler;
				}
				return h;
			};

			Handler.prototype.chain = function(to, receiver, fulfilled, rejected, progress) {
				this.when({
					resolver: to,
					receiver: receiver,
					fulfilled: fulfilled,
					rejected: rejected,
					progress: progress
				});
			};

			Handler.prototype.visit = function(receiver, fulfilled, rejected, progress) {
				this.chain(failIfRejected, receiver, fulfilled, rejected, progress);
			};

			Handler.prototype.fold = function(f, z, c, to) {
				this.when(new Fold(f, z, c, to));
			};

			/**
			 * Handler that invokes fail() on any handler it becomes
			 * @constructor
			 */
			function FailIfRejected() {}

			inherit(Handler, FailIfRejected);

			FailIfRejected.prototype.become = function(h) {
				h.fail();
			};

			var failIfRejected = new FailIfRejected();

			/**
			 * Handler that manages a queue of consumers waiting on a pending promise
			 * @constructor
			 */
			function Pending(receiver, inheritedContext) {
				Promise.createContext(this, inheritedContext);

				this.consumers = void 0;
				this.receiver = receiver;
				this.handler = void 0;
				this.resolved = false;
			}

			inherit(Handler, Pending);

			Pending.prototype._state = 0;

			Pending.prototype.resolve = function(x) {
				this.become(getHandler(x));
			};

			Pending.prototype.reject = function(x) {
				if(this.resolved) {
					return;
				}

				this.become(new Rejected(x));
			};

			Pending.prototype.join = function() {
				if (!this.resolved) {
					return this;
				}

				var h = this;

				while (h.handler !== void 0) {
					h = h.handler;
					if (h === this) {
						return this.handler = cycle();
					}
				}

				return h;
			};

			Pending.prototype.run = function() {
				var q = this.consumers;
				var handler = this.handler;
				this.handler = this.handler.join();
				this.consumers = void 0;

				for (var i = 0; i < q.length; ++i) {
					handler.when(q[i]);
				}
			};

			Pending.prototype.become = function(handler) {
				if(this.resolved) {
					return;
				}

				this.resolved = true;
				this.handler = handler;
				if(this.consumers !== void 0) {
					tasks.enqueue(this);
				}

				if(this.context !== void 0) {
					handler._report(this.context);
				}
			};

			Pending.prototype.when = function(continuation) {
				if(this.resolved) {
					tasks.enqueue(new ContinuationTask(continuation, this.handler));
				} else {
					if(this.consumers === void 0) {
						this.consumers = [continuation];
					} else {
						this.consumers.push(continuation);
					}
				}
			};

			/**
			 * @deprecated
			 */
			Pending.prototype.notify = function(x) {
				if(!this.resolved) {
					tasks.enqueue(new ProgressTask(x, this));
				}
			};

			Pending.prototype.fail = function(context) {
				var c = typeof context === 'undefined' ? this.context : context;
				this.resolved && this.handler.join().fail(c);
			};

			Pending.prototype._report = function(context) {
				this.resolved && this.handler.join()._report(context);
			};

			Pending.prototype._unreport = function() {
				this.resolved && this.handler.join()._unreport();
			};

			/**
			 * Wrap another handler and force it into a future stack
			 * @param {object} handler
			 * @constructor
			 */
			function Async(handler) {
				this.handler = handler;
			}

			inherit(Handler, Async);

			Async.prototype.when = function(continuation) {
				tasks.enqueue(new ContinuationTask(continuation, this));
			};

			Async.prototype._report = function(context) {
				this.join()._report(context);
			};

			Async.prototype._unreport = function() {
				this.join()._unreport();
			};

			/**
			 * Handler that wraps an untrusted thenable and assimilates it in a future stack
			 * @param {function} then
			 * @param {{then: function}} thenable
			 * @constructor
			 */
			function Thenable(then, thenable) {
				Pending.call(this);
				tasks.enqueue(new AssimilateTask(then, thenable, this));
			}

			inherit(Pending, Thenable);

			/**
			 * Handler for a fulfilled promise
			 * @param {*} x fulfillment value
			 * @constructor
			 */
			function Fulfilled(x) {
				Promise.createContext(this);
				this.value = x;
			}

			inherit(Handler, Fulfilled);

			Fulfilled.prototype._state = 1;

			Fulfilled.prototype.fold = function(f, z, c, to) {
				runContinuation3(f, z, this, c, to);
			};

			Fulfilled.prototype.when = function(cont) {
				runContinuation1(cont.fulfilled, this, cont.receiver, cont.resolver);
			};

			var errorId = 0;

			/**
			 * Handler for a rejected promise
			 * @param {*} x rejection reason
			 * @constructor
			 */
			function Rejected(x) {
				Promise.createContext(this);

				this.id = ++errorId;
				this.value = x;
				this.handled = false;
				this.reported = false;

				this._report();
			}

			inherit(Handler, Rejected);

			Rejected.prototype._state = -1;

			Rejected.prototype.fold = function(f, z, c, to) {
				to.become(this);
			};

			Rejected.prototype.when = function(cont) {
				if(typeof cont.rejected === 'function') {
					this._unreport();
				}
				runContinuation1(cont.rejected, this, cont.receiver, cont.resolver);
			};

			Rejected.prototype._report = function(context) {
				tasks.afterQueue(new ReportTask(this, context));
			};

			Rejected.prototype._unreport = function() {
				if(this.handled) {
					return;
				}
				this.handled = true;
				tasks.afterQueue(new UnreportTask(this));
			};

			Rejected.prototype.fail = function(context) {
				this.reported = true;
				emitRejection('unhandledRejection', this);
				Promise.onFatalRejection(this, context === void 0 ? this.context : context);
			};

			function ReportTask(rejection, context) {
				this.rejection = rejection;
				this.context = context;
			}

			ReportTask.prototype.run = function() {
				if(!this.rejection.handled && !this.rejection.reported) {
					this.rejection.reported = true;
					emitRejection('unhandledRejection', this.rejection) ||
						Promise.onPotentiallyUnhandledRejection(this.rejection, this.context);
				}
			};

			function UnreportTask(rejection) {
				this.rejection = rejection;
			}

			UnreportTask.prototype.run = function() {
				if(this.rejection.reported) {
					emitRejection('rejectionHandled', this.rejection) ||
						Promise.onPotentiallyUnhandledRejectionHandled(this.rejection);
				}
			};

			// Unhandled rejection hooks
			// By default, everything is a noop

			Promise.createContext
				= Promise.enterContext
				= Promise.exitContext
				= Promise.onPotentiallyUnhandledRejection
				= Promise.onPotentiallyUnhandledRejectionHandled
				= Promise.onFatalRejection
				= noop;

			// Errors and singletons

			var foreverPendingHandler = new Handler();
			var foreverPendingPromise = new Promise(Handler, foreverPendingHandler);

			function cycle() {
				return new Rejected(new TypeError('Promise cycle'));
			}

			// Task runners

			/**
			 * Run a single consumer
			 * @constructor
			 */
			function ContinuationTask(continuation, handler) {
				this.continuation = continuation;
				this.handler = handler;
			}

			ContinuationTask.prototype.run = function() {
				this.handler.join().when(this.continuation);
			};

			/**
			 * Run a queue of progress handlers
			 * @constructor
			 */
			function ProgressTask(value, handler) {
				this.handler = handler;
				this.value = value;
			}

			ProgressTask.prototype.run = function() {
				var q = this.handler.consumers;
				if(q === void 0) {
					return;
				}

				for (var c, i = 0; i < q.length; ++i) {
					c = q[i];
					runNotify(c.progress, this.value, this.handler, c.receiver, c.resolver);
				}
			};

			/**
			 * Assimilate a thenable, sending it's value to resolver
			 * @param {function} then
			 * @param {object|function} thenable
			 * @param {object} resolver
			 * @constructor
			 */
			function AssimilateTask(then, thenable, resolver) {
				this._then = then;
				this.thenable = thenable;
				this.resolver = resolver;
			}

			AssimilateTask.prototype.run = function() {
				var h = this.resolver;
				tryAssimilate(this._then, this.thenable, _resolve, _reject, _notify);

				function _resolve(x) { h.resolve(x); }
				function _reject(x)  { h.reject(x); }
				function _notify(x)  { h.notify(x); }
			};

			function tryAssimilate(then, thenable, resolve, reject, notify) {
				try {
					then.call(thenable, resolve, reject, notify);
				} catch (e) {
					reject(e);
				}
			}

			/**
			 * Fold a handler value with z
			 * @constructor
			 */
			function Fold(f, z, c, to) {
				this.f = f; this.z = z; this.c = c; this.to = to;
				this.resolver = failIfRejected;
				this.receiver = this;
			}

			Fold.prototype.fulfilled = function(x) {
				this.f.call(this.c, this.z, x, this.to);
			};

			Fold.prototype.rejected = function(x) {
				this.to.reject(x);
			};

			Fold.prototype.progress = function(x) {
				this.to.notify(x);
			};

			// Other helpers

			/**
			 * @param {*} x
			 * @returns {boolean} true iff x is a trusted Promise
			 */
			function isPromise(x) {
				return x instanceof Promise;
			}

			/**
			 * Test just enough to rule out primitives, in order to take faster
			 * paths in some code
			 * @param {*} x
			 * @returns {boolean} false iff x is guaranteed *not* to be a thenable
			 */
			function maybeThenable(x) {
				return (typeof x === 'object' || typeof x === 'function') && x !== null;
			}

			function runContinuation1(f, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.become(h);
				}

				Promise.enterContext(h);
				tryCatchReject(f, h.value, receiver, next);
				Promise.exitContext();
			}

			function runContinuation3(f, x, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.become(h);
				}

				Promise.enterContext(h);
				tryCatchReject3(f, x, h.value, receiver, next);
				Promise.exitContext();
			}

			/**
			 * @deprecated
			 */
			function runNotify(f, x, h, receiver, next) {
				if(typeof f !== 'function') {
					return next.notify(x);
				}

				Promise.enterContext(h);
				tryCatchReturn(f, x, receiver, next);
				Promise.exitContext();
			}

			function tryCatch2(f, a, b) {
				try {
					return f(a, b);
				} catch(e) {
					return reject(e);
				}
			}

			/**
			 * Return f.call(thisArg, x), or if it throws return a rejected promise for
			 * the thrown exception
			 */
			function tryCatchReject(f, x, thisArg, next) {
				try {
					next.become(getHandler(f.call(thisArg, x)));
				} catch(e) {
					next.become(new Rejected(e));
				}
			}

			/**
			 * Same as above, but includes the extra argument parameter.
			 */
			function tryCatchReject3(f, x, y, thisArg, next) {
				try {
					f.call(thisArg, x, y, next);
				} catch(e) {
					next.become(new Rejected(e));
				}
			}

			/**
			 * @deprecated
			 * Return f.call(thisArg, x), or if it throws, *return* the exception
			 */
			function tryCatchReturn(f, x, thisArg, next) {
				try {
					next.notify(f.call(thisArg, x));
				} catch(e) {
					next.notify(e);
				}
			}

			function inherit(Parent, Child) {
				Child.prototype = objectCreate(Parent.prototype);
				Child.prototype.constructor = Child;
			}

			function snd(x, y) {
				return y;
			}

			function noop() {}

			function initEmitRejection() {
				/*global process, self, CustomEvent*/
				if(typeof process !== 'undefined' && process !== null
					&& typeof process.emit === 'function') {
					// Returning falsy here means to call the default
					// onPotentiallyUnhandledRejection API.  This is safe even in
					// browserify since process.emit always returns falsy in browserify:
					// https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46
					return function(type, rejection) {
						return type === 'unhandledRejection'
							? process.emit(type, rejection.value, rejection)
							: process.emit(type, rejection);
					};
				} else if(typeof self !== 'undefined' && typeof CustomEvent === 'function') {
					return (function(noop, self, CustomEvent) {
						var hasCustomEvent = false;
						try {
							var ev = new CustomEvent('unhandledRejection');
							hasCustomEvent = ev instanceof CustomEvent;
						} catch (e) {}

						return !hasCustomEvent ? noop : function(type, rejection) {
							var ev = new CustomEvent(type, {
								detail: {
									reason: rejection.value,
									key: rejection
								},
								bubbles: false,
								cancelable: true
							});

							return !self.dispatchEvent(ev);
						};
					}(noop, self, CustomEvent));
				}

				return noop;
			}

			return Promise;
		};
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(12)))

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	(function(define) { 'use strict';
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

		// Credit to Twisol (https://github.com/Twisol) for suggesting
		// this type of extensible queue + trampoline approach for next-tick conflation.

		/**
		 * Async task scheduler
		 * @param {function} async function to schedule a single async function
		 * @constructor
		 */
		function Scheduler(async) {
			this._async = async;
			this._running = false;

			this._queue = this;
			this._queueLen = 0;
			this._afterQueue = {};
			this._afterQueueLen = 0;

			var self = this;
			this.drain = function() {
				self._drain();
			};
		}

		/**
		 * Enqueue a task
		 * @param {{ run:function }} task
		 */
		Scheduler.prototype.enqueue = function(task) {
			this._queue[this._queueLen++] = task;
			this.run();
		};

		/**
		 * Enqueue a task to run after the main task queue
		 * @param {{ run:function }} task
		 */
		Scheduler.prototype.afterQueue = function(task) {
			this._afterQueue[this._afterQueueLen++] = task;
			this.run();
		};

		Scheduler.prototype.run = function() {
			if (!this._running) {
				this._running = true;
				this._async(this.drain);
			}
		};

		/**
		 * Drain the handler queue entirely, and then the after queue
		 */
		Scheduler.prototype._drain = function() {
			var i = 0;
			for (; i < this._queueLen; ++i) {
				this._queue[i].run();
				this._queue[i] = void 0;
			}

			this._queueLen = 0;
			this._running = false;

			for (i = 0; i < this._afterQueueLen; ++i) {
				this._afterQueue[i].run();
				this._afterQueue[i] = void 0;
			}

			this._afterQueueLen = 0;
		};

		return Scheduler;

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}(__webpack_require__(14)));


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var when = __webpack_require__(9);

	/**
	 * @param {Object} options - Settings to control the behaviour of the retry strategy.
	 * @param {EventEmitter} controller - An EventEmitter that emits 'shouldRetry' whenever a pending retry should be made immediate.
	 */
	module.exports.defaultRetry = function defaultRetry(options, controller) {
		var currentDelay = options.initialDelay || 3000;
		var maximumDelay = options.maximumDelay || 60000;
		// We randomize the time delay multiplier so that spam does not occur.
		var multiplier = 1.5 + (options.deterministic ? 1 : Math.random());
		var maximumRetries = options.maximumRetries || 6;
		var retryNumber = 1;
		return function exponentialBackOff(next, error) {
			// See if we've reached the limit.
			if (retryNumber > maximumRetries) {
				return when.reject(error);
			}
			retryNumber += 1;
			return when.promise(function(resolve) {
				var retryTimer;
				// Declare a "xor" guard which will ensure that the retry is only attempted once:
				var retryEntered = false;
				var retry = function retry() {
					// Guard clause: ensure the handler only runs once.
					if (retryEntered) {
						return;
					}
					// Set the guard flag.
					retryEntered = true;
					// Clear the timeout - this is a no-op if we've entered this function due to the timeout firing in the ordinary way.
					clearTimeout(retryTimer);
					// Remove the handler - this is a no-op if we've arrived here due to the shouldRetry event.
					// Increase the delay by multiplying it by a pre-determined value:
					currentDelay = currentDelay * multiplier;
					// Enforce the amount of time the delay is capped at:
					if (currentDelay > maximumDelay) {
						currentDelay = maximumDelay;
					}
					// Actually call the next function, remembering to use "return" so that the promise chain is not broken:
					return resolve(next());
				};
				controller.once('shouldRetry', retry);
				retryTimer = setTimeout(retry, currentDelay);
			});
		};
	}

/***/ }
/******/ ]);