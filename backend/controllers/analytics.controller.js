import Order from "../models/Order.model.js";
import Product from "../models/product.model.js";
import User from "../models/User.model.js";
import { handleError } from "../utils/error.handler.js";
import { handleResponse } from "../utils/response.handler.js";

export const getAnalytics = async (req, res) => {
  try {
    const analyticsData = await aggregateAnalyticsData();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const dailySalesData = await getDailySalesData(startDate, endDate);

    handleResponse(res, 200, "Analytics data retrieved successfully!", {
      analyticsData,
      dailySalesData,
    });
  } catch (error) {
    console.log("Error getting the analytics", error);
    handleError(res, error);
  }
};

const aggregateAnalyticsData = async () => {
  try {
    const [usersCount, productsCount] = await Promise.all([
      User.aggregate([{ $count: "totalUsers" }]),
      Product.aggregate([{ $count: "totalProducts" }]),
    ]);
    // console.log(usersCount, productsCount); // [ { totalUsers: 2 } ] [ { totalProducts: 8 } ]

    const totalUsers = usersCount.length > 0 ? usersCount[0].totalUsers : 0;
    const totalProducts =
      productsCount.length > 0 ? productsCount[0].totalProducts : 0;

    const salesData = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    return { totalUsers, totalProducts, salesData };
  } catch (error) {
    console.log("Error getting analytics data...");
    throw error;
  }
};

// Gets the daily sales of a spacific period of time
const getDailySalesData = async (startDate, endDate) => {
  try {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dateRange = generateDateRange(startDate, endDate);

    return dateRange.map((date) => {
      const foundItem = dailySalesData.find((item) => item._id === date);

      return {
        date,
        sales: foundItem?.sales || 0,
        revenue: foundItem?.revenue || 0,
      };
    });
  } catch (error) {
    console.log("Error getting daily sales data...");
    throw error;
  }
};

const generateDateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().slice(0, 10));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};
