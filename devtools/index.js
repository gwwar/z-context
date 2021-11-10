/**
 * Creates the z-index sidebar pane
 */
chrome.devtools.panels.elements.createSidebarPane(
	"Z-Index",
	function ( sidebar ) {
		const port = chrome.runtime.connect( { name: "Z-Context" } );
		// Listen for messages sent from background.js.
		port.onMessage.addListener( function ( msg ) {
			switch ( msg.type ) {
				case 'Z_CONTEXT_REGISTER_FRAME': {
					// Each frame should listen to onSelectionChanged events.
					chrome.devtools.panels.elements.onSelectionChanged.addListener(
						() => {
							chrome.devtools.inspectedWindow.eval( "setSelectedElement($0)", {
								useContentScriptContext: true,
								frameURL: msg.url
							} );
						}
					);
					// Populate initial opening.
					chrome.devtools.inspectedWindow.eval( "setSelectedElement($0)", {
						useContentScriptContext: true,
						frameURL: msg.url
					} );
					break;
				}
				case 'Z_CONTEXT_UPDATE_SIDEBAR': {
					sidebar.setObject( msg.sidebar );
					break;
				}
			}
		} );
		// Announce to content-scripts.js that they should register with their frame urls.
		port.postMessage( { type: 'Z_CONTEXT_SIDEBAR_INIT' } );
	}
);
