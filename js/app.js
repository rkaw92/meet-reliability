(function() {
	'use strict';
	
	var AppClient = require('esdf-ws-client').AppClient(window.WebSocket);
	
	class PresentationController {
		constructor(config) {
			// Elements:
			this._panel = window.document.getElementById('statusPanel');
			this._connectionStatusIndicator = window.document.getElementById('connectionStatusIndicator');
			
			// State:
			this._config = config || {
				server: 'ws://[::1]:8865'
			};
			this._revealed = false;
			this._connected = false;
			
			// Network:
			this._appClient = null;
			
		}
		
		_updateConnectionStateWidget() {
			var newStatusDescription = this._connected ? 'up' : 'down';
			this._connectionStatusIndicator.textContent = newStatusDescription;
			this._connectionStatusIndicator.style.color = this._connected ? 'green' : 'red';
		}
		
		_startClient() {
			var self = this;
			self._appClient = new AppClient(self._config.server);
			self._appClient.transport.on('connect', function() {
				self._connected = true;
				self._updateConnectionStateWidget();
			});
			self._appClient.transport.on('disconnect', function() {
				self._connected = false;
				self._updateConnectionStateWidget();
			});
			window.appClient = self._appClient;
		}
		
		
		
		run() {
			var self = this;
			var revelationButton = window.document.getElementById('revelation');
			var panel = self._panel;
			
			// The "revelation" button starts the entire client up and uncovers some elements:
			revelationButton.addEventListener('click', function() {
				// Guard clause: only run the "revelation" code once.
				if (self._revealed) {
					return;
				}
				panel.classList.add('enabled');
				revelationButton.blur();
				
				self._startClient();
			});
			
			// The status indicator button can toggle the connection state:
			var statusButton = self._connectionStatusIndicator;
			statusButton.addEventListener('click', function() {
				if (self._connected) {
					self._appClient.transport.stop();
				}
				else {
					self._appClient.transport.start();
				}
				statusButton.blur();
			});
		}
	}
	
	window.addEventListener('load', function() {
		window.controller = new PresentationController(window.presentationConfig);
		window.controller.run();
	});
})();
