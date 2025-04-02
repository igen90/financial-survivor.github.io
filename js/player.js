import { CONFIG } from './config.js';

export class Player {
    constructor() {
        this.x = CONFIG.CANVAS_WIDTH / 2;
        this.y = CONFIG.CANVAS_HEIGHT / 2;
        this.size = CONFIG.PLAYER.SIZE * 2;
        this.speed = CONFIG.PLAYER.SPEED;
        this.investmentPower = CONFIG.PLAYER.INVESTMENT_POWER;
        this.investmentRadius = CONFIG.PLAYER.INVESTMENT_RADIUS * 1.5;
        this.investmentRate = CONFIG.PLAYER.INVESTMENT_RATE;
        this.lastInvestmentTime = 0;
        this.targetX = null;
        this.targetY = null;
        
        // 添加血量相关属性
        this.maxHealth = 100;
        this.health = this.maxHealth;
        
        // 视觉效果参数
        this.rotation = 0;
        this.pulseAmount = 0;
        this.particles = [];
        this.timeToNextParticle = 0;
        
        // 粒子效果色彩
        this.particleColors = [
            '52, 152, 219',  // 蓝色
            '41, 128, 185',  // 深蓝色
            '155, 89, 182',  // 紫色
            '52, 73, 94'     // 深灰蓝色
        ];
        
        // 投资者特有参数
        this.icons = ["$", "€", "¥", "£"];
        this.currentIcon = 0;
        this.iconChangeTimer = 0;
        this.iconChangeRate = 2000; // 2秒切换一次图标
        
        // 投资者光环效果
        this.auraSize = this.size * 2.5;
        this.auraOpacity = 0.3;
        
        // 武器系统 - 新增
        this.machineGunRate = CONFIG.PLAYER.MACHINE_GUN_RATE;
        this.lastMachineGunTime = 0;
        this.rocketCooldown = CONFIG.PLAYER.ROCKET_COOLDOWN;
        this.lastRocketTime = 0;
        this.rocketReady = true;
        this.rocketCooldownRemaining = 0;
        this.machineGunActive = true; // 默认打开机枪自动射击
    }
    
    update(keys, deltaTime) {
        // 先处理点击移动
        if (this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果已经足够接近目标，就停止移动
            if (distance < this.speed) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.targetX = null;
                this.targetY = null;
            } else {
                // 向目标移动
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
                
                // 设置旋转方向 - 根据移动方向
                this.rotation = Math.atan2(dy, dx);
            }
        } else {
            // 如果没有点击目标，按照键盘控制移动
            let hasMoved = false;
            let dx = 0, dy = 0;
            
            if (keys.ArrowUp && this.y > this.size) {
                this.y -= this.speed;
                dy -= 1;
                hasMoved = true;
            }
            if (keys.ArrowDown && this.y < CONFIG.CANVAS_HEIGHT - this.size) {
                this.y += this.speed;
                dy += 1;
                hasMoved = true;
            }
            if (keys.ArrowLeft && this.x > this.size) {
                this.x -= this.speed;
                dx -= 1;
                hasMoved = true;
            }
            if (keys.ArrowRight && this.x < CONFIG.CANVAS_WIDTH - this.size) {
                this.x += this.speed;
                dx += 1;
                hasMoved = true;
            }
            
            // 如果有移动，更新旋转方向
            if (hasMoved && (dx !== 0 || dy !== 0)) {
                this.rotation = Math.atan2(dy, dx);
            }
        }
        
        // 确保玩家不会超出边界
        this.x = Math.max(this.size, Math.min(CONFIG.CANVAS_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.CANVAS_HEIGHT - this.size, this.y));
        
        // 更新视觉效果
        this.pulseAmount = Math.sin(performance.now() * 0.003) * 0.2;
        
        // 随机添加粒子
        this.timeToNextParticle -= deltaTime;
        if (this.timeToNextParticle <= 0) {
            this.addParticle();
            this.timeToNextParticle = 100 + Math.random() * 200;
        }
        
        // 定期切换货币符号
        this.iconChangeTimer += deltaTime;
        if (this.iconChangeTimer >= this.iconChangeRate) {
            this.currentIcon = (this.currentIcon + 1) % this.icons.length;
            this.iconChangeTimer = 0;
        }
        
        // 更新火箭炮冷却时间
        if (!this.rocketReady) {
            this.rocketCooldownRemaining = Math.max(0, this.rocketCooldown - (performance.now() - this.lastRocketTime));
            if (this.rocketCooldownRemaining === 0) {
                this.rocketReady = true;
            }
        }
        
        // 更新粒子
        this.updateParticles(deltaTime);
    }
    
    // 判断是否可以发射机枪
    canFireMachineGun() {
        const timeSinceLastShot = performance.now() - this.lastMachineGunTime;
        const fireRate = 1000 / this.machineGunRate; // 计算每发子弹的时间间隔
        return this.machineGunActive && (timeSinceLastShot >= fireRate);
    }
    
    // 判断是否可以发射火箭炮
    canFireRocket() {
        return this.rocketReady;
    }
    
    // 标记已发射机枪
    markMachineGunFired() {
        this.lastMachineGunTime = performance.now();
    }
    
    // 标记已发射火箭炮
    markRocketFired() {
        this.lastRocketTime = performance.now();
        this.rocketReady = false;
        this.rocketCooldownRemaining = this.rocketCooldown;
    }
    
    // 获取火箭炮冷却进度 (0-1)
    getRocketCooldownProgress() {
        if (this.rocketReady) return 1;
        return 1 - (this.rocketCooldownRemaining / this.rocketCooldown);
    }
    
    // 切换机枪的开关状态
    toggleMachineGun() {
        this.machineGunActive = !this.machineGunActive;
        return this.machineGunActive;
    }
    
    addParticle() {
        // 随机角度
        const angle = Math.random() * Math.PI * 2;
        // 距离中心的随机距离
        const dist = this.size * 0.3 + Math.random() * this.size * 0.7;
        // 随机颜色
        const colorIndex = Math.floor(Math.random() * this.particleColors.length);
        
        this.particles.push({
            x: this.x + Math.cos(angle) * dist,
            y: this.y + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: 1 + Math.random() * 2,
            color: this.particleColors[colorIndex],
            alpha: 0.7 + Math.random() * 0.3,
            life: 30 + Math.random() * 30
        });
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // 更新位置
            p.x += p.vx * deltaTime * 0.05;
            p.y += p.vy * deltaTime * 0.05;
            
            // 减少透明度和寿命
            p.alpha -= 0.01 * deltaTime * 0.05;
            p.life -= deltaTime * 0.05;
            
            // 如果粒子消失，从数组中移除
            if (p.alpha <= 0 || p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // 绘制血量条背景
        const healthBarWidth = this.size * 2;
        const healthBarHeight = 4;
        const healthBarX = this.x - healthBarWidth / 2;
        const healthBarY = this.y + this.size + 6;  // 改为图标下方
        
        // 血量条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // 血量条
        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = healthPercentage > 0.6 ? '#2ecc71' : 
                       healthPercentage > 0.3 ? '#f1c40f' : '#e74c3c';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
        
        // 血量条边框
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // 绘制粒子效果
        this.renderParticles(ctx);
        
        // 绘制投资范围指示器
        this.renderInvestmentRange(ctx);
        
        // 绘制移动目标线
        this.renderMovementTarget(ctx);
        
        // 绘制玩家
        this.renderPlayer(ctx);
        
        // 绘制火箭炮冷却指示器
        this.renderRocketCooldown(ctx);
        
        ctx.restore();
    }
    
    renderParticles(ctx) {
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderInvestmentRange(ctx) {
        // 投资范围指示器
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.investmentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 辅助线
        ctx.setLineDash([]);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.1)';
        // 水平线
        ctx.beginPath();
        ctx.moveTo(this.x - this.investmentRadius, this.y);
        ctx.lineTo(this.x + this.investmentRadius, this.y);
        ctx.stroke();
        // 垂直线
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.investmentRadius);
        ctx.lineTo(this.x, this.y + this.investmentRadius);
        ctx.stroke();
    }
    
    renderMovementTarget(ctx) {
        // 如果有移动目标，绘制目标指示器
        if (this.targetX !== null && this.targetY !== null) {
            // 连接线
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetX, this.targetY);
            ctx.stroke();
            
            // 目标点
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // 目标外圈
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    renderPlayer(ctx) {
        const pulseScale = 1 + this.pulseAmount;
        
        // 玩家外部光环 - 投资者特有
        this.renderInvestorAura(ctx, pulseScale);
        
        // 玩家外圈
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 玩家内圈
        const innerGradient = ctx.createRadialGradient(
            this.x - this.size * 0.3, this.y - this.size * 0.3, 0,
            this.x, this.y, this.size
        );
        innerGradient.addColorStop(0, '#5dade2');
        innerGradient.addColorStop(1, '#2980b9');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制投资者符号 - 交替显示不同货币图标
        this.renderCurrencyIcon(ctx);
    }
    
    // 绘制投资者特有的光环效果
    renderInvestorAura(ctx, pulseScale) {
        // 外层光晕
        const outerGradient = ctx.createRadialGradient(
            this.x, this.y, this.size * 0.5,
            this.x, this.y, this.auraSize * pulseScale
        );
        outerGradient.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
        outerGradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.2)');
        outerGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.auraSize * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        
        // 内层明亮光环
        const innerGlow = ctx.createRadialGradient(
            this.x, this.y, this.size * 0.8,
            this.x, this.y, this.size * 1.5
        );
        innerGlow.addColorStop(0, 'rgba(52, 152, 219, 0.7)');
        innerGlow.addColorStop(1, 'rgba(52, 152, 219, 0)');
        
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制交替变化的货币符号
    renderCurrencyIcon(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 绘制文本 - 增大符号尺寸
        ctx.font = 'bold 32px Arial'; // 原来是16px
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icons[this.currentIcon], 0, 0);
        
        ctx.restore();
    }
    
    // 绘制火箭炮冷却指示器
    renderRocketCooldown(ctx) {
        if (!this.rocketReady) {
            // 绘制冷却指示环
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const progress = this.getRocketCooldownProgress();
            const cooldownRadius = this.size * 1.8; // 增大冷却指示环
            
            // 底层灰色完整圆
            ctx.beginPath();
            ctx.arc(0, 0, cooldownRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.lineWidth = 6; // 加粗线条
            ctx.stroke();
            
            // 进度层
            ctx.beginPath();
            ctx.arc(0, 0, cooldownRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 6; // 加粗线条
            ctx.stroke();
            
            // 显示冷却百分比文本
            ctx.font = 'bold 24px Arial'; // 增大字体
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.floor(progress * 100)}%`, 0, cooldownRadius + 20);
            
            ctx.restore();
        }
    }
    
    // 设置鼠标点击目标
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    // 重置玩家状态
    reset() {
        this.x = CONFIG.CANVAS_WIDTH / 2;
        this.y = CONFIG.CANVAS_HEIGHT / 2;
        this.size = CONFIG.PLAYER.SIZE * 2;
        this.speed = CONFIG.PLAYER.SPEED;
        this.investmentPower = CONFIG.PLAYER.INVESTMENT_POWER;
        this.investmentRadius = CONFIG.PLAYER.INVESTMENT_RADIUS * 1.5;
        this.investmentRate = CONFIG.PLAYER.INVESTMENT_RATE;
        this.lastInvestmentTime = 0;
        this.targetX = null;
        this.targetY = null;
        this.particles = [];
        this.currentIcon = 0;
        this.iconChangeTimer = 0;
        this.lastMachineGunTime = 0;
        this.lastRocketTime = 0;
        this.rocketReady = true;
        this.rocketCooldownRemaining = 0;
        this.machineGunActive = true;
        this.health = this.maxHealth;
    }
    
    // 判断玩家是否在移动
    isMoving() {
        // 检查是否通过键盘移动
        const keyboardMoving = this.vx !== 0 || this.vy !== 0;
        
        // 检查是否有移动目标
        const hasTarget = this.targetX !== null && this.targetY !== null;
        
        // 如果有目标，检查是否已到达目标（允许小误差）
        let reachedTarget = false;
        if (hasTarget) {
            const dx = this.x - this.targetX;
            const dy = this.y - this.targetY;
            const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
            reachedTarget = distanceToTarget < 5; // 5像素误差范围内视为到达
            
            // 如果已经到达目标，清除目标位置
            if (reachedTarget) {
                this.targetX = null;
                this.targetY = null;
            }
        }
        
        return keyboardMoving || (hasTarget && !reachedTarget);
    }
}