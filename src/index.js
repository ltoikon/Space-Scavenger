let game
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
    scene: Junk
  };
  game = new Phaser.Game(config);
  window.focus();
};

class Junk extends Phaser.Scene {

	constructor() {
		super("Junk")
	}

	preload () {
		/*loading assets */
		//this.load.image('name', 'location')
		this.load.spritesheet('ship', 'assets/ship.png', {frameWidth:93, frameHeight: 110});
		this.load.spritesheet('coin', 'assets/coin.png', {frameWidth:32, frameHeight: 32}); //sprite
		this.load.image('sky', 'assets/clouds.png');
		this.load.image('bar', 'assets/pipe3.png');
	}
	
	create () {
		/*everything we use on gameplay: add here collisions, animation, controls  */
		this.obstacleGroup = this.physics.add.group({
			immovable: true,
			allowGravity: false //find out if needed
		})

		
		for(let i = 0; i < 10; i++){
			let bar = this.add.image(Phaser.Math.Between(0, game.config.width), 
			Phaser.Math.Between(-100, game.config.height), 'bar').setScale(.3);
			this.obstacleGroup.add(bar);
			this.obstacleGroup.setVelocityY(100)

		}
		//this.coin = this.physics.add.sprite(Phaser.Math.Between(0, game.config.width), 
		//0, 'coin')

		this.ship = this.physics.add.sprite(game.config.width/2, game.config.height/1.2, 'ship')
		this.ship.body.gravity.y = gameOptions.shipGravity

		this.physics.add.collider(this.ship, this.obstacleGroup)

		this.coinGroup = this.physics.add.group({
			allowGravity: false 
		})
	
		this.physics.add.overlap(this.ship, this.coinGroup, this.collectCoin, null, this)

		//Input

		this.cursors = this.input.keyboard.createCursorKeys()

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
