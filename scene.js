class Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Scene" });
    this.state = 0;
    this.score = 0;
    this.speed = 2;
    this.minDistance = 50;
    this.maxDistance = 300;
    this.minWidth = 50;
    this.maxWidth = 250;
  }

  preload() {
    this.load.spritesheet('player', 'assets/rabbit3 - doux.png', {
      frameWidth: 72, frameHeight: 72
    });
  }

  create() {
    this.state = 0;
    this.score = 0;

    this.player = this.add.sprite(200, 520, 'player');
    this.player.setOrigin(1, 1);
    this.player.setScale(0.75);
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player', { start: 5, end: 7 }),
      frameRate: 10,
      repeat: 1
    });

    this.distance = Phaser.Math.Between(this.minDistance, this.maxDistance); //隨機整數
    let x = 200 + this.distance;
    let width = Phaser.Math.Between(this.minWidth, this.maxWidth);
    this.platform1 = this.add.rectangle(200, 720, 100, 200, 0x000000); // (x, y, width, height, color)
    this.platform1.setOrigin(1, 1);
    this.platform2 = this.add.rectangle(x, 720, width, 200, 0x000000);
    this.platform2.setOrigin(0, 1);

    this.bridge = this.add.rectangle(200, 520, 5, 0, 0x000000);
    this.bridge.setOrigin(0, 0);
    this.bridge.angle = 180;

    let scoreBackground = this.add.graphics();
    scoreBackground.fillStyle(0x000000, 0.3); // 半透明
    scoreBackground.fillRoundedRect(50, 40, 100, 50, 10); // 圓角矩形
    this.scoreText = this.add.text(100, 65, this.score, {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#000000'
    });
    this.scoreText.setOrigin(0.5);

    this.keys = this.input.keyboard.addKeys({
      r: Phaser.Input.Keyboard.KeyCodes.R,
      z: Phaser.Input.Keyboard.KeyCodes.Z, // 測試用
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.state = 1;
    console.log("ready");
  }

  //動畫
  bridgeRotate() {
    this.tweens.add({
      targets: this.bridge,
      angle: -90,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        if (this.bridge.height >= this.distance &&
          this.bridge.height <= this.distance + this.platform2.width) {
          this.state = 2;
        }
        else {
          this.state = 3;
        }
      }
    });
  }

  //動畫
  Fall() {
    this.tweens.add({
      targets: this.bridge,
      angle: 0,
      duration: 100,
      ease: 'Linear'
    });
    this.tweens.add({
      targets: this.player,
      y: 720 + this.player.height,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        this.state = 6;
      }
    });
  }


  update() {
    switch (this.state) {
      case 0: // waiting for animation
        break;

      case 1: // build bridge
        if (this.keys.space.isDown || this.input.activePointer.isDown) {
          this.bridge.height += this.speed;
        }
        else if (this.bridge.height != 0) {
          this.bridgeRotate();
          this.state = 0;

          if (this.bridge.height >= this.distance &&
            this.bridge.height <= this.distance + this.platform2.width) {
            this.success = true;
          }
          else {
            this.success = false;
          }
        }
        break;

      case 2: // success, walking through the bridge
        if (this.player.x < this.platform2.x + this.platform2.width) {
          this.player.anims.play("walk", true);
          this.player.x += this.speed;
        }
        else {
          this.player.anims.stop();
          this.player.setFrame(0);
          this.score += 1;
          this.scoreText.setText(this.score);
          this.state = 4;
        }

        break;

      case 3: // not success, fall
        if (this.player.x < this.bridge.height + this.platform1.x) {
          this.player.anims.play("walk", true);
          this.player.x += this.speed;
        }
        else {
          this.player.anims.stop();
          this.player.setFrame(0);
          this.Fall();
          this.state = 0;
        }
        break;

      case 4: // moving camera
        if (this.platform2.x > 200 - this.platform2.width) {
          this.platform1.x -= this.speed;
          this.platform2.x -= this.speed;
          this.player.x -= this.speed;
          this.bridge.x -= this.speed;
        }
        else {
          this.state = 5;
        }
        break;

      case 5: // generate new platform
        this.bridge.height = 0;
        this.bridge.angle = 180;
        this.bridge.setPosition(200, 520);

        this.platform1.width = this.platform2.width;
        this.platform1.setOrigin(1, 1);
        this.platform1.x = 200;

        let width = Phaser.Math.Between(this.minWidth, this.maxWidth); //隨機整數
        this.distance = Phaser.Math.Between(this.minDistance, this.maxDistance);
        let x = this.distance + 200;
        this.platform2.width = 0;
        this.platform2.setOrigin(0, 1);
        this.platform2.x = x;
        this.platform2.width = width;

        this.state = 1;
        break;

      case 6: // waiting for restart
        if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
          this.scene.start(); // 重新開始
        }
        break;
    }



    //test
    if (Phaser.Input.Keyboard.JustDown(this.keys.z)) {
      console.log("state: ", this.state);
      console.log("score: ", this.score);
      console.log("[platform1]");
      console.log("width:", this.platform1.width);
      console.log("position: ", this.platform1.x, this.platform1.y);
      console.log("origin: ", this.platform1.originX, this.platform1.originY);
      console.log("[platform2]");
      console.log("width:", this.platform2.width);
      console.log("position: ", this.platform2.x, this.platform2.y);
      console.log("origin: ", this.platform2.originX, this.platform2.originY);
      console.log("bridge.height: ", this.bridge.height);
      console.log("distance: ", this.distance);
      console.log("");
    }
  }
}