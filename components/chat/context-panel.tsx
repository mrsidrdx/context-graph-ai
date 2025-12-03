'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Folder, 
  Tag, 
  Lightbulb, 
  X, 
  User,
  ArrowRight,
  Sparkles,
  Network,
  Zap,
  ChevronDown,
  ChevronUp,
  Bot,
  BarChart3,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Target,
  Link as LinkIcon,
} from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import type { GraphContext, GraphNode, GraphRelationship } from '@/lib/types';

interface ContextPanelProps {
  readonly context: GraphContext | null;
}

interface NodeDetailModalProps {
  node: GraphNode;
  onClose: () => void;
}

const nodeIcons: Record<string, React.ReactNode> = {
  User: <User className="h-3.5 w-3.5" />,
  Document: <FileText className="h-3.5 w-3.5" />,
  Project: <Folder className="h-3.5 w-3.5" />,
  Topic: <Tag className="h-3.5 w-3.5" />,
  Concept: <Lightbulb className="h-3.5 w-3.5" />,
};

const nodeColorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  User: { 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30', 
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  Document: { 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/30', 
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20'
  },
  Project: { 
    bg: 'bg-pink-500/10', 
    border: 'border-pink-500/30', 
    text: 'text-pink-400',
    glow: 'shadow-pink-500/20'
  },
  Topic: { 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30', 
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20'
  },
  Concept: { 
    bg: 'bg-cyan-500/10', 
    border: 'border-cyan-500/30', 
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20'
  },
};

function NodeDetailModal({ node, onClose }: NodeDetailModalProps) {
  const formatProperty = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'object' && value !== null) {
      // Type guard for Neo4j datetime object
      if ('year' in value && 'month' in value) {
        const dateObj = value as { year: { low: number }; month: { low: number }; day?: { low: number } };
        return new Date(dateObj.year.low, dateObj.month.low - 1, dateObj.day?.low || 1).toLocaleDateString();
      }
      return JSON.stringify(value, null, 2);
    }
    
    if (typeof value === 'string' && value.length > 100) {
      return value.slice(0, 100) + '...';
    }
    
    return String(value);
  };

  const properties = node.properties || {};
  const colors = nodeColorClasses[node.type] || nodeColorClasses.Topic;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', colors.bg)}>
                  <span className={colors.text}>{nodeIcons[node.type]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {String(properties.name || properties.title || node.id)}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                    {node.type}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-96">
            <div className="p-6 space-y-4">
              {Object.entries(properties).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 font-mono text-xs">
                    {formatProperty(key, value)}
                  </div>
                </div>
              ))}
              
              {node.relevanceScore && (
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Relevance Score
                    </span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {Math.round(node.relevanceScore * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className={cn('h-full rounded-full transition-all duration-500', colors.text.replace('text-', 'bg-'))}
                      style={{ width: `${node.relevanceScore * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ContextPanel({ context }: ContextPanelProps) {
  const { toggleContextPanel, enrichedContext } = useChatStore();
  const [showAllRelevant, setShowAllRelevant] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    documents: true,
    projects: true,
    topics: true,
    concepts: true,
    relationships: false,
  });

  const groupedNodes = useMemo(() => {
    if (!context) return {};
    const groups: Record<string, GraphNode[]> = {
      Document: [],
      Project: [],
      Topic: [],
      Concept: [],
    };

    for (const node of context.nodes) {
      if (node.type !== 'User' && groups[node.type]) {
        groups[node.type].push(node);
      }
    }

    return groups;
  }, [context]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const relevantNodesToShow = showAllRelevant 
    ? (enrichedContext?.relevantNodes || [])
    : (enrichedContext?.relevantNodes || []).slice(0, 5);

  const insightsToShow = showAllInsights
    ? (enrichedContext?.keyInsights || [])
    : (enrichedContext?.keyInsights || []).slice(0, 3);

  const missingToShow = showAllMissing
    ? (enrichedContext?.missingInformation || [])
    : (enrichedContext?.missingInformation || []).slice(0, 2);

  if (!context) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 360, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card border-l border-neutral-200/30 dark:border-neutral-700/30 overflow-hidden md:relative absolute inset-y-0 right-0 z-40 md:z-auto"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200/30 dark:border-neutral-700/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-accent-500/20">
                <Network className="h-4 w-4 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-100 text-sm">
                  Context Graph
                </h3>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleContextPanel}
              className="h-8 w-8 p-0 hover:bg-neutral-700/50 transition-all-200 text-neutral-400 hover:text-neutral-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Bot className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No context available yet
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                Send a message to see the knowledge graph
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 360, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="border-l border-neutral-800/50 bg-neutral-900/40 backdrop-blur-xl overflow-hidden"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-accent-500/20">
                <Network className="h-4 w-4 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-100 text-sm">
                  Context Graph
                </h3>
                {context.statistics && (
                  <p className="text-xs text-neutral-400">
                    {context.statistics.totalNodes} nodes • {context.statistics.totalRelationships} connections
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleContextPanel}
              className="h-8 w-8 p-0 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-all-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* Empty State */}
              {!context || (context.nodes && context.nodes.length === 0) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="p-3 rounded-lg bg-neutral-800/30 mb-3">
                    <Network className="h-6 w-6 text-neutral-500" />
                  </div>
                  <p className="text-sm font-medium text-neutral-300 mb-1">No context yet</p>
                  <p className="text-xs text-neutral-500">
                    Ask a question to build your context graph
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Statistics Overview */}
                  {context.statistics && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4 border border-neutral-800/50 bg-neutral-800/20 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-300">Overview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-neutral-800/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-neutral-100">
                        {context.statistics.totalNodes}
                      </div>
                      <div className="text-xs text-neutral-400">Total Nodes</div>
                    </div>
                    <div className="bg-neutral-800/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-neutral-100">
                        {context.statistics.totalRelationships}
                      </div>
                      <div className="text-xs text-neutral-400">Connections</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-700/50">
                    <div className="text-xs text-neutral-400 mb-2">Node Types</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(context.statistics.nodeTypes).map(([type, count]) => (
                        <span key={type} className="px-2 py-1 bg-neutral-700/50 rounded text-xs text-neutral-300">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Key Insights from Enriched Context */}
              {enrichedContext?.keyInsights && enrichedContext.keyInsights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3 border border-accent-500/20 bg-accent-500/5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent-400" />
                      <span className="text-xs font-medium text-accent-400">Key Insights</span>
                    </div>
                    {enrichedContext.keyInsights.length > 3 && (
                      <button
                        onClick={() => setShowAllInsights(!showAllInsights)}
                        className="text-[10px] text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
                      >
                        {showAllInsights ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            See more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {insightsToShow.map((insight, i) => (
                      <li key={`insight-${i}`} className="text-xs text-neutral-300 flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-accent-400 mt-0.5 shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Relevant Nodes from Enriched Context */}
              {enrichedContext?.relevantNodes && enrichedContext.relevantNodes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      Most Relevant ({enrichedContext.relevantNodes.length})
                    </h4>
                    {enrichedContext.relevantNodes.length > 5 && (
                      <button
                        onClick={() => setShowAllRelevant(!showAllRelevant)}
                        className="text-[10px] text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
                      >
                        {showAllRelevant ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            See more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {relevantNodesToShow.map((node, index) => {
                      const colors = nodeColorClasses[node.type] || nodeColorClasses.Topic;
                      return (
                        <motion.div
                          key={`${node.id}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            'rounded-lg p-2.5 border transition-all-200 hover:shadow-lg cursor-pointer',
                            colors.bg,
                            colors.border,
                            `hover:${colors.glow}`
                          )}
                          onClick={() => setSelectedNode(node)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={colors.text}>{nodeIcons[node.type]}</span>
                              <span className="text-xs font-medium text-neutral-100 truncate max-w-[120px]">
                                {node.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div 
                                  className={cn('h-full rounded-full transition-all duration-500', colors.text.replace('text-', 'bg-'))}
                                  style={{ width: `${(node.relevanceScore || 0) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-neutral-500">{Math.round((node.relevanceScore || 0) * 100)}%</span>
                            </div>
                          </div>
                          {node.reason && (
                            <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                              {node.reason}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grouped Nodes */}
              {Object.entries(groupedNodes).map(([type, nodes]) => {
                if (nodes.length === 0) return null;
                const colors = nodeColorClasses[type] || nodeColorClasses.Topic;
                const isExpanded = expandedSections[type.toLowerCase()];

                return (
                  <div key={type}>
                    <button
                      onClick={() => toggleSection(type.toLowerCase())}
                      className="flex items-center justify-between w-full mb-2"
                    >
                      <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                        <span className={colors.text}>{nodeIcons[type]}</span>
                        {type}s ({nodes.length})
                      </h4>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3 text-neutral-400" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-neutral-400" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1.5 overflow-hidden"
                        >
                          {nodes.slice(0, 6).map((node) => {
                            const name = String(node.properties.name || '');
                            const title = String(node.properties.title || '');
                            const description = String(node.properties.description || '');
                            const content = String(node.properties.content || '');
                            const displayName = name || title || node.id;

                            return (
                              <motion.div
                                key={node.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                  'rounded-lg p-2.5 border transition-all-200 cursor-pointer',
                                  'hover:scale-[1.02] hover:shadow-md',
                                  colors.bg,
                                  colors.border
                                )}
                                onClick={() => setSelectedNode(node)}
                              >
                                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate">
                                  {displayName}
                                </p>
                                {(description || content) && (
                                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                                    {description || content.slice(0, 80)}
                                  </p>
                                )}
                                {typeof node.properties.created_at === 'string' && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="h-2.5 w-2.5 text-neutral-400" />
                                    <span className="text-[9px] text-neutral-400">
                                      {new Date(node.properties.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                          {nodes.length > 6 && (
                            <p className="text-center text-[10px] text-neutral-400 py-1">
                              +{nodes.length - 6} more {type.toLowerCase()}s
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Relationships */}
              {context.relationships.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('relationships')}
                    className="flex items-center justify-between w-full mb-2"
                  >
                    <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-2">
                      <LinkIcon className="h-3 w-3" />
                      Relationships ({context.relationships.length})
                    </h4>
                    {expandedSections.relationships ? (
                      <ChevronUp className="h-3 w-3 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-neutral-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSections.relationships && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-1 overflow-hidden"
                      >
                        {context.relationships.slice(0, 10).map((rel, i) => (
                          <div 
                            key={`rel-${rel.from}-${rel.to}-${i}`} 
                            className="flex items-center gap-1.5 text-[10px] p-2 rounded-md bg-neutral-100/50 dark:bg-neutral-800/50 transition-all-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50"
                          >
                            <span className="text-neutral-600 dark:text-neutral-300 truncate max-w-[70px]">
                              {rel.from.slice(0, 10)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-mono shrink-0">
                              {rel.type}
                            </span>
                            <span className="text-neutral-600 dark:text-neutral-300 truncate max-w-[70px]">
                              {rel.to.slice(0, 10)}
                            </span>
                          </div>
                        ))}
                        {context.relationships.length > 10 && (
                          <p className="text-center text-[10px] text-neutral-400 py-1">
                            +{context.relationships.length - 10} more relationships
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Missing Information */}
              {enrichedContext?.missingInformation && enrichedContext.missingInformation.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400">Could Help</span>
                    </div>
                    {enrichedContext.missingInformation.length > 2 && (
                      <button
                        onClick={() => setShowAllMissing(!showAllMissing)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        {showAllMissing ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            See more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {missingToShow.map((info, i) => (
                      <li key={`missing-${i}`} className="text-[10px] text-neutral-300 flex items-start gap-2">
                        <Info className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                        <span>{info}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div>

      {/* Node Detail Modal */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailModal 
            node={selectedNode} 
            onClose={() => setSelectedNode(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
