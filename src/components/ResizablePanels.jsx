import React, { useState, useEffect, useCallback, useRef } from 'react';

export function ResizablePanels({ left, center, right }) {
    const [leftWidth, setLeftWidth] = useState(260);
    const [rightWidth, setRightWidth] = useState(null); // null means it shares space equally with center
    const containerRef = useRef(null);
    const rightPanelRef = useRef(null);

    const startResizeLeft = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftWidth;

        const doDrag = (moveEvent) => {
            // Remove max width constraint
            setLeftWidth(Math.max(100, startWidth + moveEvent.clientX - startX));
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

        // If rightWidth is null (equal flex), get current pixel width from DOM first
        const currentWidth = rightWidth !== null ? rightWidth : (rightPanelRef.current ? rightPanelRef.current.offsetWidth : 400);
        const startWidth = currentWidth;

        const doDrag = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            // Remove max width constraint
            setRightWidth(Math.max(100, startWidth - delta));
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
                    <div style={{ width: leftWidth, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
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
                            width: rightWidth === null ? 'auto' : rightWidth,
                            flex: rightWidth === null ? 1 : 'none',
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
