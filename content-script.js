/**
 * Given a node element, generates a hopefully human-identifiable CSS selector.
 * @param {HTMLElement} element
 * @returns {string} CSS Selector
 */
function generateSelector( element ) {
	let selector, tag = element.nodeName.toLowerCase();
	if ( element.id ) {
		selector = '#' + element.getAttribute( 'id' );
	} else if ( element.getAttribute( 'class' ) ) {
		selector = '.' + element.getAttribute( 'class' ).split( ' ' ).join( '.' );
	}
	return selector ? tag + selector : tag;
}

/**
 * @typedef {Object} StackingContext
 *
 * @property {Element} node          A DOM Element
 * @property {string}  reason        Reason for why a stacking context was created
 */

/**
 * Recursive function that finds the closest parent stacking context.
 * See also https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
 *
 * @param {Element} node
 * @returns {StackingContext} The closest parent stacking context
 */
const getClosestStackingContext = function ( node ) {
	// the root element (HTML).
	if ( ! node || node.nodeName === 'HTML' ) {
		return { node: document.documentElement, reason: 'root' };
	}

	// handle shadow root elements.
	if ( node.nodeName === '#document-fragment' ) {
		return getClosestStackingContext( node.host );
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
	if ( computedStyle.willChange === 'transform' || computedStyle.willChange === 'opacity' ) {
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

	return getClosestStackingContext( node.parentNode );
};

/**
 * @typedef {Object} ZContextSidebarContents
 *
 * @property {boolean} [createsStackingContext]        True if element creates a stacking context.
 * @property {string}  [createsStackingContextReason]  Reason for why a stacking context is created.
 * @property {string}  [parentStackingContext]         Human readable CSS selector of the parent stacking context.
 * @property {number}  [z-index]                       The current z-index value
 */

/**
 * @typedef {Object} ZContextUpdateSidebarAction
 *
 * @property {string}                  type     The action name
 * @property {ZContextSidebarContents} sidebar  Contents to update the z-index pane with
 */

/**
 * Given an element, looks up the related z-index and stacking context information and returns a ZContextUpdateSidebarAction
 *
 * @param {Element} element
 * @returns {ZContextUpdateSidebarAction}
 */
function zContext( element ) {
	if ( ! element || element.nodeType !== 1 ) {
		return { type: 'Z_CONTEXT_UPDATE_SIDEBAR', sidebar: {} };
	}
	if ( element && element.nodeType === 1 ) {
		const closest = getClosestStackingContext( element );
		const createsStackingContext = element === closest.node;
		const reason = createsStackingContext ? closest.reason : 'not a stacking context';
		let parentContext = closest.node;
		const computedStyle = getComputedStyle( element );
		if ( createsStackingContext && element.nodeName !== 'HTML' ) {
			parentContext = getClosestStackingContext( $0.parentNode ).node;
		}
		return {
			type: 'Z_CONTEXT_UPDATE_SIDEBAR',
			sidebar: {
				createsStackingContext,
				createsStackingContextReason: reason,
				parentStackingContext: generateSelector( parentContext ),
				currentNode: generateSelector( element ),
				'z-index': computedStyle.zIndex !== 'auto' ? parseInt( computedStyle.zIndex, 10 ) : computedStyle.zIndex
			},
		};
	}
}

/**
 * Stores the last selected element $0 in this frame.
 */
let _lastElement;

/**
 * Invoked by the devtools panel when a new element is selected. This function sends a new message to update the
 * z-index pane with the z-index stacking context information if we detect that an element has been selected
 * in this frame.
 *
 * @param {node} element
 * @returns void
 */
function setSelectedElement( element ) {
	// If the selected element is the same, let handlers in other iframe contexts handle it instead.
	if ( element !== undefined && element !== _lastElement ) {
		_lastElement = element;
		chrome.runtime.sendMessage( zContext( element ) );
	}
}

/**
 * Listen for the z-index devtools panel to be created, before registering the frame.
 */
chrome.runtime.onMessage.addListener( function ( message ) {
	if ( message.type === 'Z_CONTEXT_SIDEBAR_INIT' ) {
		chrome.runtime.sendMessage( { type: 'Z_CONTEXT_REGISTER_FRAME', url: window.location.href } );
	}
} );

/**
 * Reconnect to the z-index devtools panel when we navigate to another page
 */
function addLocationObserver(callback) {
	const config = { attributes: false, childList: true, subtree: false }
	const observer = new MutationObserver(callback)
	observer.observe(document.body, config)
}
const reregisterOnNavigation = () => {
	chrome.runtime.sendMessage( { type: 'Z_CONTEXT_NAVIGATION' } );
}
addLocationObserver(reregisterOnNavigation)
