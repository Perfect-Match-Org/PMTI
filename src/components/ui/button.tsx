import React from "react";

interface ButtonProps {
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    px?: number;
    py?: number;
    mt?: number;
    border?: number;
    shadowWidth?: number;
    bold?: boolean;
    variant?: "default" | "ghost";
    className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { children = '', onClick,
            px = 6, py = 2, mt = 6,
            border = 4, shadowWidth = 6,
            bold = true,
            variant = "default",
            className = '' },
        ref
    ) => {
        const baseClasses =
            variant === "ghost"
                ? `
                bg-transparent
                text-inherit
                border-none
                shadow-none
                p-0
                m-0
                `
                : `
                mt-${mt}
                px-${px}
                py-${py}
                rounded-full
                bg-white
                text-primary
                border-4
                border-foreground
                ${bold ? 'font-bold' : 'font-medium'}
                flex flex-row items-center justify-center gap-2
                shadow-[6px_6px_0px_0px_rgba(36,67,141,1)]
                transition-all
                hover:translate-x-[4px]
                hover:translate-y-[4px]
                hover:shadow-[2px_2px_0px_0px_rgba(36,67,141,1)]
                active:translate-x-[6px]
                active:translate-y-[6px] 
                active:shadow-none 
                `;
        return (
            <button
                ref={ref}
                onClick={onClick}
                className={`
                    ${baseClasses}
                    ${className}
                `}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
export default Button;
