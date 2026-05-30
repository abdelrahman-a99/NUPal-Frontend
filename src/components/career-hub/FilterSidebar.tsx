'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from '../ui/Button';

export interface FilterState {
    employmentTypes: string[];
    workTypes: string[];
    companies: string[];
    categories: string[];
}

interface FilterSidebarProps {
    onFilterChange: Dispatch<SetStateAction<FilterState>>;
    topCompanies?: string[];
    initialFilters?: FilterState;
    selectedFilters?: FilterState; // Controlled prop
}

export function FilterSidebar({
    onFilterChange,
    topCompanies = [],
    initialFilters,
    selectedFilters: controlledFilters
}: FilterSidebarProps) {
    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
        'Work Type': true,
        'Type of Employment': true,
        'Categories': false,
        'Top Companies': true,
    });

    // Internal state for uncontrolled mode
    const [internalFilters, setInternalFilters] = useState<FilterState>(initialFilters || {
        employmentTypes: [],
        workTypes: [],
        companies: [],
        categories: [],
    });

    // Determine which filters to use
    const activeFilters = controlledFilters || internalFilters;

    // Call onFilterChange only if not controlled (or we can call it always if prop provided)
    useEffect(() => {
        if (!controlledFilters) {
            onFilterChange(internalFilters);
        }
    }, [internalFilters, onFilterChange, controlledFilters]);

    const toggleSection = (title: string) => {
        setOpenSections(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleCheckboxChange = (filterType: 'employmentTypes' | 'categories' | 'companies' | 'workTypes', value: string, checked: boolean) => {
        const updateFn = (prev: FilterState) => {
            const newFilters = { ...prev };
            // Ensure array exists (safety check)
            const currentArray = newFilters[filterType] || [];

            if (checked) {
                // Add if not already present
                if (!currentArray.includes(value)) {
                    newFilters[filterType] = [...currentArray, value];
                }
            } else {
                // Remove
                newFilters[filterType] = currentArray.filter(v => v !== value);
            }
            return newFilters;
        };

        if (controlledFilters) {
            // Pass the FUNCTION to the parent's setter
            // @ts-ignore - Typescript might complain about signature mismatch if strict, but SetStateAction usually allows it
            onFilterChange((prev) => updateFn(prev));
        } else {
            setInternalFilters(prev => updateFn(prev));
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Work Type Filter */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <Button
                    variant="none"
                    size="none"
                    onClick={() => toggleSection('Work Type')}
                    className="flex w-full items-center justify-between text-left font-semibold text-slate-900 dark:text-slate-100"
                >
                    Work Type
                    <ChevronDown className={`h-5 w-5 transition-transform ${openSections['Work Type'] ? 'rotate-180' : ''}`} />
                </Button>
                {openSections['Work Type'] && (
                    <div className="mt-3 space-y-2">
                        {['on-site', 'Remote', 'Hybrid'].map((option) => (
                            <label key={option} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.workTypes.includes(option.toLowerCase())}
                                    onChange={(e) => handleCheckboxChange('workTypes', option.toLowerCase(), e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-400 focus:ring-blue-400"
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Employment Type Filter */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <Button
                    variant="none"
                    size="none"
                    onClick={() => toggleSection('Type of Employment')}
                    className="flex w-full items-center justify-between text-left font-semibold text-slate-900 dark:text-slate-100"
                >
                    Employment Type
                    <ChevronDown className={`h-5 w-5 transition-transform ${openSections['Type of Employment'] ? 'rotate-180' : ''}`} />
                </Button>
                {openSections['Type of Employment'] && (
                    <div className="mt-3 space-y-2">
                        {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map((option) => (
                            <label key={option} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.employmentTypes.includes(option)}
                                    onChange={(e) => handleCheckboxChange('employmentTypes', option, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-400 focus:ring-blue-400"
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Top Companies Filter */}
            {topCompanies.length > 0 && (
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                    <Button
                        variant="none"
                        size="none"
                        onClick={() => toggleSection('Top Companies')}
                        className="flex w-full items-center justify-between text-left font-semibold text-slate-900 dark:text-slate-100"
                    >
                        Top Companies
                        <ChevronDown className={`h-5 w-5 transition-transform ${openSections['Top Companies'] ? 'rotate-180' : ''}`} />
                    </Button>
                    {openSections['Top Companies'] && (
                        <div className="mt-3 space-y-2">
                            {topCompanies.map((company) => (
                                <label key={company} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activeFilters.companies.includes(company)}
                                        onChange={(e) => handleCheckboxChange('companies', company, e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-400 focus:ring-blue-400"
                                    />
                                    {company}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Categories Filter */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <Button
                    variant="none"
                    size="none"
                    onClick={() => toggleSection('Categories')}
                    className="flex w-full items-center justify-between text-left font-semibold text-slate-900 dark:text-slate-100"
                >
                    Categories
                    <ChevronDown className={`h-5 w-5 transition-transform ${openSections['Categories'] ? 'rotate-180' : ''}`} />
                </Button>
                {openSections['Categories'] && (
                    <div className="mt-3 space-y-2">
                        {['Design', 'Marketing', 'Development', 'Sales', 'Customer Service', 'Engineering'].map((option) => (
                            <label key={option} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeFilters.categories.includes(option)}
                                    onChange={(e) => handleCheckboxChange('categories', option, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-400 focus:ring-blue-400"
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
