import { Fingerprint } from "lucide-react";
import { useEffect } from "react";

export default function PageLoader() {
    useEffect(() => {
        // Add particle animation to background
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
        script.async = true;
        document.body.appendChild(script);
        
        let particlesInitialized = false;
        
        script.onload = () => {
            if (window.particlesJS) {
                window.particlesJS('pageloader-particles-js', {
                    particles: {
                        number: { value: 60, density: { enable: true, value_area: 800 } },
                        color: { value: '#15803d' },
                        shape: { type: 'circle' },
                        opacity: { value: 0.6, random: true, anim: { enable: true, speed: 1, opacity_min: 0.4, sync: false } },
                        size: { value: 5, random: true, anim: { enable: true, speed: 2, size_min: 2, sync: false } },
                        line_linked: { enable: true, distance: 150, color: '#15803d', opacity: 0.5, width: 1.5 },
                        move: { enable: true, speed: 2, direction: 'none', random: true, straight: false, out_mode: 'out' }
                    },
                    interactivity: {
                        detect_on: 'canvas',
                        events: {
                            onhover: { enable: true, mode: 'grab' },
                            onclick: { enable: true, mode: 'push' },
                            resize: true
                        },
                        modes: {
                            grab: { distance: 140, line_linked: { opacity: 0.5 } },
                            push: { particles_nb: 3 }
                        }
                    },
                    retina_detect: true
                });
                particlesInitialized = true;
            }
        };
        
        return () => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            
            // Destroy particles instance if it was initialized
            if (particlesInitialized && window.pJSDom && window.pJSDom.length > 0) {
                try {
                    window.pJSDom[0].pJS.fn.vendors.destroypJS();
                    window.pJSDom = [];
                } catch (e) {
                    console.error('Error cleaning up particles:', e);
                }
            }
        };
    }, []);
    
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900 to-green-800 flex items-center justify-center z-50 animate-fade-in">
            {/* Particles Background */}
            <div id="pageloader-particles-js" className="absolute inset-0 z-0"></div>
            
            <div className="relative z-10">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full animate-glow-pulse bg-green-500/20"></div>
                
                {/* Inner glow ring */}
                <div className="absolute inset-2 rounded-full animate-glow-pulse delay-150 bg-green-400/30"></div>
                
                {/* Icon container */}
                <div className="relative bg-green-800/80 p-6 rounded-full shadow-lg backdrop-blur-sm animate-slide-up">
                    <Fingerprint className="w-12 h-12 text-green-400 animate-glow-pulse" />
                </div>

                {/* Loading text */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap animate-slide-up delay-100">
                    <span className="text-green-400 text-sm font-medium tracking-wider">
                        Loading...
                    </span>
                </div>
            </div>
        </div>
    );
}
