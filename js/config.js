// 游戏常量和配置
export const CONFIG = {
    // 画布尺寸
    CANVAS_WIDTH: 1600,
    CANVAS_HEIGHT: 1120,
    
    // 移动设备配置
    MOBILE: {
        TOUCH_RADIUS: 30,  // 触摸判定半径
        DOUBLE_TAP_DELAY: 300,  // 双击判定延迟（毫秒）
        SWIPE_THRESHOLD: 50,  // 滑动判定阈值
        UI_SCALE: 1.5,  // UI元素缩放比例
        FONT_SIZE: {
            SMALL: 14,
            MEDIUM: 18,
            LARGE: 24
        }
    },
    
    // 场景美化配置
    VISUAL: {
        GOLDEN_BACKGROUND: {
            GRADIENT: {
                START: 'rgba(25, 20, 0, 0.95)',  // 深金色
                MIDDLE: 'rgba(40, 30, 0, 0.9)',  // 中金色
                END: 'rgba(60, 45, 0, 0.85)'     // 浅金色
            },
            GLOW: {
                COLOR: 'rgba(255, 215, 0, 0.15)',  // 金色光晕
                BLUR: 30
            },
            GRID: {
                COLOR: 'rgba(255, 215, 0, 0.08)',  // 金色网格线
                SPACING: 40
            }
        },
        MONEY_RAIN: {
            DROP_COUNT: 20,        // 减少雨滴数量
            DROP_SIZE: {
                MIN: 12,
                MAX: 24
            },
            SPEED: {
                MIN: 0.5,
                MAX: 1.5
            },
            ROTATION_SPEED: {
                MIN: 0.001,
                MAX: 0.003
            },
            OPACITY: {
                MIN: 0.1,
                MAX: 0.3
            },
            SPAWN_RATE: 0.02,      // 降低生成频率
            SWAY: {
                AMPLITUDE: 0.5,
                SPEED: 0.01
            }
        }
    },
    
    // 游戏初始设置
    INITIAL_SCORE: 1,
    LEVEL_UP_TIME: 30000, // 每30秒升一级
    
    // 玩家初始属性
    PLAYER: {
        SIZE: 20,
        SPEED: 4,
        INVESTMENT_POWER: 1,
        INVESTMENT_RADIUS: 150,
        INVESTMENT_RATE: 1,
        MACHINE_GUN_RATE: 30,
        ROCKET_COOLDOWN: 2000
    },
    
    // 市场风险(敌人)设置
    MARKET: {
        SPAWN_RATE: 0.02,
        TYPES: [
            {
                id: 'volatility',  // 市场波动
                name: '市场波动',
                color: '#e74c3c',
                baseHealth: 3,
                baseSpeed: 2.0,
                baseSize: 18,
                baseValue: 15,
                behavior: 'zigzag'  // 锯齿形移动
            },
            {
                id: 'inflation',  // 通货膨胀
                name: '通货膨胀',
                color: '#f39c12',
                baseHealth: 5,
                baseSpeed: 1.0,
                baseSize: 22,
                baseValue: 20,
                behavior: 'growing'  // 逐渐变大
            },
            {
                id: 'bearMarket',  // 熊市
                name: '熊市',
                color: '#8e44ad',
                baseHealth: 7,
                baseSpeed: 2.5,
                baseSize: 25,
                baseValue: 30,
                behavior: 'chasing'  // 追踪玩家
            },
            {
                id: 'recession',  // 经济衰退
                name: '经济衰退',
                color: '#2c3e50',
                baseHealth: 4,
                baseSpeed: 1.2,
                baseSize: 20,
                baseValue: 25,
                behavior: 'splitting'  // 被击中时分裂
            }
        ]
    },
    
    // 资产(收集物)设置
    ASSET: {
        SPAWN_RATE: 0.01,
        TYPES: ['股票', '黄金', '债券', '现金']
    },
    
    // 投资(子弹)设置
    OPPORTUNITY: {
        SIZE: 8,
        SPEED: 5
    },
    
    // 武器设置
    WEAPONS: {
        MACHINE_GUN: {
            NAME: "连射机枪",
            DESCRIPTION: "快速连射的小型投资",
            COOLDOWN: 100,
            COLOR: "#f1c40f"
        },
        ROCKET: {
            NAME: "火箭炮",
            DESCRIPTION: "强大的范围伤害投资",
            COOLDOWN: 2000,
            COLOR: "#e74c3c",
            EXPLOSION_RADIUS: 80
        }
    },
    
    // 道具设置
    ITEMS: {
        BOMB: {
            NAME: "市场炸弹",
            DESCRIPTION: "全屏范围伤害，清除所有市场风险",
            COOLDOWN: 30000, // 30秒冷却
            COLOR: "#9b59b6",
            DAMAGE: 100,
            EFFECT_DURATION: 1000, // 效果持续1秒
            STRATEGIES: [
                "量化交易",
                "高频交易",
                "算法交易",
                "套利交易",
                "趋势跟踪",
                "价值投资",
                "技术分析",
                "基本面分析"
            ]
        }
    },
    
    // 颜色设置
    COLORS: {
        PLAYER: '#3498db',
        MARKET: '#e74c3c',
        OPPORTUNITY: '#f1c40f',
        ASSET: '#2ecc71',
        UI: {
            TEXT: 'white',
            INDICATOR: 'rgba(52, 152, 219, 0.5)',
            RADIUS: 'rgba(52, 152, 219, 0.2)'
        }
    }
}; 