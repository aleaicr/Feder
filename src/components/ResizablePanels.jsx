import React, { useState, useEffect, useCallback, useRef } from 'react';

export function ResizablePanels({ left, center, right }) {
    const [leftWidth, setLeftWidth] = useState(260);
    const [rightWidth, setRightWidth] = useState(window.innerWidth * 0.45);
    const containerRef = useRef(null);
    const rightPanelRef = useRef(null);

    const rightWidthRef = useRef(rightWidth);
    const leftWidthRef = useRef(leftWidth);

    useEffect(() => { rightWidthRef.current = rightWidth; }, [rightWidth]);
    useEffect(() => { leftWidthRef.current = leftWidth; }, [leftWidth]);

    const MIN_PANEL_WIDTH = 100;

    const startResizeLeft = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftWidth;
        const totalWidth = containerRef.current.offsetWidth;

        const doDrag = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            let newWidth = startWidth + delta;

            // Maximum width: Total - (Center min 100) - (Right width if present)
            const rw = right ? rightWidthRef.current : 0;
            const maxWidth = totalWidth - MIN_PANEL_WIDTH - (right ? rw : 0);

            newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxWidth));
            setLeftWidth(newWidth);
        };

        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'col-resize';
    };

    const startResizeRight = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = rightWidth;
        const totalWidth = containerRef.current.offsetWidth;

        const doDrag = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            let newWidth = startWidth - delta;

            // Maximum width: Total - (Center min 100) - (Left width if present)
            const lw = left ? leftWidthRef.current : 0;
            const maxWidth = totalWidth - MIN_PANEL_WIDTH - (left ? lw : 0);

            newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, maxWidth));
            setRightWidth(newWidth);
        };

        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'col-resize';
    };

    return (
        <div className="resizable-container" ref={containerRef} style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>

            {/* Left Panel */}
            {left && (
                <>
                    <div style={{ width: leftWidth, minWidth: 100, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        {left}
                    </div>
                    {/* Resizer 1 */}
                    <div
                        className="resizer vertical"
                        onMouseDown={startResizeLeft}
                    />
                </>
            )}

            {/* Center Panel - Always flex: 1 */}
            <div style={{ flex: 1, minWidth: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {center}
            </div>

            {/* Resizer 2 */}
            {right && (
                <>
                    <div
                        className="resizer vertical"
                        onMouseDown={startResizeRight}
                    />
                    {/* Right Panel */}
                    <div
                        ref={rightPanelRef}
                        style={{
                            width: rightWidth,
                            flex: 'none',
                            minWidth: 100,
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {right}
                    </div>
                </>
            )}
        </div>
    );
}
