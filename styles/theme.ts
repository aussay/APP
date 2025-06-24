// Puzzleverse Theme

export const Colors = {
  // Base colors
  primary: '#1fb6ff', // Electric Blue (accent)
  secondary: '#222f3e', // Deep blue-gray for secondary elements
  accent: '#1fb6ff', // Use electric blue for all accents

  background: '#101217', // Nearly black background
  surface: '#181a20', // Dark gray for cards/containers

  textPrimary: '#e5eaf5', // Light gray for main text
  textSecondary: '#7b7f8a', // Muted gray for secondary text
  textLight: '#ffffff', // For text on blue/active backgrounds

  success: '#2ecc71', // Green (can be used for correct answers)
  error: '#e74c3c', // Red (for errors)
  warning: '#f39c12', // Orange (for warnings)

  disabled: '#3a3d45', // Dark gray for disabled elements
  border: '#23242a', // Subtle border color

  // Game Specific (updated for dark theme)
  puzzleGridCell: '#23242a',
  puzzleGridBlackCell: '#181a20',
  wordWiseCorrect: '#1fb6ff', // Use blue for correct
  wordWisePresent: '#3a8dde', // Lighter blue for present
  wordWiseAbsent: '#3a3d45', // Dark gray for absent
  letterLogicCenter: '#1fb6ff',
  letterLogicPetal: '#23242a',
};

export const FontSizes = {
  xs: 11,
  small: 13,
  medium: 15,
  large: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  title: 32,
  header: 24,
  subHeader: 18,
};

export const Spacing = {
  xs: 4,
  small: 8,
  medium: 14,
  large: 20,
  xl: 32,
  xxl: 40,
};

export const BorderRadius = {
  small: 6,
  medium: 12,
  large: 18,
  round: 50,
};

// Common component styles (can be expanded)
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.large,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.large,
  },
  titleText: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.large,
  },
  headerText: {
    fontSize: FontSizes.header,
    fontWeight: '600', // Semi-bold
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  subHeaderText: {
    fontSize: FontSizes.subHeader,
    fontWeight: '500', // Medium weight
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  // Add more common styles like buttons, cards, inputs as needed
};

export default {
  Colors,
  FontSizes,
  Spacing,
  BorderRadius,
  commonStyles,
};
