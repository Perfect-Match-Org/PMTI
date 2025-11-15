interface PersonalityBarProps {
    leftLabel: string;
    rightLabel: string;
    leftPercentage: number;
    leftColor: 'blue' | 'pink';
    rightColor: 'blue' | 'pink';
    backgroundColor: 'blue' | 'pink';
}

export function PersonalityBar({
    leftLabel,
    rightLabel,
    leftPercentage,
    leftColor,
    rightColor,
    backgroundColor
}: PersonalityBarProps) {
    const rightPercentage = 100 - leftPercentage;

    // Color mappings
    const colorMap = {
        blue: {
            text: 'text-blue-900',
            bg: 'bg-blue-900',
            textNoWeight: 'text-blue-900'
        },
        pink: {
            text: 'text-pink-500',
            bg: 'bg-pink-100',
            textNoWeight: 'text-pink-500'
        }
    };

    const bgColorMap = {
        blue: 'bg-blue-100',
        pink: 'bg-pink-100'
    };

    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className={`text-base font-semibold ${colorMap[leftColor].text}`}>
                    {leftLabel}
                </span>
                <span className={`text-base font-semibold ${colorMap[rightColor].text}`}>
                    {rightLabel}
                </span>
            </div>
            <div
                className={`relative h-10 ${bgColorMap[backgroundColor]} rounded-full overflow-hidden`}
                style={{ boxShadow: '3px 3px 0px rgb(241, 168, 176)' }}
            >
                {/* Left side */}
                <div
                    className={`absolute left-0 top-0 h-full ${colorMap[leftColor].bg} flex items-center justify-start px-3`}
                    style={{ width: `${leftPercentage}%` }}
                >
                    <span className={`${leftColor === 'blue' ? 'text-white' : colorMap[leftColor].textNoWeight} font-bold text-base`}>
                        {leftPercentage}%
                    </span>
                </div>
                {/* Right side */}
                <div
                    className={`absolute right-0 top-0 h-full ${rightColor === 'blue' ? 'bg-blue-900' : ''} flex items-center justify-end px-3`}
                    style={{ width: `${rightPercentage}%` }}
                >
                    <span className={`${rightColor === 'blue' ? 'text-white' : colorMap[rightColor].textNoWeight} font-bold text-base`}>
                        {rightPercentage}%
                    </span>
                </div>
            </div>
        </div>
    );
}
