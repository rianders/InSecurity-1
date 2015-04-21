var grass;
var floor;
var wall;
var objective;
var attacker_front;
var attacker_back;
var attacker_left;
var attacker_right;
var defender_front;
var defender_back;
var defender_left;
var defender_right;

var turn_num;
var gameSettings;
var game = sessionStorage.gameVersion;
var settings;
var canvas;
var map;
var map_radius = 2;
var map_zone;
var playerType = sessionStorage.playerType;
var game_objects;

var current_screen= 0;
var cursor_x;
var cursor_y;

var io;
var gameSocket;


function preload() {
	grass = loadImage('/images/grass.png');
	floor = loadImage('/images/floor.png');
	wall = loadImage('/images/wall_obstacle.png');
	objective = loadImage('/images/key_objective.png');

	attacker_front = loadImage('images/attacker_front.png');
	attacker_back = loadImage('images/attacker_back.png');
	attacker_left = loadImage('images/attacker_left.png');
	attacker_right = loadImage('images/attacker_right.png');
	
	defender_front = loadImage('images/defender_front.png');
	defender_back = loadImage('images/defender_back.png');
	defender_left = loadImage('images/defender_left.png');
	defender_right = loadImage('images/defender_right.png');

}

function setup() {
	canvas = createCanvas(500, 500);
	canvas.parent('gameContainer');

	sendGameSettings();
	setupGame();
}

function draw() {
	background(51);
	//var img;
	//img = loadImage("individualsprites/grass.jpg");
	//image(img,0,0);
	drawGameSession();
	//image(grass,0,0);
	
}


/*******************
	GAME OBJECTS
*******************/
function Settings(version, gameSettings) {
	this.game_version = version; // default=1;
	this.game_id = gameSettings.game_id; // you return this to me when you create the settings object
	this.map_width = gameSettings.map_width;
	this.map_height = gameSettings.map_height;
	this.numObjectives = gameSettings.numObjectives; // default = 3, can have more depending on map
	this.view = gameSettings.view; // 'default', 'camera'
	this.enableItems = gameSettings.enableItems; // bool
}

function Player(type, x, y) {
	this.type = type;
	
	this.xcoor = x;
	this.ycoor = y;
	this.oldXCoor = x;
	this.oldYCoor = y;
	
	this.direction;
	this.moving = 0;
	this.distance_left = 0;
	this.edge = 0;
	this.action = 'nothing';
	
	this.playerItems = new Array(0);

	//remove when real tiles are implemented
	this.color = color(255,255,255);
}

/* Object in the game
 * Objects can be:
 * 	- Objective(key, jewel, flag)
 *	- Item (shovel, teleport)
 */
function GameObject(type, x, y) {
	this.type = type;
	this.xcoor = x;
	this.ycoor = y;
	this.taken = false;
	this.used = false;
}

function Tile(type, size) {
	this.type = type;
	this.size = size;
	this.tile_accessibility = 1;
	
	switch(type) {
		case 1:
			this.color = color(80, 80, 80);
			this.tile_accessibility = 0;
			break;
		default:
			this.color = color(255, 255, 255);
			this.tile_accessibility = 1;
	}
}

function GameMap(width, height, radius, map_array) {
	// Game Map attributes
	this.width = width-radius;
	this.height = height-radius;
	this.radius = radius;
	this.tile_size =(500/((this.radius*2)+1));
	this.tile_array;
	this.rooms;

	// Generates a new Tile Array
	this.tile_array = new Array(this.width);
	for (var column = 0; column < this.width; column++) {
		this.tile_array[column] = new Array(this.height);
	}

	// Generate Game Map of Tiles
	for (var column = 0; column < this.width; column++) {
		for (var row = 0; row < this.height; row++) {
				this.tile_array[column][row] = new Tile(map_array[row][column], this.tile_size);
		}
	}
}


/**********************
	GAME FUNCTIONS
**********************/
function sendGameSettings() {
	/* not connected to the DB yet
	 * uncomment once DB is connected

	var settings = {
		'version': gameSettings.version,
		'map_width': gameSettings.map_width,
		'map_height': gameSettings.map_height,
		'view': gameSettings.view,
		'enableItems': gameSettings.enableItems
	}

	var successHandler = function(data, textStatus, jqXHR){
		gameSettings = new Settings(data.version, data);
	};

	$.ajax({
		url: '/settings', // sending game settings to DB
		type: 'POST',
		data: JSON.stringify(settings),
		contentType: 'application/json',
		dataType: 'json',
		success: successHandler
		}
	});
	*/

	var defaultSettings = {
		'game_version': 1,
		'game_id': 1111111,
		'map_width': 29,
		'map_height': 29,
		'map_radius': 2,
		'numObjectives': 3,
		'view': 'camera',
		'enableItems': false
	}; 

	gameSettings = new Settings(defaultSettings.game_version, defaultSettings);
}

/**********************
	SETUP FUNCTIONS
**********************/
function setupGame() {
	/*
	var gameData = {
		'version': settings.version,
		'id': settings.id
	}

	$.ajax({
		url: '/map', // getting a map and the rest of the information from the DB
		type: 'GET',
		data: JSON.stringify(gameData),
		dataType: 'json'
	}).done(function(response) {
		map = new GameMap(response.width, response.height, response.map_array);
	});
	
	var playerData = {
		'type': playerType
	}

	$.ajax({
		url: '/player',
		type: 'GET',
		data: JSON.stringify(playerData),
		dataType: 'json'
	}).done(function(response) {
		player = new Player(response.type, response.startX, response.startY);
	});
	*/

	// remove when DB is connected
	var mapArray = [
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	 	[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
	 	[0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,0],
	 	[0,0,1,0,0,1,1,1,0,1,1,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0],
	 	[0,0,1,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,2,0,1,0,0,1,0,0],
	 	[0,0,1,0,0,1,3,0,0,0,0,1,1,0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,0],
	 	[0,0,1,0,0,1,0,0,0,0,0,1,1,0,1,0,0,0,1,0,0,0,0,1,0,3,1,0,0],
	 	[0,0,1,0,0,1,1,1,0,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,0,0,1,0,0],
	 	[0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,0],
	 	[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
	 	[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1,0,0],
	 	[0,0,1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1,0,0],
	 	[0,0,1,0,0,0,0,0,1,0,0,1,1,0,1,1,0,0,0,0,0,0,1,0,0,0,1,0,0],
	 	[0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0],
	 	[0,0,1,0,1,1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
	 	[0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0],
	 	[0,0,1,0,3,1,0,0,0,0,0,1,0,0,0,1,0,0,1,1,1,1,1,1,0,1,1,0,0],
	 	[0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,1,1,1,0,0,1,0,0],
	 	[0,0,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,0,0,0,0,1,1,1,0,0,1,0,0],
	 	[0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,0,0],
	 	[0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,3,1,0,0],
	 	[0,0,1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1,0,0],
	 	[0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,1,1,0,1,0,0],
	 	[0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,0,0],
	 	[0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0],
	 	[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
	 	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	 	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];

	map = new GameMap(29,29, 3, mapArray);
	console.log(playerType);
	player = new Player(playerType, 6, 24);
	num_stars = gameSettings.numObjectives;
	game_objects = new Array(gameSettings.numObjectives);
	game_objects[0] = ('star', 6, 6);
	game_objects[1] = ('star', 7, 25);
	game_objects[2] = ('star', 21,25);

	// Update player accessibility;
	updateTileAccessibility(map, player.xcoor, player.ycoor);
}

// Gets tile index that the mouse is currently hovering over
function updateCursor(x_coord, y_coord) {
	cursor_x = (int)(x_coord/map.tile_size)-1;
  	cursor_y = (int)(y_coord/map.tile_size)-1;
}

/**********************
	DRAW FUNCTIONS
**********************/
function drawGameSession() {
	updateCursor(mouseX, mouseY);
	drawMap(map);
	/*
	if (edgeCase()) {
		drawPlayerMotion(map, player.distance_left);
	} else {
		drawPlayer(map);
	}
	*/

	//drawBorder();	
}

function drawMap(map) {
	// Onscreen tile index
	var tile_xcoor = 0;
	var tile_ycoor = 0;

	findZone();

	// Calculate vertical start and end points for camera
	var start_y;
	var end_y;
	if (player.ycoor-map.radius < map.radius) {
		console.log('top of map');
		start_y = player.ycoor-map.radius;
		end_y = player.ycoor+map.radius;
	} else if (player.ycoor+map.radius > map.height) {
		console.log('bottom of map');
		start_y = player.ycoor-map.radius;
		end_y = map.height+map.radius-1;
	}
	else {
		console.log('middle of map');
		start_y = player.ycoor-map.radius;
		end_y = player.ycoor+map.radius;
	}

	var start_x;
	var end_x;
	if (player.xcoor-map.radius < map.radius){
		console.log('left side of map');
		start_x = player.xcoor-map.radius;
		end_x = player.xcoor+map.radius;
	} else if (player.xcoor+map.radius > map.width) {
		console.log('right side of map');
		start_x = player.xcoor-map.radius;
		end_x = map.width+map.radius-1;
	} else {
		start_x = player.xcoor-map.radius;
		end_x = player.xcoor+map.radius;
	}

	console.log(start_y, end_y);
	console.log(start_x, end_x);
	for (var y = start_y; y <= end_y; y++){
		for(var x = start_x; x <= end_x; x++){
			if (player.moving == 1) {
				console.log('player moving');
				if (player.distance_left < 0) {
					player.distance_left = 0;
					player.moving = 0;
					drawTile(map.tile_array[x][y], tile_xcoor, tile_ycoor);
				} else {
					if (edgeCase()) {
						drawTile(map.tile_array[x][y], tile_xcoor, tile_ycoor);
					} else {
						player.distance_left = player.distance_left - .06;
			  			drawTileMotion(map.tile_array[x][y],tile_xcoor,tile_ycoor,cursor_x,cursor_y,player.distance_left);
					}
				}
			} else {
				console.log('not moving');
		  		drawTile(map.tile_array[x][y], tile_xcoor, tile_ycoor);
			}
			tile_xcoor = tile_xcoor+1;
		}
		tile_xcoor = 0;
		tile_ycoor = tile_ycoor+1;
	}
}

function findZone() {
	// Zone 1
	if (player.ycoor-map_radius-1 < 0 && 
		player.xcoor-map_radius-1 < 0) {
		map_zone = 1;
		return true;
	}

	// Zone 3
	if (player.xcoor+map_radius+3>map.width+1 &&
		player.ycoor-map_radius-1 < 0) {
		map_zone = 3;
		return true;
	}

	// Zone 2
	if (player.ycoor-map_radius-1 < 0) {
		map_zone = 2;
		return true;
	}

	// Zone 4
	if (player.ycoor-map_radius-1 >= 0 && 
		player.ycoor+map_radius < map.height-1 &&
		player.xcoor-map_radius-1 < 0) {
		map_zone = 4;
		return true;
	}

	// Zone 6
	if (player.xcoor+map_radius+3>map.width+1 &&
		player.ycoor-map_radius-1 >= 0 &&
		player.ycoor+map_radius+1 < map.height) {
		map_zone = 6;
		return true;
	}

	// Zone 5
	if (player.ycoor-map_radius-1 < 0) {
		map_zone = 5;
		return true;
	}

	// Zone 7
	if (player.ycoor+map_radius+1 > map.height-1 && 
		player.xcoor-map_radius-1 < 0) {
		map_zone = 7;
		return true;
	}

	// Zone 9
	if (player.ycoor+map_radius+1 > map.height-1 && 
		player.xcoor+map_radius+1 > map.width-1) {
		map_zone = 9;
		return true;
	}

	// Zone 8
	if (player.ycoor+map_radius+1 > map.height-1) {
		map_zone = 8;
		return true;
	}
}


function drawPlayerMotion(map, offset) {
	// Onscreen tile index
	var tile_xcoor = 0;
	var tile_ycoor = 1;

	// Calculate start and end points for camera
	var start_y;
	var end_y;
	if (player.ycoor-map_radius-1 < 0) {
		start_y = 0
		end_y = map_radius*2+2;
	} else if (player.ycoor+map_radius+1 > map.height-1) {
		start_y = map.height-1-(map_radius*2);
		end_y = map.height-1;
	}
	else {
		start_y = player.ycoor-map_radius-1;
		end_y = player.ycoor+map_radius+1;
	}

	// For all tiles within a certain radius around the player
  	for(start_y; start_y <= end_y; start_y++) {
  		var start_x;
		var end_x;
		if (player.xcoor-map_radius-1 < 0) {
			start_x = 0
			end_x = map_radius*2+2;
		} else if (player.xcoor+map_radius+1 > map.width-1) {
			start_x = map.width-1-(map_radius*2);
			end_x = map.width-1;
		}
		else {
			start_x = player.xcoor-map_radius-1;
			end_x = player.xcoor+map_radius+1;
		}
  		
  		for(start_x; start_x <= end_x; start_x++) {
  			// Iterate through the onscreen tiles
  			if(tile_xcoor==map_radius*2+3) {
  				tile_xcoor=1;
  				tile_ycoor++;
  			} else {
  				tile_xcoor++;
  			}

  			// Draw player
  			if (map.tile_array[start_x][start_y].tile_data == 2) {
	  			// Check if the current map tile contains the current player
	  			if (player.xcoor == start_x && player.ycoor == start_y) {
	  				// Draw the player at the correct onscreen tile
	  				fill(player.player_color);
	  				if(player.distance_left <= 0) {
	  					player.distance_left = 0;
	  					player.moving = 0;
	  				} else {
	  					player.distance_left = player.distance_left - 8.6;
	  				}
	  					
	  				switch (player.direction) {
	  					case "left":
	  						if (map_zone == 2) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1)+offset,map.tile_size*(1.5+tile_ycoor-1),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 3) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor+7)+offset,map.tile_size*(1.5+tile_ycoor-1),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 6) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor)+offset,map.tile_size*(1.5+tile_ycoor),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 7) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1)+offset,map.tile_size*(1.5+tile_ycoor+1),map.tile_size*.8,map.tile_size*.8);
	  						} else if (player.xcoor+map_radius+1 == map.width-1 && map_zone == 8) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1)+offset,map.tile_size*(1.5+tile_ycoor+1),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 9 && player.xcoor+1+map_radius == map.width) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-2)+offset,map.tile_size*(1.5+tile_ycoor+2),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 9) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-2)+offset,map.tile_size*(1.5+tile_ycoor+2), map.tile_size*.8,map.tile_size*.8);
	  						} else {
 								ellipse(map.tile_size*(1.5+tile_xcoor-1)+offset,map.tile_size*(1.5+tile_ycoor-1),map.tile_size*.8,map.tile_size*.8);
	 						}
	  						break;
	  					case "right":
	  						if (map_zone == 2) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1)-offset,map.tile_size*(1.5+tile_ycoor-1),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 3 && player.xcoor+map_radius+1 == map.width) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-6)-offset,map.tile_size*(1.5+tile_ycoor),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 3) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor+7)-offset,map.tile_size*(1.5+tile_ycoor-1),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 6) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor)-offset,map.tile_size*(1.5+tile_ycoor), map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 7) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1)-offset,map.tile_size*(1.5+tile_ycoor+1),map.tile_size*.8,map.tile_size*.8);
	  						} else if (player.xcoor-map_radius-1 == 0 && map_zone == 8) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1)-offset,map.tile_size*(1.5+tile_ycoor+1),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 9 && player.xcoor+1+map_radius == map.width) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-2)-offset,map.tile_size*(1.5+tile_ycoor+2),map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 9) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-2)-offset,map.tile_size*(1.5+tile_ycoor+2), map.tile_size*.8,map.tile_size*.8);
	  						} else {
	 							ellipse(map.tile_size*(1.5+tile_xcoor-1)-offset,map.tile_size*(1.5+tile_ycoor-1),map.tile_size*.8,map.tile_size*.8);	  								
	  						}
	  						break;
	 					case "up":
	  						if (map_zone == 2) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor-1)-offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 3) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-4),map.tile_size*(1.5+tile_ycoor)-offset,map.tile_size*.8,map.tile_size*.8);
	 						} else if (map_zone == 6 && player.ycoor-map_radius-1 == 0) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor),map.tile_size*(1.5+tile_ycoor)-offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 7) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor+1)-offset,map.tile_size*.8,map.tile_size*.8);
	 						} else if (map_zone == 8) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor+1)-offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 9 && player.ycoor+1+map_radius == map.height) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor),map.tile_size*(1.5+tile_ycoor-1)-offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 9) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor),map.tile_size*(1.5+tile_ycoor-1)-offset,map.tile_size*.8,map.tile_size*.8);
	  						} else {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor-1)-offset,map.tile_size*.8,map.tile_size*.8);
	  						} 
	  						break;
	  					case "down":
	  						if (map_zone == 2) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor-1)+offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 3 && player.ycoor-map_radius-1 == 0) {
	 							ellipse(map.tile_size*(1.5+tile_xcoor-4),map.tile_size*(1.5+tile_ycoor)+offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 3) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-4),map.tile_size*(1.5+tile_ycoor)+offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 6 && player.ycoor+1+map_radius == map.height-1) {
	 							ellipse(map.tile_size*(1.5+tile_xcoor),map.tile_size*(1.5+tile_ycoor)+offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 6) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor-1)+offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 7) {
	 							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor+1)+offset,map.tile_size*.8,map.tile_size*.8);
	  						} else if (map_zone == 8) {
	  							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor+1)+offset,map.tile_size*.8,map.tile_size*.8);
	  						} else {
	 							ellipse(map.tile_size*(1.5+tile_xcoor-1),map.tile_size*(1.5+tile_ycoor-1)+offset,map.tile_size*.8,map.tile_size*.8);
	  						} 
	  						break;
	  					default:
	  				}
	  			}
	  			
  			}
		}
  	}
}

function edgeCase() {
	if(map_zone == 1) {
		return true;
	}
	if ((map_zone == 2 && (player.direction == "up" || player.direction == "down")) ||
		(player.ycoor-map_radius-1 == 0 && map_zone == 5 && player.direction == "up") ||
		(player.xcoor-map_radius-1 == 0 && map_zone == 2 && player.direction == "right") ||
		(player.xcoor+map_radius+1 == map.width-1 && map_zone == 2 && player.direction == "left")) {
		return true;
	}
	if (map_zone == 3) {
		return true;
	}
	if ((map_zone == 4 && (player.direction == "left" || player.direction == "right")) ||
		(player.xcoor-map_radius-1 == 0 && map_zone == 5 && player.direction == "right") ||
		(player.ycoor-map_radius-1 == 0 && map_zone == 4 && player.direction == "up") ||
		(player.ycoor+map_radius+1 == map.height-1 && map_zone == 4 && player.direction == "down")) {
		return true;
	}
	if ((map_zone == 6 && (player.direction == "left" || player.direction == "right")) ||
		(player.xcoor+map_radius+1 == map.width-1 && map_zone == 5 && player.direction == "left") ||
		(player.ycoor-map_radius-1 == 0 && map_zone == 6 && player.direction == "up") ||
		(player.ycoor+map_radius+1 == map.height-1 && map_zone == 6 && player.direction == "down")) {
		return true;
	}
	if (map_zone == 7) {
		return true;
	}
	if ((map_zone == 8 && (player.direction == "up" || player.direction == "down")) ||
		(player.ycoor+map_radius+1 == map.height-1 && map_zone == 5 && player.direction == "down") ||
		(player.xcoor-map_radius-1 == 0 && map_zone == 8 && player.direction == "right") ||
		(player.xcoor+map_radius+1 == map.width-1 && map_zone == 8 && player.direction == "left")) {
		return true;
	}
	if (map_zone == 9) {
		return true;
	}
	return false;
}

function drawTile(tile, xcoor, ycoor) {
	switch(tile.type){
		case 0:
			image(grass,tile.size*xcoor,tile.size*ycoor,tile.size,tile.size);
			break;
		case 1:
			image(wall,tile.size*xcoor,tile.size*ycoor,tile.size,tile.size);
			break;
		case 2:
			image(grass,tile.size*xcoor,tile.size*ycoor,tile.size,tile.size);
			if (player.type == 'defender') {
				image(defender_front, (tile.size+(tile.size*(1/3)))*xcoor, tile.size*ycoor, tile.size*(2/3),tile.size*(2/3));
			} else if (player.type == 'attacker') {
				image(attacker_front, (tile.size+(tile.size*(1/3)))*xcoor, tile.size*ycoor, tile.size*(2/3),tile.size*(2/3));
			}

			break;
		case 3:
			image(grass,tile.size*xcoor,tile.size*ycoor,tile.size,tile.size);
			image(objective,tile.size*xcoor,tile.size*ycoor,tile.size,tile.size);
			break;
		default:
	}


	//rect(tile.size*xcoor, tile.size*ycoor, tile.size, tile.size);
	
}

function drawTileMotion(tile, index_x, index_y,cursor_x,cursor_y, offset) {
	// Get tile color
	fill(tile.tile_color);

	// Draw rectangle of the proper size at the proper place onscreen
	switch (player.direction) {
		case "left":
			rect(tile.tile_size*(index_x)-offset,tile.tile_size*(index_y),tile.tile_size,tile.tile_size);
			break;
		case "right":
			rect(tile.tile_size*(index_x)+offset,tile.tile_size*(index_y),tile.tile_size,tile.tile_size);
			break;
		case "up":
			rect(tile.tile_size*(index_x),tile.tile_size*(index_y)+offset,tile.tile_size,tile.tile_size);
			break;
		case "down":
			rect(tile.tile_size*(index_x),tile.tile_size*(index_y)-offset,tile.tile_size,tile.tile_size);
			break;
		default:
	}
}

function drawBorder() {
	// Border covers edges of map
	// so that map appears to slide in from each side
	fill(255,255,255);
	noStroke();
	rect(0,40, 80,521);
	rect(521,40, 80,521);
	rect(40,0, 521,80);
	rect(40,521, 521,80);
	stroke();
	line(80,80,80,520);
	line(520,80,520,520);
	line(80,80,520,80);
	line(80,520,520,520);
}

function keyPressed() {
	// Check if controls are enabled
	//if (ENABLE_CONTROLS == true) {
		switch(key) {

			// User presses '1'
			case '1':
				//Toggle Debug mode on/off
				if (DEBUG_MODE==false) {
					DEBUG_MODE=true;
				} else {
					DEBUG_MODE=false;
				}
				break;

			// User presses 'w'
			case 'w':
				// Check to make sure player is not already moving
				if(player.moving==0) {
					// Check if the player is allowed to move up 1 tile
					if(userHighlightsPossibleMove(player.xcoor, player.ycoor-1, player.xcoor, player.ycoor-1)) {
						// Move the player up 1 tile
						player.action = 'move';
						movePlayer(player, map, player.xcoor, player.ycoor-1);
					}
				}
				break;
			case 'W':
				// Check to make sure player is not already moving
				if(player.moving==0) {
					// Check if the player is allowed to move up 1 tile
					if(userHighlightsPossibleMove(player.xcoor, player.ycoor-1, player.xcoor, player.ycoor-1)) {
						// Move the player up 1 tile
						player.action = 'move';
						movePlayer(player, map, player.xcoor, player.ycoor-1);
					}
				}
				break;

			// User press 'a'
			case 'a':
				// Check to make sure player is not already moving
				if(player.moving==0) {
					// Check if the player is allowed to move left 1 tile
					if(userHighlightsPossibleMove(player.xcoor-1, player.ycoor, player.xcoor-1, player.ycoor)) {
						// Move the player left 1 tile
						player.action = 'move';
						movePlayer(player, map, player.xcoor-1, player.ycoor);
					}
				}
				break;
			case 'A':
				// Check to make sure player is not already moving
				if(player.moving==0) {
					// Check if the player is allowed to move left 1 tile
					if(userHighlightsPossibleMove(player.xcoor-1, player.ycoor, player.xcoor-1, player.ycoor)) {
						// Move the player left 1 tile
						player.action = 'move';
						movePlayer(player, map, player.xcoor-1, player.ycoor);
					}
				}
				break;

			// User presses 's'
			case 's':
				// Check to make sure player is not already moving
				if(player.moving==0) {
					// Check if the player is allowed to move down 1 tile
					if(userHighlightsPossibleMove(player.xcoor, player.ycoor+1, player.xcoor, player.ycoor+1)) {
						// Move the player down 1 tile
						player.action = 'move';
						movePlayer(player, map, player.xcoor, player.ycoor+1);
					}
				}
				break;
			case 'S':
				// Check to make sure player is not already moving
				if(player.moving==0) {
					// Check if the player is allowed to move down 1 tile
					if(userHighlightsPossibleMove(player.xcoor, player.ycoor+1, player.xcoor, player.ycoor+1)) {
						// Move the player down 1 tile
						player.action = 'move';
						movePlayer(player, map, player.xcoor, player.ycoor+1);
					}
				}
				break;

			// User presses 'd'
			case 'd':
				// Check to make sure player is not already moving
				if(player.moving==0) {
					// Check if the player is allowed to move right 1 tile
					if(userHighlightsPossibleMove(player.xcoor+1, player.ycoor, player.xcoor+1, player.ycoor)) {
						// Move the player right 1 tile
						player.action = 'move';
						movePlayer(player, map, player.xcoor+1, player.ycoor);
					}
				}
				break;
			case 'D':
				// Check to make sure player is not already moving
				if(player.moving==0) {
					// Check if the player is allowed to move right 1 tile
					if(userHighlightsPossibleMove(player.xcoor+1, player.ycoor, player.xcoor+1, player.ycoor)) {
						// Move the player right 1 tile
						player.action = 'move';
						movePlayer(player, map, player.xcoor+1, player.ycoor);
					}
				}
				break;
			default:
				// If any other key was pressed, do nothing
		}
	//}
};// once the player has moved send data
function endTurn(){
	if (player.type=='attacker' && player.action == 'moved'){}
}

function sendTurnData() {
	var turnData = {
		'turn_num': turn_num+1,
		'attacker': null,
		'defender': null,
		'gameOver': false
	}

	var successHandler = function(data, textStatus, jqXHR){
		gameSettings = new Settings(data.version, data);
	};

	$.ajax({
		url: '/turn', // sending game settings to DB
		type: 'POST',
		data: JSON.stringify(turnData),
		contentType: 'application/json',
		dataType: 'json',
		success: successHandler
	});
}

// once both players have made their moved resolve any conflicts
function resolveConflict(){

}

// checks to see if a player is in a Room
function isInRoom(){

}

// checks to see if a player can see the other player
function canSee(){

}

// game over send data to database
function gameOver(){

};;$(document).ready(function() {
	$(document).on('click', function(event) {
		var target = $(event.target);

		if (target.is('#Game1')){
			sessionStorage.setItem('gameVersion', 1);
		} else if (target.is('#Game2')){
			sessionStorage.setItem('gameVersion', 2);
		}

		console.log(sessionStorage.gameVersion);
	});
});;function initGame(sio, socket) {
	io = sio;
	gameSocket = socket;
	gameSocket.emit('connected', {message: 'You are connected!'});

	gameSocket.on('chooseAttacker', chooseAttacker);
	gameSocket.on('chooseDefender', chooseDefender);
	gameSocket.on('foundPartner', foundPartner);
	gameSocket.on('movePlayer', movePlayer);
	gameSocket.on('quit', exitGame);
}

function chooseAttacker(id, room) {
	console.log("Someone choose an attacker");
	//if there are already defenders, send both players the other players id
	if(defenders[room] && defenders[room].length!=0) {
		var defender = defenders[room].pop();
		defender.connection.emit("foundPartner", id, "attacker");
	}
	//otherwise add them to a waiting list
	else {
		if(!attackers[room]) attackers[room]=[];
		attackers[room].push({"id" : id, "connection" : socket});
	}
}

function chooseDefender(id, room) {
	console.log("Someone choose a defender");
	if(attackers[room] && attackers[room].length!=0) {
		var attacker = attackers[room].pop();
		socket.emit("foundPartner", attacker.id, "defender");
	}
	else {
		if(!defenders[room]) defenders[room] = [];
		defenders[room].push({"id" : id, "connection" : socket});
	}
}

function foundPartner(id, type) {
	console.log('Connecting to: ', + id);
	playerType = type;
	startGame();
}

function exitGame() {
	window.location = '/gameSelection';
}
;function movePlayer(player, map, x, y){
	// Update map data
	// Set old title to unoccupied
	map.tile_array[player.xcoor][player.ycoor].type = 0;
	// Check if there's an item on the new tile
	if(map.tile_array[x][y].type != 0) {
		// Set new tile data to not have an item
		map.tile_array[x][y].type = 0;
		// Checks array of all in-play items to see which item was on the new tile
		for (var object = 0; object < game_objects.length; object++) {
			if (x == game_objects[object].xcoor && y == game_objects[object].ycoor) {
				// Adds the item to the player's inventory
				game_inventories[selected_player].push(new InventoryObject(game_objects[object]));
				// Checks to see if the player picked up a star
				if (game_objects[object].object_id == 3) {
					num_stars++;
				}
				// Removes the item from the array of all in-play items
				game_objects.splice(object,1);
			}
		}
	}

	// Updates tile accessibility for all tiles around the player's old tile
	updateTileAccessibility(map, player.xcoor, player.ycoor);

	// Determine direction of movement animation
	if (x < player.xcoor && y == player.ycoor) {
		player.direction = "left";
	} else if (x > player.xcoor && y == player.ycoor) {
		player.direction = "right";
	} else if (x == player.xcoor && y < player.ycoor) {
		player.direction = "down";
	} else if (x == player.xcoor && y > player.ycoor) {
		player.direction = "up";
	}

	// Update player data
	player.oldXCoor = player.xcoor;
	player.oldYcoor = player.ycoor;
	player.xcoor = x;
	player.ycoor = y;

	// Set new tile data to have the player
	map.tile_array[x][y].type = 2;

	// Updates tile accessibility for all tiles around the player's old tile
	updateTileAccessibility(map, x, y);

	// Start movement animation
	player.moving = 1;
	player.distance_left = map.tile_size;

	// once the player finished moving end their turn;
	endTurn();
}

function updateTileAccessibility(map, x, y) {
	// Checks to see if: Left Tile is accessible
	// Tile(x,y) is not on the left most column of tiles
	// Tile to the left of Tile (x,y) is not a wall
	// Only if all the above are true does it set tile to the left of Tile(x,y) as accessible
	console.log(map.tile_array[x-1][y].type);
	if (x != 0 && map.tile_array[x-1][y].type != 1) {
		map.tile_array[x-1][y].tile_accessibility = 1;
	} else {
		map.tile_array[x-1][y].tile_accessibility = 0;
	}

	// Checks to see if: Right Tile is accessible
	// Tile(x,y) is not on the right most column of tiles
	// Tile to the right of Tile (x,y) is not a wall
	// Only if all the above are true does it set tile to the right of Tile(x,y) as accessible
	if (x != map.size_horizontal-1 && map.tile_array[x+1][y].type != 1) {
		map.tile_array[x+1][y].tile_accessibility = 1;
	} else {
		map.tile_array[x+1][y].tile_accessibility = 0;
	}

	// Checks to see if: Top Tile is accessible
	// Tile(x,y) is not on the top most row of tiles
	// Tile to the top of Tile (x,y) is not a wall
	// Only if all the above are true does it set tile to the top of Tile(x,y) as accessible
	if (y != 0 && map.tile_array[x][y-1].type != 1) {
		map.tile_array[x][y-1].tile_accessibility = 1;
	} else {
		map.tile_array[x][y-1].tile_accessibility = 0;
	}

	// Checks to see if: Bottom Tile is accessible
	// Tile(x,y) is not on the bottom most row of tiles
	// Tile to the bottom of Tile (x,y) is not a wall
	// Only if all the above are true does it set tile to the bottom of Tile(x,y) as accessible
	if (y != map.size_vertical-1 && map.tile_array[x][y+1].type != 1) {
		map.tile_array[x][y+1].tile_accessibility = 1;
	} else {
		map.tile_array[x][y+1].tile_accessibility = 0;
	}
}

// Check if move is possible
function userHighlightsPossibleMove(map_x, map_y, mouse_x, mouse_y) {
	if (mouse_x==map_x && map_y==mouse_y && map.tile_array[map_x][map_y].tile_accessibility == 1) {
		return true;
	}
 	return false;	
};$(document).ready(function() {
  $("#defender").on("click",function() {
  	sessionStorage.setItem('playerType', 'defender');

	socket.on('connect', function() {
		socket.emit('chooseDefender', id, window.location.pathname);
	});
  });
  $("#attacker").on("click",function() {
	sessionStorage.setItem('playerType', 'attacker');

	socket.on('connect', function() {
		socket.emit('chooseAttacker', id, window.location.pathname);
	});
  });
});