function zContext() {
	let props = {};
	//Also see: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
	const getClosestStackingContext = function( nodeOrObject ) {
		const node = nodeOrObject.node || nodeOrObject;

		// the root element (HTML).
		if( ! node || node.nodeName === 'HTML') {
			return { node: document.documentElement, reason: 'root' };
		}

		// handle shadow root elements.
		if ( node.nodeName === '#document-fragment' ) {
			return getClosestStackingContext( { node: node.host, reason: 'not a stacking context' } );
		}

		const computedStyle = getComputedStyle( node );

		// position: fixed or sticky.
		if ( computedStyle.position === 'fixed' || computedStyle.position === 'sticky' ) {
			return { node: node, reason: `position: ${ computedStyle.position }` };
		}

		// positioned (absolutely or relatively) with a z-index value other than "auto".
		if ( computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static' ) {
			return { node: node, reason: `position: ${ computedStyle.position }; z-index: ${ computedStyle.zIndex }` };
		}

		// elements with an opacity value less than 1.
		if ( computedStyle.opacity !== '1' ) {
			return { node: node, reason: `opacity: ${ computedStyle.opacity }` };
		}

		// elements with a transform value other than "none".
		if ( computedStyle.transform !== 'none' ) {
			return { node: node, reason: `transform: ${ computedStyle.transform }` };
		}

		// elements with a mix-blend-mode value other than "normal".
		if ( computedStyle.mixBlendMode !== 'normal' ) {
			return { node: node, reason: `mixBlendMode: ${ computedStyle.mixBlendMode }` };
		}

		// elements with a filter value other than "none".
		if ( computedStyle.filter !== 'none' ) {
			return { node: node, reason: `filter: ${ computedStyle.filter }` };
		}

		// elements with a perspective value other than "none".
		if ( computedStyle.perspective !== 'none' ) {
			return { node: node, reason: `perspective: ${ computedStyle.perspective }` };
		}

		// elements with a clip-path value other than "none".
		if ( computedStyle.clipPath !== 'none' ) {
			return { node: node, reason: `clip-path: ${ computedStyle.clipPath } ` };
		}

		// elements with a mask value other than "none".
		const mask = computedStyle.mask || computedStyle.webkitMask;
		if ( mask !== 'none' && mask !== undefined ) {
			return { node: node, reason: `mask:  ${ mask }` };
		}

		// elements with a mask-image value other than "none".
		const maskImage = computedStyle.maskImage || computedStyle.webkitMaskImage;
		if ( maskImage !== 'none' && maskImage !== undefined ) {
			return { node: node, reason: `mask-image: ${ maskImage }` };
		}

		// elements with a mask-border value other than "none".
		const maskBorder = computedStyle.maskBorder || computedStyle.webkitMaskBorder;
		if ( maskBorder !== 'none' && maskBorder !== undefined ) {
			return { node: node, reason: `mask-border: ${ maskBorder }` };
		}

		// elements with isolation set to "isolate".
		if ( computedStyle.isolation === 'isolate' ) {
			return { node: node, reason: `isolation: ${ computedStyle.isolation }` };
		}

		// transform or opacity in will-change even if you don't specify values for these attributes directly.
		if( computedStyle.willChange === 'transform' || computedStyle.willChange === 'opacity' ) {
			return { node: node, reason: `willChange: ${ computedStyle.willChange }` };
		}

		// elements with -webkit-overflow-scrolling set to "touch".
		if ( computedStyle.webkitOverflowScrolling === 'touch' ) {
			return { node: node, reason: '-webkit-overflow-scrolling: touch' };
		}

		// an item with a z-index value other than "auto".
		if ( computedStyle.zIndex !== 'auto' ) {
			const parentStyle = getComputedStyle( node.parentNode );
			// with a flex|inline-flex parent.
			if ( parentStyle.display === 'flex' || parentStyle.display === 'inline-flex' ) {
				return {
					node: node,
					reason: `flex-item; z-index: ${ computedStyle.zIndex }`,
				};
			// with a grid parent.
			} else if ( parentStyle.grid !== 'none / none / none / row / auto / auto' ) {
				return {
					node: node,
					reason: `child of grid container; z-index: ${ computedStyle.zIndex }`,
				};
			}
		}

		// contain with a value of layout, or paint, or a composite value that includes either of them
		const contain = computedStyle.contain;
		if ( [ 'layout', 'paint', 'strict', 'content' ].indexOf( contain ) > -1 ||
			contain.indexOf( 'paint' ) > -1 ||
			contain.indexOf( 'layout' ) > -1
		) {
			return {
				node: node,
				reason: `contain: ${ contain }`,
			};
		}

		return getClosestStackingContext( { node: node.parentNode, reason: 'not a stacking context' } );
		};
	const shallowCopy = function( data ) {
		const props = Object.getOwnPropertyNames( data );
		const copy = { __proto__: null };
		for( let i = 0; i < props.length; ++i ) {
			copy[ props[ i ] ] = data[ props[ i ] ];
		}
		return copy;
	}
	const generateSelector = function( element ) {
		let selector, tag = element.nodeName.toLowerCase();
		if( element.id ) {
			selector = '#' + element.getAttribute( 'id' );
		} else if( element.getAttribute( 'class' ) ) {
			selector = '.' + element.getAttribute( 'class' ).split( ' ' ).join( '.' );
		}
		return selector ? tag + selector : tag;
	};
	if( $0 && $0.nodeType === 1 ) {
		const closest = getClosestStackingContext( $0 );
		const createsStackingContext = $0 === closest.node;
		const reason = createsStackingContext ? closest.reason : 'not a stacking context';
		let parentContext = closest.node;
		const computedStyle = getComputedStyle( $0 );
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