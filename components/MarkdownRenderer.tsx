
import React, { useState, useEffect } from 'react';
import { CopyIcon, CheckIcon } from './ui/Icons';

interface MarkdownRendererProps {
  content: string;
  labels?: {
      thinking: string;
      copy: string;
      copied: string;
  };
}

// Declare Prism global to satisfy TS if using global CDN
declare global {
    interface Window {
        Prism: any;
    }
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, labels }) => {
  // --- Thinking Process Detection ---
  
  // Strategy 1: Explicit "*Thinking...*" header (Gemini/Poe custom header)
  let contentToProcess = content;
  let hasThinkingHeader = false;

  if (contentToProcess.trimStart().startsWith('*Thinking...*')) {
    hasThinkingHeader = true;
    contentToProcess = contentToProcess.replace(/\*Thinking\.\.\.\*/, '').trimStart();
  }

  // Strategy 2: Blockquote-style Thoughts (Poe / DeepSeek / R1)
  const blockquoteRegex = /^((?:>.*(?:\n|$))+)/;
  const blockMatch = contentToProcess.match(blockquoteRegex);

  if (blockMatch) {
    const rawThoughts = blockMatch[1];
    const cleanThoughts = rawThoughts
        .split('\n')
        .map(line => line.replace(/^> ?/, ''))
        .join('\n')
        .trim();
    
    const answerContent = contentToProcess.slice(rawThoughts.length).trim();

    return (
        <div className="space-y-4">
            <ThinkingBlock content={cleanThoughts} label={labels?.thinking} labels={labels} />
            {answerContent && <MarkdownRenderer content={answerContent} labels={labels} />}
        </div>
    );
  }

  // Strategy 3: Legacy Heuristic
  if (hasThinkingHeader) {
    let splitMatch = contentToProcess.match(/([\s\S]*?)(\n\n(---|# |Answer:|Here is|Here's)[\s\S]*)/);
    
    if (!splitMatch) {
         const lastDoubleNewlineIndex = contentToProcess.lastIndexOf('\n\n');
         if (lastDoubleNewlineIndex !== -1) {
             if (lastDoubleNewlineIndex < contentToProcess.length - 20) {
                 splitMatch = [
                    contentToProcess,
                    contentToProcess.substring(0, lastDoubleNewlineIndex),
                    contentToProcess.substring(lastDoubleNewlineIndex) // includes the \n\n
                 ] as RegExpMatchArray;
             }
         }
    }

    if (!splitMatch) {
        return (
            <div className="space-y-3">
                 <MarkdownText content={contentToProcess} />
            </div>
        );
    }

    const thoughtText = splitMatch[1].trim();
    const answerText = splitMatch[2].trim();

    return (
        <div className="space-y-4">
            <ThinkingBlock content={thoughtText} label={labels?.thinking} labels={labels} />
            {answerText && <MarkdownRenderer content={answerText} labels={labels} />}
        </div>
    );
  }

  // --- Standard Content Splitting (Code Blocks) ---
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm md:text-base leading-7 font-sans break-words text-zinc-800 dark:text-zinc-200">
      {parts.map((part, index) => {
        // Code Block
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);

          return <CodeBlock key={index} lang={lang} code={code} labels={labels} />;
        }

        // Standard Text
        return <MarkdownText key={index} content={part} />;
      })}
    </div>
  );
};

// --- Sub-component for Code Block ---
const CodeBlock: React.FC<{ lang: string, code: string, labels?: { copy: string, copied: string } | any }> = ({ lang, code, labels }) => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (window.Prism) {
            window.Prism.highlightAll();
        }
    }, [code, lang]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="relative rounded-xl overflow-hidden my-4 border border-zinc-200 dark:border-zinc-800 bg-[#fafafa] dark:bg-[#1e1e20] shadow-sm">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-100/50 dark:bg-zinc-800/50 border-b border-zinc-200/50 dark:border-zinc-700/50">
                <div className="flex items-center gap-2">
                    {/* Mac-style dots */}
                    <div className="flex gap-1.5 mr-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80 dark:bg-red-500/20 border border-red-500/30"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 dark:bg-yellow-500/20 border border-yellow-500/30"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/80 dark:bg-green-500/20 border border-green-500/30"></div>
                    </div>
                    {lang && <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">{lang}</span>}
                </div>
                
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                    {isCopied ? (
                        <>
                            <CheckIcon className="w-3.5 h-3.5" />
                            <span>{labels?.copied || 'Copied'}</span>
                        </>
                    ) : (
                        <>
                            <CopyIcon className="w-3.5 h-3.5" />
                            <span>{labels?.copy || 'Copy'}</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Code Content with Syntax Highlighting Class */}
            <div className="overflow-x-auto p-4 custom-scrollbar">
                <pre className={`font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre language-${lang || 'text'}`}>
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};

// --- Sub-component for Table ---
const TableBlock: React.FC<{ rows: string[] }> = ({ rows }) => {
    // Row 0 is header
    // Row 1 is separator (ignore content, used for detection)
    // Row 2+ is body
    
    const processRow = (row: string) => {
        // Remove leading/trailing pipes if present for cleaner splitting
        let content = row.trim();
        if (content.startsWith('|')) content = content.substring(1);
        if (content.endsWith('|')) content = content.substring(0, content.length - 1);
        return content.split('|').map(c => c.trim());
    };

    const headers = processRow(rows[0]);
    // Skip row 1 (separator)
    const bodyRows = rows.slice(2).map(processRow);

    return (
        <div className="overflow-x-auto my-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider whitespace-nowrap border-r last:border-r-0 border-zinc-200 dark:border-zinc-700">
                                {renderInline(h)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                    {bodyRows.map((row, rI) => (
                        <tr key={rI} className={rI % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/50 dark:bg-zinc-800/50'}>
                            {row.map((cell, cI) => (
                                <td key={cI} className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 border-r last:border-r-0 border-zinc-200 dark:border-zinc-700">
                                    {renderInline(cell)}
                                </td>
                            ))}
                            {/* Fill empty cells if row is shorter than header */}
                            {row.length < headers.length && (
                                Array.from({ length: headers.length - row.length }).map((_, i) => (
                                    <td key={`empty-${i}`} className="px-4 py-3 border-r last:border-r-0 border-zinc-200 dark:border-zinc-700"></td>
                                ))
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Sub-component for Standard Markdown Text (with Table Detection) ---
const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // --- 1. Table Detection Logic ---
        const nextLine = lines[i + 1];
        // Regex for table separator line (e.g., |---|---| or :---:|)
        const tableDelimRegex = /^\s*\|?[-:| ]+\|[-:| ]+\|?\s*$/;
        
        if (nextLine && tableDelimRegex.test(nextLine) && line.trim().includes('|')) {
             const tableRows = [line, nextLine];
             i += 1; // Skip separator line
             
             // Capture subsequent body rows
             while (i + 1 < lines.length) {
                 const bodyLine = lines[i + 1];
                 if (bodyLine.trim().includes('|')) {
                     tableRows.push(bodyLine);
                     i++;
                 } else {
                     break;
                 }
             }
             
             nodes.push(<TableBlock key={`table-${i}`} rows={tableRows} />);
             continue;
        }

        // --- 2. Standard Line Renderers ---
        const key = `line-${i}`;

        if (!line.trim()) {
            nodes.push(<div key={key} className="h-2"></div>);
            continue;
        }

        // Headers
        if (line.startsWith('### ')) {
            nodes.push(<h3 key={key} className="text-lg font-bold mt-4 mb-2 break-words">{renderInline(line.slice(4))}</h3>);
            continue;
        }
        if (line.startsWith('## ')) {
            nodes.push(<h2 key={key} className="text-xl font-bold mt-5 mb-2 break-words">{renderInline(line.slice(3))}</h2>);
            continue;
        }
        if (line.startsWith('# ')) {
             nodes.push(<h1 key={key} className="text-2xl font-bold mt-6 mb-3 break-words">{renderInline(line.slice(2))}</h1>);
             continue;
        }

        // HR
        if (line.trim() === '---') {
            nodes.push(<hr key={key} className="my-4 border-zinc-200 dark:border-zinc-700" />);
            continue;
        }

        // Unordered List
        if (line.trim().startsWith('- ')) {
             nodes.push(
                <div key={key} className="flex gap-2 ml-4 mb-1">
                    <span className="text-zinc-400 select-none">•</span>
                    <span className="break-words">{renderInline(line.trim().slice(2))}</span>
                </div>
             );
             continue;
        }
        
        // Ordered List
        if (/^\d+\.\s/.test(line.trim())) {
            const match = line.trim().match(/^(\d+)\./);
            const num = match ? match[1] : '1';
            const textContent = line.trim().replace(/^\d+\.\s/, '');
            nodes.push(
                 <div key={key} className="flex gap-2 ml-4 mb-1">
                    <span className="text-zinc-500 font-mono text-xs pt-1 select-none">{num}.</span>
                    <span className="break-words">{renderInline(textContent)}</span>
                </div>
            );
            continue;
        }

        // Blockquote
        if (line.startsWith('> ')) {
            nodes.push(
                <div key={key} className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 py-1 my-2 text-zinc-600 dark:text-zinc-400 italic break-words">
                    {renderInline(line.slice(2))}
                </div>
            );
            continue;
        }

        // Paragraph
        nodes.push(<p key={key} className="mb-1 break-words leading-7">{renderInline(line)}</p>);
    }

    return (
        <div className="break-words min-w-0">
            {nodes}
        </div>
    );
};

// --- Sub-component for Collapsible Thinking Process ---
const ThinkingBlock: React.FC<{ content: string, label?: string, labels?: any }> = ({ content, label, labels }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!content) return null;

    return (
        <div className="my-4 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50 w-full max-w-full">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <span className="animate-pulse">✨</span>
                <span>{label || 'Thinking Process'}</span>
                <span className={`ml-auto transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="p-3 text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed border-t border-zinc-200 dark:border-zinc-800 break-words overflow-x-hidden">
                    <MarkdownRenderer content={content} labels={labels} />
                </div>
            )}
        </div>
    );
};

// --- Inline Rendering Helpers ---

// Helper to process **bold** and *italic* inside string parts
const processBold = (text: string) => {
    // Split by bold (**...**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-zinc-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return processItalic(part, i);
    });
};

const processItalic = (text: string, keyPrefix: number) => {
    const parts = text.split(/(\*.*?\*)/g);
    return (
        <span key={keyPrefix}>
            {parts.map((part, i) => {
                if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                     return <em key={i} className="italic text-zinc-700 dark:text-zinc-300">{part.slice(1, -1)}</em>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}

// Regex to check for image extensions
const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(?:[?#]|$)/i.test(url);
};

// Regex to check for audio extensions
const isAudioFile = (url: string) => {
    return /\.(mp3|wav|ogg|m4a|aac|webm)(?:[?#]|$)/i.test(url) ||
           (url.includes('poecdn.net') && url.includes('/audio/'));
};

// Process Raw URLs and Text styles in text segments that are NOT markdown links
const processRawUrls = (text: string) => {
    // Regex for http/https URLs. 
    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    
    const parts = text.split(urlRegex);
    if (parts.length === 1) return processBold(text);
    
    // reset regex
    urlRegex.lastIndex = 0;
    
    return parts.map((part, i) => {
        if (part.match(/^https?:\/\//)) {
             // It's a URL
             if (isImageFile(part)) {
                 return <img key={i} src={part} alt="Generated" className="max-w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-700 my-2 block" loading="lazy" />;
             } else if (isAudioFile(part)) {
                 return (
                    <audio key={i} controls className="w-full my-2 max-w-md">
                        <source src={part} />
                        Your browser does not support the audio element.
                    </audio>
                 );
             } else {
                 return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">{part}</a>;
             }
        }
        return processBold(part);
    });
};

const renderInline = (text: string) => {
    // 1. Process Markdown Links/Images: ![alt](url) or [text](url)
    const mdLinkRegex = /(!?)\[((?:\[[^\]]*\]|[^\[\]])*)\]\s*\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/g;
    
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mdLinkRegex.exec(text)) !== null) {
        // Process text before the match for raw URLs / formatting
        const before = text.slice(lastIndex, match.index);
        if (before) {
            const processedBefore = processRawUrls(before);
            if (Array.isArray(processedBefore)) {
                elements.push(...processedBefore);
            } else {
                elements.push(processedBefore);
            }
        }
        
        const isImageToken = match[1] === '!';
        const alt = match[2];
        let url = match[3].trim();
        let title: string | undefined;
        
        // Title extraction: "url" "title"
        const titleMatch = url.match(/\s+(["'])(.*?)\1$/);
        if (titleMatch) {
            title = titleMatch[2];
            url = url.substring(0, titleMatch.index).trim();
        }
        
        const shouldRenderAsImage = isImageToken || isImageFile(url);
        const shouldRenderAsAudio = isAudioFile(url);

        if (shouldRenderAsImage) {
            elements.push(
                <img 
                    key={match.index + url} 
                    src={url} 
                    alt={alt} 
                    title={title} 
                    className="max-w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-700 my-2 block" 
                    loading="lazy"
                />
            );
        } else if (shouldRenderAsAudio) {
            elements.push(
                <audio key={match.index + url} controls className="w-full my-2 max-w-md">
                    <source src={url} />
                    Your browser does not support the audio element.
                </audio>
            );
        } else {
             // Link
             elements.push(
                <a 
                    key={match.index + url} 
                    href={url} 
                    title={title}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                    {processBold(alt)}
                </a>
            );
        }
        
        lastIndex = mdLinkRegex.lastIndex;
    }
    
    // Process remaining text
    const remaining = text.slice(lastIndex);
    if (remaining) {
        const processedRemaining = processRawUrls(remaining);
        if (Array.isArray(processedRemaining)) {
             elements.push(...processedRemaining);
        } else {
             elements.push(processedRemaining);
        }
    }
    
    return elements;
};

export default MarkdownRenderer;
