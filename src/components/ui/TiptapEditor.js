import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Link from '@tiptap/extension-link';
// Suppress known tiptap-markdown vs @tiptap/extension-link duplicate extension warning
const originalWarn = console.warn;
console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes("Duplicate extension names found: ['link']"))
        return;
    originalWarn(...args);
};
// Simple toolbar for formatting
const MenuBar = ({ editor, isRawMode, onToggleRawMode }) => {
    if (!editor) {
        return null;
    }
    return (_jsxs("div", { className: "flex flex-wrap items-center gap-1 p-2 bg-gray-100 border-b border-gray-200 shadow-sm sticky top-0 z-10 w-full text-gray-700 ", children: [_jsx("button", { onClick: onToggleRawMode, className: `px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${isRawMode ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 '}`, title: "Toggle Raw Source Edit", type: "button", children: isRawMode ? 'Raw Source' : 'Raw Source' }), _jsx("div", { className: "w-px h-5 mx-1 bg-gray-300 " }), _jsxs("div", { className: `flex flex-wrap items-center gap-1 ${isRawMode ? 'opacity-50 pointer-events-none' : ''}`, children: [_jsx("button", { onClick: () => editor.chain().focus().undo().run(), disabled: !editor.can().chain().focus().undo().run(), className: "p-1.5 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-30", title: "Undo", type: "button", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M3 7v6h6" }), _jsx("path", { d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" })] }) }), _jsx("button", { onClick: () => editor.chain().focus().redo().run(), disabled: !editor.can().chain().focus().redo().run(), className: "p-1.5 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-30", title: "Redo", type: "button", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M21 7v6h-6" }), _jsx("path", { d: "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" })] }) }), _jsx("div", { className: "w-px h-5 mx-1 bg-gray-300 " }), _jsx("button", { onClick: () => editor.chain().focus().toggleBold().run(), disabled: !editor.can().chain().focus().toggleBold().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''}`, title: "Bold", type: "button", children: _jsx("strong", { className: "font-serif w-4 h-4 flex items-center justify-center", children: "B" }) }), _jsx("button", { onClick: () => editor.chain().focus().toggleItalic().run(), disabled: !editor.can().chain().focus().toggleItalic().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-300 font-bold' : ''}`, title: "Italic", type: "button", children: _jsx("em", { className: "font-serif w-4 h-4 flex items-center justify-center italic", children: "I" }) }), _jsx("button", { onClick: () => editor.chain().focus().toggleStrike().run(), disabled: !editor.can().chain().focus().toggleStrike().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-gray-300 ' : ''}`, title: "Strikethrough", type: "button", children: _jsx("span", { className: "font-serif w-4 h-4 flex items-center justify-center line-through", children: "S" }) }), _jsx("button", { onClick: () => editor.chain().focus().toggleCode().run(), disabled: !editor.can().chain().focus().toggleCode().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('code') ? 'bg-gray-300 font-bold' : ''}`, title: "Code", type: "button", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "16 18 22 12 16 6" }), _jsx("polyline", { points: "8 6 2 12 8 18" })] }) }), _jsx("button", { onClick: () => {
                            if (editor.isActive('link')) {
                                editor.chain().focus().unsetLink().run();
                                return;
                            }
                            const previousUrl = editor.getAttributes('link').href;
                            const url = window.prompt('URL', previousUrl);
                            if (url === null)
                                return;
                            if (url === '') {
                                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                                return;
                            }
                            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                        }, className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('link') ? 'bg-gray-300 ' : ''}`, title: "Link", type: "button", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), _jsx("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })] }) }), _jsx("div", { className: "w-px h-5 mx-1 bg-gray-300 " }), _jsx("button", { onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors text-sm font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 ' : ''}`, title: "Heading 1", type: "button", children: "H1" }), _jsx("button", { onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors text-sm font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 ' : ''}`, title: "Heading 2", type: "button", children: "H2" }), _jsx("button", { onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors text-sm font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 ' : ''}`, title: "Heading 3", type: "button", children: "H3" }), _jsx("div", { className: "w-px h-5 mx-1 bg-gray-300 " }), _jsx("button", { onClick: () => editor.chain().focus().toggleBulletList().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-300 ' : ''}`, title: "Bullet List", type: "button", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "8", y1: "6", x2: "21", y2: "6" }), _jsx("line", { x1: "8", y1: "12", x2: "21", y2: "12" }), _jsx("line", { x1: "8", y1: "18", x2: "21", y2: "18" }), _jsx("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }), _jsx("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }), _jsx("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" })] }) }), _jsx("button", { onClick: () => editor.chain().focus().toggleOrderedList().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-300 ' : ''}`, title: "Numbered List", type: "button", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "10", y1: "6", x2: "21", y2: "6" }), _jsx("line", { x1: "10", y1: "12", x2: "21", y2: "12" }), _jsx("line", { x1: "10", y1: "18", x2: "21", y2: "18" }), _jsx("path", { d: "M4 6h1v4" }), _jsx("path", { d: "M4 10h2" }), _jsx("path", { d: "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" })] }) }), _jsx("button", { onClick: () => editor.chain().focus().toggleBlockquote().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-300 ' : ''}`, title: "Quote", type: "button", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" }), _jsx("path", { d: "M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" })] }) }), _jsx("button", { onClick: () => editor.chain().focus().toggleCodeBlock().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors ${editor.isActive('codeBlock') ? 'bg-gray-300 ' : ''}`, title: "Code Block", type: "button", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }), _jsx("line", { x1: "9", y1: "21", x2: "9", y2: "9" })] }) }), _jsx("button", { onClick: () => editor.chain().focus().setHorizontalRule().run(), className: `p-1.5 rounded-md hover:bg-gray-200 transition-colors`, title: "Horizontal Rule", type: "button", children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" }) }) })] })] }));
};
const TIPTAP_EXTENSIONS = [
    StarterKit,
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'text-blue-600 underline decoration-blue-500/30 hover:decoration-blue-500 underline-offset-2 transition-colors inline-block break-words max-w-full',
            rel: 'noopener noreferrer',
            target: '_blank',
        },
    }),
    Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
    }),
];
export default function TiptapEditor({ content, onChange }) {
    const [isRawMode, setIsRawMode] = React.useState(false);
    const editor = useEditor({
        extensions: TIPTAP_EXTENSIONS,
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-neutral max-w-none min-h-[500px] w-full p-2 lg:p-4 outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            // Serialize back to markdown and send upwards
            const rawMarkdown = editor.storage.markdown.getMarkdown();
            onChange(rawMarkdown);
        },
    });
    // Cleanup memory on unmount
    useEffect(() => {
        return () => {
            editor?.destroy();
        };
    }, [editor]);
    // When toggling to raw mode, we use the `content` prop as the source of truth,
    // assuming it's up to date via `onChange`.
    const handleRawChange = (e) => {
        onChange(e.target.value);
    };
    const handleToggleRawMode = () => {
        if (isRawMode && editor) {
            // Switching FROM raw TO visual
            // Sync the Tiptap document with the new raw markdown
            editor.commands.setContent(content);
        }
        setIsRawMode(!isRawMode);
    };
    return (_jsxs("div", { className: "flex flex-col w-full h-full relative overflow-hidden bg-white border border-input shadow-sm rounded-md", children: [_jsx(MenuBar, { editor: editor, isRawMode: isRawMode, onToggleRawMode: handleToggleRawMode }), _jsx("div", { className: "flex-1 w-full overflow-y-auto min-h-[500px]", children: isRawMode ? (_jsx("textarea", { value: content, onChange: handleRawChange, className: "w-full h-full p-4 lg:p-6 resize-none bg-transparent text-gray-900 font-mono text-sm leading-relaxed outline-none min-h-[500px]", placeholder: "Type raw Markdown or HTML..." })) : (_jsx(EditorContent, { editor: editor, className: "w-full h-full" })) })] }));
}
