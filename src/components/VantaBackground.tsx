import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import FOG from 'vanta/dist/vanta.fog.min';

interface VantaBackgroundProps {
    children?: React.ReactNode;
    className?: string;
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ children, className }) => {
    const [vantaEffect, setVantaEffect] = useState<any>(null);
    const myRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!vantaEffect && myRef.current) {
            try {
                setVantaEffect(
                    FOG({
                        el: myRef.current,
                        THREE: THREE,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        highlightColor: 0x60a5fa, // Soft Blue highlight
                        midtoneColor: 0x2563eb,   // Electric Blue
                        lowlightColor: 0xffffff,  // White/Off-white base
                        baseColor: 0xf0f9ff,      // Sky White base
                        blurFactor: 0.6,
                        speed: 1.2,
                        zoom: 0.8
                    })
                );
            } catch (error) {
                console.error("Failed to initialize Vanta effect:", error);
            }
        }
        return () => {
            if (vantaEffect) vantaEffect.destroy();
        };
    }, [vantaEffect]);

    return (
        <div ref={myRef} className={`relative w-full h-full overflow-hidden ${className}`}>
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};

export default VantaBackground;
