import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PageLimitProps {
    size: number;
    onPageSizeChange: (value: number) => void;
}

function PageLimit({ size, onPageSizeChange }: PageLimitProps) {
    const values = [20, 50, 100];

    return (
        <Select
            value={(size ?? 20).toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
        >
            <SelectTrigger className="w-[80px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {values.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                        {option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default PageLimit;
