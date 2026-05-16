
interface SkeletonProps {
    className?: string;
    variant?: 'rect' | 'circle' | 'text';
}

export default function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';
    const variantClasses = {
        rect: 'rounded-md',
        circle: 'rounded-full',
        text: 'rounded h-4 w-full',
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            aria-hidden="true"
        />
    );
}
