import re

path = r'C:\Users\Pablo\.gemini\antigravity\scratch\mia\src\data\spanishFoodDatabase.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace invalid categories
text = text.replace("'dairy_eggs'", "'dairy'")
text = text.replace("'fruits_veggies'", "'vegetables_fruits'")
text = text.replace("'nuts_fats'", "'fats_oils'")
text = text.replace("'prepared'", "'other'")

# Prepend or append MEAL_TYPE_CONFIG
meal_config_code = """
import { MealType } from '../types/workout';

export interface MealTypeConfig {
  type: MealType;
  label: string;
  defaultTime: string;
}

export const MEAL_TYPE_CONFIG: MealTypeConfig[] = [
  { type: 'breakfast', label: 'Desayuno', defaultTime: '08:30' },
  { type: 'mid_morning', label: 'Media Mañana / Almuerzo', defaultTime: '11:30' },
  { type: 'lunch', label: 'Comida Principal', defaultTime: '14:30' },
  { type: 'snack', label: 'Merienda / Pre-Entreno', defaultTime: '18:00' },
  { type: 'dinner', label: 'Cena', defaultTime: '21:30' }
];
"""

text = text + "\n" + meal_config_code

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated spanishFoodDatabase.ts with proper categories and MEAL_TYPE_CONFIG!')
