import { useState, useEffect } from 'react';
import { businessService } from './business.service';

/**
 * Returns a clean symbol for any given currency string (e.g. "PKR (Rs)" -> "Rs ", "USD ($)" -> "$").
 */
export const getCurrencySymbol = (currencyStr?: string | null): string => {
  if (!currencyStr) return '$';
  const str = String(currencyStr).trim();

  // 1. Handle explicit parentheses format e.g. "PKR (Rs)", "USD ($)", "EUR (€)"
  const parenMatch = str.match(/\((.*?)\)/);
  if (parenMatch && parenMatch[1]) {
    const symbol = parenMatch[1].trim();
    const upperSym = symbol.toUpperCase();
    if (upperSym === 'RS' || upperSym === 'PKR') {
      return 'Rs ';
    }
    return symbol;
  }

  // 2. Handle currency codes or symbols without parentheses
  const upper = str.toUpperCase();
  if (
    upper === 'PKR' ||
    upper === 'RS' ||
    upper === 'RS.' ||
    upper.includes('PKR') ||
    upper.includes('RUPEE')
  ) {
    return 'Rs ';
  }
  if (upper === 'EUR' || upper.includes('EUR') || str.includes('€')) {
    return '€';
  }
  if (upper === 'GBP' || upper.includes('GBP') || str.includes('£')) {
    return '£';
  }
  if (upper === 'INR' || upper.includes('INR') || str.includes('₹')) {
    return '₹ ';
  }
  if (
    upper === 'USD' ||
    upper === 'CAD' ||
    upper === 'AUD' ||
    upper.includes('USD') ||
    upper.includes('DOLLAR') ||
    str.includes('$')
  ) {
    return '$';
  }

  return str ? `${str} ` : '$';
};

/**
 * Retrieves the currently saved currency string from localStorage (shop_settings or user).
 */
export const getStoredCurrency = (): string => {
  try {
    const shop = localStorage.getItem('shop_settings');
    if (shop) {
      const parsed = JSON.parse(shop);
      if (parsed.currency) return parsed.currency;
    }

    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      if (parsed.business?.currency) return parsed.business.currency;
      if (parsed.currency) return parsed.currency;
    }
  } catch {
    // fallback
  }
  return 'USD ($)';
};

/**
 * Retrieves the currently saved currency symbol.
 */
export const getSavedCurrencySymbol = (): string => {
  return getCurrencySymbol(getStoredCurrency());
};

/**
 * Updates stored currency in localStorage and notifies all components via custom & storage events.
 */
export const setStoredCurrency = (currency: string): void => {
  try {
    const shop = localStorage.getItem('shop_settings');
    const parsedShop = shop ? JSON.parse(shop) : {};
    parsedShop.currency = currency;
    localStorage.setItem('shop_settings', JSON.stringify(parsedShop));

    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      if (parsedUser.business) {
        parsedUser.business.currency = currency;
      }
      parsedUser.currency = currency;
      localStorage.setItem('user', JSON.stringify(parsedUser));
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('currency-changed', { detail: currency }));
  } catch {
    // ignore
  }
};

/**
 * React hook that returns the active currency symbol and keeps it in sync across all components.
 */
export function useCurrency(): string {
  const [currencySymbol, setCurrencySymbol] = useState<string>(getSavedCurrencySymbol);

  useEffect(() => {
    const updateCurrency = () => {
      setCurrencySymbol(getSavedCurrencySymbol());
    };

    // Listen to local and cross-tab storage and currency events
    window.addEventListener('storage', updateCurrency);
    window.addEventListener('currency-changed', updateCurrency);

    // Fetch the latest business currency from backend once on mount to ensure fresh database data
    businessService
      .getCurrentBusiness()
      .then((live) => {
        if (live?.currency) {
          try {
            const currentShop = localStorage.getItem('shop_settings');
            const parsed = currentShop ? JSON.parse(currentShop) : {};
            if (parsed.currency !== live.currency) {
              parsed.currency = live.currency;
              localStorage.setItem('shop_settings', JSON.stringify(parsed));
            }

            const currentUser = localStorage.getItem('user');
            if (currentUser) {
              const parsedUser = JSON.parse(currentUser);
              if (parsedUser.business) {
                parsedUser.business.currency = live.currency;
              }
              parsedUser.currency = live.currency;
              localStorage.setItem('user', JSON.stringify(parsedUser));
            }
          } catch {
            // ignore
          }

          setCurrencySymbol(getCurrencySymbol(live.currency));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch latest business currency, using cached:', err);
      });

    return () => {
      window.removeEventListener('storage', updateCurrency);
      window.removeEventListener('currency-changed', updateCurrency);
    };
  }, []);

  return currencySymbol;
}
