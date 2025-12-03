import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Bell,
    BellRing,
    AtSign,
    UserPlus,
    MessageSquare,
    CheckCircle,
    AlertTriangle,
    X,
    Check,
    Settings,
    Filter,
    Trash2,
    Bot,
    Code,
    Shield,
    TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';

const notificationTypes = {
    mention: { icon: AtSign, color: 'cyan', label: 'Mention' },
    assignment: { icon: UserPlus, color: 'purple', label: 'Assignment' },
    comment: { icon: MessageSquare, color: 'blue', label: 'Comment' },
    completion: { icon: CheckCircle, color: 'green', label: 'Completed' },
    alert: { icon: AlertTriangle, color: 'yellow', label: 'Alert' }
};

const colorClasses = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400'
};

function NotificationItem({ notification, onMarkRead, onDismiss }) {
    const type = notificationTypes[notification.type] || notificationTypes.comment;
    const Icon = type.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            className={cn(
                "p-3 rounded-lg border transition-all group",
                notification.read
                    ? "bg-slate-800/30 border-slate-700/30"
                    : "bg-slate-800/70 border-slate-700/50"
            )}
        >
            <div className="flex gap-3">
                <div className={cn("p-2 rounded-lg h-fit", colorClasses[type.color])}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className={cn(
                                "text-sm",
                                notification.read ? "text-slate-400" : "text-white font-medium"
                            )}>
                                {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                                <button
                                    onClick={() => onMarkRead(notification.id)}
                                    className="p-1 hover:bg-slate-700 rounded"
                                    title="Mark as read"
                                >
                                    <Check className="w-3 h-3 text-slate-400" />
                                </button>
                            )}
                            <button
                                onClick={() => onDismiss(notification.id)}
                                className="p-1 hover:bg-slate-700 rounded"
                                title="Dismiss"
                            >
                                <X className="w-3 h-3 text-slate-400" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-slate-600">{notification.timestamp}</span>
                        {notification.source && (
                            <Badge className="text-[9px] h-4 bg-slate-700/50 text-slate-400">
                                {notification.source}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'mention',
            title: 'Security Agent mentioned you',
            message: '@you Please review the auth validation changes',
            timestamp: '5 mins ago',
            source: 'Task #42',
            read: false
        },
        {
            id: 2,
            type: 'assignment',
            title: 'New agent assignment',
            message: 'Architect Agent was assigned to "Refactor API handlers"',
            timestamp: '1 hour ago',
            source: 'Task #38',
            read: false
        },
        {
            id: 3,
            type: 'completion',
            title: 'Workflow completed',
            message: 'Full Deployment workflow finished successfully',
            timestamp: '2 hours ago',
            source: 'Workflow',
            read: false
        },
        {
            id: 4,
            type: 'comment',
            title: 'New comment on task',
            message: 'Testing Agent: "All edge cases now covered"',
            timestamp: '3 hours ago',
            source: 'Task #35',
            read: true
        },
        {
            id: 5,
            type: 'alert',
            title: 'Security vulnerability detected',
            message: 'High severity issue found in authentication module',
            timestamp: '5 hours ago',
            source: 'Security Scan',
            read: true
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = filter === 'all' 
        ? notifications 
        : filter === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.type === filter);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const dismiss = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    {unreadCount > 0 ? (
                        <BellRing className="w-5 h-5 text-cyan-400" />
                    ) : (
                        <Bell className="w-5 h-5 text-slate-400" />
                    )}
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full text-[10px] font-medium text-white flex items-center justify-center"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 bg-slate-900 border-slate-700" align="end">
                {/* Header */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-white">Notifications</h3>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="h-7 text-xs text-slate-400 hover:text-white"
                                >
                                    Mark all read
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400"
                                onClick={clearAll}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex gap-1 flex-wrap">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'unread', label: 'Unread' },
                            { id: 'mention', label: 'Mentions' },
                            { id: 'assignment', label: 'Assignments' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={cn(
                                    "px-2 py-1 rounded text-xs transition-colors",
                                    filter === f.id
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications List */}
                <ScrollArea className="max-h-96">
                    <div className="p-2 space-y-2">
                        <AnimatePresence>
                            {filteredNotifications.length > 0 ? (
                                filteredNotifications.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkRead={markAsRead}
                                        onDismiss={dismiss}
                                    />
                                ))
                            ) : (
                                <div className="py-8 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}