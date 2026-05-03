/**
 * ManimCE Color Constants
 * Extracted from: https://github.com/ManimCommunity/manim/blob/main/manim/utils/color/manim_colors.py
 *
 * These are the exact hex values used by ManimCE for 3Blue1Brown style visualizations.
 */

// Grayscale
export const WHITE = "#FFFFFF";
export const GRAY_A = "#DDDDDD";
export const GREY_A = "#DDDDDD";
export const GRAY_B = "#BBBBBB";
export const GREY_B = "#BBBBBB";
export const GRAY_C = "#888888";
export const GREY_C = "#888888";
export const GRAY_D = "#444444";
export const GREY_D = "#444444";
export const GRAY_E = "#222222";
export const GREY_E = "#222222";
export const BLACK = "#000000";
export const LIGHTER_GRAY = "#DDDDDD";
export const LIGHTER_GREY = "#DDDDDD";
export const LIGHT_GRAY = "#BBBBBB";
export const LIGHT_GREY = "#BBBBBB";
export const GRAY = "#888888";
export const GREY = "#888888";
export const DARK_GRAY = "#444444";
export const DARK_GREY = "#444444";
export const DARKER_GRAY = "#222222";
export const DARKER_GREY = "#222222";

// Blue shades
export const BLUE_A = "#C7E9F1";
export const BLUE_B = "#9CDCEB";
export const BLUE_C = "#58C4DD";
export const BLUE_D = "#29ABCA";
export const BLUE_E = "#236B8E";
export const PURE_BLUE = "#0000FF";
export const BLUE = "#58C4DD";
export const DARK_BLUE = "#236B8E";

// Teal shades
export const TEAL_A = "#ACEAD7";
export const TEAL_B = "#76DDC0";
export const TEAL_C = "#5CD0B3";
export const TEAL_D = "#55C1A7";
export const TEAL_E = "#49A88F";
export const TEAL = "#5CD0B3";

// Green shades
export const GREEN_A = "#C9E2AE";
export const GREEN_B = "#A6CF8C";
export const GREEN_C = "#83C167";
export const GREEN_D = "#77B05D";
export const GREEN_E = "#699C52";
export const PURE_GREEN = "#00FF00";
export const GREEN = "#83C167";

// Yellow shades
export const YELLOW_A = "#FFF1B6";
export const YELLOW_B = "#FFEA94";
export const YELLOW_C = "#FFFF00";
export const YELLOW_D = "#F4D345";
export const YELLOW_E = "#E8C11C";
export const YELLOW = "#FFFF00";

// Gold shades
export const GOLD_A = "#F7C797";
export const GOLD_B = "#F9B775";
export const GOLD_C = "#F0AC5F";
export const GOLD_D = "#E1A158";
export const GOLD_E = "#C78D46";
export const GOLD = "#F0AC5F";

// Red shades
export const RED_A = "#F7A1A3";
export const RED_B = "#FF8080";
export const RED_C = "#FC6255";
export const RED_D = "#E65A4C";
export const RED_E = "#CF5044";
export const PURE_RED = "#FF0000";
export const RED = "#FC6255";

// Maroon shades
export const MAROON_A = "#ECABC1";
export const MAROON_B = "#EC92AB";
export const MAROON_C = "#C55F73";
export const MAROON_D = "#A24D61";
export const MAROON_E = "#94424F";
export const MAROON = "#C55F73";

// Purple shades
export const PURPLE_A = "#CAA3E8";
export const PURPLE_B = "#B189C6";
export const PURPLE_C = "#9A72AC";
export const PURPLE_D = "#715582";
export const PURPLE_E = "#644172";
export const PURPLE = "#9A72AC";

// Other colors
export const PINK = "#D147BD";
export const LIGHT_PINK = "#DC75CD";
export const ORANGE = "#FF862F";
export const LIGHT_BROWN = "#CD853F";
export const DARK_BROWN = "#8B4513";
export const GRAY_BROWN = "#736357";
export const GREY_BROWN = "#736357";

// Manim logo colors
export const LOGO_WHITE = "#ECE7E2";
export const LOGO_GREEN = "#87C2A5";
export const LOGO_BLUE = "#525893";
export const LOGO_RED = "#E07A5F";
export const LOGO_BLACK = "#343434";

// 3B1B specific colors (commonly used)
export const BACKGROUND_COLOR = "#0c1b33";
export const I_HAT_COLOR = GREEN;      // Green for î basis vector
export const J_HAT_COLOR = RED;        // Red for ĵ basis vector
export const K_HAT_COLOR = BLUE;       // Blue for k̂ basis vector (3D)
export const EIGEN_COLOR_1 = YELLOW;   // Yellow for first eigenvector
export const EIGEN_COLOR_2 = BLUE;     // Blue for second eigenvector
export const TEXT_COLOR = LOGO_WHITE;  // Cream color for text

/**
 * All colors as a single object for easy access
 */
export const Colors = {
  // Grayscale
  WHITE,
  GRAY_A, GREY_A,
  GRAY_B, GREY_B,
  GRAY_C, GREY_C,
  GRAY_D, GREY_D,
  GRAY_E, GREY_E,
  BLACK,
  LIGHTER_GRAY, LIGHTER_GREY,
  LIGHT_GRAY, LIGHT_GREY,
  GRAY, GREY,
  DARK_GRAY, DARK_GREY,
  DARKER_GRAY, DARKER_GREY,

  // Blue
  BLUE_A, BLUE_B, BLUE_C, BLUE_D, BLUE_E,
  PURE_BLUE, BLUE, DARK_BLUE,

  // Teal
  TEAL_A, TEAL_B, TEAL_C, TEAL_D, TEAL_E, TEAL,

  // Green
  GREEN_A, GREEN_B, GREEN_C, GREEN_D, GREEN_E,
  PURE_GREEN, GREEN,

  // Yellow
  YELLOW_A, YELLOW_B, YELLOW_C, YELLOW_D, YELLOW_E, YELLOW,

  // Gold
  GOLD_A, GOLD_B, GOLD_C, GOLD_D, GOLD_E, GOLD,

  // Red
  RED_A, RED_B, RED_C, RED_D, RED_E,
  PURE_RED, RED,

  // Maroon
  MAROON_A, MAROON_B, MAROON_C, MAROON_D, MAROON_E, MAROON,

  // Purple
  PURPLE_A, PURPLE_B, PURPLE_C, PURPLE_D, PURPLE_E, PURPLE,

  // Other
  PINK, LIGHT_PINK, ORANGE,
  LIGHT_BROWN, DARK_BROWN, GRAY_BROWN, GREY_BROWN,

  // Logo
  LOGO_WHITE, LOGO_GREEN, LOGO_BLUE, LOGO_RED, LOGO_BLACK,

  // 3B1B specific
  BACKGROUND_COLOR,
  I_HAT_COLOR,
  J_HAT_COLOR,
  K_HAT_COLOR,
  EIGEN_COLOR_1,
  EIGEN_COLOR_2,
  TEXT_COLOR,
} as const;

export type ColorName = keyof typeof Colors;
