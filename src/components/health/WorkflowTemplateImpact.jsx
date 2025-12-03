import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Workflow,
    Zap,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    BarChart3,
    ArrowRight,
    Sparkles,
    Shield,
    Rocket,
    RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

const templateColors = {
    quick_fix: '#3b82f6',
    standard: '#22c55e',
    thorough: '#a855f7',
    full_deployment: '#f97316'
};

const templateLabels = {
    quick_fix: 'Quick Fix',
    standard: 'Standard',
    thorough: 'Thorough',
    full_deployment: 'Full Deploy'
};

function TemplateCard({ template, metrics, isSelected, onClick }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                isSelected
                    ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                    : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: templateColors[template] }}
                    />
                    <span className="font-medium text-white text-sm">{templateLabels[template]}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-slate-600">
                    {metrics.usageCount} runs
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <p className="text-[10px] text-slate-500">Success Rate</p>
                    <p className="text-sm font-medium text-green-400">{metrics.successRate}%</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500">Avg Time</p>
                    <p className="text-sm font-medium text-white">{metrics.avgTime}</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500">Velocity</p>
                    <p className="text-sm font-medium text-cyan-400">{metrics.velocity}/wk</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500">Stability</p>
                    <p className="text-sm font-medium text-purple-400">{metrics.stability}%</p>
                </div>
            </div>
        </motion.div>
    );
}

export default function WorkflowTemplateImpact() {
    const [selectedTemplate, setSelectedTemplate] = useState('standard');
    const [comparisonMode, setComparisonMode] = useState(false);
    const [compareWith, setCompareWith] = useState('thorough');

    // Template metrics data
    const templateMetrics = {
        quick_fix: {
            usageCount: 45,
            successRate: 92,
            avgTime: '1.2m',
            velocity: 12,
            stability: 78,
            bugsIntroduced: 2.1,
            rollbackRate: 8
        },
        standard: {
            usageCount: 128,
            successRate: 89,
            avgTime: '3.5m',
            velocity: 8,
            stability: 88,
            bugsIntroduced: 1.2,
            rollbackRate: 5
        },
        thorough: {
            usageCount: 67,
            successRate: 94,
            avgTime: '6.2m',
            velocity: 5,
            stability: 95,
            bugsIntroduced: 0.4,
            rollbackRate: 2
        },
        full_deployment: {
            usageCount: 34,
            successRate: 91,
            avgTime: '12.5m',
            velocity: 3,
            stability: 98,
            bugsIntroduced: 0.2,
            rollbackRate: 1
        }
    };

    // Radar chart data for selected template
    const radarData = [
        { metric: 'Speed', value: selectedTemplate === 'quick_fix' ? 95 : selectedTemplate === 'standard' ? 70 : selectedTemplate === 'thorough' ? 45 : 25 },
        { metric: 'Stability', value: templateMetrics[selectedTemplate].stability },
        { metric: 'Success', value: templateMetrics[selectedTemplate].successRate },
        { metric: 'Quality', value: 100 - templateMetrics[selectedTemplate].bugsIntroduced * 10 },
        { metric: 'Security', value: selectedTemplate === 'quick_fix' ? 60 : selectedTemplate === 'standard' ? 75 : selectedTemplate === 'thorough' ? 92 : 98 },
        { metric: 'Coverage', value: selectedTemplate === 'quick_fix' ? 55 : selectedTemplate === 'standard' ? 70 : selectedTemplate === 'thorough' ? 88 : 95 }
    ];

    // Comparison bar data
    const comparisonData = [
        { 
            metric: 'Success Rate', 
            [templateLabels[selectedTemplate]]: templateMetrics[selectedTemplate].successRate,
            [templateLabels[compareWith]]: templateMetrics[compareWith].successRate
        },
        { 
            metric: 'Stability', 
            [templateLabels[selectedTemplate]]: templateMetrics[selectedTemplate].stability,
            [templateLabels[compareWith]]: templateMetrics[compareWith].stability
        },
        { 
            metric: 'Velocity', 
            [templateLabels[selectedTemplate]]: templateMetrics[selectedTemplate].velocity * 8,
            [templateLabels[compareWith]]: templateMetrics[compareWith].velocity * 8
        },
        { 
            metric: 'Quality', 
            [templateLabels[selectedTemplate]]: 100 - templateMetrics[selectedTemplate].bugsIntroduced * 10,
            [templateLabels[compareWith]]: 100 - templateMetrics[compareWith].bugsIntroduced * 10
        }
    ];

    // Impact over time data
    const impactOverTime = Array.from({ length: 8 }, (_, i) => ({
        week: `W${i + 1}`,
        quick_fix: Math.floor(70 + Math.random() * 15),
        standard: Math.floor(80 + Math.random() * 10),
        thorough: Math.floor(88 + Math.random() * 8),
        full_deployment: Math.floor(92 + Math.random() * 6)
    }));

    return (
        <div className="p-5 rounded-xl border border-slate-700/50 bg-slate-900/80">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Workflow className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Workflow Template Impact</h3>
                        <p className="text-xs text-slate-500">Compare velocity & stability across templates</p>
                    </div>
                </div>
                <button
                    onClick={() => setComparisonMode(!comparisonMode)}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-xs transition-colors",
                        comparisonMode
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                    )}
                >
                    {comparisonMode ? 'Single View' : 'Compare'}
                </button>
            </div>

            {/* Template Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {Object.entries(templateMetrics).map(([key, metrics]) => (
                    <TemplateCard
                        key={key}
                        template={key}
                        metrics={metrics}
                        isSelected={selectedTemplate === key || (comparisonMode && compareWith === key)}
                        onClick={() => {
                            if (comparisonMode && selectedTemplate !== key) {
                                setCompareWith(key);
                            } else {
                                setSelectedTemplate(key);
                            }
                        }}
                    />
                ))}
            </div>

            {/* Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Radar or Comparison Chart */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <h4 className="text-sm text-slate-400 mb-3">
                        {comparisonMode 
                            ? `${templateLabels[selectedTemplate]} vs ${templateLabels[compareWith]}`
                            : `${templateLabels[selectedTemplate]} Profile`
                        }
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                        {comparisonMode ? (
                            <BarChart data={comparisonData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#64748b" fontSize={10} />
                                <YAxis dataKey="metric" type="category" stroke="#64748b" fontSize={10} width={70} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }}
                                />
                                <Bar 
                                    dataKey={templateLabels[selectedTemplate]} 
                                    fill={templateColors[selectedTemplate]} 
                                    radius={[0, 4, 4, 0]}
                                />
                                <Bar 
                                    dataKey={templateLabels[compareWith]} 
                                    fill={templateColors[compareWith]} 
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        ) : (
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={10} />
                                <PolarRadiusAxis stroke="#334155" fontSize={10} />
                                <Radar
                                    name={templateLabels[selectedTemplate]}
                                    dataKey="value"
                                    stroke={templateColors[selectedTemplate]}
                                    fill={templateColors[selectedTemplate]}
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Stability Trend */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <h4 className="text-sm text-slate-400 mb-3">Stability Over Time (All Templates)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={impactOverTime}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="week" stroke="#64748b" fontSize={10} />
                            <YAxis domain={[60, 100]} stroke="#64748b" fontSize={10} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }}
                            />
                            <Bar dataKey="quick_fix" fill={templateColors.quick_fix} name="Quick Fix" />
                            <Bar dataKey="standard" fill={templateColors.standard} name="Standard" />
                            <Bar dataKey="thorough" fill={templateColors.thorough} name="Thorough" />
                            <Bar dataKey="full_deployment" fill={templateColors.full_deployment} name="Full Deploy" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recommendation */}
            <div className="mt-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5" />
                    <div>
                        <p className="text-sm text-indigo-400 font-medium">Template Recommendation</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Based on your project's 89% success rate and moderate complexity, 
                            <span className="text-indigo-400 font-medium"> Standard Implementation</span> offers 
                            the best balance of velocity (8 tasks/week) and stability (88%). Consider 
                            <span className="text-indigo-400 font-medium"> Thorough Review</span> for security-critical changes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}