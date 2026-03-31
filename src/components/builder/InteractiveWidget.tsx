/* eslint-disable no-case-declarations */
import React, { useState, useEffect } from 'react';
import { WidgetData } from '@/types/widget';
import { useTheme } from 'next-themes';
import { ContainerMetrics } from '@/lib/widgetLayout';
import { getCtkBorderForCanvas } from '@/constants/customtkinter-validation';
import { CTK_COLORS, getColor, WidgetRenderContext } from './widgets/widget-shared';
import { FrameRenderer, ScrollableFrameRenderer, TabviewRenderer } from './widgets/ContainerRenderers';
import { StatCardRenderer, TableRenderer, MenuItemRenderer, ChartRenderer, DatePickerRenderer, StatCardWithProgressRenderer, ProductCardRenderer, UserProfileRenderer } from './widgets/CompositeRenderers';
// Eye/EyeOff remplacés par les symboles ○/● dans le passwordentry

interface InteractiveWidgetProps {
  widget: WidgetData;
  isSelected?: boolean;
  isPreviewMode?: boolean;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  childElements?: React.ReactNode;
  hasChildren?: boolean;
  containerMetrics?: ContainerMetrics;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  updateWidget?: (widgetId: string, updates: Partial<WidgetData>, addToHistory?: boolean) => void;
  isDraggingChild?: boolean;
  isInAutoLayout?: boolean;
}

export const InteractiveWidget: React.FC<InteractiveWidgetProps> = React.memo(({
  widget,
  isSelected: _isSelected = false,
  isPreviewMode = false,
  contentRef,
  childElements = null,
  hasChildren: _hasChildren = false,
  containerMetrics,
  activeTab,
  onTabChange,
  updateWidget,
  isDraggingChild = false,
  isInAutoLayout: _isInAutoLayout = false,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [checkboxState, setCheckboxState] = useState(false);
  const [radioState, setRadioState] = useState(false);
  const [switchState, setSwitchState] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [sliderDragging, setSliderDragging] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(false);
  const [clickedButton, setClickedButton] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxSelected, setComboboxSelected] = useState(0);
  const [optionMenuOpen, setOptionMenuOpen] = useState(false);
  const [optionMenuSelected, setOptionMenuSelected] = useState(0);
  const [segmentedSelected, setSegmentedSelected] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [sbHovered, setSbHovered] = useState(false);

  // Fermer les dropdowns (ComboBox/OptionMenu) au clic extérieur
  useEffect(() => {
    if (!comboboxOpen && !optionMenuOpen) return;
    const handleClickOutside = () => {
      if (comboboxOpen) setComboboxOpen(false);
      if (optionMenuOpen) setOptionMenuOpen(false);
    };
    // Délai pour ne pas fermer immédiatement au même clic qui ouvre
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [comboboxOpen, optionMenuOpen]);

  useEffect(() => {
    if (widget.type !== 'radiobutton') return;
    const radioGroupId = widget.parentId || 'root';

    const handler = (e: Event) => {
      const { groupId, selectedWidgetId: selId } = (e as CustomEvent).detail;
      if (groupId === radioGroupId && selId !== widget.id) {
        setRadioState(false);
      }
    };

    window.addEventListener('radio-group-select', handler);
    return () => window.removeEventListener('radio-group-select', handler);
  }, [widget.type, widget.parentId, widget.id]);

  const properties = widget.properties || {};
  const style = widget.style || {};

  const colors = isDark ? CTK_COLORS.dark : CTK_COLORS.light;

  const textColor = getColor(style.textColor || properties.text_color, colors.text);
  const fgColor = getColor(style.backgroundColor || properties.fg_color, colors.button);
  const borderColor = getColor(style.borderColor || properties.border_color, colors.border);
  const cornerRadius = style.borderRadius !== undefined ? style.borderRadius : (properties.corner_radius !== undefined ? properties.corner_radius : 0);
  const borderWidth = style.borderWidth !== undefined ? style.borderWidth : (properties.border_width !== undefined ? properties.border_width : 0);

  // Appliquer la validation CTk : ne pas afficher de bordure si le widget ne la supporte pas
  const ctkBorder = getCtkBorderForCanvas(widget.type, borderWidth, borderColor);
  const effectiveBorderWidth = ctkBorder.width;
  const effectiveBorderColor = ctkBorder.color;

  // Fusionner les propriétés de police : style personnalisé > properties.font > défaut
  const fontFamily = style.fontFamily || properties.font?.[0] || 'Roboto';
  const fontSize = style.fontSize !== undefined ? style.fontSize : (properties.font?.[1] || 13);
  const fontWeight = style.fontWeight || properties.font?.[2] || 'normal';
  const fontStyle = style.fontStyle || 'normal';
  const textDecoration = style.textDecoration || 'none';

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: `${cornerRadius}px`,
    fontFamily: `${fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`,
    fontSize: `${fontSize}px`,
    fontWeight: fontWeight,
    fontStyle: fontStyle,
    textDecoration: textDecoration,
    pointerEvents: isPreviewMode ? 'auto' : 'none',
    userSelect: isPreviewMode ? 'auto' : 'none',
    boxSizing: 'border-box',
  };

  const renderCtx: WidgetRenderContext = {
    widget, isPreviewMode, isDark, colors, baseStyle, textColor, fgColor, borderColor,
    effectiveBorderWidth, effectiveBorderColor, cornerRadius, properties, style, fontSize, fontFamily, fontWeight,
    contentRef, childElements, containerMetrics, activeTab, onTabChange, updateWidget, isDraggingChild,
  };

  switch (widget.type) {
    // ========== CTkLabel ==========
    case 'label':
      const labelBgColor = style.backgroundColor || properties.fg_color || 'transparent';
      const labelTextColor = style.textColor || properties.text_color || colors.text;

      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: properties.anchor === 'center' ? 'center' : properties.anchor === 'e' ? 'flex-end' : 'flex-start',
            padding: '4px 8px',
            color: labelTextColor,
            backgroundColor: labelBgColor,
            border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
          }}
        >
          {properties.text || 'Label'}
        </div>
      );

    // ========== CTkImage (Label avec image) ==========
    // ========== CTkLabel avec CTkImage ==========
    case 'image_label':
      const imageLabelPath = properties.image_path || '';
      const imageLabelData = properties.image_data || '';
      const imageLabelSource = imageLabelData || imageLabelPath;
      const imageLabelText = properties.text || '';
      const imageLabelCompound = properties.compound || 'center';
      const imageLabelSize = properties.image_size || [200, 200];
      const imageLabelObjectFit = style.objectFit || 'contain';

      const getFlexDirection = () => {
        switch (imageLabelCompound) {
          case 'top': return 'column';
          case 'bottom': return 'column-reverse';
          case 'left': return 'row';
          case 'right': return 'row-reverse';
          case 'center': return 'column';
          default: return 'column';
        }
      };

      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            flexDirection: getFlexDirection(),
            alignItems: 'center',
            justifyContent: 'center',
            gap: imageLabelText && imageLabelSource ? '8px' : '0px',
            backgroundColor: getColor(properties.fg_color, 'transparent'),
            border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
            borderRadius: `${properties.corner_radius || 0}px`,
            padding: '8px',
            boxSizing: 'border-box',
          }}
        >
          {imageLabelSource ? (
            <img
              src={imageLabelSource}
              alt={imageLabelText || "Image"}
              style={{
                width: imageLabelCompound === 'center' && !imageLabelText ? '100%' : `${Math.min(imageLabelSize[0], Math.max(0, widget.size.width - 16))}px`,
                height: imageLabelCompound === 'center' && !imageLabelText ? '100%' : `${Math.min(imageLabelSize[1], Math.max(0, widget.size.height - 16))}px`,
                objectFit: imageLabelObjectFit,
                borderRadius: `${Math.max(0, (properties.corner_radius || 0) - 4)}px`,
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: colors.textDisabled,
              fontSize: '13px',
              padding: '16px',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Image</span>
            </div>
          )}
          {imageLabelText && (
            <span style={{
              color: style.textColor || getColor(properties.text_color, colors.text),
              fontSize: `${(properties.font?.[1] || 13)}px`,
              fontFamily: properties.font?.[0] || 'Roboto',
              fontWeight: properties.font?.[2] === 'bold' ? 'bold' : 'normal',
              textAlign: 'center',
            }}>
              {imageLabelText}
            </span>
          )}
        </div>
      );

    // ========== CTkButton ==========
    case 'button':
      // Couleur de texte spécifique pour bouton: blanc par défaut sauf si personnalisée
      const buttonTextColor = style.textColor || properties.text_color || '#FFFFFF';
      const buttonHoverColor = style.hoverColor || properties.hover_color || colors.buttonHover;

      const handleButtonClick = () => {
        if (isPreviewMode && properties.state !== 'disabled') {
          setClickedButton(true);
          setTimeout(() => setClickedButton(false), 200);
        }
      };

      return (
        <button
          onClick={handleButtonClick}
          onMouseEnter={() => isPreviewMode && setHoveredButton(true)}
          onMouseLeave={() => isPreviewMode && setHoveredButton(false)}
          style={{
            ...baseStyle,
            backgroundColor: properties.state === 'disabled'
              ? colors.textDisabled
              : (hoveredButton && isPreviewMode ? buttonHoverColor : fgColor),
            color: buttonTextColor,
            border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
            cursor: properties.state === 'disabled' ? 'not-allowed' : 'pointer',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: 1,
            transform: clickedButton ? 'scale(0.98)' : 'scale(1)',
          }}
        >
          {properties.text || 'Bouton'}
        </button>
      );

    // ========== CTkEntry ==========
    case 'entry':
      const entryBgColor = style.backgroundColor || properties.fg_color || colors.input;
      const entryTextColor = style.textColor || properties.text_color || colors.text;
      const entryBorderDefault = effectiveBorderWidth > 0 ? effectiveBorderColor : 'transparent';
      const entryBorderFocus = getColor(properties.border_color, colors.checkmark);

      return (
        <input
          type={properties.show ? 'password' : 'text'}
          placeholder={properties.placeholder_text || 'Entrée'}
          style={{
            ...baseStyle,
            backgroundColor: entryBgColor,
            color: entryTextColor,
            border: `${Math.max(effectiveBorderWidth, 1)}px solid ${entryBorderDefault}`,
            padding: '8px 12px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = entryBorderFocus; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = entryBorderDefault; }}
          disabled={properties.state === 'disabled'}
        />
      );

    // ========== PasswordEntry (CTkFrame + CTkEntry + bouton œil intégré) ==========
    case 'passwordentry': {
      // Outer container = CTkFrame (uses fg widget color, not input color)
      const pwFrameBg = style.backgroundColor || properties.fg_color || colors.fg;
      const pwTextColor = style.textColor || properties.text_color || colors.text;
      const pwCornerRadius = style.borderRadius ?? properties.corner_radius ?? 6;
      const pwBtnSize = Math.max(28, Math.round((widget.size?.height || 40) * 0.6));
      const pwEntryH = Math.max(30, (widget.size?.height || 40) - 10);

      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: pwFrameBg,
            border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
            borderRadius: `${pwCornerRadius}px`,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            overflow: 'hidden',
            padding: 0,
            minWidth: 0,
          }}
        >
          {/* Inner entry — transparent bg, no border (like export) */}
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={properties.placeholder_text || 'Mot de passe'}
            style={{
              height: `${pwEntryH}px`,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0 8px 0 10px',
              color: pwTextColor,
              fontSize: style.fontSize || 13,
              fontFamily: style.fontFamily || 'inherit',
              minWidth: 0,
            }}
            disabled={properties.state === 'disabled'}
          />
          {/* Eye toggle button — like export CTkButton */}
          <button
            onClick={() => isPreviewMode && setShowPassword(prev => !prev)}
            style={{
              flexShrink: 0,
              width: pwBtnSize,
              height: pwBtnSize,
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: isPreviewMode ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666666',
              marginRight: 8,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#3A3A3A' : '#E8E8E8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{showPassword ? '●' : '○'}</span>
          </button>
        </div>
      );
    }

    // ========== CTkTextbox ==========
    case 'textbox':
      const textboxBgColor = style.backgroundColor || properties.fg_color || colors.input;
      const textboxTextColor = style.textColor || properties.text_color || colors.text;
      const textboxBorderDefault = effectiveBorderWidth > 0 ? effectiveBorderColor : 'transparent';
      const textboxBorderFocus = getColor(properties.border_color, colors.checkmark);

      return (
        <textarea
          placeholder={properties.placeholder_text || ''}
          style={{
            ...baseStyle,
            backgroundColor: textboxBgColor,
            color: textboxTextColor,
            border: `${Math.max(effectiveBorderWidth, 1)}px solid ${textboxBorderDefault}`,
            padding: '8px 12px',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = textboxBorderFocus; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = textboxBorderDefault; }}
          disabled={properties.state === 'disabled'}
        />
      );

    // ========== CTkCheckBox ==========
    case 'checkbox':
      const handleCheckboxClick = () => {
        if (isPreviewMode && properties.state !== 'disabled') {
          setCheckboxState(!checkboxState);
        }
      };

      const checkboxWidth = properties.checkbox_width || 24;
      const checkboxHeight = properties.checkbox_height || 24;
      const checkboxBorderWidth = properties.border_width !== undefined ? properties.border_width : 0;
      const checkboxCornerRadius = properties.corner_radius !== undefined ? properties.corner_radius : 0;

      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '2px',
          }}
        >
          <div
            onClick={handleCheckboxClick}
            style={{
              width: `${checkboxWidth}px`,
              height: `${checkboxHeight}px`,
              minWidth: `${checkboxWidth}px`,
              minHeight: `${checkboxHeight}px`,
              backgroundColor: checkboxState ? getColor(properties.fg_color, colors.checkmark) : colors.input,
              border: `${checkboxBorderWidth}px solid ${getColor(properties.border_color, colors.border)}`,
              borderRadius: `${checkboxCornerRadius}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isPreviewMode ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            {checkboxState && (
              <svg width={checkboxWidth * 0.6} height={checkboxHeight * 0.6} viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke={getColor(properties.checkmark_color, '#FFFFFF')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{
            color: textColor,
            fontSize: `${fontSize}px`,
            fontFamily: `${fontFamily}, sans-serif`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {properties.text || 'Case à cocher'}
          </span>
        </div>
      );

    // ========== CTkRadioButton ==========
    case 'radiobutton':
      const radioGroupId = widget.parentId || 'root';

      const handleRadioClick = () => {
        if (isPreviewMode && properties.state !== 'disabled') {
          if (!radioState) {
            setRadioState(true);
            window.dispatchEvent(new CustomEvent('radio-group-select', {
              detail: { groupId: radioGroupId, selectedWidgetId: widget.id },
            }));
          }
        }
      };

      const radioWidth = properties.radiobutton_width || 24;
      const radioHeight = properties.radiobutton_height || 24;
      const radioBorderWidthUnchecked = properties.border_width_unchecked !== undefined ? properties.border_width_unchecked : 0;
      const radioBorderWidthChecked = properties.border_width_checked !== undefined ? properties.border_width_checked : 0;

      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '2px',
          }}
        >
          <div
            onClick={handleRadioClick}
            style={{
              width: `${radioWidth}px`,
              height: `${radioHeight}px`,
              minWidth: `${radioWidth}px`,
              minHeight: `${radioHeight}px`,
              backgroundColor: colors.input,
              border: `${radioState ? radioBorderWidthChecked : radioBorderWidthUnchecked}px solid ${getColor(properties.border_color, colors.border)}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isPreviewMode ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            {radioState && (
              <div
                style={{
                  width: `${radioWidth * 0.4}px`,
                  height: `${radioHeight * 0.4}px`,
                  backgroundColor: getColor(properties.fg_color, colors.checkmark),
                  borderRadius: '50%',
                }}
              />
            )}
          </div>
          <span style={{
            color: textColor,
            fontSize: `${fontSize}px`,
            fontFamily: `${fontFamily}, sans-serif`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {properties.text || 'Bouton Radio'}
          </span>
        </div>
      );

    // ========== CTkSwitch ==========
    case 'switch':
      const handleSwitchClick = () => {
        if (isPreviewMode && properties.state !== 'disabled') {
          setSwitchState(!switchState);
        }
      };

      const switchWidth = properties.switch_width || 36;
      const switchHeight = properties.switch_height || 20;
      const switchCornerRadius = properties.corner_radius !== undefined ? properties.corner_radius : 1000;
      const buttonSize = switchHeight - 4; // Taille du bouton avec 2px de marge de chaque côté
      const buttonLength = properties.button_length || 0; // 0 = auto (cercle)
      const actualButtonSize = buttonLength > 0 ? buttonLength : buttonSize;

      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '2px',
          }}
        >
          <div
            onClick={handleSwitchClick}
            style={{
              width: `${switchWidth}px`,
              height: `${switchHeight}px`,
              minWidth: `${switchWidth}px`,
              minHeight: `${switchHeight}px`,
              backgroundColor: switchState ? getColor(properties.progress_color, colors.checkmark) : getColor(properties.fg_color, colors.scrollbar),
              borderRadius: `${switchCornerRadius}px`,
              position: 'relative',
              cursor: isPreviewMode ? 'pointer' : 'default',
              transition: 'background-color 0.2s ease',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: `${actualButtonSize}px`,
                height: `${actualButtonSize}px`,
                backgroundColor: getColor(properties.button_color, '#FFFFFF'),
                borderRadius: '50%',
                position: 'absolute',
                top: '50%',
                left: switchState ? `${switchWidth - actualButtonSize - 2}px` : '2px',
                transform: 'translateY(-50%)',
                transition: 'left 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </div>
          <span style={{
            color: textColor,
            fontSize: `${fontSize}px`,
            fontFamily: `${fontFamily}, sans-serif`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {properties.text || 'Interrupteur'}
          </span>
        </div>
      );

    // ========== CTkComboBox ==========
    case 'combobox':
      const comboBgColor = style.backgroundColor || properties.fg_color || colors.input;
      const comboTextColor = style.textColor || properties.text_color || colors.text;
      const comboValues = properties.values || ['Option 1', 'Option 2', 'Option 3'];

      return (
        <div style={{ ...baseStyle, position: 'relative' }}>
          <div
            onClick={() => isPreviewMode && setComboboxOpen(!comboboxOpen)}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: comboBgColor,
              color: comboTextColor,
              border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
              borderRadius: `${cornerRadius}px`,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isPreviewMode ? 'pointer' : 'default',
              boxSizing: 'border-box',
            }}
          >
            <span>{comboValues[comboboxSelected]}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px', transition: 'transform 0.2s', transform: comboboxOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M2 4L6 8L10 4" stroke={comboTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {comboboxOpen && isPreviewMode && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: getColor(properties.dropdown_fg_color, colors.fg),
              border: `1px solid ${borderColor}`,
              borderRadius: `${cornerRadius}px`,
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {comboValues.map((value: string, index: number) => (
                <div
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setComboboxSelected(index);
                    setComboboxOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: index === comboboxSelected ? getColor(properties.dropdown_hover_color, colors.checkmark) : 'transparent',
                    color: getColor(properties.dropdown_text_color, colors.text),
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (index !== comboboxSelected) {
                      e.currentTarget.style.backgroundColor = getColor(properties.dropdown_hover_color, colors.scrollbar);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index !== comboboxSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    // ========== CTkOptionMenu ==========
    case 'optionmenu':
      // Couleur de texte spécifique pour OptionMenu: blanc par défaut sauf si personnalisée
      const optionMenuTextColor = style.textColor || properties.text_color || '#FFFFFF';
      const optionValues = properties.values || ['Option 1', 'Option 2', 'Option 3'];

      return (
        <div style={{ ...baseStyle, position: 'relative' }}>
          <div
            onClick={() => isPreviewMode && setOptionMenuOpen(!optionMenuOpen)}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: fgColor,
              color: optionMenuTextColor,
              border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
              borderRadius: `${cornerRadius}px`,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isPreviewMode ? 'pointer' : 'default',
              boxSizing: 'border-box',
            }}
          >
            <span>{optionValues[optionMenuSelected]}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px', transition: 'transform 0.2s', transform: optionMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M2 4L6 8L10 4" stroke={optionMenuTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {optionMenuOpen && isPreviewMode && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: getColor(properties.dropdown_fg_color, colors.fg),
              border: `1px solid ${borderColor}`,
              borderRadius: `${cornerRadius}px`,
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {optionValues.map((value: string, index: number) => (
                <div
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOptionMenuSelected(index);
                    setOptionMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    backgroundColor: index === optionMenuSelected ? getColor(properties.dropdown_hover_color, colors.checkmark) : 'transparent',
                    color: getColor(properties.dropdown_text_color, '#FFFFFF'),
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (index !== optionMenuSelected) {
                      e.currentTarget.style.backgroundColor = getColor(properties.dropdown_hover_color, colors.scrollbar);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index !== optionMenuSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    // ========== CTkSegmentedButton ==========
    case 'segmentedbutton':
      const segments = properties.values || ['Segment 1', 'Segment 2'];

      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            backgroundColor: getColor(properties.fg_color, colors.input),
            border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
            padding: '2px',
            gap: '2px',
          }}
        >
          {segments.map((seg: string, i: number) => (
            <div
              key={i}
              onClick={() => {
                if (isPreviewMode && properties.state !== 'disabled') {
                  setSegmentedSelected(i);
                }
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: i === segmentedSelected ? getColor(properties.selected_color, colors.checkmark) : 'transparent',
                color: i === segmentedSelected ? getColor(properties.text_color, '#FFFFFF') : textColor,
                borderRadius: `${Math.max(cornerRadius - 2, 4)}px`,
                textAlign: 'center',
                fontSize: `${fontSize}px`,
                fontFamily: `${fontFamily}, sans-serif`,
                fontWeight: i === segmentedSelected ? 500 : 'normal',
                cursor: isPreviewMode ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                pointerEvents: isPreviewMode ? 'auto' : 'none',
              }}
              onMouseEnter={(e) => {
                if (isPreviewMode && i !== segmentedSelected) {
                  e.currentTarget.style.backgroundColor = getColor(properties.unselected_hover_color, 'rgba(255,255,255,0.1)');
                }
              }}
              onMouseLeave={(e) => {
                if (isPreviewMode && i !== segmentedSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {seg}
            </div>
          ))}
        </div>
      );

    // ========== CTkSlider ==========
    case 'slider': {
      const sliderFrom = properties.from_ !== undefined ? Number(properties.from_) : 0;
      const sliderTo = properties.to !== undefined ? Number(properties.to) : 100;
      const sliderRange = Math.max(sliderTo - sliderFrom, 1);
      const sliderPercent = ((sliderValue - sliderFrom) / sliderRange) * 100;
      const sliderOrientation = properties.orientation || 'horizontal';
      const isVerticalSlider = sliderOrientation === 'vertical';
      const sliderTrackColor = getColor(properties.fg_color, colors.scrollbar);
      const sliderProgressColor = getColor(properties.progress_color, colors.progress);
      const sliderButtonColor = getColor(properties.button_color, '#FFFFFF');
      const sliderButtonHoverColor = getColor(properties.button_hover_color, colors.buttonHover);
      const sliderBtnCornerRadius = properties.button_corner_radius !== undefined ? properties.button_corner_radius : 1000;

      const handleSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPreviewMode || properties.state === 'disabled') return;
        e.stopPropagation();
        e.preventDefault();
        setSliderDragging(true);
        const trackEl = e.currentTarget.closest('[data-slider-track]') as HTMLElement;
        if (!trackEl) return;

        const updateValue = (clientX: number, clientY: number) => {
          const rect = trackEl.getBoundingClientRect();
          let ratio: number;
          if (isVerticalSlider) {
            ratio = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
          } else {
            ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
          }
          const steps = properties.number_of_steps;
          if (steps && steps > 0) {
            ratio = Math.round(ratio * steps) / steps;
          }
          const newVal = sliderFrom + ratio * sliderRange;
          setSliderValue(Math.round(newVal * 100) / 100);
        };

        updateValue(e.clientX, e.clientY);

        const onMove = (me: MouseEvent) => {
          me.preventDefault();
          updateValue(me.clientX, me.clientY);
        };
        const onUp = () => {
          setSliderDragging(false);
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      };

      if (isVerticalSlider) {
        return (
          <div
            style={{
              ...baseStyle,
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 12px',
              position: 'relative',
              border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
            }}
          >
            <div
              data-slider-track="1"
              onMouseDown={handleSliderMouseDown}
              style={{
                width: '6px',
                height: '100%',
                backgroundColor: sliderTrackColor,
                borderRadius: '3px',
                position: 'relative',
                cursor: isPreviewMode ? 'pointer' : 'default',
                pointerEvents: isPreviewMode ? 'auto' : 'none',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${sliderPercent}%`,
                  backgroundColor: sliderProgressColor,
                  borderRadius: '3px',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                }}
              />
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: sliderDragging ? sliderButtonHoverColor : sliderButtonColor,
                  borderRadius: `${sliderBtnCornerRadius}px`,
                  position: 'absolute',
                  left: '-5px',
                  bottom: `calc(${sliderPercent}% - 8px)`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: sliderDragging ? 'none' : 'bottom 0.1s ease',
                }}
              >
                {sliderDragging && isPreviewMode && (
                  <div style={{ position: 'absolute', right: '22px', top: '50%', transform: 'translateY(-50%)', backgroundColor: isDark ? '#333' : '#222', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10 }}>
                    {sliderValue}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            padding: '12px 8px',
            position: 'relative',
            border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
          }}
        >
          <div
            data-slider-track="1"
            onMouseDown={handleSliderMouseDown}
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: sliderTrackColor,
              borderRadius: '3px',
              position: 'relative',
              cursor: isPreviewMode ? 'pointer' : 'default',
              pointerEvents: isPreviewMode ? 'auto' : 'none',
            }}
          >
            <div
              style={{
                width: `${sliderPercent}%`,
                height: '100%',
                backgroundColor: sliderProgressColor,
                borderRadius: '3px',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: sliderDragging ? sliderButtonHoverColor : sliderButtonColor,
                borderRadius: `${sliderBtnCornerRadius}px`,
                position: 'absolute',
                top: '-5px',
                left: `calc(${sliderPercent}% - 8px)`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                pointerEvents: 'auto',
                transition: sliderDragging ? 'none' : 'left 0.1s ease',
              }}
            >
              {sliderDragging && isPreviewMode && (
                <div style={{ position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)', backgroundColor: isDark ? '#333' : '#222', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10 }}>
                  {sliderValue}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ========== CTkProgressBar ==========
    case 'progressbar': {
      const progressVal = properties.progress !== undefined ? Math.max(0, Math.min(1, Number(properties.progress) / 100)) : 0.7;
      const progressOrientation = properties.orientation || 'horizontal';
      const isVerticalProgress = progressOrientation === 'vertical';
      const progressTrackColor = getColor(properties.fg_color, colors.scrollbar);
      const progressBarColor = getColor(properties.progress_color, colors.progress);

      if (isVerticalProgress) {
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: progressTrackColor,
              padding: '0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              overflow: 'hidden',
              border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${progressVal * 100}%`,
                backgroundColor: progressBarColor,
                borderRadius: `${cornerRadius}px`,
                transition: 'height 0.3s ease',
              }}
            />
          </div>
        );
      }

      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: progressTrackColor,
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
          }}
        >
          <div
            style={{
              width: `${progressVal * 100}%`,
              height: '100%',
              backgroundColor: progressBarColor,
              borderRadius: `${cornerRadius}px`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      );
    }

    // ========== CTkScrollbar ==========
    case 'scrollbar': {
      const sbOrientation = properties.orientation || 'vertical';
      const isVerticalSb = sbOrientation === 'vertical';
      const sbFgColor = getColor(properties.fg_color, colors.scrollbar);
      const sbButtonColor = getColor(properties.button_color, isDark ? '#636363' : '#A5A5A5');
      const sbButtonHoverColor = getColor(properties.button_hover_color, isDark ? '#808080' : '#8A8A8A');
      const sbCornerRadius = properties.corner_radius !== undefined ? properties.corner_radius : 1000;
      const sbBorderSpacing = properties.border_spacing !== undefined ? properties.border_spacing : 2;
      const sbThumbRatio = 0.35; // proportion visible du thumb (simule un contenu)

      if (isVerticalSb) {
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: sbFgColor,
              borderRadius: `${sbCornerRadius}px`,
              padding: `${sbBorderSpacing}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
            }}
          >
            <div
              onMouseEnter={() => setSbHovered(true)}
              onMouseLeave={() => setSbHovered(false)}
              style={{
                width: '100%',
                height: `${sbThumbRatio * 100}%`,
                minHeight: `${properties.minimum_pixel_length || 20}px`,
                backgroundColor: sbHovered ? sbButtonHoverColor : sbButtonColor,
                borderRadius: `${Math.max(sbCornerRadius - sbBorderSpacing, 0)}px`,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            />
          </div>
        );
      }

      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: sbFgColor,
            borderRadius: `${sbCornerRadius}px`,
            padding: `${sbBorderSpacing}px`,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            overflow: 'hidden',
            border: `${effectiveBorderWidth}px solid ${effectiveBorderColor}`,
          }}
        >
          <div
            onMouseEnter={() => setSbHovered(true)}
            onMouseLeave={() => setSbHovered(false)}
            style={{
              height: '100%',
              width: `${sbThumbRatio * 100}%`,
              minWidth: `${properties.minimum_pixel_length || 20}px`,
              backgroundColor: sbHovered ? sbButtonHoverColor : sbButtonColor,
              borderRadius: `${Math.max(sbCornerRadius - sbBorderSpacing, 0)}px`,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          />
        </div>
      );
    }

    // ========== CTkFrame ==========
    case 'frame':
      return <FrameRenderer ctx={renderCtx} />;

    // ========== CTkScrollableFrame ==========
    case 'scrollableframe':
      return <ScrollableFrameRenderer ctx={renderCtx} />;

    // ========== CTkTabview ==========
    case 'tabview':
      return <TabviewRenderer ctx={renderCtx} />;

    case 'statCard':
      return <StatCardRenderer ctx={renderCtx} />;

    case 'table':
      return <TableRenderer ctx={renderCtx} />;

    case 'menuItem':
      return <MenuItemRenderer ctx={renderCtx} />;

    case 'chart':
      return <ChartRenderer ctx={renderCtx} />;

    case 'datepicker':
      return <DatePickerRenderer ctx={renderCtx} />;

    case 'statCardWithProgress':
      return <StatCardWithProgressRenderer ctx={renderCtx} />;

    case 'productCard':
      return <ProductCardRenderer ctx={renderCtx} />;

    case 'userProfile':
      return <UserProfileRenderer ctx={renderCtx} />;

    default:
      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.fg,
            color: textColor,
            border: `1px dashed ${borderColor}`,
          }}
        >
          {widget.type}
        </div>
      );
  }
});
