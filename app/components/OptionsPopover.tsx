import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = 172;
const ROW_HEIGHT = 46;

export type PopoverOption = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  anchor: { x: number; y: number } | null;
  options: PopoverOption[];
  onClose: () => void;
};

export default function OptionsPopover({ visible, anchor, options, onClose }: Props) {
  if (!visible || !anchor) return null;

  const cardHeight = options.length * ROW_HEIGHT + (options.length - 1);

  // Position card to the left of tap, below by default
  let left = anchor.x - CARD_WIDTH + 20;
  let top = anchor.y + 12;

  // Clamp horizontal
  if (left < 12) left = 12;
  if (left + CARD_WIDTH > SCREEN_WIDTH - 12) left = SCREEN_WIDTH - 12 - CARD_WIDTH;

  // Flip above if too close to bottom
  if (top + cardHeight > SCREEN_HEIGHT - 80) {
    top = anchor.y - cardHeight - 12;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={[styles.card, { top, left }]}>
        {options.map((option, index) => (
          <React.Fragment key={option.label}>
            {index > 0 && <View style={styles.separator} />}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.55}
              onPress={() => {
                onClose();
                setTimeout(option.onPress, 150);
              }}
            >
              <Text style={[styles.label, option.destructive && styles.destructiveLabel]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  destructiveLabel: {
    color: '#EF4444',
  },
});
