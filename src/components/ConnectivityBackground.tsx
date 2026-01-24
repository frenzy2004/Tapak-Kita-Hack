import React from 'react';
import { motion } from 'framer-motion';

const ConnectivityBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
    // SVG ViewBox dimensions
    const width = 1000;
    const height = 600;

    // Simplified paths for SE Asia regions
    // These are stylized approximations for aesthetic purposes
    const mapPaths = {
        peninsularMalaysia: "M200,220 L220,230 L230,280 L210,290 L190,260 Z",
        borneo: "M300,200 L400,190 L420,230 L400,280 L320,290 L290,250 Z",
        sumatra: "M100,250 L180,290 L200,350 L150,380 L80,320 Z",
        java: "M220,380 L450,390 L440,420 L210,410 Z",
        sulawesi: "M480,280 L520,280 L500,350 L540,360 L510,400 L470,350 Z",
        philippines: "M500,100 L550,120 L530,250 L480,230 Z M540,260 L580,270 L560,320 L530,300 Z", // Luzon + Mindanao approx
        singapore: "M212,292 L225,292 L225,300 L212,300 Z", // Small dot
        indochina: "M150,100 L250,120 L240,200 L180,210 L100,150 Z" // Thai/Vietnam area
    };

    // Hub coordinates for arcs
    const hubs = {
        kl: { x: 205, y: 260 },
        sg: { x: 218, y: 295 },
        jakarta: { x: 260, y: 395 },
        manila: { x: 515, y: 150 },
        bangkok: { x: 180, y: 160 },
        kuching: { x: 310, y: 260 },
        kk: { x: 400, y: 200 }
    };

    // Connectivity lines to animate
    const connections = [
        { from: hubs.kl, to: hubs.sg },
        { from: hubs.sg, to: hubs.jakarta },
        { from: hubs.kl, to: hubs.kuching },
        { from: hubs.kuching, to: hubs.kk },
        { from: hubs.kk, to: hubs.manila },
        { from: hubs.kl, to: hubs.bangkok },
        { from: hubs.sg, to: hubs.manila }, // Long arc
        { from: hubs.jakarta, to: hubs.kuching }
    ];

    // Generate curved path for arcs
    const generateArc = (start: { x: number, y: number }, end: { x: number, y: number }) => {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2 - 20; // Curve upward/inward
        return `M${start.x},${start.y} Q${midX},${midY} ${end.x},${end.y}`;
    };

    return (
        <div className={`fixed inset-0 z-0 bg-white pointer-events-none overflow-hidden ${className}`}>
            {/* Background Gradient - Removed for clean white look */}

            {/* Grid Overlay for Texture - Made very subtle */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="absolute inset-0 w-full h-full opacity-100" // Fully opaque SVG to ensure dots are visible
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <pattern id="dotPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.5" className="fill-slate-900" />
                    </pattern>
                    <radialGradient id="hubGlow" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor="#64748b" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Map Group - Removed strong drop shadow */}
                <g>
                    {/* Render Map Shapes with Dot Pattern */}
                    {Object.values(mapPaths).map((d, i) => (
                        <path key={i} d={d} fill="url(#dotPattern)" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />
                    ))}
                </g>

                {/* Animated Arcs */}
                {connections.map((conn, i) => (
                    <g key={i}>
                        {/* Base Line */}
                        <path
                            d={generateArc(conn.from, conn.to)}
                            fill="none"
                            stroke="rgba(100,116,139,0.1)"
                            strokeWidth="1.5"
                        />
                        {/* Animated Light Packet */}
                        <motion.path
                            d={generateArc(conn.from, conn.to)}
                            fill="none"
                            stroke="#64748b" // Slate-500
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: [0, 0.4, 0],
                                opacity: [0, 1, 0],
                                pathOffset: [0, 1, 0] // Move the segment along the path
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2, // Randomize speeds
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * 2
                            }}
                            style={{ strokeLinecap: "round" }}
                        />
                    </g>
                ))}

                {/* Hub Points */}
                {Object.values(hubs).map((hub, i) => (
                    <g key={i} transform={`translate(${hub.x}, ${hub.y})`}>
                        <circle r="3" fill="#475569" /> {/* Slate-600 */}
                        <motion.circle
                            r="6"
                            fill="url(#hubGlow)"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </g>
                ))}
            </svg>

            {/* Vignette Overlay - Removed or inverted to very subtle if needed, keeping clean for now */}
        </div>
    );
};

export default ConnectivityBackground;
