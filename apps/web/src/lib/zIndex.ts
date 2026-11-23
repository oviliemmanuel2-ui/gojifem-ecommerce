/**
 * Centralized UI layer hierarchy (z-index scale) across GOJIFEM.
 * Keep fixed notifications strictly above sticky headers, navigation drawers,
 * dropdowns, and confirmation modals, and strictly below the top route bar.
 */
export const Z_INDEX = {
  base: 0,
  stickyHeader: 30,
  dropdown: 40,
  modalBackdrop: 50,
  modal: 55,
  toast: 60,
  routeProgress: 70,
} as const;
