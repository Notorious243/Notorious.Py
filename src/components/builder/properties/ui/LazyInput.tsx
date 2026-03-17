import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface LazyInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
    value: number | string;
    onValueChange: (val: string) => void;
}

export const LazyInput: React.FC<LazyInputProps> = ({ value, onValueChange, className, ...props }) => {
    const [localValue, setLocalValue] = useState<string>(value?.toString() ?? '');

    useEffect(() => {
        setLocalValue(value?.toString() ?? '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        onValueChange(localValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onValueChange(localValue);
            e.currentTarget.blur();
        }
    };

    return (
        <Input
            {...props}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
        />
    );
};
