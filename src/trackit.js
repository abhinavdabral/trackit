/* --------------------------------------------------------
TrackIt.js

The purpose of this library is to track elements' position
inside DOM upon scrolling (and resizing), with respect to
the container's viewport. Also, callbacks can be invoked
on certain events when the element enters or leaves the
viewport of the container and/or reaches middle* of it,
through various directions.

Version: 0.2.0
Last modified: 05/Aug/2016 by Abhinav Dabral
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
    var _trackingAttribute = "data-trackit-id";                     // Attribute that will be applied/removed from the elements that are being tracked
    var _trackingContainerAttribute = "data-trackit-container";     // Attribute that will be applied
    var _edgesX = ["rightLeft", "leftRight", "leftLeft", "rightRight"];
    var _edgesY = ["botTop", "topBot", "topTop", "botBot"];
    var _directions =   {   X : ["left", "right"],
                            Y : ["top", "bottom"] };
    var _axes = ["X", "Y"];

    function trackit(){

        var _elements           = [];    // To store elements that are being tracked.
        var _availableIndexes   = [];    // To store empty indexes of _elements, upon removal, for reuse.
        var _windowEvents       = false;    // To store window Events (to prevent multiple events)
        var _containerEvents    = [];    // To store container Events;

        function _addEventListener(event, container){
            if(window.addEventListener){
                container.addEventListener(event,_scrollHandler,false);
            }
            else if(window.attachEvent){
                container.attachEvent("on"+event,_scrollHandler); 
            }
        }
        
        function _addTrackingEvents(element, container){
            if(container){
                if(!container.getAttribute(_trackingContainerAttribute)){
                    _addEventListener("scroll", container);
                    _addEventListener("resize", container);
                    container.setAttribute(_trackingContainerAttribute,containerEvents.push(container)-1);                    
                }
            }
            else if(!_windowEvents){
                _addEventListener("scroll", document);
                _addEventListener("resize", window);
                _windowEvents = true;
            }            
        }
        
        function _track(element, options){             // To start tracking an element.

            var index = -1;                                 // ret : Index or TrackingId of the element that will be added for tracking.

            if(options.container)
                if(options.container.nodeType!=1)
                    throw Error("Container is not a valid DOM element.");

            if(element.nodeType!=1)
                throw Error("Element is not a valid DOM element.");

            _addTrackingEvents(element, options.container);
                        
            if(!element.getAttribute(_trackingAttribute)){          // But only if the element is not already being tracked (i.e. if it has the attribute, it's being tracked)
                var tempObject={                                  // element to be added to the _elements array
                        element: element                               // and the element itself
                    };

                if(_availableIndexes.length)                // If there is any available blankspace in the _elements array
                    index = _availableIndexes.shift();      // Use it.
                
                if(index==-1){
                    index = _elements.push(tempObject);
                    // because in this case, returned index is length.
                    // And we need to turn it into index.
                    index--;    
                }
                else
                    _elements[index] = tempObject;

                if(options.container)
                    tempObject.container = container;

                tempObject.trackingId = index;                     // Adding property to store trackingId (and since its reference is inside _elements, we don't need to do much else about it)
                element.setAttribute(_trackingAttribute, index);    // Setting element's attribute to the Tracking Index of that element in the _elements array.
            }

            // Link all the callbacks

            if(options.inActions)   _elements[index].inActions = options.inActions;
            if(options.outActions)  _elements[index].outActions = options.outActions;

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
            if (!_elements.length) return;    // if there are no elements to be tracked, just return back.
            _scrollHandler(true);               // calling _scrollHandler
        }

        function _scrollHandler(resize){ 
            var startTimer = performance.now(); //  Checking performance

            if (!_elements.length) return;    // if there are no elements to be tracked, just return back.
    
            var wH = window.innerHeight;
            var wW = window.innerWidth;

            _elements.reduce(function(undefined, element){              // Iterating through all _elements that are being tracked

                if(resize && (element.resize === false)) return;        // if _scrollHandler is called upon Resize, then check if element doesn't have to be tracked on resize.

                if(element.current)                                             // If there are any values inside element.current (which is supposed to store the current values, duh!)
                    element.last=JSON.parse(JSON.stringify(element.current));   // then back the up and call it element.last. Making a copy of it, instead of a reference.
                
                var e = element.element.getBoundingClientRect();        // Now getting new fresh values to be stored.

                var containerHeight = wH;
                var containerWidth = wW;
                if(element.container){
                    var c = container.getBoundingClientRect();
                    containerHeight = c.height;
                    containerWidth = c.width;
                }

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
                    height:     e.height,                   // Element's height

                    deltaX:     0,
                    deltaY:     0,
                    viewportX:  (element.last)?element.last.viewportX:undefined,
                    viewportY:  (element.last)?element.last.viewportY:undefined
                };

                // If the element has current and last values, then check for events.
                if(element.last){                    
                    element.current.deltaX = element.current.leftLeft - element.last.leftLeft;
                    element.current.deltaY = element.current.topTop - element.last.topTop;
                }

                // Update Viewport data  (only if it's necessary to do so)

                _axes.reduce(function(undefined, axis)
                {
                    var edges=[];
                    var vp;

                    var mapper = function(value){return element.current[value];}
                    // Would've used arrow function, but that's available in ES6 and it will cause compatibility issues.

                    if(axis === "Y")
                    {
                        if(element.last) if(!element.current.deltaY) return;
                        edges = _edgesY.map(mapper);
                    }
                    else{
                        if(element.last) if(!element.current.deltaX) return;
                        edges = _edgesX.map(mapper);
                    }

                    if(element.current["delta"+axis] || !(element.last))
                    {
                        // For Y bounds (Top/Bottom) or For X Bounds (Left/Right)
                        if ( ([edges[0]] <= 0) || ([edges[1]] <= 0) )
                            // Element is not in Y or X bounds of container
                            vp = 0;

                        else if( ([edges[2]] >=0) && ([edges[3]] >= 0) )
                            // Element is entirely inside Y or X bounds of container
                            vp = 1;
                        
                        else
                        {
                            vp = -1;
                            
                            if([edges[2]] < 0)
                            {
                                if([edges[0]] > (containerHeight*0.7))
                                    vp = 1;
                            }
                            else if([edges[3]] < 0)
                            {
                                if([edges[1]] > (containerHeight*0.7))
                                    vp = 1;
                            }
                        }
                    }
                    element.current["viewport"+axis] = vp;
                }, null);

                if(element.last && !((element.current.viewportX===0) && (element.current.viewportY===0))){
                    
                    var inActions = element.inActions;
                    var outActions = element.outActions;

                    _axes.reduce(function(undefined, axis){
                        if(element.current["viewport"+((axis==="X")?"Y":"X")]===0) return;   // If the other axis' viewport is 0, no point of proceeding.                     
                        var vp = element.current["viewport"+axis];      // Current Viewport
                        var lvp = element.last["viewport"+axis];        // Last Viewport
                        var delta = element.current["delta"+axis];      // Delta

                        if (delta && (vp!=lvp)){ 
                            if((vp==0) && outActions)
                            {
                                if(delta < 0){
                                    if(lvp==1)  // in case "Leaving" part was skipped
                                        _call(outActions[_directions[axis][0]], false); //Leaving from Left or Up
                                    _call(outActions[_directions[axis][0]], true); //Left from Left or Up  
                                }
                                else{
                                    if(lvp==1)  // in case "Leaving" part was skipped
                                        _call(outActions[_directions[axis][1]], false); //Leaving from Left or Up
                                    _call(outActions[_directions[axis][1]], true); //Left from Right or Down
                                }
                            }
                            else if((vp==1) && inActions)
                            {
                                if(delta < 0){
                                    if(lvp==0)  // in case "Enterring" part was skipped
                                        _call(inActions[_directions[axis][1]], false); //Enterring from Left or Up
                                    _call(inActions[_directions[axis][1]], true); //Enter from Right or Down
                                }
                                else{
                                    if(lvp==0)  // in case "Enterring" part was skipped
                                        _call(inActions[_directions[axis][0]], false); //Enterring from Left or Up
                                    _call(inActions[_directions[axis][0]], true); //Enter from Left or Up
                                }
                            }
                            else
                            {
                                if((lvp==0)  && inActions)
                                {
                                    if(delta < 0)
                                        _call(inActions[_directions[axis][1]], false); //Enterring from Right or Down
                                    else
                                        _call(inActions[_directions[axis][0]], false); //Enterring from Left or Up
                                }
                                else
                                {
                                    if(outActions)
                                        if(delta < 0)
                                            _call(outActions[_directions[axis][0]], false); //Leaving from Left or Up
                                        else
                                            _call(outActions[_directions[axis][1]], false); //Leaving from Right or Down
                                }
                            }
                        }
                    }, null);
                }
                

                /* The logic written above does exactly what this Commented code can do, but the code above is fewer lines
                if(element.current.deltaY){
                    // For Y bounds (Top/Bottom)
                    if ( (element.current.botTop <= 0) || (element.current.topBot <= 0) )
                        // Element is not in Y bounds of container
                        element.current.viewportY = 0;
 
                    else if( (element.current.topTop >=0) && (element.current.botBot >= 0) )
                        // Element is entirely inside Y bounds of container
                        element.current.viewportY = 1;
                    
                    else{

                        element.current.viewportY = -1;

                        if(element.current.topTop < 0){
                            if(element.current.botTop > (containerHeight*0.7))
                                element.current.viewportY = 1;
                        }
                        else if(element.current.botBot < 0){
                            if(element.current.topBot > (containerHeight*0.7))
                                element.current.viewportY = 1;
                        }
                    }
                }                

                if(element.current.deltaX || !element.last){                   
                    //For X bounds (left/right)
                    if ( (element.current.leftRight <= 0 ) || (element.current.rightLeft <= 0) )
                        // Element is not in X bounds of container
                        element.current.viewportX = 0;

                    else if( (element.current.leftLeft >=0) && (element.current.rightRight >= 0) )
                        // Element is entirely inside Y bounds of container
                        element.current.viewportX = 1;
                    
                    else{
                        element.current.viewportX = -1;

                        if(element.current.leftLeft < 0){
                            if(element.current.rightLeft > (containerHeight*0.7))
                                element.current.viewportX = 1;
                        }
                        else if(element.current.rightRight < 0){
                            if(element.current.leftRight > (containerHeight*0.7))
                                element.current.viewportX = 1;
                        }
                    }
                }

                if ((element.current.deltaX) && (element.current.viewportX!=element.last.viewportX))
                    if((element.current.viewportX==0) && (element.outActions)){
                        if(element.current.deltaX < 0)
                            _call(element.outActions.left.onComplete);//Left from Left;
                        else
                            _call(element.outActions.right.onComplete);//Left from Right
                    }
                    else if((element.current.viewportX==1) && (element.inActions)){
                        if(element.current.deltaX < 0)
                            _call(element.inActions.right.onComplete);//Enter from Right
                        else
                            _call(element.inActions.left.onComplete);//Enter from Left
                    }
                    else{
                        if((element.last.viewportX==0)  && (element.inActions)){
                            if(element.current.deltaX < 0)
                                _call(element.inActions.right.onStart);//Enterring from Right
                            else
                                _call(element.inActions.left.onStart);//Enterring from Left
                        }
                        else{
                            if(element.outActions)
                                if(element.current.deltaX < 0)
                                    _call(element.outActions.left.onStart);//Leaving from Left
                                else
                                    _call(element.outActions.right.onStart);//Leaving from Right
                        }
                    }

                if ((element.current.deltaY) && (element.current.viewportY!=element.last.viewportY))
                    if((element.current.viewportY==0) && (element.outActions)){
                        if(element.current.deltaY < 0)
                            _call(element.outActions.top.onComplete);//Left from Top
                        else
                            _call(element.outActions.bottom.onComplete);//Left from Bottom
                    }
                    else if((element.current.viewportY==1) && (element.inActions)){
                        if(element.current.deltaY < 0)
                            _call(element.inActions.bottom.onComplete);//Enter from Bottom
                        else
                            _call(element.inActions.top.onComplete);//Enter from Top
                    }
                    else{
                        if((element.last.viewportY==0) && (element.inActions)){
                            if(element.current.deltaY < 0)
                                _call(element.inActions.bottom.onStart);//Enterring from Bottom
                            else
                                _call(element.inActions.top.onStart);//Enterring from Top
                        }
                        else{
                            if (element.outActions)
                                if(element.current.deltaY < 0)
                                    _call(element.outActions.top.onStart);//Leaving from Top
                                else
                                    _call(element.outActions.bottom.onStart);//Leaving from Bottom
                        }
                    }
                           
                    */

                if(element.log)
                        _log(element.trackingId, element.log);  

            },null);

            // Checking performance
            /*
            var endTimer = performance.now();
            console.log("Scroll Event Handler took :  " + Math.floor(endTimer-startTimer) + "ms. ");
            */
        }

                

        // Just a log function, primarily for debugging purposes for now. MAY get modified or removed in future.
        function _log(trackingId, callback){
            callback(JSON.stringify(_elements[trackingId].current).split(",").join("<br>"));
        }

        // A Calling function. Why? Because I am too lazy to check for all callbacks. So I just call them through this one
        // and it checks if the callbacks are function, before calling them.
        function _call(fn, checkOnComplete){
            if(typeof fn === "function")
                fn();
            else if(typeof fn === "object"){
                if(checkOnComplete){
                    if(typeof fn.onComplete === "function") fn.onComplete();
                }
                else{
                    if(typeof fn.onStart === "function") fn.onStart();
                }
            } 
        }

        return {
            track : _track,
            untrack : _untrack,
            log : _log
        }
    }
    global.Trackit = trackit();
})(window);