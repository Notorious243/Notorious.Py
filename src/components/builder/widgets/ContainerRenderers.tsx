import React, { useState, useEffect, useMemo } from 'react';
import { WidgetRenderContext } from './widget-shared';
import { FrameInternalGrid } from '../FrameInternalGrid';

// ========== CTkFrame ==========
export const FrameRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { widget, baseStyle, cornerRadius, effectiveBorderWidth, effectiveBorderColor, isPreviewMode, contentRef, childElements, containerMetrics, isDraggingChild } = ctx;
  const properties = widget.properties || {};
  const style = widget.style || {};

  const frameBgColor = style.backgroundColor || properties.fg_color || ctx.colors.fg;
  const paddingValue = typeof style.padding === 'number' ? style.padding : 0;
  const innerHeight = containerMetrics ? Math.max(containerMetrics.innerHeight, 0) : undefined;
  const frameAutoLayout = widget.autoLayout;
  const isAutoLayoutActive = frameAutoLayout?.enabled === true;

  return (
    <div style={{ ...baseStyle, pointerEvents: 'auto', backgroundColor: frameBgColor, border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`, borderRadius: `${cornerRadius}px`, padding: `${paddingValue}px`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: isDraggingChild ? 'visible' : 'hidden' }}>
      {isAutoLayoutActive && !isPreviewMode && (
        <div style={{ position: 'absolute', top: 2, right: 2, zIndex: 40, display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(15, 52, 96, 0.85)', color: '#FFFFFF', fontSize: '9px', fontWeight: 600, letterSpacing: '0.02em', lineHeight: '14px', pointerEvents: 'none' }}>
          {frameAutoLayout.direction === 'horizontal' ? '→' : '↓'}
          <span>Auto</span>
        </div>
      )}
      <div ref={contentRef ?? undefined} style={{ position: 'relative', width: '100%', height: '100%', minHeight: innerHeight ? `${innerHeight}px` : undefined, pointerEvents: 'auto' }}>
        {!isPreviewMode && containerMetrics && isDraggingChild && (
          <FrameInternalGrid width={containerMetrics.innerWidth} height={containerMetrics.innerHeight} gridSize={10} show={true} />
        )}
        {childElements}
      </div>
    </div>
  );
});

// ========== CTkScrollableFrame ==========
export const ScrollableFrameRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { widget, isDark, colors, baseStyle, cornerRadius, effectiveBorderWidth, effectiveBorderColor, isPreviewMode, contentRef, childElements, childWidgets, containerMetrics, isDraggingChild } = ctx;
  const properties = widget.properties || {};
  const style = widget.style || {};

  const scrollFrameBgColor = style.backgroundColor || properties.fg_color || colors.fg;
  const scrollFrameTextColor = style.textColor || properties.text_color || colors.text;
  const labelTextColor = properties.label_text_color || scrollFrameTextColor;
  const labelBackgroundColor = properties.label_fg_color || 'transparent';
  const paddingValue = typeof style.padding === 'number' ? style.padding : 0;
  const labelText = properties.label_text || '';
  const orientation = properties.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  const innerHeight = containerMetrics ? Math.max(containerMetrics.innerHeight, 0) : undefined;
  const innerWidth = containerMetrics ? Math.max(containerMetrics.innerWidth, 0) : undefined;
  const viewportWidth = innerWidth ?? widget.size.width;
  const viewportHeight = innerHeight ?? widget.size.height;
  const originX = widget.position.x + (containerMetrics?.offsetX ?? 0);
  const originY = widget.position.y + (containerMetrics?.offsetY ?? 0);
  const contentExtent = useMemo(() => {
    let maxRight = viewportWidth;
    let maxBottom = viewportHeight;

    (childWidgets ?? []).forEach((child) => {
      const localX = child.position.x - originX;
      const localY = child.position.y - originY;
      maxRight = Math.max(maxRight, localX + child.size.width);
      maxBottom = Math.max(maxBottom, localY + child.size.height);
    });

    return {
      width: Math.max(1, Math.ceil(maxRight)),
      height: Math.max(1, Math.ceil(maxBottom)),
    };
  }, [childWidgets, originX, originY, viewportWidth, viewportHeight]);

  const scrollbarTrackColor = properties.scrollbar_fg_color || 'transparent';
  const scrollbarThumbColor = properties.scrollbar_button_color || (isDark ? '#4A4D50' : '#CCCCCC');
  const scrollbarThumbHoverColor = properties.scrollbar_button_hover_color || (isDark ? '#636363' : '#A5A5A5');
  const useScrollableViewport = !isDraggingChild || isPreviewMode;

  const scrollViewportStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    overflowX: useScrollableViewport ? (orientation === 'horizontal' ? 'auto' : 'hidden') : 'visible',
    overflowY: useScrollableViewport ? (orientation === 'vertical' ? 'auto' : 'hidden') : 'visible',
    borderRadius: `${Math.max(cornerRadius - 4, 4)}px`,
    backgroundColor: scrollFrameBgColor,
    border: 'none',
    scrollbarWidth: useScrollableViewport ? 'thin' : undefined,
    scrollbarColor: useScrollableViewport ? `${scrollbarThumbColor} ${scrollbarTrackColor}` : undefined,
  };
  const cssVars = scrollViewportStyle as React.CSSProperties & Record<string, string>;
  cssVars['--ctk-scroll-track-color'] = scrollbarTrackColor;
  cssVars['--ctk-scroll-thumb-color'] = scrollbarThumbColor;
  cssVars['--ctk-scroll-thumb-hover-color'] = scrollbarThumbHoverColor;

  return (
    <div style={{ ...baseStyle, pointerEvents: 'auto', backgroundColor: scrollFrameBgColor, border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`, borderRadius: `${cornerRadius}px`, padding: `${paddingValue}px`, position: 'relative', display: 'flex', flexDirection: 'column', gap: labelText ? '12px' : '8px', overflow: isDraggingChild ? 'visible' : 'hidden' }}>
      {labelText && (
        <div
          style={{
            color: labelTextColor,
            backgroundColor: labelBackgroundColor,
            fontWeight: 600,
            fontSize: '14px',
            letterSpacing: '0.01em',
            pointerEvents: 'none',
          }}
        >
          {labelText}
        </div>
      )}
      <div
        className={isPreviewMode ? 'ctk-scrollable-content' : ''}
        style={scrollViewportStyle}
      >
        <div
          ref={contentRef ?? undefined}
          style={{
            position: 'relative',
            width: orientation === 'horizontal' ? `${contentExtent.width}px` : '100%',
            minHeight: orientation === 'vertical' ? `${contentExtent.height}px` : '100%',
            pointerEvents: 'auto',
          }}
        >
          {!isPreviewMode && containerMetrics && isDraggingChild && (
            <FrameInternalGrid width={containerMetrics.innerWidth} height={Math.max(containerMetrics.innerHeight, innerHeight || 0)} gridSize={10} show={true} />
          )}
          {childElements}
        </div>
      </div>
    </div>
  );
});

// ========== CTkTabview ==========
export const TabviewRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { widget, isDark, colors, baseStyle, fgColor, textColor, cornerRadius, effectiveBorderWidth, effectiveBorderColor, isPreviewMode, contentRef, childElements, containerMetrics, activeTab, onTabChange, updateWidget, isDraggingChild } = ctx;
  const properties = widget.properties || {};
  const style = widget.style || {};

  const tabs = useMemo(
    () => (Array.isArray(properties.tabs) && properties.tabs.length > 0 ? properties.tabs : ['Tab 1']),
    [properties.tabs]
  );
  const paddingValue = typeof style.padding === 'number' ? style.padding : 0;
  const tabViewBgColor = style.backgroundColor || properties.fg_color || colors.fg;
  const innerHeight = containerMetrics ? Math.max(containerMetrics.innerHeight, 0) : undefined;

  const [localActiveTab, setLocalActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const tabList = tabs;
    if (activeTab && tabList.includes(activeTab)) {
      setLocalActiveTab((prev) => (prev === activeTab ? prev : activeTab));
    } else {
      const fallback = tabList[0];
      setLocalActiveTab((prev) => (prev === fallback ? prev : fallback));
    }
  }, [tabs, activeTab]);

  const fallbackTab = tabs[0];
  const resolvedActive = (activeTab && tabs.includes(activeTab) && activeTab) || (localActiveTab && tabs.includes(localActiveTab) && localActiveTab) || fallbackTab;

  const handleTabSelect = (event: React.MouseEvent, tab: string) => {
    event.stopPropagation();
    setLocalActiveTab((prev) => (prev === tab ? prev : tab));
    onTabChange?.(tab);
  };

  const handleAddTab = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!updateWidget) return;
    const newTabNumber = tabs.length + 1;
    const newTabs = [...tabs, `Tab ${newTabNumber}`];
    updateWidget(widget.id, { properties: { ...properties, tabs: newTabs } }, true);
  };

  const handleRemoveTab = (event: React.MouseEvent, tabToRemove: string) => {
    event.stopPropagation();
    if (!updateWidget || tabs.length <= 1) return;
    const newTabs = tabs.filter((t: string) => t !== tabToRemove);
    updateWidget(widget.id, { properties: { ...properties, tabs: newTabs } }, true);
    if (resolvedActive === tabToRemove) {
      onTabChange?.(newTabs[0]);
    }
  };

  const tabAnchor = properties.anchor || 'n'; // 'n'=top, 's'=bottom, 'w'=left, 'e'=right
  const isSideAnchor = tabAnchor === 'w' || tabAnchor === 'e';
  const isBottomOrRight = tabAnchor === 's' || tabAnchor === 'e';

  const tabBarEl = (
    <div style={{ display: 'flex', flexDirection: isSideAnchor ? 'column' : 'row', gap: '6px', backgroundColor: isDark ? '#1F1F1F' : '#E5E9F3', borderRadius: `${Math.max(cornerRadius - 6, 6)}px`, padding: '4px', ...(isSideAnchor ? { minWidth: '40px' } : { minHeight: '40px' }), alignItems: 'center', pointerEvents: 'auto', flexShrink: 0 }}>
      {tabs.map((tab: string, tabIndex: number) => {
        const isActive = tab === resolvedActive;
        return (
          <div key={`tab-${tabIndex}-${tab}`} style={{ flex: 1, position: 'relative', display: 'flex', ...(isSideAnchor ? { width: '100%' } : {}) }}>
            <button type="button" onClick={(event) => handleTabSelect(event, tab)} style={{ width: '100%', padding: isSideAnchor ? '10px 8px' : '8px 14px', paddingRight: !isPreviewMode && tabs.length > 1 && !isSideAnchor ? '32px' : (isSideAnchor ? '8px' : '14px'), backgroundColor: isActive ? fgColor : 'transparent', color: isActive ? '#FFFFFF' : textColor, borderRadius: `${Math.max(cornerRadius - 6, 6)}px`, border: 'none', fontSize: isSideAnchor ? '11px' : '13px', fontWeight: isActive ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: isActive ? '0 8px 20px rgba(59, 142, 208, 0.25)' : 'none', writingMode: isSideAnchor ? 'vertical-lr' : undefined, textOrientation: isSideAnchor ? 'mixed' : undefined }}>{tab}</button>
            {!isPreviewMode && tabs.length > 1 && !isSideAnchor && (
              <button type="button" onClick={(event) => handleRemoveTab(event, tab)} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EF4444'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#EF4444'; }}>×</button>
            )}
          </div>
        );
      })}
      {!isPreviewMode && (
        <button type="button" onClick={handleAddTab} style={{ minWidth: isSideAnchor ? '100%' : '40px', minHeight: isSideAnchor ? '32px' : undefined, height: isSideAnchor ? undefined : '32px', borderRadius: `${Math.max(cornerRadius - 6, 6)}px`, border: 'none', backgroundColor: isDark ? 'rgba(15, 52, 96, 0.2)' : 'rgba(15, 52, 96, 0.15)', color: '#0F3460', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0F3460'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(15, 52, 96, 0.2)' : 'rgba(15, 52, 96, 0.15)'; e.currentTarget.style.color = '#0F3460'; }} title="Ajouter un onglet">+</button>
      )}
    </div>
  );

  const contentEl = (
    <div style={{ flex: 1, position: 'relative', borderRadius: `${Math.max(cornerRadius - 6, 6)}px`, backgroundColor: isDark ? '#14161C' : '#FFFFFF', border: `1px dashed ${isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.45)'}`, overflow: isPreviewMode ? 'hidden' : 'visible' }}>
      <div ref={contentRef ?? undefined} style={{ position: 'relative', width: '100%', height: '100%', minHeight: innerHeight ? `${innerHeight}px` : undefined, pointerEvents: 'auto' }}>
        {!isPreviewMode && containerMetrics && isDraggingChild && (
          <FrameInternalGrid width={containerMetrics.innerWidth} height={containerMetrics.innerHeight} gridSize={10} show={true} />
        )}
        {childElements}
      </div>
    </div>
  );

  return (
    <div style={{ ...baseStyle, pointerEvents: 'auto', backgroundColor: tabViewBgColor, border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`, borderRadius: `${cornerRadius}px`, padding: `${paddingValue}px`, display: 'flex', flexDirection: isSideAnchor ? 'row' : 'column', gap: '12px', position: 'relative', overflow: isDraggingChild ? 'visible' : 'hidden' }}>
      {isBottomOrRight ? <>{contentEl}{tabBarEl}</> : <>{tabBarEl}{contentEl}</>}
    </div>
  );
});
