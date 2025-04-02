import { CONFIG } from '../config.js';

// 投资机会类（玩家的"子弹"）
export class Opportunity {
    constructor(x, y, targetX, targetY, power, range) {
        this.x = x;
        this.y = y;
        this.size = 6;
        this.power = power;
        this.range = range;
        this.color = '#2ecc71';
        
        // 计算方向向量
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 归一化方向向量
        this.vx = (dx / distance) * 10; // 速度是固定的
        this.vy = (dy / distance) * 10;
        
        // 跟踪已经移动的距离
        this.distanceTraveled = 0;
        
        // 粒子效果
        this.particles = [];
        this.trailTimer = 0;
        
        // 视觉效果参数
        this.pulseAmount = 0;
        this.pulseSpeed = 0.2 + Math.random() * 0.1;
        this.rotation = Math.atan2(dy, dx);
    }
    
    update() {
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 计算已移动距离
        this.distanceTraveled += Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        // 更新粒子效果
        this.updateTrail();
        
        // 更新视觉效果
        this.pulseAmount = Math.sin(performance.now() * this.pulseSpeed) * 0.5;
        
        // 如果超出射程或边界，返回false表示应该被移除
        return this.distanceTraveled <= this.range && 
               this.x >= 0 && this.x <= CONFIG.CANVAS_WIDTH && 
               this.y >= 0 && this.y <= CONFIG.CANVAS_HEIGHT;
    }
    
    updateTrail() {
        // 添加新粒子
        this.trailTimer++;
        if (this.trailTimer >= 2) { // 每2帧添加一个粒子
            this.trailTimer = 0;
            
            this.particles.push({
                x: this.x,
                y: this.y,
                size: 2 + Math.random() * 2,
                alpha: 0.7,
                life: 20
            });
        }
        
        // 更新粒子生命周期
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.alpha -= 0.035;
            p.life -= 1;
            
            if (p.alpha <= 0 || p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollision(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.size + entity.size;
    }
    
    render(ctx) {
        ctx.save();
        
        // 绘制尾迹粒子
        this.renderTrail(ctx);
        
        // 绘制投资机会本身
        this.renderOpportunity(ctx);
        
        ctx.restore();
    }
    
    renderTrail(ctx) {
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(46, 204, 113, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderOpportunity(ctx) {
        // 投资机会的主体 - 绿色能量球
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 绘制光晕效果
        const pulseSize = this.size * (1.8 + this.pulseAmount);
        const gradient = ctx.createRadialGradient(
            0, 0, this.size * 0.5,
            0, 0, pulseSize
        );
        gradient.addColorStop(0, 'rgba(46, 204, 113, 0.7)');
        gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制核心 - 菱形形状
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(this.size * 1.5, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 1.5, 0);
        ctx.lineTo(0, -this.size);
        ctx.closePath();
        ctx.fill();
        
        // 绘制中心点 - 白色小点
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
} 