/***************************************************
 * Space Scavenger
 * Lauri Ikonen
 * 20221027
 * Done with Phaser3
 * 
 ****************************************************/

let game;
const gameOptions = {
  shipGravity:0,
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
    scene: [Intro, Junk, Endgame, TheEnd]
  };
  game = new Phaser.Game(config);
  window.focus();
};

//variables used on shooting mechanism
var shipBullets;
var alienBullets;
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

	//will fire a shot from the ship to the target(aim), or from the boss towards the ship 
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

		//needed to despawn stray bullets
		this.born = 0 
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
		this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml');
	}

	create () {
		this.add.image(408, 608,'sky').setScale(1.5)
		this.ship = this.physics.add.sprite(game.config.width/2, game.config.height/1.1, 'ship').setScale(1.5)
		this.ship.setGravityY(-500)
		this.add.bitmapText(game.config.width/5, game.config.height/3, 'arcade', 'Space Scavenger').setTint(0xd4d4f4);

	} 

	update () {
		//transition to first level
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
		this.load.image('bar', 'assets/pipe3.png');
		this.load.image('star', 'assets/star.png');
		this.load.image('bullet', 'assets/bullet7.png');
		this.load.image('reticle', 'assets/red_ball.png');

		this.load.audio('blaster', 'assets/blaster.mp3');
		this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml')
		
		//space chillout
		//Music by <a href="https://pixabay.com/users/penguinmusic-24940186/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=music&amp;utm_content=14194">penguinmusic</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=music&amp;utm_content=14194">Pixabay</a>
		this.load.audio('space chillout', 'assets/space-chillout-14194.mp3');
	}
	
	create () {
		//left and right border
		this.physics.world.setBoundsCollision(true, true, true, false);
		
		this.obstacleGroup = this.physics.add.group({
			immovable: true,
			allowGravity: false //find out if needed
		})

		shipBullets = this.physics.add.group({classType: Bullet, runChildUpdate: true});
		this.ship = this.physics.add.sprite(game.config.width/2, game.config.height/1.2, 'ship').setCollideWorldBounds(true)
		this.ship.body.gravity.y = gameOptions.shipGravity
		
		reticle = this.physics.add.sprite(800, 700, 'reticle').setCollideWorldBounds(true);
		
		this.physics.add.collider(this.ship, this.obstacleGroup)
		this.blaster = this.sound.add('blaster');
		this.music = this.sound.add('space chillout');
		this.music.play({
			loop: true
		});
		
		//Coin
		this.coinGroup = this.physics.add.group({
			allowGravity: false 
		})
		this.physics.add.overlap(this.ship, this.coinGroup, this.collectCoin, null, this)

		//Stars
		this.starGroup = this.physics.add.group({
			allowGravity: false 
		})
		this.physics.add.overlap(this.ship, this.starGroup, this.collectStar, null, this)

		//Input

		game.canvas.addEventListener('mousedown', function () { //gives reticle control after left clicking, ESC disables
			game.input.mouse.requestPointerLock();
		});

		this.input.on('pointermove', function (pointer) { 		//reticle follows pointer
			if (this.input.mouse.locked)
			{
				reticle.x += pointer.movementX;
				reticle.y += pointer.movementY;
			}
		}, this);

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

		

		//Score
		this.score = 0
		this.scoreText = this.add.bitmapText(10, 10, 'arcade', 'Score:').setTint(0xd4d4f4);
		this.scoreValue = this.add.bitmapText(200, 10, 'arcade', this.score).setTint(0xd4d4f4);
		this.starCount = 0
		this.starText = this.add.bitmapText(500, 10, 'arcade', 'Stars:').setTint(0xFFD700);
		this.starValue = this.add.bitmapText(700, 10, 'arcade', 3 - this.starCount).setTint(0xFFD700);
		
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


		this.triggerTimer = this.time.addEvent({
			callback: this.addStar,
			callbackScope: this,
			delay: 600,
			loop: true
		})


	}

	//Spawning content when scrolling

	addObstacle() {
		let bar = this.add.image(Phaser.Math.Between(0, game.config.width), 
			-10, 'bar').setScale(.3);
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


	addStar() {
		if (Phaser.Math.Between(0,1) == 1){
		this.starGroup.create(Phaser.Math.Between(10, (game.config.width-10)), 0, 'star').setScale(0.3)
		this.starGroup.setVelocityY(500)
		}
	}

	collectStar(ship, start){
		start.disableBody(true,true)
		this.score += 10000;
		this.scoreValue.setText(this.score);
		this.starCount += 1;
		this.starValue.setText(3 - this.starCount);
	}	

	update () {
		
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

		if(this.starCount > 2){
			this.music.stop();
			this.scene.start("Endgame")
			
		}

		if(this.ship.y < 0 || this.ship.y > game.config.height){
			this.music.stop();
			//TODO change this to highscore field
			this.scene.start("Intro")
			
		}

	}
 
}

class Endgame extends Phaser.Scene {
	constructor() {
		super("Endgame")
	}

	preload () {
		this.load.spritesheet('ship', 'assets/ship.png', {frameWidth:93, frameHeight: 110});
		this.load.image('boss', 'assets/brain.png');
		this.load.image('bullet', 'assets/bullet7.png');
		this.load.image('alienBullet', 'assets/enemy-bullet.png');
		this.load.audio('blaster', 'assets/blaster.mp3');
		this.load.image('reticle', 'assets/red_ball.png');
		this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml')
	}

	create () {
		this.physics.world.setBoundsCollision(true, true, true, true);
		shipBullets = this.physics.add.group({classType: Bullet, runChildUpdate: true});
		alienBullets = this.physics.add.group({classType: Bullet, runChildUpdate: true});
		this.boss = this.physics.add.sprite(game.config.width/2, game.config.height/9, 'boss').setCollideWorldBounds(true)
		this.ship = this.physics.add.sprite(game.config.width/2, game.config.height/1.2, 'ship').setCollideWorldBounds(true)
		this.ship.body.gravity.y = gameOptions.shipGravity
		reticle = this.physics.add.sprite(800, 700, 'reticle').setCollideWorldBounds(true);
		//Health
		this.boss.health = 3;
		this.ship.health = 3;
		this.add.bitmapText(610, 10, 'arcade', "Boss:").setTint(0xC41E3A);
		this.add.bitmapText(10, 10, 'arcade', "Hull:").setTint(0x0096FF);
		this.bossHealthText = this.add.bitmapText(760, 10, 'arcade', this.boss.health).setTint(0xC41E3A);
		this.shipHealthText = this.add.bitmapText(160, 10, 'arcade', this.ship.health).setTint(0x0096FF);
		//Sound
		
		this.blaster = this.sound.add('blaster');

		//Input
		this.cursors = this.input.keyboard.createCursorKeys()
		
		game.canvas.addEventListener('mousedown', function () { //gives reticle control after left clicking, ESC disables
			game.input.mouse.requestPointerLock();
		});

		this.input.on('pointermove', function (pointer) { 		//reticle follows pointer
			if (this.input.mouse.locked)
			{
				reticle.x += pointer.movementX;
				reticle.y += pointer.movementY;
			}
		}, this);

		//Shooting
		this.input.on('pointerdown', function (pointer, time, lastFired) {
			if (this.ship.active === false)
            return;

			var bullet = shipBullets.get().setActive(true).setVisible(true);
			if (bullet){
				
				bullet.fire(this.ship, reticle);
				this.blaster.play();
				this.physics.add.collider(this.boss, bullet, this.bossHitCallback);
				
			}		
		}, this);


		this.triggerTimer = this.time.addEvent({
			callback: this.bossShoot,
			callbackScope: this,
			delay: 1500,
			loop: true
		})
		
	}

	bossShoot() {
		if (this.boss.active === false)
        return;
		var bullet = alienBullets.get().setActive(true).setVisible(true);
		if (bullet){
				
				bullet.fire(this.boss, this.ship);
				this.physics.add.collider(this.ship, bullet, this.shipHitCallback)		
		}		
	}

	bossHitCallback(boss, bullet) {
		if (bullet.active === true && boss.active === true)
   		{	
			boss.health -= 1;
			if (boss.health <= 0){
				boss.setActive(false).setVisible(false)
			}

		bullet.setActive(false).setVisible(false)
		}
	}

	shipHitCallback(ship, bullet) {
		if (bullet.active === true && ship.active === true)
   		{	
			ship.health -= 1;
			if (ship.health <= 0){
				ship.setActive(false).setVisible(false)	
			}

		bullet.setActive(false).setVisible(false)
		}
	}

	


	update () {
		this.shipHealthText.setText(this.ship.health);
		this.bossHealthText.setText(this.boss.health);
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

		if(this.boss.active === false){
			this.scene.start("TheEnd")
			
		}

		if(this.ship.active === false){
			this.scene.start("Intro")
			
		}


	}
}


class TheEnd extends Phaser.Scene {
	constructor() {
		super("TheEnd")
	}

	preload () {
		this.load.bitmapFont('arcade', 'assets/arcade.png', 'assets/arcade.xml');
	}

	create () {
		this.add.bitmapText(game.config.width/2.8, game.config.height/3, 'arcade', 'The End').setTint(0xd4d4f4);
		this.add.bitmapText(game.config.width/4.8, game.config.height/2, 'arcade', 'Thanks for playing').setTint(0xd4d4f4);
	}
	update () {

	}
}


