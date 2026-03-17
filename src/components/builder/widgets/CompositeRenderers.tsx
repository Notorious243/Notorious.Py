import React, { useState } from 'react';
import { ICON_LIBRARY, normalizeIconKey } from '@/constants/icons';
import { WidgetRenderContext, getColor, toNumber } from './widget-shared';

const fallbackIcon = ICON_LIBRARY.clipboardList;

// ========== StatCard ==========
export const StatCardRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { widget, isDark, baseStyle, cornerRadius } = ctx;
  const properties = widget.properties || {};

  const cardBg = properties.backgroundColor || (isDark ? '#1C1C1E' : '#FFFFFF');
  const hasStatCustomIcon = !!properties.customIconData;
  const iconKey = normalizeIconKey(properties.icon);
  const StatIcon = ICON_LIBRARY[iconKey] || fallbackIcon;
  const iconColorValue = properties.iconColor || '#2563EB';
  const accentBackground = properties.accentColor || `${iconColorValue}26`;
  const titleColor = properties.titleColor || (isDark ? '#CBD5F5' : '#64748B');
  const valueColor = properties.valueColor || (isDark ? '#F8FAFC' : '#0F172A');
  const captionColor = properties.captionColor || '#94A3B8';
  const caption = properties.caption || '';
  const showIcon = (properties.showIcon !== false && iconKey !== 'none') || hasStatCustomIcon;
  const titleFontFamily = properties.titleFont || 'Poppins';
  const valueFontFamily = properties.valueFont || 'Poppins';
  const captionFontFamily = properties.captionFont || titleFontFamily;
  const titleFontSize = toNumber(properties.titleFontSize, 13);
  const valueFontSize = toNumber(properties.valueFontSize, 32);
  const captionFontSize = toNumber(properties.captionFontSize, 12);
  const iconSize = toNumber(properties.iconSize, 28);
  const iconContainerPadding = Math.max(12, Math.round(iconSize * 0.5));

  return (
    <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: cardBg, borderRadius: `${Math.max(cornerRadius, 16)}px`, padding: '20px', boxShadow: isDark ? '0 24px 60px rgba(15, 23, 42, 0.35)' : '0 24px 50px rgba(15, 23, 42, 0.12)', border: `1px solid ${isDark ? '#2F3344' : '#E2E8F0'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: `${titleFontSize}px`, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', color: titleColor, fontFamily: `${titleFontFamily}, sans-serif` }}>{properties.title || 'Statistique'}</span>
          <span style={{ fontSize: `${valueFontSize}px`, fontWeight: 700, letterSpacing: '-0.02em', color: valueColor, lineHeight: 1.1, fontFamily: `${valueFontFamily}, sans-serif`, whiteSpace: 'nowrap' }}>{properties.value || '123'}</span>
        </div>
        {showIcon && (
          <div style={{ backgroundColor: accentBackground, color: iconColorValue, borderRadius: '16px', padding: `${iconContainerPadding}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {hasStatCustomIcon ? (
              <img src={properties.customIconData} alt="icon" style={{ width: iconSize, height: iconSize, objectFit: 'contain' }} />
            ) : (
              StatIcon && <StatIcon size={iconSize} color={iconColorValue} strokeWidth={2.2} />
            )}
          </div>
        )}
      </div>
      {caption && (
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px dashed ${isDark ? '#2F3344' : '#E2E8F0'}`, fontSize: `${captionFontSize}px`, color: captionColor, opacity: 0.9, fontFamily: `${captionFontFamily}, sans-serif` }}>{caption}</div>
      )}
    </div>
  );
});

// ========== Table ==========
export const TableRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { isDark, colors, baseStyle, cornerRadius, textColor } = ctx;
  const properties = ctx.widget.properties || {};

  const defaultColumns = [{ id: 'id', label: 'ID' }, { id: 'name', label: 'Nom' }, { id: 'status', label: 'Statut' }];
  const columns = Array.isArray(properties.columns) && properties.columns.length > 0 ? properties.columns : defaultColumns;
  const rows = Array.isArray(properties.rows) && properties.rows.length > 0 ? properties.rows : [['1', 'Alice Martin', 'Confirmé'], ['2', 'Bob Dupont', 'En cours'], ['3', 'Chloé Leroy', 'Livré']];
  const showHeaders = properties.showHeaders !== false;
  const headerBg = properties.headerBgColor || (isDark ? '#0F3460' : '#0F3460');
  const headerTextColor = properties.headerTextColor || '#FFFFFF';
  const evenRowColor = properties.alternateRowColors !== false ? properties.evenRowColor || (isDark ? '#1E1E24' : '#F8FAFC') : 'transparent';
  const oddRowColor = properties.alternateRowColors !== false ? properties.oddRowColor || (isDark ? '#18181B' : '#FFFFFF') : 'transparent';
  const border = properties.borderColor || (isDark ? '#2F3032' : '#E2E8F0');
  const borderWidthValue = typeof properties.borderWidth === 'number' ? properties.borderWidth : 1;
  const rowHeightValue = toNumber(properties.rowHeight, 32);

  return (
    <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column', backgroundColor: getColor(properties.fg_color, colors.fg), borderRadius: `${Math.max(Math.min(cornerRadius, 4), 0)}px`, border: `${borderWidthValue}px solid ${border}`, overflow: 'hidden', boxShadow: 'none' }}>
      <div style={{ width: '100%', height: '100%', overflow: properties.enableScroll !== false ? 'auto' : 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '100%' }}>
          {showHeaders && (
            <thead>
              <tr>
                {columns.map((column: any, idx: number) => (
                  <th key={`th-${idx}`} style={{ backgroundColor: headerBg, color: headerTextColor, textAlign: 'left', padding: '0 12px', height: `${rowHeightValue}px`, lineHeight: `${rowHeightValue}px`, fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em', borderBottom: `${borderWidthValue}px solid ${border}`, minWidth: column.width ? `${column.width}px` : undefined }}>{column.label || column.id}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row: any, rowIndex: number) => {
              const backgroundColor = properties.alternateRowColors === false ? 'transparent' : rowIndex % 2 === 0 ? oddRowColor : evenRowColor;
              const rowData = Array.isArray(row) ? row : columns.map((column: any) => (row && row[column.id]) || '');
              return (
                <tr key={rowIndex} style={{ backgroundColor }}>
                  {columns.map((column: any, colIndex: number) => {
                    const cellValue = rowData[colIndex] || '';
                    const isStatusCol = column.type === 'status';
                    const statusColorMap: Record<string, string> = { 'vert': '#22C55E', 'green': '#22C55E', 'normal': '#22C55E', 'ok': '#22C55E', 'confirmé': '#22C55E', 'jaune': '#EAB308', 'yellow': '#EAB308', 'faible': '#EAB308', 'warning': '#EAB308', 'en cours': '#EAB308', 'rouge': '#EF4444', 'red': '#EF4444', 'bas': '#EF4444', 'error': '#EF4444', 'critique': '#EF4444', 'bleu': '#3B82F6', 'blue': '#3B82F6', 'info': '#3B82F6' };
                    const statusColor = isStatusCol ? (column.colorMap?.[cellValue] || statusColorMap[String(cellValue).toLowerCase()] || '#9CA3AF') : undefined;
                    return (
                      <td key={`${rowIndex}-${colIndex}`} style={{ padding: '0 12px', height: `${rowHeightValue}px`, lineHeight: `${rowHeightValue}px`, fontSize: '13px', color: textColor, borderBottom: `${borderWidthValue}px solid ${border}`, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textAlign: isStatusCol ? 'center' : undefined }} title={cellValue}>
                        {isStatusCol ? (<span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: statusColor, verticalAlign: 'middle' }} />) : cellValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ========== MenuItem ==========
export const MenuItemRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { widget, isDark, baseStyle, cornerRadius, isPreviewMode } = ctx;
  const properties = widget.properties || {};
  const [menuItemHover, setMenuItemHover] = useState(false);

  const hasCustomIcon = !!properties.customIconData;
  const iconKey = normalizeIconKey(properties.icon || 'layoutDashboard');
  const ItemIcon = ICON_LIBRARY[iconKey] || fallbackIcon;
  const isSelected = properties.selected !== false;
  const iconSize = toNumber(properties.iconSize, 20);
  const menuFontFamily = properties.fontFamily || 'Poppins';
  const menuFontSize = toNumber(properties.fontSize, 14);
  const selectedBg = properties.fg_color || (isDark ? '#0F3460' : '#0F3460');
  const baseBackground = properties.backgroundColor || 'transparent';
  const hoverBg = properties.hover_color || (isDark ? '#27272A' : '#E2E8F0');
  const selectedTextColor = properties.text_color || '#FFFFFF';
  const unselectedTextColor = properties.unselected_text_color || (isDark ? '#CBD5F5' : '#1E293B');
  const iconColor = properties.iconColor || (isSelected ? selectedTextColor : unselectedTextColor);
  const isHovering = menuItemHover && !isSelected;
  const backgroundColor = isSelected ? selectedBg : (isHovering ? hoverBg : baseBackground);
  const textColorMenu = isSelected ? selectedTextColor : unselectedTextColor;

  return (
    <div
      onMouseEnter={() => isPreviewMode && setMenuItemHover(true)}
      onMouseLeave={() => setMenuItemHover(false)}
      style={{ ...baseStyle, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', color: textColorMenu, backgroundColor, borderRadius: `${properties.cornerRadius !== undefined ? properties.cornerRadius : cornerRadius}px`, fontFamily: `${menuFontFamily}, sans-serif`, fontSize: `${menuFontSize}px`, fontWeight: isSelected ? 600 : 500, border: isSelected ? `1px solid ${selectedBg}` : '1px solid transparent', transition: 'all 0.2s ease', cursor: isPreviewMode ? 'pointer' : 'default', pointerEvents: isPreviewMode ? 'auto' : 'none' }}
    >
      {hasCustomIcon ? (
        <img src={properties.customIconData} alt="icon" style={{ width: iconSize, height: iconSize, objectFit: 'contain', flexShrink: 0 }} />
      ) : (
        ItemIcon && <ItemIcon size={iconSize} color={iconColor} strokeWidth={2.2} />
      )}
      <span style={{ flex: 1 }}>{properties.text || 'Menu Item'}</span>
    </div>
  );
});

// ========== Chart ==========
export const ChartRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { widget, isDark, baseStyle, borderColor } = ctx;
  const properties = widget.properties || {};
  const style = widget.style || {};

  const chartType = properties.chartType || 'line';
  const chartTitle = properties.title || 'Graphique';
  const chartData = Array.isArray(properties.data) ? properties.data : [{ label: 'A', value: 10 }, { label: 'B', value: 40 }, { label: 'C', value: 25 }, { label: 'D', value: 60 }, { label: 'E', value: 35 }];
  const lineColor = properties.lineColor || '#22C55E';
  const fillColor = properties.fillColor || '#22C55E20';
  const showFill = properties.showFill !== false;
  const showGrid = properties.showGrid !== false;
  const showMarkers = properties.showMarkers !== false;
  const markerSize = properties.markerSize || 8;
  const lineWidth = properties.lineWidth || 2;
  const chartBgColor = properties.backgroundColor || (isDark ? '#1E1E24' : '#FFFFFF');
  const chartTextColor = properties.textColor || (isDark ? '#9CA3AF' : '#64748B');
  const chartTitleColor = properties.titleColor || (isDark ? '#F3F4F6' : '#0F172A');
  const chartGridColor = properties.gridColor || (isDark ? '#374151' : '#E2E8F0');
  const chartFontFamily = properties.fontFamily || 'Poppins';
  const chartTitleSize = properties.titleFontSize || 16;
  const chartLabelSize = properties.labelFontSize || 12;
  const chartRadius = properties.cornerRadius || 16;
  const borderWidth = style.borderWidth !== undefined ? style.borderWidth : (properties.border_width !== undefined ? properties.border_width : 0);

  const padding = { top: 50, right: 30, bottom: 40, left: 50 };
  const chartWidth = widget.size.width - padding.left - padding.right;
  const chartHeight = widget.size.height - padding.top - padding.bottom;
  const values = chartData.map((d: any) => d.value || 0);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  const points = chartData.map((d: any, i: number) => {
    const x = padding.left + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({ y: padding.top + chartHeight * (1 - ratio), value: Math.round(minValue + range * ratio) }));
  const isTransparent = properties.transparentBackground === true;

  const pieColors = [properties.pieColor1 || '#4CAF50', properties.pieColor2 || '#FFC107', properties.pieColor3 || '#E53935'];

  return (
    <div style={{ ...baseStyle, backgroundColor: isTransparent ? 'transparent' : chartBgColor, borderRadius: `${chartRadius}px`, boxShadow: isTransparent ? 'none' : '0 4px 20px rgba(0,0,0,0.08)', border: isTransparent ? 'none' : `${borderWidth}px solid ${borderColor}`, overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${widget.size.width} ${widget.size.height}`}>
        <text x={padding.left} y={28} fill={chartTitleColor} fontSize={chartTitleSize} fontFamily={chartFontFamily} fontWeight="600">{chartTitle}</text>
        {showGrid && chartType !== 'pie' && gridLines.map((line, i) => (
          <g key={i}>
            <line x1={padding.left} y1={line.y} x2={widget.size.width - padding.right} y2={line.y} stroke={chartGridColor} strokeWidth="1" strokeDasharray="4,4" />
            <text x={padding.left - 8} y={line.y + 4} fill={chartTextColor} fontSize={chartLabelSize - 2} fontFamily={chartFontFamily} textAnchor="end">{line.value}$</text>
          </g>
        ))}
        {(showFill && chartType === 'line') || chartType === 'area' ? (<path d={fillPath} fill={chartType === 'area' ? lineColor + '40' : fillColor} />) : null}
        {(chartType === 'line' || chartType === 'area') && (<path d={linePath} fill="none" stroke={lineColor} strokeWidth={lineWidth} strokeLinecap="round" strokeLinejoin="round" />)}
        {chartType === 'bar' && points.map((_p, i) => {
          const barWidth = Math.max(chartWidth / chartData.length - 10, 20);
          const barHeight = (chartData[i].value / maxValue) * chartHeight;
          return (<rect key={i} x={padding.left + (i / chartData.length) * chartWidth + 5} y={padding.top + chartHeight - barHeight} width={barWidth} height={barHeight} fill={lineColor} rx="4" />);
        })}
        {chartType === 'pie' && (() => {
          const total = Math.max(values.reduce((a, b) => a + b, 0), 1);
          let cumulativeAngle = 0;
          const showLegend = properties.showLegend !== false;
          const legendWidth = showLegend ? chartWidth * 0.32 : 0;
          const pieAreaWidth = chartWidth - legendWidth;
          const outerRadius = Math.min(pieAreaWidth, chartHeight) / 2 - 16;
          const innerRadius = outerRadius * 0.62;
          const cx = padding.left + legendWidth + pieAreaWidth / 2;
          const cy = padding.top + chartHeight / 2;
          const gapAngle = 0.03;

          const legendItems = showLegend ? chartData.map((d: any, i: number) => {
            const pct = Math.round((d.value / total) * 100);
            const legendY = padding.top + 16 + i * 32;
            return (
              <g key={`legend-${i}`}>
                <rect x={padding.left + 4} y={legendY} width="10" height="10" rx="5" fill={pieColors[i % pieColors.length]} />
                <text x={padding.left + 20} y={legendY + 9} fill={chartTextColor} fontSize={chartLabelSize} fontFamily={chartFontFamily} fontWeight="500">{d.label}</text>
                <text x={padding.left + 20} y={legendY + 24} fill={chartTextColor} fontSize={chartLabelSize - 2} fontFamily={chartFontFamily} opacity="0.6">{pct}% · {d.value}</text>
              </g>
            );
          }) : null;

          const donutDefs = (
            <defs key="donut-defs">
              <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.10)" /></filter>
              <filter id="donut-inner-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" /><feFlood floodColor="rgba(0,0,0,0.06)" /><feComposite in2="blur" operator="in" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              {pieColors.map((color, ci) => (<linearGradient key={`pie-grad-${ci}`} id={`pie-grad-${ci}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={color} stopOpacity="1" /><stop offset="100%" stopColor={color} stopOpacity="0.78" /></linearGradient>))}
            </defs>
          );

          const slices = chartData.map((d: any, i: number) => {
            const percent = d.value / total;
            const sliceGap = chartData.length > 1 ? gapAngle : 0;
            const startAngle = cumulativeAngle + sliceGap / 2;
            const endAngle = cumulativeAngle + percent * 2 * Math.PI - sliceGap / 2;
            cumulativeAngle += percent * 2 * Math.PI;
            if (percent >= 0.999) return (<g key={`slice-${i}`} filter="url(#donut-shadow)"><circle cx={cx} cy={cy} r={outerRadius} fill={`url(#pie-grad-${i % pieColors.length})`} /><circle cx={cx} cy={cy} r={innerRadius} fill={chartBgColor} /></g>);
            if (percent < 0.005) return null;
            const x1_out = cx + outerRadius * Math.cos(startAngle - Math.PI / 2);
            const y1_out = cy + outerRadius * Math.sin(startAngle - Math.PI / 2);
            const x2_out = cx + outerRadius * Math.cos(endAngle - Math.PI / 2);
            const y2_out = cy + outerRadius * Math.sin(endAngle - Math.PI / 2);
            const x1_in = cx + innerRadius * Math.cos(startAngle - Math.PI / 2);
            const y1_in = cy + innerRadius * Math.sin(startAngle - Math.PI / 2);
            const x2_in = cx + innerRadius * Math.cos(endAngle - Math.PI / 2);
            const y2_in = cy + innerRadius * Math.sin(endAngle - Math.PI / 2);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = [`M ${x1_out} ${y1_out}`, `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out}`, `L ${x2_in} ${y2_in}`, `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1_in} ${y1_in}`, `Z`].join(' ');
            const midAngle = startAngle + (endAngle - startAngle) / 2 - Math.PI / 2;
            const labelR = (outerRadius + innerRadius) / 2;
            const lx = cx + labelR * Math.cos(midAngle);
            const ly = cy + labelR * Math.sin(midAngle);
            return (
              <g key={`slice-${i}`}>
                <path d={pathData} fill={`url(#pie-grad-${i % pieColors.length})`} strokeLinecap="round" strokeLinejoin="round" filter="url(#donut-shadow)" />
                {percent > 0.08 && (<text x={lx} y={ly} fill="#FFFFFF" textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(10, Math.min(14, outerRadius * 0.16))} fontWeight="700" fontFamily={chartFontFamily} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>{Math.round(percent * 100)}%</text>)}
              </g>
            );
          });

          const centerLabel = (
            <g key="center-label">
              <text x={cx} y={cy - 6} fill={chartTitleColor} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(14, Math.min(22, outerRadius * 0.22))} fontWeight="700" fontFamily={chartFontFamily}>{total}</text>
              <text x={cx} y={cy + 12} fill={chartTextColor} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(9, Math.min(11, outerRadius * 0.1))} fontWeight="500" fontFamily={chartFontFamily} opacity="0.6">Total</text>
            </g>
          );

          return [donutDefs, ...(legendItems || []), ...slices, centerLabel];
        })()}
        {showMarkers && chartType === 'line' && points.map((p, i) => (<g key={i}><circle cx={p.x} cy={p.y} r={markerSize / 2 + 2} fill={chartBgColor} /><circle cx={p.x} cy={p.y} r={markerSize / 2} fill={lineColor} /></g>))}
        {chartType !== 'pie' && points.map((p, i) => (<text key={i} x={p.x} y={widget.size.height - 12} fill={chartTextColor} fontSize={chartLabelSize} fontFamily={chartFontFamily} textAnchor="middle">{p.label}</text>))}
      </svg>
    </div>
  );
});

// ========== DatePicker ==========
export const DatePickerRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { widget, isDark, colors, baseStyle, cornerRadius, fontFamily, fontSize } = ctx;
  const properties = widget.properties || {};
  const style = widget.style || {};

  const [datepickerOpen, setDatepickerOpen] = useState(false);
  const [datepickerSelected, setDatepickerSelected] = useState<Date>(new Date());
  const [datepickerViewYear, setDatepickerViewYear] = useState(new Date().getFullYear());
  const [datepickerViewMonth, setDatepickerViewMonth] = useState(new Date().getMonth());

  const datePattern = properties.date_pattern || 'dd/mm/yyyy';
  const headersBg = properties.headersbackground || (isDark ? '#0F3460' : '#0F3460');
  const headersFg = properties.headersforeground || '#FFFFFF';
  const selectBg = properties.selectbackground || (isDark ? '#0F3460' : '#0F3460');
  const datepickerBg = style.backgroundColor || properties.background || colors.input;
  const datepickerFg = style.textColor || properties.foreground || colors.text;
  const datepickerBorder = style.borderColor || properties.bordercolor || colors.border;

  const formatDate = (date: Date, pattern: string) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return pattern.replace('dd', day).replace('mm', month).replace('yyyy', String(year));
  };

  const MONTH_NAMES_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const today = new Date();
  const firstDayOfMonth = new Date(datepickerViewYear, datepickerViewMonth, 1);
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(datepickerViewYear, datepickerViewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (datepickerViewMonth === 0) { setDatepickerViewMonth(11); setDatepickerViewYear(y => y - 1); }
    else setDatepickerViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (datepickerViewMonth === 11) { setDatepickerViewMonth(0); setDatepickerViewYear(y => y + 1); }
    else setDatepickerViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ ...baseStyle, position: 'relative', userSelect: 'none' }}>
      <div style={{ width: '100%', height: '100%', backgroundColor: datepickerBg, color: datepickerFg, border: `2px solid ${datepickerOpen ? selectBg : datepickerBorder}`, borderRadius: `${cornerRadius}px`, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxSizing: 'border-box', fontFamily: `${fontFamily}, sans-serif`, fontSize: `${fontSize}px`, transition: 'border-color 0.15s' }} onClick={(e) => { e.stopPropagation(); setDatepickerOpen(o => !o); }}>
        <span>{formatDate(datepickerSelected, datePattern)}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={datepickerFg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
      </div>
      {datepickerOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: '240px', backgroundColor: colors.fg, border: `1px solid ${datepickerBorder}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 200, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ backgroundColor: headersBg, color: headersFg, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 'bold' }}>
            <span style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }} onClick={prevMonth}>◀</span>
            <span>{MONTH_NAMES_FR[datepickerViewMonth]} {datepickerViewYear}</span>
            <span style={{ cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }} onClick={nextMonth}>▶</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: '600', padding: '6px 6px 2px', color: colors.textDisabled }}>
            {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '12px', padding: '2px 6px 8px', gap: '2px' }}>
            {cells.map((day, idx) => {
              if (!day) return <span key={`e-${idx}`} />;
              const isToday = day === today.getDate() && datepickerViewMonth === today.getMonth() && datepickerViewYear === today.getFullYear();
              const isSelected = day === datepickerSelected.getDate() && datepickerViewMonth === datepickerSelected.getMonth() && datepickerViewYear === datepickerSelected.getFullYear();
              return (
                <span key={`d-${day}`} style={{ padding: '5px 2px', borderRadius: '50%', cursor: 'pointer', backgroundColor: isSelected ? selectBg : isToday ? `${selectBg}40` : 'transparent', color: isSelected ? '#FFFFFF' : isToday ? selectBg : colors.text, fontWeight: isSelected || isToday ? 'bold' : 'normal', transition: 'background-color 0.1s' }} onClick={() => { setDatepickerSelected(new Date(datepickerViewYear, datepickerViewMonth, day)); setDatepickerOpen(false); }}>{day}</span>
              );
            })}
          </div>
          <div style={{ borderTop: `1px solid ${datepickerBorder}`, padding: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', cursor: 'pointer', color: selectBg, fontWeight: '600', padding: '3px 10px', borderRadius: '4px', display: 'inline-block' }} onClick={() => { const t = new Date(); setDatepickerSelected(t); setDatepickerViewMonth(t.getMonth()); setDatepickerViewYear(t.getFullYear()); setDatepickerOpen(false); }}>Aujourd'hui</span>
          </div>
        </div>
      )}
    </div>
  );
});

// ========== StatCardWithProgress ==========
export const StatCardWithProgressRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { isDark, baseStyle } = ctx;
  const properties = ctx.widget.properties || {};

  const spCardBg = properties.backgroundColor || (isDark ? '#1C1C1E' : '#FFFFFF');
  const spTitleColor = properties.titleColor || (isDark ? '#9CA3AF' : '#64748B');
  const spValueColor = properties.valueColor || (isDark ? '#F8FAFC' : '#0F172A');
  const spCaptionColor = properties.captionColor || (isDark ? '#6B7280' : '#94A3B8');
  const spProgressColor = properties.progressColor || (isDark ? '#0F3460' : '#166534');
  const spProgressValue = Math.max(0, Math.min(1, Number(properties.progressValue) || 0.65));
  const spCornerRadius = properties.cornerRadius || 16;
  const spTitleFont = properties.titleFont || 'Poppins';
  const spValueFont = properties.valueFont || 'Poppins';
  const spCaptionFont = properties.captionFont || spTitleFont;
  const spTitleFontSize = toNumber(properties.titleFontSize, 12);
  const spValueFontSize = toNumber(properties.valueFontSize, 28);
  const spCaptionFontSize = toNumber(properties.captionFontSize, 11);

  return (
    <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: spCardBg, borderRadius: `${spCornerRadius}px`, padding: '18px 20px', boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.06)', border: `1px solid ${isDark ? '#2F3344' : '#E2E8F0'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: `${spTitleFontSize}px`, fontWeight: 600, color: spTitleColor, fontFamily: `${spTitleFont}, sans-serif`, letterSpacing: '0.01em' }}>{properties.title || 'Statistique'}</span>
        <div style={{ width: '60px', height: '8px', backgroundColor: isDark ? '#374151' : '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${spProgressValue * 100}%`, height: '100%', backgroundColor: spProgressColor, borderRadius: '4px', transition: 'width 0.3s ease' }} />
        </div>
      </div>
      <span style={{ fontSize: `${spValueFontSize}px`, fontWeight: 700, color: spValueColor, fontFamily: `${spValueFont}, sans-serif`, lineHeight: 1.2, marginTop: '8px' }}>{properties.value || '0'}</span>
      {properties.caption && (<span style={{ fontSize: `${spCaptionFontSize}px`, color: spCaptionColor, fontFamily: `${spCaptionFont}, sans-serif`, marginTop: '4px' }}>{properties.caption}</span>)}
    </div>
  );
});

// ========== ProductCard ==========
export const ProductCardRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { isDark, baseStyle } = ctx;
  const properties = ctx.widget.properties || {};

  const pcBg = properties.backgroundColor || (isDark ? '#1C1C1E' : '#FFFFFF');
  const pcTextColor = properties.textColor || (isDark ? '#F3F4F6' : '#1E293B');
  const pcPriceColor = properties.priceColor || (isDark ? '#F3F4F6' : '#0F172A');
  const pcBorderColor = properties.borderColor || (isDark ? '#2F3344' : '#E2E8F0');
  const pcFontFamily = properties.fontFamily || 'Poppins';
  const pcFontSize = toNumber(properties.fontSize, 13);
  const pcPriceFontSize = toNumber(properties.priceFontSize, 15);
  const pcCornerRadius = properties.cornerRadius || 12;
  const hasImage = properties.imageData || properties.imageUrl;

  return (
    <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column', backgroundColor: pcBg, borderRadius: `${pcCornerRadius}px`, border: `1px solid ${pcBorderColor}`, overflow: 'hidden', boxShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.06)' }}>
      <div style={{ width: '100%', height: '55%', backgroundColor: properties.imageBgColor === 'transparent' ? 'transparent' : properties.imageBgColor ? properties.imageBgColor : (isDark ? '#27272A' : '#F1F5F9'), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {hasImage ? (
          <img src={properties.imageData || properties.imageUrl} alt={properties.productName || 'Produit'} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#4B5563' : '#94A3B8'} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
        )}
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        <span style={{ fontSize: `${pcFontSize}px`, fontWeight: 600, color: pcTextColor, fontFamily: `${pcFontFamily}, sans-serif`, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{properties.productName || 'Produit'}</span>
        {properties.productDetail && (<span style={{ fontSize: `${pcFontSize - 2}px`, color: isDark ? '#9CA3AF' : '#64748B', fontFamily: `${pcFontFamily}, sans-serif` }}>{properties.productDetail}</span>)}
        <span style={{ fontSize: `${pcPriceFontSize}px`, fontWeight: 700, color: pcPriceColor, fontFamily: `${pcFontFamily}, sans-serif`, marginTop: '4px' }}>{properties.price || '0'}</span>
      </div>
    </div>
  );
});

// ========== UserProfile ==========
export const UserProfileRenderer: React.FC<{ ctx: WidgetRenderContext }> = React.memo(({ ctx }) => {
  const { isDark, baseStyle } = ctx;
  const properties = ctx.widget.properties || {};

  const upNameColor = properties.nameColor || (isDark ? '#F3F4F6' : '#0F172A');
  const upInfoColor = properties.infoColor || (isDark ? '#9CA3AF' : '#64748B');
  const upDateColor = properties.dateColor || (isDark ? '#6B7280' : '#94A3B8');
  const upNameFont = properties.nameFont || 'Poppins';
  const upNameFontSize = toNumber(properties.nameFontSize, 15);
  const upInfoFontSize = toNumber(properties.infoFontSize, 12);
  const upDateFontSize = toNumber(properties.dateFontSize, 12);
  const upAvatarSize = toNumber(properties.avatarSize, 40);
  const hasAvatar = properties.avatarData || properties.avatarUrl;
  const upBg = properties.backgroundColor || 'transparent';

  const now = new Date();
  const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dateStr = properties.dateText || `${joursSemaine[now.getDay()]} ${String(now.getDate()).padStart(2, '0')} ${mois[now.getMonth()]} ${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: upBg, padding: '4px 8px' }}>
      {properties.showDate !== false && (<span style={{ fontSize: `${upDateFontSize}px`, color: upDateColor, fontFamily: `${upNameFont}, sans-serif`, whiteSpace: 'nowrap', marginRight: 'auto' }}>{dateStr}</span>)}
      <div style={{ width: `${upAvatarSize}px`, height: `${upAvatarSize}px`, borderRadius: '50%', overflow: 'hidden', backgroundColor: isDark ? '#374151' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {hasAvatar ? (
          <img src={properties.avatarData || properties.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width={upAvatarSize * 0.5} height={upAvatarSize * 0.5} viewBox="0 0 24 24" fill="none" stroke={isDark ? '#9CA3AF' : '#64748B'} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontSize: `${upNameFontSize}px`, fontWeight: 600, color: upNameColor, fontFamily: `${upNameFont}, sans-serif`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{properties.userName || 'Utilisateur'}</span>
        {properties.userInfo && (<span style={{ fontSize: `${upInfoFontSize}px`, color: upInfoColor, fontFamily: `${upNameFont}, sans-serif`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{properties.userInfo}</span>)}
      </div>
    </div>
  );
});
