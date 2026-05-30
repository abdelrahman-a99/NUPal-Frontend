import { Code, Brain, BarChart, Cloud, Shield, LucideIcon } from 'lucide-react';
import Button from '../ui/Button';

interface CareerCategoryBoxProps {
    id: string;
    title: string;
    iconName: string;
    isSelected: boolean;
    onClick: () => void;
}

const iconMap: { [key: string]: LucideIcon } = {
    'Code': Code,
    'Brain': Brain,
    'BarChart': BarChart,
    'Cloud': Cloud,
    'Shield': Shield
};

export function CareerCategoryBox({ id, title, iconName, isSelected, onClick }: CareerCategoryBoxProps) {
    const Icon = iconMap[iconName] || Code;

    return (
        <Button
            variant="none"
            size="none"
            onClick={onClick}
            className={`group relative w-full h-full px-4 md:px-6 flex items-center justify-center gap-2 py-4 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800
                ${isSelected ? 'bg-white dark:bg-slate-900' : 'bg-white dark:bg-slate-900'}
            `}
        >
            <Icon className={`h-8 w-4 transition-colors ${isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600'
                }`} />

            <span className={`font-medium text-sm transition-colors ${isSelected ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700'
                }`}>
                {title}
            </span>
            {/* Active Bottom Border Indicator */}
            {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
        </Button>
    );
}
