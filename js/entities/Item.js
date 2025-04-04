import { CONFIG } from '../config.js';

export class Item {
    constructor(type) {
        this.type = type;
        this.config = CONFIG.ITEMS[type];
        this.lastUsedTime = 0;
        this.isReady = true;
        this.cooldownRemaining = 0;
        
        // 道具栏位置 - 从右上方改为右侧中部
        this.slotX = CONFIG.CANVAS_WIDTH - 120;
        this.slotY = CONFIG.CANVAS_HEIGHT / 2; // 将位置调整到画布的中间高度
        this.size = 160; // 原尺寸80的两倍
        
        // 视觉效果
        this.pulseAmount = 0;
        this.pulseSpeed = 0.1;
        this.rotation = 0;
        this.rotationSpeed = 0.02;
        
        // 移动端触摸区域
        this.touchArea = {
            x: this.slotX - this.size/2,
            y: this.slotY - this.size/2,
            width: this.size,
            height: this.size
        };
    }
    
    update(deltaTime) {
        if (!this.isReady) {
            this.cooldownRemaining -= deltaTime;
            if (this.cooldownRemaining <= 0) {
                this.isReady = true;
                this.cooldownRemaining = 0;
            }
        }
        
        // 更新视觉效果
        this.pulseAmount = Math.sin(Date.now() * this.pulseSpeed) * 0.2 + 0.8;
        this.rotation += this.rotationSpeed;
    }
    
    canUse() {
        return this.isReady;
    }
    
    use() {
        if (!this.canUse()) return false;
        
        this.isReady = false;
        this.lastUsedTime = Date.now();
        this.cooldownRemaining = this.config.COOLDOWN;
        return true;
    }
    
    getCooldownProgress() {
        if (this.isReady) return 1;
        return 1 - (this.cooldownRemaining / this.config.COOLDOWN);
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.slotX, this.slotY);
        
        // 绘制道具背景
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.isReady ? this.config.COLOR : 'rgba(128, 128, 128, 0.5)';
        ctx.fill();
        
        // 绘制道具图标 - 增大字体尺寸
        ctx.fillStyle = 'white';
        ctx.font = 'bold 96px Arial'; // 原48px的两倍
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 0);
        
        // 绘制冷却进度
        if (!this.isReady) {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * this.getCooldownProgress()));
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 8; // 加粗线条
            ctx.stroke();
        }
        
        // 绘制道具名称
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial'; // 原16px的1.5倍
        ctx.fillText(this.config.NAME, 0, this.size / 2 + 30);
        
        ctx.restore();
    }
    
    isPointInside(x, y) {
        // 计算点击位置相对于道具中心的距离
        const dx = x - this.slotX;
        const dy = y - this.slotY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离小于道具半径，则判定为点击
        return distance <= this.size / 2;
    }
    
    // 获取触摸区域
    getTouchArea() {
        return this.touchArea;
    }
} 