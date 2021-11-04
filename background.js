chrome.extension.onConnect.addListener( function ( port ) {
	port.onMessage.addListener( function ( message ) {
		// Pass message from devtools to active tab
		chrome.tabs.query( {
			currentWindow: true,
			active: true,
		}, function ( tabs ) {
			if ( tabs.length > 0 ) {
				chrome.tabs.sendMessage( tabs[ 0 ].id, message );
			}
		} );
	} );
	// Pass content script messages back to devtools
	chrome.extension.onMessage.addListener( function ( message, sender ) {
		port.postMessage( message );
	} );
} );