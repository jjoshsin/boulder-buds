import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
  },
  photo: {
    borderRadius: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  galleryClose: {
    fontSize: 24,
    color: '#FFFFFF',
    width: 40,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  galleryPhoto: {
    height: (SCREEN_WIDTH - 48) / 2,
    borderRadius: 8,
  },
});

export { SCREEN_WIDTH };