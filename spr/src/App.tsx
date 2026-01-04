

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { processNote } from './services/geminiService';
import { useAppSync } from './hooks/useAppSync';
import { useTheme } from './hooks/useTheme';
import { useContextMenu } from './hooks/useContextMenu';
import { useStats } from './hooks/useStats';
import { useRecentlyCompleted } from './hooks/useRecentlyCompleted';
import { useNodeLinks } from './hooks/useNodeLinks';
import { nodeUtils } from './utils/nodeUtils';
import { MenuItemAction, NodeDrawing, ParagraphSummary, NodeRetrievalStats } from '../types';

// Components
import AppLayout from './components/layout/AppLayout';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ContextMenu from './components/menu/ContextMenu';
import SettingsModal from './components/modals/SettingsModal';
import ConfirmModal from './components/modals/ConfirmModal';
import TreeItem from './components/tree/TreeItem';
import MarkdownView from './components/markdown/MarkdownView';
import Loading from './components/ui/Loading';
import ErrorDisplay from './components/ui/ErrorDisplay';
export const App = () => {
    // ========== 核心数据同步 ==========
    const {
        state,
        isLoading,
        isSyncing,
        lastSyncSuccess,
        error,
        markdownScrollPosition,
        init,
        reparse,
        toggleComplete,
        addCategory,
        removeCategory,
        updateMarkdownScrollPosition,
        setState
    } = useAppSync();

    // ========== 主题管理 ==========
    const { theme, toggleTheme } = useTheme(state.theme, (newTheme) => {
        setState(prev => ({ ...prev, theme: newTheme }));
    });

    // ========== 右键菜单管理 ==========
    const {
        contextMenu,
        menuConfig,
        openContextMenu,
        closeContextMenu
    } = useContextMenu(state.menuConfig);

    // ========== 统计数据 ==========
    const stats = useStats(state.analysis, state.completedSlots.length);

    // ========== 最近完成的节点（高亮用） ==========
    const { getLatestCompleted } = useRecentlyCompleted();

    // ========== 节点与段落关联管理 ==========
    const {
        selectedNodePath,
        highlightedParagraph,
        nodeParagraphs,
        toggleLink: toggleNodeParagraph,
        enterLinkMode,
        exitLinkMode,
        highlightParagraph,
        setNodeParagraphs,
    } = useNodeLinks();

    // 初始化时从 state 中恢复节点关联数据
    useEffect(() => {
        if (state.nodeParagraphs) {
            setNodeParagraphs(state.nodeParagraphs);
        }
    }, [state.nodeParagraphs, setNodeParagraphs]);

    // 同步 nodeParagraphs 到 state
    useEffect(() => {
        if (Object.keys(nodeParagraphs).length > 0) {
            setState(prev => ({ ...prev, nodeParagraphs }));
        }
    }, [nodeParagraphs, setState]);

    // ========== UI 状态 ==========
    const [showSettings, setShowSettings] = useState(false);
    const [isExpandingParts, setIsExpandingParts] = useState(false);
    const [showMarkdownPanel, setShowMarkdownPanel] = useState(true);
    const [showReparseConfirm, setShowReparseConfirm] = useState(false);
    const [isReparsing, setIsReparsing] = useState(false);

    // ========== 高亮和展开路径计算 ==========
    const [highlightedPaths, setHighlightedPaths] = useState<Set<string>>(new Set());
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isLoading) {
            const latestPaths = getLatestCompleted(2);
            if (latestPaths.length > 0) {
                setHighlightedPaths(new Set(latestPaths));

                // 计算需要展开的父路径
                const expandSet = new Set<string>();
                latestPaths.forEach(path => {
                    const parentPaths = nodeUtils.getParentPaths(path);
                    parentPaths.forEach(p => expandSet.add(p));
                });
                setExpandedPaths(expandSet);

                // 5秒后清除高亮
                const timer = setTimeout(() => setHighlightedPaths(new Set()), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [isLoading, getLatestCompleted]);

    // ========== 笔记管理 ==========
    const addNote = useCallback(async (path: string, content: string) => {
        const tempId = Math.random().toString(36).substr(2, 9);
        setState(prev => ({
            ...prev,
            notes: {
                ...prev.notes,
                [path]: [
                    { id: tempId, content, originalContent: content, timestamp: Date.now(), category: '分析中...' },
                    ...(prev.notes[path] || [])
                ]
            }
        }));

        try {
            const { correctedContent, category } = await processNote(content, state.noteCategories);
            setState(prev => {
                const nodeNotes = [...(prev.notes[path] || [])];
                const idx = nodeNotes.findIndex(n => n.id === tempId);
                if (idx !== -1) {
                    nodeNotes[idx] = { ...nodeNotes[idx], content: correctedContent, category };
                }
                return { ...prev, notes: { ...prev.notes, [path]: nodeNotes } };
            });
        } catch (e) {
            // 错误已在服务层处理
        }
    }, [setState, state.noteCategories]);

    // ========== 完成状态切换（包装以跟踪最近完成） ==========
    const { addCompleted } = useRecentlyCompleted();
    const handleToggleComplete = useCallback((path: string) => {
        const isCurrentlyCompleted = state.completedSlots.includes(path);
        toggleComplete(path);
        if (!isCurrentlyCompleted) {
            addCompleted(path);
        }
    }, [state.completedSlots, toggleComplete, addCompleted]);

    // ========== 菜单处理 ==========
    const handleMenuAction = useCallback(async (action: MenuItemAction) => {
        switch (action) {
            case 'openSettings':
                setShowSettings(true);
                break;
            case 'toggleExpand':
                setIsExpandingParts(prev => !prev);
                break;
            case 'toggleTheme':
                toggleTheme();
                break;
            case 'refresh':
                init();
                break;
            case 'toggleMarkdownPanel':
                setShowMarkdownPanel(prev => !prev);
                break;
            case 'reparse':
                setShowReparseConfirm(true);
                break;
        }
        closeContextMenu();
    }, [toggleTheme, init, closeContextMenu]);

    const enhancedMenuConfig = {
        groups: menuConfig.groups.map(group => ({
            ...group,
            items: group.items.map(item => ({
                ...item,
                action: () => handleMenuAction(item.action)
            }))
        }))
    };

    // ========== 重新解析 ==========
    const handleReparse = useCallback(async () => {
        setIsReparsing(true);
        try {
            await reparse();
            setShowReparseConfirm(false);
        } finally {
            setIsReparsing(false);
        }
    }, [reparse]);

    // ========== 绘图功能 ==========
    const handleDrawingChange = useCallback((nodePath: string, data: NodeDrawing) => {
        setState(prev => ({
            ...prev,
            nodeDrawings: {
                ...(prev.nodeDrawings || {}),
                [nodePath]: data
            }
        }));
    }, [setState]);

    // ========== 摘要功能 ==========
    const handleSaveSummary = useCallback((summary: ParagraphSummary) => {
        setState(prev => ({
            ...prev,
            paragraphSummaries: [...(prev.paragraphSummaries || []), summary]
        }));
    }, [setState]);

    // ========== 提取训练统计 ==========
    const handleSaveRetrievalStats = useCallback((path: string, stats: NodeRetrievalStats) => {
        setState(prev => ({
            ...prev,
            nodeRetrievalStats: {
                ...(prev.nodeRetrievalStats || {}),
                [path]: stats
            }
        }));
    }, [setState]);

    // ========== 节点和段落点击处理 ==========
    const markdownViewRef = useRef<{ scrollToParagraph: (index: number) => void }>(null);
    const treeContainerRef = useRef<HTMLDivElement>(null);

    // 反向映射：段落索引 -> 节点路径（用于段落 hover 按钮跳转）
    const paragraphNodeMap = useMemo(() => {
        const map: Record<number, string> = {};
        Object.entries(nodeParagraphs).forEach(([nodePath, paraIndices]) => {
            paraIndices.forEach((idx: number) => {
                map[idx] = nodePath;
            });
        });
        return map;
    }, [nodeParagraphs]);

    // 滚动到左侧节点
    const scrollToTreeNode = useCallback((nodePath: string) => {
        setTimeout(() => {
            const element = document.querySelector(`[data-node-path="${nodePath}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }, []);

    const handleParagraphClick = useCallback((paragraphIndex: number) => {
        highlightParagraph(paragraphIndex);
    }, [highlightParagraph]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY);
    }, [openContextMenu]);

    // ========== 渲染 ==========
    return (
        <AppLayout
            theme={theme}
            onContextMenu={handleContextMenu}
            onClick={closeContextMenu}
        >
            {/* 右键菜单 */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    menuConfig={enhancedMenuConfig}
                    theme={theme}
                />
            )}

            {/* 设置弹窗 */}
            {showSettings && (
                <SettingsModal
                    isOpen={showSettings}
                    categories={state.noteCategories}
                    onAddCategory={addCategory}
                    onRemoveCategory={removeCategory}
                    onClose={() => setShowSettings(false)}
                    theme={theme}
                    menuConfig={state.menuConfig}
                    onUpdateMenuConfig={(config) => setState(prev => ({ ...prev, menuConfig: config }))}
                />
            )}

            {/* 重新解析确认弹窗 */}
            {showReparseConfirm && (
                <ConfirmModal
                    isOpen={showReparseConfirm}
                    title="重新解析文档"
                    message="此操作将清空本地缓存，重新获取并解析 Markdown 文档。你的笔记和分类将被保留，但完成进度和滚动位置将被重置。确定���继续吗？"
                    confirmText="确认重新解析"
                    cancelText="取消"
                    onConfirm={handleReparse}
                    onCancel={() => setShowReparseConfirm(false)}
                    theme={theme}
                    isLoading={isReparsing}
                />
            )}

            <main className="flex-1 flex justify-center overflow-hidden py-6">
                <div className={`h-full flex transition-all duration-500 overflow-hidden relative border-x rounded-[2.5rem] ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700/30 app-container-dark' : 'bg-white/90 border-slate-200 app-container-light'
                    } ${showMarkdownPanel ? 'w-full max-w-6xl' : 'w-full max-w-4xl'}`}>
                    {/* 左侧：树形结构区域 */}
                    <div className={`flex flex-col ${showMarkdownPanel ? 'w-2/3 border-r' : 'w-full'} rounded-l-[2.5rem] overflow-hidden ${theme === 'dark' ? 'border-slate-700/30' : 'border-slate-200'
                        }`}>
                        <Header
                            title={state.analysis?.label || ''}
                            percentage={stats.percentage}
                            theme={theme}
                        />

                        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                            {isLoading ? (
                                <Loading />
                            ) : error ? (
                                <ErrorDisplay error={error} onRetry={() => init()} theme={theme} />
                            ) : (
                                <div className="space-y-6 pb-32">
                                    {state.analysis && (
                                        <TreeItem
                                            node={state.analysis}
                                            level={0}
                                            path={state.analysis.label}
                                            completedSlots={state.completedSlots}
                                            onToggleComplete={handleToggleComplete}
                                            forceExpand={isExpandingParts}
                                            notes={state.notes}
                                            onAddNote={addNote}
                                            theme={theme}
                                            selectedNodePath={selectedNodePath}
                                            onExitLinkMode={exitLinkMode}
                                            onEnterLinkMode={enterLinkMode}
                                            nodeParagraphs={nodeParagraphs}
                                            highlightedPaths={highlightedPaths}
                                            expandedPaths={expandedPaths}
                                            onScrollToParagraph={(paraIndex) => {
                                                highlightParagraph(paraIndex);
                                                markdownViewRef.current?.scrollToParagraph(paraIndex);
                                            }}
                                            nodeDrawings={state.nodeDrawings || {}}
                                            onDrawingChange={handleDrawingChange}
                                            nodeRetrievalStats={state.nodeRetrievalStats || {}}
                                            onSaveRetrievalStats={handleSaveRetrievalStats}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧：Markdown 预览区域 */}
                    {showMarkdownPanel && (
                        <div className="w-1/3 flex flex-col rounded-r-[2.5rem] overflow-hidden">
                            <MarkdownView
                                ref={markdownViewRef}
                                markdown={state.markdown}
                                theme={theme}
                                scrollPosition={markdownScrollPosition}
                                onScrollChange={updateMarkdownScrollPosition}
                                onParagraphClick={handleParagraphClick}
                                highlightedParagraph={highlightedParagraph}
                                selectedNodePath={selectedNodePath}
                                onToggleParagraphLink={(paraIndex) => selectedNodePath && toggleNodeParagraph(selectedNodePath, paraIndex)}
                                linkedParagraphs={selectedNodePath ? (nodeParagraphs[selectedNodePath] || []) : []}
                                paragraphNodeMap={paragraphNodeMap}
                                onScrollToNode={scrollToTreeNode}
                                paragraphSummaries={state.paragraphSummaries || []}
                                onSaveSummary={handleSaveSummary}
                            />
                        </div>
                    )}
                </div>
            </main>

            <Footer
                isSyncing={isSyncing}
                lastSyncSuccess={lastSyncSuccess}
                theme={theme}
            />
        </AppLayout>
    );
}
