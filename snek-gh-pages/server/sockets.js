var socketio = require('socket.io');
var http = require('http');
var startGame = require('./game');
var uuid = require('./uuid');
var nextColor = require('./colors');

var game;
var players = {};

module.exports = function(app) {

  var server = http.Server(app);
  var io = socketio(server);

  // A player joins the game
  io.sockets.on('connection', function(socket) {
    console.log("Player Connected");

    // Create a player object with a unique ID
    var player = {
      id: uuid(),
      socket: socket,
      color: nextColor(),  // Give player a color from the colors array
      name : "",
      points : 0
    };

    // Give them a name
    player.name = "Snake_" + player.id;

    // Add them to to the player object
    players[player.id] = player;

    // Send the player the game setup details
    setTimeout(function(){
      socket.emit('gameSetup', {
        width: game.width,
        height: game.height,
        id: player.id,
        color: player.color,
        apples: game.apples,
        snakes: game.snakes,
        winLength : game.winLength,
      });
    },1000);

    // When this player disconnects
    // remove that player and let the clients know
    socket.on('disconnect', function(){
      io.emit("playerDisconnect",{
        id : player.id
      });
      game.removePlayer(player.id);
      delete players[player.id];
    });

    // When this player sends in a chat message
    // Send it out to all clients.
    socket.on('sendChat',function(data){
      io.emit('newChat',{
        id: player.id,
        message: data.message
      });
    });

    // When this player changes their name
    socket.on('changeName',function(data){
      player.name = data.name;
      var snake = game.findPlayerSnake(player.id);
      snake.name = player.name;
    });

    // When the client requests a new snake be made for them
    // We add one!
    socket.on('makeSnake', function() {
    	var data = {
        id: player.id,
        color: player.color,
        name : player.name
      };
      game.addSnake(data);
    });

    // Client presses a directional input
    socket.on('direction', function(data){
      var snake = game.findPlayerSnake(player.id);
      if (snake) {
        snake.pushDirection(data.direction);
      }
    });

    // Client releases a directional input
    socket.on('releaseDirection', function(data){
      var snake = game.findPlayerSnake(player.id);
      if (snake) {
        snake.releaseDirection(data.direction);
      }
    });

    // Client pressed the bomb button
    socket.on('dropBomb', function() {
      var snake = game.findPlayerSnake(player.id);
      if (snake) {
        snake.eventQ.push("bomb");
      }
    });

    // Client snake dies, we let everyone know
    socket.on('died', function() {
      io.emit('killSnake', {
        id: player.id
      });
    });
  });

  // Fire up a boring ol' server, on port 3000
  server.listen(process.env.PORT || 3000, function(){
    console.log('listening on *:3000');
    game = startGame(io,players);
  });
};
