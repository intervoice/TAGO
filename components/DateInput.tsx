import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({ value, onChange, className, placeholder }) => {
    const [displayValue, setDisplayValue] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (value) {
            const [y, m, d] = value.split('-');
            if (y && m && d) {
                setDisplayValue(`${d}/${m}/${y}`);
            } else {
                setDisplayValue(value);
            }
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        if (!/^[\d/]*$/.test(input)) return;

        let formatted = input;
        if (input.length === 2 && !input.includes('/') && displayValue.length < 2) formatted += '/';
        if (input.length === 5 && input.split('/').length === 2 && displayValue.length < 5) formatted += '/';

        setDisplayValue(formatted);

        if (formatted.length === 10) {
            const [d, m, y] = formatted.split('/');
            if (!isNaN(Number(d)) && !isNaN(Number(m)) && !isNaN(Number(y))) {
                onChange(`${y}-${m}-${d}`);
            }
        } else if (formatted === '') {
            onChange('');
        }
    };

    const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className={`relative flex items-center ${className} p-0 overflow-hidden`}>
            <input
                type="text"
                className="w-full h-full bg-transparent p-4 outline-none"
                placeholder={placeholder || "dd/mm/yyyy"}
                value={displayValue}
                onChange={handleDisplayChange}
                maxLength={10}
            />
            <button
                tabIndex={-1}
                onClick={() => dateInputRef.current?.showPicker()}
                className="mr-4 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
                <Calendar className="w-5 h-5" />
            </button>
            <input
                type="date"
                ref={dateInputRef}
                className="absolute opacity-0 pointer-events-none w-0 h-0 bottom-0 right-0"
                value={value || ''}
                onChange={handleDateSelect}
                tabIndex={-1}
            />
        </div>
    );
};
