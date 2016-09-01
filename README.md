# TrackIt.js

Trackit.js is a JavaScript library that allows tracking of DOM elements upon scroll or resize events. It doesn't uses any dependencies and is build using vanilla JavaScript.

## Features

Currently following events can be tracked :

- Entering viewport (from Top, Right, Bottom, Left)
- Entered viewport (same)
- Leaving viewport (same)
- Left viewport (same)

## How To Use

(This is subjected to change with future builds)

1. Download `trackit.js` or `trackit.min.js` and include it on your page.

2. Under your page's script, add the following code

```javascript
   Trackit.track(
     document.getElementById("track-me"),	// this is the element that we want to track
     {
       inActions : {	// For entry actions (as in, when element is entering viewport)
         top : {		// this is for top, similarly, we have bottom, left and right as well.
           onStart : function(){ /* code here */ },  // When element starts to enter      
           onComplete : function(){ /* code here */ } // When element completely entered
         },
         bottom : function(){ /* code here */ }
         // When you pass callback function directly, without onStart or onComplete
         // It's assumed that you want to run the callback on onComplete event.
       },
       outActions : {	// For exit actions (as in, when element is leaving viewport)
         top : {
           onStart : function(){ /* Do Stuff here */ }
           onComplete : function(){ /* Do Stuff here */ }
         }
       }
     });
```
3. That's it.

If it seems confusing, then wait for a better documentation, that I'll prepare as soon as all primary features of this library are implemented properly.

## Micro-Documentation

### Syntax

- Track
```javascript
var trackingId = Tracking.track([element],[options]);
```
- Untrack
```javascript
Tracking.untrack([trackingId]);
```

### Options

#### Structure

```javascript
{
  inActions :
  {
  	[direction] :
    {
      onStart : [callback],
      onComplete : [callback]
    }
  },
  outActions : {
    ...
  }
}
```

#### Events
- `inActions` - When element has entered or is entering the viewport
  - `top` 
  - `bottom`
  - `left`
  - `right`
- `outActions` - When element is leaving or has left the viewport
  - `top`
  - `bottom`
  - `left`
  - `right`


Each of the directions events have two sub-events :

- `onStart` - When the element is leaving/entering the viewport
- `onComplete` - When the element has left/entered the viewport

Where you can pass your custom callbacks. If you pass callback directly to the direction even (without specifying `onStart` or `onComplete`, then the callback executes same as it would execute in case of `onComplete`)


## Author

Abhinav Dabral (abhinavdabral)

## License

MIT