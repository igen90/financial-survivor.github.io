import { CONFIG } from '../config.js';

// 连射机枪类 - 快速连发的投资决策
export class MachineGun {
    constructor(x, y, targetX, targetY, power) {
        this.x = x;
        this.y = y;
        this.size = 2.5;
        this.power = power * 0.6; // 单发伤害较低
        this.range = CONFIG.CANVAS_WIDTH; // 射程更远
        this.color = '#f1c40f';
        
        // 计算方向向量
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 归一化方向向量，速度更快
        this.vx = (dx / distance) * 14;
        this.vy = (dy / distance) * 14;
        
        // 跟踪已经移动的距离
        this.distanceTraveled = 0;
        
        // 添加轻微随机偏移以模拟机枪散布
        const spread = 0.1; // 散布角度（弧度）
        const spreadAngle = (Math.random() - 0.5) * spread;
        const cosSpread = Math.cos(spreadAngle);
        const sinSpread = Math.sin(spreadAngle);
        
        // 应用散布
        const newVx = this.vx * cosSpread - this.vy * sinSpread;
        const newVy = this.vx * sinSpread + this.vy * cosSpread;
        this.vx = newVx;
        this.vy = newVy;
        
        // 粒子效果
        this.particles = [];
        this.trailTimer = 0;
        
        // 视觉效果参数
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
        
        // 如果超出射程或边界，返回false表示应该被移除
        return this.distanceTraveled <= this.range && 
               this.x >= 0 && this.x <= CONFIG.CANVAS_WIDTH && 
               this.y >= 0 && this.y <= CONFIG.CANVAS_HEIGHT;
    }
    
    updateTrail() {
        // 添加新粒子，更频繁
        this.trailTimer++;
        if (this.trailTimer >= 1) { // 每帧添加一个粒子
            this.trailTimer = 0;
            
            this.particles.push({
                x: this.x,
                y: this.y,
                size: 0.8 + Math.random() * 0.6,
                alpha: 0.8,
                life: 10
            });
        }
        
        // 更新粒子生命周期
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.alpha -= 0.08;
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
        
        // 绘制机枪子弹
        this.renderBullet(ctx);
        
        ctx.restore();
    }
    
    renderTrail(ctx) {
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(241, 196, 15, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderBullet(ctx) {
        // 绘制子弹 - 更细长的形状
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 绘制子弹尾部发光效果
        const gradient = ctx.createRadialGradient(
            0, 0, this.size * 0.5,
            0, 0, this.size * 3
        );
        gradient.addColorStop(0, 'rgba(241, 196, 15, 0.7)');
        gradient.addColorStop(1, 'rgba(241, 196, 15, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制子弹本体 - 细长形状
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(this.size * 3, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size, 0);
        ctx.lineTo(0, -this.size);
        ctx.closePath();
        ctx.fill();
        
        // 绘制中心点
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
} 