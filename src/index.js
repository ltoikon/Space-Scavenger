
let game;
const gameOptions = {
  shipGravity:0,//not used
  shipSpeed: 300
};

window.onload = function() {
  var config = {
    type: Phaser.AUTO,
    backgroundColor: "#050513",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 1200,
    },
	pixelArt:true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { 
              y: 0 //not used
            }
        }
    },
    scene: [Intro, Junk]
  };
  game = new Phaser.Game(config);
  window.focus();
};

//TODO clean up
//nää on seurausta sekoilusta kun en saanu ampumista toimii typon takia
var shipBullets;
//var ship;
var speed;
var stats;
var cursors;
var reticle;
var lastFired = 0;


//Bullet
//https://github.com/photonstorm/phaser3-examples/blob/master/public/src/games/top%20down%20shooter/topdown_combatMechanics.js
var Bullet = new Phaser.Class({
	Extends: Phaser.GameObjects.Image,

	initialize:

	//constructor
	function Bullet (scene){
		Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');
		this.speed = 1;
		this.born = 0;
		this.direction = 0;
		this.xSpeed = 0;
		this.ySpeed = 0;
		this.setSize(12, 12, true);
	},

	//will fire a shot from the ship to the target(aim)
	fire: function (shooter, target){
		this.setPosition(shooter.x, shooter.y); //start position
		this.direction = Math.atan((target.x - shooter.x)/(target.y - shooter.y));

		//x, y velocity
		if (target.y >= this.y){
			this.xSpeed = this.speed*Math.sin(this.direction);
			this.ySpeed = this.speed*Math.cos(this.direction);
		} else {
			this.xSpeed = -this.speed*Math.sin(this.direction);
			this.ySpeed = -this.speed*Math.cos(this.direction);
		}
		this.born = 0 //launch delay, after all it is a ship
	},

	update: function (time, delta){
		this.x += this.xSpeed * delta;
		this.y += this.ySpeed * delta;
		this.born += delta;
		if (this.born > 1800){
			this.setActive(false);
			this.setVisible(false);
		}
	}
});

class Intro extends Phaser.Scene{
	constructor () {
		super("Intro");
	}

	preload () {
		this.load.spritesheet('ship', 'assets/ship.png', {frameWidth:93, frameHeight: 110});
		this.load.image('sky', 'assets/clouds.png');
	}

	create () {
		this.add.image(408, 608,'sky').setScale(1.5)
		this.ship = this.physics.add.sprite(game.config.width/2, game.config.height/1.1, 'ship').setScale(1.5)
		this.ship.setGravityY(-500)

	} 

	update () {
		if (this.ship.y < -100){
			this.scene.start("Junk")
		}
	}
}

class Junk extends Phaser.Scene {

	constructor() {
		super("Junk")
	}

	preload () {
		/*loading assets */
		//this.load.image('name', 'location')
		//source: https://labs.phaser.io/assets/
		this.load.spritesheet('ship', 'assets/ship.png', {frameWidth:93, frameHeight: 110});
		this.load.spritesheet('coin', 'assets/coin.png', {frameWidth:32, frameHeight: 32}); //sprite
		this.load.image('sky', 'assets/clouds.png');
		this.load.image('bar', 'assets/pipe3.png');
		this.load.image('bullet', 'assets/bullet7.png');
		this.load.audio('blaster', 'assets/blaster.mp3');
		this.load.audio('space chillout', 'assets/space-chillout-14194.mp3');
	}
	
	create () {

		/*everything we use on gameplay: add here collisions, animation, controls  */
		this.obstacleGroup = this.physics.add.group({
			immovable: true,
			allowGravity: false //find out if needed
		})

		
		/*for(let i = 0; i < 10; i++){
			let bar = this.add.image(Phaser.Math.Between(0, game.config.width), 
			Phaser.Math.Between(-100, game.config.height), 'bar').setScale(.3);
			this.obstacleGroup.add(bar);
			this.obstacleGroup.setVelocityY(100)

		}*/
		//this.coin = this.physics.add.sprite(Phaser.Math.Between(0, game.config.width), 
		//0, 'coin')
		shipBullets = this.physics.add.group({classType: Bullet, runChildUpdate: true});
		// alienBullets = this.physics.add.group({classtype: Bullet, runChildUpdate: true});
		this.ship = this.physics.add.sprite(game.config.width/2, game.config.height/1.2, 'ship')
		this.ship.body.gravity.y = gameOptions.shipGravity
		reticle = this.physics.add.sprite(800, 700, 'bullet');
		this.physics.add.collider(this.ship, this.obstacleGroup)
		this.blaster = this.sound.add('blaster');
		this.sound.add('space chillout').play({
			loop: true
		});

		this.coinGroup = this.physics.add.group({
			allowGravity: false 
		})
	
		this.physics.add.overlap(this.ship, this.coinGroup, this.collectCoin, null, this)

		//Input

		this.cursors = this.input.keyboard.createCursorKeys()
		this.input.on('pointerdown', function (pointer, time, lastFired) {
			if (this.ship.active === false)
            return;

			var bullet = shipBullets.get().setActive(true).setVisible(true);
			if (bullet){
				
				bullet.fire(this.ship, reticle);
				this.blaster.play();
				
			}		
		}, this);

		// Pointer lock will only work after mousedown
		game.canvas.addEventListener('mousedown', function () {
			game.input.mouse.requestPointerLock();
		});

		// Exit pointer lock when Q or escape (by default) is pressed.
		this.input.keyboard.on('keydown_Q', function (event) {
			if (game.input.mouse.locked)
				game.input.mouse.releasePointerLock();
		}, 0, this);

		this.input.on('pointermove', function (pointer) {
			if (this.input.mouse.locked)
			{
				reticle.x += pointer.movementX;
				reticle.y += pointer.movementY;
			}
		}, this);

		//Score
		this.score = 0
		this.scoreText = this.add.text(0, 0, "Score:", {fontSize: "32px", fill:"#d4d4f4"})
		this.scoreValue = this.add.text(128, 0, this.score, {fontSize: "32px", fill:"#d4d4f4"})
		this.anims.create({
			key: "play",
			frames: this.anims.generateFrameNumbers('coin', {start:0, end:5}),
			frameRate: 10,
			repeat: -1

		})
		
		this.triggerTimer = this.time.addEvent({
			callback: this.addObstacle,
			callbackScope: this,
			delay: 800,
			loop: true
		})

		this.triggerTimer = this.time.addEvent({
			callback: this.addCoin,
			callbackScope: this,
			delay: 1500,
			loop: true
		})
		
	}

	//Spawning content when scrolling

	addObstacle() {
		let bar = this.add.image(Phaser.Math.Between(0, game.config.width), 
			0, 'bar').setScale(.3);
		this.obstacleGroup.add(bar);
		this.obstacleGroup.setVelocityY(100)
	}

	addCoin() {
		if (Phaser.Math.Between(0,1) == 1){
		this.coinGroup.create(Phaser.Math.Between(10, (game.config.width-10)), 0, 'coin').play("play")
		this.coinGroup.setVelocityY(150)
		}
	}

	collectCoin(ship, start){
		start.disableBody(true,true)
		this.score += 100;
		this.scoreValue.setText(this.score);
	}

	update () {
		
		//this.coin.anims.play("play", true)
		if(this.cursors.left.isDown) {
			this.ship.body.velocity.x = -gameOptions.shipSpeed
		}
		else if(this.cursors.right.isDown) {
			this.ship.body.velocity.x = gameOptions.shipSpeed
		}
		else {
			this.ship.body.velocity.x = 0
		}

		if(this.cursors.up.isDown) {
			this.ship.body.velocity.y = -gameOptions.shipSpeed
		
		}
		else if(this.cursors.down.isDown) {
			this.ship.body.velocity.y = gameOptions.shipSpeed
		}
		else {
			this.ship.body.velocity.y = 0
		}

		if(this.ship.y < 0 || this.ship.y > game.config.height || this.ship.x < 0 
		|| this.ship.x > game.config.width){
			
			this.scene.start("Junk")
		}

	}
 
}

class Endgame extends Phaser.Scene {
	preload () {

	}

	create () {

	}

	update () {

	}
}


//space chillout
//Music by <a href="https://pixabay.com/users/penguinmusic-24940186/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=music&amp;utm_content=14194">penguinmusic</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=music&amp;utm_content=14194">Pixabay</a>