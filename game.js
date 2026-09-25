const config = {
    type: Phaser.AUTO,
    width: 3840,
    height: 2160,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false,
            enableBody: true,
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let walls;
let platforms;
let spikes;
let checkpoint;
let checkpointPos;
let isWallSticking = false;
let currentWall = null;
let canWallJump = false;
let wallJumpCooldown = 0;
let score = 0;
let level = 1;

function preload() {
}

function create() {
    // Create physics groups
    walls = this.physics.add.staticGroup();
    platforms = this.physics.add.staticGroup();
    spikes = this.physics.add.staticGroup();

    // Create player
    player = this.add.rectangle(100, 300, 40, 60, 0x00ff00);
    this.physics.add.existing(player);
    player.body.setBounce(0.1);
    player.body.setDrag(0);
    player.canJump = false;
    player.facingLeft = false;

    // Setup collisions
    this.physics.add.collider(player, platforms, () => {
        player.canJump = true;
        isWallSticking = false;
        currentWall = null;
    });

    this.physics.add.collider(player, walls, () => {
        handleWallCollision(player, walls);
    });

    this.physics.add.overlap(player, spikes, () => {
        respawnPlayer();
    });

    this.physics.add.overlap(player, checkpoint, () => {
        checkpointPos = { x: player.x, y: player.y };
        score += 100;
    });

    // Create level
    createLevel(this);

    // Store input
    this.input = this.input;
    this.keys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
        dashLeft: Phaser.Input.Keyboard.KeyCodes.Q,
        dashRight: Phaser.Input.Keyboard.KeyCodes.E
    });

    // Create text
    this.scoreText = this.add.text(50, 50, 'Score: 0', {
        fontSize: '48px',
        fill: '#ffffff'
    }).setScrollFactor(0);

    this.levelText = this.add.text(50, 120, 'Level: 1', {
        fontSize: '48px',
        fill: '#ffffff'
    }).setScrollFactor(0);

    this.instructionsText = this.add.text(50, 190, 'A/D: Move | SPACE: Jump | Q/E: Dash', {
        fontSize: '32px',
        fill: '#aaaaaa'
    }).setScrollFactor(0);

    checkpointPos = { x: 100, y: 300 };

    // Camera follow
    this.cameras.main.setBounds(0, 0, 7680, 2160);
    this.cameras.main.startFollow(player);
}

function update() {
    const cursors = this.keys;
    const speed = 300;

    // Horizontal movement
    if (cursors.left.isDown) {
        player.body.setVelocityX(-speed);
        player.facingLeft = true;
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(speed);
        player.facingLeft = false;
    } else {
        player.body.setVelocityX(0);
    }

    // Jump
    if (cursors.jump.isDown && (player.canJump || canWallJump)) {
        player.body.setVelocityY(-400);
        player.canJump = false;
        
        if (canWallJump && currentWall) {
            // Wall jump away from wall
            const jumpDir = currentWall.body.x > player.x ? -1 : 1;
            player.body.setVelocityX(jumpDir * 350);
            canWallJump = false;
            isWallSticking = false;
        }
    }

    // Dash
    if (cursors.dashLeft.isDown) {
        player.body.setVelocityX(-600);
    }
    if (cursors.dashRight.isDown) {
        player.body.setVelocityX(600);
    }

    // Wall stick physics
    if (isWallSticking && currentWall) {
        player.body.setVelocityY(Math.min(player.body.velocity.y, 100));
        canWallJump = true;
    } else {
        canWallJump = false;
    }

    wallJumpCooldown--;

    // Update UI
    this.scoreText.setText('Score: ' + score);
    this.levelText.setText('Level: ' + level);
}

function handleWallCollision(player, wallsGroup) {
    if (wallJumpCooldown <= 0 && Math.abs(player.body.velocity.x) > 50) {
        isWallSticking = true;
        currentWall = wallsGroup.getChildren()[0];
        wallJumpCooldown = 15;
        player.body.setVelocity(0, 0);
    }
}

function createLevel(scene) {
    // Ground
    platforms.create(100, 1000, null).setScale(0.1).refreshBody();
    let ground = scene.add.rectangle(1920, 1050, 7680, 100, 0x8b4513);
    scene.physics.add.existing(ground, true);
    platforms.add(ground);

    // Starting platform
    let startPlat = scene.add.rectangle(100, 950, 200, 50, 0x0088ff);
    scene.physics.add.existing(startPlat, true);
    platforms.add(startPlat);

    // Wall 1
    let wall1 = scene.add.rectangle(400, 850, 80, 300, 0xff0000);
    scene.physics.add.existing(wall1, true);
    walls.add(wall1);

    // Platform after wall
    let plat2 = scene.add.rectangle(600, 750, 150, 50, 0x0088ff);
    scene.physics.add.existing(plat2, true);
    platforms.add(plat2);

    // Wall 2
    let wall2 = scene.add.rectangle(900, 650, 80, 400, 0xff0000);
    scene.physics.add.existing(wall2, true);
    walls.add(wall2);

    // Platform 3
    let plat3 = scene.add.rectangle(1200, 500, 150, 50, 0x0088ff);
    scene.physics.add.existing(plat3, true);
    platforms.add(plat3);

    // Spikes
    let spike1 = scene.add.rectangle(500, 900, 100, 30, 0xffff00);
    scene.physics.add.existing(spike1, true);
    spikes.add(spike1);

    // Checkpoint
    checkpoint = scene.physics.add.sprite(1300, 450, null);
    checkpoint.setDisplaySize(100, 50);
    let checkpointGfx = scene.add.rectangle(1300, 450, 100, 50, 0x00ff00);

    // Final platform (goal)
    let goal = scene.add.rectangle(1600, 300, 150, 50, 0xffff00);
    scene.physics.add.existing(goal, true);
    platforms.add(goal);

    // More walls and platforms for difficulty
    let wall3 = scene.add.rectangle(1800, 600, 80, 300, 0xff0000);
    scene.physics.add.existing(wall3, true);
    walls.add(wall3);

    let plat4 = scene.add.rectangle(2100, 500, 150, 50, 0x0088ff);
    scene.physics.add.existing(plat4, true);
    platforms.add(plat4);

    // Spike obstacles
    for (let i = 0; i < 5; i++) {
        let spike = scene.add.rectangle(1400 + (i * 150), 550, 80, 30, 0xffff00);
        scene.physics.add.existing(spike, true);
        spikes.add(spike);
    }
}

function respawnPlayer() {
    player.x = checkpointPos.x;
    player.y = checkpointPos.y;
    player.body.setVelocity(0, 0);
    isWallSticking = false;
    currentWall = null;
    score = Math.max(0, score - 50);
}