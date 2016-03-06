# Z-Context

Z-Context is a Chrome DevTools Extension that displays stacking contexts and z-index values in the elements panel.

## Why use it? 

Browsers support a hierarchy of stacking contexts, rather than a single global one. This means that
z-index values are often used incorrectly, and arbitrarily high values get set. To learn more read 
[Mozilla's guide on z-indexes](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index)
or the [w3c spec](https://www.w3.org/TR/CSS2/zindex.html).

By Using Z-Context, you'll know:

* If the current element creates a stacking context, and why
* What it's parent stacking context is
* The z-index value

## Install
Visit https://chrome.google.com/webstore/detail/jigamimbjojkdgnlldajknogfgncplbh and add the extension to Chrome.

## See it in action:

![z-context](https://cldup.com/Fewy720tfj.gif)
