// product.controller.js
import Product from "../models/product.model.js";
import { handleError } from "../utils/error.handler.js";
import { handleResponse } from "../utils/response.handler.js";

export const getAllProducts = async (req, res) => {
  const { limit = 10, page = 1, category, search } = req.query;
  try {
    let query = {};
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: "i" }; // Case-insensitive search

    const limitNum = Number(limit);
    const pageNum = Number(page);

    // Better performance: countDocuments(query) ensures only filtered products are counted.
    // Improves pagination accuracy when filtering by category or search.
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(query), // Counts only filtered products
    ]);

    // const products = await Product.find(query)
    //   .skip((pageNum - 1) * limitNum)
    //   .limit(limitNum);
    // const totalProducts = await Product.countDocuments();

    handleResponse(res, 200, "Products provided successfully!", {
      products,
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    // lean() will return the results as plain JavaScript objects
    // instead of mongoDB documents for good performence purposes
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    handleResponse(res, 200, "Featured products provided successfully!", {
      featuredProducts,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// To-Do: learn redis
// export const getFeaturedProducts = async (req, res) => {
//   try {
//     const cacheKey = "featuredProducts";
//     const cachedData = await cache.get(cacheKey);

//     if (cachedData) {
//       handleResponse(res, 200, "Featured products provided successfully (cached)!", { featuredProducts: JSON.parse(cachedData) });
//       return;
//     }

//     const featuredProducts = await Product.find({ isFeatured: true }).lean();
//     await cache.set(cacheKey, JSON.stringify(featuredProducts), { expire: 3600 }); // Cache for 1 hour

//     handleResponse(res, 200, "Featured products provided successfully!", { featuredProducts });
//   } catch (error) {
//     handleError(res, error);
//   }
// };

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    handleResponse(
      res,
      200,
      "Recommended products provided successfully!",
      products
    );
  } catch (error) {
    console.log(
      "Error occurred while getting recommended products: ",
      error
    );
    handleError(res, error);
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    handleResponse(
      res,
      200,
      "Products by category provided successfully!",
      products
    );
  } catch (error) {
    console.log("Error occurred while getting products by category: ", error);
    handleError(res, error);
  }
};

export const createProduct = async (req, res) => {
  // const { name, description, price, category, image } = req.body;
  // To-Do: Search for image upload provider instead of cloudinary.
  const productData = req.body;
  const newProduct = new Product(productData);
  try {
    const savedProduct = await newProduct.save();
    handleResponse(res, 201, "Product is created successfully!", {
      savedProduct,
    });
  } catch (error) {
    console.log("Error occurred while creating a new product: ", error);
    handleError(res, error);
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);

    if (!product) {
      const error = new Error("Product is not found!");
      error.status = 404;
      throw error;
    }

    product.isFeatured = !product.isFeatured;
    await product.save();
    // To-Do: create a function to update the cache with the updated products
    // updateFeaturedProductsCache()
    handleResponse(
      res,
      200,
      "Product feature updated successfully",
      product.toObject()
    );
  } catch (error) {
    console.log("Error occurred while updating the product feature: ", error);
    handleError(res, error);
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      const error = new Error("Product is not found!");
      error.status = 404;
      throw error;
    }

    handleResponse(res, 200, "Product is deleted successfully!", {
      deletedProduct,
    });
  } catch (error) {
    console.log("Error occurred while deleting a product: ", error);
    handleError(res, error);
  }
};
