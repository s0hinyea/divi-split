import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { spacing } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';

interface ReceiptCardProps {
    children: React.ReactNode;
    style?: any;
    showTopZigzag?: boolean;
    showBottomZigzag?: boolean;
}

export default function ReceiptCard({
    children,
    style,
    showTopZigzag = true,
    showBottomZigzag = true
}: ReceiptCardProps) {
    const C = useThemeColors();
    const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
    const zigzagHeight = 10;
    const zigzagWidth = 16;

    const createZigzagPath = () => {
        const { width, height } = dimensions;
        const numZigzags = Math.floor(width / zigzagWidth);

        let path = '';

        // Top edge (zigzag or straight)
        if (showTopZigzag) {
            path = `M 0,${zigzagHeight}`;
            for (let i = 0; i < numZigzags; i++) {
                const x1 = i * zigzagWidth + zigzagWidth / 2;
                const x2 = (i + 1) * zigzagWidth;
                path += ` L ${x1},0 L ${x2},${zigzagHeight}`;
            }
            path += ` L ${width},${zigzagHeight}`;
        } else {
            path = `M 0,0 L ${width},0`;
        }

        // Right edge
        path += ` L ${width},${height}`;

        // Bottom edge (zigzag or straight)
        if (showBottomZigzag) {
            const bottomY = height;
            for (let i = numZigzags; i > 0; i--) {
                const x1 = i * zigzagWidth;
                const x2 = i * zigzagWidth - zigzagWidth / 2;
                path += ` L ${x1},${bottomY} L ${x2},${bottomY + zigzagHeight}`;
            }
            path += ` L 0,${bottomY}`;
        } else {
            path += ` L 0,${height}`;
        }

        // Left edge and close
        path += ' Z';
        return path;
    };

    const totalHeight = dimensions.height + (showTopZigzag ? zigzagHeight : 0) + (showBottomZigzag ? zigzagHeight : 0);

    return (
        <View style={[styles.wrapper, style]}>
            {/* Paper stack layers — furthest back to closest */}
            <View style={[styles.paperLayer, styles.paperLayer2, { backgroundColor: C.gray300 }]} />
            <View style={[styles.paperLayer, styles.paperLayer1, { backgroundColor: C.gray200 }]} />

            <View
                style={styles.container}
                onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    const contentHeight = height - (showTopZigzag ? zigzagHeight : 0) - (showBottomZigzag ? zigzagHeight : 0);
                    setDimensions({ width, height: contentHeight });
                }}
            >
                <Svg
                    width="100%"
                    height={totalHeight}
                    style={styles.svg}
                    viewBox={`0 0 ${dimensions.width} ${totalHeight}`}
                    preserveAspectRatio="none"
                >
                    <Path
                        d={createZigzagPath()}
                        fill={C.white}
                        stroke={C.gray400}
                        strokeWidth={1.5}
                    />
                </Svg>

                <View style={[
                    styles.content,
                    {
                        marginTop: showTopZigzag ? zigzagHeight : 0,
                        marginBottom: showBottomZigzag ? zigzagHeight : 0,
                    }
                ]}>
                    {children}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        paddingBottom: 9,
        flexDirection: 'column',
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 18,
        elevation: 6,
    },
    paperLayer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: 4,
    },
    paperLayer1: {
        bottom: -5,
        left: 5,
        right: 5,
        opacity: 0.7,
    },
    paperLayer2: {
        bottom: -9,
        left: 10,
        right: 10,
        opacity: 0.45,
    },
    container: {
        position: 'relative',
        flex: 1,
    },
    svg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    content: {
        padding: 12,
    },
});
