/* --------------------------------------------------------
TrackIt.js

The purpose of this library is to track elements' position
inside DOM upon scrolling (and resizing), with respect to
the container's viewport. Also, callbacks can be invoked
on certain events when the element enters or leaves the
viewport of the container and/or reaches middle* of it,
through various directions.

Version: 0.1.0
Last modified: 31/Aug/2016 by Abhinav Dabral
Author: Abhinav Dabral (@abhinavdabral)
Email: abhinavdabral@live.com
Website: https://github.com/abhinavdabral/trackit
License : MIT
----------------------------------------------------------*/

/* TODO

0. Logic to check container is added but currently we're just tracking elements right off the 'window'. It should be able to be called from any container.
-- Possibly we can just add another properly to object stored in _elements where we can keep the container element's reference.
1. Ability to call the callback single or multiple times. (Currently it gets called single time upon every action, but doesn't repeats itself consequently)
2. If the element is animating then it should be upto programmer whether to track it or not.
3. Need to add offset property based on which the events shall be fired. (probably add some tolerance property as well).
4. Need to work on Middle ones (enter/exit in 4 directions from Middle).

*/

(function(global){
    var _trackingAttribute = "tracking";    // Attribute that will be applied/removed from the elements that are being tracked
    function trackit(){

        var _nextTrackingId=0;      // Just a Index counter. It increments if there are no empty spaces in _availableIndexes and a new index value has to be occupied.
        var _elements=[];           // To store elements that are being tracked.
        var _availableIndexes=[];   // To store empty indexes of _elements, upon removal, for reuse.

        if(window.addEventListener){                                // If addEventListener is supported by the browser (i.e. by all modern browsers)
            window.addEventListener("scroll",_scrollHandler,false); // Attach scrollHandler using that.
            window.addEventListener("resize",_resizeHandler,false);
        }
        else if(window.attachEvent){                                // Otherwise, check if it supports attachEvent (which is in case of old IE)
            window.attachEvent("onscroll",_scrollHandler);          // then just attach scrollHandler using that
            window.attachEvent("onresize",_resizeHandler);
        }
        else return undefined;                                      // If neither is supported and aliens are accessing your page, then this simply won't work.

        var _track = function _track(element, options){             // To start tracking an element.
            
            // Futureproofing, in case when you need to modify options of particular element (Add or remove certain callbacks and such)
            if(typeof element === "number")
                if(_elements[element])
                    element = _elements[element];
                else
                    return -1;
            
            
            if(!element.getAttribute(_trackingAttribute)){          // But only if the element is not already being tracked (i.e. if it has the attribute, it's being tracked)
                var index = _nextTrackingId;                        // Index that we use on _elements to store that new element we want to track. (Read above about _nextTrackingId)

                if(_availableIndexes.length)                // If there is any available blankspace in the _elements array
                    index = _availableIndexes.shift();      // Use it
                else                                        // Otherwise,
                    _nextTrackingId++;                      // Just use a new one.
                
                element.setAttribute(_trackingAttribute, index);    // Setting element's attribute to the Tracking Index of that element in the _elements array.
                _elements[index]={                                  // Adding element to the _elements array
                    trackingId: index,                              // with it's tracking ID
                    element: element,                               // and the element itself
                };
            }

            // Also, if the element has an event callback, we put that along with it's object it in the _elements array.

            if(options.inActions)   _elements[index].inActions = options.inActions;
            if(options.outActions)  _elements[index].outActions = options.outActions;

            // Just a log callback
            if(options.log)
                _elements[index].log = options.log;

            return index;   // And finally return the Index, or Tracking ID of that element (so it can be removed later, or modified and such)
            
        }

        function _untrack(element){                                     // The function to stop tracking an element.
            if(element.getAttribute(_trackingAttribute)){               // See if the element is having the _trackingAttribute
                var index = element.getAttribute(_trackingAttribute);   // if so, get the value, which contains it's trackingID
                _elements[index]=null;                                  // and use that index to remove that element. NOT using splice, because I don't want to disrupt the indexes of that array.  
                _availableIndexes.push(index);                          // Making that index available to the next object that comes along next (to be tracked).                
                element.removeAttribute(_trackingAttribute);            // Finally, removing _trackingAttribute from that element in the DOM.
            }
        }

        function _resizeHandler(){
            if (_elements.length<=0) return;    // if there are no elements to be tracked, just return back.
            _scrollHandler(true);               // calling _scrollHandler
        }

        function _scrollHandler(resize){                              // To update elements' values upon scrolling (this is event handler attached to scolling event)
            
            if (_elements.length<=0) return;    // if there are no elements to be tracked, just return back.
    
            var wH = window.innerHeight;
            var wW = window.innerWidth;

            var containerHeight = wH;   // by default use window's height
            var containerWidth = wW;    // by default use window's width

            // If container is window then get it's Height and Width otherwise if it's a DOM element,
            // then check if it's height and width is within window's bounds, if so then use it.

            if(global!==window){
                var gb = global.getBoundingClientRect();
                if( (gb.height < wH ) && ( gb.width < wW ) ){
                    containerHeight = gb.height;
                    containerWidth = gb.width;
                }
            }

            if(!(containerHeight && containerWidth)) return;    // If the container is hidden or for some reason have height and width smaller than 0, or any falsy value, just return;

            _elements.reduce(function(undefined, element){              // Iterating through all _elements that are being tracked

                if(resize && (element.resize === false)) return;        // if _scrollHandler is called upon Resize, then check if element doesn't have to be tracked on resize.

                if(element.current)                                             // If there are any values inside element.current (which is supposed to store the current values, duh!)
                    element.last=JSON.parse(JSON.stringify(element.current));   // then back the up and call it element.last. Making a copy of it, instead of a reference.
                
                var e = element.element.getBoundingClientRect();        // Now getting new fresh values to be stored.

                var bottomEdgeFromBottom = containerHeight - (e.top+e.height);   // Distance of the bottom edge of the element from the bottom of the viewport.
                var rightEdgeFromRight = containerWidth - (e.left+e.width);      // Distance of the right edge of the element from the right of the viewport.
                var topEdgeFromBottom = bottomEdgeFromBottom + e.height;            // Distance of the top edge of the element from the bottom of the viewport.
                var leftEdgeFromRight = rightEdgeFromRight + e.width;               // Distance of the left edge of the element from the right of the viewport.

                element.current ={
                    topTop:     e.top,                      // Distance of the top edge of the element from the top of the viewport.
                    rightRight: rightEdgeFromRight,
                    botBot:     bottomEdgeFromBottom,                                                          
                    leftLeft:   e.left,                     // Distance of the left edge of the element from the left of the viewport.

                    topBot:     topEdgeFromBottom,
                    rightLeft:  e.right,                    // Distance of the right edge of the element from the left of the viewport.
                    botTop:     e.bottom,                   // Distance of the bottom edge of the element from the top of the viewport.
                    leftRight:  leftEdgeFromRight,

                    middleX:    rightEdgeFromRight-e.left,  // X (horizontal) distance of the 'center' of the element from the 'center' of the viewport.
                    middleY:    bottomEdgeFromBottom-e.top, // Y (vertical) distance of the 'middle' of the element from the 'middle' of the viewport.

                    width:      e.width,                    // Element's width
                    height:     e.height                    // Element's height
                };

                if(element.current.viewport)                            // If element has some old "current" viewport value stored in it
                    element.last.viewport = +element.current.viewport;  // Back it up into "last"
                element.current.viewport = _getViewport(element);       // And then update the "current" to the actual current value.

                // If the element has current and last values, then check for events.
                if(element.current && element.last){                    
                    
                    // Checking if the element is in Viewport, if so, only then check for certain events.                    
                    if(!(element.current.viewport === 0 && element.last.viewport===0))
                        // If element neither is, nor it was outside the viewport completely, only then it can leave the viewport.
                        if(element.outActions)
                            _exitViewport(element);    
                    if(!(element.current.viewport === 1 && element.last.viewport===1))
                        // If element neither is, nor it was inside the viewport completely, only then it can enter the viewport.
                        if(element.inActions)
                            _enterViewport(element);
                }

                if(element.log)
                        _log(element.trackingId, element.log);  

            },null);
        }

        function _getViewport(element){
            if(
                (element.current.topTop > 0) && (element.current.botBot > 0) &&
                (element.current.leftLeft > 0) && (element.current.rightRight > 0)
            )
                return 1;   // Completely inside
            else if (
                (element.current.botTop < 0) || (element.current.topBot < 0) ||
                (element.current.leftRight < 0) || (element.current.rightLeft < 0)
            )
                return 0;   // Completely outside
            else
                return -1;  // Partially inside
        }

        function _isInMiddle(element, callback){
            if( _isInMiddleX(element) || _isInMiddleY(element) ){
                if(typeof callback==="function")
                    callback();
                return true;
            }
            else return false;
        }

        function _isInMiddleX(element, callback){
            var tX = element.tX || 20;
            if((element.current.middleX>(0-tX)) && (element.current.middleX<(0+tX))){
                if(typeof callback==="function")
                    callback();
                return true;
            }
            else return false;
        }

        function _isInMiddleY(element, callback){
            var tY = element.tX || 20;
            if((element.current.middleY>(0-tY)) && (element.current.middleY<(0+tY))){
                if(typeof callback==="function")
                    callback();
                return true;
            }
            else return false;
        }

        function _enterViewport(element){

            var curr = element.current;
            var last = element.last;

            // Putting all the conditional statements here.
            var enteringTop     = ( (element.inActions.top) && (curr.botTop > last.botTop) && (curr.botTop > 0) && (curr.topBot>0) );
            var enteringBottom  = ( (element.inActions.bottom) && (curr.topBot > last.topBot) && (curr.topBot > 0) && (curr.botTop>0) );
            var enteringLeft    = ( (element.inActions.left) && (curr.rightLeft > last.rightLeft) && (curr.rightLeft > 0) && (curr.leftRight >0) );
            var enteringRight   = ( (element.inActions.right) && (curr.leftRight > last.leftRight) && (curr.leftRight > 0) && (curr.rightLeft > 0) );

            var entering = function(){
                if(enteringTop && (curr.topTop < 0) )
                    _call(element.inActions.top.onStart);

                if(enteringBottom && (curr.botBot < 0) )
                    _call(element.inActions.bottom.onStart);

                if(enteringLeft && (curr.leftLeft < 0) )
                    _call(element.inActions.left.onStart);

                if(enteringRight && (curr.rightRight < 0) )
                    _call(element.inActions.right.onStart);
            }

            if(element.current.viewport === -1 && element.last.viewport!==-1) // Entering
            {
                entering();
            }

            if(element.current.viewport === 1 && element.last.viewport!==1) // Entered
            {
                if(element.last.viewport === 0)
                {
                    // This shall be called in such cases when the scrolling is so fast that it completely skips "Entering" phase,
                    // so we have to induce it ourself, just to be sure that flow doesn't breaks.
                    // It's still not perfect, as at times it still skips it, but better than before.
                    entering();
                }

                if(enteringTop){
                    _call(element.inActions.top.onComplete);    // Entered
                    _call(element.inActions.top);               // Just in case when onStart and onComplete are not definited seperately.
                }
                if(enteringBottom){
                    _call(element.inActions.bottom.onComplete);  
                    _call(element.inActions.bottomtop);          
                }
                if(enteringLeft){
                    _call(element.inActions.left.onComplete);    
                    _call(element.inActions.left);               
                }
                if(enteringRight){
                    _call(element.inActions.right.onComplete);   
                    _call(element.inActions.right);              
                }
            }
        }

        function _exitViewport(element){

            var curr = element.current;
            var last = element.last;

            // Putting all the conditional statements here.
            var exitingTop      = ( (element.outActions.top) && (curr.botTop < last.botTop) && (curr.topTop < 0) );
            var exitingBottom   = ( (element.outActions.bottom) && (curr.topBot < last.topBot) && (curr.botBot < 0) );
            var exitingLeft     = ( (element.outActions.left) && (curr.rightLeft < last.rightLeft) && (curr.leftLeft < 0) );
            var exitingRight    = ( (element.outActions.right) && (curr.leftRight < last.leftRight) && (curr.rightRight < 0) );

            var leaving = function(){
                if(exitingTop)
                    _call(element.outActions.top.onStart);
                if(exitingBottom)
                    _call(element.outActions.bottom.onStart);
                if(exitingLeft)
                    _call(element.outActions.left.onStart);
                if(exitingRight)
                    _call(element.outActions.right.onStart);
            }

            if(element.current.viewport === -1 && element.last.viewport!==-1) // Leaving
            {
                leaving();
            }

            if(element.current.viewport === 0 && element.last.viewport!==0) // Left
            {
                if(element.last.viewport === 0){

                    // This shall be called in such cases when the scrolling is so fast that it completely skips "Entering" phase,
                    // so we have to induce it ourself, just to be sure that flow doesn't breaks.
                    // It's still not perfect, as at times it still skips it, but better than before.
                    leaving();
                }

                if(exitingTop){
                    _call(element.outActions.top.onComplete);    // Left
                    _call(element.outActions.top);               // Just in case when onStart and onComplete are not definited seperately.
                }
                if(exitingBottom){
                    _call(element.outActions.bottom.onComplete);    
                    _call(element.outActions.bottomtop);            
                }
                if(exitingLeft){
                    _call(element.outActions.left.onComplete);   
                    _call(element.outActions.left);              
                }
                if(exitingRight){
                    _call(element.outActions.right.onComplete); 
                    _call(element.outActions.right);            
                }
            }
        }

        // Just a log function, primarily for debugging purposes for now. MAY get modified or removed in future.
        function _log(trackingId, callback){
            callback(JSON.stringify(_elements[trackingId].current).split(",").join("<br>"));
        }

        // A Calling function. Why? Because I am too lazy to check for all callbacks. So I just call them through this one
        // and it checks if the callbacks are function, before calling them.
        function _call(fn){
            if(typeof fn === "function")
                fn();
        }

        return {
            track : _track,
            untrack : _untrack,
            log : _log
        }
    }

    //  Exporting the Library to "global"
    global.Trackit = trackit();
})(window);