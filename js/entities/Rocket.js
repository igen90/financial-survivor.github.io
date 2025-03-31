import { CONFIG } from '../config.js';

// 火箭炮类 - 定时发射、具有范围伤害的大型投资决策
export class Rocket {
    constructor(x, y, targetX, targetY, power) {
        this.x = x;
        this.y = y;
        this.size = 6;
        this.power = power * 2.5; // 伤害更高
        this.range = CONFIG.CANVAS_WIDTH * 0.8; // 射程适中
        this.color = '#e74c3c';
        this.explosionRadius = 80; // 爆炸范围
        this.isExploding = false;
        this.explosionTime = 0;
        this.explosionDuration = 500; // 爆炸持续时间（毫秒）
        
        // 计算方向向量
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 归一化方向向量，速度适中
        this.vx = (dx / distance) * 8;
        this.vy = (dy / distance) * 8;
        
        // 跟踪已经移动的距离
        this.distanceTraveled = 0;
        
        // 粒子效果
        this.particles = [];
        this.trailTimer = 0;
        
        // 视觉效果参数
        this.pulseAmount = 0;
        this.pulseSpeed = 0.2 + Math.random() * 0.1;
        this.rotation = Math.atan2(dy, dx);
        
        // 爆炸粒子
        this.explosionParticles = [];
    }
    
    update(deltaTime) {
        if (this.isExploding) {
            // 更新爆炸效果
            return this.updateExplosion(deltaTime);
        }
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 计算已移动距离
        this.distanceTraveled += Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        // 更新粒子效果
        this.updateTrail();
        
        // 更新视觉效果
        this.pulseAmount = Math.sin(performance.now() * this.pulseSpeed) * 0.5;
        
        // 如果超出射程或边界，触发爆炸
        if (this.distanceTraveled > this.range ||
            this.x < 0 || this.x > CONFIG.CANVAS_WIDTH ||
            this.y < 0 || this.y > CONFIG.CANVAS_HEIGHT) {
            this.explode();
            return true;
        }
        
        return true;
    }
    
    explode() {
        this.isExploding = true;
        this.explosionTime = performance.now();
        this.createExplosionParticles();
    }
    
    createExplosionParticles() {
        // 创建爆炸粒子 - 增加数量
        const particleCount = 100; // 增加到100个粒子（原来是50个）
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            const distance = Math.random() * this.explosionRadius;
            const lifetime = 300 + Math.random() * 700;
            
            // 色彩变化 - 更丰富的颜色
            let color;
            const colorRand = Math.random();
            if (colorRand < 0.3) {
                color = '231, 76, 60'; // 红色
            } else if (colorRand < 0.5) {
                color = '243, 156, 18'; // 橙色
            } else if (colorRand < 0.7) {
                color = '255, 255, 255'; // 白色
            } else if (colorRand < 0.9) {
                color = '241, 196, 15'; // 黄色
            } else {
                color = '230, 126, 34'; // 深橙色
            }
            
            this.explosionParticles.push({
                x: this.x,
                y: this.y,
                targetX: this.x + Math.cos(angle) * distance,
                targetY: this.y + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                alpha: 0.8 + Math.random() * 0.2,
                color,
                lifetime,
                totalLifetime: lifetime
            });
        }
        
        // 添加冲击波效果
        this.shockwave = {
            radius: 5,
            maxRadius: this.explosionRadius * 1.5,
            alpha: 0.8,
            width: 8,
            color: '255, 255, 255'
        };
        
        // 添加闪光效果
        this.flash = {
            alpha: 1.0,
            duration: 200,
            startTime: performance.now()
        };
    }
    
    updateExplosion(deltaTime) {
        // 爆炸效果已完成
        if (performance.now() - this.explosionTime > this.explosionDuration) {
            return false;
        }
        
        // 更新爆炸粒子
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const p = this.explosionParticles[i];
            
            // 更新位置
            p.x += p.vx * deltaTime * 0.05;
            p.y += p.vy * deltaTime * 0.05;
            
            // 更新生命
            p.lifetime -= deltaTime;
            p.alpha = Math.max(0, p.alpha * (p.lifetime / p.totalLifetime));
            
            // 逐渐减慢速度
            p.vx *= 0.98;
            p.vy *= 0.98;
            
            // 移除死亡粒子
            if (p.lifetime <= 0) {
                this.explosionParticles.splice(i, 1);
            }
        }
        
        // 更新冲击波
        if (this.shockwave) {
            this.shockwave.radius += deltaTime * 0.2;
            this.shockwave.alpha = Math.max(0, 1 - (this.shockwave.radius / this.shockwave.maxRadius));
            this.shockwave.width = Math.max(1, 8 * this.shockwave.alpha);
            
            if (this.shockwave.radius >= this.shockwave.maxRadius) {
                this.shockwave = null;
            }
        }
        
        // 更新闪光效果
        if (this.flash) {
            const elapsed = performance.now() - this.flash.startTime;
            this.flash.alpha = Math.max(0, 1 - (elapsed / this.flash.duration));
            
            if (elapsed > this.flash.duration) {
                this.flash = null;
            }
        }
        
        return true;
    }
    
    updateTrail() {
        // 添加新粒子，较慢以显示火箭尾迹
        this.trailTimer++;
        if (this.trailTimer >= 2) {
            this.trailTimer = 0;
            
            // 主尾迹粒子
            this.particles.push({
                x: this.x - this.vx * 0.5, // 稍微偏移以产生更好的尾迹效果
                y: this.y - this.vy * 0.5,
                size: 3 + Math.random() * 2,
                alpha: 0.7,
                life: 20,
                color: Math.random() > 0.5 ? '231, 76, 60' : '243, 156, 18' // 红色或橙色
            });
            
            // 烟雾粒子
            if (Math.random() > 0.5) {
                const smokeAngle = this.rotation + Math.PI + (Math.random() - 0.5) * 0.5;
                const smokeDistance = 5 + Math.random() * 5;
                this.particles.push({
                    x: this.x - Math.cos(this.rotation) * 5,
                    y: this.y - Math.sin(this.rotation) * 5,
                    vx: Math.cos(smokeAngle) * 0.5,
                    vy: Math.sin(smokeAngle) * 0.5,
                    size: 2 + Math.random() * 3,
                    alpha: 0.3 + Math.random() * 0.3,
                    life: 30 + Math.random() * 20,
                    color: '100, 100, 100' // 灰色烟雾
                });
            }
        }
        
        // 更新粒子生命周期
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.alpha -= 0.035;
            p.life -= 1;
            
            if (p.vx !== undefined) {
                p.x += p.vx;
                p.y += p.vy;
            }
            
            if (p.alpha <= 0 || p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollision(entity) {
        if (this.isExploding) {
            // 爆炸状态下，检查实体是否在爆炸范围内
            const dx = entity.x - this.x;
            const dy = entity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance < this.explosionRadius + entity.size;
        } else {
            // 正常飞行状态，检查直接碰撞
            const dx = entity.x - this.x;
            const dy = entity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果碰撞，立即触发爆炸
            if (distance < this.size + entity.size) {
                this.explode();
                return true;
            }
            
            return false;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        if (this.isExploding) {
            // 绘制爆炸效果
            this.renderExplosion(ctx);
        } else {
            // 绘制尾迹粒子
            this.renderTrail(ctx);
            
            // 绘制火箭本体
            this.renderRocket(ctx);
        }
        
        ctx.restore();
    }
    
    renderTrail(ctx) {
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(${p.color || '231, 76, 60'}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderExplosion(ctx) {
        // 绘制闪光效果
        if (this.flash) {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.explosionRadius
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.flash.alpha})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 200, ${this.flash.alpha * 0.6})`);
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制冲击波
        if (this.shockwave) {
            ctx.strokeStyle = `rgba(${this.shockwave.color}, ${this.shockwave.alpha})`;
            ctx.lineWidth = this.shockwave.width;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwave.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 绘制爆炸光环
        const explosionProgress = Math.min(1, (performance.now() - this.explosionTime) / this.explosionDuration);
        const explosionRadius = this.explosionRadius * explosionProgress;
        
        // 绘制光环
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, explosionRadius
        );
        gradient.addColorStop(0, 'rgba(231, 76, 60, 0.8)');
        gradient.addColorStop(0.7, 'rgba(231, 76, 60, 0.4)');
        gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, explosionRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制粒子
        for (const p of this.explosionParticles) {
            ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 添加爆炸中心亮点
        const centerGlow = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, explosionRadius * 0.3
        );
        centerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        centerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = centerGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, explosionRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderRocket(ctx) {
        // 绘制火箭 - 椭圆形状
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 绘制火箭尾部火焰
        const flameLength = 10 + Math.random() * 5;
        const flameWidth = this.size * 0.8;
        
        // 火焰渐变
        const flameGradient = ctx.createLinearGradient(
            -flameLength, 0,
            0, 0
        );
        flameGradient.addColorStop(0, 'rgba(243, 156, 18, 0)');
        flameGradient.addColorStop(0.3, 'rgba(243, 156, 18, 0.8)');
        flameGradient.addColorStop(1, 'rgba(231, 76, 60, 0.9)');
        
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.moveTo(-flameLength, 0);
        ctx.lineTo(-this.size * 0.8, flameWidth / 2);
        ctx.lineTo(-this.size * 0.8, -flameWidth / 2);
        ctx.closePath();
        ctx.fill();
        
        // 绘制火箭主体 - 红色椭圆
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制火箭尖端
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(this.size * 1.5, 0);
        ctx.lineTo(this.size * 2.2, 0);
        ctx.lineTo(this.size * 1.5, this.size * 0.5);
        ctx.lineTo(this.size * 1.5, -this.size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // 绘制火箭稳定翼
        ctx.fillStyle = '#c0392b';
        const finSize = this.size * 0.8;
        
        // 上翼
        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size * 0.5);
        ctx.lineTo(-this.size - finSize, -this.size - finSize * 0.7);
        ctx.lineTo(-this.size * 0.3, -this.size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // 下翼
        ctx.beginPath();
        ctx.moveTo(-this.size, this.size * 0.5);
        ctx.lineTo(-this.size - finSize, this.size + finSize * 0.7);
        ctx.lineTo(-this.size * 0.3, this.size * 0.5);
        ctx.closePath();
        ctx.fill();
    }
    
    // 获取爆炸范围内的所有敌人
    getEntitiesInExplosionRange(entities) {
        if (!this.isExploding) return [];
        
        return entities.filter(entity => {
            const dx = entity.x - this.x;
            const dy = entity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance < this.explosionRadius + entity.size;
        });
    }
} 