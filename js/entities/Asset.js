import { CONFIG } from '../config.js';

// 资产类（收集物）
export class Asset {
    constructor(level) {
        this.x = Math.random() * (CONFIG.CANVAS_WIDTH - 40) + 20;
        this.y = Math.random() * (CONFIG.CANVAS_HEIGHT - 40) + 20;
        this.size = 20;
        this.value = Math.floor(50 + Math.random() * 50 * level);
        this.typeIndex = Math.floor(Math.random() * CONFIG.ASSET.TYPES.length);
        this.type = CONFIG.ASSET.TYPES[this.typeIndex];
        
        // 浮动动画参数
        this.floatOffset = 0;
        this.floatSpeed = 0.05 + Math.random() * 0.03;
        this.floatAmount = 4 + Math.random() * 2;
        
        // 发光效果参数
        this.glowSize = this.size * 2;
        this.glowAlpha = 0.5;
        this.glowPulse = 0;
        
        // 旋转效果
        this.rotation = 0;
        this.rotationSpeed = 0.01 + Math.random() * 0.02;
        
        // 每个资产类型的颜色
        this.colors = {
            0: { // 股票
                main: '#27ae60',
                glow: '46, 204, 113',
                inner: '#2ecc71'
            },
            1: { // 黄金
                main: '#f39c12',
                glow: '241, 196, 15',
                inner: '#f1c40f'
            },
            2: { // 债券
                main: '#2980b9',
                glow: '52, 152, 219',
                inner: '#3498db'
            },
            3: { // 现金
                main: '#16a085',
                glow: '26, 188, 156',
                inner: '#1abc9c'
            }
        };
        
        // 粒子效果
        this.particles = [];
        this.particleTimer = 0;
    }
    
    update(deltaTime) {
        // 更新浮动动画
        this.floatOffset += this.floatSpeed * deltaTime * 0.01;
        
        // 更新发光效果
        this.glowPulse += 0.05 * deltaTime * 0.01;
        this.glowAlpha = 0.3 + Math.sin(this.glowPulse) * 0.2;
        
        // 更新旋转
        this.rotation += this.rotationSpeed * deltaTime * 0.01;
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
    }
    
    updateParticles(deltaTime) {
        // 随机添加粒子
        this.particleTimer -= deltaTime;
        if (this.particleTimer <= 0) {
            this.addParticle();
            this.particleTimer = 80 + Math.random() * 150;
        }
        
        // 更新现有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx * deltaTime * 0.05;
            p.y += p.vy * deltaTime * 0.05;
            p.life -= deltaTime * 0.05;
            p.alpha -= 0.01 * deltaTime * 0.05;
            
            if (p.life <= 0 || p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    addParticle() {
        // 随机角度
        const angle = Math.random() * Math.PI * 2;
        // 距离中心的随机距离
        const dist = this.size * 0.3 + Math.random() * this.size * 0.7;
        
        // 当前Y坐标加上浮动效果
        const currentY = this.y + Math.sin(this.floatOffset) * this.floatAmount;
        
        this.particles.push({
            x: this.x + Math.cos(angle) * dist,
            y: currentY + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            size: 1 + Math.random() * 2,
            alpha: 0.5 + Math.random() * 0.3,
            life: 20 + Math.random() * 20
        });
    }
    
    render(ctx) {
        ctx.save();
        
        // 当前Y坐标加上浮动效果
        const currentY = this.y + Math.sin(this.floatOffset) * this.floatAmount;
        
        // 首先绘制粒子效果
        this.renderParticles(ctx, currentY);
        
        // 绘制发光效果
        const gradient = ctx.createRadialGradient(
            this.x, currentY, this.size * 0.5,
            this.x, currentY, this.glowSize
        );
        gradient.addColorStop(0, `rgba(${this.colors[this.typeIndex].glow}, ${this.glowAlpha})`);
        gradient.addColorStop(1, `rgba(${this.colors[this.typeIndex].glow}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, currentY, this.glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 为不同资产类型绘制不同形状
        ctx.translate(this.x, currentY);
        ctx.rotate(this.rotation);
        
        switch (this.typeIndex) {
            case 0: // 股票 - 上升折线图形状
                this.renderStock(ctx);
                break;
            case 1: // 黄金 - 圆形
                this.renderGold(ctx);
                break;
            case 2: // 债券 - 矩形文档形状
                this.renderBond(ctx);
                break;
            case 3: // 现金 - 纸币形状
                this.renderCash(ctx);
                break;
            default:
                this.renderDefaultAsset(ctx);
        }
        
        ctx.restore();
    }
    
    renderParticles(ctx, currentY) {
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(${this.colors[this.typeIndex].glow}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderStock(ctx) {
        // 绘制股票图表形状
        ctx.fillStyle = this.colors[this.typeIndex].main;
        
        // 绘制圆形背景
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 内部渐变
        const innerGradient = ctx.createRadialGradient(
            -this.size * 0.3, -this.size * 0.3, 0,
            0, 0, this.size
        );
        innerGradient.addColorStop(0, this.colors[this.typeIndex].inner);
        innerGradient.addColorStop(1, '#229954');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制股票图表符号
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.5, this.size * 0.2);
        ctx.lineTo(-this.size * 0.2, -this.size * 0.3);
        ctx.lineTo(0, this.size * 0.1);
        ctx.lineTo(this.size * 0.5, -this.size * 0.4);
        ctx.stroke();
    }
    
    renderGold(ctx) {
        // 绘制金币形状
        ctx.fillStyle = this.colors[this.typeIndex].main;
        
        // 绘制圆形背景
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 内部渐变
        const innerGradient = ctx.createRadialGradient(
            -this.size * 0.3, -this.size * 0.3, 0,
            0, 0, this.size
        );
        innerGradient.addColorStop(0, this.colors[this.typeIndex].inner);
        innerGradient.addColorStop(1, '#d35400');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制金币符号
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('金', 0, 0);
    }
    
    renderBond(ctx) {
        // 绘制债券形状
        ctx.fillStyle = this.colors[this.typeIndex].main;
        
        // 绘制圆角矩形作为背景
        this.roundRect(ctx, -this.size, -this.size, this.size * 2, this.size * 2, this.size * 0.3);
        ctx.fill();
        
        // 内部渐变
        const innerGradient = ctx.createRadialGradient(
            -this.size * 0.3, -this.size * 0.3, 0,
            0, 0, this.size * 1.5
        );
        innerGradient.addColorStop(0, this.colors[this.typeIndex].inner);
        innerGradient.addColorStop(1, '#1f618d');
        
        ctx.fillStyle = innerGradient;
        this.roundRect(ctx, -this.size * 0.8, -this.size * 0.8, this.size * 1.6, this.size * 1.6, this.size * 0.3);
        ctx.fill();
        
        // 绘制债券符号
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('债', 0, 0);
    }
    
    renderCash(ctx) {
        // 绘制现金形状
        ctx.fillStyle = this.colors[this.typeIndex].main;
        
        // 绘制圆角矩形作为纸币
        this.roundRect(ctx, -this.size * 1.2, -this.size * 0.8, this.size * 2.4, this.size * 1.6, this.size * 0.3);
        ctx.fill();
        
        // 内部渐变
        const innerGradient = ctx.createLinearGradient(
            -this.size * 1.2, 0,
            this.size * 1.2, 0
        );
        innerGradient.addColorStop(0, this.colors[this.typeIndex].inner);
        innerGradient.addColorStop(0.5, this.colors[this.typeIndex].main);
        innerGradient.addColorStop(1, '#0e6655');
        
        ctx.fillStyle = innerGradient;
        this.roundRect(ctx, -this.size * 1, -this.size * 0.6, this.size * 2, this.size * 1.2, this.size * 0.3);
        ctx.fill();
        
        // 绘制现金符号
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¥', 0, 0);
    }
    
    renderDefaultAsset(ctx) {
        // 默认资产形状
        ctx.fillStyle = this.colors[this.typeIndex].main;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 内部渐变
        const innerGradient = ctx.createRadialGradient(
            -this.size * 0.3, -this.size * 0.3, 0,
            0, 0, this.size
        );
        innerGradient.addColorStop(0, this.colors[this.typeIndex].inner);
        innerGradient.addColorStop(1, '#229954');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制资产符号
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
    }
    
    // 绘制圆角矩形的辅助函数
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    // 检查与玩家的碰撞
    checkCollision(playerX, playerY, playerSize) {
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.size + playerSize;
    }
} 