/**
 * @fileoverview Type definitions for Navbar components
 * Contains shared interfaces and types used across navbar components.
 *
 * @author Evos Launcher Team
 * @since 2.2.6
 */

import type { ReactElement } from 'react';

/**
 * Interface representing a language option for internationalization
 * @interface Language
 */
export interface Language {
  /** Native name of the language as displayed to users */
  nativeName: string;
  /** Country/region icon code for the language */
  icon: string;
}

/**
 * Interface representing a navigation page/menu item
 * @interface NavigationPage
 */
export interface NavigationPage {
  /** Display title of the navigation item */
  title: string;
  /** Route path or href for navigation */
  href: string;
  /** React icon component for the menu item */
  icon: ReactElement;
  /** Whether to show a divider before this item */
  devider?: boolean;
  /** Whether this is a special highlighted item */
  special?: boolean;
}

/**
 * Supported languages configuration with native names and country icons
 * Maps language codes to their display information
 */
export const SUPPORTED_LANGUAGES: { [key: string]: Language } = {
  en: { nativeName: 'English', icon: 'US' },
  nl: { nativeName: 'Nederlands', icon: 'NL' },
  fr: { nativeName: 'Français', icon: 'FR' },
  ru: { nativeName: 'Русский', icon: 'RU' },
  de: { nativeName: 'Deutsch', icon: 'DE' },
  es: { nativeName: 'Español', icon: 'ES' },
  it: { nativeName: 'Italiano', icon: 'IT' },
  br: { nativeName: 'Português', icon: 'BR' },
  zh: { nativeName: '中文', icon: 'CN' },
  tr: { nativeName: 'Türkçe', icon: 'TR' },
};
