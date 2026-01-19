import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  boulderIcon: {
    gap: 5,
    alignItems: 'center',
  },
  layer: {
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#6B7280',
  },
  actionSection: {
    gap: 20,
  },
  getStartedButton: {
    height: 56,
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  loginLink: {
    color: '#FF8C00',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});