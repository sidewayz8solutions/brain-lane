import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    MessageSquare,
    Send,
    AtSign,
    Paperclip,
    MoreHorizontal,
    Edit2,
    Trash2,
    Reply,
    ThumbsUp,
    CheckCircle,
    Clock,
    Bot,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const agentAvatars = {
    architect: { bg: 'bg-purple-500', initials: 'AR' },
    security: { bg: 'bg-red-500', initials: 'SE' },
    testing: { bg: 'bg-green-500', initials: 'TE' },
    performance: { bg: 'bg-yellow-500', initials: 'PE' },
    user: { bg: 'bg-cyan-500', initials: 'U' }
};

function CommentItem({ comment, onReply, onEdit, onDelete, onReact }) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const avatar = agentAvatars[comment.author.type] || agentAvatars.user;

    const handleReply = () => {
        if (replyText.trim()) {
            onReply(comment.id, replyText);
            setReplyText('');
            setShowReplyInput(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <div className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={cn(avatar.bg, "text-white text-xs")}>
                        {comment.author.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{comment.author.name}</span>
                        {comment.author.type !== 'user' && (
                            <Badge className="text-[9px] h-4 bg-slate-700 text-slate-400">Agent</Badge>
                        )}
                        <span className="text-xs text-slate-500">{comment.timestamp}</span>
                        {comment.edited && <span className="text-xs text-slate-600">(edited)</span>}
                    </div>
                    
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                        
                        {comment.mentions?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {comment.mentions.map((mention, idx) => (
                                    <Badge key={idx} className="text-[10px] bg-cyan-500/20 text-cyan-400">
                                        @{mention}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onReact(comment.id, 'like')}
                            className={cn(
                                "flex items-center gap-1 text-xs transition-colors",
                                comment.reactions?.like > 0 ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <ThumbsUp className="w-3 h-3" />
                            {comment.reactions?.like > 0 && comment.reactions.like}
                        </button>
                        <button 
                            onClick={() => setShowReplyInput(!showReplyInput)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
                        >
                            <Reply className="w-3 h-3" />
                            Reply
                        </button>
                        {comment.author.type === 'user' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-slate-500 hover:text-slate-300">
                                        <MoreHorizontal className="w-3 h-3" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-slate-900 border-slate-700">
                                    <DropdownMenuItem onClick={() => onEdit(comment)} className="text-xs">
                                        <Edit2 className="w-3 h-3 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-xs text-red-400">
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Reply Input */}
                    <AnimatePresence>
                        {showReplyInput && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-2 flex gap-2"
                            >
                                <Input
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="flex-1 h-8 text-xs bg-slate-800 border-slate-700"
                                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                />
                                <Button size="sm" className="h-8 bg-cyan-600 hover:bg-cyan-500" onClick={handleReply}>
                                    <Send className="w-3 h-3" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Nested Replies */}
                    {comment.replies?.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-slate-700/50 space-y-3">
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onReact={onReact}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function TaskComments({ taskId, stepId, initialComments = [] }) {
    const [comments, setComments] = useState(initialComments.length > 0 ? initialComments : [
        {
            id: 1,
            author: { name: 'Architect Agent', type: 'architect' },
            content: 'I recommend splitting this function into smaller modules for better maintainability.',
            timestamp: '2 hours ago',
            reactions: { like: 2 },
            mentions: [],
            replies: [
                {
                    id: 2,
                    author: { name: 'You', type: 'user' },
                    content: 'Good point. Should we create a separate utils file?',
                    timestamp: '1 hour ago',
                    reactions: { like: 1 }
                }
            ]
        },
        {
            id: 3,
            author: { name: 'Security Agent', type: 'security' },
            content: '@testing Please verify the input validation on this endpoint.',
            timestamp: '30 mins ago',
            reactions: {},
            mentions: ['testing']
        }
    ]);
    const [newComment, setNewComment] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const inputRef = useRef(null);

    const agents = [
        { id: 'architect', name: 'Architect Agent' },
        { id: 'security', name: 'Security Agent' },
        { id: 'testing', name: 'Testing Agent' },
        { id: 'performance', name: 'Performance Agent' }
    ];

    const handleSubmit = () => {
        if (!newComment.trim()) return;

        const mentions = newComment.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
        
        const comment = {
            id: Date.now(),
            author: { name: 'You', type: 'user' },
            content: newComment,
            timestamp: 'Just now',
            reactions: {},
            mentions,
            replies: []
        };

        setComments(prev => [...prev, comment]);
        setNewComment('');
    };

    const handleReply = (parentId, text) => {
        const reply = {
            id: Date.now(),
            author: { name: 'You', type: 'user' },
            content: text,
            timestamp: 'Just now',
            reactions: {}
        };

        setComments(prev => prev.map(c => 
            c.id === parentId 
                ? { ...c, replies: [...(c.replies || []), reply] }
                : c
        ));
    };

    const handleReact = (commentId, reaction) => {
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                const currentCount = c.reactions?.[reaction] || 0;
                return {
                    ...c,
                    reactions: { ...c.reactions, [reaction]: currentCount + 1 }
                };
            }
            return c;
        }));
    };

    const insertMention = (agentId) => {
        setNewComment(prev => prev + `@${agentId} `);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 p-3 border-b border-slate-700/50">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-white text-sm">Comments</span>
                <Badge className="text-[10px] bg-slate-700">{comments.length}</Badge>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={handleReply}
                        onEdit={(c) => console.log('Edit:', c)}
                        onDelete={(id) => setComments(prev => prev.filter(c => c.id !== id))}
                        onReact={handleReact}
                    />
                ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-700/50">
                <div className="relative">
                    <AnimatePresence>
                        {showMentions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-xl"
                            >
                                <p className="text-xs text-slate-500 mb-2">Mention an agent</p>
                                <div className="space-y-1">
                                    {agents.map(agent => (
                                        <button
                                            key={agent.id}
                                            onClick={() => insertMention(agent.id)}
                                            className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-700 text-left"
                                        >
                                            <Bot className="w-4 h-4 text-cyan-400" />
                                            <span className="text-sm text-white">{agent.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                ref={inputRef}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="pr-16 bg-slate-800 border-slate-700"
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    onClick={() => setShowMentions(!showMentions)}
                                    className="p-1 text-slate-500 hover:text-cyan-400"
                                >
                                    <AtSign className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <Button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-500">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}