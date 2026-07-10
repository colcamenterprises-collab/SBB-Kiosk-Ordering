import type { Category, MenuItem, ModifierGroup } from "../types";

export const categories: Category[] = [
  { id: "burgers", name: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80" },
  { id: "sets", name: "Sets", image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80" },
  { id: "sides", name: "Sides", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80" },
  { id: "drinks", name: "Drinks", image: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=600&q=80" }
];

export const modifierGroups: ModifierGroup[] = [
  {
    id: "burger-remove",
    name: "Remove ingredients",
    required: false,
    minSelect: 0,
    maxSelect: 5,
    modifiers: [
      { id: "no-pickles", name: "No pickles", priceDeltaThb: 0 },
      { id: "no-lettuce", name: "No lettuce", priceDeltaThb: 0 },
      { id: "no-tomato", name: "No tomato", priceDeltaThb: 0 },
      { id: "no-sauce", name: "No sauce", priceDeltaThb: 0 }
    ]
  },
  {
    id: "burger-addons",
    name: "Add extras",
    required: false,
    minSelect: 0,
    maxSelect: 6,
    modifiers: [
      { id: "extra-cheese", name: "Extra cheese", priceDeltaThb: 25 },
      { id: "extra-patty", name: "Extra smash patty", priceDeltaThb: 90 },
      { id: "bacon", name: "Bacon", priceDeltaThb: 45 },
      { id: "jalapenos", name: "Jalapeños", priceDeltaThb: 20 }
    ]
  },
  {
    id: "set-upgrade",
    name: "Set upgrade",
    required: false,
    minSelect: 0,
    maxSelect: 1,
    modifiers: [
      { id: "cajun-fries", name: "Cajun fries", priceDeltaThb: 20 },
      { id: "onion-rings", name: "Onion rings", priceDeltaThb: 35 },
      { id: "coke-zero", name: "Coke Zero", priceDeltaThb: 0 }
    ]
  }
];

export const menuItems: MenuItem[] = [
  {
    id: "single-smash",
    categoryId: "burgers",
    name: "Single Smash Burger",
    description: "One crispy smash patty, American cheese, pickles, tomato, iceberg lettuce and SBB sauce.",
    priceThb: 190,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=85",
    isAvailable: true,
    tags: ["Classic"],
    modifierGroupIds: ["burger-remove", "burger-addons"]
  },
  {
    id: "double-smash",
    categoryId: "burgers",
    name: "Double Smash Burger",
    description: "Two crispy smash patties, double American cheese, pickles, tomato, iceberg lettuce and SBB sauce.",
    priceThb: 270,
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=85",
    isAvailable: true,
    tags: ["Best seller"],
    modifierGroupIds: ["burger-remove", "burger-addons"]
  },
  {
    id: "triple-smash",
    categoryId: "burgers",
    name: "Triple Smash Burger",
    description: "Three crispy smash patties with American cheese, salad, pickles and SBB sauce.",
    priceThb: 350,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=85",
    isAvailable: true,
    tags: ["Big"],
    modifierGroupIds: ["burger-remove", "burger-addons"]
  },
  {
    id: "super-double-bacon",
    categoryId: "burgers",
    name: "Super Double Bacon & Cheese",
    description: "Two smash patties, three slices of American cheese and criss-cross bacon. No salad.",
    priceThb: 330,
    image: "https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?auto=format&fit=crop&w=800&q=85",
    isAvailable: true,
    tags: ["Signature"],
    modifierGroupIds: ["burger-addons"]
  },
  {
    id: "classic-set",
    categoryId: "sets",
    name: "Classic Set",
    description: "Burger, fries and drink. Fast, simple, complete.",
    priceThb: 270,
    image: "https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=800&q=85",
    isAvailable: true,
    tags: ["Set"],
    modifierGroupIds: ["set-upgrade"]
  },
  {
    id: "upgrade-set",
    categoryId: "sets",
    name: "Upgrade Set",
    description: "Double burger, upgraded side and drink.",
    priceThb: 390,
    image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=85",
    isAvailable: true,
    tags: ["Value"],
    modifierGroupIds: ["set-upgrade"]
  },
  {
    id: "fries",
    categoryId: "sides",
    name: "Fries",
    description: "Crispy 7mm fries, salted and served hot.",
    priceThb: 90,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=85",
    isAvailable: true
  },
  {
    id: "onion-rings",
    categoryId: "sides",
    name: "Onion Rings",
    description: "Golden onion rings with crunch.",
    priceThb: 120,
    image: "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=85",
    isAvailable: true
  },
  {
    id: "coke",
    categoryId: "drinks",
    name: "Coke",
    description: "Cold Coca-Cola.",
    priceThb: 45,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=85",
    isAvailable: true
  },
  {
    id: "coke-zero",
    categoryId: "drinks",
    name: "Coke Zero",
    description: "Cold Coke Zero.",
    priceThb: 45,
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=800&q=85",
    isAvailable: true
  },
  {
    id: "water",
    categoryId: "drinks",
    name: "Water",
    description: "Bottled water.",
    priceThb: 25,
    image: "https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=800&q=85",
    isAvailable: true
  }
];
