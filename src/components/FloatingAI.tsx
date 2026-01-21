import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIAssistant from './AIAssistant';

interface FloatingAIProps {
    analysisContext?: any;
}

const FloatingAI: React.FC<FloatingAIProps> = ({ analysisContext }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        />

                        {/* Chat Panel */}
                        <motion.div
                            initial={{ x: '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-100%', opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-full sm:w-[400px] z-[60] flex flex-col shadow-2xl bg-white/80 backdrop-blur-xl border-r border-white/50"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/50">
                                <h3 className="font-heading font-bold text-lg text-foreground">Tapak AI Assistant</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <AIAssistant analysisContext={analysisContext} onClose={() => setIsOpen(false)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center text-white hover:shadow-xl transition-shadow"
            >
                <MessageSquare className="w-7 h-7" />
            </motion.button>
        </>
    );
};

export default FloatingAI;
