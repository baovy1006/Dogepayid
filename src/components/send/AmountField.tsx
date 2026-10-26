import { sanitizeAmountInput } from '@/lib/amount';

interface Props {
    id: string;
    value: string;
    onChange: (v: string) => void;
    onMax?: () => void;
    label?: string;
}

/** Large DOGE amount input. Accepts decimals only; parsing to wei happens elsewhere. */
export const AmountField = ({ id, value, onChange, onMax, label = 'Amount' }: Props) => (
    <div className="w-full min-w-0 max-w-full">
        <label htmlFor={id} className="eyebrow">{label}</label>
        <div className="mt-2 flex w-full min-w-0 max-w-full items-center gap-3 rounded-lg border border-input bg-background/60 px-4 py-3 transition-colors focus-within:border-primary/60">
            <input id={id} inputMode="decimal" autoComplete="off" placeholder="0" value={value}
                onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
                className="tabular w-0 min-w-0 flex-1 bg-transparent font-display text-4xl outline-none placeholder:text-muted-foreground/40" />
            <span className="text-sm font-medium text-muted-foreground">DOGE</span>
            {onMax && (
                <button type="button" onClick={onMax} className="interactive rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-primary/40 hover:text-primary">
                    Max
                </button>
            )}
        </div>
    </div>
);
