import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters."],
      maxlength: [100, "Product name cannot axceed 100 characters."],
    },
    price: {
      type: Number,
      required: [true, "Product price is required."],
      default: 0,
      min: [0, "Positive price only"],
    },
    description: {
      type: String,
      required: [true, "Product description is requiered"],
      minlength: [10, "Description must be at least 10 characters."],
      maxlength: [1000, "Description cannot exceed 1000 characters."],
    },
    category: {
      type: String,
      required: [true, "Product category is required."],
      trim: true,
      minlength: [3, "Category must be at least 3 characters."],
    },
    image: {
      type: String,
      required: [true, "Product image is required."],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
