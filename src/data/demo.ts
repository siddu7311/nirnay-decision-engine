// ============================================================
// NIRNAY — Demo Data
// "Food Delivery Decision" demo scenario
// ============================================================

import type { DecisionInput } from '../types/decision';

export const DEMO_DECISION_NAME = 'Food Delivery Decision';

export const DEMO_INPUT: DecisionInput = {
  alternatives: [
    { id: 'alt-a', name: 'Option A', description: 'Budget-friendly local restaurant with decent reviews' },
    { id: 'alt-b', name: 'Option B', description: 'Premium restaurant with fast delivery and top ratings' },
    { id: 'alt-c', name: 'Option C', description: 'Cheap option but slow delivery time' },
  ],
  criteria: [
    { id: 'crit-price', name: 'Price', description: 'Total cost of the meal', unit: '₹', direction: 'lower_is_better' },
    { id: 'crit-time',  name: 'Delivery Time', description: 'Time to deliver the order', unit: 'min', direction: 'lower_is_better' },
    { id: 'crit-rating', name: 'Rating', description: 'Customer satisfaction rating', unit: '/5', direction: 'higher_is_better' },
  ],
  weights: [
    { criterionId: 'crit-price',  weight: 50 },
    { criterionId: 'crit-time',   weight: 30 },
    { criterionId: 'crit-rating', weight: 20 },
  ],
  constraints: [
    { id: 'con-1', criterionId: 'crit-time', operator: '<=', value: 40 },
  ],
  values: {
    'alt-a': { 'crit-price': 100, 'crit-time': 30, 'crit-rating': 4.2 },
    'alt-b': { 'crit-price': 150, 'crit-time': 20, 'crit-rating': 4.8 },
    'alt-c': { 'crit-price': 80,  'crit-time': 45, 'crit-rating': 4.0 },
  },
};
