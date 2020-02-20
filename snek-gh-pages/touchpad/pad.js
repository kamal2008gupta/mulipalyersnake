var socket = io();

// When we connect, request a snake for this player
socket.on('gameSetup', function(msg){
  socket.emit("makeSnake");
});

var directions = ["up","down","left","right"];

var startX;              // Keeps track of the x position of a new move or gesture starts
var startY;              // Keeps track of the y position of a new move or gesture starts
var minTouch = 80;       // Minimum distance swiped to register a move
var startMoveTime = 0;   // Tracks the time a move was started, so we can check how long it took
var gestureDelta = 0;

var lastX = 0;
var lastY = 0;

var lastDirection;

$(document).ready(function(){

  // When we start a gesture, keep track of
  // * Where it started (x,y)
  // * When it started
  // We also let the player make multiple moves without having
  // to lift their finger.


  $("body").on("touchstart", function(e){
    var touch = e.originalEvent.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    var now = new Date();
    startMoveTime = now.getTime();
    
    lastX = touch.clientX;
    lastY = touch.clientY;
  });

  // When the player swipes around the controller,
  // we figure out when they've moved far enough in
  // any direction and let the game know.


  $("body").on("touchmove", function(e){

    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX;
    var y = touch.clientY;

    var xDelta = x - startX;
    var yDelta = y - startY;
    

    var totalDeltaX = x - lastX;
    var totalDeltaY = y - lastY;
    
    gestureDelta += Math.abs(totalDeltaX);
    gestureDelta += Math.abs(totalDeltaY);
    
    lastX = x;
    lastY = y;

    var totalDelta = Math.abs(xDelta) + Math.abs(yDelta);

    if(totalDelta > minTouch) {

      var thisDirection = false;

      if(xDelta > minTouch) {
        thisDirection = "right";
      }

      if(xDelta < (minTouch * -1)) {
        thisDirection = "left";
      }

      if(yDelta > minTouch) {
        thisDirection = "down";
      }

      if(yDelta < (minTouch * -1)) {
        thisDirection = "up";
      }

      if(thisDirection) {

        if(thisDirection != lastDirection) {
          socket.emit('direction', {
            direction: thisDirection
          });
          endmove(x, y, thisDirection);
        }
        
        lastDirection = thisDirection;
      }

    }
    return false;
  });

  $("body").on("touchend", function(e){
    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX;
    var y = touch.clientY;

    checkShortTouch(x, y);
    endmove(x, y, false);
    gestureDelta = 0;
    lastDirection = false;

    return false;
    e.preventDefault();
  });

});



// When a player lifts their finger, let's see how
// far they siped and how long it took.
// If it's a short swipe and a short duration, it's probably meant to be a tap.

function checkShortTouch(x, y){

  var now = new Date();
  var endTime = now.getTime();
  var timeDelta = endTime - startMoveTime;

  $(".console").text(timeDelta + "," +  gestureDelta);

  if(timeDelta < 250 && gestureDelta < 5) {
    socket.emit('dropBomb');
  }
}


// When a move ends, we let the game know.
function endmove(x,y, direction){
  startX = x;  // Reset x position start for next move
  startY = y;  // Reset y position for the next move

  for(var i = 0; i < directions.length; i++) {
    if(directions[i] != direction) {
      socket.emit('releaseDirection', {
        direction: directions[i]
      });
    }
  }
}