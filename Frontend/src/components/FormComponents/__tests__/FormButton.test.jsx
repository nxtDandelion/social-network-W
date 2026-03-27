import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormButton from '../FormButton';

describe('FormButton', () => {
    it('рендерит кнопку с правильным текстом', () => {
        render(<FormButton text="Войти" status={true} />);

        const button = screen.getByRole('button', { name: /войти/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('Войти');
    });

    it('имеет класс bg-[#202020] при status=true', () => {
        render(<FormButton text="Войти" status={true} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-[#202020]');
        expect(button).toHaveAttribute('type', 'submit');
    });

    it('имеет класс bg-gray-500 при status=false', () => {
        render(<FormButton text="Войти" status={false} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-gray-500');
        expect(button).toHaveAttribute('type', 'button');
    });

    it('имеет класс bg-emerald-900 при enterStatus=true', () => {
        render(<FormButton text="Войти" status={true} enterStatus={true} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-emerald-900');
    });
});