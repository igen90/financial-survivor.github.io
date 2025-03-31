// 升级系统

export class UpgradeSystem {
    constructor(player) {
        this.player = player;
        this.upgrades = [
            {
                name: '投资速度',
                description: '增加投资决策速度',
                level: 1,
                maxLevel: 5,
                effect: () => this.player.investmentRate += 0.2
            },
            {
                name: '投资能力',
                description: '增加单次投资收益',
                level: 1,
                maxLevel: 5,
                effect: () => this.player.investmentPower += 0.5
            },
            {
                name: '分析范围',
                description: '扩大市场分析范围',
                level: 1,
                maxLevel: 5,
                effect: () => this.player.investmentRadius += 30
            },
            {
                name: '移动速度',
                description: '提高市场洞察速度',
                level: 1,
                maxLevel: 5,
                effect: () => this.player.speed += 0.5
            }
        ];
        
        // 绑定DOM元素
        this.upgradeMenu = document.getElementById('upgrade-menu');
        this.upgradeOptions = document.getElementById('upgrade-options');
        this.closeButton = document.getElementById('close-upgrade');
        
        // 添加关闭按钮事件
        this.closeButton.addEventListener('click', () => {
            this.hideMenu();
            if (this.onClose) this.onClose();
        });
    }
    
    // 显示升级菜单
    showMenu(onClose) {
        // 清空旧的升级选项
        this.upgradeOptions.innerHTML = '';
        this.onClose = onClose;
        
        // 添加新的升级选项
        for (let i = 0; i < this.upgrades.length; i++) {
            const upgrade = this.upgrades[i];
            if (upgrade.level < upgrade.maxLevel) {
                const upgradeItem = document.createElement('div');
                upgradeItem.className = 'upgrade-item';
                upgradeItem.innerHTML = `
                    <div>${upgrade.name} (等级 ${upgrade.level}/${upgrade.maxLevel})</div>
                    <div>${upgrade.description}</div>
                `;
                
                upgradeItem.addEventListener('click', () => {
                    upgrade.effect();
                    upgrade.level++;
                    this.hideMenu();
                    if (this.onClose) this.onClose();
                });
                
                this.upgradeOptions.appendChild(upgradeItem);
            }
        }
        
        this.upgradeMenu.classList.remove('hidden');
    }
    
    // 隐藏升级菜单
    hideMenu() {
        this.upgradeMenu.classList.add('hidden');
    }
    
    // 重置所有升级
    reset() {
        this.upgrades.forEach(upgrade => {
            upgrade.level = 1;
        });
    }
} 