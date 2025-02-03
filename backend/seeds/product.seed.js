import Product from "../models/product.model.js";

// Sample product data
const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    price: 59.99,
    description:
      "High-quality wireless headphones with noise-canceling features.",
    category: "Electronics",
    image: "https://example.com/images/headphones.jpg",
    isFeatured: true,
  },
  {
    name: "Stainless Steel Water Bottle",
    price: 19.99,
    description: "Eco-friendly reusable water bottle with a 1-liter capacity.",
    category: "Home & Kitchen",
    image: "https://example.com/images/water-bottle.jpg",
    isFeatured: false,
  },
  {
    name: "Gaming Keyboard with RGB Backlight",
    price: 49.99,
    description: "Mechanical gaming keyboard with customizable RGB lighting.",
    category: "Gaming",
    image: "https://example.com/images/gaming-keyboard.jpg",
    isFeatured: true,
  },
  {
    name: "Running Shoes for Men",
    price: 89.99,
    description:
      "Comfortable and lightweight running shoes for daily training.",
    category: "Sportswear",
    image: "https://example.com/images/running-shoes.jpg",
    isFeatured: false,
  },
  {
    name: "Ceramic Coffee Mug",
    price: 12.99,
    description: "Durable ceramic coffee mug with a stylish design.",
    category: "Home & Kitchen",
    image: "https://example.com/images/coffee-mug.jpg",
    isFeatured: false,
  },
];

// Seed function to add sample products
export const seedProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log("Existing products deleted.");

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log("Sample products added successfully.");
  } catch (error) {
    console.error("Error seeding products:", error);
  }
};
