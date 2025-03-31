import { CONFIG } from './config.js';
import { Player } from './player.js';
import { MarketRisk, Opportunity, Asset, MachineGun, Rocket } from './entities/index.js';
import { UpgradeSystem } from './upgrade.js';

export class Game {
    constructor() {
        // 初始化游戏画布
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        // 游戏状态
        this.gameOver = false;
        this.paused = true; // 初始状态为暂停
        this.gameStarted = false; // 控制游戏是否已经开始
        this.time = 0;
        this.timeScale = 1;
        this.score = CONFIG.INITIAL_SCORE;
        this.level = 1;
        
        // 游戏元素
        this.player = new Player();
        this.markets = []; // 市场风险(敌人)
        this.opportunities = []; // 投资机会(子弹)
        this.assets = []; // 资产(收集物)
        
        // 视觉效果
        this.backgroundParticles = [];
        this.particleTimer = 0;
        
        // 升级系统
        this.upgradeSystem = new UpgradeSystem(this.player);
        
        // 控制输入
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false // 空格键用于发射火箭炮
        };
        this.mouseX = null;
        this.mouseY = null;
        this.mouseDown = false; // 跟踪鼠标按下状态
        this.lastMouseActivity = performance.now(); // 上次鼠标活动时间
        
        // UI引用
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.restartButton = document.getElementById('restart-button');
        this.startScreen = document.getElementById('start-screen');
        this.startButton = document.getElementById('start-button');
        
        // 事件监听
        this.addEventListeners();
        
        // 启动游戏循环
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    addEventListeners() {
        // 添加开始按钮事件
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // 键盘控制
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
            
            // 处理空格键按下 - 发射火箭炮
            if (e.key === ' ' || e.code === 'Space') {
                this.keys.Space = true;
                // 如果火箭炮已就绪，立即发射
                if (this.player.canFireRocket() && this.mouseX && this.mouseY) {
                    this.fireRocket();
                }
            }
            
            // M键切换机枪
            if (e.key === 'm' || e.key === 'M') {
                const machineGunActive = this.player.toggleMachineGun();
                console.log(`机枪${machineGunActive ? '开启' : '关闭'}`);
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
            
            // 处理空格键释放
            if (e.key === ' ' || e.code === 'Space') {
                this.keys.Space = false;
            }
        });
        
        // 鼠标/触摸控制 - 投资方向
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameOver || this.paused) return;
            this.handleMouseMove(e);
        });
        
        // 鼠标按下 - 开始追踪鼠标状态
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameOver || this.paused) return;
            
            if (e.button === 0) { // 左键
                this.mouseDown = true;
                
                // 使用坐标转换方法获取canvas坐标
                const coords = this.convertToCanvasCoordinates(e.clientX, e.clientY);
                this.player.setTarget(coords.x, coords.y);
            } else if (e.button === 2) { // 右键
                // 设置右键鼠标状态为按下
                this.mouseDown = true;
                
                // 使用坐标转换方法获取canvas坐标
                const coords = this.convertToCanvasCoordinates(e.clientX, e.clientY);
                this.mouseX = coords.x;
                this.mouseY = coords.y;
                
                // 如果火箭炮已就绪，立即发射
                if (this.player.canFireRocket() && this.mouseX && this.mouseY) {
                    this.fireRocket();
                    
                    // 阻止右键菜单
                    e.preventDefault();
                    return false;
                }
            }
        });
        
        // 鼠标释放 - 更新鼠标状态
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0 || e.button === 2) {
                this.mouseDown = false;
            }
        });
        
        // 禁用右键菜单
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        // 重新开始按钮
        this.restartButton.addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    // 添加开始游戏方法
    startGame() {
        console.log('开始游戏方法被调用');
        this.gameStarted = true;
        this.paused = false;
        
        // 使用多种方式确保开始界面被隐藏
        this.startScreen.classList.add('hidden');
        this.startScreen.style.display = 'none';
        
        console.log('startScreen元素:', this.startScreen);
        console.log('startScreen类列表:', this.startScreen.classList);
    }
    
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // 检查鼠标是否长时间未活动
        this.clearMouseIfInactive(deltaTime);
        
        if (!this.gameOver && !this.paused) {
            this.update(deltaTime);
            this.render();
            
            // 更新界面数据
            document.getElementById('time-value').textContent = Math.floor(this.time / 1000);
            document.getElementById('score-value').textContent = Math.floor(this.score);
            document.getElementById('level-value').textContent = this.level;
        }
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        // 更新游戏时间
        this.time += deltaTime * this.timeScale;
        
        // 更新玩家位置
        this.player.update(this.keys, deltaTime);
        
        // 生成市场风险(敌人)
        if (Math.random() < CONFIG.MARKET.SPAWN_RATE * this.level * (deltaTime / 16)) {
            this.spawnMarketRisk();
        }
        
        // 生成资产(收集物)
        if (Math.random() < CONFIG.ASSET.SPAWN_RATE * (deltaTime / 16)) {
            this.assets.push(new Asset(this.level));
        }
        
        // 更新背景粒子
        this.updateBackgroundParticles(deltaTime);
        
        // 武器系统 - 发射决策
        this.handleWeaponsUpdate(deltaTime);
        
        // 更新市场风险(敌人)
        this.updateMarkets(deltaTime);
        
        // 更新投资机会(子弹)
        this.updateOpportunities(deltaTime);
        
        // 更新资产(收集物)
        this.updateAssets(deltaTime);
        
        // 检查游戏是否结束
        if (this.score <= 0) {
            this.endGame();
        }
        
        // 升级检查
        if (Math.floor(this.time / CONFIG.LEVEL_UP_TIME) + 1 > this.level) {
            this.levelUp();
        }
    }
    
    // 武器系统 - 处理武器更新和发射
    handleWeaponsUpdate(deltaTime) {
        // 如果没有市场风险，不需要发射
        if (this.markets.length === 0) return;
        
        // 寻找最近的敌人作为目标
        const nearestEnemy = this.findNearestEnemy();
        if (!nearestEnemy) return; // 没有敌人，不发射
        
        // 使用最近敌人的位置作为目标
        const targetX = nearestEnemy.x;
        const targetY = nearestEnemy.y;
        
        // 1. 机枪系统 - 自动连发
        if (this.player.canFireMachineGun()) {
            this.fireMachineGun(targetX, targetY);
        }
        
        // 2. 火箭炮系统 - 自动发射
        if (this.player.canFireRocket()) {
            this.fireRocket(targetX, targetY);
        }
    }
    
    // 寻找最近的敌人
    findNearestEnemy() {
        if (this.markets.length === 0) return null;
        
        let nearestEnemy = null;
        let minDistance = Number.MAX_VALUE;
        
        for (const market of this.markets) {
            const dx = market.x - this.player.x;
            const dy = market.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = market;
            }
        }
        
        return nearestEnemy;
    }
    
    // 发射机枪子弹
    fireMachineGun(targetX, targetY) {
        this.opportunities.push(new MachineGun(
            this.player.x, 
            this.player.y, 
            targetX, 
            targetY, 
            this.player.investmentPower
        ));
        this.player.markMachineGunFired();
    }
    
    // 发射火箭炮
    fireRocket(targetX, targetY) {
        this.opportunities.push(new Rocket(
            this.player.x, 
            this.player.y, 
            targetX, 
            targetY, 
            this.player.investmentPower
        ));
        this.player.markRocketFired();
    }
    
    // 生成市场风险(敌人)
    spawnMarketRisk() {
        // 从配置中随机选择一种风险类型
        const riskTypes = CONFIG.MARKET.TYPES;
        const riskType = riskTypes[Math.floor(Math.random() * riskTypes.length)];
        
        // 根据游戏级别创建风险实体
        this.markets.push(new MarketRisk(this.level, riskType));
    }
    
    updateMarkets(deltaTime) {
        for (let i = this.markets.length - 1; i >= 0; i--) {
            const market = this.markets[i];
            const distance = market.update(this.player.x, this.player.y, deltaTime);
            
            // 检查与玩家的碰撞
            if (distance < this.player.size + market.size) {
                this.score -= market.value;
                this.markets.splice(i, 1);
            }
        }
    }
    
    updateOpportunities(deltaTime) {
        for (let i = this.opportunities.length - 1; i >= 0; i--) {
            const opportunity = this.opportunities[i];
            
            // 根据子弹类型处理更新
            let shouldKeep;
            if (opportunity instanceof Rocket) {
                shouldKeep = opportunity.update(deltaTime);
                
                // 如果是爆炸状态的火箭炮，检查范围伤害
                if (opportunity.isExploding) {
                    this.handleRocketExplosion(opportunity);
                }
            } else {
                shouldKeep = opportunity.update(deltaTime);
            }
            
            // 如果超出范围或完成爆炸，移除机会
            if (!shouldKeep) {
                this.opportunities.splice(i, 1);
                continue;
            }
            
            // 检查与市场的碰撞
            for (let j = this.markets.length - 1; j >= 0; j--) {
                const market = this.markets[j];
                
                if (opportunity.checkCollision(market)) {
                    // 减少市场健康度
                    const isDead = market.takeDamage(opportunity.power);
                    
                    if (isDead) {
                        // 如果是分裂型敌人，检查是否需要分裂
                        const splitEntities = market.trySplit();
                        if (splitEntities) {
                            // 添加新的分裂实体
                            this.markets.push(...splitEntities);
                        }
                        
                        this.score += market.value;
                        this.markets.splice(j, 1);
                    }
                    
                    // 非火箭炮的武器在碰撞后移除
                    if (!(opportunity instanceof Rocket && opportunity.isExploding)) {
                        this.opportunities.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
    
    // 处理火箭炮爆炸的范围伤害
    handleRocketExplosion(rocket) {
        const affectedMarkets = rocket.getEntitiesInExplosionRange(this.markets);
        
        for (let i = affectedMarkets.length - 1; i >= 0; i--) {
            const market = affectedMarkets[i];
            const marketIndex = this.markets.indexOf(market);
            
            if (marketIndex !== -1) {
                // 范围伤害为火箭威力的40%
                const isDead = market.takeDamage(rocket.power * 0.4);
                
                if (isDead) {
                    // 如果是分裂型敌人，检查是否需要分裂
                    const splitEntities = market.trySplit();
                    if (splitEntities) {
                        // 添加新的分裂实体
                        this.markets.push(...splitEntities);
                    }
                    
                    this.score += market.value;
                    this.markets.splice(marketIndex, 1);
                }
            }
        }
    }
    
    updateAssets(deltaTime) {
        for (const asset of this.assets) {
            asset.update(deltaTime);
        }
        
        for (let i = this.assets.length - 1; i >= 0; i--) {
            const asset = this.assets[i];
            
            // 检查与玩家的碰撞
            if (asset.checkCollision(this.player.x, this.player.y, this.player.size)) {
                this.score += asset.value;
                this.assets.splice(i, 1);
            }
        }
    }
    
    // 生成并更新背景粒子
    updateBackgroundParticles(deltaTime) {
        this.particleTimer -= deltaTime;
        
        // 添加新粒子
        if (this.particleTimer <= 0) {
            this.particleTimer = 50 + Math.random() * 100;
            
            const x = Math.random() * CONFIG.CANVAS_WIDTH;
            const y = Math.random() * CONFIG.CANVAS_HEIGHT;
            
            // 随机决定粒子类型
            const type = Math.random() < 0.3 ? 'dollar' : 'circle';
            const size = type === 'dollar' ? 
                12 + Math.random() * 8 : 
                1 + Math.random() * 3;
            
            this.backgroundParticles.push({
                x,
                y,
                size,
                type,
                alpha: 0.05 + Math.random() * 0.1,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                life: 100 + Math.random() * 200,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        // 更新现有粒子
        for (let i = this.backgroundParticles.length - 1; i >= 0; i--) {
            const p = this.backgroundParticles[i];
            
            p.x += p.vx * deltaTime * 0.05;
            p.y += p.vy * deltaTime * 0.05;
            p.life -= deltaTime * 0.05;
            p.rotation += 0.0005 * deltaTime;
            
            if (p.life <= 0) {
                this.backgroundParticles.splice(i, 1);
            }
        }
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // 绘制背景效果
        this.renderBackground();
        
        // 绘制玩家
        this.player.render(this.ctx);
        
        // 绘制市场(敌人)
        for (const market of this.markets) {
            market.render(this.ctx);
        }
        
        // 绘制投资机会(子弹)
        for (const opportunity of this.opportunities) {
            opportunity.render(this.ctx);
        }
        
        // 绘制资产(收集物)
        for (const asset of this.assets) {
            asset.render(this.ctx);
        }
        
        // 绘制游戏状态信息
        this.renderGameInfo();
    }
    
    renderBackground() {
        // 绘制背景粒子
        for (const p of this.backgroundParticles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            
            if (p.type === 'dollar') {
                this.ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
                this.ctx.font = `${p.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('$', 0, 0);
            } else {
                this.ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
        
        // 绘制网格线
        this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.05)';
        this.ctx.lineWidth = 1;
        
        // 横向网格线
        for (let y = 0; y < CONFIG.CANVAS_HEIGHT; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
        
        // 纵向网格线
        for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
            this.ctx.stroke();
        }
    }
    
    renderGameInfo() {
        // 可以在画布上绘制一些额外的游戏状态信息
        // 例如难度、当前时间等
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`难度: ${this.level}`, CONFIG.CANVAS_WIDTH - 20, 30);
        this.ctx.fillText(`时间: ${Math.floor(this.time / 1000)}s`, CONFIG.CANVAS_WIDTH - 20, 55);
    }
    
    levelUp() {
        this.level++;
        this.paused = true;
        
        // 显示升级菜单
        this.upgradeSystem.showMenu(() => {
            this.paused = false;
        });
    }
    
    endGame() {
        this.gameOver = true;
        this.finalScoreDisplay.textContent = Math.floor(this.score);
        this.gameOverScreen.classList.remove('hidden');
        this.startScreen.classList.add('hidden'); // 确保开始界面被隐藏
    }
    
    resetGame() {
        // 重置游戏状态
        this.gameOver = false;
        this.paused = true;
        this.gameStarted = false;
        this.time = 0;
        this.timeScale = 1;
        this.score = CONFIG.INITIAL_SCORE;
        this.level = 1;
        
        // 重置玩家
        this.player.reset();
        
        // 清空游戏元素
        this.markets = [];
        this.opportunities = [];
        this.assets = [];
        this.backgroundParticles = [];
        
        // 重置升级
        this.upgradeSystem.reset();
        
        // 隐藏游戏结束菜单
        this.gameOverScreen.classList.add('hidden');
        
        // 直接开始新游戏，而不是显示开始界面
        this.startGame();
    }

    // 添加坐标转换方法 - 将浏览器显示坐标转换为canvas内部坐标
    convertToCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        // 获取相对于canvas的位置
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        
        // 计算缩放比例
        const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
        const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
        
        // 应用缩放比例
        return {
            x: x * scaleX,
            y: y * scaleY
        };
    }

    // 处理鼠标移动
    handleMouseMove(e) {
        // 使用坐标转换方法获取canvas坐标
        const coords = this.convertToCanvasCoordinates(e.clientX, e.clientY);
        this.mouseX = coords.x;
        this.mouseY = coords.y;
        
        // 更新上次鼠标活动时间
        this.lastMouseActivity = performance.now();
    }

    // 每帧开始时清除鼠标位置，如果超过一定时间没有鼠标活动
    clearMouseIfInactive(deltaTime) {
        // 如果超过1秒没有鼠标活动，清除鼠标位置
        if (this.lastMouseActivity && performance.now() - this.lastMouseActivity > 1000) {
            this.mouseX = null;
            this.mouseY = null;
        }
    }
} 