import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { InvokeLLM } from '@/services/aiService';
import {
    Sparkles,
    Loader2,
    Copy,
    Check,
    RefreshCw,
    FileCode,
    MessageSquare,
    BookOpen,
    Bug,
    Wand2,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const templates = [
    { id: 'code', label: 'Generate Code', icon: FileCode, prompt: 'Write code for:' },
    { id: 'docs', label: 'Documentation', icon: BookOpen, prompt: 'Write documentation for:' },
    { id: 'test', label: 'Test Cases', icon: Bug, prompt: 'Write test cases for:' },
    { id: 'refactor', label: 'Refactor Suggestion', icon: RefreshCw, prompt: 'Suggest refactoring for:' },
    { id: 'explain', label: 'Explain Code', icon: MessageSquare, prompt: 'Explain this code:' }
];

export default function AITextGenerator({ context, onInsert, className }) {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const generate = async () => {
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        setResult('');

        try {
            const fullPrompt = context 
                ? `Context:\n${context}\n\nRequest: ${prompt}`
                : prompt;

            const response = await InvokeLLM({
                prompt: fullPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        content: { type: "string" },
                        language: { type: "string" },
                        explanation: { type: "string" }
                    }
                }
            });

            setResult(response.content || response);
        } catch (error) {
            console.error('Generation error:', error);
            setResult('Error generating content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const applyTemplate = (template) => {
        setSelectedTemplate(template);
        setPrompt(template.prompt + ' ');
    };

    return (
        <div className={cn("bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden", className)}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <Wand2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="font-medium text-white">AI Text Generator</h3>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-slate-700 gap-2">
                            <Sparkles className="w-3 h-3" />
                            Templates
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-slate-700">
                        {templates.map(template => (
                            <DropdownMenuItem
                                key={template.id}
                                onClick={() => applyTemplate(template)}
                                className="gap-2 cursor-pointer"
                            >
                                <template.icon className="w-4 h-4 text-slate-400" />
                                {template.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Input */}
            <div className="p-4 space-y-3">
                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to generate..."
                    className="min-h-[100px] bg-slate-800/50 border-slate-700 resize-none"
                />
                <Button
                    onClick={generate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate
                        </>
                    )}
                </Button>
            </div>

            {/* Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-700/50"
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500">Generated Output</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={copyToClipboard}
                                        className="h-7 text-xs"
                                    >
                                        {copied ? (
                                            <Check className="w-3 h-3 mr-1 text-green-400" />
                                        ) : (
                                            <Copy className="w-3 h-3 mr-1" />
                                        )}
                                        {copied ? 'Copied' : 'Copy'}
                                    </Button>
                                    {onInsert && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onInsert(result)}
                                            className="h-7 text-xs"
                                        >
                                            Insert
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <pre className="bg-slate-950 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto max-h-64 overflow-y-auto">
                                <code>{result}</code>
                            </pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}