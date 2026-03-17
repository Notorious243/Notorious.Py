import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTheme } from 'next-themes';

interface CodeSyntaxHighlighterProps {
  code: string;
}

export const CodeSyntaxHighlighter: React.FC<CodeSyntaxHighlighterProps> = ({ code }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Dark mode theme - elegant colors for dark background
  const darkModeTheme = {
    'code[class*="language-"]': {
      color: '#E8EAED',
      background: '#1E1E1E',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      textAlign: 'left' as const,
      whiteSpace: 'pre' as const,
      wordSpacing: 'normal' as const,
      wordBreak: 'normal' as const,
      wordWrap: 'normal' as const,
      lineHeight: '1.6',
      tabSize: 4,
    },
    'pre[class*="language-"]': {
      color: '#E8EAED',
      background: '#1E1E1E',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      textAlign: 'left' as const,
      whiteSpace: 'pre' as const,
      wordSpacing: 'normal' as const,
      wordBreak: 'normal' as const,
      wordWrap: 'normal' as const,
      lineHeight: '1.6',
      tabSize: 4,
      margin: 0,
      padding: 0,
      overflow: 'auto' as const,
    },
    'comment': { color: '#6A9955' }, // Green comments
    'prolog': { color: '#6A9955' },
    'doctype': { color: '#6A9955' },
    'cdata': { color: '#6A9955' },
    'punctuation': { color: '#D4D4D4' },
    'property': { color: '#9CDCFE' }, // Light blue
    'tag': { color: '#4EC9B0' }, // Cyan
    'boolean': { color: '#569CD6' }, // Blue
    'number': { color: '#B5CEA8' }, // Light green
    'constant': { color: '#4FC1FF' },
    'symbol': { color: '#4FC1FF' },
    'deleted': { color: '#F48771' },
    'selector': { color: '#D7BA7D' },
    'attr-name': { color: '#9CDCFE' },
    'string': { color: '#CE9178' }, // Orange
    'char': { color: '#CE9178' },
    'builtin': { color: '#4EC9B0' }, // Cyan
    'inserted': { color: '#B5CEA8' },
    'operator': { color: '#D4D4D4' },
    'entity': { color: '#DCDCAA' },
    'url': { color: '#9CDCFE' },
    'variable': { color: '#9CDCFE' },
    'atrule': { color: '#C586C0' },
    'attr-value': { color: '#CE9178' },
    'function': { color: '#DCDCAA' }, // Yellow
    'class-name': { color: '#4EC9B0' }, // Cyan
    'keyword': { color: '#C586C0' }, // Purple
    'regex': { color: '#D16969' },
    'important': { color: '#569CD6', fontWeight: 'bold' as const },
  };

  // Custom theme optimized for light mode with soft gray background
  const lightModeTheme = {
    'code[class*="language-"]': {
      color: '#2E3440', // Dark text for readability
      background: '#F5F5F5', // Soft gray background (blanc cassé)
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      textAlign: 'left' as const,
      whiteSpace: 'pre' as const,
      wordSpacing: 'normal' as const,
      wordBreak: 'normal' as const,
      wordWrap: 'normal' as const,
      lineHeight: '1.6',
      tabSize: 4,
    },
    'pre[class*="language-"]': {
      color: '#2E3440',
      background: '#F5F5F5',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      textAlign: 'left' as const,
      whiteSpace: 'pre' as const,
      wordSpacing: 'normal' as const,
      wordBreak: 'normal' as const,
      wordWrap: 'normal' as const,
      lineHeight: '1.6',
      tabSize: 4,
      margin: 0,
      padding: 0,
      overflow: 'auto' as const,
    },
    'comment': { color: '#6C7A89' }, // Medium gray comments
    'prolog': { color: '#6C7A89' },
    'doctype': { color: '#6C7A89' },
    'cdata': { color: '#6C7A89' },
    'punctuation': { color: '#4A5568' }, // Dark gray punctuation
    'property': { color: '#0077AA' }, // Deep blue
    'tag': { color: '#008080' }, // Teal
    'boolean': { color: '#0066CC' }, // Blue
    'number': { color: '#2C7A3C' }, // Green
    'constant': { color: '#0077AA' },
    'symbol': { color: '#0077AA' },
    'deleted': { color: '#C53030' },
    'selector': { color: '#856404' },
    'attr-name': { color: '#0077AA' },
    'string': { color: '#A85400' }, // Orange brown strings
    'char': { color: '#A85400' },
    'builtin': { color: '#008080' }, // Teal for built-ins
    'inserted': { color: '#2C7A3C' },
    'operator': { color: '#4A5568' }, // Dark gray operators
    'entity': { color: '#856404' },
    'url': { color: '#0077AA' },
    'variable': { color: '#0077AA' },
    'atrule': { color: '#0F3460' },
    'attr-value': { color: '#A85400' },
    'function': { color: '#1F5AA0' }, // Navy functions
    'class-name': { color: '#008080' }, // Teal class names
    'keyword': { color: '#C026D3' }, // Magenta keywords
    'regex': { color: '#C53030' },
    'important': { color: '#0066CC', fontWeight: 'bold' as const },
  };

  const activeTheme = isDark ? darkModeTheme : lightModeTheme;
  const bgColor = isDark ? '#1E1E1E' : '#F5F5F5';
  const lineNumberColor = isDark ? '#858585' : '#9CA3AF';

  return (
    <SyntaxHighlighter
      language="python"
      style={activeTheme}
      showLineNumbers={true}
      wrapLines={false}
      wrapLongLines={false}
      customStyle={{
        width: '100%',
        minHeight: '100%',
        padding: '1.5rem',
        fontSize: '0.875rem',
        fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
        backgroundColor: bgColor,
        margin: 0,
        borderRadius: '0.375rem',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'inherit',
          display: 'block',
        },
      }}
      lineNumberStyle={{
        color: lineNumberColor,
        backgroundColor: bgColor,
        paddingRight: '1rem',
        minWidth: '3em',
        textAlign: 'right' as const,
        userSelect: 'none' as const,
        borderRight: `1px solid ${isDark ? '#333' : '#DDD'}`,
        marginRight: '1rem',
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};
