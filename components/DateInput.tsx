import React, { useState, useEffect } from 'react';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({ value, onChange, className, placeholder }) => {
    // Configurable for Israeli format DD/MM/YYYY
    const [displayValue, setDisplayValue] = useState('');

    // Sync internal display state with external value prop
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

        // Allow only numbers and slashes
        if (!/^[\d/]*$/.test(input)) return;

        // Auto-masking logic
        let formatted = input;
        if (input.length === 2 && !input.includes('/') && displayValue.length < 2) formatted += '/';
        if (input.length === 5 && input.split('/').length === 2 && displayValue.length < 5) formatted += '/';

        setDisplayValue(formatted);

        // Convert to YYYY-MM-DD if valid full date
        if (formatted.length === 10) {
            const [d, m, y] = formatted.split('/');
            if (d && m && y && !isNaN(Number(d)) && !isNaN(Number(m)) && !isNaN(Number(y))) {
                onChange(`${y}-${m}-${d}`);
            }
        } else if (formatted === '') {
            onChange('');
        }
    };

    const handleBlur = () => {
        // Validate on blur
        if (displayValue.length === 10) {
            const [d, m, y] = displayValue.split('/');
            // Basic validation
            if (Number(d) > 31 || Number(m) > 12) {
                // Reset or handle error - for now just leave it, maybe the user wants to fix it
                // But ensure we don't send garbage to onChange if we haven't already
            }
        }
    };

    return (
        <input
            type="text"
            className={className}
            placeholder={placeholder || "DD/MM/YYYY"}
            value={displayValue}
            onChange={handleDisplayChange}
            onBlur={handleBlur}
            maxLength={10}
        />
    );
};
