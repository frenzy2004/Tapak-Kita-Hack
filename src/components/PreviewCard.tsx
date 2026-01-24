import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface PreviewCardProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
    backgroundImage?: string;
}

const PreviewCard: React.FC<PreviewCardProps> = ({
    title,
    subtitle,
    icon: Icon,
    onClick,
    className,
    children,
    backgroundImage
}) => {
    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-[40px] border border-white/60 shadow-clayCard transition-all duration-300 hover:shadow-clayCardHover hover:scale-[1.01] flex flex-col h-full",
                // Claymorphism styles (High Transparency)
                "bg-white/20 backdrop-blur-md",
                className
            )}
            onClick={onClick}
        >
            {/* Background decoration */}
            {backgroundImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-10 transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />
            )}

            {/* Header */}
            <div className="relative z-10 p-6 flex flex-row items-start justify-between bg-gradient-to-b from-white/90 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary backdrop-blur-sm">
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-heading font-bold text-lg text-foreground leading-tight">{title}</h3>
                        {subtitle && <p className="text-sm text-muted-foreground font-body">{subtitle}</p>}
                    </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 rounded-full shadow-sm backdrop-blur-sm text-foreground-muted hover:text-primary">
                    <Maximize2 className="w-4 h-4" />
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 flex-1 p-6 pt-0 overflow-hidden pointer-events-none select-none">
                {/* We use pointer-events-none to prevent interaction with the preview content, ensuring the click triggers the card expand */}
                {children}
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300 pointer-events-none" />
        </motion.div>
    );
};

export default PreviewCard;
