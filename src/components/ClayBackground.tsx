

export const ClayBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            {/* Blob 1: Top Left - Violet */}
            <div
                className="absolute -top-[10%] -left-[10%] w-[70vh] h-[70vh] bg-primary/10 rounded-full blur-3xl animate-clay-float"
            />

            {/* Blob 2: Bottom Right - Pink */}
            <div
                className="absolute top-[40%] -right-[10%] w-[60vh] h-[60vh] bg-secondary/10 rounded-full blur-3xl animate-clay-float-delayed"
            />

            {/* Blob 3: Bottom Left - Sky Blue */}
            <div
                className="absolute -bottom-[20%] left-[20%] w-[50vh] h-[50vh] bg-tertiary/10 rounded-full blur-3xl animate-clay-float-slow"
            />
        </div>
    );
};
