const passMessagesFromDevtoolsToTab = ( port ) => {

	const sendMessagesToActiveTab = ( message ) => {
		chrome.tabs.query( {
			currentWindow: true,
			active: true,
		}, function ( tabs ) {
			if ( tabs.length > 0 ) {
				chrome.tabs.sendMessage( tabs[ 0 ].id, message );
			}
		} );
	};

	const sendMessagesToDevTools = ( message, sender ) => {
		port.postMessage( message );
	};
	port.onMessage.addListener( sendMessagesToActiveTab );

	// When a tab is closed, we should remove related listeners
	port.onDisconnect.addListener( function() {
		chrome.runtime.onMessage.removeListener( sendMessagesToDevTools );
	} );
	// Pass content script messages back to devtools
	chrome.runtime.onMessage.addListener( sendMessagesToDevTools );
}

chrome.runtime.onConnect.addListener( passMessagesFromDevtoolsToTab );
