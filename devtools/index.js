function zContext() {
	var props = {},
		//Also see: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
		getClosestStackingContext = function( nodeOrObject ) {
			var node = nodeOrObject.node || nodeOrObject;
			if( ! node || node.nodeName === 'HTML' ) {
				return { node: document.documentElement, reason: 'root' };
			}
			var computedStyle = getComputedStyle( node );
			if ( computedStyle.position === 'fixed' ) {
				return { node: node, reason: 'position: fixed' };
			} else if ( computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static' ) {
				return { node: node, reason: 'position: static; z-index: ' + computedStyle.zIndex };
			} else if ( computedStyle.opacity !== '1' ) {
				return { node: node, reason: 'opacity: ' + computedStyle.opacity };
			} else if ( computedStyle.transform !== 'none' ) {
				return { node: node, reason: 'transform: ' + computedStyle.transform };
			} else if ( computedStyle.mixBlendMode !== 'normal' ) {
				return { node: node, reason: 'mixBlendMode: ' + computedStyle.mixBlendMode };
			} else if ( computedStyle.filter !== 'none' ) {
				return { node: node, reason: 'filter: ' + computedStyle.filter };
			} else if ( computedStyle.isolation === 'isolate' ) {
				return { node: node, reason: 'isolation: ' + computedStyle.isolation };
			} else if ( computedStyle.webkitOverflowScrolling === 'touch' ) {
				return { node: node, reason: '-webkit-overflow-scrolling: touch' };
			} else {
				return getClosestStackingContext( { node: node.parentNode, reason: 'not a stacking context' } );
			}
		},
		shallowCopy = function( data ) {
			var props = Object.getOwnPropertyNames( data );
			var copy = { __proto__: null };
			for( var i = 0; i < props.length; ++i ) {
				copy[ props[ i ] ] = data[ props[ i ] ];
			}
			return copy;
		},
		generateSelector = function( element ) {
			var selector, tag = element.nodeName.toLowerCase();
			if( element.id ) {
				selector = '#' + element.getAttribute( 'id' );
			} else if( element.className ) {
				selector = '.' + element.getAttribute( 'class' ).split( ' ' ).join( '.' );
			}
			return selector ? tag + selector : tag;
		};
	if( $0 && $0.nodeType === 1 ) {
		var closest = getClosestStackingContext( $0 );
		var createsStackingContext = $0 === closest.node;
		var reason = createsStackingContext ? closest.reason : 'not a stacking context';
		var parentContext = closest.node;
		var computedStyle = getComputedStyle( $0 );
		if ( createsStackingContext && $0.nodeName !== 'HTML' ) {
			parentContext = getClosestStackingContext( $0.parentNode ).node;
		}
		props = {
			current: generateSelector( $0 ),
			createsStackingContext: createsStackingContext,
			createsStackingContextReason: reason,
			parentStackingContext: generateSelector( parentContext ),
			'z-index': computedStyle.zIndex !== 'auto' ? parseInt( computedStyle.zIndex, 10 ) : computedStyle.zIndex
		};
	}
	return shallowCopy( props );
}

chrome.devtools.panels.elements.createSidebarPane(
	"Z-Index",
	function( sidebar ) {
		function updateElementProperties() {
			sidebar.setExpression("(" + zContext.toString() + ")()"); //eval ¯\_(ツ)_/¯
		}
		updateElementProperties();
		chrome.devtools.panels.elements.onSelectionChanged
			.addListener( updateElementProperties );
} );