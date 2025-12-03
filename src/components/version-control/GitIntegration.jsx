import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
    GitCompare,
    Plus,
    Check,
    Copy,
    Download,
    Upload,
    History,
    Tag,
    ChevronDown,
    ChevronRight,
    FileCode,
    FilePlus,
    FileMinus,
    FileEdit,
    ExternalLink,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
    Trash2,
    RotateCcw,
    Search,
    Filter,
    RefreshCw,
    Settings,
    Link2,
    Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

function StagedChanges({ files, onUnstage, onDiscard }) {
    if (!files || files.length === 0) {
        return (
            <div className="text-center py-6 text-slate-500 text-sm">
                No staged changes
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 group">
                    {file.status === 'added' && <FilePlus className="w-4 h-4 text-green-400" />}
                    {file.status === 'modified' && <FileEdit className="w-4 h-4 text-yellow-400" />}
                    {file.status === 'deleted' && <FileMinus className="w-4 h-4 text-red-400" />}
                    <span className="flex-1 text-sm text-slate-300 truncate font-mono">{file.path}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUnstage?.(file)}>
                            <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => onDiscard?.(file)}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function RemoteStatus({ remote, onSync, onPush, onPull }) {
    return (
        <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        remote.connected ? "bg-green-400" : "bg-red-400"
                    )} />
                    <span className="text-sm font-medium text-white">{remote.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-slate-600">
                    {remote.provider}
                </Badge>
            </div>
            <p className="text-xs text-slate-500 mb-3 font-mono truncate">{remote.url}</p>
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 text-xs">
                    <span className="text-slate-500">
                        <span className="text-green-400">↑ {remote.ahead}</span> ahead
                    </span>
                    <span className="text-slate-500">
                        <span className="text-cyan-400">↓ {remote.behind}</span> behind
                    </span>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700" onClick={onPull}>
                    <Download className="w-3 h-3 mr-1" />
                    Pull
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700" onClick={onPush}>
                    <Upload className="w-3 h-3 mr-1" />
                    Push
                </Button>
            </div>
        </div>
    );
}

function MergeConflictResolver({ conflicts, onResolve }) {
    const [selectedConflict, setSelectedConflict] = useState(null);
    const [resolution, setResolution] = useState('ours'); // ours, theirs, manual

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                    {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} to resolve
                </span>
                <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-slate-800 border-slate-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="ours">Keep Ours</SelectItem>
                        <SelectItem value="theirs">Keep Theirs</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                {conflicts.map((conflict, idx) => (
                    <div 
                        key={idx}
                        className={cn(
                            "p-2 rounded-lg border cursor-pointer transition-colors",
                            selectedConflict === idx 
                                ? "border-red-500/50 bg-red-500/10" 
                                : "border-slate-700/50 hover:border-slate-600"
                        )}
                        onClick={() => setSelectedConflict(idx)}
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-slate-300 font-mono">{conflict.file}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {conflict.markers} conflict marker{conflict.markers !== 1 ? 's' : ''}
                        </p>
                    </div>
                ))}
            </div>
            <Button 
                onClick={() => onResolve?.(resolution)} 
                className="w-full bg-red-600 hover:bg-red-500"
                disabled={conflicts.length === 0}
            >
                <GitMerge className="w-4 h-4 mr-2" />
                Resolve All Conflicts
            </Button>
        </div>
    );
}

function StashList({ stashes, onApply, onDrop }) {
    return (
        <div className="space-y-2">
            {stashes.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                    No stashes
                </div>
            ) : (
                stashes.map((stash, idx) => (
                    <div key={idx} className="p-2 rounded-lg border border-slate-700/50 bg-slate-800/30 group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-300">{stash.message}</p>
                                <p className="text-xs text-slate-500">{stash.date} • {stash.files} files</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-7" onClick={() => onApply?.(stash)}>
                                    Apply
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-red-400" onClick={() => onDrop?.(stash)}>
                                    Drop
                                </Button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default function GitIntegration({ project, approvedTasks, onAction }) {
    const [activeTab, setActiveTab] = useState('changes');
    const [commitMessage, setCommitMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const stagedFiles = approvedTasks?.flatMap(task => 
        task.diff?.files?.map(f => ({
            path: f.path,
            status: f.original ? 'modified' : 'added',
            additions: f.additions || 0,
            deletions: f.deletions || 0
        })) || []
    ) || [];

    const remote = {
        name: 'origin',
        provider: 'GitHub',
        url: project?.github_url || 'https://github.com/user/repo.git',
        connected: true,
        ahead: stagedFiles.length,
        behind: 0
    };

    const conflicts = [];

    const stashes = [
        { id: 1, message: 'WIP: feature work', date: '2 hours ago', files: 3 },
        { id: 2, message: 'Temporary changes', date: '1 day ago', files: 5 }
    ];

    const handleCommit = async () => {
        if (!commitMessage.trim()) return;
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setIsLoading(false);
        setCommitMessage('');
        onAction?.('commit', { message: commitMessage });
    };

    const handlePush = async () => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsLoading(false);
        onAction?.('push');
    };

    const handlePull = async () => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsLoading(false);
        onAction?.('pull');
    };

    const totalAdditions = stagedFiles.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = stagedFiles.reduce((sum, f) => sum + f.deletions, 0);

    return (
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                        <GitBranch className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Git Integration</h3>
                        <p className="text-xs text-slate-500">
                            {stagedFiles.length} staged • 
                            <span className="text-green-400 ml-1">+{totalAdditions}</span>
                            <span className="text-red-400 ml-1">-{totalDeletions}</span>
                        </p>
                    </div>
                </div>
                {isLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-transparent px-2">
                    <TabsTrigger value="changes" className="text-xs data-[state=active]:bg-slate-800">
                        Changes
                        {stagedFiles.length > 0 && (
                            <Badge className="ml-1 h-4 px-1 text-[9px]">{stagedFiles.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="remote" className="text-xs data-[state=active]:bg-slate-800">
                        Remote
                    </TabsTrigger>
                    <TabsTrigger value="stash" className="text-xs data-[state=active]:bg-slate-800">
                        Stash
                        {stashes.length > 0 && (
                            <Badge className="ml-1 h-4 px-1 text-[9px]">{stashes.length}</Badge>
                        )}
                    </TabsTrigger>
                    {conflicts.length > 0 && (
                        <TabsTrigger value="conflicts" className="text-xs data-[state=active]:bg-slate-800">
                            <AlertCircle className="w-3 h-3 mr-1 text-red-400" />
                            Conflicts
                            <Badge className="ml-1 h-4 px-1 text-[9px] bg-red-500/20 text-red-400">{conflicts.length}</Badge>
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="changes" className="m-0 p-4">
                    <div className="space-y-4">
                        {/* Commit Message */}
                        <div>
                            <Textarea
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Commit message..."
                                className="bg-slate-800/50 border-slate-700 min-h-[80px] resize-none"
                            />
                        </div>

                        {/* Staged Changes */}
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Staged Changes</p>
                            <ScrollArea className="max-h-48">
                                <StagedChanges files={stagedFiles} />
                            </ScrollArea>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button 
                                onClick={handleCommit}
                                disabled={!commitMessage.trim() || stagedFiles.length === 0 || isLoading}
                                className="flex-1 bg-green-600 hover:bg-green-500"
                            >
                                <GitCommit className="w-4 h-4 mr-2" />
                                Commit
                            </Button>
                            <Button 
                                onClick={handlePush}
                                disabled={isLoading}
                                variant="outline" 
                                className="border-slate-700"
                            >
                                <Upload className="w-4 h-4 mr-1" />
                                Push
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="remote" className="m-0 p-4">
                    <div className="space-y-4">
                        <RemoteStatus 
                            remote={remote}
                            onPush={handlePush}
                            onPull={handlePull}
                        />
                        
                        <div className="pt-4 border-t border-slate-700/50">
                            <Button variant="outline" className="w-full border-slate-700 justify-start">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Remote
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="stash" className="m-0 p-4">
                    <div className="space-y-4">
                        <Button variant="outline" className="w-full border-slate-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Stash Changes
                        </Button>
                        <ScrollArea className="max-h-48">
                            <StashList stashes={stashes} />
                        </ScrollArea>
                    </div>
                </TabsContent>

                {conflicts.length > 0 && (
                    <TabsContent value="conflicts" className="m-0 p-4">
                        <MergeConflictResolver conflicts={conflicts} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}