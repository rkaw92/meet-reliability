(function() {
	'use strict';
	
	var AppClient = require('esdf-ws-client').AppClient(window.WebSocket);
	
	class Auction {
		constructor() {
			this.created = false;
			this.name = 'NOT CREATED';
			this.amount = '--';
		}
	}
	
	class PresentationController {
		constructor(config) {
			// Elements:
			this._panel = window.document.getElementById('statusPanel');
			this._connectionStatusIndicator = window.document.getElementById('connectionStatusIndicator');
			
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
			preview.querySelector('.amount').textContent = auction.amount;
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
			
			// For debugging:
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
				self._revealed = true;
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
		}
	}
	
	window.addEventListener('load', function() {
		window.controller = new PresentationController(window.presentationConfig);
		window.controller.run();
	});
})();
