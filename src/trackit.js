/* --------------------------------------------------------
TrackIt.js

The purpose of this library is to track elements' position
inside DOM upon scrolling, with respect to the container's
viewport. Also, callbacks can be invoked on certain events
when the element enters or leaves the viewport of the
container and/or reaches middle of it, through various
directions.

version: 0.1.0
last modified: 31/Aug/2016 by Abhinav Dabral
author: Abhinav Dabral (@abhinavdabral)
email: dabral.abhinav@gmail.com
website: http://www.abhinavdabral.com
license : MIT
----------------------------------------------------------*/

/* TODO

0. Logic to check container is added but currently we're just tracking elements right off the 'window'. It should be able to be called from any container.
-- Possibly we can just add another properly to object stored in _elements where we can keep the container element's reference.
1. Ability to call the callback single or multiple times.
2. If the element is animating then it should be upto programmer whether to track it or not.
3. Need to add offset property based on which the events shall be fired. (probably add some tolerance property as well)
4. Related to #1, Check for viewport. If the element has entered viewport once, and not left, then no need to trigger any call backs until it has left the viewport and entered back again.

5. Rename Actions functions as *Action

Later. Remove duplicate code, compress without recuding readability.


From Viewport to {top, bottom, left, right} -> ExitViewport
To Viewport from {top, bottom, left, right} -> EnterViewport
From Middle to {top, bottom, left, right}   -> ExitMiddle
To Middle from {top, bottom, left, right}   -> EnterMiddle

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

                if(options.enterTop)
                    _elements[index].enterTop = options.enterTop;
                if(options.enterBottom)
                    _elements[index].enterBottom = options.enterBottom;
                if(options.enterLeft)
                    _elements[index].enterLeft = options.enterLeft;
                if(options.enterRight)
                    _elements[index].enterRight = options.enterRight;
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
                    topEdgeFromTop:         e.top,                      // Distance of the top edge of the element from the top of the viewport.
                    rightEdgeFromRight:     rightEdgeFromRight,
                    bottomEdgeFromBottom:   bottomEdgeFromBottom,                                                          
                    leftEdgeFromLeft:       e.left,                     // Distance of the left edge of the element from the left of the viewport.

                    topEdgeFromBottom:      topEdgeFromBottom,
                    rightEdgeFromLeft:      e.right,                    // Distance of the right edge of the element from the left of the viewport.
                    bottomEdgeFromTop:      e.bottom,                   // Distance of the bottom edge of the element from the top of the viewport.
                    leftEdgeFromRight:      leftEdgeFromRight,

                    middleX:                rightEdgeFromRight-e.left,  // X (horizontal) distance of the 'center' of the element from the 'center' of the viewport.
                    middleY:                bottomEdgeFromBottom-e.top, // Y (vertical) distance of the 'middle' of the element from the 'middle' of the viewport.

                    width:                  e.width,                    // Element's width
                    height:                 e.height                    // Element's height
                };

                // If the element has current and last values, then check for events.
                if(element.current && element.last){                    
                    
                    // Checking any callbacks attached to certain events and calling if those events are fired.

                    // Checking if the element is in Viewport, if so, only then check for certain events.
                    if(_isInViewport(element)){

                        if(element.enterTop)
                         _enterTop(element.trackingId, element.enterTop);

                        if(element.enterBottom)
                            _enterBottom(element.trackingId, element.enterBottom);

                        if(element.enterLeft)
                            _enterLeft(element.trackingId, element.enterLeft);

                        if(element.enterRight)
                            _enterRight(element.trackingId, element.enterRight);
                    }

                    if(element.log)
                        _log(element.trackingId, element.log);
                } 
            },null);
        }

        function _isInViewport(element){
            if(
                ((element.current.topEdgeFromBottom<=0) && (element.current.bottomEdgeFromBottom<=0)) ||
                ((element.current.bottomEdgeFromTop<=0) && (element.current.topEdgeFromTop<=0)) ||
                ((element.current.rightEdgeFromRight<=0) && (element.current.leftEdgeFromRight<=0)) ||
                ((element.current.rightEdgeFromLeft<=0) && (element.current.leftEdgeFromLeft<=0))
            )
            return false;
            else return true;
        }
        /*
        function _enterTop(trackingId, callback){
            var e = _elements[trackingId];
            var curr = e.current;
            var last = e.last;
            if((curr.bottomEdgeFromTop>0)&&(curr.topEdgeFromBottom>0))
                if(curr.bottomEdgeFromTop>last.bottomEdgeFromTop)
                    callback();
        }

        function _enterBottom(trackingId, callback){
            var e = _elements[trackingId];
            var curr = e.current;
            var last = e.last;
            if((curr.topEdgeFromBottom>0)&&(curr.bottomEdgeFromTop>0))
                if(curr.topEdgeFromBottom>last.topEdgeFromBottom)
                    callback();
        }

        function _enterLeft(trackingId, callback){
            var e = _elements[trackingId];
            var curr = e.current;
            var last = e.last;
            if((curr.rightEdgeFromLeft>0)&&(curr.leftEdgeFromRight>0))
                if(curr.rightEdgeFromLeft>last.rightEdgeFromLeft)
                    callback();
        }

        function _enterRight(trackingId, callback){
            var e = _elements[trackingId];
            var curr = e.current;
            var last = e.last;
            if((curr.leftEdgeFromRight>0)&&(curr.rightEdgeFromLeft>0))
                if(curr.leftEdgeFromRight>last.leftEdgeFromRight)
                    callback();
        }
        */

        function _log(trackingId, callback){
            callback(JSON.stringify(_elements[trackingId].current).split(",").join("<br>"));
        }

        return {
            track : _track,
            untrack : _untrack,
            log : _log
        }
    }

    global.Trackit = trackit();
})(window);