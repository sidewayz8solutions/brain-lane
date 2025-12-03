import React, { useState, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { 
    Folder, 
    FolderOpen, 
    FileCode, 
    FileJson, 
    FileText, 
    File,
    ChevronRight,
    ChevronDown
} from 'lucide-react';

const fileIcons = {
    js: FileCode,
    jsx: FileCode,
    ts: FileCode,
    tsx: FileCode,
    py: FileCode,
    json: FileJson,
    md: FileText,
    txt: FileText,
    default: File
};

function getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return fileIcons[ext] || fileIcons.default;
}

function TreeNode({ node, depth = 0 }) {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const isFolder = node.type === 'folder' || node.children?.length > 0;
    const FileIcon = getFileIcon(node.name);

    return (
        <div>
            <div
                onClick={() => isFolder && setIsExpanded(!isExpanded)}
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer",
                    "hover:bg-slate-700/50 transition-colors",
                    isFolder && "cursor-pointer"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {isFolder ? (
                    <>
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        {isExpanded ? (
                            <FolderOpen className="w-4 h-4 text-cyan-400" />
                        ) : (
                            <Folder className="w-4 h-4 text-cyan-400" />
                        )}
                    </>
                ) : (
                    <>
                        <span className="w-3.5" />
                        <FileIcon className="w-4 h-4 text-slate-400" />
                    </>
                )}
                <span className={cn(
                    "text-sm truncate",
                    isFolder ? "text-white font-medium" : "text-slate-300"
                )}>
                    {node.name}
                </span>
                {node.size && !isFolder && (
                    <span className="text-xs text-slate-600 ml-auto">
                        {formatSize(node.size)}
                    </span>
                )}
            </div>
            
            {isFolder && isExpanded && node.children && (
                <div>
                    {node.children.map((child, idx) => (
                        <TreeNode key={idx} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function buildTree(files) {
    const root = { name: 'root', type: 'folder', children: [] };
    
    if (!files || !Array.isArray(files)) return root;
    
    files.forEach(file => {
        const parts = file.path.split('/');
        let current = root;
        
        parts.forEach((part, idx) => {
            const isLast = idx === parts.length - 1;
            let child = current.children?.find(c => c.name === part);
            
            if (!child) {
                child = {
                    name: part,
                    type: isLast ? (file.type || 'file') : 'folder',
                    children: isLast ? undefined : [],
                    size: isLast ? file.size : undefined
                };
                if (!current.children) current.children = [];
                current.children.push(child);
            }
            
            current = child;
        });
    });
    
    // Sort: folders first, then files, alphabetically
    const sortChildren = (node) => {
        if (node.children) {
            node.children.sort((a, b) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
            node.children.forEach(sortChildren);
        }
    };
    sortChildren(root);
    
    return root;
}

export default function FileTree({ files }) {
    const tree = useMemo(() => buildTree(files), [files]);

    if (!files || files.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                No files to display
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 max-h-96 overflow-y-auto">
            {tree.children?.map((node, idx) => (
                <TreeNode key={idx} node={node} />
            ))}
        </div>
    );
}