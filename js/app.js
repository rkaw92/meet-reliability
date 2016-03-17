(function() {
	'use strict';
	
	class PresentationController {
		constructor() {
			// Elements:
			this._panel = window.document.getElementById('statusPanel');
			
			// State:
			this._revealed = false;
		}
		
		run() {
			var revelationButton = window.document.getElementById('revelation');
			var panel = this._panel;
			var self = this;
			revelationButton.addEventListener('click', function() {
				// Guard clause: only run the "revelation" code once.
				if (self._revealed) {
					return;
				}
				panel.classList.add('enabled');
				revelationButton.blur();
			});
		}
	}
	
	console.log('class loaded');
	window.addEventListener('load', function() {
		window.controller = new PresentationController();
		window.controller.run();
	});
})();
