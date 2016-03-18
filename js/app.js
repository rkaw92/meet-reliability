(function() {
	'use strict';
	
	var AppClient = require('esdf-ws-client').AppClient(window.WebSocket);
	
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
