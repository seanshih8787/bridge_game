class Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Scene" });
    this.state = 0;
    this.score = 0;
    this.speed = 4;
    this.minDistance = 50;
    this.maxDistance = 300;
    this.minWidth = 70;
    this.maxWidth = 250;
    this.clouds = [];
    this.restartUIShown = false;
  }

  preload() {
    this.load.spritesheet('player', 'assets/Walk.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('player_idle', 'assets/Idle.png', { frameWidth: 48, frameHeight: 48 });
    this.load.image('platform', 'assets/platform.png');
    this.load.image('sky', 'assets/sky.jpg');
    this.load.image('cloud', 'assets/cloud.png');

    this.load.audio('death', 'assets/death.mp3');
    this.load.audio('impact', 'assets/impact.mp3');
    this.load.audio('bgm', 'assets/background.mp3');
    this.load.audio('bark', 'assets/bark.mp3');
  }

  create() {

    //音效創建
    this.death_sound = this.sound.add('death');
    this.bark_sound = this.sound.add('bark');
    this.impact_sound = this.sound.add('impact');
    if (!this.sound.get('bgm')) {
      this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
      this.bgm.play();
    }

    this.restartUIShown = false;

    // 獲取動態畫布尺寸
    const { width, height } = this.game.config;


    this.state = 0;
    this.score = 0;

    ////背景/////
    // 天空背景，適應畫布尺寸
    this.sky = this.add.tileSprite(0, 0, width, height, 'sky').setOrigin(0, 0);
    // 添加雲，隨機位置和速度
    for (let i = 0; i < 4; i++) {
      let x = Phaser.Math.Between(0, width);
      let y = Phaser.Math.Between(0.1 * height, 0.4 * height);
      let cloud = this.add.sprite(x, y, 'cloud').setScale(0.5 + Math.random() * 0.5);
      cloud.speed = 0.2 + Math.random() * 0.3;
      this.clouds.push(cloud);
    }



    // 玩家位置，基於畫布尺寸
    this.player = this.add.sprite(0.25 * width, 0.75 * height, 'player');
    this.player.setOrigin(1, 1);
    this.player.setScale(2);
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 1
    });
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 5 }),
      frameRate: 6,    // 播放速度（每秒幾格）
      repeat: -1       // 無限循環
    });

    // 平台和橋的位置與尺寸
    this.distance = Phaser.Math.Between(this.minDistance, this.maxDistance);
    let platformX = 0.25 * width + this.distance;
    let platformWidth = Phaser.Math.Between(this.minWidth, this.maxWidth);
    this.platform1 = this.add.image(0.25 * width, height, 'platform');
    this.platform1.setOrigin(1, 1);
    this.platform1.setDisplaySize(0.125 * width, 0.25 * height);

    this.platform2 = this.add.image(platformX, height, 'platform');
    this.platform2.setOrigin(0, 1);
    this.platform2.setDisplaySize(platformWidth, 0.25 * height);

    this.bridge = this.add.rectangle(0.25 * width, 0.75 * height, 5, 0, 0x654321);
    this.bridge.setOrigin(0, 0);
    this.bridge.angle = 180;
    this.bridge.height = 0;


    // 分數背景和文字
    this.scoreText = this.add.text(0.125 * width, 0.095 * height, this.score, {
      fontFamily: '"Press Start 2P"',
      fontSize: `${0.028 * height}px`, // 可視情況略調整
      color: '#fefcb2ff',
      padding: { bottom: 6 } // 防止被切
    }).setOrigin(0.5);


    this.keys = this.input.keyboard.addKeys({
      r: Phaser.Input.Keyboard.KeyCodes.R,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.state = 1;
    console.log("ready");
  }

  bridgeRotate() {
    this.tweens.add({
      targets: this.bridge,
      angle: -90,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        if (this.bridge.height >= this.distance &&
          this.bridge.height <= this.distance + this.platform2.displayWidth) {
          this.state = 2;
        } else {
          this.state = 3;
        }
      }
    });
  }

  Fall() {
    const { height } = this.game.config;
    this.tweens.add({
      targets: this.bridge,
      angle: 0,
      duration: 100,
      ease: 'Linear'
    });
    this.tweens.add({
      targets: this.player,
      y: height + this.player.height,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        this.state = 6;
      }
    });
  }

  update() {
    const { width, height } = this.game.config;

    // 天空和雲滾動
    this.sky.tilePositionX += 0.2;
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x < -cloud.displayWidth) {
        // 回到右邊，不用等所有雲飄完
        cloud.x = width + Phaser.Math.Between(0, 200);
        cloud.y = Phaser.Math.Between(0.1 * height, 0.4 * height);
        cloud.speed = 0.2 + Math.random() * 0.3;
        cloud.setScale(0.5 + Math.random() * 0.5);
      }
    });

    switch (this.state) {
      case 0: // waiting for animation
        break;

      case 1: // build bridge
        if (!this.player.anims.isPlaying || this.player.anims.getName() !== 'idle') {
          this.player.anims.play('idle', true);
        }
        if (this.keys.space.isDown || this.input.activePointer.isDown) {
          this.bridge.height += this.speed;
        }
        else if (this.bridge.height != 0) {
          this.bridgeRotate();
          //音效播放
          if (!this.impact_sound.isPlaying) {
            this.impact_sound.play({ loop: false }); // 循環播放
          }
          this.state = 0;
          if (this.bridge.height >= this.distance &&
            this.bridge.height <= this.distance + this.platform2.displayWidth) {
            this.success = true;
          }
          else {
            this.success = false;
          }
        }
        break;

      case 2: // success, walking through the bridge
        if (this.player.x < this.platform2.x + this.platform2.displayWidth) {
          this.player.anims.play("walk", true);
          this.player.x += this.speed;
        } else {
          this.player.anims.stop();
          if (!this.bark_sound.isPlaying) {
            this.bark_sound.play({ loop: false }); // 循環播放
          }
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
        } else {
          this.player.anims.stop();
          this.player.setFrame(0);
          //音效播放
          if (!this.death_sound.isPlaying) {
            this.death_sound.play({ loop: false }); // 循環播放
          }
          this.Fall();
          this.state = 0;
        }
        break;

      case 4: // 鏡頭移動
        if (!this.player.anims.isPlaying || this.player.anims.getName() !== 'idle') {
          this.player.anims.play('idle', true);
        }
        if (this.player.x > 0.25 * width) {
          this.platform1.x -= this.speed;
          this.platform2.x -= this.speed;
          this.player.x -= this.speed;
          this.bridge.x -= this.speed;
        } else {
          this.state = 5;
        }
        break;

      case 5: // generate new platform
        this.bridge.height = 0;
        this.bridge.angle = 180;
        this.bridge.setPosition(0.25 * width, 0.75 * height);

        this.platform1.displayWidth = this.platform2.displayWidth;
        this.platform1.setOrigin(1, 1);
        this.platform1.x = 0.25 * width;

        const platformWidth = Phaser.Math.Between(this.minWidth, this.maxWidth);
        this.distance = Phaser.Math.Between(this.minDistance, this.maxDistance);
        const newX = this.distance + 0.25 * width;
        this.platform2.setOrigin(0, 1);
        this.platform2.x = newX;
        this.platform2.setDisplaySize(platformWidth, 0.25 * height);

        this.state = 1;
        break;

      case 6: // waiting for restart
        if (!this.restartUIShown) {
          this.restartUIShown = true;

          // 視窗寬高與位置
          const panelWidth = 0.5 * width;
          const panelHeight = 0.3 * height;
          const panelX = width / 2 - panelWidth / 2;
          const panelY = height / 2 - panelHeight / 2;

          // 背景視窗（亮色 + 圓角）
          const panel = this.add.graphics();
          panel.fillStyle(0xffffff, 0.9); // 亮色背景
          panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

          // 顯示最終分數
          this.add.text(width / 2, height / 2 - 0.05 * height, `最終分數：${this.score}`, {
            fontFamily: '"Press Start 2P"', // 使用像素字體
            padding: { top: 0, bottom: 10 }, // 加一點底部 padding
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
          }).setOrigin(0.5);

          // 顯示提示文字
          this.add.text(width / 2, height / 2 + 0.05 * height, '按任意鍵重新開始', {
            fontFamily: '"Press Start 2P"',
            padding: { top: 0, bottom: 10 }, // 加一點底部 padding
            fontSize: '25px',
            color: '#444444',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
          }).setOrigin(0.5);

          // 監聽重新開始事件（一次即可）
          this.input.keyboard.once('keydown', () => {
            this.time.delayedCall(200, () => { // 延遲 200ms
              this.scene.restart();
            });
          });
          this.input.once('pointerdown', () => {
            this.time.delayedCall(200, () => { // 延遲 200ms
              this.scene.restart();
            });
          });
        }
        break;
    }


    // 測試用
    if (Phaser.Input.Keyboard.JustDown(this.keys.z)) {
      console.log("state: ", this.state);
      console.log("score: ", this.score);
      console.log("[platform1]");
      console.log("width:", this.platform1.displayWidth);
      console.log("position: ", this.platform1.x, this.platform1.y);
      console.log("origin: ", this.platform1.originX, this.platform1.originY);
      console.log("[platform2]");
      console.log("width:", this.platform2.displayWidth);
      console.log("position: ", this.platform2.x, this.platform2.y);
      console.log("origin: ", this.platform2.originX, this.platform2.originY);
      console.log("bridge.height: ", this.bridge.height);
      console.log("distance: ", this.distance);
      console.log("");
    }
  }
}