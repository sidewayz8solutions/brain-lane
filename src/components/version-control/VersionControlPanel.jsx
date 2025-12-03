import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
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
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

function CommitItem({ commit, isLatest, onRevert, onCherryPick }) {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "border rounded-lg overflow-hidden group",
                isLatest ? "border-cyan-500/30 bg-cyan-500/5" : "border-slate-700/50 bg-slate-800/30"
            )}
        >
            <div className="flex items-start">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex-1 p-3 flex items-start gap-3 text-left"
                >
                    <GitCommit className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isLatest ? "text-cyan-400" : "text-slate-500")} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{commit.message}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <code className="px-1.5 py-0.5 bg-slate-800 rounded">{commit.hash?.substring(0, 7)}</code>
                            <span>{commit.author}</span>
                            <span>{commit.date}</span>
                        </div>
                    </div>
                    {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 mr-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-slate-700">
                        <DropdownMenuItem onClick={() => onCherryPick?.(commit)} className="gap-2">
                            <GitMerge className="w-4 h-4" />
                            Cherry-pick
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRevert?.(commit)} className="gap-2 text-red-400">
                            <RotateCcw className="w-4 h-4" />
                            Revert
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem className="gap-2">
                            <Copy className="w-4 h-4" />
                            Copy SHA
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-slate-700/50"
                    >
                        <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                <span>{commit.files?.length || 0} files changed</span>
                                <div className="flex gap-2">
                                    <span className="text-green-400">+{commit.additions || 0}</span>
                                    <span className="text-red-400">-{commit.deletions || 0}</span>
                                </div>
                            </div>
                            {commit.files?.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    {file.type === 'added' && <FilePlus className="w-3 h-3 text-green-400" />}
                                    {file.type === 'modified' && <FileEdit className="w-3 h-3 text-yellow-400" />}
                                    {file.type === 'deleted' && <FileMinus className="w-3 h-3 text-red-400" />}
                                    <span className="text-slate-400 font-mono">{file.path}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function BranchItem({ branch, isSelected, onSelect, onDelete }) {
    return (
        <button
            onClick={() => onSelect(branch.name)}
            className={cn(
                "w-full px-3 py-2 rounded-lg text-sm text-left flex items-center gap-2 transition-colors",
                isSelected
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600"
            )}
        >
            <GitBranch className="w-3 h-3" />
            <span className="flex-1 truncate">{branch.name}</span>
            {branch.isDefault && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 border-slate-600">default</Badge>
            )}
            {branch.isCurrent && (
                <Badge className="text-[10px] h-4 px-1 bg-green-500/20 text-green-400 border-green-500/30">HEAD</Badge>
            )}
            {branch.behindAhead && (
                <span className="text-[10px] text-slate-600">
                    ↓{branch.behindAhead.behind} ↑{branch.behindAhead.ahead}
                </span>
            )}
        </button>
    );
}

export default function VersionControlPanel({ project, tasks, approvedTasks }) {
    const [showCommitDialog, setShowCommitDialog] = useState(false);
    const [showPRDialog, setShowPRDialog] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [prTitle, setPrTitle] = useState('');
    const [prDescription, setPrDescription] = useState('');
    const [newBranchName, setNewBranchName] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('feature/ai-implementation');
    const [copied, setCopied] = useState(null);
    const [isCreatingPR, setIsCreatingPR] = useState(false);
    const [prCreated, setPrCreated] = useState(false);

    const commits = approvedTasks?.map((task, idx) => {
        const additions = task.diff?.files?.reduce((sum, f) => sum + (f.additions || 0), 0) || 0;
        const deletions = task.diff?.files?.reduce((sum, f) => sum + (f.deletions || 0), 0) || 0;
        return {
            hash: `${Date.now().toString(36)}${idx}${Math.random().toString(36).substring(7)}`,
            message: task.title,
            author: 'AI Assistant',
            date: new Date(task.updated_date || Date.now()).toLocaleDateString(),
            additions,
            deletions,
            files: task.diff?.files?.map(f => ({
                path: f.path,
                type: f.original ? 'modified' : 'added'
            })) || []
        };
    }) || [];

    const branches = [
        { name: 'main', isDefault: true, behindAhead: { behind: 0, ahead: 0 } },
        { name: 'develop', isDefault: false, behindAhead: { behind: 2, ahead: 5 } },
        { name: 'feature/ai-implementation', isDefault: false, isCurrent: true, behindAhead: { behind: 0, ahead: commits.length } }
    ];

    const generateCommitMessage = () => {
        if (approvedTasks?.length === 1) {
            return `feat: ${approvedTasks[0].title.toLowerCase()}`;
        }
        return `feat: implement ${approvedTasks?.length || 0} AI-generated changes\n\n${approvedTasks?.map(t => `- ${t.title}`).join('\n')}`;
    };

    const generatePRDescription = () => {
        return `## Summary
This PR implements ${approvedTasks?.length || 0} AI-generated changes for ${project?.name || 'the project'}.

## Changes
${approvedTasks?.map(t => `- **${t.title}**: ${t.description || 'No description'}`).join('\n') || 'No changes'}

## Testing
All changes have been analyzed and tested by the AI system.

## Generated by
🧠 Brain Lane - AI Senior Developer`;
    };

    const copyGitCommands = async () => {
        const msg = commitMessage || generateCommitMessage();
        const commands = `# Create and switch to feature branch
git checkout -b ${selectedBranch}

# Apply patches
git apply all-patches.patch

# Stage all changes
git add -A

# Commit changes
git commit -m "${msg.split('\n')[0]}"

# Push to remote
git push -u origin ${selectedBranch}

# Create pull request (GitHub CLI)
gh pr create --title "${prTitle || 'AI Implementation'}" --body "Automated changes from Brain Lane"`;
        
        await navigator.clipboard.writeText(commands);
        setCopied('commands');
        setTimeout(() => setCopied(null), 2000);
    };

    const copyCommitSHA = async (sha) => {
        await navigator.clipboard.writeText(sha);
        setCopied(sha);
        setTimeout(() => setCopied(null), 2000);
    };

    const simulateCreatePR = async () => {
        setIsCreatingPR(true);
        await new Promise(r => setTimeout(r, 2000));
        setIsCreatingPR(false);
        setPrCreated(true);
        setShowPRDialog(false);
    };

    const createBranch = () => {
        if (newBranchName.trim()) {
            setSelectedBranch(newBranchName.trim());
            setNewBranchName('');
            setShowBranchDialog(false);
        }
    };

    const totalAdditions = commits.reduce((sum, c) => sum + (c.additions || 0), 0);
    const totalDeletions = commits.reduce((sum, c) => sum + (c.deletions || 0), 0);

    return (
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <GitBranch className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Version Control</h3>
                        <p className="text-xs text-slate-500">
                            {commits.length} commits • <span className="text-green-400">+{totalAdditions}</span> <span className="text-red-400">-{totalDeletions}</span>
                        </p>
                    </div>
                </div>
                {prCreated && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        PR Created
                    </Badge>
                )}
            </div>

            {/* Branch Management */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-500">Branches</label>
                    <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                                <Plus className="w-3 h-3" />
                                New Branch
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700">
                            <DialogHeader>
                                <DialogTitle>Create New Branch</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Branch Name</label>
                                    <Input
                                        value={newBranchName}
                                        onChange={(e) => setNewBranchName(e.target.value)}
                                        placeholder="feature/new-feature"
                                        className="bg-slate-800 border-slate-700"
                                    />
                                </div>
                                <div className="text-xs text-slate-500">
                                    Base branch: <code className="px-1 py-0.5 bg-slate-800 rounded">{selectedBranch}</code>
                                </div>
                                <Button onClick={createBranch} className="w-full bg-purple-600 hover:bg-purple-500">
                                    <GitBranch className="w-4 h-4 mr-2" />
                                    Create Branch
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <ScrollArea className="max-h-32">
                    <div className="space-y-1">
                        {branches.map(branch => (
                            <BranchItem
                                key={branch.name}
                                branch={branch}
                                isSelected={selectedBranch === branch.name}
                                onSelect={setSelectedBranch}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-slate-700/50 grid grid-cols-2 gap-2">
                <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-slate-700 justify-start">
                            <GitCommit className="w-3 h-3 mr-2" />
                            Commit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                            <DialogTitle>Create Commit</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Commit Message</label>
                                <Textarea
                                    value={commitMessage || generateCommitMessage()}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    className="bg-slate-800 border-slate-700 min-h-[100px] font-mono text-sm"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 p-2 bg-slate-800/50 rounded-lg">
                                <span>{approvedTasks?.length || 0} files staged</span>
                                <span><span className="text-green-400">+{totalAdditions}</span> <span className="text-red-400">-{totalDeletions}</span></span>
                            </div>
                            <Button className="w-full bg-purple-600 hover:bg-purple-500">
                                <GitCommit className="w-4 h-4 mr-2" />
                                Commit Changes
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={showPRDialog} onOpenChange={setShowPRDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-slate-700 justify-start">
                            <GitPullRequest className="w-3 h-3 mr-2" />
                            Create PR
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Pull Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-800/50 rounded-lg">
                                <GitBranch className="w-3 h-3" />
                                <code>{selectedBranch}</code>
                                <span>→</span>
                                <code>main</code>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Title</label>
                                <Input
                                    value={prTitle || `feat: ${project?.name || 'AI'} implementation`}
                                    onChange={(e) => setPrTitle(e.target.value)}
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Description</label>
                                <Textarea
                                    value={prDescription || generatePRDescription()}
                                    onChange={(e) => setPrDescription(e.target.value)}
                                    className="bg-slate-800 border-slate-700 min-h-[150px] font-mono text-xs"
                                />
                            </div>
                            <Button 
                                onClick={simulateCreatePR} 
                                disabled={isCreatingPR}
                                className="w-full bg-green-600 hover:bg-green-500"
                            >
                                {isCreatingPR ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <GitPullRequest className="w-4 h-4 mr-2" />
                                        Create Pull Request
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-slate-700 justify-start"
                    onClick={copyGitCommands}
                >
                    {copied === 'commands' ? (
                        <Check className="w-3 h-3 mr-2 text-green-400" />
                    ) : (
                        <Copy className="w-3 h-3 mr-2" />
                    )}
                    Git Commands
                </Button>

                <Button variant="outline" size="sm" className="border-slate-700 justify-start">
                    <Tag className="w-3 h-3 mr-2" />
                    Tag Release
                </Button>
            </div>

            {/* Commit History */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Commit History
                    </h4>
                    <Badge variant="outline" className="text-xs border-slate-700">
                        {commits.length} commits
                    </Badge>
                </div>
                
                <ScrollArea className="max-h-64">
                    <div className="space-y-2">
                        {commits.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No commits yet</p>
                                <p className="text-xs mt-1">Approve tasks to create commits</p>
                            </div>
                        ) : (
                            commits.map((commit, idx) => (
                                <CommitItem 
                                    key={idx} 
                                    commit={commit} 
                                    isLatest={idx === 0}
                                    onRevert={(c) => console.log('Revert:', c)}
                                    onCherryPick={(c) => console.log('Cherry-pick:', c)}
                                />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}