import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
    value: string;
    height?: number;
    fontSize?: number;
    width?: number;
}

export function Barcode({ value, height = 50, fontSize = 13, width = 1.6 }: BarcodeProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || !value) return;
        try {
            JsBarcode(svg, value, {
                format: 'CODE128',
                height,
                fontSize,
                width,
                margin: 6,
                displayValue: true,
            });
            // JsBarcode vẽ theo kích thước pixel cố định — chuyển sang viewBox để SVG co giãn
            // vừa khung chứa (label tem) thay vì tràn ra ngoài đè lên các tem cạnh bên.
            const w = parseFloat(svg.getAttribute('width') ?? '');
            const h = parseFloat(svg.getAttribute('height') ?? '');
            if (w > 0 && h > 0) {
                svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                svg.removeAttribute('width');
            }
        } catch {
        }
    }, [value, height, fontSize, width]);

    return <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />;
}
