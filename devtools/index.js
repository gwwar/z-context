chrome.devtools.panels.elements.createSidebarPane(
	"Z-Index",
	function( sidebar ) {
		const port = chrome.extension.connect({ name: "Z-Context" });
		// announce to content scripts that they should callback with their frame urls
		port.postMessage( 'SIDEBAR_INIT' );
		port.onMessage.addListener(function ( msg) {
			if ( msg.iframe ) {
				// register with the correct frame url
				chrome.devtools.panels.elements.onSelectionChanged.addListener(
					() => {
						chrome.devtools.inspectedWindow.eval("setSelectedElement($0)", { useContentScriptContext: true, frameURL: msg.iframe } );
					}
				);
			} else {
				// otherwise assume other messages from content scripts should update the sidebar
				sidebar.setObject( msg );
			}
		} );
	}
);