import { CONFIG } from '../config.js';

// 基础市场风险类（敌人）
export class MarketRisk {
    constructor(level, type) {
        this.type = type;
        this.id = type.id;
        this.name = type.name;
        this.color = type.color;
        this.behavior = type.behavior;
        
        // 根据级别调整属性
        this.size = type.baseSize + Math.random() * 5;
        this.speed = type.baseSpeed * (1 + Math.random() * 0.5);
        this.health = type.baseHealth + Math.floor(level / 2);
        this.value = Math.floor(type.baseValue + Math.random() * 10 * level);
        
        // 初始化行为特定的属性
        this.initBehaviorProps();
        
        // 从四个边随机选择一个作为出生点
        this.setSpawnPosition();
        
        // 粒子效果初始化
        this.particles = [];
        if (Math.random() > 0.5) {
            this.generateParticles();
        }
    }
    
    initBehaviorProps() {
        switch (this.behavior) {
            case 'zigzag':
                // 锯齿形移动的振幅和频率
                this.amplitude = 30 + Math.random() * 20;
                this.frequency = 0.05 + Math.random() * 0.03;
                this.phase = Math.random() * Math.PI * 2;
                this.baseX = this.x;
                this.baseY = this.y;
                this.time = 0;
                break;
                
            case 'growing':
                // 增长参数
                this.growthRate = 0.0005 + Math.random() * 0.0003;
                this.maxSize = this.size * 2;
                this.originalSize = this.size;
                this.growthTime = 0;
                break;
                
            case 'splitting':
                // 分裂参数
                this.canSplit = true;
                this.splitCount = 0;
                this.maxSplits = 1; // 最多分裂一次
                this.childSize = this.size * 0.6;
                this.childHealth = Math.max(1, Math.floor(this.health / 2));
                break;
        }
    }
    
    setSpawnPosition() {
        const side = Math.floor(Math.random() * 4); // 0:上, 1:右, 2:下, 3:左
        
        switch (side) {
            case 0: // 上
                this.x = Math.random() * CONFIG.CANVAS_WIDTH;
                this.y = -20;
                break;
            case 1: // 右
                this.x = CONFIG.CANVAS_WIDTH + 20;
                this.y = Math.random() * CONFIG.CANVAS_HEIGHT;
                break;
            case 2: // 下
                this.x = Math.random() * CONFIG.CANVAS_WIDTH;
                this.y = CONFIG.CANVAS_HEIGHT + 20;
                break;
            case 3: // 左
                this.x = -20;
                this.y = Math.random() * CONFIG.CANVAS_HEIGHT;
                break;
        }
        
        if (this.behavior === 'zigzag') {
            this.baseX = this.x;
            this.baseY = this.y;
        }
    }
    
    // 生成围绕敌人的粒子效果
    generateParticles() {
        const particleCount = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.size * 1.2 + Math.random() * 15;
            const particle = {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                size: 1 + Math.random() * 3,
                alpha: 0.3 + Math.random() * 0.4,
                speed: 0.02 + Math.random() * 0.05,
                angle: angle,
                dist: distance
            };
            this.particles.push(particle);
        }
    }
    
    update(playerX, playerY, deltaTime) {
        let distance;
        
        switch (this.behavior) {
            case 'zigzag':
                distance = this.updateZigzag(playerX, playerY, deltaTime);
                break;
                
            case 'growing':
                distance = this.updateGrowing(playerX, playerY, deltaTime);
                break;
                
            case 'chasing':
                distance = this.updateChasing(playerX, playerY, deltaTime);
                break;
                
            case 'splitting':
                distance = this.updateNormal(playerX, playerY, deltaTime);
                break;
                
            default:
                distance = this.updateNormal(playerX, playerY, deltaTime);
        }
        
        // 更新粒子效果
        if (this.particles.length > 0) {
            this.updateParticles(deltaTime);
        }
        
        return distance;
    }
    
    // 更新粒子效果
    updateParticles(deltaTime) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.angle += p.speed * deltaTime * 0.01;
            p.x = Math.cos(p.angle) * p.dist;
            p.y = Math.sin(p.angle) * p.dist;
            
            // 随机改变粒子透明度，产生闪烁效果
            if (Math.random() > 0.95) {
                p.alpha = 0.3 + Math.random() * 0.5;
            }
        }
    }
    
    updateNormal(playerX, playerY, deltaTime) {
        // 基本移动 - 直线追踪玩家
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        return distance;
    }
    
    updateZigzag(playerX, playerY, deltaTime) {
        // 锯齿形移动 - 在基本路径上添加正弦波动
        this.time += deltaTime * 0.01;
        
        // 计算到玩家的基本移动向量
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 计算基本移动方向
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // 计算垂直于移动方向的向量
            const perpX = -dirY;
            const perpY = dirX;
            
            // 应用正弦波动
            const waveOffset = Math.sin(this.time * this.frequency + this.phase) * this.amplitude;
            
            // 应用基本移动和波动
            this.x += dirX * this.speed + perpX * waveOffset * 0.01;
            this.y += dirY * this.speed + perpY * waveOffset * 0.01;
        }
        
        return distance;
    }
    
    updateGrowing(playerX, playerY, deltaTime) {
        // 逐渐变大的敌人
        this.growthTime += deltaTime;
        this.size = this.originalSize + 
                   (this.maxSize - this.originalSize) * 
                   Math.min(1, this.growthTime * this.growthRate);
                   
        return this.updateNormal(playerX, playerY, deltaTime);
    }
    
    updateChasing(playerX, playerY, deltaTime) {
        // 熊市 - 快速追踪玩家
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 距离越近，速度越快
        const speedMultiplier = Math.max(0.5, Math.min(2.0, 500 / (distance + 100)));
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * speedMultiplier;
            this.y += (dy / distance) * this.speed * speedMultiplier;
        }
        
        return distance;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
    
    // 尝试分裂，如果可以分裂则返回新的实体数组
    trySplit() {
        if (this.behavior !== 'splitting' || !this.canSplit || this.splitCount >= this.maxSplits) {
            return null;
        }
        
        // 已分裂过的不再分裂
        this.canSplit = false;
        
        // 创建两个子实体
        const children = [];
        for (let i = 0; i < 2; i++) {
            const angle = i * Math.PI + Math.random() * 0.5;
            const child = new MarketRisk(1, this.type);
            child.x = this.x;
            child.y = this.y;
            child.size = this.childSize;
            child.health = this.childHealth;
            child.value = Math.floor(this.value * 0.5);
            child.canSplit = false; // 子实体不能再分裂
            
            // 给一个初始速度方向，向不同方向分散
            child.initialVelX = Math.cos(angle) * 2;
            child.initialVelY = Math.sin(angle) * 2;
            child.initialMoveTime = 500; // 500ms的初始移动时间
            
            children.push(child);
        }
        
        return children;
    }
    
    render(ctx) {
        // 根据敌人类型绘制不同的金融图标
        ctx.save();
        
        switch (this.id) {
            case 'volatility': // 市场波动 - 三角形
                this.renderVolatility(ctx);
                break;
                
            case 'inflation': // 通货膨胀 - 正方形
                this.renderInflation(ctx);
                break;
                
            case 'bearMarket': // 熊市 - 菱形
                this.renderBearMarket(ctx);
                break;
                
            case 'recession': // 经济衰退 - 五角星
                this.renderRecession(ctx);
                break;
                
            default:
                this.renderCircle(ctx);
        }
        
        // 绘制粒子效果
        if (this.particles.length > 0) {
            this.renderParticles(ctx);
        }
        
        // 绘制市场风险名称
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y - this.size - 5);
        
        ctx.restore();
    }
    
    // 绘制粒子效果
    renderParticles(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = `rgba(${this.getParticleColor()}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(this.x + p.x, this.y + p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    getParticleColor() {
        switch (this.id) {
            case 'volatility': return '231, 76, 60';
            case 'inflation': return '243, 156, 18';
            case 'bearMarket': return '142, 68, 173';
            case 'recession': return '44, 62, 80';
            default: return '189, 195, 199';
        }
    }
    
    renderCircle(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderVolatility(ctx) {
        // 市场波动 - 使用箭头上下符号
        ctx.fillStyle = this.color;
        
        // 绘制三角形背景
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x - this.size, this.y + this.size * 0.5);
        ctx.lineTo(this.x + this.size, this.y + this.size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // 绘制双向箭头符号
        ctx.fillStyle = 'white';
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↕', this.x, this.y);
    }
    
    renderInflation(ctx) {
        // 通货膨胀 - 使用上升箭头符号
        ctx.fillStyle = this.color;
        
        // 绘制正方形背景
        ctx.fillRect(this.x - this.size * 0.8, this.y - this.size * 0.8, this.size * 1.6, this.size * 1.6);
        
        // 绘制上升箭头符号
        ctx.fillStyle = 'white';
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↗', this.x, this.y);
    }
    
    renderBearMarket(ctx) {
        // 熊市 - 使用下降箭头符号
        ctx.fillStyle = this.color;
        
        // 绘制菱形背景
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size, this.y);
        ctx.closePath();
        ctx.fill();
        
        // 绘制下降箭头符号
        ctx.fillStyle = 'white';
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↓', this.x, this.y);
    }
    
    renderRecession(ctx) {
        // 经济衰退 - 使用除号符号（分裂）
        ctx.fillStyle = this.color;
        
        // 绘制星形
        const outerRadius = this.size * 1.1;
        const innerRadius = this.size * 0.5;
        const spikes = 5;
        
        ctx.beginPath();
        let rot = Math.PI / 2 * 3;
        let x = this.x;
        let y = this.y;
        let step = Math.PI / spikes;
        
        ctx.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = this.x + Math.cos(rot) * outerRadius;
            y = this.y + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = this.x + Math.cos(rot) * innerRadius;
            y = this.y + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(this.x, this.y - outerRadius);
        ctx.closePath();
        ctx.fill();
        
        // 绘制除号符号
        ctx.fillStyle = 'white';
        ctx.font = `bold ${this.size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('÷', this.x, this.y);
    }
} 