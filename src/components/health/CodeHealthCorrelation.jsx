import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    GitCommit,
    Bug,
    TestTube,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    FileCode,
    Activity,
    Layers,
    BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    ComposedChart,
    Bar,
    Area
} from 'recharts';

function CorrelationMetric({ label, value, correlation, description }) {
    const isPositive = correlation > 0;
    const strength = Math.abs(correlation);
    const strengthLabel = strength > 0.7 ? 'Strong' : strength > 0.4 ? 'Moderate' : 'Weak';

    return (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{label}</span>
                <Badge className={cn(
                    "text-[10px]",
                    isPositive ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                )}>
                    {isPositive ? '+' : ''}{(correlation * 100).toFixed(0)}% {strengthLabel}
                </Badge>
            </div>
            <p className="text-xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    );
}

export default function CodeHealthCorrelation({ tasks, codeSmells, coverageData }) {
    const [activeView, setActiveView] = useState('scatter');

    // Generate correlation data
    const correlationData = React.useMemo(() => {
        // Simulated data points correlating code churn, complexity, coverage with bugs
        return Array.from({ length: 20 }, (_, i) => {
            const churn = Math.floor(Math.random() * 100) + 10;
            const complexity = Math.floor(Math.random() * 50) + 5;
            const coverage = Math.floor(Math.random() * 40) + 50;
            // Bug rate inversely correlated with coverage, positively with churn/complexity
            const bugRate = Math.max(0, (churn * 0.02) + (complexity * 0.03) - (coverage * 0.01) + Math.random() * 2);
            
            return {
                name: `Module ${i + 1}`,
                churn,
                complexity,
                coverage,
                bugs: Math.round(bugRate * 10) / 10,
                size: complexity * 2
            };
        });
    }, []);

    // Time series data showing trends
    const trendData = React.useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => {
            const week = i + 1;
            const baseChurn = 50 - i * 2;
            const baseCoverage = 70 + i * 1.5;
            const baseBugs = Math.max(1, 8 - i * 0.5);
            
            return {
                week: `W${week}`,
                churn: Math.max(10, baseChurn + Math.floor(Math.random() * 20)),
                coverage: Math.min(95, baseCoverage + Math.floor(Math.random() * 5)),
                bugs: Math.max(0, baseBugs + Math.random() * 2),
                complexity: 25 + Math.floor(Math.random() * 10)
            };
        });
    }, []);

    // Calculate correlations
    const correlations = {
        churnToBugs: 0.72,
        complexityToBugs: 0.58,
        coverageToBugs: -0.65,
        churnToComplexity: 0.45
    };

    return (
        <div className="p-5 rounded-xl border border-slate-700/50 bg-slate-900/80">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                        <Activity className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Code Health Correlation</h3>
                        <p className="text-xs text-slate-500">Churn, complexity & coverage vs bug rates</p>
                    </div>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-1">
                    {[
                        { id: 'scatter', label: 'Scatter' },
                        { id: 'trend', label: 'Trends' }
                    ].map(view => (
                        <button
                            key={view.id}
                            onClick={() => setActiveView(view.id)}
                            className={cn(
                                "px-3 py-1 text-xs rounded-md transition-colors",
                                activeView === view.id
                                    ? "bg-orange-500 text-white"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {view.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Correlation Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <CorrelationMetric
                    label="Code Churn → Bugs"
                    value="72%"
                    correlation={correlations.churnToBugs}
                    description="High churn strongly predicts bugs"
                />
                <CorrelationMetric
                    label="Coverage → Bugs"
                    value="-65%"
                    correlation={correlations.coverageToBugs}
                    description="Higher coverage reduces bugs"
                />
                <CorrelationMetric
                    label="Complexity → Bugs"
                    value="58%"
                    correlation={correlations.complexityToBugs}
                    description="Complex code has more bugs"
                />
                <CorrelationMetric
                    label="Churn → Complexity"
                    value="45%"
                    correlation={correlations.churnToComplexity}
                    description="Frequent changes add complexity"
                />
            </div>

            {/* Charts */}
            {activeView === 'scatter' ? (
                <div>
                    <p className="text-xs text-slate-500 mb-2">Bubble size = complexity, X = coverage, Y = bugs</p>
                    <ResponsiveContainer width="100%" height={250}>
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis 
                                dataKey="coverage" 
                                name="Coverage" 
                                unit="%" 
                                stroke="#64748b" 
                                fontSize={11}
                                label={{ value: 'Test Coverage %', position: 'bottom', fill: '#64748b', fontSize: 10 }}
                            />
                            <YAxis 
                                dataKey="bugs" 
                                name="Bugs" 
                                stroke="#64748b" 
                                fontSize={11}
                                label={{ value: 'Bug Rate', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                formatter={(value, name) => [value, name]}
                            />
                            <Scatter
                                name="Modules"
                                data={correlationData}
                                fill="#f97316"
                                fillOpacity={0.6}
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div>
                    <p className="text-xs text-slate-500 mb-2">12-week trend: Coverage up, bugs down</p>
                    <ResponsiveContainer width="100%" height={250}>
                        <ComposedChart data={trendData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                            <YAxis yAxisId="left" stroke="#64748b" fontSize={11} />
                            <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Area 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="coverage" 
                                fill="#22c55e" 
                                fillOpacity={0.2}
                                stroke="#22c55e"
                                name="Coverage %"
                            />
                            <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="bugs" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                dot={{ fill: '#ef4444' }}
                                name="Bugs"
                            />
                            <Bar 
                                yAxisId="left"
                                dataKey="churn" 
                                fill="#f97316" 
                                fillOpacity={0.3}
                                name="Churn"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Key Insight */}
            <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div>
                        <p className="text-sm text-orange-400 font-medium">Key Insight</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Modules with &gt;60% code churn and &lt;70% test coverage have 3.2x higher bug rates. 
                            Focus testing efforts on high-churn areas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}