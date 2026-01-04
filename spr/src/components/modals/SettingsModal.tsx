import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Plus, Settings as SettingsIcon, Grid } from 'lucide-react';
import { MenuConfig, MenuPosition } from '../../types';
import { getBorderClass, getGlassClass, getTextClass, getMutedTextClass, getHoverBgClass } from '../../config/themeConfig';

interface SettingsModalProps {
  isOpen: boolean;
  categories: string[];
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
  onClose: () => void;
  theme: 'light' | 'dark';
  menuConfig?: MenuConfig;
  onUpdateMenuConfig?: (config: MenuConfig) => void;
}

type Tab = 'categories' | 'menu';

const ZONE_LABELS: Record<MenuPosition, string> = {
  top: '上方',
  bottom: '下方',
  left: '左侧',
  right: '右侧'
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  categories,
  onAddCategory,
  onRemoveCategory,
  onClose,
  theme,
  menuConfig,
  onUpdateMenuConfig
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);
  const mutedText = getMutedTextClass(theme);
  const hoverBg = getHoverBgClass(theme);

  if (!isOpen) return null;

  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;

    setIsProcessing(true);
    onAddCategory(newCategory.trim());
    setNewCategory('');
    setTimeout(() => setIsProcessing(false), 500);
  };

  // 移动菜单项到指定区域
  const moveItemToZone = (itemId: string, targetPosition: MenuPosition) => {
    if (!menuConfig || !onUpdateMenuConfig) return;

    const newGroups = [...menuConfig.groups];
    let itemToMove: any = null;
    let sourceGroupIndex = -1;
    let itemIndex = -1;

    // 找到要移动的菜单项
    newGroups.forEach((group, gIdx) => {
      const foundItem = group.items.find(item => item.id === itemId);
      if (foundItem) {
        itemToMove = { ...foundItem };
        sourceGroupIndex = gIdx;
        itemIndex = group.items.findIndex(item => item.id === itemId);
      }
    });

    if (!itemToMove) return;

    // 从原位置移除
    newGroups[sourceGroupIndex].items.splice(itemIndex, 1);

    // 添加到目标位置
    const targetGroupIndex = newGroups.findIndex(g => g.position === targetPosition);
    if (targetGroupIndex !== -1) {
      newGroups[targetGroupIndex].items.push(itemToMove);
    }

    onUpdateMenuConfig({ ...menuConfig, groups: newGroups });
  };

  // 切换菜单项可见性
  const toggleItemVisibility = (itemId: string) => {
    if (!menuConfig || !onUpdateMenuConfig) return;

    const newGroups = menuConfig.groups.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.id === itemId) {
          return { ...item, visible: item.visible !== undefined ? !item.visible : false };
        }
        return item;
      })
    }));

    onUpdateMenuConfig({ ...menuConfig, groups: newGroups });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          {/* 背景遮罩 - 液态模糊 */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* 弹框内容 - 玻璃态容器 */}
          <motion.div
            className={`relative w-full max-w-3xl overflow-hidden ${glassClass} ${borderClass}`}
            style={{
              borderRadius: '3rem',
              backdropFilter: 'blur(60px)',
              WebkitBackdropFilter: 'blur(60px)',
              boxShadow: theme === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 28,
              mass: 0.8
            }}
          >
            {/* 液态光泽层 */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* 内容区域 */}
            <div className="relative z-10 p-10">
              {/* 头部 */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${glassClass} ${borderClass}`}
                    style={{ backdropFilter: 'blur(40px)' }}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <SettingsIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </motion.div>
                  <h3 className={`text-2xl font-extralight tracking-tighter ${textColor}`}>
                    设置
                  </h3>
                </div>
                <motion.button
                  onClick={onClose}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${glassClass} ${borderClass} ${mutedText} hover:text-rose-500 transition-colors`}
                  style={{ backdropFilter: 'blur(40px)' }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* 标签页切换 - 液态效果 */}
              <div className={`relative flex gap-2 p-2 rounded-3xl ${glassClass} ${borderClass} mb-8`}>
                {/* 液态滑块背景 */}
                <motion.div
                  className={`absolute top-2 bottom-2 rounded-2xl ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'}`}
                  initial={false}
                  animate={{
                    left: activeTab === 'categories' ? '8px' : 'calc(50% + 4px)',
                    width: 'calc(50% - 12px)'
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30
                  }}
                />

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`relative flex-1 py-4 px-6 rounded-2xl text-sm font-bold transition-all z-10 ${activeTab === 'categories' ? 'text-white' : textColor
                    }`}
                >
                  <Hash className="w-4 h-4 inline mr-2" />
                  分类管理
                </button>
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`relative flex-1 py-4 px-6 rounded-2xl text-sm font-bold transition-all z-10 ${activeTab === 'menu' ? 'text-white' : textColor
                    }`}
                >
                  <Grid className="w-4 h-4 inline mr-2" />
                  菜单布局
                </button>
              </div>

              {/* 标签页内容 */}
              <AnimatePresence mode="wait">
                {activeTab === 'categories' && (
                  <motion.div
                    key="categories"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  >
                    {/* 添加分类 */}
                    <div className="flex gap-4 mb-6">
                      <input
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                        placeholder="输入新分类名称..."
                        disabled={isProcessing}
                        className={`flex-1 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${glassClass} ${borderClass} ${textColor} placeholder:${mutedText}`}
                        style={{ backdropFilter: 'blur(40px)' }}
                      />
                      <motion.button
                        onClick={handleAddCategory}
                        disabled={isProcessing || !newCategory.trim()}
                        className={`px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 ${theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-500 text-white hover:bg-indigo-400'
                          }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        {isProcessing ? (
                          <motion.span
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            添加
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* 分类列表 */}
                    <div className={`max-h-64 overflow-y-auto rounded-3xl p-6 custom-scrollbar ${glassClass} ${borderClass}`}>
                      {categories.length === 0 ? (
                        <p className={`text-center py-12 text-sm ${mutedText}`}>
                          暂无分类，请添加新分类
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {categories.map((cat, index) => (
                            <motion.div
                              key={cat}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.05, type: 'spring', stiffness: 280 }}
                              className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${glassClass} ${borderClass} ${textColor}`}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Hash className="w-4 h-4 opacity-40" />
                              <span className="text-sm font-medium">{cat}</span>
                              <motion.button
                                onClick={() => onRemoveCategory(cat)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all ml-1"
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 提示 */}
                    <p className={`text-xs text-center mt-6 ${mutedText}`}>
                      分类用于标记和筛选你的分心笔记
                    </p>
                  </motion.div>
                )}

                {activeTab === 'menu' && menuConfig && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                    className="space-y-8"
                  >
                    <p className={`text-sm mb-4 ${mutedText}`}>
                      将菜单项拖放到不同的区域以自定义右键菜单布局
                    </p>

                    {/* 四个区域网格 */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* 上方区域 */}
                      <motion.div
                        className={`col-start-2 rounded-3xl p-6 border-2 border-dashed min-h-[120px] ${glassClass} ${borderClass}`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <div className={`text-xs font-bold uppercase tracking-wider mb-4 text-center ${mutedText}`}>
                          上方区域
                        </div>
                        {menuConfig.groups.filter(g => g.position === 'top').flatMap(g => g.items).map(item => (
                          <MenuItemConfig
                            key={item.id}
                            item={item}
                            theme={theme}
                            onToggleVisibility={() => toggleItemVisibility(item.id)}
                            onMoveToZone={(zone) => moveItemToZone(item.id, zone)}
                          />
                        ))}
                      </motion.div>

                      {/* 左侧区域 */}
                      <motion.div
                        className={`row-start-2 rounded-3xl p-6 border-2 border-dashed min-h-[120px] ${glassClass} ${borderClass}`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <div className={`text-xs font-bold uppercase tracking-wider mb-4 text-center ${mutedText}`}>
                          左侧区域
                        </div>
                        {menuConfig.groups.filter(g => g.position === 'left').flatMap(g => g.items).map(item => (
                          <MenuItemConfig
                            key={item.id}
                            item={item}
                            theme={theme}
                            onToggleVisibility={() => toggleItemVisibility(item.id)}
                            onMoveToZone={(zone) => moveItemToZone(item.id, zone)}
                          />
                        ))}
                      </motion.div>

                      {/* 中间显示一个提示 */}
                      <div className={`row-start-2 flex items-center justify-center rounded-3xl p-6 ${glassClass} ${borderClass}`}>
                        <div className={`text-xs text-center ${mutedText}`}>
                          右键菜单<br />中心
                        </div>
                      </div>

                      {/* 右侧区域 */}
                      <motion.div
                        className={`row-start-2 rounded-3xl p-6 border-2 border-dashed min-h-[120px] ${glassClass} ${borderClass}`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <div className={`text-xs font-bold uppercase tracking-wider mb-4 text-center ${mutedText}`}>
                          右侧区域
                        </div>
                        {menuConfig.groups.filter(g => g.position === 'right').flatMap(g => g.items).map(item => (
                          <MenuItemConfig
                            key={item.id}
                            item={item}
                            theme={theme}
                            onToggleVisibility={() => toggleItemVisibility(item.id)}
                            onMoveToZone={(zone) => moveItemToZone(item.id, zone)}
                          />
                        ))}
                      </motion.div>

                      {/* 下方区域 */}
                      <motion.div
                        className={`col-start-2 rounded-3xl p-6 border-2 border-dashed min-h-[120px] ${glassClass} ${borderClass}`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <div className={`text-xs font-bold uppercase tracking-wider mb-4 text-center ${mutedText}`}>
                          下方区域
                        </div>
                        {menuConfig.groups.filter(g => g.position === 'bottom').flatMap(g => g.items).map(item => (
                          <MenuItemConfig
                            key={item.id}
                            item={item}
                            theme={theme}
                            onToggleVisibility={() => toggleItemVisibility(item.id)}
                            onMoveToZone={(zone) => moveItemToZone(item.id, zone)}
                          />
                        ))}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 菜单项配置组件
interface MenuItemConfigProps {
  item: { id: string; label: string; icon: string; visible?: boolean };
  theme: 'light' | 'dark';
  onToggleVisibility: () => void;
  onMoveToZone: (zone: MenuPosition) => void;
}

const MenuItemConfig: React.FC<MenuItemConfigProps> = ({ item, theme, onToggleVisibility, onMoveToZone }) => {
  const [showZoneSelector, setShowZoneSelector] = useState(false);
  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const textColor = getTextClass(theme);

  return (
    <div className="relative group mb-2 last:mb-0">
      <motion.div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${glassClass} ${borderClass}`}
        style={{
          opacity: item.visible === false ? 0.5 : 1,
          backdropFilter: 'blur(30px)'
        }}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.button
          onClick={onToggleVisibility}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${item.visible === false
            ? (theme === 'dark' ? 'bg-slate-700/50 text-slate-500' : 'bg-slate-200/50 text-slate-400')
            : (theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
            }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {item.visible !== false && <span className="text-xs">✓</span>}
        </motion.button>
        <span className={`text-sm font-medium ${textColor}`}>{item.label}</span>
        <motion.button
          onClick={() => setShowZoneSelector(!showZoneSelector)}
          className={`ml-auto text-xs px-3 py-1.5 rounded-full transition-all ${glassClass} ${borderClass} ${textColor}`}
          style={{ backdropFilter: 'blur(20px)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          移动
        </motion.button>
      </motion.div>

      {/* 区域选择器 */}
      <AnimatePresence>
        {showZoneSelector && (
          <motion.div
            className={`absolute z-10 mt-2 p-3 rounded-2xl shadow-lg border grid grid-cols-2 gap-2 ${glassClass} ${borderClass}`}
            style={{ backdropFilter: 'blur(40px)' }}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {(['top', 'left', 'right', 'bottom'] as MenuPosition[]).map(zone => (
              <motion.button
                key={zone}
                onClick={() => {
                  onMoveToZone(zone);
                  setShowZoneSelector(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${textColor} hover:bg-indigo-500/20`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {ZONE_LABELS[zone]}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsModal;
